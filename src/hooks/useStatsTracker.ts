import { Dispatch, SetStateAction, useEffect } from 'react'
import { GameMode, GameState, Stats } from '@/game/types'
import { storage } from '@/game/storage'

interface UseStatsTrackerOptions {
  gameState: GameState | null
  mode: GameMode
  customDayNumber: number | null
  isTraining: boolean
  setStats: Dispatch<SetStateAction<Stats | null>>
}

export function useStatsTracker({ gameState, mode, customDayNumber, isTraining, setStats }: UseStatsTrackerOptions) {
  useEffect(() => {
    if (!gameState || !gameState.isGameOver || gameState.currentRow <= 0) {
      return
    }

    if (gameState.mode !== mode) {
      return
    }

    // Treino e Arquivo não contam para as estatísticas/streak diárias
    if (isTraining || customDayNumber !== null) {
      return
    }

    const currentStats = storage.getStats(mode)

    if (currentStats.lastGame?.dateKey === gameState.dateKey) {
      return
    }

    // Tempo gasto na resolução (apenas vitórias cronometradas entram na média)
    const hasTiming = gameState.startTime != null && gameState.endTime != null
    const solveMs = hasTiming ? Math.max(0, gameState.endTime! - gameState.startTime!) : 0
    const countsForAverage = gameState.isWin && hasTiming

    const newStats: Stats = {
      gamesPlayed: currentStats.gamesPlayed + 1,
      gamesWon: currentStats.gamesWon + (gameState.isWin ? 1 : 0),
      currentStreak: gameState.isWin ? currentStats.currentStreak + 1 : 0,
      maxStreak: gameState.isWin
        ? Math.max(currentStats.currentStreak + 1, currentStats.maxStreak)
        : currentStats.maxStreak,
      guessDistribution: [...currentStats.guessDistribution],
      totalSolveTimeMs: (currentStats.totalSolveTimeMs ?? 0) + (countsForAverage ? solveMs : 0),
      solveCount: (currentStats.solveCount ?? 0) + (countsForAverage ? 1 : 0),
      lastGame: {
        won: gameState.isWin,
        attempts: gameState.currentRow,
        dateKey: gameState.dateKey,
      },
    }

    const attemptIndex = gameState.isWin ? gameState.currentRow - 1 : newStats.guessDistribution.length - 1
    newStats.guessDistribution[attemptIndex]++

    storage.saveStats(mode, newStats)
    setStats(newStats)
  }, [customDayNumber, isTraining, gameState, mode, setStats])
}
