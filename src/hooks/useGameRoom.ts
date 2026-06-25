// src/hooks/useGameRoom.ts
// Hook das salas multiplayer.
//
// Compõe useChatConnection (genérico) + persistência de identidade (chat-utils)
// e gerencia: estado da sala, estado do jogo, chat, papel de host e migração.
//
// Modelo de autoridade:
//  - O servidor é autoridade sobre membros/host/modo/seed/roundId.
//  - O HOST roda o engine localmente; a cada tentativa aceita o componente de
//    tela chama setGameState + broadcastState. Espectadores recebem o estado
//    via mensagens 'game-state' e renderizam somente leitura.
//  - Ao ser promovido a host, o cliente re-injeta as soluções derivadas de
//    (mode, seed) via getDailyWords e continua jogando.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameMode, GameState } from '@/game/types'
import { createInitialGameState, getDailyWords } from '@/game/engine'
import { ChatMessage } from '@/game/chat-types'
import {
  RoomServerMessage,
  RoomState,
  JoinIntent,
  RoomGameType,
  MatchStatus,
  CompetitorResult,
  RoundTimerInfo,
  RoundTiming,
} from '@/game/room-types'
import { ROOM_CONFIG, buildRoomUrl } from '@/lib/room-config'
import { generateUserId, loadUserId, saveUserId } from '@/lib/chat-utils'
import { useChatConnection } from './useChatConnection'

interface UseGameRoomOptions {
  code: string
  nickname: string | null
  intent: JoinIntent
  /** Modo escolhido ao criar a sala (intent === 'create'). */
  createMode?: GameMode
  /** Tipo de sala escolhido ao criar (intent === 'create'). */
  createGameType?: RoomGameType
  /** Só conecta quando true (ex.: depois que o nickname foi informado). */
  autoConnect?: boolean
}

export interface UseGameRoomReturn {
  // Conexão
  connected: boolean
  isConnecting: boolean
  latency: number | null

  // Identidade / sala
  userId: string
  room: RoomState | null
  isHost: boolean
  hostNickname: string | null
  roundId: string | null
  error: string | null

  // Competição
  gameType: RoomGameType
  matchStatus: MatchStatus
  standings: CompetitorResult[]

  /** Cronômetro da rodada, sincronizado pelo servidor e ancorado no relógio local. */
  roundTiming: RoundTiming

  // Jogo
  gameState: GameState | null
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
  /** Índice pulsante para feedback de digitação ao vivo (visão do espectador). */
  liveTypedIndex: number

  // Chat
  messages: ChatMessage[]
  unreadCount: number
  markAsRead: () => void

  // Ações
  broadcastState: (state: GameState) => void
  broadcastLiveInput: (currentGuess: string[], typedIndex: number) => void
  sendChat: (text: string) => boolean
  requestNewRound: (mode?: GameMode) => void
  /** Competição/Time Trial: anfitrião inicia uma partida (timeLimitMs só no Time Trial). */
  startMatch: (mode?: GameMode, timeLimitMs?: number) => void
  /** Competição: reporta o fim do jogo local (acertou/esgotou). */
  reportFinished: (solved: boolean, attempts: number) => void

  // Promoção a host
  justBecameHost: boolean
  clearJustBecameHost: () => void
}

const EMPTY_TIMING: RoundTiming = { roundId: null, startLocal: null, durationMs: null, limitMs: null }

/**
 * Reduz o bloco `timer` do servidor para o cronômetro ancorado no relógio LOCAL.
 *
 * - Ancora o início UMA vez por rodada (startLocal = now - elapsedMs); mensagens
 *   subsequentes da mesma rodada não re-ancoram, evitando "tremor" por jitter.
 * - Quando há `durationMs`, congela no valor final (idêntico para todos).
 * - Sem `elapsedMs` (rodada ainda não iniciada, ex.: coop antes do host digitar),
 *   mantém zerado para a rodada atual.
 */
