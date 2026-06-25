// src/components/Room/TimeTrialPanel.tsx
// Painel inferior do modo Time Trial (competição contra o relógio).
//  - idle:   anfitrião escolhe o tempo + o modo e inicia; demais aguardam.
//  - active: enquanto joga não mostra nada; ao terminar, mostra seus pontos e aguarda.
//  - ended:  revela a(s) palavra(s) + pódio por PONTOS; anfitrião pode iniciar nova partida.
//
// Pontuação (servidor): só quem resolve pontua; mais tempo restante + menos
// tentativas usadas ⇒ mais pontos. Aqui apenas exibimos os pontos do servidor.

import { useState } from 'react'
import { Play, RefreshCw, Timer, Star } from 'lucide-react'
import { GameMode, GameState } from '@/game/types'
import { CompetitorResult, MatchStatus, RoundTiming } from '@/game/room-types'
import { formatDuration } from '@/lib/dates'
import { Z_INDEX } from '@/lib/z-index'

const MODES: { value: GameMode; label: string }[] = [
  { value: 'termo', label: 'Termo' },
  { value: 'dueto', label: 'Dueto' },
  { value: 'quarteto', label: 'Quarteto' },
]

/** Mínimo de jogadores para iniciar (espelha o servidor). */
const MIN_PLAYERS = 2

/** Limites do tempo (espelham o servidor). */
const TT_MIN_MS = 30_000
const TT_MAX_MS = 15 * 60_000
const TT_DEFAULT_MS = 120_000

const TIME_PRESETS: { ms: number; label: string }[] = [
  { ms: 60_000, label: '1 min' },
  { ms: 120_000, label: '2 min' },
  { ms: 180_000, label: '3 min' },
  { ms: 300_000, label: '5 min' },
]

function medal(index: number): string {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return ''
}

interface TimeTrialPanelProps {
  matchStatus: MatchStatus
  isHost: boolean
  gameState: GameState | null
  standings: CompetitorResult[]
  currentMode: GameMode
  memberCount: number
  currentUserId: string
  timing: RoundTiming
  onStartMatch: (mode?: GameMode, timeLimitMs?: number) => void
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full max-w-xl mx-auto mt-2 rounded-xl border border-night-600 bg-night-800/80 p-3 sm:p-4 text-center space-y-3"
      style={{ zIndex: Z_INDEX.ROOM_END_CONTROLS }}
    >
      {children}
    </div>
  )
}

/** Ordena por pontos (desc), desempate por tempo de resolução (asc). */
function rankByPoints(standings: CompetitorResult[]): CompetitorResult[] {
  return [...standings].sort((a, b) => {
    const pa = a.points ?? -1
    const pb = b.points ?? -1
    if (pb !== pa) return pb - pa
    const sa = a.solveMs ?? Number.POSITIVE_INFINITY
    const sb = b.solveMs ?? Number.POSITIVE_INFINITY
    return sa - sb
  })
}

