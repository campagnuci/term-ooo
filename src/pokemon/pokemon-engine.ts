// src/pokemon/pokemon-engine.ts
// Motor do Pokédle (jogo estilo Wordle/Pokédle): dataset por modo, sorteio
// diário determinístico, sorteio aleatório (treino) e comparação de categorias
// entre palpite e resposta.

import data from './data/pokemon.json'

export interface Pokemon {
  id: number
  name: string
  /** Geração da espécie (1-9). */
  gen: number
  type1: string
  type2: string | null
  /** Habilidade oculta (em inglês); "Nenhuma" quando o Pokémon não tem. */
  hiddenAbility: string
  color: string
  /** Estágio na cadeia de evolução (1 = base). */
  stage: number
  /** Altura em metros. */
  height: number
  /** Peso em quilos. */
  weight: number
  /** Base Stat Total: soma dos seis atributos base. */
  bst: number
  /** true para lendários ou míticos. */
  legendary: boolean
  /** Região da forma regional (Alola/Galar/Hisui/Paldea) ou null para a espécie base. */
  form: string | null
}

export const ALL_POKEMON: Pokemon[] = data.entries as Pokemon[]

const BY_ID = new Map(ALL_POKEMON.map(p => [p.id, p]))

export function getPokemonById(id: number): Pokemon | undefined {
  return BY_ID.get(id)
}

// ---------------------------------------------------------------------------
// Modos
// ---------------------------------------------------------------------------

export type PokemonMode =
  | 'gen1' | 'gen2' | 'gen3' | 'gen4' | 'gen5' | 'gen6' | 'gen7' | 'gen8' | 'gen9'
  | 'full' | 'ultra'

export interface ModeConfig {
  id: PokemonMode
  /** Nome curto para chips/abas (ex.: "Gen 1"). */
  short: string
  /** Título exibido no cabeçalho. */
  label: string
  description: string
  /** A coluna "Geração" só aparece quando o pool mistura gerações. */
  showGeneration: boolean
}

export const GEN_MODES: ModeConfig[] = Array.from({ length: 9 }, (_, i) => {
  const n = i + 1
  return {
    id: `gen${n}` as PokemonMode,
    short: `Gen ${n}`,
    label: `Geração ${n}`,
    description: `Só Pokémon da ${n}ª geração.`,
    showGeneration: false,
  }
})

export const SPECIAL_MODES: ModeConfig[] = [
  {
    id: 'full',
    short: 'Pokédex',
    label: 'Pokédex Completa',
    description: 'Todas as gerações (1000+ Pokémon).',
    showGeneration: true,
  },
  {
    id: 'ultra',
    short: 'Ultra-Hard',
    label: 'Modo Ultra-Hard',
    description: 'Pokédex completa + formas regionais.',
    showGeneration: true,
  },
]

export const MODES: ModeConfig[] = [...GEN_MODES, ...SPECIAL_MODES]

const MODE_MAP = new Map(MODES.map(m => [m.id, m]))

export function getModeConfig(mode: PokemonMode): ModeConfig {
  return MODE_MAP.get(mode) ?? SPECIAL_MODES[0]
}

export function isPokemonMode(value: string): value is PokemonMode {
  return MODE_MAP.has(value as PokemonMode)
}

