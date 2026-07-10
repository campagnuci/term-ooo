// src/pokemon/usePokemonGame.ts
// Estado do Pokédle. Suporta dois ritmos por modo:
//   • Diário: Pokémon determinístico do dia, palpites persistidos por
//     (modo, dateKey) e sequência (streak) salva por modo.
//   • Treino: Pokémon aleatório, "jogar de novo" ilimitado, estatísticas
//     apenas da sessão (não persistidas). Palpites sempre ilimitados.

import { useCallback, useMemo, useState } from 'react'
import { getDayNumber, getTodayDateKey } from '@/lib/dates'
import {
  Pokemon,
  PokemonMode,
  GuessComparison,
  compareGuess,
  getDailyPokemon,
  getPokemonById,
  getRandomPokemon,
  getModeConfig,
} from './pokemon-engine'

const STATE_PREFIX = 'pokedle:state'
const STATS_PREFIX = 'pokedle:stats'

export interface DailyStats {
  wins: number
  currentStreak: number
  maxStreak: number
  /** dayNumber da última vitória, para calcular a sequência. */
  lastWinDay: number | null
}

export interface SessionStats {
  played: number
  /** Menor número de tentativas para vencer nesta sessão. */
  bestGuesses: number | null
}

const EMPTY_DAILY: DailyStats = { wins: 0, currentStreak: 0, maxStreak: 0, lastWinDay: null }

function stateKey(mode: PokemonMode, dateKey: string) {
  return `${STATE_PREFIX}:${mode}:${dateKey}`
}

function statsKey(mode: PokemonMode) {
  return `${STATS_PREFIX}:${mode}`
}

function loadGuessIds(mode: PokemonMode, dateKey: string): number[] {
  try {
    const raw = localStorage.getItem(stateKey(mode, dateKey))
    if (!raw) return []
    const parsed = JSON.parse(raw) as { guessIds: number[] }
    return Array.isArray(parsed.guessIds) ? parsed.guessIds : []
  } catch {
    return []
  }
}

function saveGuessIds(mode: PokemonMode, dateKey: string, guessIds: number[]) {
  try {
    localStorage.setItem(stateKey(mode, dateKey), JSON.stringify({ guessIds }))
  } catch {
    // localStorage cheio/indisponível: o jogo segue sem persistência
  }
}

function loadDailyStats(mode: PokemonMode): DailyStats {
  try {
    const raw = localStorage.getItem(statsKey(mode))
    return raw ? { ...EMPTY_DAILY, ...JSON.parse(raw) } : EMPTY_DAILY
  } catch {
    return EMPTY_DAILY
  }
}

interface UsePokemonGameArgs {
  mode: PokemonMode
  isDaily: boolean
}

export function usePokemonGame({ mode, isDaily }: UsePokemonGameArgs) {
  const config = useMemo(() => getModeConfig(mode), [mode])

  // Capturados uma vez por montagem; a virada de meia-noite recarrega a página.
  const [dateKey] = useState(getTodayDateKey)
  const [dayNumber] = useState(getDayNumber)

  // Resposta: diária determinística ou aleatória (treino, regenerável).
  const [practiceAnswer, setPracticeAnswer] = useState<Pokemon | null>(() =>
    isDaily ? null : getRandomPokemon(mode)
  )
  const answer = useMemo(
    () => (isDaily ? getDailyPokemon(mode, dayNumber) : practiceAnswer!),
    [isDaily, mode, dayNumber, practiceAnswer]
  )

  const [guessIds, setGuessIds] = useState<number[]>(() =>
    isDaily ? loadGuessIds(mode, dateKey) : []
  )
  const [dailyStats, setDailyStats] = useState<DailyStats>(() =>
    isDaily ? loadDailyStats(mode) : EMPTY_DAILY
  )
  const [sessionStats, setSessionStats] = useState<SessionStats>({ played: 0, bestGuesses: null })

  // Mais recente primeiro
  const guesses: GuessComparison[] = useMemo(
    () =>
      guessIds
        .map(id => getPokemonById(id))
        .filter((p): p is Pokemon => p != null)
        .map(p => compareGuess(p, answer))
        .reverse(),
    [guessIds, answer]
  )

  const isWin = guesses.some(g => g.isWin)
  const guessedIds = useMemo(() => new Set(guessIds), [guessIds])

  const addGuess = useCallback(
    (pokemon: Pokemon) => {
      if (isWin || guessedIds.has(pokemon.id)) return

      const next = [...guessIds, pokemon.id]
      setGuessIds(next)
      if (isDaily) saveGuessIds(mode, dateKey, next)

      if (pokemon.id === answer.id) {
        const attempts = next.length
        if (isDaily) {
          setDailyStats(prev => {
            const streak = prev.lastWinDay === dayNumber - 1 ? prev.currentStreak + 1 : 1
            const updated: DailyStats = {
              wins: prev.wins + 1,
              currentStreak: streak,
              maxStreak: Math.max(prev.maxStreak, streak),
              lastWinDay: dayNumber,
            }
            try {
              localStorage.setItem(statsKey(mode), JSON.stringify(updated))
            } catch {
              // sem persistência, segue o jogo
            }
            return updated
          })
        } else {
          setSessionStats(prev => ({
            played: prev.played + 1,
            bestGuesses: prev.bestGuesses == null ? attempts : Math.min(prev.bestGuesses, attempts),
          }))
        }
      }
    },
    [isWin, guessedIds, guessIds, isDaily, mode, dateKey, answer.id, dayNumber]
  )

  const playAgain = useCallback(() => {
    if (isDaily) return
    setPracticeAnswer(prev => getRandomPokemon(mode, prev?.id))
    setGuessIds([])
  }, [isDaily, mode])

  return {
    mode,
    config,
    isDaily,
    dayNumber,
    answer,
    guesses,
    guessedIds,
    guessCount: guessIds.length,
    isWin,
    addGuess,
    playAgain,
    dailyStats,
    sessionStats,
  }
}
