const WIDTH = 1080
const HEIGHT = 1920
const FPS = 30
const DEFAULT_SLIDE_DURATION = 3

export interface ReelSlide {
  titulo: string
  subtitulo?: string
  duracion?: number
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

export class LegadoReelService {
  private offscreen: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private slides: ReelSlide[]
  private theme: Theme
  private animFrame: number | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []

  constructor(offscreen: HTMLCanvasElement, slides: ReelSlide[], themeName: string) {
    this.offscreen = offscreen
    offscreen.width = WIDTH
    offscreen.height = HEIGHT
    this.ctx = offscreen.getContext('2d')!
    this.slides = slides
    this.theme = THEMES[themeName] ?? THEMES.panaderia
  }

  private drawBg() {
    const { ctx } = this
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    grad.addColorStop(0, this.theme.bg)
    grad.addColorStop(1, this.theme.bg2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.strokeStyle = this.theme.accent + '18'
    ctx.lineWidth = 1.5
    for (let i = -HEIGHT; i < WIDTH + HEIGHT; i += 80) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + HEIGHT, HEIGHT)
      ctx.stroke()
    }
  }

  private drawLogo(alpha: number) {
    const { ctx } = this
    ctx.globalAlpha = alpha

    ctx.fillStyle = this.theme.accent
    ctx.font = `bold 52px 'Georgia', serif`
    ctx.textAlign = 'center'
    ctx.fillText('LEGADO', WIDTH / 2, 150)

    ctx.font = `28px 'Georgia', serif`
    ctx.fillStyle = this.theme.subtext
    ctx.fillText('Bazar y Deco', WIDTH / 2, 190)

    ctx.strokeStyle = this.theme.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(WIDTH / 2 - 100, 208)
    ctx.lineTo(WIDTH / 2 + 100, 208)
    ctx.stroke()

    ctx.globalAlpha = 1
  }

  private drawSlide(slide: ReelSlide, t: number) {
    const { ctx } = this

    const titleY = HEIGHT / 2 - 60 + (1 - Math.min(1, t * 2)) * 90
    const titleAlpha = Math.min(1, t * 2.5)

    ctx.globalAlpha = titleAlpha
    ctx.fillStyle = this.theme.text
    ctx.font = `bold 76px 'Georgia', serif`
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
      ctx.font = `46px 'Arial', sans-serif`
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
    ctx.font = `bold 58px 'Arial', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('legadobyd.com', WIDTH / 2, barY + barH / 2 + 12)

    ctx.font = `36px 'Arial', sans-serif`
    ctx.fillStyle = this.theme.bg + 'CC'
    ctx.fillText('Neuquén, Argentina', WIDTH / 2, barY + barH / 2 + 58)

    ctx.globalAlpha = 1
  }

  drawFrame(slideIdx: number, t: number) {
    this.drawBg()
    this.drawLogo(Math.min(1, t * 2))
    if (this.slides[slideIdx]) this.drawSlide(this.slides[slideIdx], t)
    this.drawCTA(Math.max(0, (t - 0.65) * 3))
  }

  startPreview(preview: HTMLCanvasElement) {
    this.stop()
    const pCtx = preview.getContext('2d')!
    const total = this.slides.length

    let slideIdx = 0
    let slideStart = performance.now()

    const loop = (now: number) => {
      const slideDur = (this.slides[slideIdx]?.duracion ?? DEFAULT_SLIDE_DURATION) * 1000
      const elapsed = now - slideStart

      if (elapsed >= slideDur) {
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
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }
  }

  record(
    preview: HTMLCanvasElement,
    onProgress: (pct: number) => void,
    onDone: (blob: Blob) => void,
  ) {
    this.stop()
    this.chunks = []

    const totalMs = this.slides.reduce((s, sl) => s + (sl.duracion ?? DEFAULT_SLIDE_DURATION) * 1000, 0)
    const stream = this.offscreen.captureStream(FPS)

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'

    this.recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
    this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data) }
    this.recorder.onstop = () => onDone(new Blob(this.chunks, { type: mimeType }))
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
      const slideElapsed = now - slideStart

      if (slideElapsed >= slideDur && slideIdx < this.slides.length - 1) {
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
