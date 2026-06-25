// src/components/GameTimer.tsx
import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { formatDuration } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface GameTimerProps {
  /** Timestamp (ms) de início da resolução. null = ainda não começou. */
  startTime?: number | null
  /** Timestamp (ms) de término. null = jogo em andamento. */
  endTime?: number | null
  /** Jogo finalizado: congela o cronômetro no tempo final. */
  isGameOver: boolean
  /**
   * Modo contagem regressiva (Time Trial): mostra o tempo RESTANTE a partir
   * deste limite (ms) em vez do tempo decorrido. null/undefined = conta para cima.
   */
  countdownFromMs?: number | null
  className?: string
}

/**
 * Cronômetro discreto em tempo real, exibido durante a partida em todos os modos.
 * Padrão: conta o tempo decorrido e congela ao terminar.
 * Com `countdownFromMs`: conta de forma regressiva (Time Trial) e fica em destaque
 * de urgência nos segundos finais.
 */
export function GameTimer({ startTime, endTime, isGameOver, countdownFromMs, className }: GameTimerProps) {
  const [now, setNow] = useState<number>(() => Date.now())

  const running = startTime != null && !isGameOver && endTime == null

  useEffect(() => {
    if (!running) return

    // Sincroniza imediatamente (em callback, fora do corpo do efeito, para não
    // disparar um setState síncrono) — evita até 1s de atraso ao montar/retomar
    // no meio de um segundo (ex.: reconexão em sala).
    const sync = setTimeout(() => setNow(Date.now()), 0)
    // Atualiza o relógio a cada segundo enquanto a partida está em andamento.
    const interval = setInterval(() => {
      const t = Date.now()
      setNow(t)
      // Contagem regressiva já zerou: para de tiquetaquear (evita re-renders
      // inúteis até o `match-end` do servidor chegar e congelar de vez).
      if (countdownFromMs != null && startTime != null && t - startTime >= countdownFromMs) {
        clearInterval(interval)
      }
    }, 1000)
    return () => {
      clearTimeout(sync)
      clearInterval(interval)
    }
  }, [running, startTime, countdownFromMs])

  const elapsedMs = startTime != null ? (endTime ?? now) - startTime : 0

  const isCountdown = countdownFromMs != null
  const displayMs = isCountdown ? Math.max(0, countdownFromMs - elapsedMs) : elapsedMs
  // Urgência: contagem regressiva em andamento com <= 10s restantes.
  const urgent = isCountdown && !isGameOver && displayMs <= 10_000

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 font-mono text-sm tabular-nums select-none',
        urgent ? 'text-red-400 animate-pulse' : 'text-muted-foreground/70',
        isGameOver && !urgent && 'text-pistachio/80',
        className
      )}
      aria-label={isCountdown ? 'Tempo restante' : 'Tempo de resolução'}
      title={isCountdown ? 'Tempo restante' : 'Tempo de resolução'}
    >
      <Timer className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{formatDuration(displayMs)}</span>
    </div>
  )
}
