import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMode, GameState, Stats } from '@/game/types'
import { createInitialGameState, getDayNumber, getRandomDayNumber } from '@/game/engine'
import { getTodayDateKey } from '@/lib/utils'
import { storage } from '@/game/storage'

// Chave fixa do localStorage para o Modo Treino (não vinculada ao dia)
const TRAINING_DATE_KEY = 'treino'
// Modo Treino é sempre uma variante de Termo (1 tabuleiro)
const TRAINING_MODE: GameMode = 'termo'

interface UsePersistentGameStateOptions {
  mode: GameMode
  customDayNumber: number | null
  isTraining: boolean
  animActions: { setCursorPosition: (position: number) => void }
  onCompletedGameLoad?: () => void
}

interface UsePersistentGameStateResult {
  gameState: GameState | null
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>
  stats: Stats | null
  setStats: React.Dispatch<React.SetStateAction<Stats | null>>
  /** Inicia uma nova partida de treino com palavra aleatória (botão "Jogar de novo"). */
  startNewTrainingGame: () => void
}

export function usePersistentGameState({
  mode,
  customDayNumber,
  isTraining,
  animActions,
  onCompletedGameLoad
}: UsePersistentGameStateOptions): UsePersistentGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const completedGameLoadRef = useRef(onCompletedGameLoad)

  useEffect(() => {
    completedGameLoadRef.current = onCompletedGameLoad
  }, [onCompletedGameLoad])

  // Cria e persiste uma nova partida de treino com palavra sorteada
  const startNewTrainingGame = useCallback(() => {
    const randomDay = getRandomDayNumber(TRAINING_MODE)
    const newState = createInitialGameState(TRAINING_MODE, randomDay, TRAINING_DATE_KEY)
    setGameState(newState)
    storage.saveGameState(TRAINING_MODE, TRAINING_DATE_KEY, newState)
    animActions.setCursorPosition(0)
  }, [animActions])

  useEffect(() => {
    // Modo Treino: palavra aleatória, sem vínculo com o dia.
    // Retoma uma partida em andamento; caso contrário, sorteia uma nova.
    if (isTraining) {
      const savedState = storage.getGameState(TRAINING_MODE, TRAINING_DATE_KEY)
      if (savedState && savedState.dateKey === TRAINING_DATE_KEY && !savedState.isGameOver) {
        setGameState(savedState)
        const firstEmpty = savedState.currentGuess.findIndex((c) => c === '')
        animActions.setCursorPosition(firstEmpty === -1 ? 5 : firstEmpty)
      } else {
        startNewTrainingGame()
      }

      setStats(storage.getStats(TRAINING_MODE))
      return
    }

    const actualDayNumber = customDayNumber || getDayNumber()
    const isArchive = customDayNumber !== null
    const dateKey = isArchive ? `archive-${actualDayNumber}` : getTodayDateKey()

    const savedState = storage.getGameState(mode, dateKey)
    const isValidState =
      savedState &&
      savedState.dateKey === dateKey &&
      savedState.dayNumber === actualDayNumber

    if (isValidState) {
      setGameState(savedState)
      const firstEmpty = savedState.currentGuess.findIndex((c) => c === '')
      animActions.setCursorPosition(firstEmpty === -1 ? 5 : firstEmpty)

      if (savedState.isGameOver) {
        completedGameLoadRef.current?.()
      }
    } else {
      const newState = createInitialGameState(mode, actualDayNumber, dateKey)
      setGameState(newState)
      storage.saveGameState(mode, dateKey, newState)
      animActions.setCursorPosition(0)
    }

    const currentModeStats = storage.getStats(mode)
    setStats(currentModeStats)
  }, [mode, customDayNumber, isTraining, animActions, startNewTrainingGame])

  return { gameState, setGameState, stats, setStats, startNewTrainingGame }
}
