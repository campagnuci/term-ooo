// src/components/Room/RoomInfoPanel.tsx
// Código da sala (copiar para convidar) + lista de membros com indicador de host.
// Em partidas competitivas vira um RANKING ACUMULADO: ordena pelo critério do
// modo (Time Trial = mais pontos; Competição = menor tempo total), com medalhas
// para o pódio. Cada linha também mostra o status da RODADA corrente
// (✅ resolveu / 💀 não / ⏳ jogando).

import { useState } from 'react'
import { Crown, Copy, Check, Star, Timer } from 'lucide-react'
import { RoomMember, RoomGameType, MatchStatus, CompetitorResult } from '@/game/room-types'
import { rankStandings, medalForIndex } from '@/game/standings'
import { formatDuration } from '@/lib/dates'

interface RoomInfoPanelProps {
  code: string
  members: RoomMember[]
  hostUserId: string
  currentUserId: string
  gameType: RoomGameType
  matchStatus: MatchStatus
  /** Ranking ACUMULADO da partida. */
  standings: CompetitorResult[]
  /** Resultado da rodada CORRENTE (status ao vivo). */
  roundFinishers: CompetitorResult[]
  currentRound: number
  totalRounds: number
}

export function RoomInfoPanel({
  code,
  members,
  hostUserId,
  currentUserId,
  gameType,
  matchStatus,
  standings,
  roundFinishers,
  currentRound,
  totalRounds,
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

  const tt = gameType === 'timetrial'
  const isCompetitive = gameType === 'competition' || tt
  const isRanking = isCompetitive && matchStatus !== 'idle'
  const matchActive = matchStatus === 'active'

  const cumById = new Map(standings.map((s) => [s.userId, s]))
  const roundById = new Map(roundFinishers.map((f) => [f.userId, f]))
  const membersById = new Map(members.map((m) => [m.userId, m]))

  // Ordem do ranking: quem tem pontuação acumulada primeiro (pelo critério do
  // modo); depois os demais membros (ex.: rodada 1 antes de pontuar, ou quem
  // entrou no meio) em ordem de entrada. Inclui também competidores que saíram
  // (placar congelado nas standings, mas não mais em `members`).
  const ranked = rankStandings(standings, gameType)
  const rankedIds = new Set(ranked.map((s) => s.userId))
  const orderedIds = isRanking
    ? [...ranked.map((s) => s.userId), ...members.filter((m) => !rankedIds.has(m.userId)).map((m) => m.userId)]
    : members.map((m) => m.userId)

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
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center justify-between gap-2">
          <span>
            {isRanking ? 'Ranking' : 'Jogadores'} ({members.length})
          </span>
          {isRanking && totalRounds > 1 && (
            <span className="text-eucalyptus-light font-semibold normal-case tracking-normal">
              Rodada {currentRound}/{totalRounds}
            </span>
          )}
        </div>
        <ul className="space-y-1">
          {orderedIds.map((uid, idx) => {
            const member = membersById.get(uid)
            const cum = cumById.get(uid)
            const rnd = roundById.get(uid)
            const nickname = member?.nickname ?? cum?.nickname ?? '—'
            const isHost = uid === hostUserId
            const isMe = uid === currentUserId
            const inRanking = isRanking && rankedIds.has(uid)
            const medal = inRanking ? medalForIndex(idx) : ''

            return (
              <li
                key={uid}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-foreground"
              >
                {isHost ? (
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate flex-1">
                  {nickname}
                  {isMe && <span className="text-muted-foreground"> (você)</span>}
                </span>

                {/* Pontuação ACUMULADA (pontos no Time Trial; tempo na Competição). */}
                {inRanking && cum && (
                  <span
                    className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
                      tt ? 'text-pistachio' : 'text-muted-foreground'
                    }`}
                    title={tt ? 'Pontos acumulados' : 'Tempo total acumulado'}
                  >
                    {tt ? <Star className="w-3 h-3" aria-hidden="true" /> : <Timer className="w-3 h-3" aria-hidden="true" />}
                    {tt ? cum.totalPoints ?? 0 : formatDuration(cum.totalMs ?? 0)}
                  </span>
                )}

                {/* Direita: no fim da partida, posição final (medalha/lugar);
                    durante a partida, status da rodada corrente. */}
                {isRanking && (
                  <span
                    className="flex-shrink-0 text-base leading-none min-w-[1.5rem] text-center"
                    title={
                      matchStatus === 'ended'
                        ? 'Posição final'
                        : rnd
                          ? rnd.solved
                            ? `Resolveu a rodada em ${rnd.attempts} tentativa${rnd.attempts > 1 ? 's' : ''}`
                            : 'Não resolveu a rodada'
                          : matchActive
                            ? 'Ainda jogando'
                            : ''
                    }
                  >
                    {matchStatus === 'ended'
                      ? medal || (inRanking ? `${idx + 1}º` : '')
                      : rnd
                        ? rnd.solved
                          ? '✅'
                          : '💀'
                        : matchActive
                          ? '⏳'
                          : ''}
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