function HostStarter({
  currentMode,
  selectedMs,
  setSelectedMs,
  customStr,
  setCustomStr,
  onStartMatch,
  label,
  icon,
  canStart,
}: {
  currentMode: GameMode
  selectedMs: number
  setSelectedMs: (ms: number) => void
  customStr: string
  setCustomStr: (s: string) => void
  onStartMatch: (mode?: GameMode, timeLimitMs?: number) => void
  label: string
  icon: React.ReactNode
  canStart: boolean
}) {
  const handleCustom = (value: string) => {
    setCustomStr(value)
    const sec = parseInt(value, 10)
    if (Number.isFinite(sec)) {
      setSelectedMs(Math.min(TT_MAX_MS, Math.max(TT_MIN_MS, sec * 1000)))
    } else {
      // Campo vazio/ inválido: volta ao padrão para não enviar um valor obsoleto.
      setSelectedMs(TT_DEFAULT_MS)
    }
  }

  return (
    <div className="space-y-3">
      {/* Tempo */}
      <div>
        <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
          <Timer className="w-3.5 h-3.5" /> Tempo do desafio:{' '}
          <span className="text-foreground font-semibold tabular-nums">{formatDuration(selectedMs)}</span>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.ms}
              type="button"
              onClick={() => {
                setSelectedMs(p.ms)
                setCustomStr('')
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMs === p.ms && customStr === ''
                  ? 'bg-night-700 text-foreground ring-2 ring-eucalyptus/60'
                  : 'bg-night-800 hover:bg-night-700 text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            min={TT_MIN_MS / 1000}
            max={TT_MAX_MS / 1000}
            step={15}
            value={customStr}
            onChange={(e) => handleCustom(e.target.value)}
            placeholder="seg."
            aria-label="Tempo personalizado em segundos"
            className="w-20 px-2 py-1.5 rounded-lg text-sm bg-night-800 border border-night-600 text-foreground text-center focus:border-eucalyptus focus:outline-none focus:ring-2 focus:ring-eucalyptus/40"
          />
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Personalizado em segundos (30–900). O relógio começa ao iniciar.
        </div>
      </div>

      {/* Modo */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Modo da partida</div>
        <div className="flex gap-2 justify-center">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onStartMatch(m.value, selectedMs)}
              disabled={!canStart}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                m.value === currentMode
                  ? 'bg-night-700 text-foreground ring-2 ring-eucalyptus/60'
                  : 'bg-night-800 hover:bg-night-700 text-foreground'
              }`}
              title={`Iniciar ${m.label} com ${formatDuration(selectedMs)}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Toque em um modo para iniciar a partida com ele.
        </div>
      </div>

      <button
        onClick={() => onStartMatch(undefined, selectedMs)}
        disabled={!canStart}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-eucalyptus hover:bg-eucalyptus-light text-[#eafbe0] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-eucalyptus"
      >
        {icon}
        {label} ({formatDuration(selectedMs)})
      </button>
      {!canStart && (
        <div className="text-xs text-amber-300/90">
          São necessários ao menos {MIN_PLAYERS} jogadores para iniciar.
        </div>
      )}
    </div>
  )
}

export function TimeTrialPanel({
  matchStatus,
  isHost,
  gameState,
  standings,
  currentMode,
  memberCount,
  currentUserId,
  timing,
  onStartMatch,
}: TimeTrialPanelProps) {
  const [selectedMs, setSelectedMs] = useState<number>(TT_DEFAULT_MS)
  const [customStr, setCustomStr] = useState<string>('')
  const canStart = memberCount >= MIN_PLAYERS

  // ----- idle: aguardando o anfitrião iniciar -----
  if (matchStatus === 'idle') {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 text-foreground font-bold">
          <Timer className="w-4 h-4 text-eucalyptus" /> Time Trial
        </div>
        {isHost ? (
          <HostStarter
            currentMode={currentMode}
            selectedMs={selectedMs}
            setSelectedMs={setSelectedMs}
            customStr={customStr}
            setCustomStr={setCustomStr}
            onStartMatch={onStartMatch}
            label="Iniciar desafio"
            icon={<Play className="w-4 h-4" />}
            canStart={canStart}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Aguardando o anfitrião iniciar o desafio…
          </div>
        )}
      </Shell>
    )
  }

  // ----- active: só aparece quando o jogador local já terminou -----
  if (matchStatus === 'active') {
    if (!gameState?.isGameOver) return null
    const myResult = standings.find((s) => s.userId === currentUserId)
    return (
      <Shell>
        <div className={`text-lg font-bold ${gameState.isWin ? 'text-green-400' : 'text-red-400'}`}>
          {gameState.isWin
            ? `🎉 Você resolveu em ${gameState.currentRow} tentativa${gameState.currentRow > 1 ? 's' : ''}!`
            : '💀 Você não acertou desta vez'}
        </div>
        {gameState.isWin && myResult && (
          <div className="flex items-center justify-center gap-3 text-sm">
            {typeof myResult.points === 'number' && (
              <span className="flex items-center gap-1 text-pistachio font-semibold tabular-nums">
                <Star className="w-3.5 h-3.5" aria-hidden="true" /> {myResult.points} pts
              </span>
            )}
            {typeof myResult.solveMs === 'number' && (
              <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                <Timer className="w-3.5 h-3.5" aria-hidden="true" /> {formatDuration(myResult.solveMs)}
              </span>
            )}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          O cronômetro segue correndo… aguardando os outros jogadores.
        </div>
      </Shell>
    )
  }

  // ----- ended: revela palavra(s) + pódio por pontos -----
  const revealWords = gameState ? gameState.boards.map((b) => b.solution).filter(Boolean) : []
  const plural = revealWords.length > 1
  const podium = rankByPoints(standings.filter((s) => s.solved)).slice(0, 3)
  const timedOut = timing.durationMs != null && timing.limitMs != null && timing.durationMs >= timing.limitMs

  return (
    <Shell>
      <div className="text-lg font-bold text-foreground">
        {timedOut ? '⏱️ Tempo esgotado!' : '🏁 Desafio encerrado!'}
      </div>

      {revealWords.length > 0 && (
        <div className="rounded-lg bg-night-900/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {plural ? 'Palavras' : 'Palavra'}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {revealWords.map((word, i) => (
              <span
                key={i}
                className="text-foreground font-bold text-base sm:text-lg uppercase tracking-wider"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {podium.length > 0 ? (
        <div className="space-y-1">
          {podium.map((p, i) => (
            <div
              key={p.userId}
              className="flex items-center justify-center gap-2 text-sm text-foreground"
            >
              <span>{medal(i)}</span>
              <span className="font-medium truncate max-w-[35%]">{p.nickname}</span>
              {typeof p.points === 'number' && (
                <span className="flex items-center gap-1 text-pistachio font-semibold tabular-nums">
                  <Star className="w-3 h-3" aria-hidden="true" /> {p.points}
                </span>
              )}
              {typeof p.solveMs === 'number' && (
                <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                  <Timer className="w-3 h-3" aria-hidden="true" /> {formatDuration(p.solveMs)}
                </span>
              )}
              <span className="text-muted-foreground">
                {p.attempts} tent.
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Ninguém resolveu a tempo.</div>
      )}

      {isHost ? (
        <HostStarter
          currentMode={currentMode}
          selectedMs={selectedMs}
          setSelectedMs={setSelectedMs}
          customStr={customStr}
          setCustomStr={setCustomStr}
          onStartMatch={onStartMatch}
          label="Novo desafio"
          icon={<RefreshCw className="w-4 h-4" />}
          canStart={canStart}
        />
      ) : (
        <div className="text-sm text-muted-foreground">
          Aguardando o anfitrião iniciar um novo desafio…
        </div>
      )}
    </Shell>
  )
}
