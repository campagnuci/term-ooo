// src/components/Room/RoomTimer.tsx
// Cronômetro compartilhado da sala: mesmo valor para todos os jogadores.
//
// O início é sincronizado pelo servidor e ancorado no relógio local de cada
// cliente (RoundTiming.startLocal); o tique é local (sem tráfego por segundo).
// Ao terminar a rodada, congela na duração final (idêntica para todos).

import { RoundTiming } from '@/game/room-types'
import { GameTimer } from '@/components/GameTimer'
import { cn } from '@/lib/utils'

interface RoomTimerProps {
  timing: RoundTiming
  className?: string
}

export function RoomTimer({ timing, className }: RoomTimerProps) {
  const { startLocal, durationMs, limitMs } = timing

  // Nada a mostrar enquanto não há âncora de início (ex.: competição ociosa,
  // coop antes do host digitar). Sem startLocal não há como exibir um valor
  // correto, então ocultamos em vez de mostrar 0:00.
  if (startLocal == null) return null

  const isOver = durationMs != null
  const endTime = durationMs != null ? startLocal + durationMs : null

  return (
    <div className={cn('flex justify-center', className)}>
      <GameTimer
        startTime={startLocal}
        endTime={endTime}
        isGameOver={isOver}
        countdownFromMs={limitMs}
      />
    </div>
  )
}
