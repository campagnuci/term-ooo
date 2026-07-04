// src/naruto/CharacterSearch.tsx
// Campo de busca com autocomplete de personagens (navegável por teclado).

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { NarutoCharacter, searchCharacters } from './naruto-engine'
import { CharacterAvatar } from './CharacterAvatar'

interface CharacterSearchProps {
  guessedIds: Set<number>
  onSelect: (character: NarutoCharacter) => void
  disabled?: boolean
}

export function CharacterSearch({ guessedIds, onSelect, disabled }: CharacterSearchProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = searchCharacters(query, guessedIds)

  // Mantém o índice ativo dentro dos resultados quando a lista encolhe
  useEffect(() => {
    setActiveIndex(prev => Math.min(prev, Math.max(results.length - 1, 0)))
  }, [results.length])

  const select = (character: NarutoCharacter) => {
    setQuery('')
    setActiveIndex(0)
    onSelect(character)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(results[activeIndex] ?? results[0])
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 rounded-lg border-2 border-night-600 bg-night-800/80 backdrop-blur-sm px-3 py-2 focus-within:border-eucalyptus transition-colors">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome de um personagem..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-sm sm:text-base disabled:opacity-50"
          aria-label="Buscar personagem"
          aria-expanded={results.length > 0}
          role="combobox"
          aria-controls="shinobi-search-results"
        />
      </div>

      {results.length > 0 && (
        <ul
          id="shinobi-search-results"
          role="listbox"
          className="absolute z-30 mt-1 w-full rounded-lg border border-night-600 bg-night-800/95 backdrop-blur-md shadow-xl overflow-hidden"
        >
          {results.map((character, i) => (
            <li key={character.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onClick={() => select(character)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === activeIndex ? 'bg-eucalyptus/40' : ''
                }`}
              >
                <CharacterAvatar character={character} size="sm" />
                <span className="text-sm text-foreground">{character.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
