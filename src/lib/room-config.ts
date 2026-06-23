// src/lib/room-config.ts
// Configuração das salas multiplayer.

import { CHAT_CONFIG } from './chat-config'

// Base do WebSocket de salas (origem: scheme + host + porta, sem caminho).
// Por padrão reaproveita o mesmo worker do chat (que agora também serve
// /room/<CODE>). Em produção, se o chat apontar para outro deploy, defina
// VITE_ROOM_WS_URL para o worker que contém o Durable Object GameRoom.
function resolveBaseUrl(): string {
  const explicit = import.meta.env.VITE_ROOM_WS_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  try {
    return new URL(CHAT_CONFIG.WS_URL).origin
  } catch {
    return CHAT_CONFIG.WS_URL.replace(/\/+$/, '')
  }
}

// Alfabeto sem caracteres ambíguos (sem O/0, I/1).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const ROOM_CONFIG = {
  WS_BASE_URL: resolveBaseUrl(),

  // Feature flag (mesma do chat por padrão).
  ENABLED: import.meta.env.VITE_CHAT_ENABLED !== 'false',

  CODE_LENGTH: 6,
  CODE_REGEX: /^[A-Z0-9]{4,6}$/,
  CODE_ALPHABET,

  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_BASE: 1000,
  HEARTBEAT_INTERVAL: 20000,

  MAX_CHAT_MESSAGES: 100,
} as const

/** Monta a URL do WebSocket para uma sala específica. */
export function buildRoomUrl(code: string): string {
  return `${ROOM_CONFIG.WS_BASE_URL}/room/${code.toUpperCase()}`
}

/** Gera um código de sala aleatório, legível e sem caracteres ambíguos. */
export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CONFIG.CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < ROOM_CONFIG.CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return code
}

/** Normaliza/valida um código digitado pelo usuário. Retorna null se inválido. */
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return ROOM_CONFIG.CODE_REGEX.test(code) ? code : null
}

if (import.meta.env.DEV) {
  console.info('[Room] Base WS:', ROOM_CONFIG.WS_BASE_URL)
}
