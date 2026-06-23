// src/components/Room/RoomChatPanel.tsx
// Painel de chat da sala — reaproveita os componentes do chat global.

import { ChatMessage } from '@/game/chat-types'
import { ChatMessageList } from '@/components/Chat/ChatMessageList'
import { ChatMessageInput } from '@/components/Chat/ChatMessageInput'

interface RoomChatPanelProps {
  messages: ChatMessage[]
  currentUserId: string | null
  onSend: (text: string) => void
  disabled?: boolean
}

export function RoomChatPanel({ messages, currentUserId, onSend, disabled }: RoomChatPanelProps) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-4 py-2 border-b border-night-600 text-sm font-semibold text-foreground">
        Bate-papo da sala
      </div>
      <ChatMessageList messages={messages} currentUserId={currentUserId} />
      <ChatMessageInput onSend={onSend} disabled={disabled} />
    </div>
  )
}
