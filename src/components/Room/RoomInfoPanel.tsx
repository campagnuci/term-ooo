// src/components/Room/RoomInfoPanel.tsx
// Código da sala (copiar para convidar) + lista de membros com indicador de host.
// Em competição, a lista vira um ranking: medalhas para os primeiros a acertar,
// posição para os demais, 💀 para quem não conseguiu e ⏳ para quem ainda joga.

import { useState } from 'react'
import { Crown, Copy, Check } from 'lucide-react'
import { RoomMember, RoomGameType, MatchStatus, CompetitorResult } from '@/game/room-types'
import { formatDuration } from '@/lib/dates'

interface RoomInfoPanelProps {
  code: string
  members: RoomMember[]
  hostUserId: string
  currentUserId: string
  gameType: RoomGameType
  matchStatus: MatchStatus
  standings: CompetitorResult[]
}

/**
 * Texto/emoji da posição de um competidor (lado direito da linha).
 * `pos` é a colocação a exibir: ordem de acerto na Competição, ou posição por
 * pontos no Time Trial.
 */
function rankBadge(
  result: CompetitorResult | undefined,
  matchActive: boolean,
  pos: number | null
): string {
  if (!result) return matchActive ? '⏳' : ''
  if (!result.solved) return '💀'
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return pos ? `${pos}º` : '✅'
}

export function RoomInfoPanel({
  code,
  members,
  hostUserId,
  currentUserId,
  gameType,
  matchStatus,
  standings,
}: RoomInfoPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const link = `${window.location.origin}${import.meta.env.BASE_URL}sala/${code}`.replace(
        /([^:]\/)\/+/g,
        '$1'
      )
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível — ignora
    }
  }

  const isTimeTrial = gameType === 'timetrial'
  const isCompetitive = gameType === 'competition' || isTimeTrial
  const isRanking = isCompetitive && matchStatus !== 'idle'
  const standingsById = new Map(standings.map((s) => [s.userId, s]))

  // Time Trial: posição por PONTOS (desc), desempate por tempo de resolução (asc).
  const pointsRankById = new Map<string, number>()
  if (isTimeTrial) {
    standings
      .filter((s) => s.solved)
      .sort((a, b) => {
        const pa = a.points ?? -1
        const pb = b.points ?? -1
        if (pb !== pa) return pb - pa
        return (a.solveMs ?? Number.POSITIVE_INFINITY) - (b.solveMs ?? Number.POSITIVE_INFINITY)
      })
      .forEach((s, i) => pointsRankById.set(s.userId, i + 1))
  }

  // Posição a exibir: pontos (Time Trial) ou ordem de acerto (Competição).
  const posOf = (r: CompetitorResult | undefined): number | null => {
    if (!r || !r.solved) return null
    return isTimeTrial ? pointsRankById.get(r.userId) ?? null : r.solveRank
  }

  // Ordem de exibição competitiva: quem está melhor colocado no topo, depois
  // quem não acertou, e por fim quem ainda está jogando.
  const rankKey = (r: CompetitorResult | undefined): number => {
    if (!r) return 3_000_000 // ainda jogando
    if (r.solved) return posOf(r) ?? 1_000_000 // acertou: por colocação
    return 2_000_000 // não acertou
  }
  const orderedMembers = isRanking
    ? members
        .map((m, i) => ({ m, i }))
        .sort((a, b) => {
          const ka = rankKey(standingsById.get(a.m.userId))
          const kb = rankKey(standingsById.get(b.m.userId))
          return ka !== kb ? ka - kb : a.i - b.i
        })
        .map((x) => x.m)
    : members

  return (
    <div className="p-4 border-b border-night-600 space-y-3">
      {/* Código */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Código da sala</div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-night-800 hover:bg-night-700 rounded-lg transition-colors"
          aria-label="Copiar link da sala"
          title="Copiar link de convite"
        >
          <span className="text-lg font-mono font-bold tracking-[0.3em] text-foreground">{code}</span>
          {copied ? (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <Check className="w-4 h-4" /> copiado
            </span>
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Membros / ranking */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          {isRanking ? 'Ranking' : 'Jogadores'} ({members.length})
        </div>
        <ul className="space-y-1">
          {orderedMembers.map((m) => {
            const isHost = m.userId === hostUserId
            const isMe = m.userId === currentUserId
            const result = standingsById.get(m.userId)
            const badge = isCompetitive ? rankBadge(result, matchStatus === 'active', posOf(result)) : ''
            return (
              <li
                key={m.userId}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-foreground"
              >
                {isHost ? (
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate flex-1">
                  {m.nickname}
                  {isMe && <span className="text-muted-foreground"> (você)</span>}
                </span>
                {/* Time Trial: pontos. Competição: tempo de resolução. */}
                {result?.solved && isTimeTrial && typeof result.points === 'number' && (
                  <span
                    className="flex-shrink-0 text-[11px] text-pistachio font-semibold tabular-nums"
                    title="Pontos"
                  >
                    {result.points} pts
                  </span>
                )}
                {result?.solved && !isTimeTrial && typeof result.solveMs === 'number' && (
                  <span
                    className="flex-shrink-0 text-[11px] text-muted-foreground tabular-nums"
                    title="Tempo de resolução"
                  >
                    {formatDuration(result.solveMs)}
                  </span>
                )}
                {/* Tentativas usadas por quem acertou (ex.: "(3)" = resolveu em 3 tentativas). */}
                {result?.solved && (
                  <span
                    className="flex-shrink-0 text-[11px] text-muted-foreground tabular-nums"
                    title={`Resolveu em ${result.attempts} tentativa${result.attempts > 1 ? 's' : ''}`}
                  >
                    ({result.attempts})
                  </span>
                )}
                {badge && (
                  <span className="flex-shrink-0 text-base leading-none" title="Posição na partida">
                    {badge}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
