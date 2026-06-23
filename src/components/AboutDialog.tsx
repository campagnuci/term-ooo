/**
 * AboutDialog.tsx
 * 
 * Dialog "Sobre" que conta a história épica da criação do clone Term.ooo,
 * incluindo a inspiração vinda do Orochinho e os 5 Red Bulls.
 * Usa Framer Motion para animações fluidas.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Zap, Code, Heart, Trophy, Tv, Gamepad2, Github, Linkedin, Instagram } from 'lucide-react'
import { useDialogAnimations } from '@/hooks/useDialogAnimations'
import { DialogShell } from './DialogShell'
import { ResponsiveScrollArea } from './ui/responsive-scroll-area'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { containerVariants, itemVariants } = useDialogAnimations({
    staggerDelay: 0.15,
    childrenDelay: 0.1,
    itemDuration: 0.5,
    itemDistance: 20,
  })

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
  }

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="A História Por Trás do Clone"
      description="História épica da criação do clone Term.ooo"
      borderColor="border-green-600"
      titleGradientClassName="bg-gradient-to-r from-green-400 to-blue-500"
      maxWidth="2xl"
      maxHeight="90vh"
    >
      <ResponsiveScrollArea 
        desktopClassName="max-h-[calc(90vh-80px)] px-6"
        mobileClassName="h-[calc(100dvh-8rem)] px-4"
      >
          <AnimatePresence>
            {open && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 py-4 pr-4"
              >
              {/* Ato 1: A Noite */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div variants={iconVariants}>
                    <Code className="w-8 h-8 text-blue-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-blue-400">Ato I: A Madrugada Comum</h3>
                </div>
                <p className="text-foreground leading-relaxed pl-11">
                  Era uma noite qualquer de trabalho. Código corporativo compilando, deadline se aproximando,
                  e eu ali, tentando manter a sanidade enquanto debugava mais um bug obscuro em produção.
                </p>
              </motion.div>

              {/* Ato 2: O Orochinho */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div variants={iconVariants}>
                    <Tv className="w-8 h-8 text-purple-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-purple-400">Ato II: A Centelha de Inspiração</h3>
                </div>
                <p className="text-foreground leading-relaxed pl-11">
                  No segundo monitor, a live do <strong className="text-purple-300">Pedro Orochi (Orochinho)</strong> 
                  {' '}tocava ao fundo. E lá estava ele, o lendário <strong>"bodão"</strong> do Termo 
                  (béééééé 🐐), mandando <em>muito bem</em> no Term.ooo como sempre.
                </p>
                <div className="pl-11 bg-purple-900/20 border-l-4 border-purple-400 p-3 rounded">
                  <p className="text-purple-200 italic">
                    "Como será que esse jogo funciona por dentro?" - pensamento que mudaria tudo
                  </p>
                </div>
              </motion.div>

              {/* Ato 3: A Obsessão */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div variants={iconVariants}>
                    <motion.div variants={pulseVariants} initial="initial" animate="animate">
                      <Zap className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-yellow-400">Ato III: 5 Red Bulls Depois...</h3>
                </div>
                <p className="text-foreground leading-relaxed pl-11">
                  O que deveria ser "só uma olhada rápida" virou uma jornada épica:
                </p>
                <div className="pl-11 space-y-2">
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start gap-2 text-foreground"
                  >
                    <span className="text-green-400 font-bold">▸</span>
                    <span>🔬 Engenharia reversa em JavaScript ofuscado (3.855 linhas de caos)</span>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start gap-2 text-foreground"
                  >
                    <span className="text-green-400 font-bold">▸</span>
                    <span>🔓 Extração de 10.589 palavras escondidas em Base64 + DataView</span>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start gap-2 text-foreground"
                  >
                    <span className="text-green-400 font-bold">▸</span>
                    <span>🎨 Análise de animações 3D em CSS (perspective, rotateY, translateZ)</span>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start gap-2 text-foreground"
                  >
                    <span className="text-green-400 font-bold">▸</span>
                    <span>⚙️ Reimplementação completa em React + TypeScript + Vite</span>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="flex items-start gap-2 text-foreground"
                  >
                    <span className="text-green-400 font-bold">▸</span>
                    <span>🎮 Dev Mode secreto com Konami Code (↑↑↓↓←→←→BA)</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Ato 4: O Amanhecer */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div variants={iconVariants}>
                    <Trophy className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-400">Ato IV: O Amanhecer Glorioso</h3>
                </div>
                <p className="text-foreground leading-relaxed pl-11">
                  Quando o sol nasceu, lá estava: um clone funcional com <strong className="text-green-300">98% de fidelidade</strong> ao original, 
                  todas as animações extraídas pixel-perfect, e até features bônus que o jogo original não tem.
                </p>
                <div className="pl-11 grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-night-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">98%</div>
                    <div className="text-xs text-muted-foreground">Fidelidade</div>
                  </div>
                  <div className="bg-night-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">10.5k</div>
                    <div className="text-xs text-muted-foreground">Palavras</div>
                  </div>
                  <div className="bg-night-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">5🥫</div>
                    <div className="text-xs text-muted-foreground">Red Bulls</div>
                  </div>
                </div>
              </motion.div>

              {/* Agradecimentos */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div variants={iconVariants}>
                    <Heart className="w-8 h-8 text-red-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-red-400">Agradecimentos</h3>
                </div>
                <div className="pl-11 space-y-2 text-foreground">
                  <p>
                    <strong className="text-purple-300">Pedro Orochi (Orochinho)</strong> - O bodão mor do Termo 🐐, 
                    que sem saber foi a centelha de inspiração para este projeto
                  </p>
                  <p>
                    <strong className="text-blue-300">Fernando Serboncini</strong> - Criador do Term.ooo original, 
                    pela criação deste jogo viciante
                  </p>
                  <p>
                    <strong className="text-green-300">Comunidade de devs</strong> - Por toda a paixão em desvendar 
                    e recriar coisas legais
                  </p>
                </div>
              </motion.div>

              {/* Moral da História */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-green-900/40 to-blue-900/40 border-2 border-green-500/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-bold text-green-400">Moral da História</h3>
                </div>
                <p className="text-foreground italic">
                  Red Bull realmente te dá asas... asas para virar a noite codando, 
                  fazer engenharia reversa em código ofuscado, replicar animações 3D complexas, 
                  homenagear o bodão do Termo, e criar um clone completo enquanto assiste live.
                </p>
                <p className="text-2xl text-center font-bold text-green-400 pt-2">
                  Béééééé! 🐐
                </p>
              </motion.div>

              {/* Redes Sociais */}
              <motion.div
                variants={itemVariants}
                className="border-t border-night-600 pt-4"
              >
                <p className="text-center text-sm text-muted-foreground mb-3">Conecte-se comigo:</p>
                <div className="flex justify-center items-center gap-4">
                  <motion.a
                    href="https://github.com/arthr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-night-800 hover:bg-night-700 transition-colors group"
                  >
                    <Github className="w-6 h-6 text-foreground group-hover:text-white transition-colors" />
                  </motion.a>

                  <motion.a
                    href="https://linkedin.com/in/arthrmrs"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-night-800 hover:bg-[#0077B5] transition-colors group"
                  >
                    <Linkedin className="w-6 h-6 text-foreground group-hover:text-white transition-colors" />
                  </motion.a>

                  <motion.a
                    href="https://instagram.com/arthrmrs"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-night-800 hover:bg-gradient-to-tr hover:from-[#FCAF45] hover:via-[#E1306C] hover:to-[#833AB4] transition-all group"
                  >
                    <Instagram className="w-6 h-6 text-foreground group-hover:text-white transition-colors" />
                  </motion.a>

                  <motion.a
                    href="https://x.com/arthrmrs"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-night-800 hover:bg-black transition-colors group"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-foreground group-hover:text-white transition-colors fill-current"
                      aria-hidden="true"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </motion.a>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                variants={itemVariants}
                className="text-center text-sm text-muted-foreground pt-4 border-t border-night-600"
              >
                <p>Desenvolvido com 💚, muito ☕ e 5 latas de Red Bull</p>
                <p className="text-xs mt-1">Enquanto assistia o Orochinho mandando ver no Termo</p>
                <p className="text-xs mt-2">
                  <Coffee className="inline w-4 h-4" /> React + TypeScript + Vite + Framer Motion
                </p>
              </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
      </ResponsiveScrollArea>
    </DialogShell>
  )
}

