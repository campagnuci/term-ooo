// src/naruto/GuessGrid.tsx
// Grade de palpites: uma linha por personagem, uma célula colorida por
// categoria. Linhas novas entram com animação de flip escalonada por coluna.

import { motion } from 'framer-motion'
import { CellStatus, GuessComparison } from './naruto-engine'
import { CharacterAvatar } from './CharacterAvatar'

export const COLUMNS = [
  'Personagem',
  'Gênero',
  'Afiliação',
  'Jutsus',
  'Kekkei Genkai',
  'Natureza',
  'Atributos',
  'Estreia',
] as const

const STATUS_CLASSES: Record<CellStatus, string> = {
  correct: 'bg-green-600 border-green-500 text-white',
  partial: 'bg-yellow-500 border-yellow-400 text-night',
  wrong: 'bg-red-900 border-red-800 text-red-100',
}

const CELL_BASE =
  'w-[84px] h-[84px] sm:w-24 sm:h-24 rounded-md border-2 flex flex-col items-center justify-center text-center px-1 py-1 overflow-hidden'

/** Seta cheia (preenchida) grande, usada como marca d'água ao fundo da célula. */
function BigArrow({ up }: { up: boolean }) {
  const path = up
    ? 'M12 2 L22 13 H16.5 V22 H7.5 V13 H2 Z'
    : 'M12 22 L2 11 H7.5 V2 H16.5 V11 H22 Z'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="absolute inset-0 m-auto h-[88px] w-[88px] opacity-25 pointer-events-none"
      aria-label={up ? 'estreia depois' : 'estreia antes'}
    >
      <path d={path} />
    </svg>
  )
}

/** Célula de categoria com lista de valores (ou "Nenhum"). */
function ValueCell({
  values,
  status,
  delay,
}: {
  values: string[]
  status: CellStatus
  delay: number
}) {
  const shown = values.length > 0 ? values.slice(0, 4) : ['Nenhum']
  const extra = values.length - shown.length

  return (
    <motion.div
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={`${CELL_BASE} ${STATUS_CLASSES[status]}`}
      title={values.join(', ') || 'Nenhum'}
    >
      <span className="text-[9px] sm:text-[10px] font-semibold leading-tight break-words">
        {shown.join(', ')}
        {extra > 0 && `, +${extra}`}
      </span>
    </motion.div>
  )
}

// Cada coluna entra com um atraso escalonado (efeito de flip por coluna).
const STEP = 0.12

export function GuessRow({ guess }: { guess: GuessComparison }) {
  const c = guess.character
  const arc = guess.debutArc

  return (
    <div className="flex gap-1.5 sm:gap-2">
      {/* Personagem (sem cor de status) */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${CELL_BASE} bg-night-700 border-night-600`}
        title={c.name}
      >
        <CharacterAvatar character={c} size="md" className="mb-1" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-foreground leading-tight break-words">
          {c.name}
        </span>
      </motion.div>

      <ValueCell values={[c.gender]} status={guess.gender} delay={STEP} />
      <ValueCell values={c.affiliations} status={guess.affiliations} delay={STEP * 2} />
      <ValueCell values={c.jutsuTypes} status={guess.jutsuTypes} delay={STEP * 3} />
      <ValueCell values={c.kekkeiGenkai} status={guess.kekkeiGenkai} delay={STEP * 4} />
      <ValueCell values={c.natureTypes} status={guess.natureTypes} delay={STEP * 5} />
      <ValueCell values={c.attributes} status={guess.attributes} delay={STEP * 6} />

      {/* Estreia: quando errada, seta grande ao fundo aponta a direção da resposta */}
      <motion.div
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ delay: STEP * 7, duration: 0.35 }}
        className={`${CELL_BASE} relative ${STATUS_CLASSES[arc.status]}`}
        title={
          arc.status === 'correct'
            ? c.debutArc
            : `${c.debutArc} — o shinobi do dia estreia ${arc.direction === 'earlier' ? 'antes' : 'depois'}`
        }
      >
        {arc.direction && <BigArrow up={arc.direction === 'later'} />}
        <span className="relative text-[9px] sm:text-[10px] font-semibold leading-tight break-words">
          {c.debutArc}
        </span>
      </motion.div>
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
