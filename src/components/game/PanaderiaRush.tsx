'use client'

import { useEffect, useRef } from 'react'

const GW = 400
const GH = 700
const TRAY_W = 108
const TRAY_H = 18
const TRAY_Y = GH - 90

const GOOD = [
  { e: '🥚', p: 10, w: 5 },
  { e: '🧈', p: 20, w: 4 },
  { e: '🍫', p: 30, w: 3 },
  { e: '🌾', p: 15, w: 4 },
  { e: '🍯', p: 25, w: 3 },
  { e: '🥛', p: 12, w: 4 },
  { e: '🧁', p: 60, w: 1 },
  { e: '🍰', p: 45, w: 1 },
  { e: '🥜', p: 15, w: 3 },
  { e: '🫙', p: 20, w: 2 },
]

const BAD = [
  { e: '🐀', w: 2 },
  { e: '🪲', w: 3 },
  { e: '🦟', w: 2 },
]

const POWER = [
  { e: '⭐', effect: 'double' },
  { e: '💖', effect: 'life' },
  { e: '🛡️', effect: 'shield' },
]

function weightedRandom<T extends { w: number }>(arr: T[]): T {
  const total = arr.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const x of arr) { r -= x.w; if (r <= 0) return x }
  return arr[0]
}

interface Item {
  id: number; x: number; y: number; vy: number
  emoji: string; points: number
  type: 'good' | 'bad' | 'power'; effect?: string
  rot: number; rotSpd: number
  dying: boolean; dyingAlpha: number; dyingVy: number
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; alpha: number; size: number; life: number
}

interface FloatText {
  id: number; x: number; y: number
  text: string; color: string; alpha: number; vy: number
}

type GState = 'idle' | 'playing' | 'gameover'

