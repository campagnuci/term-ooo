// src/components/Room/RoomScreen.tsx
// Tela da sala multiplayer (rota /sala/:code).
//
// Espelha a estrutura do componente Game (App.tsx), mas o input é restrito ao
// host. Espectadores veem o tabuleiro em tempo real e participam só pelo chat.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { GameMode, Settings } from '@/game/types'
import { processGuess, getResultMessage } from '@/game/engine'
import { storage } from '@/game/storage'
import { GameLayout } from '@/components/GameLayout'
import { Keyboard } from '@/components/Keyboard'
import { ChatNicknameForm } from '@/components/Chat/ChatNicknameForm'
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars'
import { useGameAnimations } from '@/hooks/useGameAnimations'
import { useKeyboardInput } from '@/hooks/useKeyboardInput'
import { useGameRoom } from '@/hooks/useGameRoom'
import { JoinIntent } from '@/game/room-types'
import { ROOM_CONFIG, normalizeRoomCode } from '@/lib/room-config'
import { loadNickname, saveNickname } from '@/lib/chat-utils'
import { Z_INDEX } from '@/lib/z-index'
import { RoomHeader } from './RoomHeader'
import { RoomSidebar } from './RoomSidebar'
import { RoundEndControls } from './RoundEndControls'

interface LocationState {
  intent?: JoinIntent
  createMode?: GameMode
}

