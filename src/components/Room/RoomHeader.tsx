// src/components/Room/RoomHeader.tsx
// Cabeçalho enxuto da tela de sala.

import { ArrowLeft, Users, Wifi, WifiOff } from 'lucide-react'
import { GameMode } from '@/game/types'
import { Button } from '@/components/ui/button'
import { formatLatency, getLatencyColor } from '@/lib/chat-utils'

const MODE_LABEL: Record<GameMode, string> = {
  termo: 'TERMO',
  dueto: 'DUETO',
  quarteto: 'QUARTETO',
}

interface RoomHeaderProps {
  code: string
  mode: GameMode
  memberCount: number
  connected: boolean
  latency: number | null
  isHost: boolean
  onLeave: () => void
}

export function RoomHeader({
  code,
  mode,
  memberCount,
  connected,
  latency,
  isHost,
  onLeave,
}: RoomHeaderProps) {
  return (
    <header className="border-b border-night-600 bg-night-800/50 backdrop-blur-sm flex-shrink-0 z-10">
      <div className="max-w-7xl mx-auto px-2 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeave}
          aria-label="Sair da sala"
          className="text-foreground hover:text-foreground flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-foreground text-sm sm:text-lg uppercase tracking-wider font-bold truncate">
            Sala {code}
          </h1>
          <span className="text-[10px] sm:text-xs bg-night-700 text-foreground px-2 py-0.5 rounded-full flex-shrink-0">
            {MODE_LABEL[mode]}
          </span>
          {isHost && (
            <span className="text-[10px] sm:text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
              anfitrião
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-foreground text-sm">
            <Users className="w-4 h-4" />
            <span>{memberCount}</span>
          </div>
          {connected ? (
            <span className="flex items-center gap-1">
              <Wifi className="w-4 h-4 text-green-500" />
              {latency !== null && (
                <span className={`text-xs ${getLatencyColor(latency)}`}>
                  {formatLatency(latency)}
                </span>
              )}
            </span>
          ) : (
            <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  )
}
