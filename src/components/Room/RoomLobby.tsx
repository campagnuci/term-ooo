// src/components/Room/RoomLobby.tsx
// Lobby multiplayer (rota /sala): apelido + criar/entrar em sala.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, LogIn, Users, Trophy, Timer } from 'lucide-react'
import { GameMode } from '@/game/types'
import { RoomGameType } from '@/game/room-types'
import { sanitizeNickname, isValidNickname, loadNickname, saveNickname } from '@/lib/chat-utils'
import { CHAT_CONFIG } from '@/lib/chat-config'
import { generateRoomCode, normalizeRoomCode } from '@/lib/room-config'

const MODES: { value: GameMode; label: string }[] = [
  { value: 'termo', label: 'Termo' },
  { value: 'dueto', label: 'Dueto' },
  { value: 'quarteto', label: 'Quarteto' },
]

const GAME_TYPES: { value: RoomGameType; label: string; icon: typeof Users; hint: string }[] = [
  { value: 'coop', label: 'Cooperativo', icon: Users, hint: 'O anfitrião joga e todos sugerem no chat.' },
  { value: 'competition', label: 'Competição', icon: Trophy, hint: 'Todos competem para resolver a palavra mais rápido.' },
  { value: 'timetrial', label: 'Time Trial', icon: Timer, hint: 'Tempo fixo no relógio; pontos por velocidade e tentativas.' },
]

export function RoomLobby() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState(loadNickname() || '')
  const [createMode, setCreateMode] = useState<GameMode>('termo')
  const [createGameType, setCreateGameType] = useState<RoomGameType>('coop')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const ensureNickname = (): string | null => {
    const cleaned = sanitizeNickname(nickname)
    if (!isValidNickname(cleaned)) {
      setError(
        `Apelido deve ter entre ${CHAT_CONFIG.MIN_NICKNAME_LENGTH} e ${CHAT_CONFIG.MAX_NICKNAME_LENGTH} caracteres`
      )
      return null
    }
    saveNickname(cleaned)
    return cleaned
  }

  const handleCreate = () => {
    if (!ensureNickname()) return
    const code = generateRoomCode()
    navigate(`/sala/${code}`, { state: { intent: 'create', createMode, createGameType } })
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureNickname()) return
    const code = normalizeRoomCode(joinCode)
    if (!code) {
      setError('Código de sala inválido')
      return
    }
    navigate(`/sala/${code}`, { state: { intent: 'join' } })
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col">
      <header className="border-b border-night-600 bg-night-800/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            aria-label="Voltar ao jogo"
            className="p-2 rounded-lg text-foreground hover:text-foreground hover:bg-night-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-foreground text-lg font-bold uppercase tracking-wider">Multijogador</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <p className="text-center text-muted-foreground text-sm">
            Joguem a mesma palavra juntos — no <strong>Cooperativo</strong> o anfitrião arrisca os
            palpites e todos sugerem no chat; na <strong>Competição</strong> cada um joga seu
            tabuleiro e disputa quem resolve mais rápido; no <strong>Time Trial</strong> há um tempo
            fixo no relógio e a pontuação premia rapidez e menos tentativas.
          </p>

          {/* Apelido */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Seu apelido
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setError(null)
              }}
              placeholder="Como você quer ser chamado?"
              maxLength={CHAT_CONFIG.MAX_NICKNAME_LENGTH}
              className="w-full px-4 py-3 bg-night-800 text-foreground rounded-lg border border-night-600 focus:border-eucalyptus focus:outline-none focus:ring-2 focus:ring-eucalyptus/50"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Criar sala */}
          <div className="rounded-xl border border-night-600 bg-night-800/60 p-4 space-y-3">
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar nova sala
            </h2>

            {/* Tipo de sala: cooperativo x competição */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tipo de sala</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {GAME_TYPES.map((t) => {
                  const Icon = t.icon
                  const active = t.value === createGameType
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setCreateGameType(t.value)}
                      aria-pressed={active}
                      className={`flex flex-col items-start gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        active
                          ? 'bg-eucalyptus text-[#eafbe0]'
                          : 'bg-night-800 hover:bg-night-700 text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4" /> {t.label}
                      </span>
                      <span
                        className={`text-[11px] font-normal leading-tight ${
                          active ? 'text-[#eafbe0]/90' : 'text-muted-foreground'
                        }`}
                      >
                        {t.hint}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Modo</div>
              <div className="flex gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setCreateMode(m.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      m.value === createMode
                        ? 'bg-eucalyptus text-[#eafbe0]'
                        : 'bg-night-800 hover:bg-night-700 text-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="w-full px-4 py-3 bg-eucalyptus hover:bg-eucalyptus-light text-[#eafbe0] font-medium rounded-lg transition-colors"
            >
              Criar sala
            </button>
          </div>

          {/* Entrar em sala */}
          <form
            onSubmit={handleJoin}
            className="rounded-xl border border-night-600 bg-night-800/60 p-4 space-y-3"
          >
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Entrar com código
            </h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase())
                setError(null)
              }}
              placeholder="Código da sala (ex.: ABCD23)"
              maxLength={6}
              className="w-full px-4 py-3 bg-night-800 text-foreground rounded-lg border border-night-600 focus:border-eucalyptus focus:outline-none focus:ring-2 focus:ring-eucalyptus/50 font-mono tracking-[0.3em] uppercase"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-night-700 hover:bg-night-600 text-foreground font-medium rounded-lg transition-colors"
            >
              Entrar na sala
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
