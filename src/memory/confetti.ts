/**
 * Confete de vitória do jogo da memória.
 *
 * O demo original desenhava ~400 partículas num canvas próprio dentro do
 * thread principal, competindo com a transição do modal e as estrelas —
 * outra fonte do stutter no fim de jogo. Aqui usamos canvas-confetti com
 * useWorker: quando o navegador suporta OffscreenCanvas, toda a renderização
 * sai do thread principal (fallback automático caso contrário).
 */
import confetti from 'canvas-confetti'
import type { CreateTypes } from 'canvas-confetti'

const COLORS = ['#f4d27a', '#e8b65a', '#fff5d6', '#3dd68c', '#6ff0b0', '#ff9a8b', '#ff6b6b', '#f5e6d3']

export class MemoryConfetti {
  private instance: CreateTypes | null = null
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private rainInterval: ReturnType<typeof setInterval> | null = null

  attach(canvas: HTMLCanvasElement) {
    this.instance = confetti.create(canvas, {
      resize: true,
      useWorker: true,
      disableForReducedMotion: true,
    })
  }

  detach() {
    this.cancel()
    this.instance?.reset()
    this.instance = null
  }

  /** Sequência de vitória: explosão central + laterais + chuva suave */
  celebrate() {
    const fire = this.instance
    if (!fire) return
    this.cancel()

    const base = {
      colors: COLORS,
      shapes: ['square', 'circle', 'star'] as confetti.Shape[],
      disableForReducedMotion: true,
    }

    // Explosão no topo central
    void fire({
      ...base,
      particleCount: 180,
      spread: 100,
      startVelocity: 38,
      gravity: 0.85,
      ticks: 320,
      scalar: 1.1,
      origin: { x: 0.5, y: -0.05 },
    })

    // Explosões laterais defasadas
    this.timeouts.push(
      setTimeout(() => {
        void fire({
          ...base,
          particleCount: 70,
          angle: 55,
          spread: 60,
          startVelocity: 48,
          gravity: 0.9,
          ticks: 300,
          origin: { x: -0.02, y: 0.45 },
        })
        void fire({
          ...base,
          particleCount: 70,
          angle: 125,
          spread: 60,
          startVelocity: 48,
          gravity: 0.9,
          ticks: 300,
          origin: { x: 1.02, y: 0.45 },
        })
      }, 450)
    )

    // Chuva contínua e suave
    let rainCount = 0
    this.rainInterval = setInterval(() => {
      if (rainCount++ > 14 || !this.instance) {
        if (this.rainInterval) clearInterval(this.rainInterval)
        this.rainInterval = null
        return
      }
      void this.instance({
        ...base,
        particleCount: 10,
        spread: 120,
        startVelocity: 8,
        gravity: 0.65,
        ticks: 260,
        scalar: 0.9,
        origin: { x: 0.1 + Math.random() * 0.8, y: -0.05 },
      })
    }, 400)
  }

  /** Interrompe agendamentos pendentes (reset/novo jogo) */
  cancel() {
    for (const t of this.timeouts) clearTimeout(t)
    this.timeouts = []
    if (this.rainInterval) {
      clearInterval(this.rainInterval)
      this.rainInterval = null
    }
  }
}
