// src/smash/smash-engine.ts
// Motor do Smashdle (jogo estilo Pokédle/Narutodle): dataset dos lutadores de
// Super Smash Bros. Ultimate, sorteio diário determinístico e comparação de
// categorias entre palpite e resposta. Não consome API em runtime — a fonte de
// verdade é o JSON gerado por generate-smash-data.mjs.

import data from './data/characters.json'

export interface SmashCharacter {
  id: number
  name: string
  /** Ícone (cabeça) do lutador; pode faltar. */
  icon: string | null
  /** Arte/retrato do lutador; pode faltar. */
  portrait: string | null
  /** Universo/série de origem (ex.: Mario, Metroid). */
  universe: string
  /** Masculino | Feminino | Selecionável | Outro */
  gender: string
  /** Espécie em pt-BR (Humano, Pokémon, Kong, ...). */
  species: string
  /** Peso de SSB Ultimate (unidades de knockback). */
  weight: number
  /** Jogo SSB em que o lutador estreou (Smash 64/Melee/Brawl/Smash 4/Ultimate). */
  firstGame: string
  /** Índice cronológico do jogo de estreia (0 = Smash 64 … 4 = Ultimate). */
  firstGameOrder: number
  /** Console de estreia do jogo de origem do personagem. */
  platform: string
  /** Ano de lançamento do jogo de origem do personagem. */
  originYear: number
  /** Como o lutador é obtido em Ultimate (Inicial/Desbloqueável/Mii/DLC). */
  availability: string
}

export const CHARACTERS: SmashCharacter[] = data.characters as SmashCharacter[]

const BY_ID = new Map(CHARACTERS.map(c => [c.id, c]))

export function getCharacterById(id: number): SmashCharacter | undefined {
  return BY_ID.get(id)
}

// ---------------------------------------------------------------------------
// Comparação
// ---------------------------------------------------------------------------

export type CellStatus = 'correct' | 'partial' | 'wrong'

export interface NumericCell {
  status: CellStatus
  /** Direção da RESPOSTA em relação ao palpite: 'higher' = resposta maior. */
  direction: 'higher' | 'lower' | null
}

export interface OrdinalCell {
  status: CellStatus
  /** Onde a resposta estreia em relação ao palpite ('earlier' = jogo anterior). */
  direction: 'earlier' | 'later' | null
}

export interface GuessComparison {
  character: SmashCharacter
  gender: CellStatus
  species: CellStatus
  universe: CellStatus
  weight: NumericCell
  firstGame: OrdinalCell
  platform: CellStatus
  originYear: NumericCell
  availability: CellStatus
  isWin: boolean
}

/**
 * Compara um valor numérico. `closeAbs` > 0 marca como "partial" (quente)
 * quando a diferença absoluta está dentro desse limite.
 */
function compareNumeric(guess: number, answer: number, closeAbs = 0): NumericCell {
  if (guess === answer) return { status: 'correct', direction: null }
  const direction = answer > guess ? 'higher' : 'lower'
  if (closeAbs > 0 && Math.abs(answer - guess) <= closeAbs) {
    return { status: 'partial', direction }
  }
  return { status: 'wrong', direction }
}

const WEIGHT_CLOSE = 8 // peso a até 8 unidades da resposta = "quente"
const YEAR_CLOSE = 3 // ano a até 3 anos da resposta = "quente"

export function compareGuess(guess: SmashCharacter, answer: SmashCharacter): GuessComparison {
  return {
    character: guess,
    isWin: guess.id === answer.id,
    gender: guess.gender === answer.gender ? 'correct' : 'wrong',
    species: guess.species === answer.species ? 'correct' : 'wrong',
    universe: guess.universe === answer.universe ? 'correct' : 'wrong',
    weight: compareNumeric(guess.weight, answer.weight, WEIGHT_CLOSE),
    firstGame:
      guess.firstGameOrder === answer.firstGameOrder
        ? { status: 'correct', direction: null }
        : {
            status: 'wrong',
            direction: answer.firstGameOrder < guess.firstGameOrder ? 'earlier' : 'later',
          },
    platform: guess.platform === answer.platform ? 'correct' : 'wrong',
    originYear: compareNumeric(guess.originYear, answer.originYear, YEAR_CLOSE),
    availability: guess.availability === answer.availability ? 'correct' : 'wrong',
  }
}

// ---------------------------------------------------------------------------
// Sorteio diário determinístico (mesmo lutador para todos os jogadores)
// ---------------------------------------------------------------------------

/** PRNG mulberry32: rápido e determinístico a partir do dayNumber. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickIndex(dayNumber: number): number {
  return Math.floor(mulberry32(dayNumber * 7919)() * CHARACTERS.length)
}

/** Lutador do dia. Evita repetir o do dia anterior. */
export function getDailyCharacter(dayNumber: number): SmashCharacter {
  let index = pickIndex(dayNumber)
  if (dayNumber > 1 && index === pickIndex(dayNumber - 1)) {
    index = (index + 1) % CHARACTERS.length
  }
  return CHARACTERS[index]
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

/** Normaliza para busca: minúsculas e sem diacríticos ("Pokémon" casa com "pokemon"). */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Lutadores cujo nome contém a query, excluindo ids já usados. */
export function searchCharacters(query: string, excludeIds: Set<number>, limit = 8): SmashCharacter[] {
  const q = normalizeSearch(query.trim())
  if (!q) return []
  const results: SmashCharacter[] = []
  for (const c of CHARACTERS) {
    if (excludeIds.has(c.id)) continue
    if (normalizeSearch(c.name).includes(q)) {
      results.push(c)
      if (results.length >= limit) break
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Compartilhamento
// ---------------------------------------------------------------------------

const STATUS_EMOJI: Record<CellStatus, string> = {
  correct: '🟩',
  partial: '🟨',
  wrong: '🟥',
}

function numericEmoji(cell: NumericCell): string {
  if (cell.status === 'correct') return STATUS_EMOJI.correct
  if (cell.status === 'partial') return STATUS_EMOJI.partial
  return cell.direction === 'higher' ? '🔼' : '🔽'
}

function ordinalEmoji(cell: OrdinalCell): string {
  if (cell.status === 'correct') return STATUS_EMOJI.correct
  return cell.direction === 'later' ? '🔼' : '🔽'
}

export function buildShareText(dayNumber: number, guesses: GuessComparison[]): string {
  const lines = guesses.map(g =>
    [
      STATUS_EMOJI[g.gender],
      STATUS_EMOJI[g.species],
      STATUS_EMOJI[g.universe],
      numericEmoji(g.weight),
      ordinalEmoji(g.firstGame),
      STATUS_EMOJI[g.platform],
      numericEmoji(g.originYear),
      STATUS_EMOJI[g.availability],
    ].join('')
  )
  return `Smashdle (termo.enresshou.dev) - Dia #${dayNumber}\nAcertei em ${guesses.length} tentativa${
    guesses.length === 1 ? '' : 's'
  }\n\n${lines.join('\n')}`
}
