// src/components/TrainingResultDialog.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Timer } from 'lucide-react'
import { GameState } from '@/game/types'
import { getResultMessage } from '@/game/engine'
import { formatDuration } from '@/lib/dates'
import { useDialogAnimations } from '@/hooks/useDialogAnimations'
import { DialogShell } from './DialogShell'
import { Button } from './ui/button'

/** Estatísticas da sessão de treino (em memória, não persistidas). */
export interface TrainingSession {
  played: number
  won: number
  currentStreak: number
  bestStreak: number
}

interface TrainingResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: GameState
  session: TrainingSession
  onPlayAgain: () => void
}

export function TrainingResultDialog({
  open,
  onOpenChange,
  gameState,
  session,
  onPlayAgain,
}: TrainingResultDialogProps) {
  const { containerVariants, itemVariants } = useDialogAnimations()

  const winPercentage = session.played > 0
    ? Math.round((session.won / session.played) * 100)
    : 0

  // Tempo desta partida de treino (quando há cronometragem)
  const hasCurrentTime = gameState.startTime != null && gameState.endTime != null
  const currentSolveMs = hasCurrentTime ? Math.max(0, gameState.endTime! - gameState.startTime!) : 0

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="🎮 Treino"
      description="Resultado do treino e opção de jogar novamente"
      borderColor="border-eucalyptus"
      titleGradientClassName="bg-gradient-to-r from-pistachio to-eucalyptus"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 px-6 py-4"
          >
            {/* Palavra revelada */}
            <motion.div variants={itemVariants} className="w-full bg-green-600 rounded-lg p-3 text-center space-y-1">
              <div className="text-xs text-green-100 font-medium">
                {gameState.isWin ? '🎉 Palavra' : '💀 Era'}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {gameState.boards.map((board, index) => (
                  <span key={index} className="text-white font-bold text-lg uppercase tracking-wider">
                    {board.solution}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Mensagem de resultado */}
            <motion.div variants={itemVariants} className="text-center py-3 bg-night-800 rounded-lg space-y-1">
              <p className="text-lg font-semibold">{getResultMessage(gameState)}</p>
              {gameState.isWin && hasCurrentTime && (
                <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Timer className="w-3.5 h-3.5 text-pistachio" aria-hidden="true" />
                  Resolvido em
                  <span className="font-semibold text-foreground tabular-nums">{formatDuration(currentSolveMs)}</span>
                </p>
              )}
            </motion.div>

            {/* Estatísticas da sessão (não persistidas) */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xs text-muted-foreground text-center mb-2 uppercase tracking-wider">
                Sessão de treino
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold">{session.played}</div>
                  <div className="text-xs text-muted-foreground">Jogos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{winPercentage}</div>
                  <div className="text-xs text-muted-foreground">% Vitórias</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{session.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Sequência</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{session.bestStreak}</div>
                  <div className="text-xs text-muted-foreground">Melhor</div>
                </div>
              </div>
            </motion.div>

            {/* Jogar de novo */}
            <motion.div variants={itemVariants} className="border-t border-night-600 pt-4">
              <Button
                onClick={onPlayAgain}
                className="w-full bg-eucalyptus text-[#eafbe0] hover:bg-eucalyptus/90 h-11 text-base font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar de novo
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogShell>
  )
}
