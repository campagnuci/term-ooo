import { useEffect, useRef } from 'react'

/**
 * Céu estrelado com cintilação.
 *
 * O demo original criava um createRadialGradient POR ESTRELA POR FRAME
 * (centenas de gradientes/frame) — custo constante de CPU que roubava
 * orçamento de frame das animações de fim de jogo. Aqui os brilhos são
 * pré-renderizados em dois sprites (dourado/creme) e cada estrela vira um
 * único drawImage com globalAlpha variável.
 */

interface Star {
  x: number
  y: number
  r: number
  baseAlpha: number
  phase: number
  speed: number
  sprite: HTMLCanvasElement
}

function makeStarSprite(core: string, glow: string): HTMLCanvasElement {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c)
  grad.addColorStop(0, core)
  grad.addColorStop(0.18, core)
  grad.addColorStop(0.3, glow)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return canvas
}

export function Starfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const goldSprite = makeStarSprite('rgba(244, 210, 122, 1)', 'rgba(232, 182, 90, 0.35)')
    const creamSprite = makeStarSprite('rgba(245, 230, 211, 1)', 'rgba(245, 230, 211, 0.25)')

    let stars: Star[] = []
    let w = 0
    let h = 0
    let dpr = 1
    let rafId: number | null = null

    function resize() {
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      // Box real do elemento (exclui scrollbar) — ver nota em particles.ts
      w = canvas.clientWidth || window.innerWidth
      h = canvas.clientHeight || window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      const count = Math.floor((w * h) / 7000)
      stars = []
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.25,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.6 + 0.2,
          sprite: Math.random() < 0.15 ? goldSprite : creamSprite,
        })
      }
    }

    let t = 0
    function drawFrame() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of stars) {
        const alpha = Math.max(
          0,
          Math.min(1, s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.4)
        )
        if (alpha <= 0.01) continue
        // Sprite cobre núcleo + halo: diâmetro visual ≈ r * 8 (halo do original)
        const size = s.r * 8 * dpr
        ctx.globalAlpha = alpha
        ctx.drawImage(s.sprite, s.x * dpr - size / 2, s.y * dpr - size / 2, size, size)
      }
      ctx.globalAlpha = 1
    }

    function animate() {
      t += 0.016
      drawFrame()
      rafId = requestAnimationFrame(animate)
    }

    // Observa o box do elemento: cobre resize da janela e scrollbar (ver particles.ts)
    const observer = new ResizeObserver(() => {
      resize()
      if (reducedMotion) drawFrame()
    })
    observer.observe(canvas)
    resize()

    if (reducedMotion) {
      // Um único frame estático, sem cintilação
      drawFrame()
    } else {
      animate()
    }

    return () => {
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
