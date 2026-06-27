// src/game/mode-config.ts

/**
 * Configurações centralizadas por modo de jogo.
 * 
 * Este arquivo elimina a duplicação de switches por modo
 * que existiam em múltiplas funções do engine.ts.
 * 
 * @example
 * ```ts
 * import { getModeConfig, getMinAttempts } from '@/game/mode-config'
 * 
 * const config = getModeConfig('termo')
 * console.log(config.maxAttempts) // 6
 * console.log(config.numBoards) // 1
 * 
 * const min = getMinAttempts('dueto')
 * console.log(min.first) // 2
 * ```
 */

import { GameMode } from './types'
import { termoSolutions } from './words-termo'
import { duetoSolutions } from './words-dueto'
import { quartetoSolutions } from './words-quarteto'
import { sharedAllowed, sharedAllowedSet } from './words-shared'
import { seisSolutions, seisAllowed, seisAllowedSet } from './words-seis'

/**
 * Interface para configuração de tentativas mínimas por posição (medalhas)
 */
export interface MinAttempts {
  /** Tentativas para medalha de ouro */
  first: number
  /** Tentativas para medalha de prata */
  second: number
  /** Tentativas para medalha de bronze */
  third: number
}

/**
 * Interface para configuração completa de um modo de jogo
 */
export interface ModeConfig {
  /** Número máximo de tentativas permitidas */
  maxAttempts: number
  /** Número de tabuleiros simultâneos */
  numBoards: number
  /** Número de letras da palavra (5 nos modos clássicos, 6 no Modo 6). */
  wordLength: number
  /** Tentativas mínimas para cada medalha */
  minAttempts: MinAttempts
  /** Nome de exibição do modo */
  displayName: string
  /** Lista de soluções do modo */
  solutions: string[]
  /** Lista de palavras permitidas (compartilhada entre todos os modos) */
  allowed: string[]
  /** Set das palavras permitidas, para validação O(1) (mesmo conteúdo de `allowed`) */
  allowedSet: Set<string>
}

/**
 * Configurações centralizadas para todos os modos de jogo.
 * 
 * Todas as configurações específicas de modo devem ser
 * adicionadas aqui para evitar duplicação em múltiplos arquivos.
 */
export const MODE_CONFIG: Record<GameMode, ModeConfig> = {
  termo: {
    maxAttempts: 6,
    numBoards: 1,
    wordLength: 5,
    minAttempts: { first: 1, second: 2, third: 3 },
    displayName: 'Termo',
    solutions: termoSolutions,
    allowed: sharedAllowed,
    allowedSet: sharedAllowedSet,
  },
  dueto: {
    maxAttempts: 7,
    numBoards: 2,
    wordLength: 5,
    minAttempts: { first: 2, second: 3, third: 4 },
    displayName: 'Dueto',
    solutions: duetoSolutions,
    allowed: sharedAllowed,
    allowedSet: sharedAllowedSet,
  },
  quarteto: {
    maxAttempts: 9,
    numBoards: 4,
    wordLength: 5,
    minAttempts: { first: 4, second: 5, third: 6 },
    displayName: 'Quarteto',
    solutions: quartetoSolutions,
    allowed: sharedAllowed,
    allowedSet: sharedAllowedSet,
  },
  // Modo 6: 1 tabuleiro, palavras de 6 letras. Dicionário próprio (br-utf8),
  // soluções curadas por frequência. Ver src/game/words-seis.ts.
  seis: {
    maxAttempts: 6,
    numBoards: 1,
    wordLength: 6,
    minAttempts: { first: 1, second: 2, third: 3 },
    displayName: 'Modo 6',
    solutions: seisSolutions,
    allowed: seisAllowed,
    allowedSet: seisAllowedSet,
  },
} as const

/**
 * Obtém a configuração completa de um modo de jogo
 * 
 * @param mode - Modo de jogo ('termo', 'dueto', 'quarteto')
 * @returns Configuração completa do modo
 */
export function getModeConfig(mode: GameMode): ModeConfig {
  return MODE_CONFIG[mode]
}

/**
 * Obtém o número máximo de tentativas para um modo
 * 
 * @param mode - Modo de jogo
 * @returns Número máximo de tentativas
 */
export function getMaxAttempts(mode: GameMode): number {
  return MODE_CONFIG[mode].maxAttempts
}

/**
 * Obtém o número de tabuleiros para um modo
 * 
 * @param mode - Modo de jogo
 * @returns Número de tabuleiros
 */
export function getNumBoards(mode: GameMode): number {
  return MODE_CONFIG[mode].numBoards
}

/**
 * Obtém o número de letras da palavra de um modo (5 nos clássicos, 6 no Modo 6).
 *
 * @param mode - Modo de jogo
 * @returns Quantidade de letras por palavra
 */
export function getWordLength(mode: GameMode): number {
  return MODE_CONFIG[mode].wordLength
}

/**
 * Obtém as tentativas mínimas para medalhas de um modo
 * 
 * @param mode - Modo de jogo
 * @returns Objeto com tentativas para first, second, third
 */
export function getMinAttempts(mode: GameMode): MinAttempts {
  return MODE_CONFIG[mode].minAttempts
}

/**
 * Obtém o nome de exibição de um modo
 * 
 * @param mode - Modo de jogo
 * @returns Nome formatado do modo
 */
export function getModeDisplayName(mode: GameMode): string {
  return MODE_CONFIG[mode].displayName
}

/**
 * Obtém as listas de palavras (soluções e permitidas) de um modo
 *
 * @param mode - Modo de jogo
 * @returns Objeto com solutions, allowed e allowedSet
 */
export function getWordsForMode(mode: GameMode): { solutions: string[]; allowed: string[]; allowedSet: Set<string> } {
  const config = MODE_CONFIG[mode]
  return {
    solutions: config.solutions,
    allowed: config.allowed,
    allowedSet: config.allowedSet,
  }
}

