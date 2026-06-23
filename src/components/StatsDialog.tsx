// src/components/StatsDialog.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import Countdown from 'react-countdown'
import { Stats, GameState } from '@/game/types'
import { getResultMessage, generateShareText, getMinAttempts } from '@/game/engine'
import { useDialogAnimations } from '@/hooks/useDialogAnimations'
import { useTemporaryState } from '@/hooks/useTemporaryState'
import { useShareImage } from '@/hooks/useShareImage'
import { getNextMidnightTimestamp } from '@/lib/dates'
import { DialogShell } from './DialogShell'
import { ResponsiveScrollArea } from './ui/responsive-scroll-area'
import { ShareDropdown } from './ShareDropdown'
import { ShareCard } from './ShareCard'
import { SHARE_CONFIG } from '@/lib/share-config'

interface StatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: Stats | null
  gameState: GameState
  onShare?: () => void
}

export function StatsDialog({ open, onOpenChange, stats, gameState, onShare }: StatsDialogProps) {
  const [copied, setCopiedTemporary] = useTemporaryState()
  const shareCardRef = useRef<HTMLDivElement>(null)
  const { shareAsImage, loading: sharingImage } = useShareImage()

  // Renderer customizado para o countdown
  const countdownRenderer = ({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) => {
    return (
      <span className="text-lg font-bold font-mono">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    )
  }

  const safeStats = stats ?? {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: Array(gameState.maxAttempts + 1).fill(0),
  }

  const winPercentage = safeStats.gamesPlayed > 0
    ? Math.round((safeStats.gamesWon / safeStats.gamesPlayed) * 100)
    : 0

  const handleShareText = async () => {
    // Detectar se é arquivo pelo dateKey
    const isArchive = gameState.dateKey.startsWith('archive-')
    const text = generateShareText(gameState, isArchive)

    try {
      await navigator.clipboard.writeText(text)
      setCopiedTemporary(2000)
      onShare?.() // Tocar som de compartilhamento
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const handleShareImage = async () => {
    if (!shareCardRef.current) return

    const fileName = SHARE_CONFIG.getFileName(gameState.mode, gameState.dayNumber)

    await shareAsImage(shareCardRef, {
      fileName,
      title: `Meu resultado no ${gameState.mode.charAt(0).toUpperCase() + gameState.mode.slice(1)}`,
      text: `Consegui ${gameState.isWin ? 'completar' : 'jogar'} o ${gameState.mode} do dia ${gameState.dayNumber}!`,
      onSuccess: () => {
        onShare?.() // Tocar som de compartilhamento
      },
      onError: (error) => {
        console.error('Erro ao compartilhar imagem:', error)
      },
    })
  }

  const maxValue = Math.max(...safeStats.guessDistribution, 1)

  const { containerVariants, itemVariants } = useDialogAnimations()

  // Usar função centralizada do mode-config
  const minAttempts = getMinAttempts(gameState.mode)

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Estatísticas"
      description="Estatísticas do jogo, distribuição de tentativas e próxima palavra"
      borderColor="border-eucalyptus"
      titleGradientClassName="bg-gradient-to-r from-pistachio to-eucalyptus"
    >
      <ResponsiveScrollArea
        desktopClassName="max-h-[calc(85vh-80px)] px-6"
        mobileClassName="h-[calc(100dvh)] px-4"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 py-4 pr-0"
            >
              {/* Solutions quando jogo terminou */}
              {gameState.isGameOver && (
                <motion.div variants={itemVariants} className="w-full bg-green-600 rounded-lg p-3 text-center space-y-1">
                  <div className="text-xs text-green-100 font-medium">
                    {gameState.isWin ? '🎉 Palavra' + (gameState.boards.length > 1 ? 's' : '') : '💀 Era'}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {gameState.boards.map((board, index) => (
                      <span key={index} className="text-white font-bold text-lg uppercase tracking-wider">
                        {board.solution}{index < gameState.boards.length - 1 ? ' - ' : ''}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
              {gameState.isGameOver && (
                <motion.div variants={itemVariants} className="text-center py-3 bg-night-800 rounded-lg">
                  <p className="text-lg font-semibold">{getResultMessage(gameState)}</p>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold">{safeStats.gamesPlayed}</div>
                  <div className="text-xs text-muted-foreground">Jogadas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{winPercentage}</div>
                  <div className="text-xs text-muted-foreground">% Vitórias</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{safeStats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Sequência</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{safeStats.maxStreak}</div>
                  <div className="text-xs text-muted-foreground">Melhor</div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h3 className="text-base font-semibold mb-3">Distribuição de Tentativas</h3>
                <div className="space-y-1.5">
                  {safeStats.guessDistribution.map((count, index) => {
                    // Filtrar barras impossíveis baseado no modo
                    const minPossibleAttempt = minAttempts.first
                    const attemptNumber = index + 1

                    // Não renderizar tentativas impossíveis
                    if (attemptNumber < minPossibleAttempt) return null
                    
                    const isCurrentAttempt = gameState.isGameOver && gameState.isWin && gameState.currentRow - 1 === index
                    const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0

                    // Medalhas baseadas na posição
                    const getLabel = (idx: number) => {
                      if (idx === safeStats.guessDistribution.length - 1) return '💀'

                      const attemptNumber = idx + 1

                      if (attemptNumber === minAttempts.first) return '🥇'
                      if (attemptNumber === minAttempts.second) return '🥈'
                      if (attemptNumber === minAttempts.third) return '🥉'
                      return `${attemptNumber}`
                    }

                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-7 text-center text-base">{getLabel(index)}</div>
                        <div className="flex-1 bg-night-800 h-6 rounded overflow-hidden">
                          <div
                            className={`h-full flex items-center justify-end px-2 transition-all ${isCurrentAttempt ? 'bg-green-600' : 'bg-night-700'
                              }`}
                            style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                          >
                            {count > 0 && <span className="font-semibold text-sm">{count}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {gameState.isGameOver && (
                <motion.div variants={itemVariants} className="border-t border-night-600 pt-4 space-y-3">
                  {/* Mensagem motivacional */}
                  {gameState.isWin && (
                    <motion.p 
                      variants={itemVariants}
                      className="text-center text-sm text-muted-foreground px-2"
                    >
                      🎉 Curtiu? Compartilha!
                    </motion.p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Próxima Palavra</div>
                      <Countdown date={getNextMidnightTimestamp()} renderer={countdownRenderer} />
                    </div>
                    <ShareDropdown
                      gameState={gameState}
                      onShareText={handleShareText}
                      onShareImage={handleShareImage}
                      onShare={onShare}
                      loading={sharingImage}
                      copied={copied}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveScrollArea>

      {/* Card invisível para compartilhamento como imagem */}
      <div className="sr-only absolute opacity-0 pointer-events-none" aria-hidden="true">
        <ShareCard ref={shareCardRef} gameState={gameState} stats={stats} />
      </div>
    </DialogShell>
  )
}

