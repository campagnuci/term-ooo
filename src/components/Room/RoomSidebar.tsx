// src/components/Room/RoomSidebar.tsx
// Painel lateral da sala: info (código + membros) + chat.
// Desktop (md+): coluna fixa à direita. Mobile: botão flutuante + drawer.

import { useState } from 'react'
import { X } from 'lucide-react'
import { ChatMessage } from '@/game/chat-types'
import { RoomMember, RoomGameType, MatchStatus, CompetitorResult } from '@/game/room-types'
import { ChatButton } from '@/components/Chat/ChatButton'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { Z_INDEX } from '@/lib/z-index'
import { RoomInfoPanel } from './RoomInfoPanel'
import { RoomChatPanel } from './RoomChatPanel'

interface RoomSidebarProps {
  code: string
  members: RoomMember[]
  hostUserId: string
  currentUserId: string
  connected: boolean
  messages: ChatMessage[]
  unreadCount: number
  onSendChat: (text: string) => void
  onOpenChat: () => void
  gameType: RoomGameType
  matchStatus: MatchStatus
  standings: CompetitorResult[]
}

function PanelContent(props: Omit<RoomSidebarProps, 'unreadCount' | 'onOpenChat'>) {
  return (
    <>
      <RoomInfoPanel
        code={props.code}
        members={props.members}
        hostUserId={props.hostUserId}
        currentUserId={props.currentUserId}
        gameType={props.gameType}
        matchStatus={props.matchStatus}
        standings={props.standings}
      />
      <RoomChatPanel
        messages={props.messages}
        currentUserId={props.currentUserId}
        onSend={props.onSendChat}
        disabled={!props.connected}
      />
    </>
  )
}

export function RoomSidebar(props: RoomSidebarProps) {
  const [open, setOpen] = useState(false)
  useBodyScrollLock(open)
  useEscapeKey(() => setOpen(false), open)

  const handleOpen = () => {
    setOpen(true)
    props.onOpenChat()
  }

  return (
    <>
      {/* Desktop: coluna fixa */}
      <aside
        className="hidden md:flex flex-col w-[320px] flex-shrink-0 bg-night-800 border-l border-night-600 h-full min-h-0"
        style={{ zIndex: Z_INDEX.ROOM_SIDEBAR }}
      >
        <PanelContent {...props} />
      </aside>

      {/* Mobile: botão flutuante */}
      <div className="md:hidden">
        <ChatButton
          onClick={handleOpen}
          onlineCount={props.members.length}
          hasNewMessages={props.unreadCount > 0}
          connected={props.connected}
        />
      </div>

      {/* Mobile: drawer */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: Z_INDEX.CHAT_OVERLAY }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed right-0 top-0 h-full w-full max-w-[360px] bg-night-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            style={{ zIndex: Z_INDEX.CHAT_PANEL }}
          >
            <div className="flex items-center justify-between p-3 bg-night-800 border-b border-night-600">
              <h2 className="text-base font-bold text-foreground">Sala {props.code}</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-night-700 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <PanelContent {...props} />
          </div>
        </div>
      )}
    </>
  )
}
