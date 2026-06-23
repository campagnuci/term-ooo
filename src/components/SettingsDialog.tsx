// src/components/SettingsDialog.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from './ui/switch'
import { Settings } from '@/game/types'
import { useDialogAnimations } from '@/hooks/useDialogAnimations'
import { DialogShell } from './DialogShell'
import { useResponsiveDialog } from './ui/responsive-dialog'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  onOpenStats: () => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  onOpenStats,
}: SettingsDialogProps) {
  const handleHighContrastChange = (checked: boolean) => {
    onSettingsChange({ ...settings, highContrast: checked })
  }

  const handleHardModeChange = (checked: boolean) => {
    onSettingsChange({ ...settings, hardMode: checked })
  }

  const { containerVariants, itemVariants } = useDialogAnimations({
    itemDirection: 'x',
    itemDistance: -10,
  })

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Configurações"
      description="Configurações do jogo incluindo modo difícil e alto contraste"
      borderColor="border-eucalyptus"
      titleGradientClassName="bg-gradient-to-r from-pistachio to-eucalyptus"
      maxHeight="none"
    >
      <ContentWrapper>
          <AnimatePresence>
            {open && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 py-4 pr-4"
              >
                <motion.div variants={itemVariants} className="flex items-center justify-between py-3 border-b border-night-600">
                  <div className="flex-1">
                    <div className="font-semibold">Contraste Alto</div>
                    <div className="text-xs text-muted-foreground">
                      Para melhor distinção de cores
                    </div>
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={handleHighContrastChange}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between py-3 border-b border-night-600">
                  <div className="flex-1">
                    <div className="font-semibold">Modo Difícil</div>
                    <div className="text-xs text-muted-foreground">
                      Todas as dicas devem ser usadas
                    </div>
                  </div>
                  <Switch
                    checked={settings.hardMode}
                    onCheckedChange={handleHardModeChange}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between py-3 border-b border-night-600">
                  <div className="flex-1">
                    <div className="font-semibold">Efeitos Sonoros</div>
                    <div className="text-xs text-muted-foreground">
                      Sons e memes durante o jogo
                    </div>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, soundEnabled: checked })}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between py-3 border-b border-night-600">
                  <div className="flex-1">
                    <div className="font-semibold">Mostrar tutorial ao abrir</div>
                    <div className="text-xs text-muted-foreground">
                      Abrir "Como jogar" automaticamente ao iniciar
                    </div>
                  </div>
                  <Switch
                    checked={settings.showHelpOnStart}
                    onCheckedChange={(checked) => onSettingsChange({ ...settings, showHelpOnStart: checked })}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="py-3 border-b border-night-600">
                  <button
                    onClick={() => {
                      onOpenChange(false)
                      onOpenStats()
                    }}
                    className="text-pistachio hover:text-pistachio font-semibold transition-colors"
                  >
                    Ver Estatísticas
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-xs text-muted-foreground text-center py-2 space-y-2">
                  <p>Jogo inspirado em Term.ooo / Wordle</p>
                  <p>Clone educativo sem fins comerciais</p>
                </motion.div>
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

