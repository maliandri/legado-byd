const WIDTH = 1080
const HEIGHT = 1920
const FPS = 30
const DEFAULT_SLIDE_DURATION = 3

export interface ReelSlide {
  titulo: string
  subtitulo?: string
  duracion?: number
  imagen?: string
}

interface Theme {
  bg: string
  bg2: string
  accent: string
  text: string
  subtext: string
}

const THEMES: Record<string, Theme> = {
  panaderia: { bg: '#3D1A05', bg2: '#6B3A1A', accent: '#C4A040', text: '#F2E6C8', subtext: '#DDD0A8' },
  reposteria: { bg: '#5A1F3A', bg2: '#8B3060', accent: '#F2C2D8', text: '#FDF0F5', subtext: '#F2C2D8' },
  deco: { bg: '#1E2D0A', bg2: '#2D4510', accent: '#C4A040', text: '#F2E6C8', subtext: '#DDD0A8' },
}

function hexRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

export class LegadoReelService {
  private offscreen: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private slides: ReelSlide[]
  private theme: Theme
  private animFrame: number | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private images: Map<string, HTMLImageElement> = new Map()
  private audioCtx: AudioContext | null = null
  private audioEl: HTMLAudioElement | null = null
  private audioDestStream: MediaStream | null = null
  private audioUrl: string | null

  constructor(
    offscreen: HTMLCanvasElement,
    slides: ReelSlide[],
    themeName: string,
    audioUrl?: string,
  ) {
    this.offscreen = offscreen
    offscreen.width = WIDTH
    offscreen.height = HEIGHT
    this.ctx = offscreen.getContext('2d')!
    this.slides = slides
    this.theme = THEMES[themeName] ?? THEMES.panaderia
    this.audioUrl = audioUrl ?? null
  }