export function RoomScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()

  const code = useMemo(() => normalizeRoomCode(params.code || ''), [params.code])
  const navState = (location.state || {}) as LocationState
  const intent: JoinIntent = navState.intent === 'create' ? 'create' : 'join'
  const createMode = navState.createMode

  const [settings] = useState<Settings>(storage.getSettings())
  const [nickname, setNickname] = useState<string | null>(loadNickname())
  const [localError, setLocalError] = useState<string>('')
  const [joinError, setJoinError] = useState<string | null>(null)

  const {
    cursorPosition,
    shouldShake,
    revealingRow,
    lastTypedIndex,
    happyRow,
    happyBoards,
    actions: animActions,
  } = useGameAnimations()

  const gameRoom = useGameRoom({
    code: code || '',
    nickname,
    intent,
    createMode,
    autoConnect: !!nickname && !!code && ROOM_CONFIG.ENABLED,
  })

  const { isHost, gameState, roundId } = gameRoom

  // ----- Handlers de host -----
  const handleGuessChange = useCallback(
    (newGuess: string[]) => {
      const prevGuess = gameRoom.gameState?.currentGuess
      gameRoom.setGameState((prev) => (prev ? { ...prev, currentGuess: newGuess } : prev))

      if (isHost) {
        // Descobre a posição que acabou de receber uma letra (para o "pop").
        let typedIndex = -1
        if (prevGuess) {
          for (let i = 0; i < 5; i++) {
            if (newGuess[i] !== prevGuess[i] && newGuess[i] !== '') {
              typedIndex = i
              break
            }
          }
        }
        gameRoom.broadcastLiveInput(newGuess, typedIndex)
      }
    },
    [gameRoom, isHost]
  )

  const handleSubmitGuess = useCallback(() => {
    const gs = gameRoom.gameState
    if (!gs || !isHost || gs.isGameOver) return

    const result = processGuess(gs, settings)
    if (result.error) {
      setLocalError(result.error)
      animActions.triggerShake()
      setTimeout(() => setLocalError(''), 600)
      return
    }

    const submittedRow = gs.currentRow
    animActions.triggerFlip(submittedRow)

    const newlyCompleted: number[] = []
    result.newState.boards.forEach((board, idx) => {
      if (board.isComplete && !gs.boards[idx].isComplete) newlyCompleted.push(idx)
    })

    gameRoom.setGameState(result.newState)
    gameRoom.broadcastState(result.newState)
    animActions.setCursorPosition(0)

    if (newlyCompleted.length > 0) {
      setTimeout(() => animActions.triggerHappy(submittedRow, newlyCompleted), 1000)
    }
  }, [gameRoom, isHost, settings, animActions])

  const handleTileClick = useCallback(
    (position: number) => {
      if (!isHost || !gameState || gameState.isGameOver) return
      animActions.setCursorPosition(position)
    },
    [isHost, gameState, animActions]
  )

  const { handleKey } = useKeyboardInput({
    gameState,
    onGuessChange: handleGuessChange,
    onSubmitGuess: handleSubmitGuess,
    onCursorMove: animActions.setCursorPosition,
    onTyping: animActions.triggerTyping,
    cursorPosition,
    disabled: !isHost || !nickname,
  })

  // ----- Efeitos -----

  // Nova rodada: reseta cursor e animações.
  useEffect(() => {
    animActions.resetAnimations()
    animActions.setCursorPosition(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId])

  // Espectador: anima o flip da linha recém-revelada.
  const prevRowRef = useRef(0)
  useEffect(() => {
    if (!gameState) return
    if (!isHost && gameState.currentRow > prevRowRef.current) {
      animActions.triggerFlip(gameState.currentRow - 1)
    }
    prevRowRef.current = gameState.currentRow
  }, [gameState, isHost, animActions])

  // Banner de promoção a host some sozinho após alguns segundos.
  useEffect(() => {
    if (!gameRoom.justBecameHost) return
    const t = setTimeout(gameRoom.clearJustBecameHost, 8000)
    return () => clearTimeout(t)
  }, [gameRoom.justBecameHost, gameRoom.clearJustBecameHost])

  // Captura erros fatais ocorridos antes de entrar na sala.
  useEffect(() => {
    if (gameRoom.error && !gameRoom.room) setJoinError(gameRoom.error)
  }, [gameRoom.error, gameRoom.room])

  // ----- Render: portões iniciais -----

  if (!code) {
    return (
      <CenteredScreen>
        <p className="text-foreground text-lg">Código de sala inválido.</p>
        <BackButton onClick={() => navigate('/sala')} />
      </CenteredScreen>
    )
  }

  if (!nickname) {
    return (
      <div className="h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col">
        <ChatNicknameForm
          onSubmit={(nick) => {
            saveNickname(nick)
            setNickname(nick)
          }}
          error={null}
          isConnecting={false}
          title={`Entrar na sala ${code}`}
          subtitle="Escolha seu apelido para entrar"
          submitLabel="Entrar na sala"
          submittingLabel="Entrando..."
        />
      </div>
    )
  }

  if (!gameRoom.room) {
    return (
      <CenteredScreen>
        {joinError ? (
          <>
            <p className="text-red-300 text-lg text-center px-4">{joinError}</p>
            <BackButton onClick={() => navigate('/sala')} />
          </>
        ) : (
          <p className="text-foreground text-lg">Conectando à sala {code}…</p>
        )}
      </CenteredScreen>
    )
  }

  const room = gameRoom.room
  const displayError = localError || gameRoom.error

  return (
    <div className="h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col overflow-hidden">
      <RoomHeader
        code={room.code}
        mode={room.mode}
        memberCount={room.memberCount}
        connected={gameRoom.connected}
        latency={gameRoom.latency}
        isHost={isHost}
        onLeave={() => navigate('/sala')}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col items-center justify-between px-2 py-2 sm:px-4 sm:py-4 max-w-3xl mx-auto w-full overflow-hidden">
          {/* Banner de promoção a host */}
          {gameRoom.justBecameHost && (
            <div
              className="w-full max-w-xl bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top"
              style={{ zIndex: Z_INDEX.ROOM_HOST_BANNER }}
            >
              <span className="font-semibold text-sm sm:text-base">
                Você agora é o anfitrião! Continue jogando.
              </span>
              <button
                onClick={gameRoom.clearJustBecameHost}
                aria-label="Fechar aviso"
                className="p-1 hover:bg-amber-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Erro transitório */}
          {displayError && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
              {displayError}
            </div>
          )}

          {gameState && (
            <GameLayout
              gameState={gameState}
              highContrast={settings.highContrast}
              cursorPosition={isHost ? cursorPosition : -1}
              shouldShake={isHost ? shouldShake : false}
              onTileClick={isHost ? handleTileClick : undefined}
              revealingRow={revealingRow}
              lastTypedIndex={isHost ? lastTypedIndex : gameRoom.liveTypedIndex}
              happyRow={happyRow}
              happyBoards={happyBoards}
            />
          )}

          {/* Fim de rodada */}
          {gameState?.isGameOver && (
            <RoundEndControls
              isHost={isHost}
              isWin={gameState.isWin}
              resultMessage={getResultMessage(gameState)}
              currentMode={room.mode}
              onNewWord={() => gameRoom.requestNewRound()}
              onChangeMode={(mode) => gameRoom.requestNewRound(mode)}
            />
          )}

          {/* Indicador de espectador */}
          {!isHost && !gameState?.isGameOver && (
            <div className="w-full text-center py-1 text-sm text-muted-foreground italic">
              {gameRoom.hostNickname
                ? `${gameRoom.hostNickname} está jogando — você está assistindo`
                : 'Você está assistindo'}
            </div>
          )}

          {gameState && (
            <div className="w-full mt-2 max-w-2xl mx-auto flex-shrink-0 z-10">
              <Keyboard
                keyStates={gameState.keyStates}
                onKeyPress={handleKey}
                highContrast={settings.highContrast}
                disabled={!isHost || gameState.isGameOver}
              />
            </div>
          )}

          <StarsBackground
            className="fixed inset-0 z-0 max-h-dvh max-w-full opacity-30"
            pointerEvents={false}
          />
        </main>

        <RoomSidebar
          code={room.code}
          members={room.members}
          hostUserId={room.hostUserId}
          currentUserId={gameRoom.userId}
          connected={gameRoom.connected}
          messages={gameRoom.messages}
          unreadCount={gameRoom.unreadCount}
          onSendChat={gameRoom.sendChat}
          onOpenChat={gameRoom.markAsRead}
        />
      </div>
    </div>
  )
}

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col items-center justify-center gap-4">
      {children}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-eucalyptus hover:bg-eucalyptus-light text-[#eafbe0] rounded-lg transition-colors"
    >
      Voltar ao lobby
    </button>
  )
}
