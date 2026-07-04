/**
 * Motor de áudio do jogo da memória — 100% sintetizado via Web Audio API.
 * Port direto do demo original (Arcanum), sem arquivos de áudio externos.
 * Independente do sistema de sons do Termo (lib/sounds) para não interferir nele.
 */

type OscLike = OscillatorNode

export class MemoryAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicLayers: OscLike[] = []
  private arpeggioTimeout: ReturnType<typeof setTimeout> | null = null

  musicPlaying = false

  init() {
    if (this.ctx) return
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctor()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.75
    this.masterGain.connect(this.ctx.destination)

    // Pseudo-reverb: delay + feedback
    const reverb = this.ctx.createDelay(1.0)
    reverb.delayTime.value = 0.18
    const feedback = this.ctx.createGain()
    feedback.gain.value = 0.32
    const reverbWet = this.ctx.createGain()
    reverbWet.gain.value = 0.35
    reverb.connect(feedback)
    feedback.connect(reverb)
    reverb.connect(reverbWet)
    reverbWet.connect(this.masterGain)

    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.42
    this.musicGain.connect(this.masterGain)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = 0.85
    this.sfxGain.connect(this.masterGain)
    this.sfxGain.connect(reverb)
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
  }

  /** Sino harmônico para um par encontrado */
  playChime(baseFreq = 523.25) {
    if (!this.ctx || !this.sfxGain) return
    const now = this.ctx.currentTime
    const harmonics: { f: number; type: OscillatorType; g: number; d: number }[] = [
      { f: baseFreq, type: 'sine', g: 0.32, d: 1.8 },
      { f: baseFreq * 1.5, type: 'sine', g: 0.18, d: 1.4 },
      { f: baseFreq * 2, type: 'triangle', g: 0.12, d: 1.0 },
      { f: baseFreq * 3, type: 'sine', g: 0.06, d: 0.6 },
    ]
    for (const h of harmonics) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = h.type
      osc.frequency.value = h.f
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(h.g, now + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + h.d)
      osc.connect(gain).connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + h.d + 0.05)
    }
  }

  /** Tom dissonante descendente para erro */
  playMiss() {
    if (!this.ctx || !this.sfxGain) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.55)

    osc2.type = 'square'
    osc2.frequency.setValueAtTime(242, now)
    osc2.frequency.exponentialRampToValueAtTime(88, now + 0.55)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, now)
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.55)
    filter.Q.value = 4

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.22, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65)

    osc.connect(filter)
    osc2.connect(filter)
    filter.connect(gain).connect(this.sfxGain)
    osc.start(now)
    osc2.start(now)
    osc.stop(now + 0.7)
    osc2.stop(now + 0.7)
  }

  /** Clique suave ao virar carta */
  playFlip() {
    if (!this.ctx || !this.sfxGain) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.08)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.1, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain).connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  /** Arpejo ascendente + brilhos para fanfarra de sequência */
  playStreakFanfare(streakCount: number) {
    if (!this.ctx || !this.sfxGain) return
    const now = this.ctx.currentTime
    // O tom sobe com a sequência (máx. +7 semitons)
    const semitones = Math.min(Math.max(streakCount - 2, 0), 7)
    const baseFreq = 392 * Math.pow(2, semitones / 12) // base G4
    const scale = [1, 1.25, 1.5, 2, 2.5, 3]
    const notes = scale.map((s) => baseFreq * s)

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const start = now + i * 0.06
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.22, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)
      osc.connect(gain).connect(this.sfxGain)
      osc.start(start)
      osc.stop(start + 0.75)
    })

    // Brilhos agudos
    setTimeout(() => {
      if (!this.ctx || !this.sfxGain) return
      const t = this.ctx.currentTime
      for (let i = 0; i < 6; i++) {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 2200 + Math.random() * 2500
        const start = t + i * 0.035
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.07, start + 0.005)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
        osc.connect(gain).connect(this.sfxGain)
        osc.start(start)
        osc.stop(start + 0.2)
      }
    }, 180)
  }

  /** Progressão triunfante ao completar o jogo */
  playCompletion() {
    if (!this.ctx || !this.sfxGain) return
    const now = this.ctx.currentTime
    // I - V - vi - IV em dó maior, em camadas
    const progression = [
      { root: 261.63, third: 329.63, fifth: 392.0, oct: 523.25 }, // C
      { root: 392.0, third: 493.88, fifth: 587.33, oct: 783.99 }, // G
      { root: 220.0, third: 261.63, fifth: 329.63, oct: 440.0 }, // Am
      { root: 349.23, third: 440.0, fifth: 523.25, oct: 698.46 }, // F
      { root: 523.25, third: 659.25, fifth: 783.99, oct: 1046.5 }, // C 8ª acima
    ]
    progression.forEach((chord, idx) => {
      const start = now + idx * 0.32
      ;[chord.root, chord.third, chord.fifth, chord.oct].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = i === 0 ? 'sawtooth' : 'triangle'
        osc.frequency.value = freq
        const peak = 0.12 / (i + 1)
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(peak, start + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4)

        const filter = this.ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 2200
        osc.connect(filter).connect(gain).connect(this.sfxGain)
        osc.start(start)
        osc.stop(start + 1.45)
      })
    })
  }

  /** Música ambiente em camadas */
  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return
    this.musicPlaying = true
    const ctx = this.ctx

    // CAMADA 1: drone grave — C2 + G2 senoidal
    const drone1 = ctx.createOscillator()
    const drone2 = ctx.createOscillator()
    const droneGain = ctx.createGain()
    drone1.type = 'sine'
    drone1.frequency.value = 65.41
    drone2.type = 'sine'
    drone2.frequency.value = 98.0
    droneGain.gain.value = 0.11
    drone1.connect(droneGain)
    drone2.connect(droneGain)
    droneGain.connect(this.musicGain)
    drone1.start()
    drone2.start()

    // CAMADA 2: pad — dente de serra filtrado com LFO lento
    const pad = ctx.createOscillator()
    const padGain = ctx.createGain()
    const padFilter = ctx.createBiquadFilter()
    const padLfo = ctx.createOscillator()
    const padLfoGain = ctx.createGain()
    pad.type = 'sawtooth'
    pad.frequency.value = 261.63
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 600
    padFilter.Q.value = 3
    padGain.gain.value = 0.05
    padLfo.frequency.value = 0.13
    padLfoGain.gain.value = 4
    padLfo.connect(padLfoGain).connect(pad.frequency)
    pad.connect(padFilter).connect(padGain).connect(this.musicGain)
    pad.start()
    padLfo.start()

    // CAMADA 3: brilho agudo — senoide com trêmolo
    const shimmer = ctx.createOscillator()
    const shimmerGain = ctx.createGain()
    const shimmerLfo = ctx.createOscillator()
    const shimmerLfoGain = ctx.createGain()
    shimmer.type = 'sine'
    shimmer.frequency.value = 1046.5
    shimmerGain.gain.value = 0.015
    shimmerLfo.type = 'sine'
    shimmerLfo.frequency.value = 0.27
    shimmerLfoGain.gain.value = 0.012
    shimmerLfo.connect(shimmerLfoGain).connect(shimmerGain.gain)
    shimmer.connect(shimmerGain).connect(this.musicGain)
    shimmer.start()
    shimmerLfo.start()

    this.musicLayers = [drone1, drone2, pad, padLfo, shimmer, shimmerLfo]

    // CAMADA 4: arpejos aleatórios da pentatônica de dó maior
    this.scheduleArpeggio()
  }

  private scheduleArpeggio() {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
    const note = notes[Math.floor(Math.random() * notes.length)]
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = note
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8)
    osc.connect(gain).connect(this.musicGain)
    osc.start(now)
    osc.stop(now + 2.85)

    this.arpeggioTimeout = setTimeout(() => this.scheduleArpeggio(), 2400 + Math.random() * 2800)
  }

  stopMusic() {
    if (!this.musicPlaying) return
    this.musicPlaying = false
    if (this.arpeggioTimeout) clearTimeout(this.arpeggioTimeout)
    for (const osc of this.musicLayers) {
      try {
        osc.stop()
      } catch {
        // já parado
      }
    }
    this.musicLayers = []
  }

  /** Libera o AudioContext ao sair da rota (SPA) */
  dispose() {
    this.stopMusic()
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined)
      this.ctx = null
      this.masterGain = null
      this.musicGain = null
      this.sfxGain = null
    }
  }
}
