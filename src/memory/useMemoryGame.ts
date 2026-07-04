import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lógica do jogo da memória (Arcanum), port do demo.html original.
 *
 * O estado "vivo" mora em um ref mutável (como o STATE do demo) para que os
 * setTimeout da coreografia nunca leiam valores obsoletos; a cada mutação um
 * snapshot imutável é publicado via setState para renderização. Efeitos
 * audiovisuais (sons, partículas, confete) são delegados ao componente via
 * callbacks em `effects`.
 */

export type Difficulty = 'apprentice' | 'adept' | 'master'

export interface DifficultyConfig {
  cols: number
  rows: number
  pairs: number
  maxWidth: number
  /** Título do modal de vitória */
  title: string
  /** Rótulo do botão na barra de dificuldade */
  label: string
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  apprentice: { cols: 4, rows: 4, pairs: 8, maxWidth: 480, title: 'Aprendiz Concluído', label: 'Aprendiz · 4×4' },
  adept: { cols: 6, rows: 4, pairs: 12, maxWidth: 660, title: 'Adepto Ascendido', label: 'Adepto · 6×4' },
  master: { cols: 6, rows: 6, pairs: 18, maxWidth: 720, title: 'Mestre do Arcano', label: 'Mestre · 6×6' },
}

export const DIFFICULTY_ORDER: Difficulty[] = ['apprentice', 'adept', 'master']

/** Sígilos celestes/alquímicos usados nas faces das cartas */
const SYMBOLS = ['☉', '☽', '★', '✦', '♄', '♃', '♂', '♀', '☿', '♆', '♅', '⚸', '⚹', '✧', '☄', '❋', '⚛', '◊']

/* Coreografia (ms) — valores idênticos ao demo original */
const PREVIEW_DELAY = 700
const PREVIEW_TIME = 1600
const PREVIEW_SETTLE = 650
const RESOLVE_DELAY = 720
const STREAK_FX_DELAY = 180
const VANISH_DELAY = 320
const MISS_TIME = 680
const COMPLETE_DELAY = 1100
const MODAL_DELAY = 900
/* No demo as estrelas acendiam antes do modal aparecer (faíscas invisíveis);
   aqui elas acendem depois que o modal terminou de entrar. */
const STAR_START_DELAY = 650
const STAR_STAGGER = 320
const DEAL_STAGGER = 35

export type GamePhase = 'dealing' | 'preview' | 'playing' | 'complete'

export interface MemoryGameView {
  gameId: number
  difficulty: Difficulty
  cards: string[]
  faceUp: boolean[]
  vanished: boolean[]
  miss: boolean[]
  moves: number
  streak: number
  maxStreak: number
  matchedPairs: number
  startTime: number | null
  finalSeconds: number | null
  phase: GamePhase
  modalOpen: boolean
  litStars: number
  starCount: number
}

export interface MemoryEffects {
  /** Primeira carta virada da partida (inicia timer/música) */
  onGameStart?: () => void
  onFlip?: () => void
  onMatch?: (payload: { indices: [number, number]; matchedPairs: number; streak: number }) => void
  /** Disparado com atraso quando a sequência chega a 3+ */
  onStreak?: (streak: number) => void
  /** Momento em que as cartas do par começam a flutuar/sumir */
  onVanish?: (indices: [number, number]) => void
  onMiss?: () => void
  /** Todos os pares encontrados (toca acorde de vitória) */
  onComplete?: (result: { stars: number; moves: number; seconds: number; maxStreak: number }) => void
  /** Modal de vitória ficou visível (dispara confete) */
  onModalOpen?: () => void
  /** Estrela `index` (0-based) acendeu no modal */
  onStarLit?: (index: number) => void
}

interface InternalState {
  gameId: number
  difficulty: Difficulty
  cards: string[]
  flipped: number[]
  matched: boolean[]
  vanished: boolean[]
  missPair: number[] | null
  previewing: boolean
  locked: boolean
  moves: number
  streak: number
  maxStreak: number
  matchedPairs: number
  startTime: number | null
  finalSeconds: number | null
  phase: GamePhase
  modalOpen: boolean
  litStars: number
  starCount: number
}

