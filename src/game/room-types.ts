// src/game/room-types.ts
// Tipos do protocolo WebSocket das salas multiplayer.

import { GameMode, GameState } from './types'

/** Membro de uma sala (visão do cliente). */
export interface RoomMember {
  userId: string
  nickname: string
}

/**
 * Tipo de jogo da sala (escolhido na criação, fixo durante a vida da sala):
 *  - 'coop': modo cooperativo (existente) — o anfitrião joga e os demais assistem/sugerem.
 *  - 'competition': todos competem na mesma palavra; vence quem resolver mais rápido.
 *  - 'timetrial': competição contra o relógio — tempo fixo escolhido pelo host;
 *    pontuação por tempo restante + tentativas não usadas (mais = melhor).
 */
export type RoomGameType = 'coop' | 'competition' | 'timetrial'

/** Estado de uma partida competitiva. */
export type MatchStatus = 'idle' | 'active' | 'ended'

/** Resultado de um competidor numa partida (ranking). */
export interface CompetitorResult {
  userId: string
  nickname: string
  /** true se completou todos os tabuleiros; false se esgotou as tentativas. */
  solved: boolean
  /** Número de tentativas usadas até terminar. */
  attempts: number
  /** Posição entre os que acertaram (1 = ouro). null se não acertou ou no Time Trial. */
  solveRank: number | null
  /** Tempo de resolução em ms (servidor: finishedAt - início da partida). */
  solveMs?: number | null
  /** Pontos (apenas Time Trial). Mais tempo restante + menos tentativas = mais pontos. */
  points?: number | null
  /** true se o jogador foi pego pelo fim do tempo sem terminar (Time Trial). */
  timedOut?: boolean
  finishedAt: string
}

/**
 * Bloco de cronômetro enviado pelo servidor (autoridade) junto das mensagens
 * de rodada. Tempos em epoch ms do RELÓGIO DO SERVIDOR.
 *
 * O cliente ancora o início no PRÓPRIO relógio via `elapsedMs`
 * (startLocal = recebimento - elapsedMs), evitando problemas de skew entre
 * relógios. Quando a rodada termina, `durationMs` é o valor final congelado,
 * idêntico para todos.
 */
export interface RoundTimerInfo {
  /** Epoch ms (servidor) do início da rodada. null = ainda não começou. */
  startedAt: number | null
  /** Epoch ms (servidor) do fim da rodada. null = em andamento. */
  endedAt: number | null
  /** Tempo decorrido (ms) no instante do envio. null = não começou. */
  elapsedMs: number | null
  /** Duração final (ms) quando terminou. null = em andamento. */
  durationMs: number | null
  /** Limite de tempo (Time Trial) → contagem regressiva. null nos demais modos. */
  limitMs?: number | null
  /** Epoch ms (servidor) no instante do envio. */
  serverNow: number
}

/** Cronômetro da rodada ancorado no relógio LOCAL do cliente. */
export interface RoundTiming {
  /** roundId ao qual este cronômetro pertence. */
  roundId: string | null
  /** Epoch ms (LOCAL) do início, derivado de elapsedMs. null = não começou. */
  startLocal: number | null
  /** Duração final congelada (ms) quando terminou. null = em andamento. */
  durationMs: number | null
  /** Limite de tempo (Time Trial) → contagem regressiva. null nos demais modos. */
  limitMs: number | null
}

/** Estado da sala mantido no cliente (metadados — não o jogo em si). */
export interface RoomState {
  code: string
  hostUserId: string
  mode: GameMode
  seed: number
  roundId: string
  members: RoomMember[]
  memberCount: number
  gameType: RoomGameType
}

/** Intenção ao conectar: criar uma sala nova ou entrar numa existente. */
export type JoinIntent = 'create' | 'join'

// ---------------------------------------------------------------------------
// Mensagens do cliente -> servidor
// ---------------------------------------------------------------------------

export type RoomClientMessage =
  | { type: 'join'; userId: string; nickname: string; intent: JoinIntent; mode?: GameMode; gameType?: RoomGameType }
  | { type: 'message'; text: string }
  | { type: 'game-state'; roundId: string; gameState: GameState }
  | { type: 'live-input'; roundId: string; currentGuess: string[]; typedIndex: number }
  | { type: 'new-round'; mode?: GameMode }
  // Competição/Time Trial: anfitrião inicia uma partida (palavra nova, ranking zerado).
  // timeLimitMs só é usado no Time Trial (limite do relógio, em ms).
  | { type: 'start-match'; mode?: GameMode; timeLimitMs?: number }
  // Competição: jogador reporta que terminou (acertou ou esgotou tentativas).
  | { type: 'competitor-finished'; roundId: string; solved: boolean; attempts: number }
  | { type: 'get-room-state' }
  | { type: 'ping'; time: number }

// ---------------------------------------------------------------------------
// Mensagens do servidor -> cliente
// ---------------------------------------------------------------------------

export type RoomServerMessageType =
  | 'request-auth'
  | 'room-state'
  | 'game-state'
  | 'live-input'
  | 'new-round'
  | 'match-start'
  | 'competitor-finished'
  | 'match-end'
  | 'round-timing'
  | 'chat-message'
  | 'user-joined'
  | 'user-left'
  | 'new-host'
  | 'you-are-host'
  | 'pong'
  | 'session-replaced'
  | 'error'

export interface RoomServerMessage {
  type: RoomServerMessageType

  // `code` = código da sala em `room-state`; código do erro em `error`.
  // O handler interpreta conforme `type`.
  code?: string

  // room-state
  hostUserId?: string
  isHost?: boolean
  mode?: GameMode
  seed?: number
  roundId?: string
  members?: RoomMember[]
  memberCount?: number

  // competição
  gameType?: RoomGameType
  matchStatus?: MatchStatus
  standings?: CompetitorResult[]
  solved?: boolean
  attempts?: number
  solveRank?: number | null
  solveMs?: number | null
  points?: number | null
  /** Motivo de fim de partida (ex.: 'timeout' no Time Trial). */
  reason?: string

  // cronômetro da rodada (autoridade do servidor)
  timer?: RoundTimerInfo

  // game-state / new-round
  gameState?: GameState
  modeChanged?: boolean

  // live-input (digitação em tempo real do host)
  currentGuess?: string[]
  typedIndex?: number

  // chat / system / erro
  text?: string
  message?: string
  nickname?: string
  userId?: string
  connectionId?: string
  retryAfterMs?: number
  time?: number
  timestamp?: string
}

/** Códigos de erro conhecidos enviados pelo servidor (campo `code`). */
export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_EXISTS'
  | 'ROOM_CLOSED'
  | 'NOT_HOST'
  | 'ROUND_ID_MISMATCH'
  | 'NICKNAME_TAKEN'
  | 'NOT_AUTHENTICATED'
  | 'INVALID_NICKNAME'
  | 'MESSAGE_TOO_LARGE'
  | 'SPAM_DETECTED'
  | 'USER_MUTED'
  | 'UNKNOWN_TYPE'
  // Competição / Time Trial
  | 'NOT_COMPETITION'
  | 'NOT_ENOUGH_PLAYERS'
  | 'MATCH_IN_PROGRESS'
