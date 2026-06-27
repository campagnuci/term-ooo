// src/components/Room/MatchScore.tsx
// Peças compartilhadas das partidas multi-rodada (Competição e Time Trial):
//  - RoundsSelector: o host escolhe o número de rodadas (3/5/10 + custom 1..20).
//  - CumulativeStandings: ranking ACUMULADO (pontos no Time Trial, tempo na
//    Competição), ordenado pelo critério do modo.

import { Star, Timer } from 'lucide-react'
import { CompetitorResult, RoomGameType } from '@/game/room-types'
import { rankStandings, medalForIndex, ROUND_PRESETS, MIN_ROUNDS, MAX_ROUNDS } from '@/game/standings'
import { formatDuration } from '@/lib/dates'

export function RoundsSelector({
  rounds,
  customStr,
  onPreset,
  onCustom,
}: {
  rounds: number
  customStr: string
  onPreset: (n: number) => void
  onCustom: (s: string) => void
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">Número de rodadas (pontuação acumulada)</div>
      <div className="flex gap-2 justify-center flex-wrap">
        {ROUND_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPreset(n)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              rounds === n && customStr === ''
                ? 'bg-night-700 text-foreground ring-2 ring-eucalyptus/60'
                : 'bg-night-800 hover:bg-night-700 text-foreground'
            }`}
          >
            {n}
          </button>
        ))}
        <input
          type="number"
          inputMode="numeric"
          min={MIN_ROUNDS}
          max={MAX_ROUNDS}
          step={1}
          value={customStr}
          onChange={(e) => onCustom(e.target.value)}
          placeholder="nº"
          aria-label="Número de rodadas personalizado"
          className="w-16 px-2 py-1.5 rounded-lg text-sm bg-night-800 border border-night-600 text-foreground text-center focus:border-eucalyptus focus:outline-none focus:ring-2 focus:ring-eucalyptus/40"
        />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">
        {`De ${MIN_ROUNDS} a ${MAX_ROUNDS}. As pontuações somam a cada rodada.`}
      </div>
    </div>
  )
}

export function CumulativeStandings({
  standings,
  gameType,
  currentUserId,
  limit,
  title,
}: {
  standings: CompetitorResult[]
  gameType: RoomGameType
  currentUserId: string
  /** Quantas linhas exibir (top-N). Omitido = todas. */
  limit?: number
  title?: string
}) {
  const tt = gameType === 'timetrial'
  const ranked = rankStandings(standings, gameType)
  const rows = typeof limit === 'number' ? ranked.slice(0, limit) : ranked

  if (rows.length === 0) return null

  return (
    <div className="space-y-1">
      {title && (
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      )}
      {rows.map((r, i) => {
        const medal = medalForIndex(i)
        const isMe = r.userId === currentUserId
        return (
          <div
            key={r.userId}
            className={`flex items-center justify-center gap-2 text-sm ${
              isMe ? 'text-foreground font-medium' : 'text-foreground'
            }`}
          >
            <span className="w-5 text-right tabular-nums text-muted-foreground">
              {medal || `${i + 1}º`}
            </span>
            <span className="truncate max-w-[40%]">
              {r.nickname}
              {isMe && <span className="text-muted-foreground"> (você)</span>}
            </span>
            {tt ? (
              <span className="flex items-center gap-1 text-pistachio font-semibold tabular-nums">
                <Star className="w-3 h-3" aria-hidden="true" /> {r.totalPoints ?? 0}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                <Timer className="w-3 h-3" aria-hidden="true" /> {formatDuration(r.totalMs ?? 0)}
              </span>
            )}
            {typeof r.roundsSolved === 'number' && typeof r.roundsPlayed === 'number' && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {r.roundsSolved}/{r.roundsPlayed} ✓
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
