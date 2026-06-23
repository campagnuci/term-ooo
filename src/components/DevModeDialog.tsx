// src/components/DevModeDialog.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Trash2, Eye, SkipForward, Trophy } from 'lucide-react'
import { GameState } from '@/game/types'
import { useDialogAnimations } from '@/hooks/useDialogAnimations'
import { useTemporaryState } from '@/hooks/useTemporaryState'
import { DialogShell } from './DialogShell'
import { useResponsiveDialog } from './ui/responsive-dialog'

interface DevModeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: GameState
  onResetLocalStorage: () => void
  onSkipToWin: () => void
}

export function DevModeDialog({
  open,
  onOpenChange,
  gameState,
  onResetLocalStorage,
  onSkipToWin,
}: DevModeDialogProps) {
  const [confirmReset, setConfirmTemporary] = useTemporaryState()

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmTemporary(3000)
    } else {
      onResetLocalStorage()
      onOpenChange(false)
    }
  }

  const { containerVariants, itemVariants } = useDialogAnimations({
    staggerDelay: 0.1,
  })

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="🔓 Dev Mode"
      description="Ferramentas de desenvolvimento"
      borderColor="border-red-500"
      titleGradientClassName="bg-gradient-to-r from-red-400 to-orange-500"
      maxHeight="none"
      showDescription={true}
    >
      <ContentWrapper>
          <AnimatePresence>
            {open && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3 py-4 pr-4"
              >
                {/* Mostrar Soluções */}
                <motion.div variants={itemVariants} className="p-4 bg-night-800 rounded-lg border border-night-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-pistachio" />
                      <span className="font-semibold">Soluções</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Palavras de hoje:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gameState.boards.map((board, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-eucalyptus rounded text-[#eafbe0] font-bold uppercase"
                      >
                        {board.solution}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Vitória Instantânea */}
                <motion.div variants={itemVariants}>
                  <Button
                    onClick={onSkipToWin}
                    disabled={gameState.isGameOver}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    {gameState.isGameOver ? 'Jogo Já Finalizado' : 'Vitória Instantânea'}
                  </Button>
                </motion.div>

                {/* Skip Palavra */}
                <motion.div variants={itemVariants}>
                  <Button
                    onClick={() => {
                      window.location.reload()
                    }}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Recarregar Página
                  </Button>
                </motion.div>

                {/* Reset LocalStorage */}
                <motion.div variants={itemVariants}>
                  <Button
                    onClick={handleResetClick}
                    className={`w-full ${
                      confirmReset
                        ? 'bg-red-700 hover:bg-red-800 animate-pulse'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {confirmReset ? '⚠️ Clique Novamente para Confirmar' : 'Limpar LocalStorage'}
                  </Button>
                </motion.div>

                <motion.p variants={itemVariants} className="text-xs text-center text-muted-foreground pt-2">
                  Use com cuidado! Essas ações podem afetar seu progresso.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
      </ContentWrapper>
    </DialogShell>
  )
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useResponsiveDialog()
  return (
    <div className={isDesktop ? "px-6 pb-6" : "px-4 pb-6 h-[calc(100dvh-8rem)] overflow-y-auto"}>
      {children}
    </div>
  )
}

