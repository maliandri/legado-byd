'use client'

import { useState, useRef } from 'react'
import { Upload, X, Sparkles, Copy, MessageCircle, RefreshCw } from 'lucide-react'

interface ImageItem {
  file: File
  preview: string
  cloudUrl?: string
}

export default function PublicacionLibre() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [caption, setCaption] = useState('')
  const [tema, setTema] = useState('')
  const [generando, setGenerando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #DDD0A8',
    borderRadius: '2px',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  } as const

  function handleFiles(files: FileList | null) {
    if (!files) return
    const toAdd = Array.from(files).slice(0, 4 - images.length)
    setImages(prev => [
      ...prev,
      ...toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) })),
    ].slice(0, 4))
  }

  function removeImage(idx: number) {
    setImages(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[idx].preview)
      next.splice(idx, 1)
      return next
    })
  }

  async function uploadAll(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (img.cloudUrl) { urls.push(img.cloudUrl); continue }
      const fd = new FormData()
      fd.append('file', img.file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      const url: string = data.secure_url || data.url
      urls.push(url)
      setImages(prev => prev.map((im, j) => j === i ? { ...im, cloudUrl: url } : im))
    }
    return urls
  }

  async function handleGenerar() {
    if (images.length === 0) { flash('Agregá al menos una imagen primero', true); return }
    setGenerando(true)
    try {
      const nombres = images.map(i =>
        i.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      )
      const res = await fetch('/api/admin/generar-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productos: nombres.map(n => ({ nombre: n })),
          tema: tema || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setCaption(data.caption)
    } catch (err: any) {
      flash(`Error: ${err.message}`, true)
    } finally {
      setGenerando(false)
    }
  }

  function handleCopy() {
    if (!caption) return
    navigator.clipboard.writeText(caption)
    flash('Copiado al portapapeles')
  }

  async function handleWhatsApp() {
    if (!caption) return
    setUploading(true)
    try {
      const urls = await uploadAll()
      const text = encodeURIComponent(
        caption + (urls.length ? '\n\n' + urls.join('\n') : '')
      )
      window.open(`https://wa.me/?text=${text}`, '_blank')
    } catch (err: any) {
      flash(`Error: ${err.message}`, true)
    } finally {
      setUploading(false)
    }
  }

  function flash(text: string, error = false) {
    setMsg(error ? `error:${text}` : text)
    setTimeout(() => setMsg(''), 4000)
  }

  const isError = msg.startsWith('error:')
  const msgText = isError ? msg.slice(6) : msg

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#3D1A05',
            fontSize: '1.3rem',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Publicación Libre
        </h2>
        <p style={{ color: '#6B3A1A', fontSize: '0.85rem' }}>
          Subí hasta 4 imágenes y generá un caption con IA para compartir en redes.
        </p>
      </div>

      {msg && (
        <div
          className="px-3 py-2 rounded-sm text-sm"
          style={{ backgroundColor: isError ? '#F5CAAA' : '#C8DEC8', color: '#3D1A05' }}
        >
          {msgText}
        </div>
      )}

      {/* Dropzone */}
      <div
        className="border-2 border-dashed rounded-sm p-6 text-center cursor-pointer"
        style={{
          borderColor: '#C4A040',
          backgroundColor: images.length >= 4 ? '#F2E6C8' : '#FDF8EE',
          opacity: images.length >= 4 ? 0.6 : 1,
        }}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => images.length < 4 && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <Upload size={24} style={{ color: '#C4A040', margin: '0 auto 8px' }} />
        <p style={{ color: '#6B3A1A', fontSize: '0.9rem' }}>
          {images.length >= 4
            ? 'Máximo 4 imágenes alcanzado'
            : 'Arrastrá o hacé click para agregar imágenes'}
        </p>
        <p style={{ color: '#A0622A', fontSize: '0.75rem', marginTop: 4 }}>
          {images.length}/4 imágenes
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 2)}, 1fr)` }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative rounded-sm overflow-hidden"
              style={{ aspectRatio: '1', backgroundColor: '#DDD0A8' }}
            >
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              {img.cloudUrl && (
                <div
                  className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded-sm"
                  style={{ backgroundColor: 'rgba(74,94,26,0.85)', color: 'white' }}
                >
                  ✓
                </div>
              )}
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 rounded-full p-1"
                style={{ backgroundColor: 'rgba(61,26,5,0.8)', color: 'white' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tema opcional */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
          Tema / contexto (opcional)
        </label>
        <input
          style={inputStyle}
          value={tema}
          onChange={e => setTema(e.target.value)}
          placeholder="Ej: nuevos productos, oferta de temporada, tips para panaderos..."
        />
      </div>

      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold" style={{ color: '#6B3A1A' }}>
            Caption
          </label>
          <button
            onClick={handleGenerar}
            disabled={generando || images.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
          >
            {generando ? (
              <RefreshCw size={11} className="animate-spin" />
            ) : (
              <Sparkles size={11} />
            )}
            {generando ? 'Generando...' : 'Generar con IA'}
          </button>
        </div>
        <textarea
          style={{
            ...inputStyle,
            minHeight: 148,
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: '1.55',
          }}
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Escribí o generá un caption con IA..."
        />
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          disabled={!caption}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity"
          style={{ border: '1px solid #C4A040', color: '#3D1A05', backgroundColor: '#F2E6C8' }}
        >
          <Copy size={13} />
          Copiar texto
        </button>
        <button
          onClick={handleWhatsApp}
          disabled={!caption || uploading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#25D366', color: 'white' }}
        >
          {uploading ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <MessageCircle size={13} />
          )}
          {uploading ? 'Subiendo imágenes...' : 'Compartir por WhatsApp'}
        </button>
      </div>
    </div>
  )
}