function deriveTiming(
  prev: RoundTiming,
  rid: string,
  timer: RoundTimerInfo | undefined,
  now: number
): RoundTiming {
  // Ignora mensagens sem cronômetro ou com roundId indefinido (não ancora em '').
  if (!timer || !rid) return prev
  const isNewRound = prev.roundId !== rid
  // Limite de tempo (Time Trial). Constante na rodada; vem em toda mensagem.
  const limitMs = typeof timer.limitMs === 'number' ? timer.limitMs : null

  // Rodada terminada → congela na duração final (idêntica para todos).
  if (typeof timer.durationMs === 'number') {
    // Finalização de OUTRA rodada enquanto já há uma rodada EM ANDAMENTO
    // ancorada → mensagem atrasada de rodada antiga; ignora para não congelar
    // a rodada atual. (Late-join a uma rodada já encerrada cai fora deste guard
    // porque ali não há âncora em andamento: prev.startLocal é null.)
    if (isNewRound && prev.startLocal != null && prev.durationMs == null) return prev
    // Anchor-once: se já há âncora desta rodada, preserva-a (evita salto no
    // congelamento por jitter de rede). Caso contrário deriva uma — sempre
    // garantindo startLocal != null para exibir o tempo final (nunca 0:00).
    const startLocal =
      !isNewRound && prev.startLocal != null
        ? prev.startLocal
        : typeof timer.elapsedMs === 'number'
          ? now - timer.elapsedMs
          : now - timer.durationMs
    return { roundId: rid, startLocal, durationMs: timer.durationMs, limitMs }
  }

  // Rodada em andamento com início conhecido.
  if (typeof timer.elapsedMs === 'number') {
    if (isNewRound || prev.startLocal == null) {
      return { roundId: rid, startLocal: now - timer.elapsedMs, durationMs: null, limitMs }
    }
    // Já ancorado nesta rodada → preserva o início (evita tremor por jitter).
    return { roundId: rid, startLocal: prev.startLocal, durationMs: null, limitMs }
  }

  // Rodada ainda não começou (elapsedMs nulo).
  if (isNewRound) return { roundId: rid, startLocal: null, durationMs: null, limitMs }
  return prev
}

function stripSolutions(state: GameState): GameState {
  return { ...state, boards: state.boards.map((b) => ({ ...b, solution: '' })) }
}

function withSolutions(state: GameState, mode: GameMode, seed: number): GameState {
  const sols = getDailyWords(mode, seed)
  return {
    ...state,
    boards: state.boards.map((b, i) => ({ ...b, solution: sols[i] ?? '' })),
  }
}

function buildInitialState(
  mode: GameMode,
  seed: number,
  code: string,
  roundId: string,
  asHost: boolean
): GameState {
  const dateKey = `room-${code}-${roundId}`
  const state = createInitialGameState(mode, seed, dateKey)
  // createInitialGameState já preenche as soluções (via getDailyWords).
  return asHost ? state : stripSolutions(state)
}

const MODE_NAMES: Record<GameMode, string> = {
  termo: 'Termo',
  dueto: 'Dueto',
  quarteto: 'Quarteto',
}

/** Emoji de medalha para a posição entre os que acertaram (1=ouro). */
function medalFor(solveRank: number | null): string {
  if (solveRank === 1) return '🥇'
  if (solveRank === 2) return '🥈'
  if (solveRank === 3) return '🥉'
  return ''
}

