// src/components/LandingPage.tsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Gamepad2, Users, Sparkles, Scroll, Zap, Swords, LucideIcon } from 'lucide-react'
import { StarsBackground } from './animate-ui/components/backgrounds/stars'
import { APP_VERSION } from '@/lib/version'
import { MODE_PATHS, TRAINING_PATH, ROOM_PATH, MEMORY_PATH, SHINOBI_PATH, POKEDLE_PATH, SMASHDLE_PATH } from '@/lib/routes'

// Cada letra do logo com o estado visual de um tile do jogo
const HERO_TILES: { letter: string; className: string }[] = [
  { letter: 'T', className: 'bg-green-600' },
  { letter: 'E', className: 'bg-gray-800' },
  { letter: 'R', className: 'bg-yellow-500' },
  { letter: 'M', className: 'bg-gray-800' },
  { letter: 'O', className: 'bg-green-600' },
]

interface GameEntry {
  title: string
  tag: string
  description: string
  path: string
  /** Miniatura dos tabuleiros: uma string por linha, 'g' = verde, 'y' = amarelo, 'a' = apagado */
  glyph?: string[]
  icon?: LucideIcon
}

// Para adicionar um novo jogo ao hub, basta acrescentar uma entrada aqui
const GAMES: GameEntry[] = [
  {
    title: 'Termo',
    tag: 'Diário',
    description: 'Descubra a palavra do dia em até 6 tentativas.',
    path: MODE_PATHS.termo,
    glyph: ['agyag'],
  },
  {
    title: 'Dueto',
    tag: 'Diário',
    description: 'Duas palavras ao mesmo tempo, 7 tentativas.',
    path: MODE_PATHS.dueto,
    glyph: ['gayga', 'yagay'],
  },
  {
    title: 'Quarteto',
    tag: 'Diário',
    description: 'Quatro palavras de uma vez, 9 tentativas.',
    path: MODE_PATHS.quarteto,
    glyph: ['gayag', 'agyga', 'yagag', 'gagya'],
  },
  {
    title: 'Modo 6',
    tag: 'Diário',
    description: 'Palavra de 6 letras, 6 tentativas.',
    path: MODE_PATHS.seis,
    glyph: ['gaayga'],
  },
  {
    title: 'Treino',
    tag: 'Ilimitado',
    description: 'Pratique com palavras aleatórias, sem esperar o dia virar.',
    path: TRAINING_PATH,
    icon: Gamepad2,
  },
  {
    title: 'Multijogador',
    tag: 'Online',
    description: 'Crie uma sala e jogue com amigos: cooperativo, competição ou contrarrelógio.',
    path: ROOM_PATH,
    icon: Users,
  },
  {
    title: 'Arcanum',
    tag: 'Solo',
    description: 'Teste sua memória ao encontrar os pares de sígilos arcanos em três níveis de desafio.',
    path: MEMORY_PATH,
    icon: Sparkles,
  },
  {
    title: 'Shinobi',
    tag: 'Diário',
    description: 'Adivinhe o personagem de Naruto do dia com dicas de afiliação, jutsus, kekkei genkai e mais.',
    path: SHINOBI_PATH,
    icon: Scroll,
  },
  {
    title: 'Pokédle',
    tag: 'Diário / Treino',
    description: 'Adivinhe o Pokémon por geração, Pokédex completa ou ultra-hard, com dicas de tipo, habitat, cor e mais.',
    path: POKEDLE_PATH,
    icon: Zap,
  },
  {
    title: 'Smashdle',
    tag: 'Diário',
    description: 'Adivinhe o lutador de Super Smash Bros. do dia com dicas de universo, espécie, peso, estreia e mais.',
    path: SMASHDLE_PATH,
    icon: Swords,
  },
]

const GLYPH_COLORS: Record<string, string> = {
  g: 'bg-green-600',
  y: 'bg-yellow-500',
  a: 'bg-night-600',
}

function BoardGlyph({ rows }: { rows: string[] }) {
  return (
    <div className="flex flex-col gap-1" aria-hidden="true">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.split('').map((c, j) => (
            <span key={j} className={`w-2.5 h-2.5 rounded-[2px] ${GLYPH_COLORS[c]}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-gradient-to-b from-night via-[#0a201a] to-night flex flex-col items-center px-4 py-8 sm:py-12">
      <StarsBackground className="fixed inset-0 z-0 max-h-dvh max-w-full opacity-30" pointerEvents={false} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-3xl flex flex-col items-center"
      >
        {/* Logo em tiles */}
        <motion.div variants={itemVariants} className="flex gap-1.5 sm:gap-2">
          {HERO_TILES.map(({ letter, className }, i) => (
            <div
              key={i}
              className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center rounded-md font-extrabold text-white text-2xl sm:text-3xl ${className}`}
            >
              {letter}
            </div>
          ))}
        </motion.div>

        <motion.p variants={itemVariants} className="mt-4 text-muted-foreground text-sm sm:text-base text-center">
          Jogos de palavras em português. Escolha como quer jogar:
        </motion.p>

        {/* Cards dos jogos */}
        <motion.div
          variants={containerVariants}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full"
        >
          {GAMES.map((game) => (
            <motion.button
              key={game.path}
              variants={itemVariants}
              onClick={() => navigate(game.path)}
              className="
                group text-left rounded-lg border border-night-600 bg-night-800/50 backdrop-blur-sm
                p-4 sm:p-5 transition-all duration-200
                hover:border-eucalyptus hover:bg-night-700/60 hover:shadow-lg hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus
              "
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {game.glyph ? (
                    <BoardGlyph rows={game.glyph} />
                  ) : game.icon ? (
                    <game.icon className="w-6 h-6 text-pistachio" aria-hidden="true" />
                  ) : null}
                  <h2 className="text-foreground font-bold text-lg sm:text-xl uppercase tracking-wide">
                    {game.title}
                  </h2>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-pistachio bg-eucalyptus/30 border border-eucalyptus/50 rounded-full px-2.5 py-0.5 flex-shrink-0">
                  {game.tag}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                {game.description}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Version Badge */}
      <div className="fixed bottom-2 right-2 md:left-2 z-[5] pointer-events-none">
        <span className="text-[8px] md:text-xs text-muted-foreground/50 font-mono">
          v{APP_VERSION}
        </span>
      </div>
    </div>
  )
}