function buildDeck(pairs: number): string[] {
  const deck: string[] = []
  for (const sym of SYMBOLS.slice(0, pairs)) {
    deck.push(sym, sym)
  }
  // Embaralhamento Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/** Estado inicial sem cartas (e sem Math.random): o primeiro deal acontece no efeito de montagem */
function emptyState(): InternalState {
  return {
    gameId: 0,
    difficulty: 'apprentice',
    cards: [],
    flipped: [],
    matched: [],
    vanished: [],
    missPair: null,
    previewing: false,
    locked: true,
    moves: 0,
    streak: 0,
    maxStreak: 0,
    matchedPairs: 0,
    startTime: null,
    finalSeconds: null,
    phase: 'dealing',
    modalOpen: false,
    litStars: 0,
    starCount: 0,
  }
}

function freshState(difficulty: Difficulty, gameId: number): InternalState {
  const deck = buildDeck(DIFFICULTIES[difficulty].pairs)
  return {
    gameId,
    difficulty,
    cards: deck,
    flipped: [],
    matched: new Array(deck.length).fill(false),
    vanished: new Array(deck.length).fill(false),
    missPair: null,
    previewing: false,
    locked: true,
    moves: 0,
    streak: 0,
    maxStreak: 0,
    matchedPairs: 0,
    startTime: null,
    finalSeconds: null,
    phase: 'dealing',
    modalOpen: false,
    litStars: 0,
    starCount: 0,
  }
}

function toView(st: InternalState): MemoryGameView {
  const flippedSet = new Set(st.flipped)
  const missSet = new Set(st.missPair ?? [])
  return {
    gameId: st.gameId,
    difficulty: st.difficulty,
    cards: st.cards,
    faceUp: st.cards.map((_, i) => st.previewing || flippedSet.has(i) || st.matched[i]),
    vanished: st.vanished.slice(),
    miss: st.cards.map((_, i) => missSet.has(i)),
    moves: st.moves,
    streak: st.streak,
    maxStreak: st.maxStreak,
    matchedPairs: st.matchedPairs,
    startTime: st.startTime,
    finalSeconds: st.finalSeconds,
    phase: st.phase,
    modalOpen: st.modalOpen,
    litStars: st.litStars,
    starCount: st.starCount,
  }
}

export function useMemoryGame(effects: MemoryEffects) {
  const stRef = useRef<InternalState>()
  if (stRef.current == null) {
    stRef.current = emptyState()
  }
  const [view, setView] = useState<MemoryGameView>(() => toView(stRef.current!))

  const fxRef = useRef(effects)
  fxRef.current = effects

  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const sync = useCallback(() => {
    setView(toView(stRef.current!))
  }, [])

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id)
      fn()
    }, ms)
    timeoutsRef.current.add(id)
  }, [])

  const clearPending = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id)
    timeoutsRef.current.clear()
  }, [])

  const newGame = useCallback(
    (difficulty?: Difficulty) => {
      const st = stRef.current!
      clearPending()
      stRef.current = freshState(difficulty ?? st.difficulty, st.gameId + 1)
      sync()

      // Prévia: mostra todas as cartas brevemente, depois esconde e libera
      after(PREVIEW_DELAY, () => {
        stRef.current!.previewing = true
        stRef.current!.phase = 'preview'
        sync()
      })
      after(PREVIEW_DELAY + PREVIEW_TIME, () => {
        stRef.current!.previewing = false
        sync()
      })
      after(PREVIEW_DELAY + PREVIEW_TIME + PREVIEW_SETTLE, () => {
        stRef.current!.locked = false
        stRef.current!.phase = 'playing'
        sync()
      })
    },
    [after, clearPending, sync]
  )

  const resolvePair = useCallback(() => {
    const st = stRef.current!
    const [a, b] = st.flipped
    const isMatch = st.cards[a] === st.cards[b]

    if (isMatch) {
      st.matched[a] = true
      st.matched[b] = true
      st.matchedPairs++
      st.streak++
      st.maxStreak = Math.max(st.maxStreak, st.streak)
      st.flipped = []

      fxRef.current.onMatch?.({ indices: [a, b], matchedPairs: st.matchedPairs, streak: st.streak })

      if (st.streak >= 3) {
        const s = st.streak
        after(STREAK_FX_DELAY, () => fxRef.current.onStreak?.(s))
      }

      after(VANISH_DELAY, () => {
        const cur = stRef.current!
        cur.vanished[a] = true
        cur.vanished[b] = true
        sync()
        fxRef.current.onVanish?.([a, b])
      })

      const total = DIFFICULTIES[st.difficulty].pairs
      if (st.matchedPairs === total) {
        // Vitória: congela tempo/tabuleiro e agenda modal + estrelas
        st.phase = 'complete'
        st.locked = true
        st.finalSeconds = st.startTime ? Math.floor((Date.now() - st.startTime) / 1000) : 0
        const ratio = st.moves / total
        st.starCount = ratio <= 1.6 ? 3 : ratio <= 2.3 ? 2 : 1
        sync()

        after(COMPLETE_DELAY, () => {
          const cur = stRef.current!
          fxRef.current.onComplete?.({
            stars: cur.starCount,
            moves: cur.moves,
            seconds: cur.finalSeconds ?? 0,
            maxStreak: cur.maxStreak,
          })

          after(MODAL_DELAY, () => {
            stRef.current!.modalOpen = true
            sync()
            fxRef.current.onModalOpen?.()

            for (let i = 0; i < stRef.current!.starCount; i++) {
              after(STAR_START_DELAY + i * STAR_STAGGER, () => {
                stRef.current!.litStars = i + 1
                sync()
                fxRef.current.onStarLit?.(i)
              })
            }
          })
        })
      } else {
        st.locked = false
        sync()
      }
    } else {
      st.streak = 0
      st.missPair = [a, b]
      sync()
      fxRef.current.onMiss?.()

      after(MISS_TIME, () => {
        const cur = stRef.current!
        cur.missPair = null
        cur.flipped = []
        cur.locked = false
        sync()
      })
    }
  }, [after, sync])

  const flipCard = useCallback(
    (idx: number) => {
      const st = stRef.current!
      if (st.locked || st.phase === 'complete' || st.previewing) return
      if (st.flipped.includes(idx) || st.matched[idx]) return

      if (st.startTime === null) {
        st.startTime = Date.now()
        fxRef.current.onGameStart?.()
      }

      fxRef.current.onFlip?.()
      st.flipped = [...st.flipped, idx]

      if (st.flipped.length === 2) {
        st.locked = true
        st.moves++
        sync()
        after(RESOLVE_DELAY, resolvePair)
      } else {
        sync()
      }
    },
    [after, resolvePair, sync]
  )

  const setDifficulty = useCallback(
    (difficulty: Difficulty) => {
      newGame(difficulty)
    },
    [newGame]
  )

  const reset = useCallback(() => {
    newGame()
  }, [newGame])

  // Distribuição inicial + limpeza de timeouts ao desmontar a rota
  useEffect(() => {
    newGame('apprentice')
    return clearPending
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { view, flipCard, setDifficulty, reset, dealStagger: DEAL_STAGGER }
}
