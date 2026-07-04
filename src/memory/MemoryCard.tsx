import { memo } from 'react'
import styles from './memory.module.css'

interface MemoryCardProps {
  index: number
  symbol: string
  faceUp: boolean
  vanished: boolean
  miss: boolean
  /** Atraso (ms) da animação de entrada, escalonado por índice */
  dealDelay: number
  onFlip: (index: number) => void
  onRegister: (index: number, el: HTMLButtonElement | null) => void
}

/**
 * Carta do tabuleiro. Memoizada com props primitivas: a cada tick do jogo
 * só re-renderizam as cartas cujo estado visual realmente mudou.
 */
export const MemoryCard = memo(function MemoryCard({
  index,
  symbol,
  faceUp,
  vanished,
  miss,
  dealDelay,
  onFlip,
  onRegister,
}: MemoryCardProps) {
  const classes = [styles.card, styles.dealing]
  if (faceUp) classes.push(styles.flipped)
  if (vanished) classes.push(styles.matched, styles.vanished)
  if (miss) classes.push(styles.miss)

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={{ animationDelay: `${dealDelay}ms` }}
      aria-label={`Carta ${index + 1}`}
      onClick={() => onFlip(index)}
      ref={(el) => onRegister(index, el)}
    >
      <div className={styles.cardInner}>
        <div className={`${styles.cardFace} ${styles.cardBack}`}>
          <svg className={styles.cardBackSeal} viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(232,182,90,0.55)" strokeWidth="0.6" />
            <circle cx="30" cy="30" r="18" fill="none" stroke="rgba(232,182,90,0.4)" strokeWidth="0.4" />
            <circle cx="30" cy="30" r="12" fill="none" stroke="rgba(232,182,90,0.3)" strokeWidth="0.4" />
            <path
              d="M30 6 L33 27 L54 30 L33 33 L30 54 L27 33 L6 30 L27 27 Z"
              fill="rgba(232,182,90,0.45)"
              stroke="rgba(244,210,122,0.7)"
              strokeWidth="0.4"
            />
            <circle cx="30" cy="30" r="2.5" fill="rgba(244,210,122,0.9)" />
            <circle cx="30" cy="6" r="1" fill="rgba(232,182,90,0.7)" />
            <circle cx="30" cy="54" r="1" fill="rgba(232,182,90,0.7)" />
            <circle cx="6" cy="30" r="1" fill="rgba(232,182,90,0.7)" />
            <circle cx="54" cy="30" r="1" fill="rgba(232,182,90,0.7)" />
          </svg>
        </div>
        <div className={`${styles.cardFace} ${styles.cardFront}`}>
          <span className={styles.cardSymbol}>{symbol}</span>
        </div>
      </div>
    </button>
  )
})
