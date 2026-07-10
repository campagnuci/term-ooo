// src/lib/routes.ts
import { GameMode } from '@/game/types'

/** Rota nomeada de cada modo diário. Fonte única de verdade para path <-> modo. */
export const MODE_PATHS: Record<GameMode, string> = {
  termo: '/termo',
  dueto: '/dueto',
  quarteto: '/quarteto',
  seis: '/modo-seis',
}

/** Rota do Modo Treino (variante ilimitada do Termo). */
export const TRAINING_PATH = '/treino'

/** Rota do lobby multijogador. */
export const ROOM_PATH = '/sala'

/** Rota do jogo da memória (Arcanum), single player. */
export const MEMORY_PATH = '/memoria'

/** Rota do Shinobi (adivinhe o personagem de Naruto, estilo Narutodle). */
export const SHINOBI_PATH = '/shinobi'

/** Rota do Pokédle (seleção de modo/geração; adivinhe o Pokémon). */
export const POKEDLE_PATH = '/pokedle'

/** Monta a rota de jogo do Pokédle para um modo e ritmo (diário/treino). */
export function pokedlePath(mode: string, isDaily: boolean): string {
  return `${POKEDLE_PATH}/${mode}${isDaily ? '' : '/treino'}`
}

/** Mapeia um pathname para o modo de jogo correspondente (Treino usa o modo 'termo'). */
export function getModeFromPath(path: string): GameMode {
  const entry = (Object.entries(MODE_PATHS) as [GameMode, string][]).find(
    ([, modePath]) => modePath === path
  )
  return entry ? entry[0] : 'termo'
}
