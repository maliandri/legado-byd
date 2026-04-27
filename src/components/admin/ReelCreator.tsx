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
} from 'lucide-react'
import { getProductos } from '@/lib/firebase/firestore'
import type { Producto } from '@/types'
import { LegadoReelService, type ReelSlide } from '@/utils/legadoReelService'

type Step = 1 | 2 | 3

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
  const filtered = productos.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  function toggleProduct(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
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
      setSlides(data.slides ?? [])
      setStep(2)
    } catch (err: any) {
      flash(`Error: ${err.message}`)
    } finally {
      setGenerandoScript(false)
    }
  }

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
    if (!offscreenRef.current || !previewRef.current || slides.length === 0) return null
    svcRef.current?.stop()
    const svc = new LegadoReelService(offscreenRef.current, slides, theme)
    svcRef.current = svc
    return svc
  }, [slides, theme])

  function startPreview() {
    const svc = initSvc()
    if (!svc || !previewRef.current) return
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
    // Start preview after canvas mounts
    setTimeout(() => startPreview(), 80)
  }

  function handleRecord() {
    stopPreview()
    setRecording(true)
    setProgress(0)
    setVideoBlob(null)

    const svc = initSvc()
    if (!svc || !previewRef.current) { setRecording(false); return }

    svc.record(
      previewRef.current,
      pct => setProgress(pct),
      blob => {
        setVideoBlob(blob)
        setRecording(false)
      },
    )
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

  // Clean up on unmount
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
          {step === 1 ? 'Elegí productos' : step === 2 ? 'Revisá el guión' : 'Grabá el reel'}
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

      {/* ── STEP 2: editar guión ── */}
      {step === 2 && (
        <div className="space-y-4">
          <p style={{ fontSize: '0.85rem', color: '#6B3A1A' }}>
            Revisá y editá el guión. Cada bloque es una diapositiva animada.
          </p>

          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className="p-3 rounded-sm"
                style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: '#A0622A' }}>
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
          {/* Canvas offscreen (hidden) */}
          <canvas ref={offscreenRef} style={{ display: 'none' }} />

          {/* Preview */}
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

          {/* Controls */}
          <div className="flex-1 space-y-3 min-w-0">
            <div style={{ fontSize: '0.85rem', color: '#6B3A1A' }}>
              <strong>{slides.length} slides</strong> · {totalSecs}s en total
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
                    onClick={() => {
                      setVideoBlob(null)
                      setProgress(0)
                      startPreview()
                    }}
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
              El video se guarda como .webm (compatible con WhatsApp, Instagram y la mayoría de
              los reproductores). Para convertir a .mp4 podés usar{' '}
              <strong>cloudconvert.com</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
