// src/naruto/naruto-engine.ts
// Motor do Shinobi (jogo estilo Narutodle): dataset, sorteio diário
// determinístico e comparação de categorias entre palpite e resposta.

import data from './data/characters.json'

export interface NarutoCharacter {
  id: number
  name: string
  image: string | null
  gender: string
  affiliations: string[]
  jutsuTypes: string[]
  kekkeiGenkai: string[]
  natureTypes: string[]
  attributes: string[]
  debutArc: string
  /** Índice do arco na linha do tempo (menor = estreia mais cedo). */
  arcOrder: number
}

export const CHARACTERS: NarutoCharacter[] = data.characters as NarutoCharacter[]

const BY_ID = new Map(CHARACTERS.map(c => [c.id, c]))

export function getCharacterById(id: number): NarutoCharacter | undefined {
  return BY_ID.get(id)
}

// ---------------------------------------------------------------------------
// Comparação
// ---------------------------------------------------------------------------

export type CellStatus = 'correct' | 'partial' | 'wrong'

export interface ArcCell {
  status: CellStatus
  /** Onde a resposta estreia em relação ao palpite ('earlier' = arco anterior). */
  direction: 'earlier' | 'later' | null
}

export interface GuessComparison {
  character: NarutoCharacter
  gender: CellStatus
  affiliations: CellStatus
  jutsuTypes: CellStatus
  kekkeiGenkai: CellStatus
  natureTypes: CellStatus
  attributes: CellStatus
  debutArc: ArcCell
  isWin: boolean
}

/**
 * Compara categorias multivaloradas: igual = correct, interseção = partial.
 * Dois conjuntos vazios contam como iguais ("Nenhum" === "Nenhum").
 */
function compareSets(guess: string[], answer: string[]): CellStatus {
  if (guess.length === 0 && answer.length === 0) return 'correct'
  const answerSet = new Set(answer)
  const common = guess.filter(v => answerSet.has(v)).length
  if (common === guess.length && guess.length === answer.length) return 'correct'
  return common > 0 ? 'partial' : 'wrong'
}

export function compareGuess(guess: NarutoCharacter, answer: NarutoCharacter): GuessComparison {
  const isWin = guess.id === answer.id
  return {
    character: guess,
    gender: guess.gender === answer.gender ? 'correct' : 'wrong',
    affiliations: compareSets(guess.affiliations, answer.affiliations),
    jutsuTypes: compareSets(guess.jutsuTypes, answer.jutsuTypes),
    kekkeiGenkai: compareSets(guess.kekkeiGenkai, answer.kekkeiGenkai),
    natureTypes: compareSets(guess.natureTypes, answer.natureTypes),
    attributes: compareSets(guess.attributes, answer.attributes),
    debutArc: guess.arcOrder === answer.arcOrder
      ? { status: 'correct', direction: null }
      : {
          status: 'wrong',
          direction: answer.arcOrder < guess.arcOrder ? 'earlier' : 'later',
        },
    isWin,
  }
}

// ---------------------------------------------------------------------------
// Sorteio diário determinístico (mesmo personagem para todos os jogadores)
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

/** Personagem do dia. Evita repetir o do dia anterior. */
export function getDailyCharacter(dayNumber: number): NarutoCharacter {
  let index = pickIndex(dayNumber)
  if (dayNumber > 1 && index === pickIndex(dayNumber - 1)) {
    index = (index + 1) % CHARACTERS.length
  }
  return CHARACTERS[index]
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

/** Normaliza para busca: minúsculas e sem diacríticos ("Hyūga" casa com "hyuga"). */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Personagens cujo nome contém a query, excluindo ids já usados. */
export function searchCharacters(query: string, excludeIds: Set<number>, limit = 8): NarutoCharacter[] {
  const q = normalizeSearch(query.trim())
  if (!q) return []
  const results: NarutoCharacter[] = []
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

export function buildShareText(dayNumber: number, guesses: GuessComparison[]): string {
  const lines = guesses.map(g => {
    const arc = g.debutArc.status === 'correct'
      ? STATUS_EMOJI.correct
      : g.debutArc.direction === 'earlier' ? '🔽' : '🔼'
    return [
      STATUS_EMOJI[g.gender],
      STATUS_EMOJI[g.affiliations],
      STATUS_EMOJI[g.jutsuTypes],
      STATUS_EMOJI[g.kekkeiGenkai],
      STATUS_EMOJI[g.natureTypes],
      STATUS_EMOJI[g.attributes],
      arc,
    ].join('')
  })
  return `Shinobi (termo.enresshou.dev) - Dia #${dayNumber}\nAcertei em ${guesses.length} tentativa${guesses.length === 1 ? '' : 's'}\n\n${lines.join('\n')}`
}