  async preload(): Promise<void> {
    const urls = [...new Set(this.slides.map(s => s.imagen).filter(Boolean) as string[])]
    await Promise.all(
      urls.map(
        url =>
          new Promise<void>(resolve => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => { this.images.set(url, img); resolve() }
            img.onerror = () => resolve()
            img.src = url
          }),
      ),
    )
  }

  private initAudio(): void {
    try {
      this.audioCtx = new AudioContext()
      const dest = this.audioCtx.createMediaStreamDestination()
      this.audioDestStream = dest.stream

      if (this.audioUrl) {
        this.audioEl = new Audio(this.audioUrl)
        this.audioEl.crossOrigin = 'anonymous'
        this.audioEl.loop = true
        const src = this.audioCtx.createMediaElementSource(this.audioEl)
        const gain = this.audioCtx.createGain()
        gain.gain.value = 0.6
        src.connect(gain)
        gain.connect(this.audioCtx.destination)
        gain.connect(dest)
        this.audioEl.play().catch(() => {})
      } else {
        // Soft A-major ambient pad — connect to BOTH speakers and recording stream
        const master = this.audioCtx.createGain()
        master.gain.value = 0.8
        master.connect(this.audioCtx.destination)
        master.connect(dest)

        const notes = [
          { f: 110, g: 0.08 },
          { f: 220, g: 0.10 },
          { f: 277.18, g: 0.07 },
          { f: 329.63, g: 0.08 },
          { f: 440, g: 0.06 },
        ]
        notes.forEach(({ f, g }) => {
          const osc = this.audioCtx!.createOscillator()
          const gain = this.audioCtx!.createGain()
          osc.type = 'sine'
          osc.frequency.value = f
          gain.gain.value = g
          osc.connect(gain)
          gain.connect(master)
          osc.start()
        })
      }
    } catch {
      // Audio not available
    }
  }

  private cleanupAudio(): void {
    this.audioEl?.pause()
    this.audioEl = null
    this.audioCtx?.close().catch(() => {})
    this.audioCtx = null
    this.audioDestStream = null
  }

  private stopAnimation(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }
  }

  private drawBg() {
    const { ctx } = this
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    grad.addColorStop(0, this.theme.bg)
    grad.addColorStop(1, this.theme.bg2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.strokeStyle = this.theme.accent + '14'
    ctx.lineWidth = 1.5
    for (let i = -HEIGHT; i < WIDTH + HEIGHT; i += 80) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + HEIGHT, HEIGHT)
      ctx.stroke()
    }
  }

  private drawProductImage(slide: ReelSlide, t: number) {
    if (!slide.imagen) return
    const img = this.images.get(slide.imagen)
    if (!img) return

    const { ctx } = this
    const [r, g, b] = hexRgb(this.theme.bg)

    // Ken Burns: slow zoom in 1.0 → 1.06
    const scale = 1 + t * 0.06
    const sx = (WIDTH * scale) / img.width
    const sy = (HEIGHT * scale) / img.height
    const s = Math.max(sx, sy)
    const dW = img.width * s
    const dH = img.height * s
    const dX = (WIDTH - dW) / 2
    const dY = (HEIGHT - dH) / 2

    ctx.save()
    ctx.drawImage(img, dX, dY, dW, dH)

    // Gradient overlay: dark top + dark bottom
    const overlay = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    overlay.addColorStop(0, `rgba(${r},${g},${b},0.88)`)
    overlay.addColorStop(0.22, `rgba(${r},${g},${b},0.28)`)
    overlay.addColorStop(0.6, `rgba(${r},${g},${b},0.28)`)
    overlay.addColorStop(1, `rgba(${r},${g},${b},0.92)`)
    ctx.fillStyle = overlay
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.restore()
  }

  private drawLogo(alpha: number) {
    const { ctx } = this
    ctx.globalAlpha = alpha
    ctx.textAlign = 'center'

    ctx.fillStyle = this.theme.accent
    ctx.font = `bold 52px Georgia, serif`
    ctx.fillText('LEGADO', WIDTH / 2, 148)

    ctx.font = `28px Georgia, serif`
    ctx.fillStyle = this.theme.subtext
    ctx.fillText('Bazar y Deco', WIDTH / 2, 188)

    ctx.strokeStyle = this.theme.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(WIDTH / 2 - 100, 206)
    ctx.lineTo(WIDTH / 2 + 100, 206)
    ctx.stroke()

    ctx.globalAlpha = 1
  }

  private drawSlide(slide: ReelSlide, t: number) {
    const { ctx } = this
    const centerY = slide.imagen ? HEIGHT * 0.67 : HEIGHT / 2

    const titleAlpha = Math.min(1, t * 2.5)
    const titleOffY = (1 - Math.min(1, t * 2)) * 90
    const titleY = centerY - 60 + titleOffY

    ctx.globalAlpha = titleAlpha
    ctx.fillStyle = this.theme.text
    ctx.font = `bold 76px Georgia, serif`
    ctx.textAlign = 'center'

    const words = slide.titulo.split(' ')
    const lines: string[] = []
    let line = ''
    const maxW = WIDTH - 140
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    lines.push(line)

    const lh = 90
    const startY = titleY - ((lines.length - 1) * lh) / 2
    lines.forEach((l, i) => ctx.fillText(l, WIDTH / 2, startY + i * lh))

    if (slide.subtitulo) {
      const subAlpha = Math.max(0, Math.min(1, (t - 0.25) * 4))
      const subY = startY + lines.length * lh + 36 + (1 - Math.min(1, t)) * 50
      ctx.globalAlpha = subAlpha
      ctx.font = `46px Arial, sans-serif`
      ctx.fillStyle = this.theme.subtext
      ctx.fillText(slide.subtitulo, WIDTH / 2, subY)
    }

    ctx.globalAlpha = 1
  }

  private drawCTA(alpha: number) {
    const { ctx } = this
    ctx.globalAlpha = alpha

    const barH = 180
    const barY = HEIGHT - barH - 30
    ctx.fillStyle = this.theme.accent + 'DD'
    ctx.beginPath()
    ctx.roundRect(60, barY, WIDTH - 120, barH, 12)
    ctx.fill()

    ctx.fillStyle = this.theme.bg
    ctx.font = `bold 58px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('legadobyd.com', WIDTH / 2, barY + barH / 2 + 12)

    ctx.font = `36px Arial, sans-serif`
    ctx.fillStyle = this.theme.bg + 'CC'
    ctx.fillText('Neuquén, Argentina', WIDTH / 2, barY + barH / 2 + 58)

    ctx.globalAlpha = 1
  }

  drawFrame(slideIdx: number, t: number) {
    const slide = this.slides[slideIdx]

    this.drawBg()
    if (slide?.imagen) this.drawProductImage(slide, t)
    this.drawLogo(Math.min(1, t * 2))
    if (slide) this.drawSlide(slide, t)
    this.drawCTA(Math.max(0, (t - 0.65) * 3))

    // Fade in from black
    if (t < 0.1) {
      this.ctx.fillStyle = `rgba(0,0,0,${(1 - t / 0.1) * 0.85})`
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }
    // Fade to black
    if (t > 0.88) {
      this.ctx.fillStyle = `rgba(0,0,0,${((t - 0.88) / 0.12) * 0.85})`
      this.ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }
  }

  startPreview(preview: HTMLCanvasElement) {
    this.stopAnimation()
    this.cleanupAudio()
    this.initAudio() // audio plays through speakers during preview

    const pCtx = preview.getContext('2d')!
    const total = this.slides.length
    let slideIdx = 0
    let slideStart = performance.now()

    const loop = (now: number) => {
      const slideDur = (this.slides[slideIdx]?.duracion ?? DEFAULT_SLIDE_DURATION) * 1000
      if (now - slideStart >= slideDur) {
        slideIdx = (slideIdx + 1) % total
        slideStart = now
      }
      const t = Math.min(1, (now - slideStart) / slideDur)
      this.drawFrame(slideIdx, t)
      pCtx.clearRect(0, 0, preview.width, preview.height)
      pCtx.drawImage(this.offscreen, 0, 0, preview.width, preview.height)
      this.animFrame = requestAnimationFrame(loop)
    }

    this.animFrame = requestAnimationFrame(loop)
  }

  stop() {
    this.stopAnimation()
    this.cleanupAudio()
  }

  record(
    preview: HTMLCanvasElement,
    onProgress: (pct: number) => void,
    onDone: (blob: Blob) => void,
  ) {
    this.stopAnimation()
    this.cleanupAudio()
    this.initAudio() // fresh audio context for recording
    this.chunks = []

    const totalMs = this.slides.reduce(
      (s, sl) => s + (sl.duracion ?? DEFAULT_SLIDE_DURATION) * 1000,
      0,
    )

    const canvasStream = this.offscreen.captureStream(FPS)
    const tracks = [...canvasStream.getTracks()]
    if (this.audioDestStream) tracks.push(...this.audioDestStream.getAudioTracks())
    const stream = new MediaStream(tracks)

    const mimeType =
      ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t =>
        MediaRecorder.isTypeSupported(t),
      ) ?? 'video/webm'

    this.recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
    this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data) }
    this.recorder.onstop = () => {
      this.cleanupAudio()
      onDone(new Blob(this.chunks, { type: mimeType }))
    }
    this.recorder.start(100)

    const pCtx = preview.getContext('2d')!
    let slideIdx = 0
    let slideStart = performance.now()
    const recordStart = performance.now()

    const loop = (now: number) => {
      const totalElapsed = now - recordStart
      if (totalElapsed >= totalMs) {
        this.recorder?.stop()
        return
      }
      const slideDur = (this.slides[slideIdx]?.duracion ?? DEFAULT_SLIDE_DURATION) * 1000
      if (now - slideStart >= slideDur && slideIdx < this.slides.length - 1) {
        slideIdx++
        slideStart = now
      }
      const t = Math.min(1, (now - slideStart) / slideDur)
      this.drawFrame(slideIdx, t)
      pCtx.clearRect(0, 0, preview.width, preview.height)
      pCtx.drawImage(this.offscreen, 0, 0, preview.width, preview.height)
      onProgress(totalElapsed / totalMs)
      this.animFrame = requestAnimationFrame(loop)
    }

    this.animFrame = requestAnimationFrame(loop)
  }
}
