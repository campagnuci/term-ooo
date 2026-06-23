// src/components/Room/RoomInfoPanel.tsx
// Código da sala (copiar para convidar) + lista de membros com indicador de host.

import { useState } from 'react'
import { Crown, Copy, Check } from 'lucide-react'
import { RoomMember } from '@/game/room-types'

interface RoomInfoPanelProps {
  code: string
  members: RoomMember[]
  hostUserId: string
  currentUserId: string
}

export function RoomInfoPanel({ code, members, hostUserId, currentUserId }: RoomInfoPanelProps) {
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

      {/* Membros */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Jogadores ({members.length})
        </div>
        <ul className="space-y-1">
          {members.map((m) => {
            const isHost = m.userId === hostUserId
            const isMe = m.userId === currentUserId
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
                <span className="truncate">
                  {m.nickname}
                  {isMe && <span className="text-muted-foreground"> (você)</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
