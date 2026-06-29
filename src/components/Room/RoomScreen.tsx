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
import { JoinIntent, RoomGameType } from '@/game/room-types'
import { ROOM_CONFIG, normalizeRoomCode } from '@/lib/room-config'
import { loadNickname, saveNickname } from '@/lib/chat-utils'
import { Z_INDEX } from '@/lib/z-index'
import { RoomHeader } from './RoomHeader'
import { RoomSidebar } from './RoomSidebar'
import { RoundEndControls } from './RoundEndControls'
import { CompetitionPanel } from './CompetitionPanel'
import { TimeTrialPanel } from './TimeTrialPanel'
import { RoomTimer } from './RoomTimer'
import { RoundCountdown } from './RoundCountdown'

interface LocationState {
  intent?: JoinIntent
  createMode?: GameMode
  createGameType?: RoomGameType
}

export function RoomScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()

  const code = useMemo(() => normalizeRoomCode(params.code || ''), [params.code])
  const navState = (location.state || {}) as LocationState
  const intent: JoinIntent = navState.intent === 'create' ? 'create' : 'join'
  const createMode = navState.createMode
  // Preserva os três tipos válidos (coop/competition/timetrial); cai em 'coop'
  // apenas se ausente/desconhecido. NÃO colapsar 'timetrial' para 'coop'.
  const createGameType: RoomGameType =
    navState.createGameType === 'competition'
      ? 'competition'
      : navState.createGameType === 'timetrial'
        ? 'timetrial'
        : 'coop'

  const [settings] = useState<Settings>(storage.getSettings())
  const [nickname, setNickname] = useState<string | null>(loadNickname())
  const [localError, setLocalError] = useState<string>('')
  const [joinError, setJoinError] = useState<string | null>(null)
  // Início (epoch LOCAL) da contagem regressiva pré-rodada exibida; null = nenhuma.
  const [countdownAt, setCountdownAt] = useState<number | null>(null)
  const handleCountdownComplete = useCallback(() => setCountdownAt(null), [])

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
    createGameType,
    autoConnect: !!nickname && !!code && ROOM_CONFIG.ENABLED,
  })

  const { isHost, gameState, roundId, gameType, matchStatus } = gameRoom
  const isCompetition = gameType === 'competition'
  const isTimeTrial = gameType === 'timetrial'
  // Tipos "competitivos": cada jogador joga o próprio tabuleiro (Competição e Time Trial).
  const isCompetitive = isCompetition || isTimeTrial

  // Quem pode digitar/submeter neste instante.
  // Coop: apenas o host. Competitivo: jogador que é competidor da partida (não um
  // espectador que entrou depois), enquanto a partida está ativa, a contagem
  // regressiva acabou e seu próprio jogo não terminou.
  const playableNow = isCompetitive
    ? matchStatus === 'active' &&
      !!gameState &&
      !gameState.isGameOver &&
      !gameRoom.countingDown &&
      gameRoom.amCompetitor
    : isHost

  // O painel de resultado/fim aparece como overlay (não no fluxo), então o
  // tabuleiro e o teclado permanecem nas posições de jogo e NÃO são empurrados.
  // O overlay é mostrado sempre que há um painel para exibir:
  //  - Competitivo: em tudo, menos enquanto o jogador local ainda está jogando
  //    (partida ativa e seu jogo não terminou) — espelha o `return null` dos
  //    painéis de Competição/Time Trial.
  //  - Coop: apenas quando a rodada termina (RoundEndControls).
  const showResultOverlay = isCompetitive
    ? !(matchStatus === 'active' && !gameState?.isGameOver)
    : !!gameState?.isGameOver

  // ----- Handlers de jogo -----
  // Coop: somente o host joga e transmite o estado. Competição: cada jogador
  // joga seu próprio tabuleiro localmente (sem transmitir o board).
  const handleGuessChange = useCallback(
    (newGuess: string[]) => {
      const prevGuess = gameRoom.gameState?.currentGuess
      gameRoom.setGameState((prev) => (prev ? { ...prev, currentGuess: newGuess } : prev))

      // Apenas o coop transmite a digitação ao vivo do host aos espectadores.
      if (!isCompetitive && isHost) {
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
    [gameRoom, isHost, isCompetitive]
  )

  const handleSubmitGuess = useCallback(() => {
    const gs = gameRoom.gameState
    if (!gs || gs.isGameOver || !playableNow) return

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
    if (!isCompetitive) {
      gameRoom.broadcastState(result.newState)
    } else {
      // Competição/Time Trial: o tabuleiro vive só no cliente (o servidor nunca
      // vê os palpites). Persistimos a cada jogada, com chave por rodada
      // (`room-<code>-<roundId>`), para reidratar após reload/reconexão.
      storage.saveGameState(result.newState.mode, result.newState.dateKey, result.newState)
    }
    animActions.setCursorPosition(0)

    if (newlyCompleted.length > 0) {
      setTimeout(() => animActions.triggerHappy(submittedRow, newlyCompleted), 1000)
    }

    // Competitivo: ao terminar (acertou tudo ou esgotou), reporta ao servidor.
    if (isCompetitive && result.newState.isGameOver) {
      gameRoom.reportFinished(result.newState.isWin, result.newState.currentRow)
    }
  }, [gameRoom, playableNow, isCompetitive, settings, animActions])

  const handleTileClick = useCallback(
    (position: number) => {
      if (!playableNow) return
      animActions.setCursorPosition(position)
    },
    [playableNow, animActions]
  )

  const { handleKey } = useKeyboardInput({
    gameState,
    onGuessChange: handleGuessChange,
    onSubmitGuess: handleSubmitGuess,
    onCursorMove: animActions.setCursorPosition,
    onTyping: animActions.triggerTyping,
    cursorPosition,
    disabled: !nickname || !playableNow,
  })

  // ----- Efeitos -----

  // Nova rodada: reseta cursor e animações.
  useEffect(() => {
    animActions.resetAnimations()
    animActions.setCursorPosition(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId])

  // Dispara a contagem regressiva quando o servidor anuncia um início FUTURO
  // (match-start / round-advanced). Reconexão no meio da rodada (startsAt no
  // passado) não dispara contagem.
  useEffect(() => {
    const sa = gameRoom.roundStartsAt
    if (sa != null && sa > Date.now() + 150) setCountdownAt(sa)
  }, [gameRoom.roundStartsAt])

  // Espectador (somente coop): anima o flip da linha recém-revelada do host.
  const prevRowRef = useRef(0)
  useEffect(() => {
    if (isCompetitive) return
    if (!gameState) return
    if (!isHost && gameState.currentRow > prevRowRef.current) {
      animActions.triggerFlip(gameState.currentRow - 1)
    }
    prevRowRef.current = gameState.currentRow
  }, [gameState, isHost, isCompetitive, animActions])

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
        gameType={gameType}
        onLeave={() => navigate('/sala')}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="relative flex-1 flex flex-col items-center justify-between px-2 py-2 sm:px-4 sm:py-4 max-w-3xl mx-auto w-full overflow-hidden">
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

          {/* Cronômetro compartilhado (sincronizado pelo servidor) — coop e competição */}
          <RoomTimer timing={gameRoom.roundTiming} className="flex-shrink-0 z-10 mb-1" />

          {gameState && (
            <GameLayout
              gameState={gameState}
              highContrast={settings.highContrast}
              cursorPosition={playableNow ? cursorPosition : -1}
              shouldShake={playableNow ? shouldShake : false}
              onTileClick={playableNow ? handleTileClick : undefined}
              revealingRow={revealingRow}
              lastTypedIndex={isCompetitive ? lastTypedIndex : isHost ? lastTypedIndex : gameRoom.liveTypedIndex}
              happyRow={happyRow}
              happyBoards={happyBoards}
            />
          )}

          {/* ----- Painel de resultado / fim de partida -----
               Renderizado como overlay ESCOPADO à coluna do jogo (<main> é
               `relative`, este layer é `absolute inset-0`). Por estar fora do
               fluxo, o tabuleiro e o teclado não são empurrados. Por estar
               dentro de <main>, nunca cobre a coluna do chat (desktop); no
               mobile, fica abaixo do botão de chat (z-index). */}
          {showResultOverlay && (
            <div
              className="absolute inset-0 flex items-center justify-center p-3 sm:p-4"
              style={{ zIndex: Z_INDEX.ROOM_RESULT_OVERLAY }}
            >
              {/* Fundo escurecido (verde do tema, não preto) — cobre apenas <main> */}
              <div
                className="absolute inset-0 bg-night/5"
                aria-hidden="true"
              />

              {/* Card do resultado (rola internamente se exceder a altura) */}
              <div className="relative w-full max-w-xl max-h-full overflow-y-auto">
                {isCompetition && (
                  <CompetitionPanel
                    matchStatus={matchStatus}
                    isHost={isHost}
                    gameState={gameState}
                    standings={gameRoom.standings}
                    roundFinishers={gameRoom.roundFinishers}
                    currentRound={gameRoom.currentRound}
                    totalRounds={gameRoom.totalRounds}
                    currentMode={room.mode}
                    memberCount={room.memberCount}
                    currentUserId={gameRoom.userId}
                    onStartMatch={(mode, timeLimitMs, rounds) =>
                      gameRoom.startMatch(mode, timeLimitMs, rounds)
                    }
                  />
                )}

                {isTimeTrial && (
                  <TimeTrialPanel
                    matchStatus={matchStatus}
                    isHost={isHost}
                    gameState={gameState}
                    standings={gameRoom.standings}
                    roundFinishers={gameRoom.roundFinishers}
                    currentRound={gameRoom.currentRound}
                    totalRounds={gameRoom.totalRounds}
                    currentMode={room.mode}
                    memberCount={room.memberCount}
                    currentUserId={gameRoom.userId}
                    timing={gameRoom.roundTiming}
                    onStartMatch={(mode, timeLimitMs, rounds) =>
                      gameRoom.startMatch(mode, timeLimitMs, rounds)
                    }
                  />
                )}

                {!isCompetitive && gameState?.isGameOver && (
                  <RoundEndControls
                    isHost={isHost}
                    isWin={gameState.isWin}
                    resultMessage={
                      gameState.isWin
                        ? getResultMessage(gameState)
                        : '💀 Não foi dessa vez, tentem novamente!'
                    }
                    currentMode={room.mode}
                    solutions={gameState.boards.map((b) => b.solution)}
                    onNewWord={() => gameRoom.requestNewRound()}
                    onChangeMode={(mode) => gameRoom.requestNewRound(mode)}
                  />
                )}
              </div>
            </div>
          )}

          {/* ----- Contagem regressiva pré-rodada (overlay escopado a <main>) ----- */}
          {countdownAt != null && (
            <RoundCountdown
              key={countdownAt}
              startsAt={countdownAt}
              round={gameRoom.currentRound}
              totalRounds={gameRoom.totalRounds}
              standings={gameRoom.standings}
              gameType={gameType}
              currentUserId={gameRoom.userId}
              soundEnabled={settings.soundEnabled}
              onComplete={handleCountdownComplete}
            />
          )}

          {/* ----- Cooperativo: indicador de espectador ----- */}
          {!isCompetitive && !isHost && !gameState?.isGameOver && (
            <div className="w-full text-center py-1 text-sm text-muted-foreground italic">
              {gameRoom.hostNickname
                ? `${gameRoom.hostNickname} está jogando — você está assistindo`
                : 'Você está assistindo'}
            </div>
          )}

          {/* ----- Competitivo: entrou no meio da partida → assiste ----- */}
          {isCompetitive && matchStatus === 'active' && !gameRoom.amCompetitor && (
            <div className="w-full text-center py-1 text-sm text-muted-foreground italic">
              Partida em andamento — você entra na próxima. Você está assistindo.
            </div>
          )}

          {gameState && (
            <div className="w-full mt-2 max-w-2xl mx-auto flex-shrink-0 z-10">
              <Keyboard
                keyStates={gameState.keyStates}
                onKeyPress={handleKey}
                highContrast={settings.highContrast}
                disabled={!playableNow}
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
          gameType={gameType}
          matchStatus={matchStatus}
          standings={gameRoom.standings}
          roundFinishers={gameRoom.roundFinishers}
          currentRound={gameRoom.currentRound}
          totalRounds={gameRoom.totalRounds}
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
