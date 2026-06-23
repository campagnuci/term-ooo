// src/game/room-types.ts
// Tipos do protocolo WebSocket das salas multiplayer.

import { GameMode, GameState } from './types'

/** Membro de uma sala (visão do cliente). */
export interface RoomMember {
  userId: string
  nickname: string
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
}

/** Intenção ao conectar: criar uma sala nova ou entrar numa existente. */
export type JoinIntent = 'create' | 'join'

// ---------------------------------------------------------------------------
// Mensagens do cliente -> servidor
// ---------------------------------------------------------------------------

export type RoomClientMessage =
  | { type: 'join'; userId: string; nickname: string; intent: JoinIntent; mode?: GameMode }
  | { type: 'message'; text: string }
  | { type: 'game-state'; roundId: string; gameState: GameState }
  | { type: 'live-input'; roundId: string; currentGuess: string[]; typedIndex: number }
  | { type: 'new-round'; mode?: GameMode }
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
