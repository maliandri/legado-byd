'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Film,
  Sparkles,
  RefreshCw,
  Download,
  Play,
  Square,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Music,
  Loader2,
  Instagram,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { getProductos } from '@/lib/firebase/firestore'
import type { Producto } from '@/types'
import { LegadoReelService, type ReelSlide } from '@/utils/legadoReelService'

type Step = 1 | 2 | 3

interface Track {
  id: string
  nombre: string
  artista: string
  duracion: number
  audioUrl: string
  imagen: string
}

const THEMES = [
  { id: 'panaderia', label: 'Panadería', color: '#3D1A05' },
  { id: 'reposteria', label: 'Repostería', color: '#5A1F3A' },
  { id: 'deco', label: 'Decoración', color: '#1E2D0A' },
]

const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #DDD0A8',
  borderRadius: '2px',
  backgroundColor: '#FDF8EE',
  color: '#3D1A05',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
} as const

export default function ReelCreator() {
  const [step, setStep] = useState<Step>(1)
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProds, setLoadingProds] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [theme, setTheme] = useState('panaderia')
  const [slides, setSlides] = useState<ReelSlide[]>([])
  const [generandoScript, setGenerandoScript] = useState(false)
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [msg, setMsg] = useState('')
  const [igStatus, setIgStatus] = useState<'idle' | 'uploading' | 'sending' | 'ok' | 'error'>('idle')

  // Music
  const [tracks, setTracks] = useState<Track[]>([])
  const [loadingMusic, setLoadingMusic] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null)
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)

  const offscreenRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const svcRef = useRef<LegadoReelService | null>(null)

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch(console.error)
      .finally(() => setLoadingProds(false))
  }, [])

  const selectedProductos = productos.filter(p => selectedIds.includes(p.id))
  const filtered = productos.filter(
    p => !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  )

  function toggleProduct(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    )
  }

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 5000)
  }

  async function handleGenerarScript() {
    if (selectedProductos.length === 0) return
    setGenerandoScript(true)
    try {
      const res = await fetch('/api/admin/reel-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productos: selectedProductos.map(p => ({ nombre: p.nombre, precio: p.precio })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')

      const rawSlides: ReelSlide[] = data.slides ?? []

      // Assign product images cycling through selected products
      const withImages = rawSlides.map((slide, i) => ({
        ...slide,
        imagen: selectedProductos[i % selectedProductos.length]?.imagen || undefined,
      }))

      setSlides(withImages)
      setStep(2)
    } catch (err: any) {
      flash(`Error: ${err.message}`)
    } finally {
      setGenerandoScript(false)
    }
  }

  async function cargarMusica() {
    setLoadingMusic(true)
    try {
      const res = await fetch(`/api/admin/music?theme=${theme}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setTracks(data.tracks ?? [])
    } catch (err: any) {
      flash(`Error al cargar música: ${err.message}`)
    } finally {
      setLoadingMusic(false)
    }
  }

  function previewTrack(track: Track) {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
      audioPreviewRef.current = null
    }
    if (previewingTrack === track.id) {
      setPreviewingTrack(null)
      return
    }
    const audio = new Audio(track.audioUrl)
    audio.volume = 0.5
    audio.play().catch(() => {})
    audioPreviewRef.current = audio
    setPreviewingTrack(track.id)
    audio.onended = () => setPreviewingTrack(null)
  }

  useEffect(() => {
    return () => {
      audioPreviewRef.current?.pause()
    }
  }, [])

  function updateSlide(idx: number, patch: Partial<ReelSlide>) {
    setSlides(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  function removeSlide(idx: number) {
    setSlides(prev => prev.filter((_, i) => i !== idx))
  }

  function addSlide() {
    setSlides(prev => [...prev, { titulo: 'Nuevo slide', subtitulo: '', duracion: 3 }])
  }

  const initSvc = useCallback(() => {
    if (!offscreenRef.current || slides.length === 0) return null
    svcRef.current?.stop()
    const svc = new LegadoReelService(
      offscreenRef.current,
      slides,
      theme,
      selectedTrack?.audioUrl,
    )
    svcRef.current = svc
    return svc
  }, [slides, theme, selectedTrack])

  async function startPreview() {
    const svc = initSvc()
    if (!svc || !previewRef.current) return
    await svc.preload()
    svc.startPreview(previewRef.current)
    setPreviewing(true)
  }

  function stopPreview() {
    svcRef.current?.stop()
    setPreviewing(false)
  }

  function goToStep3() {
    setStep(3)
    setVideoBlob(null)
    setProgress(0)
    svcRef.current = null
    setTimeout(() => startPreview(), 80)
  }

  async function handleRecord() {
    stopPreview()
    setRecording(true)
    setProgress(0)
    setVideoBlob(null)

    const svc = initSvc()
    if (!svc || !previewRef.current) {
      setRecording(false)
      return
    }
    await svc.preload()

    svc.record(
      previewRef.current,
      pct => setProgress(pct),
      blob => {
        setVideoBlob(blob)
        setRecording(false)
      },
    )
  }

  async function handlePublicarIG() {
    if (!videoBlob) return
    setIgStatus('uploading')
    try {
      // Subir directo a Cloudinary desde el browser (evita límite 6MB de Netlify)
      const signRes = await fetch('/api/cloudinary-sign?type=video')
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json()

      const fd = new FormData()
      fd.append('file', new File([videoBlob], `reel-${Date.now()}.webm`, { type: videoBlob.type }))
      fd.append('api_key', apiKey)
      fd.append('timestamp', timestamp)
      fd.append('signature', signature)
      fd.append('folder', folder)

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: 'POST', body: fd },
      )
      const upText = await upRes.text()
      let upData: any
      try { upData = JSON.parse(upText) } catch { throw new Error(`Cloudinary error: ${upText.slice(0, 120)}`) }
      if (!upRes.ok) throw new Error(upData.error?.message || `Cloudinary ${upRes.status}`)

      // Convertir webm → mp4 (H.264/AAC) via Cloudinary transform para Instagram
      const videoUrl = (upData.secure_url as string)
        .replace('/video/upload/', '/video/upload/vc_h264,ac_aac,q_80/')
        .replace(/\.webm$/, '.mp4')

      setIgStatus('sending')
      const caption = slides.map(s => s.titulo).join(' · ') + '\n\n#legadobyd #panaderia #pasteleria #neuquen'
      const res = await fetch('/api/instagram/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, videoUrl, type: 'reel' }),
      })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(`Respuesta inesperada (${res.status}): ${text.slice(0, 80)}`) }
      if (!res.ok) throw new Error(data.error || 'Error')
      setIgStatus('ok')
      setTimeout(() => setIgStatus('idle'), 5000)
    } catch (err: any) {
      flash(`Error: ${err.message}`)
      setIgStatus('error')
      setTimeout(() => setIgStatus('idle'), 4000)
    }
  }

  function handleDownload() {
    if (!videoBlob) return
    const url = URL.createObjectURL(videoBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `legado-reel-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => () => { svcRef.current?.stop() }, [])

  const totalSecs = slides.reduce((s, sl) => s + (sl.duracion ?? 3), 0)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#3D1A05',
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Creador de Reels
        </h2>
        <p style={{ color: '#6B3A1A', fontSize: '0.85rem' }}>
          Creá un video corto con tus productos para Instagram o WhatsApp.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: step >= s ? '#C4A040' : '#DDD0A8',
                color: step >= s ? '#3D1A05' : '#6B3A1A',
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className="w-8 h-0.5"
                style={{ backgroundColor: step > s ? '#C4A040' : '#DDD0A8' }}
              />
            )}
          </div>
        ))}
        <span style={{ fontSize: '0.8rem', color: '#6B3A1A', marginLeft: 8 }}>
          {step === 1 ? 'Elegí productos' : step === 2 ? 'Guión y música' : 'Grabá el reel'}
        </span>
      </div>

      {msg && (
        <div
          className="px-3 py-2 rounded-sm text-sm mb-4"
          style={{ backgroundColor: '#F5CAAA', color: '#3D1A05' }}
        >
          {msg}
        </div>
      )}

      {/* ── STEP 1: productos ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#6B3A1A' }}>
              Seleccioná hasta 3 productos ({selectedIds.length}/3)
            </label>

            <input
              style={{ ...inputStyle, marginBottom: 6 }}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
            />

            <div
              className="rounded-sm overflow-hidden"
              style={{ border: '1px solid #DDD0A8', maxHeight: 260, overflowY: 'auto' }}
            >
              {loadingProds ? (
                <div className="text-center py-6">
                  <div
                    className="inline-block animate-spin rounded-full h-5 w-5 border-4"
                    style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }}
                  />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-4 text-center text-sm" style={{ color: '#A0622A' }}>
                  Sin resultados
                </div>
              ) : (
                filtered.slice(0, 60).map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    style={{
                      backgroundColor: selectedIds.includes(p.id) ? '#F2E6C8' : '#FDF8EE',
                      borderBottom: '1px solid #EEE0C0',
                    }}
                    onClick={() => toggleProduct(p.id)}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedIds.includes(p.id)}
                      className="accent-amber-700 pointer-events-none"
                    />
                    {p.imagen && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagen} alt="" className="w-9 h-9 object-cover rounded-sm flex-shrink-0" />
                    )}
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#3D1A05' }}>
                      {p.nombre}
                    </span>
                    {p.precio > 0 && (
                      <span style={{ fontSize: '0.8rem', color: '#4A5E1A', fontWeight: 600 }}>
                        ${p.precio.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#6B3A1A' }}>
              Tema visual
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="px-4 py-2 rounded-sm text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: theme === t.id ? t.color : '#F2E6C8',
                    color: theme === t.id ? '#F2E6C8' : t.color,
                    border: `2px solid ${t.color}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerarScript}
            disabled={selectedIds.length === 0 || generandoScript}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
          >
            {generandoScript ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generandoScript ? 'Generando guión...' : 'Generar guión con IA'}
            {!generandoScript && <ChevronRight size={14} />}
          </button>
        </div>
      )}

      {/* ── STEP 2: guión + música ── */}
      {step === 2 && (
        <div className="space-y-4">
          <p style={{ fontSize: '0.85rem', color: '#6B3A1A' }}>
            Revisá el guión. Las imágenes de los productos se muestran automáticamente en cada slide.
          </p>

          {/* Slides */}
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className="p-3 rounded-sm"
                style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  {slide.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.imagen}
                      alt=""
                      className="w-10 h-10 object-cover rounded-sm flex-shrink-0"
                      style={{ border: '1px solid #DDD0A8' }}
                    />
                  )}
                  <span className="text-xs font-bold flex-1" style={{ color: '#A0622A' }}>
                    Slide {idx + 1}
                  </span>
                  <button
                    onClick={() => removeSlide(idx)}
                    style={{ color: '#A0622A' }}
                    className="p-1 hover:opacity-70"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  style={inputStyle}
                  value={slide.titulo}
                  onChange={e => updateSlide(idx, { titulo: e.target.value })}
                  placeholder="Título"
                />
                <input
                  style={{ ...inputStyle, marginTop: 6 }}
                  value={slide.subtitulo ?? ''}
                  onChange={e => updateSlide(idx, { subtitulo: e.target.value })}
                  placeholder="Subtítulo (opcional)"
                />
              </div>
            ))}
          </div>

          <button
            onClick={addSlide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm"
            style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
          >
            <Plus size={13} />
            Agregar slide
          </button>

          {/* Música */}
          <div className="pt-2" style={{ borderTop: '1px solid #DDD0A8' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: '#6B3A1A' }}>
                🎵 Música de fondo (Jamendo — CC libre)
              </label>
              <button
                onClick={cargarMusica}
                disabled={loadingMusic}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold disabled:opacity-50 hover:opacity-80"
                style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
              >
                {loadingMusic ? <Loader2 size={11} className="animate-spin" /> : <Music size={11} />}
                {loadingMusic ? 'Cargando...' : tracks.length ? 'Recargar' : 'Buscar música'}
              </button>
            </div>

            {tracks.length > 0 && (
              <div
                className="space-y-1 rounded-sm overflow-hidden"
                style={{ border: '1px solid #DDD0A8', maxHeight: 240, overflowY: 'auto' }}
              >
                {/* Sin música */}
                <div
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  style={{
                    backgroundColor: !selectedTrack ? '#F2E6C8' : '#FDF8EE',
                    borderBottom: '1px solid #EEE0C0',
                  }}
                  onClick={() => setSelectedTrack(null)}
                >
                  <input type="radio" readOnly checked={!selectedTrack} className="accent-amber-700 pointer-events-none" />
                  <span style={{ fontSize: '0.85rem', color: '#6B3A1A' }}>🔇 Sin música (solo ambience)</span>
                </div>

                {tracks.map(track => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    style={{
                      backgroundColor: selectedTrack?.id === track.id ? '#F2E6C8' : '#FDF8EE',
                      borderBottom: '1px solid #EEE0C0',
                    }}
                    onClick={() => setSelectedTrack(track)}
                  >
                    <input type="radio" readOnly checked={selectedTrack?.id === track.id} className="accent-amber-700 pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '0.82rem', color: '#3D1A05', fontWeight: 500 }} className="truncate">
                        {track.nombre}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: '#A0622A' }}>{track.artista} · {Math.round(track.duracion / 60)}:{String(track.duracion % 60).padStart(2, '0')}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); previewTrack(track) }}
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80"
                      style={{ backgroundColor: '#DDD0A8', color: '#3D1A05' }}
                    >
                      {previewingTrack === track.id ? <Square size={10} /> : <Play size={10} />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedTrack && (
              <p className="text-xs mt-1" style={{ color: '#4A5E1A' }}>
                ✓ Seleccionada: <strong>{selectedTrack.nombre}</strong> — {selectedTrack.artista}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm"
              style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
            >
              <ChevronLeft size={13} />
              Volver
            </button>
            <button
              onClick={goToStep3}
              disabled={slides.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
            >
              Vista previa
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: preview + record ── */}
      {step === 3 && (
        <div className="flex flex-col sm:flex-row gap-5">
          <canvas ref={offscreenRef} style={{ display: 'none' }} />

          <div className="flex-shrink-0 mx-auto sm:mx-0" style={{ width: 195 }}>
            <canvas
              ref={previewRef}
              width={390}
              height={780}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 8,
                border: '2px solid #DDD0A8',
                display: 'block',
                backgroundColor: '#3D1A05',
              }}
            />
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            <div style={{ fontSize: '0.85rem', color: '#6B3A1A' }}>
              <strong>{slides.length} slides</strong> · {totalSecs}s en total
              {selectedTrack && (
                <span style={{ color: '#4A5E1A', marginLeft: 8 }}>· 🎵 {selectedTrack.nombre}</span>
              )}
            </div>

            {recording && (
              <div>
                <div className="text-xs mb-1" style={{ color: '#6B3A1A' }}>
                  Grabando… {Math.round(progress * 100)}%
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 6, backgroundColor: '#DDD0A8' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress * 100}%`,
                      backgroundColor: '#C4A040',
                      transition: 'width 0.15s',
                    }}
                  />
                </div>
              </div>
            )}

            {videoBlob && (
              <div
                className="px-3 py-2 rounded-sm text-sm"
                style={{ backgroundColor: '#C8DEC8', color: '#1A3D1A' }}
              >
                Video listo · {(videoBlob.size / 1024 / 1024).toFixed(1)} MB
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!recording && (
                <button
                  onClick={previewing ? stopPreview : startPreview}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ border: '1px solid #DDD0A8', color: '#3D1A05', backgroundColor: '#F2E6C8' }}
                >
                  {previewing ? <Square size={12} /> : <Play size={12} />}
                  {previewing ? 'Detener' : 'Vista previa'}
                </button>
              )}

              {!recording && !videoBlob && (
                <button
                  onClick={handleRecord}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#A0622A', color: '#F2E6C8' }}
                >
                  <Film size={13} />
                  Grabar video
                </button>
              )}

              {videoBlob && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: '#4A5E1A', color: '#F2E6C8' }}
                  >
                    <Download size={13} />
                    Descargar .webm
                  </button>
                  <button
                    onClick={handlePublicarIG}
                    disabled={igStatus === 'uploading' || igStatus === 'sending'}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: igStatus === 'ok' ? '#4A5E1A' : igStatus === 'error' ? '#c62828' : '#E1306C',
                      color: 'white',
                    }}
                  >
                    {igStatus === 'uploading' || igStatus === 'sending'
                      ? <RefreshCw size={13} className="animate-spin" />
                      : igStatus === 'ok' ? <CheckCircle2 size={13} />
                      : igStatus === 'error' ? <AlertCircle size={13} />
                      : <Instagram size={13} />}
                    {igStatus === 'uploading' ? 'Subiendo...'
                      : igStatus === 'sending' ? 'Enviando a Make...'
                      : igStatus === 'ok' ? '¡Enviado!'
                      : igStatus === 'error' ? 'Error'
                      : 'Publicar en Instagram'}
                  </button>
                  <button
                    onClick={() => { setVideoBlob(null); setProgress(0); startPreview() }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm"
                    style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
                  >
                    <RefreshCw size={12} />
                    Volver a grabar
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => { stopPreview(); setStep(2) }}
              className="flex items-center gap-1.5 text-sm"
              style={{ color: '#6B3A1A' }}
            >
              <ChevronLeft size={12} />
              Editar guión
            </button>

            <div
              className="text-xs p-2 rounded-sm"
              style={{ backgroundColor: '#F2E6C8', color: '#6B3A1A', border: '1px solid #DDD0A8' }}
            >
              El video se guarda como .webm. Para convertir a .mp4 usá{' '}
              <strong>cloudconvert.com</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
