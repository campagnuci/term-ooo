// src/components/Room/CompetitionPanel.tsx
// Painel inferior do modo Competição — agora uma CORRIDA DE TEMPO acumulada por
// N rodadas: soma-se o tempo de resolução de cada rodada e vence quem somar
// MENOS tempo. Quem não resolve uma rodada recebe (tempo do solver mais lento)
// + 1 min; se ninguém resolve, a rodada é anulada.
//  - idle:   anfitrião escolhe rodadas + modo e inicia; demais aguardam.
//  - active: enquanto joga não mostra nada; ao terminar a rodada, mostra seu
//            tempo da rodada + a classificação acumulada e aguarda.
//  - ended:  revela a(s) palavra(s) + classificação final por tempo total.

import { useState } from 'react'
import { Play, RefreshCw, Flag, Timer } from 'lucide-react'
import { GameMode, GameState } from '@/game/types'
import { CompetitorResult, MatchStatus } from '@/game/room-types'
import { formatDuration } from '@/lib/dates'
import { Z_INDEX } from '@/lib/z-index'
import { RoundsSelector, CumulativeStandings } from './MatchScore'
import { DEFAULT_ROUNDS, MIN_ROUNDS, MAX_ROUNDS } from '@/game/standings'

const MODES: { value: GameMode; label: string }[] = [
  { value: 'termo', label: 'Termo' },
  { value: 'dueto', label: 'Dueto' },
  { value: 'quarteto', label: 'Quarteto' },
]

/** Mínimo de jogadores para iniciar uma partida (espelha o servidor). */
const MIN_PLAYERS = 2

interface CompetitionPanelProps {
  matchStatus: MatchStatus
  isHost: boolean
  gameState: GameState | null
  /** Ranking ACUMULADO da partida (menor tempo total vence). */
  standings: CompetitorResult[]
  /** Resultado da rodada CORRENTE (tempo da rodada do jogador). */
  roundFinishers: CompetitorResult[]
  currentRound: number
  totalRounds: number
  currentMode: GameMode
  memberCount: number
  /** userId do jogador local, para destacar seu próprio tempo. */
  currentUserId: string
  onStartMatch: (mode?: GameMode, timeLimitMs?: number, rounds?: number) => void
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
  rounds,
  setRounds,
  roundsCustomStr,
  setRoundsCustomStr,
  onStartMatch,
  label,
  icon,
  canStart,
}: {
  currentMode: GameMode
  rounds: number
  setRounds: (n: number) => void
  roundsCustomStr: string
  setRoundsCustomStr: (s: string) => void
  onStartMatch: (mode?: GameMode, timeLimitMs?: number, rounds?: number) => void
  label: string
  icon: React.ReactNode
  canStart: boolean
}) {
  const handleRoundsCustom = (value: string) => {
    setRoundsCustomStr(value)
    const n = parseInt(value, 10)
    if (Number.isFinite(n)) {
      setRounds(Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, n)))
    } else {
      setRounds(DEFAULT_ROUNDS)
    }
  }

  return (
    <div className="space-y-3">
      {/* Rodadas */}
      <RoundsSelector
        rounds={rounds}
        customStr={roundsCustomStr}
        onPreset={(n) => {
          setRounds(n)
          setRoundsCustomStr('')
        }}
        onCustom={handleRoundsCustom}
      />

      {/* Modo */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Modo da partida</div>
        <div className="flex gap-2 justify-center">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onStartMatch(m.value, undefined, rounds)}
              disabled={!canStart}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                m.value === currentMode
                  ? 'bg-night-700 text-foreground ring-2 ring-eucalyptus/60'
                  : 'bg-night-800 hover:bg-night-700 text-foreground'
              }`}
              title={`Iniciar ${m.label} • ${rounds} rodada(s)`}
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
        onClick={() => onStartMatch(undefined, undefined, rounds)}
        disabled={!canStart}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-eucalyptus hover:bg-eucalyptus-light text-[#eafbe0] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-eucalyptus"
      >
        {icon}
        {label} ({rounds}×)
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
  roundFinishers,
  currentRound,
  totalRounds,
  currentMode,
  memberCount,
  currentUserId,
  onStartMatch,
}: CompetitionPanelProps) {
  const [rounds, setRounds] = useState<number>(DEFAULT_ROUNDS)
  const [roundsCustomStr, setRoundsCustomStr] = useState<string>('')
  const canStart = memberCount >= MIN_PLAYERS

  const roundLabel = totalRounds > 1 ? `Rodada ${currentRound} de ${totalRounds}` : null

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
            rounds={rounds}
            setRounds={setRounds}
            roundsCustomStr={roundsCustomStr}
            setRoundsCustomStr={setRoundsCustomStr}
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

  // ----- active: só aparece quando o jogador local já terminou a rodada -----
  if (matchStatus === 'active') {
    if (!gameState?.isGameOver) return null
    const myRound = roundFinishers.find((s) => s.userId === currentUserId)
    return (
      <Shell>
        {roundLabel && <div className="text-xs text-muted-foreground">{roundLabel}</div>}
        <div className={`text-lg font-bold ${gameState.isWin ? 'text-green-400' : 'text-red-400'}`}>
          {gameState.isWin
            ? `🎉 Você resolveu em ${gameState.currentRow} tentativa${gameState.currentRow > 1 ? 's' : ''}!`
            : '💀 Você não acertou esta rodada'}
        </div>
        {gameState.isWin && typeof myRound?.solveMs === 'number' && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-pistachio">
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="tabular-nums font-semibold">{formatDuration(myRound.solveMs)}</span>
          </div>
        )}
        {standings.length > 0 && (
          <CumulativeStandings
            standings={standings}
            gameType="competition"
            currentUserId={currentUserId}
            limit={5}
            title="Classificação (tempo total)"
          />
        )}
        <div className="text-sm text-muted-foreground">
          Aguardando os outros jogadores terminarem…
        </div>
      </Shell>
    )
  }

  // ----- ended: revela palavra(s) + classificação final por tempo total -----
  const revealWords = gameState ? gameState.boards.map((b) => b.solution).filter(Boolean) : []
  const plural = revealWords.length > 1

  return (
    <Shell>
      <div className="text-lg font-bold text-foreground">🏁 Partida encerrada!</div>
      {totalRounds > 1 && (
        <div className="text-xs text-muted-foreground">Partida de {totalRounds} rodadas</div>
      )}

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

      {standings.length > 0 && (
        <CumulativeStandings
          standings={standings}
          gameType="competition"
          currentUserId={currentUserId}
          title="Classificação final (menor tempo vence)"
        />
      )}

      {isHost ? (
        <HostModeStarter
          currentMode={currentMode}
          rounds={rounds}
          setRounds={setRounds}
          roundsCustomStr={roundsCustomStr}
          setRoundsCustomStr={setRoundsCustomStr}
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