/** Pool de Pokémon jogáveis (sorteio + busca) para o modo. */
export function getPool(mode: PokemonMode): Pokemon[] {
  if (mode === 'ultra') return ALL_POKEMON
  if (mode === 'full') return ALL_POKEMON.filter(p => p.form == null)
  const gen = Number(mode.slice(3))
  return ALL_POKEMON.filter(p => p.form == null && p.gen === gen)
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

export interface GuessComparison {
  pokemon: Pokemon
  type1: CellStatus
  type2: CellStatus
  hiddenAbility: CellStatus
  color: CellStatus
  stage: NumericCell
  height: NumericCell
  weight: NumericCell
  bst: NumericCell
  legendary: CellStatus
  generation: NumericCell
  isWin: boolean
}

/** Compara o tipo primário do palpite contra os tipos da resposta. */
function compareType1(guess: Pokemon, answer: Pokemon): CellStatus {
  if (guess.type1 === answer.type1) return 'correct'
  if (guess.type1 === answer.type2) return 'partial'
  return 'wrong'
}

/** Compara o tipo secundário (ambos "sem tipo 2" contam como iguais). */
function compareType2(guess: Pokemon, answer: Pokemon): CellStatus {
  if (guess.type2 === answer.type2) return 'correct' // inclui null === null
  if (guess.type2 != null && guess.type2 === answer.type1) return 'partial'
  return 'wrong'
}

/**
 * Compara um valor numérico. `closeRatio` > 0 marca como "partial" quando a
 * diferença está dentro dessa fração da resposta (dica de "quente").
 */
function compareNumeric(guess: number, answer: number, closeRatio = 0): NumericCell {
  if (guess === answer) return { status: 'correct', direction: null }
  const direction = answer > guess ? 'higher' : 'lower'
  if (closeRatio > 0 && Math.abs(answer - guess) <= answer * closeRatio) {
    return { status: 'partial', direction }
  }
  return { status: 'wrong', direction }
}

const NUMERIC_CLOSE_RATIO = 0.15 // altura/peso a até 15% da resposta = "quente"
const BST_CLOSE_RATIO = 0.1 // BST a até 10% da resposta = "quente"

export function compareGuess(guess: Pokemon, answer: Pokemon): GuessComparison {
  return {
    pokemon: guess,
    isWin: guess.id === answer.id,
    type1: compareType1(guess, answer),
    type2: compareType2(guess, answer),
    hiddenAbility: guess.hiddenAbility === answer.hiddenAbility ? 'correct' : 'wrong',
    color: guess.color === answer.color ? 'correct' : 'wrong',
    stage: compareNumeric(guess.stage, answer.stage),
    height: compareNumeric(guess.height, answer.height, NUMERIC_CLOSE_RATIO),
    weight: compareNumeric(guess.weight, answer.weight, NUMERIC_CLOSE_RATIO),
    bst: compareNumeric(guess.bst, answer.bst, BST_CLOSE_RATIO),
    legendary: guess.legendary === answer.legendary ? 'correct' : 'wrong',
    generation: compareNumeric(guess.gen, answer.gen),
  }
}

// ---------------------------------------------------------------------------
// Sorteio
// ---------------------------------------------------------------------------

/** PRNG mulberry32: rápido e determinístico a partir de uma seed. */
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

/** Hash simples de string (djb2) para semear o PRNG por modo. */
function hashMode(mode: PokemonMode): number {
  let h = 5381
  for (let i = 0; i < mode.length; i++) h = (h * 33) ^ mode.charCodeAt(i)
  return h >>> 0
}

function pickDailyIndex(mode: PokemonMode, dayNumber: number, poolSize: number): number {
  const seed = (hashMode(mode) ^ (dayNumber * 2654435761)) >>> 0
  return Math.floor(mulberry32(seed)() * poolSize)
}

/** Pokémon do dia para um modo. Evita repetir o do dia anterior. */
export function getDailyPokemon(mode: PokemonMode, dayNumber: number): Pokemon {
  const pool = getPool(mode)
  let index = pickDailyIndex(mode, dayNumber, pool.length)
  if (dayNumber > 1 && index === pickDailyIndex(mode, dayNumber - 1, pool.length)) {
    index = (index + 1) % pool.length
  }
  return pool[index]
}

/** Pokémon aleatório (modo treino), evitando um id recém-usado. */
export function getRandomPokemon(mode: PokemonMode, excludeId?: number): Pokemon {
  const pool = getPool(mode)
  let pick = pool[Math.floor(Math.random() * pool.length)]
  if (excludeId != null && pool.length > 1 && pick.id === excludeId) {
    pick = pool[(pool.indexOf(pick) + 1) % pool.length]
  }
  return pick
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

/** Normaliza para busca: minúsculas e sem diacríticos. */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Pokémon do pool cujo nome contém a query, excluindo ids já usados. */
export function searchPokemon(
  mode: PokemonMode,
  query: string,
  excludeIds: Set<number>,
  limit = 8
): Pokemon[] {
  const q = normalizeSearch(query.trim())
  if (!q) return []
  const pool = getPool(mode)
  const results: Pokemon[] = []
  for (const p of pool) {
    if (excludeIds.has(p.id)) continue
    if (normalizeSearch(p.name).includes(q)) {
      results.push(p)
      if (results.length >= limit) break
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Sprite
// ---------------------------------------------------------------------------

/** Arte oficial do Pokémon (funciona também para ids de formas regionais). */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
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

export function buildShareText(
  mode: PokemonMode,
  guesses: GuessComparison[],
  isDaily: boolean,
  dayNumber: number
): string {
  const config = getModeConfig(mode)
  const showGen = config.showGeneration
  const lines = guesses.map(g =>
    [
      STATUS_EMOJI[g.type1],
      STATUS_EMOJI[g.type2],
      STATUS_EMOJI[g.hiddenAbility],
      STATUS_EMOJI[g.color],
      numericEmoji(g.stage),
      numericEmoji(g.height),
      numericEmoji(g.weight),
      numericEmoji(g.bst),
      STATUS_EMOJI[g.legendary],
      ...(showGen ? [numericEmoji(g.generation)] : []),
    ].join('')
  )
  const header = isDaily
    ? `Pokédle ${config.short} · Dia #${dayNumber}`
    : `Pokédle ${config.short} · Treino`
  return `${header} (termo.enresshou.dev)\nAcertei em ${guesses.length} tentativa${
    guesses.length === 1 ? '' : 's'
  }\n\n${lines.join('\n')}`
}
