// src/App.tsx
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { Settings } from './game/types'
import { processGuess } from './game/engine'
import { storage } from './game/storage'
import { Header } from './components/Header'
import { TopTabs, TabValue } from './components/TopTabs'
import { GameLayout } from './components/GameLayout'
import { GameTimer } from './components/GameTimer'
import { Keyboard } from './components/Keyboard'
import { HelpDialog } from './components/HelpDialog'
import { StatsDialog } from './components/StatsDialog'
import { SettingsDialog } from './components/SettingsDialog'
import { DevModeDialog } from './components/DevModeDialog'
import { AboutDialog } from './components/AboutDialog'
import { ArchiveDialog } from './components/ArchiveDialog'
import { TrainingResultDialog, TrainingSession } from './components/TrainingResultDialog'
import { RoomLobby } from './components/Room/RoomLobby'
import { RoomScreen } from './components/Room/RoomScreen'
import { LandingPage } from './components/LandingPage'
import { MODE_PATHS, TRAINING_PATH } from './lib/routes'
import { useDialogManager } from './hooks/useDialogManager'
import { useGameAnimations } from './hooks/useGameAnimations'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import { useGameMode } from './hooks/useGameMode'
import { usePersistentGameState } from './hooks/usePersistentGameState'
import { useStatsTracker } from './hooks/useStatsTracker'
import { StarsBackground } from './components/animate-ui/components/backgrounds/stars'
import { APP_VERSION } from './lib/version'
import { useSoundEffects } from './lib/sounds/useSoundEffects'

// Jogo da memória em chunk separado: não pesa no bundle inicial dos jogos de palavras
const MemoryGame = lazy(() => import('./memory/MemoryGame'))

function MemoryGameRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-night via-[#0a201a] to-night flex items-center justify-center">
          <div className="text-foreground text-xl">Carregando...</div>
        </div>
      }
    >
      <MemoryGame />
    </Suspense>
  )
}

