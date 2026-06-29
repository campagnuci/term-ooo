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
import { storage } from '@/game/storage'
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
  /** Ranking ACUMULADO da partida (rodadas concluídas). */
  standings: CompetitorResult[]
  /** Quem já terminou a rodada CORRENTE — status ao vivo (⏳/✅/💀). */
  roundFinishers: CompetitorResult[]
  /** Rodada corrente / total (multi-rodada). 0 quando não há partida. */
  currentRound: number
  totalRounds: number
  /** Epoch LOCAL (ms) do início da rodada; se no futuro, há contagem regressiva. null = sem partida. */
  roundStartsAt: number | null
  /** true enquanto a contagem regressiva pré-rodada está em andamento. */
  countingDown: boolean
  /** true se o jogador local compete na partida atual (não um espectador que entrou depois). */
  amCompetitor: boolean

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
  /** Competição/Time Trial: anfitrião inicia uma partida (timeLimitMs só no Time Trial; rounds = nº de rodadas). */
  startMatch: (mode?: GameMode, timeLimitMs?: number, rounds?: number) => void
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

/**
 * Converte o `startsAt` (epoch do servidor) para o relógio LOCAL, descontando o
 * skew via `timer.serverNow`. Usado para ancorar a contagem regressiva e o início
 * da rodada no relógio de cada cliente. null se a mensagem não traz `startsAt`.
 */
