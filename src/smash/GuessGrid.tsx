// src/smash/GuessGrid.tsx
// Grade de palpites: uma linha por lutador, uma célula colorida por categoria.
// Peso e Ano são numéricos (seta ↑/↓ = resposta maior/menor); Estreia é ordinal
// (seta = a resposta estreou num SSB anterior/posterior). Rola na horizontal.

import { motion } from 'framer-motion'
import { CellStatus, GuessComparison, NumericCell, OrdinalCell } from './smash-engine'
import { CharacterAvatar } from './CharacterAvatar'

export const COLUMNS = [
  'Lutador',
  'Gênero',
  'Espécie',
  'Universo',
  'Peso',
  'Estreia',
  'Plataforma',
  'Ano',
  'Obtenção',
] as const

const STATUS_CLASSES: Record<CellStatus, string> = {
  correct: 'bg-green-600 border-green-500 text-white',
  partial: 'bg-yellow-500 border-yellow-400 text-night',
  wrong: 'bg-red-900 border-red-800 text-red-100',
}

const CELL_BASE =
  'w-[84px] h-[84px] sm:w-24 sm:h-24 rounded-md border-2 flex flex-col items-center justify-center text-center px-1 py-1 overflow-hidden'

/** Seta cheia grande, marca d'água ao fundo da célula (indica direção). */
function BigArrow({ up }: { up: boolean }) {
  const path = up
    ? 'M12 2 L22 13 H16.5 V22 H7.5 V13 H2 Z'
    : 'M12 22 L2 11 H7.5 V2 H16.5 V11 H22 Z'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="absolute inset-0 m-auto h-[88px] w-[88px] opacity-25 pointer-events-none"
      aria-label={up ? 'resposta é maior/posterior' : 'resposta é menor/anterior'}
    >
      <path d={path} />
    </svg>
  )
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

/** Célula numérica: seta de direção ao fundo, valor centralizado por cima. */
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
      {cell.direction && <BigArrow up={cell.direction === 'higher'} />}
      <span className="relative text-[11px] sm:text-sm font-bold leading-tight break-words">
        {display}
      </span>
    </motion.div>
  )
}

/** Célula ordinal (Estreia): seta indica se a resposta estreia antes/depois. */
function OrdinalValueCell({
  cell,
  display,
  delay,
}: {
  cell: OrdinalCell
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
          ? `${display} — o lutador do dia estreia ${cell.direction === 'earlier' ? 'antes' : 'depois'}`
          : display
      }
    >
      {cell.direction && <BigArrow up={cell.direction === 'later'} />}
      <span className="relative text-[10px] sm:text-xs font-semibold leading-tight break-words">
        {display}
      </span>
    </motion.div>
  )
}

// Cada coluna entra com atraso escalonado (efeito de flip por coluna).
const STEP = 0.1

export function GuessRow({ guess }: { guess: GuessComparison }) {
  const c = guess.character

  return (
    <div className="flex gap-1.5 sm:gap-2">
      {/* Lutador (sem cor de status) */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${CELL_BASE} bg-night-700 border-night-600`}
        title={c.name}
      >
        <CharacterAvatar character={c} size="md" className="mb-0.5" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-foreground leading-tight break-words">
          {c.name}
        </span>
      </motion.div>

      <ValueCell value={c.gender} status={guess.gender} delay={STEP} />
      <ValueCell value={c.species} status={guess.species} delay={STEP * 2} />
      <ValueCell value={c.universe} status={guess.universe} delay={STEP * 3} />
      <NumericValueCell cell={guess.weight} display={String(c.weight)} delay={STEP * 4} />
      <OrdinalValueCell cell={guess.firstGame} display={c.firstGame} delay={STEP * 5} />
      <ValueCell value={c.platform} status={guess.platform} delay={STEP * 6} />
      <NumericValueCell cell={guess.originYear} display={String(c.originYear)} delay={STEP * 7} />
      <ValueCell value={c.availability} status={guess.availability} delay={STEP * 8} />
    </div>
  )
}

export function GuessGrid({ guesses }: { guesses: GuessComparison[] }) {
  if (guesses.length === 0) return null

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex flex-col gap-1.5 sm:gap-2 items-start mx-auto w-fit">
        {/* Cabeçalhos */}
        <div className="flex gap-1.5 sm:gap-2">
          {COLUMNS.map(label => (
            <div
              key={label}
              className="w-[84px] sm:w-24 text-center text-[10px] sm:text-xs font-bold text-pistachio uppercase tracking-wide border-b-2 border-night-600 pb-1"
            >
              {label}
            </div>
          ))}
        </div>

        {guesses.map(guess => (
          <GuessRow key={guess.character.id} guess={guess} />
        ))}
      </div>
    </div>
  )
}
