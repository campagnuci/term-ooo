// src/game/standings.ts
// Ordenação e rótulos do ranking ACUMULADO de uma partida multi-rodada.
//
//  - Time Trial: vence quem soma MAIS pontos (desempate: menor tempo total).
//  - Competição: vence quem soma MENOS tempo (desempate: mais rodadas resolvidas).

import { CompetitorResult, RoomGameType } from './room-types'

// Configuração de rodadas das partidas multi-rodada (espelha o servidor).
export const ROUND_PRESETS = [3, 5, 10]
export const MIN_ROUNDS = 1
export const MAX_ROUNDS = 20
export const DEFAULT_ROUNDS = 5

export function isTimeTrialType(gameType: RoomGameType): boolean {
  return gameType === 'timetrial'
}

/** Ordena o ranking acumulado conforme o critério do modo. Não muta a entrada. */
export function rankStandings(
  standings: CompetitorResult[],
  gameType: RoomGameType
): CompetitorResult[] {
  const tt = gameType === 'timetrial'
  return [...standings].sort((a, b) => {
    if (tt) {
      const pa = a.totalPoints ?? 0
      const pb = b.totalPoints ?? 0
      if (pb !== pa) return pb - pa
      return (a.totalMs ?? Number.POSITIVE_INFINITY) - (b.totalMs ?? Number.POSITIVE_INFINITY)
    }
    const ta = a.totalMs ?? Number.POSITIVE_INFINITY
    const tb = b.totalMs ?? Number.POSITIVE_INFINITY
    if (ta !== tb) return ta - tb
    return (b.roundsSolved ?? 0) - (a.roundsSolved ?? 0)
  })
}

/** Medalha por posição (0-based) no ranking acumulado. */
export function medalForIndex(index: number): string {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return ''
}
