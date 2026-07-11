// src/pokemon/PokemonSearch.tsx
// Campo de busca com autocomplete, restrito ao pool do modo atual
// (navegável por teclado).

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Pokemon, PokemonMode, searchPokemon } from './pokemon-engine'
import { PokemonSprite } from './PokemonSprite'

interface PokemonSearchProps {
  mode: PokemonMode
  guessedIds: Set<number>
  onSelect: (pokemon: Pokemon) => void
  disabled?: boolean
}

export function PokemonSearch({ mode, guessedIds, onSelect, disabled }: PokemonSearchProps) {
  const [query, setQuery] = useState('')
  const [rawActiveIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = searchPokemon(mode, query, guessedIds)
  // Índice ativo sempre dentro dos resultados (a lista muda a cada tecla).
  const activeIndex = Math.min(rawActiveIndex, Math.max(results.length - 1, 0))

  // Volta a lista ao topo sempre que a busca muda.
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [query])

  // Mantém o item destacado visível ao navegar pelo teclado (lista rolável).
  useEffect(() => {
    const active = listRef.current?.children[activeIndex] as HTMLElement | undefined
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const select = (pokemon: Pokemon) => {
    setQuery('')
    setActiveIndex(0)
    onSelect(pokemon)
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
          onChange={e => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome de um Pokémon..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-sm sm:text-base disabled:opacity-50"
          aria-label="Buscar Pokémon"
          aria-expanded={results.length > 0}
          role="combobox"
          aria-controls="pokedle-search-results"
        />
      </div>

      {results.length > 0 && (
        <ul
          ref={listRef}
          id="pokedle-search-results"
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-[26rem] overflow-y-auto rounded-lg border border-night-600 bg-night-800/95 backdrop-blur-md shadow-xl"
        >
          {results.map((pokemon, i) => (
            <li key={pokemon.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onClick={() => select(pokemon)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === activeIndex ? 'bg-eucalyptus/40' : ''
                }`}
              >
                <PokemonSprite pokemon={pokemon} size="sm" />
                <span className="text-sm text-foreground">{pokemon.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
