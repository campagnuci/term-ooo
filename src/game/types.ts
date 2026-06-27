// src/game/types.ts
export type GameMode = 'termo' | 'dueto' | 'quarteto' | 'seis'

export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent'

export type KeyState = 'unused' | 'correct' | 'present' | 'absent'

export interface Tile {
  letter: string
  state: TileState
}

export interface Guess {
  word: string
  tiles: Tile[]
}

export interface Board {
  guesses: Guess[]
  solution: string
  isComplete: boolean
}

export interface GameState {
  mode: GameMode
  boards: Board[]
  currentGuess: string[] // Array com `wordLength` posições do modo (pode ter strings vazias)
  currentRow: number
  maxAttempts: number
  isGameOver: boolean
  isWin: boolean
  keyStates: Record<string, KeyState[]> // Array de estados, um por board
  dateKey: string
  dayNumber: number
  /** Timestamp (ms) de quando o jogador começou a resolver (primeira letra digitada). */
  startTime?: number | null
  /** Timestamp (ms) de quando o jogo terminou (vitória ou derrota). */
  endTime?: number | null
}

export interface Settings {
  highContrast: boolean
  hardMode: boolean
  soundEnabled: boolean
  /** Abrir "Como jogar" automaticamente ao iniciar o jogo. */
  showHelpOnStart: boolean
}

export interface Stats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  guessDistribution: number[]
  /** Soma da duração (ms) das partidas vencidas e cronometradas. */
  totalSolveTimeMs: number
  /** Quantidade de partidas que entraram na média de tempo. */
  solveCount: number
  lastGame?: {
    won: boolean
    attempts: number
    dateKey: string
  }
}

