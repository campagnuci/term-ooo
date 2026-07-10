// src/pokemon/PokemonGame.tsx
// Página do Pokédle: adivinhe o Pokémon do modo escolhido. O modo vem da rota
// (/pokedle/:mode) e o ritmo do sufixo /treino. Palpites ilimitados; cada
// palpite revela dicas por categoria.

import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowUp, HelpCircle, RotateCcw, Share2 } from 'lucide-react'
import { DialogShell } from '@/components/DialogShell'
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars'
import { APP_VERSION } from '@/lib/version'
import { POKEDLE_PATH } from '@/lib/routes'
import { getMillisecondsUntilMidnight, getTimeUntilMidnight } from '@/lib/dates'
import {
  buildShareText,
  getDailyPokemon,
  getPool,
  isPokemonMode,
  PokemonMode,
} from './pokemon-engine'
import { usePokemonGame } from './usePokemonGame'
import { PokemonSearch } from './PokemonSearch'
import { PokemonSprite } from './PokemonSprite'
import { GuessGrid } from './GuessGrid'

/** Contagem regressiva até o próximo Pokémon diário; recarrega na virada. */
function NextCountdown() {
  const [label, setLabel] = useState(getTimeUntilMidnight)

  useEffect(() => {
    const id = setInterval(() => {
      if (getMillisecondsUntilMidnight() <= 1000) {
        window.location.reload()
        return
      }
      setLabel(getTimeUntilMidnight())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-mono text-pistachio" aria-label="tempo até o próximo Pokémon">
      {label}
    </span>
  )
}

function HelpDialog({
  open,
  onOpenChange,
  poolSize,
  showGeneration,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  poolSize: number
  showGeneration: boolean
}) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Como jogar"
      description="Regras do Pokédle"
      borderColor="border-eucalyptus"
      titleGradientClassName="bg-gradient-to-r from-pistachio to-eucalyptus-light"
      maxWidth="2xl"
    >
      <div className="px-6 pb-6 space-y-3 text-sm text-foreground/90 overflow-y-auto">
        <p>
          Adivinhe o <strong>Pokémon</strong>. Os palpites são <strong>ilimitados</strong> e cada um
          revela dicas comparando o Pokémon chutado com a resposta:
        </p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-600 flex-shrink-0" />
            <span><strong>Verde</strong>: categoria idêntica.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-yellow-500 flex-shrink-0" />
            <span>
              <strong>Amarelo</strong>: parcial — nos tipos, o tipo aparece no{' '}
              <em>outro</em> slot; em altura, peso ou BST, está perto da resposta.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-900 flex-shrink-0" />
            <span><strong>Vermelho</strong>: diferente.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-900 text-red-100 flex items-center justify-center flex-shrink-0">
              <ArrowUp className="w-3.5 h-3.5" />
            </span>
            <span>Nas colunas numéricas: a resposta tem valor <strong>maior</strong>.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-900 text-red-100 flex items-center justify-center flex-shrink-0">
              <ArrowDown className="w-3.5 h-3.5" />
            </span>
            <span>Nas colunas numéricas: a resposta tem valor <strong>menor</strong>.</span>
          </li>
        </ul>
        <p>
          As colunas são: Tipo 1, Tipo 2, Habilidade Oculta, Cor, Evolução (estágio na cadeia),
          Altura, Peso, BST (soma dos atributos base) e se é Lendário/Mítico
          {showGeneration ? ', além da Geração' : ''}.
        </p>
        <p className="text-muted-foreground text-xs">
          {poolSize} Pokémon neste modo. Dados via PokeAPI. Os nomes das habilidades estão em inglês;
          “Nenhuma” indica que o Pokémon não tem habilidade oculta.
        </p>
      </div>
    </DialogShell>
  )
}

function PokemonGameInner({ mode, isDaily }: { mode: PokemonMode; isDaily: boolean }) {
  const {
    config,
    dayNumber,
    answer,
    guesses,
    guessedIds,
    guessCount,
    isWin,
    addGuess,
    playAgain,
    dailyStats,
    sessionStats,
  } = usePokemonGame({ mode, isDaily })

  // Primeira visita: já abre o tutorial (inicializador lê o localStorage).
  const [helpOpen, setHelpOpen] = useState(() => localStorage.getItem('pokedle:help-seen') !== '1')
  const [copied, setCopied] = useState(false)

  const poolSize = getPool(mode).length
  const yesterday = isDaily && dayNumber > 1 ? getDailyPokemon(mode, dayNumber - 1) : null

  // Marca o tutorial como visto (efeito só escreve no localStorage)
  useEffect(() => {
    if (helpOpen) localStorage.setItem('pokedle:help-seen', '1')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShare = async () => {
    const text = buildShareText(mode, [...guesses].reverse(), isDaily, dayNumber)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível: silencioso
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col">
      <StarsBackground className="fixed inset-0 z-0 max-h-dvh max-w-full opacity-30" pointerEvents={false} />

      {/* Cabeçalho */}
      <header className="relative z-10 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-night-600/60">
        <Link
          to={POKEDLE_PATH}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-night-700 transition-colors"
          aria-label="Trocar de modo"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-widest text-foreground">POKÉDLE</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {config.label} · {isDaily ? `Dia #${dayNumber}` : 'Treino'}
          </p>
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-night-700 transition-colors"
          aria-label="Como jogar"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center gap-5 px-2 sm:px-4 py-5 w-full max-w-7xl mx-auto">
        {isWin ? (
          /* Painel de vitória */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-lg border-2 border-green-600 bg-night-800/80 backdrop-blur-sm p-5 flex flex-col items-center gap-3 text-center"
          >
            <span className="text-sm font-bold text-pistachio uppercase tracking-widest">
              🎉 Você acertou!
            </span>
            <PokemonSprite pokemon={answer} size="lg" className="ring-2 ring-green-600" />
            <span className="text-xl font-extrabold text-foreground">{answer.name}</span>
            {isDaily ? (
              <p className="text-sm text-muted-foreground">
                em <strong className="text-foreground">{guessCount}</strong>{' '}
                tentativa{guessCount === 1 ? '' : 's'} · sequência de{' '}
                <strong className="text-foreground">{dailyStats.currentStreak}</strong>{' '}
                dia{dailyStats.currentStreak === 1 ? '' : 's'} (recorde: {dailyStats.maxStreak})
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                em <strong className="text-foreground">{guessCount}</strong>{' '}
                tentativa{guessCount === 1 ? '' : 's'} · {sessionStats.played} na sessão · melhor:{' '}
                <strong className="text-foreground">{sessionStats.bestGuesses}</strong>
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-eucalyptus text-[#eafbe0] hover:bg-eucalyptus/90 px-5 py-2 rounded-md font-semibold shadow-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
              {!isDaily && (
                <button
                  onClick={playAgain}
                  className="flex items-center gap-2 bg-night-700 text-foreground hover:bg-night-600 px-5 py-2 rounded-md font-semibold shadow-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Jogar de novo
                </button>
              )}
            </div>
            {isDaily && (
              <p className="text-xs text-muted-foreground">
                Próximo Pokémon em <NextCountdown />
              </p>
            )}
          </motion.div>
        ) : (
          <PokemonSearch mode={mode} guessedIds={guessedIds} onSelect={addGuess} />
        )}

        {guesses.length === 0 && !isWin && (
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Chute qualquer Pokémon para começar: as cores mostram o que ele tem em comum com a
            resposta.
          </p>
        )}

        <GuessGrid guesses={guesses} showGeneration={config.showGeneration} />

        {yesterday && (
          <div className="mt-auto text-xs text-muted-foreground/80 flex items-center gap-2">
            Pokémon de ontem:
            <span className="inline-flex items-center gap-1.5 text-foreground/80 font-semibold">
              <PokemonSprite pokemon={yesterday} size="sm" />
              {yesterday.name}
            </span>
          </div>
        )}
      </main>

      <HelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        poolSize={poolSize}
        showGeneration={config.showGeneration}
      />

      <div className="fixed bottom-2 right-2 md:left-2 z-[5] pointer-events-none">
        <span className="text-[8px] md:text-xs text-muted-foreground/50 font-mono">v{APP_VERSION}</span>
      </div>
    </div>
  )
}

export default function PokemonGame() {
  const { mode: modeParam } = useParams()
  const location = useLocation()
  const isDaily = !location.pathname.endsWith('/treino')

  if (!modeParam || !isPokemonMode(modeParam)) {
    return <Navigate to={POKEDLE_PATH} replace />
  }

  return <PokemonGameInner key={`${modeParam}-${isDaily}`} mode={modeParam} isDaily={isDaily} />
}
