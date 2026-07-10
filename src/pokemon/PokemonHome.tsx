// src/pokemon/PokemonHome.tsx
// Tela de seleção de modo do Pokédle: escolha do ritmo (diário/treino) e do
// pool (geração 1-9, Pokédex completa ou ultra-hard). Cada card leva ao jogo.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Home, Infinity as InfinityIcon, Layers, Sparkles } from 'lucide-react'
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars'
import { APP_VERSION } from '@/lib/version'
import { pokedlePath } from '@/lib/routes'
import { GEN_MODES, SPECIAL_MODES, getPool, ModeConfig } from './pokemon-engine'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function CadenceToggle({ isDaily, onChange }: { isDaily: boolean; onChange: (daily: boolean) => void }) {
  return (
    <div className="inline-flex rounded-lg border-2 border-night-600 bg-night-800/70 p-1 backdrop-blur-sm">
      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
          isDaily ? 'bg-eucalyptus text-[#eafbe0] shadow' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={isDaily}
      >
        <CalendarDays className="h-4 w-4" />
        Diário
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
          !isDaily ? 'bg-eucalyptus text-[#eafbe0] shadow' : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-pressed={!isDaily}
      >
        <InfinityIcon className="h-4 w-4" />
        Treino
      </button>
    </div>
  )
}

export default function PokemonHome() {
  const navigate = useNavigate()
  const [isDaily, setIsDaily] = useState(true)

  const go = (mode: ModeConfig) => navigate(pokedlePath(mode.id, isDaily))

  return (
    <div className="min-h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col items-center px-4 py-8 sm:py-12">
      <StarsBackground className="fixed inset-0 z-0 max-h-dvh max-w-full opacity-30" pointerEvents={false} />

      {/* Cabeçalho */}
      <div className="relative z-10 w-full max-w-3xl flex items-center justify-between">
        <Link
          to="/"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-night-700 transition-colors"
          aria-label="Voltar ao início"
        >
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-foreground">POKÉDLE</h1>
        <span className="w-9" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-3xl flex flex-col items-center"
      >
        <motion.p variants={itemVariants} className="mt-4 text-muted-foreground text-sm sm:text-base text-center">
          Adivinhe o Pokémon usando dicas de tipo, habitat, cor, evolução e mais.
          Escolha o ritmo e o desafio:
        </motion.p>

        <motion.div variants={itemVariants} className="mt-6">
          <CadenceToggle isDaily={isDaily} onChange={setIsDaily} />
        </motion.div>

        <motion.p variants={itemVariants} className="mt-3 text-xs text-muted-foreground/80 text-center max-w-md">
          {isDaily
            ? 'Um Pokémon por dia em cada modo, igual para todos os jogadores.'
            : 'Pokémon aleatório, jogue quantas vezes quiser.'}
        </motion.p>

        {/* Modos especiais */}
        <motion.div variants={containerVariants} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {SPECIAL_MODES.map(mode => (
            <motion.button
              key={mode.id}
              variants={itemVariants}
              onClick={() => go(mode)}
              className="
                group text-left rounded-lg border border-eucalyptus/60 bg-eucalyptus/10 backdrop-blur-sm
                p-4 sm:p-5 transition-all duration-200
                hover:border-eucalyptus hover:bg-eucalyptus/20 hover:shadow-lg hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus
              "
            >
              <div className="flex items-center gap-3">
                {mode.id === 'ultra' ? (
                  <Sparkles className="w-6 h-6 text-pistachio" aria-hidden="true" />
                ) : (
                  <Layers className="w-6 h-6 text-pistachio" aria-hidden="true" />
                )}
                <h2 className="text-foreground font-bold text-lg sm:text-xl uppercase tracking-wide">
                  {mode.label}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                {mode.description} · {getPool(mode.id).length} Pokémon
              </p>
            </motion.button>
          ))}
        </motion.div>

        {/* Gerações */}
        <motion.p variants={itemVariants} className="mt-8 mb-3 self-start text-xs font-bold uppercase tracking-widest text-pistachio">
          Por geração
        </motion.p>
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-3 sm:grid-cols-3 gap-3 w-full"
        >
          {GEN_MODES.map(mode => (
            <motion.button
              key={mode.id}
              variants={itemVariants}
              onClick={() => go(mode)}
              className="
                group flex flex-col items-center gap-1 rounded-lg border border-night-600 bg-night-800/50 backdrop-blur-sm
                p-4 transition-all duration-200
                hover:border-eucalyptus hover:bg-night-700/60 hover:shadow-lg hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus
              "
            >
              <span className="text-2xl font-extrabold text-foreground">{mode.id.slice(3)}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-pistachio">
                {mode.short}
              </span>
              <span className="text-[10px] text-muted-foreground">{getPool(mode.id).length}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Version Badge */}
      <div className="fixed bottom-2 right-2 md:left-2 z-[5] pointer-events-none">
        <span className="text-[8px] md:text-xs text-muted-foreground/50 font-mono">v{APP_VERSION}</span>
      </div>
    </div>
  )
}
