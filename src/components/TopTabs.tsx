// src/components/TopTabs.tsx
import { GameMode } from '@/game/types'
import { motion, AnimatePresence } from 'framer-motion'

/** Abas disponíveis: os modos diários + o Modo Treino (single player, ilimitado). */
export type TabValue = GameMode | 'treino'

interface TopTabsProps {
  currentMode: GameMode
  isTraining: boolean
  onModeChange: (mode: TabValue) => void
  isVisible: boolean
}

export function TopTabs({ currentMode, isTraining, onModeChange, isVisible }: TopTabsProps) {
  const modes: {
    value: TabValue;
    label: string;
  }[] = [
    { value: 'termo', label: 'Termo' },
    { value: 'dueto', label: 'Dueto' },
    { value: 'quarteto', label: 'Quarteto' },
    { value: 'seis', label: 'Modo 6' },
    { value: 'treino', label: '🎮 Treino' },
  ];

  const activeTab: TabValue = isTraining ? 'treino' : currentMode

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="border-b border-night-600 bg-night-800/30 overflow-hidden z-10"
        >
          <div className="max-w-7xl mx-auto px-2 py-2 sm:px-4 sm:py-3">
            <div className="flex gap-2 justify-center">
              {modes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => onModeChange(mode.value)}
                  className={`
                    flex items-center
                    px-4 sm:px-6 py-1 rounded-sm transition-all duration-200
                    text-sm sm:text-base
                    ${
                      activeTab === mode.value
                        ? "bg-eucalyptus text-[#eafbe0] shadow-lg"
                        : "bg-transparent text-muted-foreground hover:bg-night-700/50"
                    }
                  `}
                >
                  <span className="font-medium">
                    {mode.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
