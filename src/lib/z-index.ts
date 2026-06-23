// src/lib/z-index.ts
// Centralização de z-indexes da aplicação

/**
 * Z-indexes padronizados para toda aplicação
 * Garante hierarquia consistente de camadas
 */
export const Z_INDEX = {
  /** Camada base (0) */
  BASE: 0,
  
  /** Elementos do jogo */
  GAME_BOARD: 1,
  KEYBOARD: 10,

  /** Controles de fim de rodada da sala (acima do tabuleiro/teclado) */
  ROOM_END_CONTROLS: 15,

  /** Header e navegação */
  HEADER: 20,
  TOP_TABS: 25,

  /** Sala multiplayer */
  ROOM_SIDEBAR: 30,

  /** Botões flutuantes */
  CHAT_BUTTON: 40,

  /** Banner de promoção a host (sala) */
  ROOM_HOST_BANNER: 45,
  
  /** Overlays de dialogs */
  DIALOG_OVERLAY: 50,
  DIALOG_CONTENT: 51,
  
  /** Chat (acima de dialogs) */
  CHAT_OVERLAY: 52,
  CHAT_PANEL: 53,
  
  /** Notificações e toasts */
  TOAST: 100,
} as const

export type ZIndexKey = keyof typeof Z_INDEX

