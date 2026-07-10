// src/pokemon/PokemonSprite.tsx
// Sprite (arte oficial) do Pokémon com fallback para a inicial do nome caso a
// imagem falhe (ids de formas regionais às vezes não têm arte no mirror).

import { useState } from 'react'
import { Pokemon, spriteUrl } from './pokemon-engine'

const SIZES = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-14 h-14 text-xl',
  lg: 'w-24 h-24 text-4xl',
} as const

interface PokemonSpriteProps {
  pokemon: Pokemon
  size?: keyof typeof SIZES
  className?: string
}

export function PokemonSprite({ pokemon, size = 'md', className = '' }: PokemonSpriteProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={`${SIZES[size]} rounded-full overflow-hidden bg-night-700/80 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {failed ? (
        <span className="font-bold text-pistachio" aria-hidden="true">
          {pokemon.name.charAt(0)}
        </span>
      ) : (
        <img
          src={spriteUrl(pokemon.id)}
          alt={pokemon.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-0.5"
        />
      )}
    </div>
  )
}
