// src/components/Room/RoundCountdown.tsx
// Contagem regressiva pré-rodada (5 → 1 → "Vai!"), mostrada a TODOS antes de
// cada rodada de uma partida competitiva. Ancorada em `startsAt` (epoch LOCAL),
// então host e jogadores veem o mesmo instante de início. Entre rodadas, exibe
// também a classificação acumulada para o jogador se situar.
//
// O áudio (bipes + "Vai!") é sintetizado via Web Audio (sem assets), respeitando
// a preferência de som do usuário.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CompetitorResult, RoomGameType } from '@/game/room-types'
import { Z_INDEX } from '@/lib/z-index'
import { CumulativeStandings } from './MatchScore'

/** Duração do "Vai!" após o início, antes de sumir (ms). */
const GO_MS = 800

type AudioCtor = typeof AudioContext

// AudioContext único e reaproveitado entre rodadas (em vez de um por montagem),
// evitando acúmulo de contextos e o ciclo de criação/fechamento por rodada.
let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    const Ctor: AudioCtor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedAudioCtx) sharedAudioCtx = new Ctor()
    if (sharedAudioCtx.state === 'suspended') void sharedAudioCtx.resume()
    return sharedAudioCtx
  } catch {
    return null
  }
}

function playBeep(freq: number, durSec: number, gain: number) {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(g)
    g.connect(ctx.destination)
    const t0 = ctx.currentTime
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec)
    osc.start(t0)
    osc.stop(t0 + durSec)
  } catch {
    // Web Audio indisponível/bloqueado — segue sem som.
  }
}

interface RoundCountdownProps {
  /** Epoch LOCAL (ms) em que a rodada começa. */
  startsAt: number
  round: number
  totalRounds: number
  standings: CompetitorResult[]
  gameType: RoomGameType
  currentUserId: string
  soundEnabled: boolean
  onComplete: () => void
}

export function RoundCountdown({
  startsAt,
  round,
  totalRounds,
  standings,
  gameType,
  currentUserId,
  soundEnabled,
  onComplete,
}: RoundCountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now())
  const lastBeepRef = useRef<number | null>(null)
  const wentRef = useRef(false)

  // Tique local (rápido o bastante para um número suave, leve o bastante para
  // não pesar). O componente é remontado por rodada (key={startsAt} no pai).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])

  const remaining = startsAt - now
  const secondsLeft = Math.ceil(remaining / 1000)
  const inGo = remaining <= 0

  // Bipes a cada segundo (5..1) e tom de "Vai!" no início.
  useEffect(() => {
    if (!soundEnabled) return
    if (!inGo && secondsLeft > 0 && secondsLeft <= 5 && lastBeepRef.current !== secondsLeft) {
      lastBeepRef.current = secondsLeft
      playBeep(660, 0.12, 0.05)
    }
    if (inGo && !wentRef.current) {
      wentRef.current = true
      playBeep(990, 0.28, 0.07)
    }
  }, [secondsLeft, inGo, soundEnabled])

  // Após o "Vai!", encerra o overlay.
  useEffect(() => {
    if (!inGo) return
    const t = setTimeout(onComplete, GO_MS)
    return () => clearTimeout(t)
  }, [inGo, onComplete])

  const showStandings = !inGo && standings.length > 0

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.ROOM_RESULT_OVERLAY }}
    >
      {/* Fundo escurecido só durante a contagem; no "Vai!" libera para jogar. */}
      {!inGo && <div className="absolute inset-0 bg-night/80 backdrop-blur-sm" aria-hidden="true" />}

      <div className={`relative text-center ${inGo ? 'pointer-events-none' : ''}`}>
        {!inGo && round > 0 && totalRounds > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-3">
            Rodada {round} de {totalRounds}
          </div>
        )}

        {showStandings && (
          <div className="mb-5 max-w-xs mx-auto rounded-xl border border-night-600 bg-night-800/80 p-3">
            <CumulativeStandings
              standings={standings}
              gameType={gameType}
              currentUserId={currentUserId}
              limit={5}
              title="Classificação"
            />
          </div>
        )}

        {inGo ? (
          <div className="relative inline-flex items-center justify-center">
            {/* Onda de energia que explode e some atrás do texto. */}
            <motion.span
              aria-hidden="true"
              className="absolute h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-eucalyptus/40 blur-2xl"
              initial={{ scale: 0.3, opacity: 0.7 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
            {/* "Vai!" entra com mola (overshoot) + leve giro e um brilho. */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -16 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 11, mass: 0.7 }}
              className="relative text-6xl sm:text-7xl font-extrabold text-eucalyptus-light drop-shadow-[0_0_22px_rgba(36,122,111,0.65)]"
            >
              Vai!
            </motion.div>
          </div>
        ) : (
          <motion.div
            key={secondsLeft}
            initial={{ scale: 1.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, mass: 0.6 }}
            className="text-7xl sm:text-8xl font-extrabold text-foreground tabular-nums"
          >
            {Math.max(1, secondsLeft)}
          </motion.div>
        )}

        {!inGo && (
          <div className="text-xs text-muted-foreground mt-3">Prepare-se…</div>
        )}
      </div>
    </div>
  )
}
