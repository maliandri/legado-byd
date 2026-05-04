'use client'

import { useState, useRef } from 'react'
import { Upload, X, Sparkles, Copy, MessageCircle, RefreshCw, Search, Package, Loader2, Instagram, CheckCircle2, AlertCircle } from 'lucide-react'

interface ImageItem {
  file?: File
  preview: string
  cloudUrl?: string
  nombre?: string
}

interface ProductoBasico {
  id: string
  nombre: string
  precio: number
  imagen?: string
}

export default function PublicacionLibre() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [caption, setCaption] = useState('')
  const [tema, setTema] = useState('')
  const [generando, setGenerando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [igStatus, setIgStatus] = useState<'idle' | 'uploading' | 'sending' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  // Buscador de productos
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ProductoBasico[]>([])
  const [buscando, setBuscando] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoBasico | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function buscarProductos(q: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setResultados([]); setBuscando(false); return }
    setBuscando(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/buscar-productos?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        setResultados(Array.isArray(data) ? data : [])
      } catch {}
      finally { setBuscando(false) }
    }, 300)
  }

  function handleSelectProducto(p: ProductoBasico) {
    setProductoSeleccionado(p)
    setQuery('')
    setResultados([])
    if (p.imagen) {
      setImages(prev => {
        // Reemplazar o insertar como primera imagen
        const rest = prev.filter(i => i.nombre !== productoSeleccionado?.nombre)
        return [{ preview: p.imagen!, cloudUrl: p.imagen, nombre: p.nombre }, ...rest].slice(0, 4)
      })
    }
  }

  function clearProducto() {
    setImages(prev => prev.filter(i => i.nombre !== productoSeleccionado?.nombre))
    setProductoSeleccionado(null)
  }

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
      const removed = next[idx]
      if (removed.file) URL.revokeObjectURL(removed.preview)
      if (removed.nombre && removed.nombre === productoSeleccionado?.nombre) {
        setProductoSeleccionado(null)
      }
      next.splice(idx, 1)
      return next
    })
  }

  async function uploadAll(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (img.cloudUrl) { urls.push(img.cloudUrl); continue }
      if (!img.file) continue
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
    if (images.length === 0 && !productoSeleccionado) {
      flash('Seleccioná un producto o agregá una imagen primero', true); return
    }
    setGenerando(true)
    try {
      const productos = productoSeleccionado
        ? [{ nombre: productoSeleccionado.nombre, precio: productoSeleccionado.precio }]
        : images.map(i => ({ nombre: i.nombre || i.file?.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || 'producto' }))

      const res = await fetch('/api/admin/generar-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productos, tema: tema || undefined }),
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

  async function handlePublicarIG() {
    if (!caption) { flash('Escribí o generá un caption primero', true); return }
    setIgStatus('uploading')
    try {
      // Subir primera imagen si no está en la nube todavía
      let imageUrl: string | null = null
      const first = images[0]
      if (first) {
        if (first.cloudUrl) {
          imageUrl = first.cloudUrl
        } else if (first.file) {
          const fd = new FormData()
          fd.append('file', first.file)
          const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
          const upData = await upRes.json()
          if (!upRes.ok) throw new Error(upData.error || 'Error al subir imagen')
          imageUrl = upData.secure_url || upData.url
          setImages(prev => prev.map((im, j) => j === 0 ? { ...im, cloudUrl: imageUrl! } : im))
        }
      }
      setIgStatus('sending')
      const res = await fetch('/api/instagram/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrl, type: 'post' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setIgStatus('ok')
      setTimeout(() => setIgStatus('idle'), 4000)
    } catch (err: any) {
      flash(`Error: ${err.message}`, true)
      setIgStatus('error')
      setTimeout(() => setIgStatus('idle'), 4000)
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
      // Solo sube la primera imagen
      const firstImage = images[0]
      let url = ''
      if (firstImage) {
        if (firstImage.cloudUrl) {
          url = firstImage.cloudUrl
        } else if (firstImage.file) {
          const fd = new FormData()
          fd.append('file', firstImage.file)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
          url = data.secure_url || data.url
          setImages(prev => prev.map((im, j) => j === 0 ? { ...im, cloudUrl: url } : im))
        }
      }
      const text = encodeURIComponent(caption + (url ? '\n\n' + url : ''))
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
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>
          Publicación Libre
        </h2>
        <p style={{ color: '#6B3A1A', fontSize: '0.85rem' }}>
          Buscá un producto o subí imágenes y generá un caption con IA para compartir en redes.
        </p>
      </div>

      {msg && (
        <div className="px-3 py-2 rounded-sm text-sm"
          style={{ backgroundColor: isError ? '#F5CAAA' : '#C8DEC8', color: '#3D1A05' }}>
          {msgText}
        </div>
      )}

      {/* Buscador de productos */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
          Buscar producto del catálogo (opcional)
        </label>
        {productoSeleccionado ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-sm"
            style={{ backgroundColor: '#F2E6C8', border: '1px solid #C4A040' }}>
            {productoSeleccionado.imagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productoSeleccionado.imagen} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p style={{ color: '#3D1A05', fontWeight: 600, fontSize: '0.875rem' }} className="truncate">
                {productoSeleccionado.nombre}
              </p>
              <p style={{ color: '#A0622A', fontSize: '0.75rem' }}>
                ${productoSeleccionado.precio.toLocaleString('es-AR')}
              </p>
            </div>
            <button onClick={clearProducto} style={{ color: '#A0622A' }} className="hover:opacity-70 flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2" style={{ ...inputStyle, padding: '8px 12px' }}>
              <Search size={15} style={{ color: '#A0622A', flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); buscarProductos(e.target.value) }}
                placeholder="Escribí el nombre del producto..."
                className="flex-1 bg-transparent outline-none"
                style={{ color: '#3D1A05', fontSize: '0.9rem' }}
              />
              {buscando && <Loader2 size={14} className="animate-spin" style={{ color: '#A0622A' }} />}
            </div>
            {resultados.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-sm shadow-lg z-20 overflow-hidden"
                style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8', maxHeight: 220, overflowY: 'auto' }}>
                {resultados.map(p => (
                  <button key={p.id} onClick={() => handleSelectProducto(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50 transition-colors">
                    {p.imagen
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imagen} alt={p.nombre} className="w-9 h-9 object-cover rounded-sm flex-shrink-0" />
                      : <Package size={28} style={{ color: '#DDD0A8', flexShrink: 0 }} />}
                    <div className="min-w-0">
                      <p style={{ color: '#3D1A05', fontSize: '0.85rem', fontWeight: 500 }} className="truncate">{p.nombre}</p>
                      <p style={{ color: '#A0622A', fontSize: '0.75rem' }}>${p.precio.toLocaleString('es-AR')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
        <div className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(images.length, 2)}, 1fr)` }}>
          {images.map((img, idx) => (
            <div key={idx} className="relative rounded-sm overflow-hidden"
              style={{ aspectRatio: '1', backgroundColor: '#DDD0A8' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded-sm"
                  style={{ backgroundColor: 'rgba(61,26,5,0.75)', color: '#C4A040', fontSize: '0.6rem', fontWeight: 700 }}>
                  PRINCIPAL
                </div>
              )}
              {img.cloudUrl && img.nombre && (
                <div className="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded-sm"
                  style={{ backgroundColor: 'rgba(74,94,26,0.85)', color: 'white', fontSize: '0.6rem' }}>
                  📦 producto
                </div>
              )}
              <button onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 rounded-full p-1"
                style={{ backgroundColor: 'rgba(61,26,5,0.8)', color: 'white' }}>
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
          <label className="text-xs font-semibold" style={{ color: '#6B3A1A' }}>Caption</label>
          <button
            onClick={handleGenerar}
            disabled={generando || (images.length === 0 && !productoSeleccionado)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
          >
            {generando ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {generando ? 'Generando...' : 'Generar con IA'}
          </button>
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: 148, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.55' }}
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
          {uploading ? <RefreshCw size={13} className="animate-spin" /> : <MessageCircle size={13} />}
          {uploading ? 'Preparando...' : 'Compartir por WhatsApp'}
        </button>
        <button
          onClick={handlePublicarIG}
          disabled={!caption || igStatus === 'uploading' || igStatus === 'sending'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity"
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
          {igStatus === 'uploading' ? 'Subiendo imagen...'
            : igStatus === 'sending' ? 'Enviando...'
            : igStatus === 'ok' ? '¡Enviado!'
            : igStatus === 'error' ? 'Error'
            : 'Publicar en Instagram'}
        </button>
      </div>
    </div>
  )
}