export function useGameRoom({
  code,
  nickname,
  intent,
  createMode,
  createGameType = 'coop',
  autoConnect = false,
}: UseGameRoomOptions): UseGameRoomReturn {
  const userId = useMemo(() => {
    const existing = loadUserId()
    if (existing) return existing
    const fresh = generateUserId()
    saveUserId(fresh)
    return fresh
  }, [])

  const [room, setRoom] = useState<RoomState | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [roundId, setRoundId] = useState<string | null>(null)
  const [liveTypedIndex, setLiveTypedIndex] = useState(-1)
  const [justBecameHost, setJustBecameHost] = useState(false)
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle')
  const [standings, setStandings] = useState<CompetitorResult[]>([])
  const [roundTiming, setRoundTiming] = useState<RoundTiming>(EMPTY_TIMING)

  // Refs espelham o estado para o handler de mensagens ser estável.
  // Sincronizados em um efeito — não escrevemos ref.current durante o render.
  const roomRef = useRef<RoomState | null>(room)
  const gameStateRef = useRef<GameState | null>(gameState)
  const nicknameRef = useRef(nickname)
  const intentRef = useRef(intent)
  const createModeRef = useRef(createMode)
  const createGameTypeRef = useRef(createGameType)
  const hasJoinedRef = useRef(false)
  const sendRef = useRef<(data: unknown) => boolean>(() => false)
  const liveTypedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHost = !!room && room.hostUserId === userId
  const gameType: RoomGameType = room?.gameType ?? 'coop'
  const hostNickname = useMemo(() => {
    if (!room) return null
    return room.members.find((m) => m.userId === room.hostUserId)?.nickname ?? null
  }, [room])

  const pushMessage = useCallback((msg: ChatMessage, countUnread: boolean) => {
    setMessages((prev) => {
      const next = [...prev, msg]
      if (next.length > ROOM_CONFIG.MAX_CHAT_MESSAGES) next.shift()
      return next
    })
    if (countUnread) setUnreadCount((u) => u + 1)
  }, [])

  const addSystem = useCallback(
    (text: string) => {
      pushMessage({ type: 'system', text, timestamp: new Date().toISOString() }, false)
    },
    [pushMessage]
  )

  const handleMessage = useCallback(
    (raw: unknown) => {
      const msg = raw as RoomServerMessage
      // Instante do recebimento (relógio local) usado para ancorar o cronômetro.
      const receiveNow = Date.now()
      const applyTiming = (rid: string) =>
        setRoundTiming((prev) => deriveTiming(prev, rid, msg.timer, receiveNow))

      switch (msg.type) {
        case 'request-auth': {
          const firstJoin = !hasJoinedRef.current
          const creating = firstJoin && intentRef.current === 'create'
          sendRef.current({
            type: 'join',
            userId,
            nickname: nicknameRef.current,
            intent: firstJoin ? intentRef.current : ('join' as JoinIntent),
            ...(creating && createModeRef.current ? { mode: createModeRef.current } : {}),
            ...(creating ? { gameType: createGameTypeRef.current } : {}),
          })
          break
        }

        case 'room-state': {
          hasJoinedRef.current = true
          setError(null)
          const gt: RoomGameType =
            msg.gameType === 'competition'
              ? 'competition'
              : msg.gameType === 'timetrial'
                ? 'timetrial'
                : 'coop'
          const newRoom: RoomState = {
            code: msg.code ?? code,
            hostUserId: msg.hostUserId ?? '',
            mode: (msg.mode ?? 'termo') as GameMode,
            seed: Number(msg.seed ?? 0),
            roundId: msg.roundId ?? '',
            members: msg.members ?? [],
            memberCount: msg.memberCount ?? (msg.members ? msg.members.length : 0),
            gameType: gt,
          }
          setRoom(newRoom)
          setRoundId(newRoom.roundId)
          setMatchStatus(msg.matchStatus ?? 'idle')
          setStandings(msg.standings ?? [])
          applyTiming(newRoom.roundId)
          // Competição/Time Trial: todos jogam o próprio tabuleiro (com soluções).
          // Coop: o host tem soluções; espectadores recebem stripado.
          const competitive = gt === 'competition' || gt === 'timetrial'
          const asHost = newRoom.hostUserId === userId
          setGameState(
            buildInitialState(
              newRoom.mode,
              newRoom.seed,
              newRoom.code,
              newRoom.roundId,
              competitive ? true : asHost
            )
          )
          break
        }

        case 'game-state': {
          if (!msg.gameState) break
          const r = roomRef.current
          // Competição e Time Trial não usam o tabuleiro compartilhado.
          if (r && (r.gameType === 'competition' || r.gameType === 'timetrial')) break
          applyTiming(msg.roundId ?? r?.roundId ?? '')
          const asHost = !!r && r.hostUserId === userId
          // Espectador renderiza como recebido; host (reconexão) re-injeta soluções.
          const incoming = asHost && r ? withSolutions(msg.gameState, r.mode, r.seed) : msg.gameState
          setGameState(incoming)
          break
        }

        case 'match-start': {
          const mode = (msg.mode ?? 'termo') as GameMode
          const seed = Number(msg.seed ?? 0)
          const rid = msg.roundId ?? ''
          setRoundId(rid)
          setRoom((prev) => (prev ? { ...prev, mode, seed, roundId: rid } : prev))
          setMatchStatus('active')
          setStandings([])
          applyTiming(rid)
          const r = roomRef.current
          const roomCode = r?.code ?? code
          // Todos jogam: tabuleiro próprio COM soluções (asHost = true).
          setGameState(buildInitialState(mode, seed, roomCode, rid, true))
          addSystem(
            r?.gameType === 'timetrial'
              ? 'Corrida contra o tempo! ⏱️ Boa sorte!'
              : 'A partida começou! Boa sorte! 🏁'
          )
          break
        }

        case 'competitor-finished': {
          if (msg.standings) setStandings(msg.standings)
          applyTiming(msg.roundId ?? roomRef.current?.roundId ?? '')
          if (msg.userId && msg.userId !== userId && msg.nickname) {
            addSystem(
              msg.solved
                ? `${msg.nickname} resolveu! ${medalFor(msg.solveRank ?? null)}`.trim()
                : `${msg.nickname} não conseguiu desta vez`
            )
          }
          break
        }

        case 'match-end': {
          if (msg.standings) setStandings(msg.standings)
          setMatchStatus('ended')
          applyTiming(msg.roundId ?? roomRef.current?.roundId ?? '')
          addSystem('Partida encerrada! A palavra foi revelada. 🎉')
          break
        }

        case 'live-input': {
          // Digitação ao vivo do host (somente coop). O servidor não reenvia ao próprio host.
          const r = roomRef.current
          if (r && (r.gameType === 'competition' || r.gameType === 'timetrial')) break
          if (r && r.hostUserId === userId) break
          if (msg.currentGuess) {
            const cg = msg.currentGuess
            setGameState((prev) => (prev ? { ...prev, currentGuess: cg } : prev))
          }
          if (typeof msg.typedIndex === 'number' && msg.typedIndex >= 0) {
            setLiveTypedIndex(msg.typedIndex)
            if (liveTypedTimerRef.current) clearTimeout(liveTypedTimerRef.current)
            liveTypedTimerRef.current = setTimeout(() => setLiveTypedIndex(-1), 220)
          }
          break
        }

        case 'new-round': {
          const mode = (msg.mode ?? 'termo') as GameMode
          const seed = Number(msg.seed ?? 0)
          const rid = msg.roundId ?? ''
          setRoundId(rid)
          setRoom((prev) => (prev ? { ...prev, mode, seed, roundId: rid } : prev))
          applyTiming(rid)
          // Nova rodada zera qualquer estado de competição encerrada (defensivo).
          setMatchStatus('idle')
          setStandings([])
          const r = roomRef.current
          const asHost = !!r && r.hostUserId === userId
          const roomCode = r?.code ?? code
          setGameState(buildInitialState(mode, seed, roomCode, rid, asHost))
          addSystem(
            msg.modeChanged
              ? `Novo modo: ${MODE_NAMES[mode]} — nova palavra!`
              : 'Nova palavra iniciada!'
          )
          break
        }

        case 'round-timing': {
          // Sincronização dedicada do cronômetro (início/fim no coop).
          applyTiming(msg.roundId ?? roomRef.current?.roundId ?? '')
          break
        }

        case 'chat-message': {
          pushMessage(
            {
              type: 'chat-message',
              text: msg.text,
              nickname: msg.nickname,
              userId: msg.userId,
              connectionId: msg.connectionId,
              timestamp: msg.timestamp ?? new Date().toISOString(),
            },
            msg.userId !== userId
          )
          break
        }

        case 'user-joined': {
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  members: msg.members ?? prev.members,
                  memberCount: msg.memberCount ?? prev.memberCount,
                }
              : prev
          )
          addSystem(`${msg.nickname} entrou na sala`)
          break
        }

        case 'user-left': {
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  members: msg.members ?? prev.members,
                  memberCount: msg.memberCount ?? prev.memberCount,
                }
              : prev
          )
          addSystem(`${msg.nickname} saiu da sala`)
          break
        }

        case 'new-host': {
          setRoom((prev) => (prev ? { ...prev, hostUserId: msg.userId ?? prev.hostUserId } : prev))
          // A mensagem pessoal vem em 'you-are-host' para o próprio novo host.
          if (msg.userId !== userId) {
            addSystem(`${msg.nickname} agora é o anfitrião`)
          }
          break
        }

        case 'you-are-host': {
          const r = roomRef.current
          const gs = gameStateRef.current
          if (r && gs) {
            setGameState(withSolutions(gs, r.mode, r.seed))
          }
          setRoom((prev) => (prev ? { ...prev, hostUserId: userId } : prev))
          setJustBecameHost(true)
          addSystem('Você agora é o anfitrião!')
          break
        }

        case 'session-replaced': {
          setError(msg.message ?? 'Sua sessão foi substituída por outra conexão.')
          break
        }

        case 'error': {
          setError(msg.message ?? 'Erro na sala')
          break
        }
      }
    },
    [userId, code, addSystem, pushMessage]
  )

  const url = useMemo(() => buildRoomUrl(code), [code])

  const connection = useChatConnection({
    url,
    autoConnect,
    maxReconnectAttempts: ROOM_CONFIG.MAX_RECONNECT_ATTEMPTS,
    reconnectDelayBase: ROOM_CONFIG.RECONNECT_DELAY_BASE,
    heartbeatInterval: ROOM_CONFIG.HEARTBEAT_INTERVAL,
    onMessage: handleMessage,
    onDisconnected: useCallback(() => {
      // mantém estado da sala; reconecta automaticamente e re-sincroniza
    }, []),
  })

  // Sincroniza refs após cada render (não escrever em refs durante o render).
  useEffect(() => {
    roomRef.current = room
    gameStateRef.current = gameState
    nicknameRef.current = nickname
    intentRef.current = intent
    createModeRef.current = createMode
    createGameTypeRef.current = createGameType
    sendRef.current = connection.send
  })

  const broadcastState = useCallback(
    (state: GameState) => {
      const rid = roomRef.current?.roundId
      if (!rid) return
      // Durante a rodada as soluções ficam ocultas (anti-trapaça para os espectadores).
      // Quando a rodada termina, revelamos a palavra para TODOS os membros da sala.
      const payload = state.isGameOver ? state : stripSolutions(state)
      connection.send({ type: 'game-state', roundId: rid, gameState: payload })
    },
    [connection]
  )

  const broadcastLiveInput = useCallback(
    (currentGuess: string[], typedIndex: number) => {
      const rid = roomRef.current?.roundId
      if (!rid) return
      connection.send({ type: 'live-input', roundId: rid, currentGuess, typedIndex })
    },
    [connection]
  )

  const sendChat = useCallback(
    (text: string) => connection.send({ type: 'message', text }),
    [connection]
  )

  const requestNewRound = useCallback(
    (mode?: GameMode) => {
      connection.send(mode ? { type: 'new-round', mode } : { type: 'new-round' })
    },
    [connection]
  )

  const startMatch = useCallback(
    (mode?: GameMode, timeLimitMs?: number) => {
      const msg: { type: 'start-match'; mode?: GameMode; timeLimitMs?: number } = { type: 'start-match' }
      if (mode) msg.mode = mode
      if (typeof timeLimitMs === 'number') msg.timeLimitMs = timeLimitMs
      connection.send(msg)
    },
    [connection]
  )

  const reportFinished = useCallback(
    (solved: boolean, attempts: number) => {
      const rid = roomRef.current?.roundId
      if (!rid) return
      connection.send({ type: 'competitor-finished', roundId: rid, solved, attempts })
    },
    [connection]
  )

  const markAsRead = useCallback(() => setUnreadCount(0), [])
  const clearJustBecameHost = useCallback(() => setJustBecameHost(false), [])

  // Limpa erros transitórios depois de alguns segundos.
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(t)
  }, [error])

  // Limpa o timer de digitação ao desmontar.
  useEffect(
    () => () => {
      if (liveTypedTimerRef.current) clearTimeout(liveTypedTimerRef.current)
    },
    []
  )

  return {
    connected: connection.connected,
    isConnecting: connection.isConnecting,
    latency: connection.latency,
    userId,
    room,
    isHost,
    hostNickname,
    roundId,
    error,
    gameType,
    matchStatus,
    standings,
    roundTiming,
    gameState,
    setGameState,
    liveTypedIndex,
    messages,
    unreadCount,
    markAsRead,
    broadcastState,
    broadcastLiveInput,
    sendChat,
    requestNewRound,
    startMatch,
    reportFinished,
    justBecameHost,
    clearJustBecameHost,
  }
}
