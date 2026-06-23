// src/lib/sounds/config.ts

import { SoundConfig, SoundEvent } from './types'

export const SOUNDS_CONFIG: SoundConfig[] = [
  // Eventos principais (precarregados)
  {
    event: 'share',
    file: '/assets/sounds/share.mp3', // TODO: Criar sample de áudio
    volume: 0.7,
    preload: false
  },
  {
    event: 'gameOver',
    file: '/assets/sounds/game-over.mp3', // TODO: Criar sample de áudio
    volume: 0.8,
    preload: false
  },
  {
    event: 'firstTryWin',
    file: '/assets/sounds/first-try-win.mp3', // TODO: Criar sample de áudio
    volume: 0.9,
    preload: false
  },

  // Eventos secundários (lazy load)
  {
    event: 'win',
    file: '/assets/sounds/win.mp3', // TODO: Criar sample de áudio
    volume: 0.7,
    preload: false
  },
  {
    event: 'wrongWord',
    file: '/assets/sounds/wrong-word.mp3', // TODO: Criar sample de áudio
    volume: 0.5,
    preload: false
  },
]

// Helper para pegar config de um evento
export function getSoundConfig(event: SoundEvent): SoundConfig | undefined {
  return SOUNDS_CONFIG.find(config => config.event === event)
}

