// src/components/Room/CompetitionPanel.tsx
// Painel inferior do modo Competição. Cobre os três estados da partida:
//  - idle:   anfitrião escolhe o modo e inicia; demais aguardam.
//  - active: enquanto joga não mostra nada; ao terminar, aguarda os outros.
//  - ended:  revela a(s) palavra(s) + pódio; anfitrião pode iniciar nova partida.

import { Play, RefreshCw, Flag, Timer } from 'lucide-react'
import { GameMode, GameState } from '@/game/types'
import { CompetitorResult, MatchStatus } from '@/game/room-types'
import { formatDuration } from '@/lib/dates'
import { Z_INDEX } from '@/lib/z-index'

const MODES: { value: GameMode; label: string }[] = [
  { value: 'termo', label: 'Termo' },
  { value: 'dueto', label: 'Dueto' },
  { value: 'quarteto', label: 'Quarteto' },
]

function medal(solveRank: number | null): string {
  if (solveRank === 1) return '🥇'
  if (solveRank === 2) return '🥈'
  if (solveRank === 3) return '🥉'
  return ''
}

/** Mínimo de jogadores para iniciar uma partida (espelha o servidor). */
const MIN_PLAYERS = 2

interface CompetitionPanelProps {
  matchStatus: MatchStatus
  isHost: boolean
  gameState: GameState | null
  standings: CompetitorResult[]
  currentMode: GameMode
  memberCount: number
  /** userId do jogador local, para destacar seu próprio tempo. */
  currentUserId: string
  onStartMatch: (mode?: GameMode) => void
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

function HostModeStarter({
  currentMode,
  onStartMatch,
  label,
  icon,
  canStart,
}: {
  currentMode: GameMode
  onStartMatch: (mode?: GameMode) => void
  label: string
  icon: React.ReactNode
  canStart: boolean
}) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-muted-foreground mb-1">Modo da partida</div>
        <div className="flex gap-2 justify-center">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onStartMatch(m.value)}
              disabled={!canStart}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                m.value === currentMode
                  ? 'bg-night-700 text-foreground ring-2 ring-eucalyptus/60'
                  : 'bg-night-800 hover:bg-night-700 text-foreground'
              }`}
              title={`Iniciar partida em ${m.label}`}
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
        onClick={() => onStartMatch()}
        disabled={!canStart}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-eucalyptus hover:bg-eucalyptus-light text-[#eafbe0] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-eucalyptus"
      >
        {icon}
        {label}
      </button>
      {!canStart && (
        <div className="text-xs text-amber-300/90">
          São necessários ao menos {MIN_PLAYERS} jogadores para iniciar.
        </div>
      )}
    </div>
  )
}

export function CompetitionPanel({
  matchStatus,
  isHost,
  gameState,
  standings,
  currentMode,
  memberCount,
  currentUserId,
  onStartMatch,
}: CompetitionPanelProps) {
  const canStart = memberCount >= MIN_PLAYERS

  // ----- idle: aguardando o anfitrião iniciar -----
  if (matchStatus === 'idle') {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 text-foreground font-bold">
          <Flag className="w-4 h-4 text-eucalyptus" /> Competição
        </div>
        {isHost ? (
          <HostModeStarter
            currentMode={currentMode}
            onStartMatch={onStartMatch}
            label="Iniciar partida"
            icon={<Play className="w-4 h-4" />}
            canStart={canStart}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Aguardando o anfitrião iniciar a partida…
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
        {gameState.isWin && typeof myResult?.solveMs === 'number' && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-pistachio">
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums font-semibold">{formatDuration(myResult.solveMs)}</span>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Aguardando os outros jogadores terminarem…
        </div>
      </Shell>
    )
  }

  // ----- ended: revela palavra(s) + pódio -----
  const revealWords = gameState ? gameState.boards.map((b) => b.solution).filter(Boolean) : []
  const plural = revealWords.length > 1
  const podium = standings
    .filter((s) => s.solved && s.solveRank !== null)
    .sort((a, b) => (a.solveRank ?? 0) - (b.solveRank ?? 0))
    .slice(0, 3)

  return (
    <Shell>
      <div className="text-lg font-bold text-foreground">🏁 Partida encerrada!</div>

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

      {podium.length > 0 && (
        <div className="space-y-1">
          {podium.map((p) => (
            <div
              key={p.userId}
              className="flex items-center justify-center gap-2 text-sm text-foreground"
            >
              <span>{medal(p.solveRank)}</span>
              <span className="font-medium truncate max-w-[45%]">{p.nickname}</span>
              <span className="text-muted-foreground">
                {p.attempts} tentativa{p.attempts > 1 ? 's' : ''}
              </span>
              {typeof p.solveMs === 'number' && (
                <span className="flex items-center gap-1 text-pistachio tabular-nums">
                  <Timer className="w-3 h-3" aria-hidden="true" />
                  {formatDuration(p.solveMs)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {isHost ? (
        <HostModeStarter
          currentMode={currentMode}
          onStartMatch={onStartMatch}
          label="Nova partida"
          icon={<RefreshCw className="w-4 h-4" />}
          canStart={canStart}
        />
      ) : (
        <div className="text-sm text-muted-foreground">
          Aguardando o anfitrião iniciar uma nova partida…
        </div>
      )}
    </Shell>
  )
}
