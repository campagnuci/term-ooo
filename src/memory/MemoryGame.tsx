import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import styles from './memory.module.css'
import { MemoryAudioEngine } from './audio'
import { ParticleField } from './particles'
import { MemoryConfetti } from './confetti'
import { Starfield } from './Starfield'
import { MemoryCard } from './MemoryCard'
import { DIFFICULTIES, DIFFICULTY_ORDER, useMemoryGame } from './useMemoryGame'
import { APP_VERSION } from '@/lib/version'

const MUSIC_OFF_KEY = 'memoria:music-off'

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Cronômetro isolado: o tick re-renderiza só este componente, não o tabuleiro.
 * Deve ser montado com key por partida para zerar o tempo exibido.
 */
function TimerStat({ startTime, finalSeconds }: { startTime: number | null; finalSeconds: number | null }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startTime === null || finalSeconds !== null) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 250)
    return () => clearInterval(id)
  }, [startTime, finalSeconds])

  return <div className={styles.statValue}>{formatTime(finalSeconds ?? elapsed)}</div>
}

function centerOf(el: Element): [number, number] {
  const r = el.getBoundingClientRect()
  return [r.left + r.width / 2, r.top + r.height / 2]
}

export default function MemoryGame() {
  // Instâncias por montagem (áudio, partículas, confete)
  const audioRef = useRef<MemoryAudioEngine>()
  if (audioRef.current == null) audioRef.current = new MemoryAudioEngine()
  const fieldRef = useRef<ParticleField>()
  if (fieldRef.current == null) fieldRef.current = new ParticleField()
  const confettiRef = useRef<MemoryConfetti>()
  if (confettiRef.current == null) confettiRef.current = new MemoryConfetti()

  const fxCanvasRef = useRef<HTMLCanvasElement>(null)
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)
  const streakStatRef = useRef<HTMLDivElement>(null)
  const cardEls = useRef(new Map<number, HTMLButtonElement>())
  const starEls = useRef(new Map<number, HTMLDivElement>())

  const [musicOn, setMusicOn] = useState(false)
  const userDisabledMusicRef = useRef(localStorage.getItem(MUSIC_OFF_KEY) === '1')

  const fxIdRef = useRef(0)
  const [streakBanner, setStreakBanner] = useState<{ id: number; count: number } | null>(null)
  const [flashId, setFlashId] = useState<number | null>(null)

  const { view, flipCard, setDifficulty, reset, dealStagger } = useMemoryGame({
    onGameStart: () => {
      const audio = audioRef.current!
      audio.init()
      audio.resume()
      // Música começa na primeira interação, a menos que o jogador a tenha desligado
      if (!audio.musicPlaying && !userDisabledMusicRef.current) {
        audio.startMusic()
        setMusicOn(true)
      }
    },
    onFlip: () => {
      const audio = audioRef.current!
      audio.init()
      audio.resume()
      audio.playFlip()
    },
    onMatch: ({ matchedPairs }) => {
      // O sino sobe de tom a cada par encontrado
      const baseFreq = 523.25 * Math.pow(2, Math.min(matchedPairs - 1, 8) / 12)
      audioRef.current!.playChime(baseFreq)
    },
    onStreak: (streak) => {
      audioRef.current!.playStreakFanfare(streak)
      setStreakBanner({ id: ++fxIdRef.current, count: streak })
      setFlashId(++fxIdRef.current)
      if (streakStatRef.current) {
        const [cx, cy] = centerOf(streakStatRef.current)
        fieldRef.current!.streakBurst(cx, cy)
      }
    },
    onVanish: (indices) => {
      for (const i of indices) {
        const el = cardEls.current.get(i)
        if (el) {
          const [cx, cy] = centerOf(el)
          fieldRef.current!.burst(cx, cy)
        }
      }
    },
    onMiss: () => audioRef.current!.playMiss(),
    onComplete: () => audioRef.current!.playCompletion(),
    onModalOpen: () => confettiRef.current!.celebrate(),
    onStarLit: (i) => {
      const el = starEls.current.get(i)
      if (el) {
        const [cx, cy] = centerOf(el)
        fieldRef.current!.sparkle(cx, cy)
      }
    },
  })

  // Liga canvases e libera tudo ao sair da rota
  useEffect(() => {
    const field = fieldRef.current!
    const confetti = confettiRef.current!
    const audio = audioRef.current!
    if (fxCanvasRef.current) field.attach(fxCanvasRef.current)
    if (confettiCanvasRef.current) confetti.attach(confettiCanvasRef.current)
    return () => {
      field.detach()
      confetti.detach()
      audio.dispose()
    }
  }, [])

  useEffect(() => {
    const prev = document.title
    document.title = 'Memória — Arcanum | enresshou.dev'
    return () => {
      document.title = prev
    }
  }, [])

  const registerCard = useCallback((index: number, el: HTMLButtonElement | null) => {
    if (el) cardEls.current.set(index, el)
    else cardEls.current.delete(index)
  }, [])

  const registerStar = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) starEls.current.set(index, el)
    else starEls.current.delete(index)
  }, [])

  const toggleMusic = () => {
    const audio = audioRef.current!
    audio.init()
    audio.resume()
    if (audio.musicPlaying) {
      audio.stopMusic()
      setMusicOn(false)
      userDisabledMusicRef.current = true
      localStorage.setItem(MUSIC_OFF_KEY, '1')
    } else {
      audio.startMusic()
      setMusicOn(true)
      userDisabledMusicRef.current = false
      localStorage.setItem(MUSIC_OFF_KEY, '0')
    }
  }

  const handleRestart = () => {
    confettiRef.current!.cancel()
    reset()
  }

  const handleDifficulty = (d: (typeof DIFFICULTY_ORDER)[number]) => {
    confettiRef.current!.cancel()
    setDifficulty(d)
  }

  const diff = DIFFICULTIES[view.difficulty]

  return (
    <div className={styles.page}>
      <div className={styles.aurora} />
      <Starfield className={styles.starfield} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <svg className={styles.brandSeal} viewBox="0 0 56 56" aria-hidden="true">
              <defs>
                <linearGradient id="memSealGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#eafbe0" />
                  <stop offset="0.5" stopColor="#b2d98b" />
                  <stop offset="1" stopColor="#1d665d" />
                </linearGradient>
              </defs>
              <circle cx="28" cy="28" r="26" fill="none" stroke="url(#memSealGrad)" strokeWidth="1" />
              <circle cx="28" cy="28" r="20" fill="none" stroke="url(#memSealGrad)" strokeWidth="0.6" opacity="0.6" />
              <circle cx="28" cy="28" r="14" fill="none" stroke="url(#memSealGrad)" strokeWidth="0.5" opacity="0.4" />
              <path d="M28 4 L28 52 M4 28 L52 28" stroke="url(#memSealGrad)" strokeWidth="0.4" opacity="0.5" />
              <path d="M11 11 L45 45 M45 11 L11 45" stroke="url(#memSealGrad)" strokeWidth="0.3" opacity="0.4" />
              <circle cx="28" cy="28" r="3.5" fill="url(#memSealGrad)" />
              <circle cx="28" cy="6" r="1.5" fill="url(#memSealGrad)" />
              <circle cx="28" cy="50" r="1.5" fill="url(#memSealGrad)" />
              <circle cx="6" cy="28" r="1.5" fill="url(#memSealGrad)" />
              <circle cx="50" cy="28" r="1.5" fill="url(#memSealGrad)" />
            </svg>
            <div className={styles.brandText}>
              <h1>ARCANUM</h1>
              <p>Memória das Esferas</p>
            </div>
          </div>

          <div className={styles.statsBar}>
            <div
              ref={streakStatRef}
              className={view.streak >= 3 ? `${styles.stat} ${styles.streakActive}` : styles.stat}
            >
              <div className={styles.statLabel}>Sequência</div>
              <div className={styles.statValue}>{view.streak}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Jogadas</div>
              <div className={styles.statValue}>{view.moves}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Pares</div>
              <div className={styles.statValue}>
                {view.matchedPairs}/{diff.pairs}
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Tempo</div>
              <TimerStat key={view.gameId} startTime={view.startTime} finalSeconds={view.finalSeconds} />
            </div>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={musicOn ? `${styles.btn} ${styles.btnActive}` : styles.btn}
              onClick={toggleMusic}
              aria-label={musicOn ? 'Desligar música' : 'Ligar música'}
            >
              <span className={styles.musicIconStatic} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </span>
              <span className={styles.musicWave} aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
              <span>{musicOn ? 'Tocando' : 'Música'}</span>
            </button>
            <button type="button" className={styles.btn} onClick={handleRestart} aria-label="Reiniciar jogo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
              <span>Reiniciar</span>
            </button>
            <Link to="/" className={styles.btn} aria-label="Voltar ao início">
              <Home size={14} aria-hidden="true" />
              <span>Início</span>
            </Link>
          </div>
        </header>

        <section className={styles.boardContainer}>
          <div
            key={view.gameId}
            className={styles.board}
            style={{
              gridTemplateColumns: `repeat(${diff.cols}, minmax(0, 1fr))`,
              maxWidth: `${diff.maxWidth}px`,
            }}
            role="grid"
            aria-label="Tabuleiro do jogo da memória"
          >
            {view.cards.map((symbol, idx) => (
              <MemoryCard
                key={idx}
                index={idx}
                symbol={symbol}
                faceUp={view.faceUp[idx]}
                vanished={view.vanished[idx]}
                miss={view.miss[idx]}
                dealDelay={idx * dealStagger}
                onFlip={flipCard}
                onRegister={registerCard}
              />
            ))}
          </div>
        </section>

        <footer className={styles.difficultyBar}>
          <span className={styles.difficultyLabel}>Caminho</span>
          {DIFFICULTY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              className={view.difficulty === d ? `${styles.btn} ${styles.btnActive}` : styles.btn}
              onClick={() => handleDifficulty(d)}
            >
              {DIFFICULTIES[d].label}
            </button>
          ))}
        </footer>
      </main>

      {streakBanner && (
        <div
          key={streakBanner.id}
          className={styles.streakText}
          onAnimationEnd={() => setStreakBanner(null)}
          aria-hidden="true"
        >
          SEQUÊNCIA ×{streakBanner.count}
        </div>
      )}
      {flashId !== null && (
        <div key={flashId} className={styles.edgeFlash} onAnimationEnd={() => setFlashId(null)} />
      )}

      <div
        className={
          view.modalOpen ? `${styles.modalOverlay} ${styles.modalOverlayActive}` : styles.modalOverlay
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="memModalTitle"
        aria-hidden={!view.modalOpen}
      >
        <div className={styles.modal}>
          <svg className={styles.modalRune} viewBox="0 0 56 56" aria-hidden="true">
            <defs>
              <linearGradient id="memRuneGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#eafbe0" />
                <stop offset="0.5" stopColor="#b2d98b" />
                <stop offset="1" stopColor="#1d665d" />
              </linearGradient>
            </defs>
            <circle cx="28" cy="28" r="24" fill="none" stroke="url(#memRuneGrad)" strokeWidth="1" />
            <path
              d="M28 8 L34 28 L52 28 L38 40 L44 56 L28 46 L12 56 L18 40 L4 28 L22 28 Z"
              fill="url(#memRuneGrad)"
              opacity="0.85"
            />
          </svg>
          <h2 id="memModalTitle">{diff.title}</h2>
          <p className={styles.modalSubtitle}>O cosmos se alinha a seu favor</p>

          <div className={styles.scoreRow}>
            <span className={styles.scoreLabel}>Pontuação: </span>
            <span className={styles.scoreValue}>{view.score}</span>
          </div>
          <p className={styles.scoreBreakdown}>
            Precisão {view.scoreEfficiency} · Tempo {view.scoreTime}
          </p>

          <div className={styles.starsRow}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                ref={(el) => registerStar(i, el)}
                className={i < view.litStars ? `${styles.star} ${styles.starLit}` : styles.star}
              >
                <svg viewBox="0 0 60 60" width="64" height="64">
                  <defs>
                    <linearGradient id={`memStarGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#eafbe0" />
                      <stop offset="0.5" stopColor="#b2d98b" />
                      <stop offset="1" stopColor="#1d665d" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M30 4 L37 22 L56 22 L41 33 L47 52 L30 41 L13 52 L19 33 L4 22 L23 22 Z"
                    fill={`url(#memStarGrad${i})`}
                    stroke="#eafbe0"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>
            ))}
          </div>

          <div className={styles.modalStats}>
            <div>
              <div className={styles.modalStatValue}>{view.moves}</div>
              <div className={styles.modalStatLabel}>Jogadas</div>
            </div>
            <div>
              <div className={styles.modalStatValue}>{formatTime(view.finalSeconds ?? 0)}</div>
              <div className={styles.modalStatLabel}>Tempo</div>
            </div>
            <div>
              <div className={styles.modalStatValue}>{view.maxStreak}</div>
              <div className={styles.modalStatLabel}>Melhor Seq.</div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleRestart}>
              Jogar Novamente
            </button>
            <Link to="/" className={styles.btn}>
              <Home size={14} aria-hidden="true" />
              <span>Início</span>
            </Link>
          </div>
        </div>
      </div>

      <canvas ref={fxCanvasRef} className={styles.fxCanvas} aria-hidden="true" />
      <canvas ref={confettiCanvasRef} className={styles.confettiCanvas} aria-hidden="true" />

      <div className={styles.versionBadge}>v{APP_VERSION}</div>
    </div>
  )
}
