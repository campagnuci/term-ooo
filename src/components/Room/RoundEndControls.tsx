// src/components/Room/RoundEndControls.tsx
// Controles de fim de rodada. Host: nova palavra + trocar modo.
// Espectador: aviso de espera.

import { RefreshCw } from 'lucide-react'
import { GameMode } from '@/game/types'
import { Z_INDEX } from '@/lib/z-index'

const MODES: { value: GameMode; label: string }[] = [
  { value: 'termo', label: 'Termo' },
  { value: 'dueto', label: 'Dueto' },
  { value: 'quarteto', label: 'Quarteto' },
]

interface RoundEndControlsProps {
  isHost: boolean
  isWin: boolean
  resultMessage: string
  currentMode: GameMode
  onNewWord: () => void
  onChangeMode: (mode: GameMode) => void
}

export function RoundEndControls({
  isHost,
  isWin,
  resultMessage,
  currentMode,
  onNewWord,
  onChangeMode,
}: RoundEndControlsProps) {
  return (
    <div
      className="relative w-full max-w-xl mx-auto mt-2 rounded-xl border border-night-600 bg-night-800/80 p-3 sm:p-4 text-center space-y-3"
      style={{ zIndex: Z_INDEX.ROOM_END_CONTROLS }}
    >
      <div className={`text-lg font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
        {resultMessage}
      </div>

      {isHost ? (
        <div className="space-y-3">
          <button
            onClick={onNewWord}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-eucalyptus hover:bg-eucalyptus-light text-[#eafbe0] font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Nova palavra
          </button>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Trocar modo (inicia nova palavra)</div>
            <div className="flex gap-2 justify-center">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => onChangeMode(m.value)}
                  disabled={m.value === currentMode}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    m.value === currentMode
                      ? 'bg-night-700 text-muted-foreground cursor-default'
                      : 'bg-night-800 hover:bg-night-700 text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Aguardando o anfitrião iniciar uma nova palavra…</div>
      )}
    </div>
  )
}
