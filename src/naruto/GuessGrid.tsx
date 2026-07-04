// src/naruto/GuessGrid.tsx
// Grade de palpites: uma linha por personagem, uma célula colorida por
// categoria. Linhas novas entram com animação de flip escalonada por coluna.

import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp } from 'lucide-react'
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

export function GuessRow({ guess }: { guess: GuessComparison }) {
  const c = guess.character
  const arc = guess.debutArc
  let delay = 0
  const next = () => (delay += 0.12)

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

      <ValueCell values={[c.gender]} status={guess.gender} delay={next()} />
      <ValueCell values={c.affiliations} status={guess.affiliations} delay={next()} />
      <ValueCell values={c.jutsuTypes} status={guess.jutsuTypes} delay={next()} />
      <ValueCell values={c.kekkeiGenkai} status={guess.kekkeiGenkai} delay={next()} />
      <ValueCell values={c.natureTypes} status={guess.natureTypes} delay={next()} />
      <ValueCell values={c.attributes} status={guess.attributes} delay={next()} />

      {/* Estreia: quando errada, seta aponta a direção da resposta na linha do tempo */}
      <motion.div
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ delay: next(), duration: 0.35 }}
        className={`${CELL_BASE} ${STATUS_CLASSES[arc.status]}`}
        title={
          arc.status === 'correct'
            ? c.debutArc
            : `${c.debutArc} — o shinobi do dia estreia ${arc.direction === 'earlier' ? 'antes' : 'depois'}`
        }
      >
        {arc.direction === 'earlier' && <ArrowDown className="w-4 h-4 mb-0.5" aria-label="estreia antes" />}
        {arc.direction === 'later' && <ArrowUp className="w-4 h-4 mb-0.5" aria-label="estreia depois" />}
        <span className="text-[9px] sm:text-[10px] font-semibold leading-tight break-words">
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
