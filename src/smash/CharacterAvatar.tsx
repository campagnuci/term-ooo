// src/smash/CharacterAvatar.tsx
// Retrato do lutador com fallback para a inicial do nome (o hotlink pode falhar).
// Usa a arte (portrait) recortada no topo para mostrar o rosto/parte superior.

import { useState } from 'react'
import { SmashCharacter } from './smash-engine'

const SIZES = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-14 h-14 text-xl',
  lg: 'w-24 h-24 text-4xl',
} as const

interface CharacterAvatarProps {
  character: SmashCharacter
  size?: keyof typeof SIZES
  className?: string
}

export function CharacterAvatar({ character, size = 'md', className = '' }: CharacterAvatarProps) {
  const [failed, setFailed] = useState(false)
  const src = character.portrait ?? character.icon
  const showImage = src != null && !failed

  return (
    <div
      className={`${SIZES[size]} rounded-md overflow-hidden bg-night-600 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={character.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <span className="font-bold text-pistachio" aria-hidden="true">
          {character.name.charAt(0)}
        </span>
      )}
    </div>
  )
}
