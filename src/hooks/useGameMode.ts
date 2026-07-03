import { useEffect, useState } from 'react'
import { NavigateFunction, Location } from 'react-router-dom'
import { GameMode } from '@/game/types'
import { getDayNumber } from '@/game/engine'
import { getModeFromPath, TRAINING_PATH } from '@/lib/routes'

interface UseGameModeOptions {
  location: Location
  navigate: NavigateFunction
}

interface UseGameModeResult {
  mode: GameMode
  customDayNumber: number | null
  isTraining: boolean
}

export function useGameMode({ location, navigate }: UseGameModeOptions): UseGameModeResult {
  const [mode, setMode] = useState<GameMode>('termo')
  const [customDayNumber, setCustomDayNumber] = useState<number | null>(null)
  const [isTraining, setIsTraining] = useState<boolean>(false)

  useEffect(() => {
    const path = location.pathname
    const searchParams = new URLSearchParams(location.search)
    const diaParam = searchParams.get('dia')

    // Modo Treino: variante ilimitada de Termo (1 tabuleiro), sem vínculo com o dia
    const training = path === TRAINING_PATH
    if (training !== isTraining) {
      setIsTraining(training)
    }

    const newMode: GameMode = getModeFromPath(path)

    if (newMode !== mode) {
      setMode(newMode)
    }

    // No Treino as palavras são aleatórias; o parâmetro ?dia (arquivo) não se aplica
    if (training) {
      if (customDayNumber !== null) {
        setCustomDayNumber(null)
      }
      return
    }

    if (diaParam) {
      const dayNum = parseInt(diaParam, 10)
      const currentDay = getDayNumber()

      if (!isNaN(dayNum) && dayNum > 0) {
        if (dayNum > currentDay) {
          const cleanPath = path || '/'
          navigate(cleanPath, { replace: true })
          setCustomDayNumber(null)
        } else {
          setCustomDayNumber(dayNum)
        }
      } else {
        setCustomDayNumber(null)
      }
    } else {
      setCustomDayNumber(null)
    }
  }, [location.pathname, location.search, navigate, mode, isTraining, customDayNumber])

  return { mode, customDayNumber, isTraining }
}