function anchorStartsAtLocal(msg: RoomServerMessage, receiveNow: number): number | null {
  if (typeof msg.startsAt !== 'number') return null
  const serverNow = msg.timer?.serverNow
  const skew = typeof serverNow === 'number' ? serverNow - receiveNow : 0
  return msg.startsAt - skew
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

/**
 * Tabuleiro competitivo após (re)conexão. Tenta reidratar os palpites salvos no
 * localStorage para esta rodada (`room-<code>-<roundId>`); se não houver (rodada
 * nova ou primeira entrada), começa do zero. Reusa a chave por rodada, então um
 * estado de rodada antiga nunca é restaurado por engano. Re-injeta as soluções
 * derivadas de (mode, seed) por garantia.
 */
function restoreOrBuild(
  mode: GameMode,
  seed: number,
  code: string,
  roundId: string
): GameState {
  const dateKey = `room-${code}-${roundId}`
  const saved = storage.getGameState(mode, dateKey)
  if (saved && saved.dateKey === dateKey) {
    return withSolutions(saved, mode, seed)
  }
  return buildInitialState(mode, seed, code, roundId, true)
}

const MODE_NAMES: Record<GameMode, string> = {
  termo: 'Termo',
  dueto: 'Dueto',
  quarteto: 'Quarteto',
  seis: 'Modo 6',
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
  const [roundFinishers, setRoundFinishers] = useState<CompetitorResult[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [roundStartsAt, setRoundStartsAt] = useState<number | null>(null)
  const [countingDown, setCountingDown] = useState(false)
  const [amCompetitor, setAmCompetitor] = useState(false)
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
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Inicia (ou limpa) a contagem regressiva pré-rodada. `startLocal` é o epoch
  // LOCAL em que a rodada começa de fato; enquanto estiver no futuro,
  // `countingDown` fica true e a tela bloqueia a digitação. Um timeout único
  // desarma a contagem no instante exato do início.
  const beginCountdown = useCallback((startLocal: number | null) => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setRoundStartsAt(startLocal)
    if (startLocal == null) {
      setCountingDown(false)
      return
    }
    const delay = startLocal - Date.now()
    if (delay <= 0) {
      setCountingDown(false)
      return
    }
    setCountingDown(true)
    countdownTimerRef.current = setTimeout(() => {
      setCountingDown(false)
      countdownTimerRef.current = null
    }, delay)
  }, [])

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
          const ms = msg.matchStatus ?? 'idle'
          setMatchStatus(ms)
          setStandings(msg.standings ?? [])
          setRoundFinishers(msg.roundFinishers ?? [])
          setCurrentRound(msg.round ?? 0)
          setTotalRounds(msg.totalRounds ?? 0)
          setAmCompetitor((msg.competitorIds ?? []).includes(userId))
          // Competição/Time Trial: todos jogam o próprio tabuleiro (com soluções).
          // Coop: o host tem soluções; espectadores recebem stripado.
          const competitive = gt === 'competition' || gt === 'timetrial'
          // Partida ativa: ancora o início pelo `startsAt` (pode estar no futuro
          // durante a contagem). Demais estados usam o cronômetro padrão.
          if (competitive && ms === 'active') {
            const startLocal = anchorStartsAtLocal(msg, receiveNow)
            setRoundTiming({
              roundId: newRoom.roundId,
              startLocal,
              durationMs: null,
              limitMs: msg.timer?.limitMs ?? null,
            })
            beginCountdown(startLocal)
          } else {
            applyTiming(newRoom.roundId)
            beginCountdown(null)
          }
          const asHost = newRoom.hostUserId === userId
          if (competitive) {
            // Reidrata o tabuleiro desta rodada (palpites salvos), se houver.
            const restored = restoreOrBuild(
              newRoom.mode,
              newRoom.seed,
              newRoom.code,
              newRoom.roundId
            )
            setGameState(restored)
            // Recupera um término perdido pela queda: se o tabuleiro restaurado
            // já acabou, a partida está ativa e o servidor ainda não me tem como
            // finalista da rodada corrente, re-reporto (handleCompetitorFinished
            // é idempotente do lado do servidor).
            const alreadyFinisher = (msg.roundFinishers ?? []).some(
              (f) => f.userId === userId
            )
            if (ms === 'active' && restored.isGameOver && !alreadyFinisher) {
              sendRef.current({
                type: 'competitor-finished',
                roundId: newRoom.roundId,
                solved: restored.isWin,
                attempts: restored.currentRow,
              })
            }
          } else {
            setGameState(
              buildInitialState(
                newRoom.mode,
                newRoom.seed,
                newRoom.code,
                newRoom.roundId,
                asHost
              )
            )
          }
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
          setStandings(msg.standings ?? [])
          setRoundFinishers(msg.roundFinishers ?? [])
          setCurrentRound(msg.round ?? 1)
          setTotalRounds(msg.totalRounds ?? 1)
          setAmCompetitor((msg.competitorIds ?? []).includes(userId))
          // Início ancorado em `startsAt` (futuro durante a contagem regressiva).
          const startLocal = anchorStartsAtLocal(msg, receiveNow)
          setRoundTiming({ roundId: rid, startLocal, durationMs: null, limitMs: msg.timer?.limitMs ?? null })
          beginCountdown(startLocal)
          const r = roomRef.current
          const roomCode = r?.code ?? code
          // Todos jogam: tabuleiro próprio COM soluções (asHost = true).
          setGameState(buildInitialState(mode, seed, roomCode, rid, true))
          addSystem(
            r?.gameType === 'timetrial'
              ? 'Corrida contra o tempo! ⏱️ Preparados…'
              : 'A partida vai começar! 🏁'
          )
          break
        }

        case 'round-advanced': {
          // Uma rodada terminou e a próxima vem em seguida (após a contagem).
          // `standings` já reflete o acumulado COM a rodada recém-encerrada.
          const mode = (msg.mode ?? 'termo') as GameMode
          const seed = Number(msg.seed ?? 0)
          const rid = msg.roundId ?? ''
          if (msg.standings) setStandings(msg.standings)
          setRoundFinishers([])
          setCurrentRound(msg.round ?? 0)
          setTotalRounds(msg.totalRounds ?? 0)
          setAmCompetitor((msg.competitorIds ?? []).includes(userId))
          setRoundId(rid)
          setRoom((prev) => (prev ? { ...prev, mode, seed, roundId: rid } : prev))
          setMatchStatus('active')
          const startLocal = anchorStartsAtLocal(msg, receiveNow)
          setRoundTiming({ roundId: rid, startLocal, durationMs: null, limitMs: msg.timer?.limitMs ?? null })
          beginCountdown(startLocal)
          const r = roomRef.current
          const roomCode = r?.code ?? code
          setGameState(buildInitialState(mode, seed, roomCode, rid, true))
          addSystem(`Rodada ${msg.finishedRound ?? ''} encerrada! Próxima já vem… 🏁`)
          break
        }

        case 'competitor-finished': {
          // `standings` = acumulado das rodadas concluídas; `roundFinishers` =
          // progresso da rodada corrente (quem já terminou).
          if (msg.standings) setStandings(msg.standings)
          if (msg.roundFinishers) setRoundFinishers(msg.roundFinishers)
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
          if (msg.roundFinishers) setRoundFinishers(msg.roundFinishers)
          setMatchStatus('ended')
          beginCountdown(null)
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
          setRoundFinishers([])
          setCurrentRound(0)
          setTotalRounds(0)
          setAmCompetitor(false)
          beginCountdown(null)
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

        case 'user-disconnected': {
          // Queda transitória: o membro permanece na lista (lugar/placar mantidos
          // durante a janela de tolerância do servidor). Só avisamos no chat.
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  members: msg.members ?? prev.members,
                  memberCount: msg.memberCount ?? prev.memberCount,
                }
              : prev
          )
          addSystem(`${msg.nickname} caiu — reconectando…`)
          break
        }

        case 'user-reconnected': {
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  members: msg.members ?? prev.members,
                  memberCount: msg.memberCount ?? prev.memberCount,
                }
              : prev
          )
          addSystem(`${msg.nickname} voltou`)
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
    [userId, code, addSystem, pushMessage, beginCountdown]
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
    (mode?: GameMode, timeLimitMs?: number, rounds?: number) => {
      const msg: { type: 'start-match'; mode?: GameMode; timeLimitMs?: number; rounds?: number } = {
        type: 'start-match',
      }
      if (mode) msg.mode = mode
      if (typeof timeLimitMs === 'number') msg.timeLimitMs = timeLimitMs
      if (typeof rounds === 'number') msg.rounds = rounds
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

  // Limpa timers (digitação ao vivo + contagem regressiva) ao desmontar.
  useEffect(
    () => () => {
      if (liveTypedTimerRef.current) clearTimeout(liveTypedTimerRef.current)
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
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
    roundFinishers,
    currentRound,
    totalRounds,
    roundStartsAt,
    countingDown,
    amCompetitor,
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
