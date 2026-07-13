// src/smash/SmashGame.tsx
// Página do Smashdle: adivinhe o lutador de Super Smash Bros. Ultimate do dia.
// Palpites ilimitados; cada palpite revela dicas por categoria.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, HelpCircle, Home, Share2 } from 'lucide-react'
import { DialogShell } from '@/components/DialogShell'
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars'
import { APP_VERSION } from '@/lib/version'
import { getMillisecondsUntilMidnight, getTimeUntilMidnight } from '@/lib/dates'
import { buildShareText, CHARACTERS } from './smash-engine'
import { useSmashGame } from './useSmashGame'
import { CharacterSearch } from './CharacterSearch'
import { CharacterAvatar } from './CharacterAvatar'
import { GuessGrid } from './GuessGrid'

/** Contagem regressiva até o próximo lutador; recarrega a página na virada. */
function NextCharacterCountdown() {
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
    <span className="font-mono text-pistachio" aria-label="tempo até o próximo lutador">
      {label}
    </span>
  )
}

function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Como jogar"
      description="Regras do Smashdle"
      borderColor="border-eucalyptus"
      titleGradientClassName="bg-gradient-to-r from-pistachio to-eucalyptus-light"
      maxWidth="2xl"
    >
      <div className="px-6 pb-6 space-y-3 text-sm text-foreground/90 overflow-y-auto">
        <p>
          Adivinhe o <strong>lutador de Super Smash Bros. do dia</strong>. Os palpites são{' '}
          <strong>ilimitados</strong> e cada um revela dicas comparando o lutador chutado
          com o do dia:
        </p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-600 flex-shrink-0" />
            <span><strong>Verde</strong>: categoria idêntica.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-yellow-500 flex-shrink-0" />
            <span><strong>Amarelo</strong>: em <strong>Peso</strong> ou <strong>Ano</strong>, o valor está perto (quente).</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-900 flex-shrink-0" />
            <span><strong>Vermelho</strong>: categoria diferente.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-900 text-red-100 flex items-center justify-center flex-shrink-0">
              <ArrowUp className="w-3.5 h-3.5" />
            </span>
            <span>Em <strong>Peso</strong>/<strong>Ano</strong>: o valor do dia é <strong>maior</strong>. Em <strong>Estreia</strong>: o lutador do dia estreou num SSB <strong>posterior</strong>.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-900 text-red-100 flex items-center justify-center flex-shrink-0">
              <ArrowDown className="w-3.5 h-3.5" />
            </span>
            <span>Em <strong>Peso</strong>/<strong>Ano</strong>: o valor do dia é <strong>menor</strong>. Em <strong>Estreia</strong>: o lutador do dia estreou num SSB <strong>anterior</strong>.</span>
          </li>
        </ul>
        <p>
          As categorias são: gênero, espécie, universo, peso (Ultimate), jogo de estreia
          no SSB, plataforma de origem, ano de origem e forma de obtenção.
        </p>
        <p className="text-muted-foreground text-xs">
          {CHARACTERS.length} lutadores de Super Smash Bros. Ultimate estão no jogo — como
          Ultimate trouxe todos os veteranos de volta ("Everyone is Here"), é o elenco
          completo da série. Um novo lutador é sorteado à meia-noite. Dados via
          Smash Bros API, SmashWiki e curadoria.
        </p>
      </div>
    </DialogShell>
  )
}

export default function SmashGame() {
  const { dayNumber, answer, yesterday, guesses, guessedIds, guessCount, isWin, stats, addGuess } =
    useSmashGame()

  const [helpOpen, setHelpOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Primeira visita: abre o tutorial
  useEffect(() => {
    if (guessCount === 0 && localStorage.getItem('smashdle:help-seen') !== '1') {
      setHelpOpen(true)
      localStorage.setItem('smashdle:help-seen', '1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShare = async () => {
    const text = buildShareText(dayNumber, [...guesses].reverse())
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível (http/permissão): silencioso
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col">
      <StarsBackground className="fixed inset-0 z-0 max-h-dvh max-w-full opacity-30" pointerEvents={false} />

      {/* Cabeçalho */}
      <header className="relative z-10 flex items-center justify-between px-3 sm:px-6 py-3 border-b border-night-600/60">
        <Link
          to="/"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-night-700 transition-colors"
          aria-label="Voltar ao início"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-widest text-foreground">
            SMASHDLE
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Dia #{dayNumber} · Qual é o lutador de Smash de hoje?
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

      <main className="relative z-10 flex-1 flex flex-col items-center gap-5 px-2 sm:px-4 py-5 w-full max-w-6xl mx-auto">
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
            <CharacterAvatar character={answer} size="lg" className="ring-2 ring-green-600" />
            <span className="text-xl font-extrabold text-foreground">{answer.name}</span>
            <p className="text-sm text-muted-foreground">
              em <strong className="text-foreground">{guessCount}</strong>{' '}
              tentativa{guessCount === 1 ? '' : 's'} · sequência de{' '}
              <strong className="text-foreground">{stats.currentStreak}</strong>{' '}
              dia{stats.currentStreak === 1 ? '' : 's'} (recorde: {stats.maxStreak})
            </p>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-eucalyptus text-[#eafbe0] hover:bg-eucalyptus/90 px-5 py-2 rounded-md font-semibold shadow-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Compartilhar'}
            </button>
            <p className="text-xs text-muted-foreground">
              Próximo lutador em <NextCharacterCountdown />
            </p>
          </motion.div>
        ) : (
          <CharacterSearch guessedIds={guessedIds} onSelect={addGuess} />
        )}

        {guesses.length === 0 && !isWin && (
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Chute qualquer lutador para começar: as cores mostram o que ele tem em comum
            com o lutador do dia.
          </p>
        )}

        <GuessGrid guesses={guesses} />

        {yesterday && (
          <div className="mt-auto text-xs text-muted-foreground/80 flex items-center gap-2">
            Lutador de ontem:
            <span className="inline-flex items-center gap-1.5 text-foreground/80 font-semibold">
              <CharacterAvatar character={yesterday} size="sm" />
              {yesterday.name}
            </span>
          </div>
        )}
      </main>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <div className="fixed bottom-2 right-2 md:left-2 z-[5] pointer-events-none">
        <span className="text-[8px] md:text-xs text-muted-foreground/50 font-mono">
          v{APP_VERSION}
        </span>
      </div>
    </div>
  )
}
