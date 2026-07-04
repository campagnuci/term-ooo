// src/naruto/CharacterAvatar.tsx
// Retrato do personagem com fallback para a inicial do nome (nem todos têm
// imagem na API e o hotlink da wikia pode falhar).

import { useState } from 'react'
import { NarutoCharacter } from './naruto-engine'

const SIZES = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-14 h-14 text-xl',
  lg: 'w-24 h-24 text-4xl',
} as const

interface CharacterAvatarProps {
  character: NarutoCharacter
  size?: keyof typeof SIZES
  className?: string
}

export function CharacterAvatar({ character, size = 'md', className = '' }: CharacterAvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImage = character.image != null && !failed

  return (
    <div
      className={`${SIZES[size]} rounded-full overflow-hidden bg-night-600 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {showImage ? (
        <img
          src={character.image!}
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
