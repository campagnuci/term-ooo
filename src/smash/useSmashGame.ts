// src/smash/useSmashGame.ts
// Estado do Smashdle: palpites do dia (persistidos por dateKey), vitória e
// estatísticas de sequência. Palpites são ilimitados.

import { useCallback, useMemo, useState } from 'react'
import { getDayNumber, getTodayDateKey } from '@/lib/dates'
import {
  SmashCharacter,
  GuessComparison,
  compareGuess,
  getCharacterById,
  getDailyCharacter,
} from './smash-engine'

const STATE_PREFIX = 'smashdle:state'
const STATS_KEY = 'smashdle:stats'

interface PersistedDay {
  dateKey: string
  guessIds: number[]
}

export interface SmashdleStats {
  wins: number
  currentStreak: number
  maxStreak: number
  /** dayNumber da última vitória, para calcular a sequência. */
  lastWinDay: number | null
}

const EMPTY_STATS: SmashdleStats = { wins: 0, currentStreak: 0, maxStreak: 0, lastWinDay: null }

function loadGuessIds(dateKey: string): number[] {
  try {
    const raw = localStorage.getItem(`${STATE_PREFIX}:${dateKey}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PersistedDay
    return Array.isArray(parsed.guessIds) ? parsed.guessIds : []
  } catch {
    return []
  }
}

function saveGuessIds(dateKey: string, guessIds: number[]) {
  try {
    localStorage.setItem(`${STATE_PREFIX}:${dateKey}`, JSON.stringify({ dateKey, guessIds }))
  } catch {
    // localStorage cheio/indisponível: o jogo segue sem persistência
  }
}

function loadStats(): SmashdleStats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? { ...EMPTY_STATS, ...JSON.parse(raw) } : EMPTY_STATS
  } catch {
    return EMPTY_STATS
  }
}

export function useSmashGame() {
  // Capturados uma vez por montagem; a virada de meia-noite recarrega a página
  // via countdown, então não precisam ser reativos.
  const [dateKey] = useState(getTodayDateKey)
  const [dayNumber] = useState(getDayNumber)

  const answer = useMemo(() => getDailyCharacter(dayNumber), [dayNumber])
  const yesterday = useMemo(
    () => (dayNumber > 1 ? getDailyCharacter(dayNumber - 1) : null),
    [dayNumber]
  )

  const [guessIds, setGuessIds] = useState<number[]>(() => loadGuessIds(dateKey))
  const [stats, setStats] = useState<SmashdleStats>(loadStats)

  // Mais recente primeiro
  const guesses: GuessComparison[] = useMemo(
    () =>
      guessIds
        .map(id => getCharacterById(id))
        .filter((c): c is SmashCharacter => c != null)
        .map(c => compareGuess(c, answer))
        .reverse(),
    [guessIds, answer]
  )

  const isWin = guesses.some(g => g.isWin)
  const guessedIds = useMemo(() => new Set(guessIds), [guessIds])

  const addGuess = useCallback(
    (character: SmashCharacter) => {
      if (isWin || guessedIds.has(character.id)) return

      const next = [...guessIds, character.id]
      setGuessIds(next)
      saveGuessIds(dateKey, next)

      if (character.id === answer.id) {
        setStats(prev => {
          const streak = prev.lastWinDay === dayNumber - 1 ? prev.currentStreak + 1 : 1
          const updated: SmashdleStats = {
            wins: prev.wins + 1,
            currentStreak: streak,
            maxStreak: Math.max(prev.maxStreak, streak),
            lastWinDay: dayNumber,
          }
          try {
            localStorage.setItem(STATS_KEY, JSON.stringify(updated))
          } catch {
            // sem persistência, segue o jogo
          }
          return updated
        })
      }
    },
    [isWin, guessedIds, guessIds, dateKey, answer.id, dayNumber]
  )

  return {
    dayNumber,
    answer,
    yesterday,
    guesses,
    guessedIds,
    guessCount: guessIds.length,
    isWin,
    stats,
    addGuess,
  }
}
