// src/lib/dates.ts
// 🕐 MÓDULO CENTRAL DE DATAS
// Todas as operações de data/hora da aplicação devem usar estas funções

// Data inicial do Term.ooo: 1 de janeiro de 2022 às 00:00 (horário de São Paulo)
// Corrigido após análise dos logs: START_DAY = 1 (não 2)
const START_YEAR = 2022
const START_MONTH = 0 // Janeiro (0-indexed)
const START_DAY = 1

/**
 * Obtém a data de HOJE normalizada (00:00:00 local)
 * Esta é a ÚNICA função que deve criar "hoje" em toda a aplicação
 */
export function getTodayNormalized(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Obtém a data de início normalizada (00:00:00)
 */
export function getStartDate(): Date {
  return new Date(START_YEAR, START_MONTH, START_DAY)
}

/**
 * Calcula o número de dias desde o início (dayNumber)
 * Dia 1 = 02/01/2022
 */
export function getDayNumber(): number {
  const today = getTodayNormalized()
  const start = getStartDate()
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // +1 porque o primeiro dia é 1, não 0
}

/**
 * Converte um dayNumber em uma Date
 * dayNumber 1 = 02/01/2022
 */
export function getDateFromDayNumber(dayNumber: number): Date {
  const start = getStartDate()
  const date = new Date(start)
  date.setDate(date.getDate() + dayNumber - 1)
  return date
}

/**
 * Converte uma Date em dayNumber
 */
export function getDayNumberFromDate(date: Date): number {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const start = getStartDate()
  const diffTime = normalized.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

/**
 * Retorna a data de hoje como string no formato YYYY-MM-DD
 * Usado como chave no localStorage
 */
export function getTodayDateKey(): string {
  const today = getTodayNormalized()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna o timestamp da próxima meia-noite
 * Útil para usar com componentes de countdown
 */
export function getNextMidnightTimestamp(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime()
}

/**
 * Retorna os milissegundos até a próxima meia-noite
 */
export function getMillisecondsUntilMidnight(): number {
  return getNextMidnightTimestamp() - Date.now()
}

/**
 * Retorna o tempo até meia-noite no formato HH:MM:SS
 */
export function getTimeUntilMidnight(): string {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  
  const diff = midnight.getTime() - now.getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Formata tempo até meia-noite (usado para countdown)
 * @param hours - Horas restantes
 * @param minutes - Minutos restantes
 * @param seconds - Segundos restantes
 * @returns String formatada HH:MM:SS
 */
export function formatTimeUntilMidnight(hours: number, minutes: number, seconds: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Formata uma duração (em milissegundos) como cronômetro.
 * Mostra M:SS para durações abaixo de 1h e H:MM:SS acima disso.
 * @param ms - Duração em milissegundos
 * @returns String formatada (ex.: "0:45", "12:05", "1:03:09")
 */
export function formatDuration(ms: number): string {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0
  const totalSeconds = Math.floor(safeMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