export default function PanaderiaRush() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let state: GState = 'idle'
    let score = 0
    let hiScore = parseInt(localStorage.getItem('legado-hiscore') || '0')
    let lives = 3
    let level = 1
    let frameCount = 0

    let trayX = GW / 2
    let trayTargetX = GW / 2

    let items: Item[] = []
    let particles: Particle[] = []
    let floats: FloatText[] = []
    let nextId = 0
    let nextFloatId = 0

    let spawnTimer = 0
    let spawnInterval = 90
    let baseVy = 2.5

    let combo = 0
    let comboTimer = 0
    let doubleActive = false
    let doubleTimer = 0
    let shieldActive = false
    let shieldTimer = 0
    let shake = 0

    let audioCtx: AudioContext | null = null

    function initAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    function beep(freq: number, type: OscillatorType, dur: number, delay = 0, vol = 0.18) {
      if (!audioCtx) return
      try {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain); gain.connect(audioCtx.destination)
        osc.type = type; osc.frequency.value = freq
        const t = audioCtx.currentTime + delay
        gain.gain.setValueAtTime(vol, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
        osc.start(t); osc.stop(t + dur + 0.05)
      } catch (_) { /* ignore */ }
    }

    function soundGood() {
      const base = Math.min(440 + combo * 110, 1320)
      beep(base, 'sine', 0.1, 0, 0.14)
      if (combo >= 3) beep(base * 1.5, 'sine', 0.15, 0.06, 0.1)
    }
    function soundBad() {
      beep(200, 'square', 0.1, 0, 0.18)
      beep(140, 'square', 0.2, 0.1, 0.18)
    }
    function soundPower() {
      beep(440, 'sine', 0.12, 0, 0.15)
      beep(660, 'sine', 0.12, 0.1, 0.15)
      beep(880, 'sine', 0.18, 0.2, 0.18)
    }
    function soundGameOver() {
      beep(440, 'sawtooth', 0.3, 0, 0.22)
      beep(330, 'sawtooth', 0.3, 0.22, 0.22)
      beep(220, 'sawtooth', 0.5, 0.44, 0.28)
    }
    function soundMiss() { beep(300, 'triangle', 0.14, 0, 0.08) }

    function spawnParticles(x: number, y: number, color: string, count = 8, force = 4) {
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.6
        const spd = force * (0.5 + Math.random())
        particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - force * 0.4, color, alpha: 1, size: 4 + Math.random() * 4, life: 0 })
      }
    }

    function addFloat(x: number, y: number, text: string, color: string) {
      floats.push({ id: nextFloatId++, x, y, text, color, alpha: 1, vy: -2.5 })
    }

    function rr(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, r)
    }

    function spawnItem() {
      const r = Math.random()
      let type: Item['type']
      let emoji = '', points = 0, effect = ''

      if (r < 0.07) {
        type = 'power'
        const it = POWER[Math.floor(Math.random() * POWER.length)]
        emoji = it.e; effect = it.effect
      } else if (r < 0.26) {
        type = 'bad'
        emoji = weightedRandom(BAD).e
      } else {
        type = 'good'
        const it = weightedRandom(GOOD)
        emoji = it.e; points = it.p
      }

      const margin = 42
      items.push({
        id: nextId++,
        x: margin + Math.random() * (GW - margin * 2),
        y: -38,
        vy: baseVy * (0.75 + Math.random() * 0.5),
        emoji, points, type, effect,
        rot: (Math.random() - 0.5) * 0.4,
        rotSpd: (Math.random() - 0.5) * 0.06,
        dying: false, dyingAlpha: 1, dyingVy: 0,
      })
    }

    function update() {
      if (state !== 'playing') return
      frameCount++

      level = Math.min(Math.floor(frameCount / 600) + 1, 10)
      baseVy = 2.5 + (level - 1) * 0.45
      spawnInterval = Math.max(32, 90 - (level - 1) * 6)

      trayX += (trayTargetX - trayX) * 0.18
      trayX = Math.max(TRAY_W / 2, Math.min(GW - TRAY_W / 2, trayX))

      spawnTimer++
      if (spawnTimer >= spawnInterval) { spawnItem(); spawnTimer = 0 }

      const kept: Item[] = []
      for (const item of items) {
        if (item.dying) {
          item.dyingAlpha -= 0.055
          item.y += item.dyingVy
          item.dyingVy += item.dyingVy < 0 ? 0.9 : 0.35
          if (item.dyingAlpha > 0) kept.push(item)
          continue
        }

        item.y += item.vy
        item.rot += item.rotSpd

        const left = trayX - TRAY_W / 2 - 6
        const right = trayX + TRAY_W / 2 + 6
        const caught = item.y >= TRAY_Y - 16 && item.y <= TRAY_Y + TRAY_H + 6 && item.x >= left && item.x <= right

        if (caught) {
          if (item.type === 'good') {
            combo++; comboTimer = 150
            const mult = (doubleActive ? 2 : 1) * (combo >= 5 ? 3 : combo >= 3 ? 2 : 1)
            const pts = item.points * mult
            score += pts
            if (score > hiScore) hiScore = score
            addFloat(item.x, TRAY_Y - 18, combo >= 3 ? `+${pts} 🔥x${combo}` : `+${pts}`, combo >= 3 ? '#C4A040' : '#4A5E1A')
            spawnParticles(item.x, TRAY_Y, combo >= 3 ? '#C4A040' : '#6BB33A', 8, 5)
            soundGood()
          } else if (item.type === 'bad') {
            if (shieldActive) {
              addFloat(item.x, TRAY_Y - 18, '🛡️ BLOQUEADO!', '#3498DB')
              spawnParticles(item.x, TRAY_Y, '#3498DB', 10, 6)
              shieldActive = false; shieldTimer = 0
            } else {
              lives--; combo = 0; shake = 20
              addFloat(item.x, TRAY_Y - 18, '-1 ❤️', '#E74C3C')
              spawnParticles(item.x, TRAY_Y, '#E74C3C', 12, 7)
              soundBad()
              if (lives <= 0) { lives = 0; endGame() }
            }
          } else {
            soundPower()
            if (item.effect === 'double') {
              doubleActive = true; doubleTimer = 360
              addFloat(item.x, TRAY_Y - 18, '⭐ 2x PUNTOS!', '#C4A040')
              spawnParticles(item.x, TRAY_Y, '#C4A040', 14, 7)
            } else if (item.effect === 'life') {
              lives = Math.min(lives + 1, 5)
              addFloat(item.x, TRAY_Y - 18, '💖 +VIDA!', '#E91E8C')
              spawnParticles(item.x, TRAY_Y, '#E91E8C', 14, 7)
            } else if (item.effect === 'shield') {
              shieldActive = true; shieldTimer = 600
              addFloat(item.x, TRAY_Y - 18, '🛡️ ESCUDO!', '#3498DB')
              spawnParticles(item.x, TRAY_Y, '#3498DB', 14, 7)
            }
          }
          item.dying = true; item.dyingVy = item.type === 'bad' ? 6 : -8
          kept.push(item)
          continue
        }

        if (item.y > GH + 55) {
          if (item.type === 'good') { combo = 0; soundMiss() }
          continue
        }
        kept.push(item)
      }
      items = kept

      if (doubleActive && --doubleTimer <= 0) doubleActive = false
      if (shieldActive && --shieldTimer <= 0) shieldActive = false
      if (comboTimer > 0 && --comboTimer <= 0) combo = 0
      if (shake > 0) shake -= 2

      particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.94
        p.life++; p.alpha = Math.max(0, 1 - p.life / 34)
        return p.alpha > 0
      })

      floats = floats.filter(f => { f.y += f.vy; f.alpha -= 0.022; return f.alpha > 0 })
    }

    function endGame() {
      state = 'gameover'
      localStorage.setItem('legado-hiscore', String(hiScore))
      soundGameOver()
    }

    function startGame() {
      initAudio()
      state = 'playing'
      score = 0; lives = 3; level = 1; frameCount = 0
      items = []; particles = []; floats = []
      combo = 0; comboTimer = 0
      doubleActive = false; doubleTimer = 0
      shieldActive = false; shieldTimer = 0
      shake = 0; spawnTimer = 0
      trayX = GW / 2; trayTargetX = GW / 2
      baseVy = 2.5; spawnInterval = 90
    }

    function draw() {
      const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.45 : 0
      const sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.28 : 0
      ctx.save()
      ctx.translate(sx, sy)

      const bg = ctx.createLinearGradient(0, 0, 0, GH)
      bg.addColorStop(0, '#FFFAF4')
      bg.addColorStop(1, '#F2E6C8')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, GW, GH)

      ctx.save()
      ctx.globalAlpha = 0.055
      for (let i = 0; i < 14; i++) {
        ctx.beginPath()
        ctx.arc(((i * 89 + frameCount * 0.12) % GW), 10 + (i * 41) % 55, 2 + i % 5, 0, Math.PI * 2)
        ctx.fillStyle = '#C4A040'; ctx.fill()
      }
      ctx.restore()

      ctx.fillStyle = '#E8D5B0'; ctx.fillRect(0, TRAY_Y + TRAY_H + 28, GW, GH)
      ctx.fillStyle = '#C8B494'; ctx.fillRect(0, TRAY_Y + TRAY_H + 28, GW, 4)

      for (const item of items) {
        ctx.save()
        ctx.globalAlpha = item.dying ? Math.max(0, item.dyingAlpha) : 1
        ctx.translate(item.x, item.y); ctx.rotate(item.rot)
        ctx.font = '32px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(item.emoji, 0, 0)
        ctx.restore()
      }

      for (const p of particles) {
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      ctx.save()
      for (const f of floats) {
        ctx.globalAlpha = f.alpha
        ctx.font = 'bold 17px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3.5
        ctx.strokeText(f.text, f.x, f.y)
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y)
      }
      ctx.restore()

      const tx = trayX - TRAY_W / 2

      if (shieldActive) {
        ctx.save()
        ctx.shadowColor = '#3498DB'
        ctx.shadowBlur = 22 + Math.sin(frameCount * 0.12) * 8
        ctx.globalAlpha = 0.45 + Math.sin(frameCount * 0.18) * 0.25
        ctx.fillStyle = '#3498DB'
        rr(tx - 6, TRAY_Y - 6, TRAY_W + 12, TRAY_H + 12, 12); ctx.fill()
        ctx.restore()
      }

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6
      const tg = ctx.createLinearGradient(tx, TRAY_Y, tx, TRAY_Y + TRAY_H)
      tg.addColorStop(0, '#6B3512'); tg.addColorStop(1, '#3D1A05')
      ctx.fillStyle = tg; rr(tx, TRAY_Y, TRAY_W, TRAY_H, 8); ctx.fill()
      ctx.restore()

      ctx.strokeStyle = '#C4A040'; ctx.lineWidth = 2
      rr(tx, TRAY_Y, TRAY_W, TRAY_H, 8); ctx.stroke()

      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = 'white'
      rr(tx + 5, TRAY_Y + 2, TRAY_W - 10, 5, 3); ctx.fill(); ctx.restore()

      if (state === 'playing') {
        ctx.save()
        ctx.fillStyle = 'rgba(61,26,5,0.84)'
        rr(8, 8, 185, 54, 10); ctx.fill()
        ctx.fillStyle = '#C4A040'
        ctx.font = 'bold 27px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'
        ctx.fillText(String(score), 18, 11)
        ctx.fillStyle = 'rgba(196,160,64,0.62)'
        ctx.font = '12px Inter, system-ui, sans-serif'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`🏆 ${hiScore}`, 18, 60)
        ctx.restore()

        ctx.save(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
        ctx.font = '22px serif'
        ctx.fillText('❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives)), GW - 10, 35)
        ctx.restore()

        ctx.save()
        ctx.fillStyle = 'rgba(74,94,26,0.88)'
        rr(GW / 2 - 40, 8, 80, 28, 8); ctx.fill()
        ctx.fillStyle = '#F9EDD3'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(`Nivel ${level}`, GW / 2, 22)
        ctx.restore()

        let hudY = 45

        if (combo >= 2) {
          ctx.save()
          const pu = 1 + Math.sin(frameCount * 0.28) * 0.07
          ctx.fillStyle = 'rgba(196,160,64,0.94)'
          rr(8, hudY, 132, 28, 8); ctx.fill()
          ctx.fillStyle = '#3D1A05'
          ctx.font = `bold ${Math.round(13 * pu)}px Inter, system-ui, sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`🔥 COMBO x${combo}`, 74, hudY + 14)
          ctx.restore(); hudY += 34
        }

        if (doubleActive) {
          ctx.save()
          ctx.fillStyle = `rgba(196,160,64,${0.72 + Math.sin(frameCount * 0.32) * 0.28})`
          rr(8, hudY, 166, 28, 8); ctx.fill()
          ctx.fillStyle = '#3D1A05'
          ctx.font = 'bold 12px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`⭐ 2x ${Math.ceil(doubleTimer / 60)}s`, 91, hudY + 14)
          ctx.restore(); hudY += 34
        }

        if (shieldActive) {
          ctx.save()
          ctx.fillStyle = 'rgba(52,152,219,0.9)'
          rr(8, hudY, 148, 28, 8); ctx.fill()
          ctx.fillStyle = 'white'
          ctx.font = 'bold 12px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`🛡️ Escudo ${Math.ceil(shieldTimer / 60)}s`, 82, hudY + 14)
          ctx.restore()
        }
      }

      if (state === 'idle') {
        ctx.fillStyle = 'rgba(25,8,0,0.9)'; ctx.fillRect(0, 0, GW, GH)
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

        ctx.font = '72px serif'; ctx.fillText('🧁', GW / 2, 128)

        ctx.font = 'bold 35px Playfair Display, Georgia, serif'
        ctx.fillStyle = '#C4A040'; ctx.fillText('Panadería Rush', GW / 2, 214)

        ctx.font = '17px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#F9EDD3'; ctx.fillText('¡Atrapá los ingredientes!', GW / 2, 257)

        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.fillStyle = 'rgba(249,237,211,0.6)'
        ctx.fillText('Arrastrá el dedo para mover la bandeja', GW / 2, 291)

        ctx.fillStyle = 'rgba(61,26,5,0.5)'
        rr(GW / 2 - 155, 315, 310, 115, 12); ctx.fill()
        ctx.strokeStyle = 'rgba(196,160,64,0.3)'; ctx.lineWidth = 1
        rr(GW / 2 - 155, 315, 310, 115, 12); ctx.stroke()

        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(249,237,211,0.9)'
        ctx.fillText('Atrapá:', GW / 2 - 142, 340)
        ctx.font = '22px serif'; ctx.textAlign = 'center'
        ctx.fillText('🥚🧈🍫🌾🧁🍯🥛', GW / 2 + 50, 340)

        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'; ctx.fillStyle = '#E74C3C'
        ctx.fillText('Evitá:', GW / 2 - 142, 373)
        ctx.font = '22px serif'; ctx.textAlign = 'center'
        ctx.fillText('🐀🪲🦟', GW / 2 + 50, 373)

        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'; ctx.fillStyle = '#C4A040'
        ctx.fillText('Power-ups:', GW / 2 - 142, 406)
        ctx.font = '22px serif'; ctx.textAlign = 'center'
        ctx.fillText('⭐💖🛡️', GW / 2 + 50, 406)

        if (hiScore > 0) {
          ctx.font = '15px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'; ctx.fillStyle = '#C4A040'
          ctx.fillText(`🏆 Récord: ${hiScore}`, GW / 2, 448)
        }

        const btnY = hiScore > 0 ? 468 : 448
        const btnGrad = ctx.createLinearGradient(GW / 2 - 110, btnY, GW / 2 + 110, btnY + 58)
        btnGrad.addColorStop(0, '#D4B050'); btnGrad.addColorStop(1, '#B89030')
        ctx.fillStyle = btnGrad; rr(GW / 2 - 110, btnY, 220, 58, 14); ctx.fill()
        ctx.strokeStyle = '#E8C860'; ctx.lineWidth = 2
        rr(GW / 2 - 110, btnY, 220, 58, 14); ctx.stroke()
        ctx.fillStyle = '#3D1A05'
        ctx.font = 'bold 24px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('¡JUGAR!', GW / 2, btnY + 29)

        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.fillStyle = 'rgba(196,160,64,0.4)'
        ctx.fillText('legadobyd.com', GW / 2, GH - 18)
        ctx.restore()
      }

      if (state === 'gameover') {
        ctx.fillStyle = 'rgba(15,4,0,0.94)'; ctx.fillRect(0, 0, GW, GH)
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

        ctx.font = '68px serif'
        ctx.fillText(score > 0 ? '🎉' : '😢', GW / 2, 130)

        ctx.font = 'bold 35px Playfair Display, Georgia, serif'
        ctx.fillStyle = score > 0 ? '#C4A040' : '#E74C3C'
        ctx.fillText('¡Se acabó!', GW / 2, 222)

        ctx.font = '18px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#F9EDD3'
        ctx.fillText('Tu puntaje:', GW / 2, 272)

        ctx.font = 'bold 54px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#C4A040'
        ctx.fillText(String(score), GW / 2, 332)

        if (score > 0 && score >= hiScore) {
          ctx.font = 'bold 18px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#C4A040'
          ctx.fillText('🏆 ¡NUEVO RÉCORD!', GW / 2, 384)
        } else if (hiScore > 0) {
          ctx.font = '15px Inter, system-ui, sans-serif'
          ctx.fillStyle = 'rgba(249,237,211,0.55)'
          ctx.fillText(`Récord: ${hiScore}`, GW / 2, 384)
        }

        const rg = ctx.createLinearGradient(GW / 2 - 115, 416, GW / 2 + 115, 474)
        rg.addColorStop(0, '#D4B050'); rg.addColorStop(1, '#B89030')
        ctx.fillStyle = rg; rr(GW / 2 - 115, 416, 230, 58, 14); ctx.fill()
        ctx.strokeStyle = '#E8C860'; ctx.lineWidth = 2
        rr(GW / 2 - 115, 416, 230, 58, 14); ctx.stroke()
        ctx.fillStyle = '#3D1A05'
        ctx.font = 'bold 20px Inter, system-ui, sans-serif'
        ctx.fillText('🔄 JUGAR DE NUEVO', GW / 2, 445)

        ctx.fillStyle = 'rgba(61,26,5,0.55)'
        rr(GW / 2 - 115, 490, 230, 48, 12); ctx.fill()
        ctx.strokeStyle = 'rgba(196,160,64,0.4)'; ctx.lineWidth = 1.5
        rr(GW / 2 - 115, 490, 230, 48, 12); ctx.stroke()
        ctx.fillStyle = 'rgba(249,237,211,0.78)'
        ctx.font = '16px Inter, system-ui, sans-serif'
        ctx.fillText('🛒 Ir a la tienda', GW / 2, 514)

        ctx.restore()
      }

      ctx.restore()
    }

    function hitTest(px: number, py: number) {
      if (state === 'idle') {
        const btnY = hiScore > 0 ? 468 : 448
        if (px >= GW / 2 - 110 && px <= GW / 2 + 110 && py >= btnY && py <= btnY + 58) startGame()
      } else if (state === 'gameover') {
        if (px >= GW / 2 - 115 && px <= GW / 2 + 115 && py >= 416 && py <= 474) startGame()
        if (px >= GW / 2 - 115 && px <= GW / 2 + 115 && py >= 490 && py <= 538) window.location.href = '/'
      }
    }

    function toGame(clientX: number, clientY: number): [number, number] {
      const rect = canvas.getBoundingClientRect()
      return [(clientX - rect.left) * (GW / rect.width), (clientY - rect.top) * (GH / rect.height)]
    }

    let activeTouchId: number | null = null

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      const t = e.changedTouches[0]
      activeTouchId = t.identifier
      const [gx, gy] = toGame(t.clientX, t.clientY)
      hitTest(gx, gy)
      if (state === 'playing') trayTargetX = Math.max(TRAY_W / 2, Math.min(GW - TRAY_W / 2, gx))
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier !== activeTouchId) continue
        if (state !== 'playing') continue
        const [gx] = toGame(t.clientX, t.clientY)
        trayTargetX = Math.max(TRAY_W / 2, Math.min(GW - TRAY_W / 2, gx))
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (state !== 'playing') return
      const [gx] = toGame(e.clientX, e.clientY)
      trayTargetX = Math.max(TRAY_W / 2, Math.min(GW - TRAY_W / 2, gx))
    }

    function onClick(e: MouseEvent) {
      const [gx, gy] = toGame(e.clientX, e.clientY)
      hitTest(gx, gy)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (state === 'playing') {
        if (e.key === 'ArrowLeft') trayTargetX = Math.max(TRAY_W / 2, trayTargetX - 36)
        if (e.key === 'ArrowRight') trayTargetX = Math.min(GW - TRAY_W / 2, trayTargetX + 36)
      } else if (e.key === 'Enter' || e.key === ' ') {
        startGame()
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown)

    let rafId = 0
    function loop() { update(); draw(); rafId = requestAnimationFrame(loop) }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '100dvh',
      background: '#1A0800',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        width={GW}
        height={GH}
        style={{
          display: 'block',
          maxWidth: '100vw',
          maxHeight: '100dvh',
          width: 'auto',
          height: '100dvh',
          aspectRatio: `${GW}/${GH}`,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>
  )
}