function Game() {
  const navigate = useNavigate()
  const location = useLocation()

  const [settings, setSettings] = useState<Settings>(storage.getSettings())
  const [error, setError] = useState<string>('')
  const [tabsVisible, setTabsVisible] = useState(false)

  // Estatísticas da sessão de Treino (em memória, não persistidas)
  const [trainingSession, setTrainingSession] = useState<TrainingSession>({
    played: 0,
    won: 0,
    currentStreak: 0,
    bestStreak: 0,
  })

  // Controlar se já mostramos HelpDialog para este gameState
  const helpDialogShownRef = useRef<string>('')

  // Controlar som de "waiting" após primeiro chute
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingSoundPlayedRef = useRef<string>('') // Guarda modo+dateKey para tocar apenas uma vez

  const { mode, customDayNumber, isTraining } = useGameMode({ location, navigate })

  // Sistema de efeitos sonoros
  const { play: playSound } = useSoundEffects({ settings })

  // Gerenciamento unificado de dialogs
  const dialogManager = useDialogManager()

  // Gerenciamento unificado de animações
  const {
    cursorPosition,
    shouldShake,
    revealingRow,
    lastTypedIndex,
    happyRow,
    happyBoards,
    actions: animActions
  } = useGameAnimations()

  const { gameState, setGameState, stats, setStats, startNewTrainingGame } = usePersistentGameState({
    mode,
    customDayNumber,
    isTraining,
    animActions,
    onCompletedGameLoad: useCallback(() => {
      setTabsVisible(true)
      // Abrir StatsDialog quando carrega jogo já concluído
      setTimeout(() => {
        dialogManager.openDialog('stats')
      }, 800)
    }, [dialogManager])
  })

  useStatsTracker({ gameState, mode, customDayNumber, isTraining, setStats })

  // Abrir HelpDialog automaticamente quando modo não foi iniciado
  useEffect(() => {
    if (!gameState) return

    // Criar chave única para este gameState
    const stateKey = `${mode}-${gameState.dateKey}`

    // Só mostrar se: tutorial habilitado E modo não iniciado E ainda não mostrado
    if (settings.showHelpOnStart && gameState.currentRow === 0 && helpDialogShownRef.current !== stateKey) {
      const timer = setTimeout(() => {
        dialogManager.openDialog('help')
        // Marcar como já mostrado para este gameState
        helpDialogShownRef.current = stateKey
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [gameState, mode, dialogManager, settings.showHelpOnStart])

  // Som de "waiting" após primeiro chute (15 segundos de inatividade)
  useEffect(() => {
    if (!gameState) return

    // Limpar timer anterior se existir
    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current)
      waitingTimerRef.current = null
    }

    const stateKey = `${mode}-${gameState.dateKey}`

    // Condições para iniciar timer:
    // 1. Acabou de dar o primeiro chute (currentRow === 1)
    // 2. Ainda não tocou o som para este modo+dia
    // 3. Jogo não acabou
    if (
      gameState.currentRow === 1 &&
      waitingSoundPlayedRef.current !== stateKey &&
      !gameState.isGameOver
    ) {
      waitingTimerRef.current = setTimeout(() => {
        // Só tocar se ainda não deu o segundo chute
        if (gameState.currentRow === 1 && !gameState.isGameOver) {
          playSound('waiting')
          waitingSoundPlayedRef.current = stateKey
        }
      }, 15000) // 15 segundos
    }

    // Limpar timer quando mudar de linha (usuário deu o segundo chute)
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current)
        waitingTimerRef.current = null
      }
    }
  }, [gameState, mode, playSound])

  // Salvar configurações
  useEffect(() => {
    storage.saveSettings(settings)
  }, [settings])


  const handleModeChange = (newMode: TabValue) => {
    navigate(newMode === 'treino' ? TRAINING_PATH : MODE_PATHS[newMode])
  }

  // Inicia uma nova partida de treino (botão "Jogar de novo")
  const handlePlayAgain = useCallback(() => {
    dialogManager.closeDialog()
    animActions.resetAnimations()
    startNewTrainingGame()
  }, [dialogManager, animActions, startNewTrainingGame])

  // Dev Mode handlers
  const handleResetLocalStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  const handleSkipToWin = () => {
    if (!gameState || gameState.isGameOver) return

    // Criar guess perfeito para todas as boards
    const perfectGuesses = gameState.boards.map(board => board.solution)

    // Simular guesses perfeitas até a vitória
    let currentState = gameState
    for (const solution of perfectGuesses) {
      // Preencher currentGuess com a solução
      const solutionArray = solution.split('').map(c => c.toLowerCase())
      currentState = { ...currentState, currentGuess: solutionArray }

      // Processar a guess
      const result = processGuess(currentState, settings)
      if (!result.error) {
        currentState = result.newState
      }
    }

    // Atualizar estado
    setGameState(currentState)
    storage.saveGameState(mode, currentState.dateKey, currentState)

    // Abrir stats após vitória
    setTimeout(() => {
      dialogManager.dialogs.stats.onOpen()
    }, 500)
  }

  const handleTileClick = useCallback((position: number) => {
    if (!gameState || gameState.isGameOver) return
    animActions.setCursorPosition(position)
  }, [gameState, animActions])

  // Handler para atualizar currentGuess
  const handleGuessChange = useCallback((newGuess: string[]) => {
    setGameState(prevState => {
      if (!prevState) return prevState

      // Inicia o cronômetro na primeira letra digitada da partida
      const hasLetters = newGuess.some(c => c !== '')
      const startTime = prevState.startTime ?? (hasLetters && !prevState.isGameOver ? Date.now() : null)

      return {
        ...prevState,
        currentGuess: newGuess,
        startTime,
      }
    })
  }, [setGameState])

  // Handler para submeter guess (ENTER)
  const handleSubmitGuess = useCallback(() => {
    if (!gameState) return

    const result = processGuess(gameState, settings)

    // Detectar se está na última tentativa ANTES de processar
    const isLastAttempt = gameState.currentRow === gameState.maxAttempts - 2
    const isNotCompleted = !gameState.boards.every(b => b.isComplete)

    if (result.error) {
      setError(result.error)
      animActions.triggerShake()
      playSound('wrongWord')
      setTimeout(() => {
        setError('')
      }, 500)
    } else {
      // Ativar animação de flip para a linha que acabou de ser submetida
      const submittedRow = gameState.currentRow
      animActions.triggerFlip(submittedRow)

      // Reproduzir som de última tentativa no quarteto se necessário
      if (isLastAttempt && isNotCompleted && mode === 'quarteto') {
        playSound('lastAttempt')
      }

      // Detectar QUAIS boards foram completados NESTA jogada
      const newlyCompletedBoardIndices: number[] = []
      result.newState.boards.forEach((board, idx) => {
        if (board.isComplete && !gameState.boards[idx].isComplete) {
          newlyCompletedBoardIndices.push(idx)
        }
      })

      setGameState(result.newState)
      storage.saveGameState(mode, gameState.dateKey, result.newState)
      animActions.setCursorPosition(0)

      // Se algum board foi completado, ativar animação happy jump
      if (newlyCompletedBoardIndices.length > 0) {
        setTimeout(() => {
          animActions.triggerHappy(submittedRow, newlyCompletedBoardIndices)
        }, 1000) // Após o flip completar
      }

      // Sons de vitória/derrota
      if (result.newState.isGameOver) {
        // Atualizar estatísticas da sessão de treino (em memória)
        if (isTraining) {
          setTrainingSession(prev => {
            const won = result.newState.isWin
            const currentStreak = won ? prev.currentStreak + 1 : 0
            return {
              played: prev.played + 1,
              won: prev.won + (won ? 1 : 0),
              currentStreak,
              bestStreak: Math.max(prev.bestStreak, currentStreak),
            }
          })
        }

        setTimeout(() => {
          if (result.newState.isWin) {
            // Ganhou na primeira tentativa?
            if (result.newState.currentRow === 1) {
              playSound('firstTryWin')
            } else {
              playSound('win')
            }
          } else {
            // Perdeu o jogo
            playSound('gameOver')
          }
        }, 1200)

        const openResult = isTraining
          ? () => dialogManager.openDialog('trainingResult')
          : () => dialogManager.dialogs.stats.onOpen()
        setTimeout(openResult, newlyCompletedBoardIndices.length > 0 ? 2200 : 1200)
      }
    }
  }, [gameState, settings, animActions, playSound, mode, isTraining, setGameState, dialogManager])

  // Hook de keyboard input
  const { handleKey } = useKeyboardInput({
    gameState,
    onGuessChange: handleGuessChange,
    onSubmitGuess: handleSubmitGuess,
    onCursorMove: animActions.setCursorPosition,
    onTyping: animActions.triggerTyping,
    cursorPosition,
    disabled: dialogManager.hasOpenDialog
  })


  // Konami Code listener (↑ ↑ ↓ ↓ ← → ← → B A)
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A']
    let konamiIndex = 0

    const handleKonamiCode = (e: KeyboardEvent) => {
      const key = e.key === 'b' || e.key === 'B' ? 'B' : e.key === 'a' || e.key === 'A' ? 'A' : e.key

      if (key === konamiCode[konamiIndex]) {
        konamiIndex++
        if (konamiIndex === konamiCode.length) {
          // Konami Code completo!
          dialogManager.dialogs.dev.onOpen()
          konamiIndex = 0
        }
      } else {
        konamiIndex = 0
      }
    }

    window.addEventListener('keydown', handleKonamiCode)
    return () => window.removeEventListener('keydown', handleKonamiCode)
  }, [dialogManager.dialogs.dev])

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-night via-[#0a201a] to-night flex items-center justify-center">
        <div className="text-foreground text-xl">Carregando...</div>
      </div>
    )
  }

  const modeTitle = isTraining
    ? 'TREINO'
    : mode === 'termo'
      ? 'TERMO'
      : mode === 'dueto'
        ? 'DUETO'
        : mode === 'quarteto'
          ? 'QUARTETO'
          : 'MODO 6'

  return (
    <div className="h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col overflow-hidden">
      <Header
        title={modeTitle}
        onHelp={dialogManager.dialogs.help.onOpen}
        onStats={dialogManager.dialogs.stats.onOpen}
        onSettings={dialogManager.dialogs.settings.onOpen}
        onArchive={dialogManager.dialogs.archive.onOpen}
        onToggleTabs={() => setTabsVisible(!tabsVisible)}
        isArchive={customDayNumber !== null}
        archiveDayNumber={customDayNumber || undefined}
        isTraining={isTraining}
      />

      <TopTabs currentMode={mode} isTraining={isTraining} onModeChange={handleModeChange} isVisible={tabsVisible} />

      <main className="flex-1 flex flex-col items-center justify-between px-2 py-2 sm:px-4 sm:py-4 md:py-6 short:py-3 xshort:py-1.5 max-w-7xl mx-auto w-full overflow-hidden">
        {error && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            {error}
          </div>
        )}

        {/* Cronômetro discreto em tempo real (todos os modos) */}
        <div className="flex-shrink-0 z-10 flex justify-center">
          <GameTimer
            startTime={gameState.startTime}
            endTime={gameState.endTime}
            isGameOver={gameState.isGameOver}
          />
        </div>

        <GameLayout
          gameState={gameState}
          highContrast={settings.highContrast}
          cursorPosition={cursorPosition}
          shouldShake={shouldShake}
          onTileClick={handleTileClick}
          revealingRow={revealingRow}
          lastTypedIndex={lastTypedIndex}
          happyRow={happyRow}
          happyBoards={happyBoards}
        />

        {/* Treino: botão "Jogar de novo" sempre acessível após o fim da partida */}
        {isTraining && gameState.isGameOver && (
          <div className="w-full max-w-2xl mx-auto flex-shrink-0 z-10 flex justify-center mt-2">
            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 bg-eucalyptus text-[#eafbe0] hover:bg-eucalyptus/90 px-6 py-2 rounded-md font-semibold shadow-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Jogar de novo
            </button>
          </div>
        )}

        <div className="w-full mt-2 sm:mt-4 md:mt-6 short:mt-3 xshort:mt-1.5 max-w-2xl mx-auto flex-shrink-0 z-10">
          <Keyboard
            keyStates={gameState.keyStates}
            onKeyPress={handleKey}
            highContrast={settings.highContrast}
            disabled={gameState.isGameOver}
          />
        </div>
        <StarsBackground className="fixed inset-0 z-0 max-h-dvh max-w-full opacity-30"
          pointerEvents={false} />

        {/* Version Badge */}
        <div className="fixed bottom-2 right-2 md:left-2 z-[5] pointer-events-none">
          <span className="text-[8px] md:text-xs text-muted-foreground/50 font-mono">
            v{APP_VERSION}
          </span>
        </div>
      </main>

      <HelpDialog
        open={dialogManager.dialogs.help.open}
        onOpenChange={(open) => !open && dialogManager.closeDialog()}
      />

      <StatsDialog
        open={dialogManager.dialogs.stats.open}
        onOpenChange={(open) => {
          if (!open) {
            dialogManager.closeDialog()
            // Quando fecha o StatsDialog após jogo concluído, mostrar TopTabs
            if (gameState.isGameOver) {
              setTabsVisible(true)
            }
          }
        }}
        stats={stats}
        gameState={gameState}
        onShare={() => playSound('share')}
      />

      <SettingsDialog
        open={dialogManager.dialogs.settings.open}
        onOpenChange={(open) => !open && dialogManager.closeDialog()}
        settings={settings}
        onSettingsChange={setSettings}
        onOpenStats={() => {
          dialogManager.dialogs.stats.onOpen()
        }}
      />

      <DevModeDialog
        open={dialogManager.dialogs.dev.open}
        onOpenChange={(open) => !open && dialogManager.closeDialog()}
        gameState={gameState}
        onResetLocalStorage={handleResetLocalStorage}
        onSkipToWin={handleSkipToWin}
      />

      <AboutDialog
        open={dialogManager.dialogs.about.open}
        onOpenChange={(open) => !open && dialogManager.closeDialog()}
      />

      <ArchiveDialog
        open={dialogManager.dialogs.archive.open}
        onOpenChange={(open) => !open && dialogManager.closeDialog()}
        currentMode={mode}
      />

      <TrainingResultDialog
        open={dialogManager.dialogs.trainingResult.open}
        onOpenChange={(open) => {
          if (!open) {
            dialogManager.closeDialog()
            setTabsVisible(true)
          }
        }}
        gameState={gameState}
        session={trainingSession}
        onPlayAgain={handlePlayAgain}
      />

    </div>
  )
}

function App() {
  // Detectar se está em produção (GitHub Pages)
  const basename = import.meta.env.BASE_URL

  return (
    <BrowserRouter
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/termo" element={<Game />} />
        <Route path="/dueto" element={<Game />} />
        <Route path="/quarteto" element={<Game />} />
        <Route path="/modo-seis" element={<Game />} />
        <Route path="/treino" element={<Game />} />
        <Route path="/sala" element={<RoomLobby />} />
        <Route path="/sala/:code" element={<RoomScreen />} />
        <Route path="/memoria" element={<MemoryGameRoute />} />
        {/* Rotas antigas (/2, /4, /6, /seis) e caminhos desconhecidos caem no hub */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

