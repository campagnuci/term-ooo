/**
 * Sistema de partículas em canvas único para o jogo da memória.
 *
 * O demo original criava dezenas de <div> com box-shadow animados via WAAPI
 * a cada par encontrado — criação/remoção de nós DOM + pintura de sombras a
 * cada frame era uma das fontes de stutter. Aqui todas as partículas vivem
 * em um único canvas com sprites de brilho pré-renderizados (drawImage é
 * muito mais barato que redesenhar gradientes/sombras por frame), pool de
 * objetos e um único requestAnimationFrame que para sozinho quando vazio.
 */

interface Particle {
  x: number
  y: number
  dx: number
  dy: number
  size: number
  born: number
  duration: number
  sprite: HTMLCanvasElement
}

interface BurstOptions {
  count?: number
  hueBase?: number
  hueSpread?: number
  sat?: number
  speedMin?: number
  speedMax?: number
  /** Deslocamento vertical extra (negativo = para cima) */
  lift?: number
  sizeMin?: number
  sizeMax?: number
  durMin?: number
  durMax?: number
  /** true: ângulos distribuídos em anel; false: aleatórios */
  ring?: boolean
}

const SPRITE_SIZE = 48

/** Cache de sprites por cor (hue arredondado p/ 6°, luz p/ 5%) */
const spriteCache = new Map<string, HTMLCanvasElement>()

function getSprite(hue: number, sat: number, light: number): HTMLCanvasElement {
  const h = Math.round(hue / 6) * 6
  const l = Math.round(light / 5) * 5
  const key = `${h}|${sat}|${l}`
  let sprite = spriteCache.get(key)
  if (sprite) return sprite

  sprite = document.createElement('canvas')
  sprite.width = SPRITE_SIZE
  sprite.height = SPRITE_SIZE
  const ctx = sprite.getContext('2d')!
  const c = SPRITE_SIZE / 2
  // Núcleo sólido + halo (substitui o box-shadow do original)
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c)
  grad.addColorStop(0, `hsla(${h}, ${sat}%, ${Math.min(l + 25, 95)}%, 1)`)
  grad.addColorStop(0.25, `hsla(${h}, ${sat}%, ${l}%, 0.9)`)
  grad.addColorStop(0.6, `hsla(${h}, ${sat}%, ${l}%, 0.25)`)
  grad.addColorStop(1, `hsla(${h}, ${sat}%, ${l}%, 0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  spriteCache.set(key, sprite)
  return sprite
}

/** Easing equivalente ao cubic-bezier(0.2, 0.8, 0.2, 1) do original */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export class ParticleField {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private particles: Particle[] = []
  private rafId: number | null = null
  private dpr = 1
  private reducedMotion = false
  private observer: ResizeObserver | null = null

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Observa o box do próprio elemento: cobre resize da janela e também
    // aparição/sumiço da scrollbar quando o conteúdo cresce
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()
  }

  detach() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.particles = []
    this.observer?.disconnect()
    this.observer = null
    this.canvas = null
    this.ctx = null
  }

  private resize() {
    if (!this.canvas) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Dimensiona o buffer pelo box real do elemento (exclui scrollbar),
    // mantendo o mapeamento 1:1 entre coordenadas CSS e desenho
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
  }

  private spawn(cx: number, cy: number, opts: BurstOptions) {
    if (!this.canvas || this.reducedMotion) return
    const {
      count = 20,
      hueBase = 40,
      hueSpread = 30,
      sat = 90,
      speedMin = 70,
      speedMax = 180,
      lift = -50,
      sizeMin = 3,
      sizeMax = 9,
      durMin = 950,
      durMax = 1350,
      ring = true,
    } = opts

    const now = performance.now()
    for (let i = 0; i < count; i++) {
      const angle = ring
        ? (i / count) * Math.PI * 2 + Math.random() * 0.3
        : Math.random() * Math.PI * 2
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      const hue = hueBase + (Math.random() - 0.5) * hueSpread
      const light = 60 + Math.random() * 15
      this.particles.push({
        x: cx,
        y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed + lift,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        born: now,
        duration: durMin + Math.random() * (durMax - durMin),
        sprite: getSprite(hue, sat, light),
      })
    }
    this.ensureLoop()
  }

  /** Explosão dourada ao encontrar um par (equivale a burstParticles) */
  burst(cx: number, cy: number) {
    this.spawn(cx, cy, { count: 22 })
  }

  /** Explosão a partir do indicador de sequência (tons coral/dourado) */
  streakBurst(cx: number, cy: number) {
    this.spawn(cx, cy, {
      count: 18,
      hueBase: 45,
      hueSpread: 60,
      speedMin: 70,
      speedMax: 200,
      lift: -40,
      ring: false,
      durMin: 900,
      durMax: 1400,
    })
  }

  /** Faíscas suaves nas estrelas do modal */
  sparkle(cx: number, cy: number) {
    this.spawn(cx, cy, {
      count: 8,
      hueBase: 46,
      hueSpread: 8,
      sat: 80,
      speedMin: 30,
      speedMax: 80,
      lift: 0,
      sizeMin: 2.5,
      sizeMax: 6,
      durMin: 700,
      durMax: 900,
      ring: false,
    })
  }

  private ensureLoop() {
    if (this.rafId === null && this.particles.length > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    }
  }

  private tick = () => {
    this.rafId = null
    const ctx = this.ctx
    const canvas = this.canvas
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const now = performance.now()
    const dpr = this.dpr
    let alive = 0

    for (const p of this.particles) {
      const t = (now - p.born) / p.duration
      if (t >= 1) continue
      this.particles[alive++] = p

      const e = easeOut(t)
      const x = (p.x + p.dx * e) * dpr
      const y = (p.y + p.dy * e) * dpr
      // Escala 1 → 0 e leve fade no fim, como no original
      const scale = 1 - e
      const drawSize = p.size * 4 * scale * dpr
      if (drawSize < 0.5) continue
      ctx.globalAlpha = Math.min(1, (1 - t) * 1.5)
      ctx.drawImage(p.sprite, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize)
    }
    this.particles.length = alive
    ctx.globalAlpha = 1

    if (alive > 0) {
      this.rafId = requestAnimationFrame(this.tick)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}
