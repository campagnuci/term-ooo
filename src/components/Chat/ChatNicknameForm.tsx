// src/components/Chat/ChatNicknameForm.tsx
// Formulário para definir nickname

import { useState } from 'react'
import { sanitizeNickname, isValidNickname } from '@/lib/chat-utils'
import { CHAT_CONFIG } from '@/lib/chat-config'

interface ChatNicknameFormProps {
  onSubmit: (nickname: string) => void
  error: string | null
  isConnecting: boolean
  title?: string
  subtitle?: string
  submitLabel?: string
  submittingLabel?: string
}

export function ChatNicknameForm({
  onSubmit,
  error,
  isConnecting,
  title = 'Bem-vindo ao Chat!',
  subtitle = 'Escolha um nickname para começar a conversar',
  submitLabel = 'Entrar no Chat',
  submittingLabel = 'Entrando...',
}: ChatNicknameFormProps) {
  const [nickname, setNickname] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const cleaned = sanitizeNickname(nickname)
    
    if (!isValidNickname(cleaned)) {
      setLocalError(`Nickname deve ter entre ${CHAT_CONFIG.MIN_NICKNAME_LENGTH} e ${CHAT_CONFIG.MAX_NICKNAME_LENGTH} caracteres`)
      return
    }
    
    setLocalError(null)
    onSubmit(cleaned)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNickname(value)
    setLocalError(null)
  }

  const displayError = error || localError

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <input
            type="text"
            value={nickname}
            onChange={handleChange}
            placeholder="Seu nickname"
            maxLength={CHAT_CONFIG.MAX_NICKNAME_LENGTH}
            disabled={isConnecting}
            className="w-full px-4 py-3 bg-night-800 text-foreground rounded-lg border border-night-600 focus:border-eucalyptus focus:outline-none focus:ring-2 focus:ring-eucalyptus/50 disabled:opacity-50"
            autoFocus
          />
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {nickname.length}/{CHAT_CONFIG.MAX_NICKNAME_LENGTH}
          </div>
        </div>

        {displayError && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-200">
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={!nickname.trim() || isConnecting}
          className="w-full px-4 py-3 bg-eucalyptus hover:bg-eucalyptus-light disabled:bg-night-700 disabled:cursor-not-allowed text-[#eafbe0] font-medium rounded-lg transition-colors"
        >
          {isConnecting ? submittingLabel : submitLabel}
        </button>
      </form>

      <div className="text-xs text-muted-foreground text-center">
        <p>Seu nickname será visível para todos</p>
        <p>Seja respeitoso e divirta-se!</p>
      </div>
    </div>
  )
}

