// src/pokemon/GuessGrid.tsx
// Grade de palpites: uma linha por Pokémon, uma célula colorida por categoria.
// Colunas numéricas (evolução, altura, peso, geração) mostram seta ↑/↓ quando
// a resposta é maior/menor que o palpite. A coluna "Geração" só aparece nos
// modos que misturam gerações (Pokédex completa e ultra-hard).

import { motion } from 'framer-motion'
import { CellStatus, GuessComparison, NumericCell } from './pokemon-engine'
import { PokemonSprite } from './PokemonSprite'

const STATUS_CLASSES: Record<CellStatus, string> = {
  correct: 'bg-green-600 border-green-500 text-white',
  partial: 'bg-yellow-500 border-yellow-400 text-night',
  wrong: 'bg-red-900 border-red-800 text-red-100',
}

// 84px por padrão (cabe 11 colunas em telas de desktop sem rolagem horizontal);
// cresce para 96px só em telas largas (xl+), onde há espaço de sobra.
const CELL_BASE =
  'w-[84px] h-[84px] xl:w-24 xl:h-24 rounded-md border-2 flex flex-col items-center justify-center text-center px-1 py-1 overflow-hidden'

function baseColumns(showGeneration: boolean): string[] {
  return [
    'Pokémon',
    'Tipo 1',
    'Tipo 2',
    'Hab. Oculta',
    'Cor',
    'Evolução',
    'Altura',
    'Peso',
    'BST',
    'Lendário',
    ...(showGeneration ? ['Geração'] : []),
  ]
}

/** Célula categórica: um valor de texto colorido pelo status. */
function ValueCell({ value, status, delay }: { value: string; status: CellStatus; delay: number }) {
  return (
    <motion.div
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={`${CELL_BASE} ${STATUS_CLASSES[status]}`}
      title={value}
    >
      <span className="text-[10px] sm:text-xs font-semibold leading-tight break-words">{value}</span>
    </motion.div>
  )
}

/** Seta cheia (preenchida) grande, usada como marca d'água ao fundo da célula. */
function BigArrow({ direction }: { direction: 'higher' | 'lower' }) {
  // Bloco de seta sólido (com haste), bem mais legível que um contorno fino.
  const path =
    direction === 'higher'
      ? 'M12 2 L22 13 H16.5 V22 H7.5 V13 H2 Z'
      : 'M12 22 L2 11 H7.5 V2 H16.5 V11 H22 Z'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="absolute inset-0 m-auto h-[88px] w-[88px] opacity-25 pointer-events-none"
      aria-label={direction === 'higher' ? 'resposta é maior' : 'resposta é menor'}
    >
      <path d={path} />
    </svg>
  )
}

/**
 * Célula numérica: a seta de direção (resposta maior/menor) aparece grande e
 * translúcida ao fundo, com o valor centralizado por cima — assim o texto fica
 * na mesma linha de todas as outras células.
 */
function NumericValueCell({
  cell,
  display,
  delay,
}: {
  cell: NumericCell
  display: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={`${CELL_BASE} relative ${STATUS_CLASSES[cell.status]}`}
      title={
        cell.direction
          ? `${display} — a resposta é ${cell.direction === 'higher' ? 'maior' : 'menor'}`
          : display
      }
    >
      {cell.direction && <BigArrow direction={cell.direction} />}
      <span className="relative text-[11px] sm:text-sm font-bold leading-tight break-words">
        {display}
      </span>
    </motion.div>
  )
}

const fmtHeight = (m: number) => `${m.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m`
const fmtWeight = (kg: number) => `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`

// Cada coluna entra com um atraso escalonado (efeito de flip por coluna).
const STEP = 0.1

export function GuessRow({ guess, showGeneration }: { guess: GuessComparison; showGeneration: boolean }) {
  const p = guess.pokemon

  return (
    <div className="flex gap-1.5 xl:gap-2">
      {/* Pokémon (sem cor de status) */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${CELL_BASE} bg-night-700 border-night-600`}
        title={p.name}
      >
        <PokemonSprite pokemon={p} size="md" className="mb-0.5" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-foreground leading-tight break-words">
          {p.name}
        </span>
      </motion.div>

      <ValueCell value={p.type1} status={guess.type1} delay={STEP} />
      <ValueCell value={p.type2 ?? '—'} status={guess.type2} delay={STEP * 2} />
      <ValueCell value={p.hiddenAbility} status={guess.hiddenAbility} delay={STEP * 3} />
      <ValueCell value={p.color} status={guess.color} delay={STEP * 4} />
      <NumericValueCell cell={guess.stage} display={`Estágio ${p.stage}`} delay={STEP * 5} />
      <NumericValueCell cell={guess.height} display={fmtHeight(p.height)} delay={STEP * 6} />
      <NumericValueCell cell={guess.weight} display={fmtWeight(p.weight)} delay={STEP * 7} />
      <NumericValueCell cell={guess.bst} display={String(p.bst)} delay={STEP * 8} />
      <ValueCell value={p.legendary ? 'Sim' : 'Não'} status={guess.legendary} delay={STEP * 9} />
      {showGeneration && (
        <NumericValueCell cell={guess.generation} display={`Gen ${p.gen}`} delay={STEP * 10} />
      )}
    </div>
  )
}

export function GuessGrid({
  guesses,
  showGeneration,
}: {
  guesses: GuessComparison[]
  showGeneration: boolean
}) {
  if (guesses.length === 0) return null
  const columns = baseColumns(showGeneration)

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex flex-col gap-1.5 sm:gap-2 items-start mx-auto w-fit">
        {/* Cabeçalhos */}
        <div className="flex gap-1.5 xl:gap-2">
          {columns.map(label => (
            <div
              key={label}
              className="w-[84px] xl:w-24 text-center text-[10px] sm:text-xs font-bold text-pistachio uppercase tracking-wide border-b-2 border-night-600 pb-1"
            >
              {label}
            </div>
          ))}
        </div>

        {guesses.map(guess => (
          <GuessRow key={guess.pokemon.id} guess={guess} showGeneration={showGeneration} />
        ))}
      </div>
    </div>
  )
}
