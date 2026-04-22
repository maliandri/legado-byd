'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Loader2, Sparkles, Pencil, Trash2, Plus, Camera } from 'lucide-react'
import { createProducto, updateProducto } from '@/lib/firebase/firestore'
import type { Producto, Categoria } from '@/types'

interface Props {
  producto?: Producto
  categorias: Categoria[]
  onClose: () => void
  onSaved: () => void
}

async function uploadViaApi(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(`Cloudinary ${data.http_code || res.status}: ${data.error || data.details}`)
  return data.url
}

export default function ProductForm({ producto, categorias, onClose, onSaved }: Props) {
  const isEdit = !!producto

  // Inicializar array de fotos desde el producto existente
  const initialFotos = (): string[] => {
    if (!producto) return []
    if (producto.imagenes && producto.imagenes.length > 0) return producto.imagenes
    if (producto.imagen) return [producto.imagen]
    return []
  }

  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio: producto?.precio?.toString() || '',
    categoria: producto?.categoria || categorias[0]?.slug || 'panaderia',
    stock: typeof producto?.stock === 'boolean' ? (producto.stock ? '1' : '0') : (producto?.stock?.toString() ?? '0'),
    subfamilia: producto?.subfamilia || '',
    marca: producto?.marca || '',
    iva: producto?.iva?.toString() || '',
    costo: producto?.costo?.toString() || '',
  })

  // Fotos: array de URLs confirmadas + archivos pendientes de upload
  const [fotos, setFotos] = useState<string[]>(initialFotos)
  // Archivos pendientes: índice → File (para fotos nuevas no subidas aún)
  const [pendingFiles, setPendingFiles] = useState<Map<number, File>>(new Map())
  // Índice que se está editando (para reemplazar foto específica)
  const editingIndexRef = useRef<number | null>(null)

  const [saving, setSaving] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (f) addNewFile(f)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [fotos, pendingFiles])

  function addNewFile(f: File) {
    const preview = URL.createObjectURL(f)
    const newIndex = fotos.length
    setFotos(prev => [...prev, preview])
    setPendingFiles(prev => new Map(prev).set(newIndex, f))
  }

  function replaceFile(index: number, f: File) {
    const preview = URL.createObjectURL(f)
    setFotos(prev => prev.map((u, i) => i === index ? preview : u))
    setPendingFiles(prev => new Map(prev).set(index, f))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (editingIndexRef.current !== null) {
      replaceFile(editingIndexRef.current, f)
      editingIndexRef.current = null
    } else {
      addNewFile(f)
    }
    e.target.value = ''
  }

  function openPickerForEdit(index: number, useCamera: boolean) {
    editingIndexRef.current = index
    if (useCamera) cameraRef.current?.click()
    else fileRef.current?.click()
  }

  function openPickerForAdd(useCamera: boolean) {
    editingIndexRef.current = null
    if (useCamera) cameraRef.current?.click()
    else fileRef.current?.click()
  }

  function deleteFoto(index: number) {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPendingFiles(prev => {
      const next = new Map<number, File>()
      prev.forEach((file, i) => {
        if (i < index) next.set(i, file)
        else if (i > index) next.set(i - 1, file)
      })
      return next
    })
  }

  async function handleGenerarDescripcion() {
    if (!form.nombre.trim()) { setError('Ingresá un nombre antes de generar la descripción.'); return }
    setError('')
    setGenerando(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, categoria: form.categoria }),
      })
      const data = await res.json()
      if (data.descripcion) setForm(f => ({ ...f, descripcion: data.descripcion }))
      else setError(`Gemini error: ${data.error || 'Sin respuesta'}`)
    } catch {
      setError('Error al conectar con Gemini.')
    } finally {
      setGenerando(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim()) return setError('El nombre es requerido.')
    if (!form.precio || isNaN(Number(form.precio))) return setError('El precio debe ser un número válido.')

    setSaving(true)
    try {
      // Subir fotos pendientes
      const fotosFinales: string[] = [...fotos]
      for (const [index, file] of pendingFiles.entries()) {
        const url = await uploadViaApi(file)
        fotosFinales[index] = url
      }

      const data = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        categoria: form.categoria,
        stock: Number(form.stock),
        imagen: fotosFinales[0] || '',
        imagenes: fotosFinales.length > 0 ? fotosFinales : undefined,
        subfamilia: form.subfamilia.trim() || undefined,
        marca: form.marca.trim() || undefined,
        iva: form.iva ? Number(form.iva) : undefined,
        costo: form.costo ? Number(form.costo) : undefined,
      }

      if (isEdit && producto) {
        await updateProducto(producto.id, data)
      } else {
        await createProducto(data)
      }

      await new Promise((r) => setTimeout(r, 800))
      onSaved()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Hubo un error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #DDD0A8',
    borderRadius: '2px', backgroundColor: '#FDF8EE', color: '#3D1A05',
    fontSize: '0.9rem', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600 as const,
    color: '#6B3A1A', marginBottom: '4px',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(61,26,5,0.6)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm" style={{ backgroundColor: '#FDF8EE', border: '2px solid #C4A040' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #DDD0A8', backgroundColor: '#F2E6C8' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.25rem', fontWeight: 700 }}>
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} style={{ color: '#6B3A1A' }} className="hover:opacity-70"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-sm text-sm" style={{ backgroundColor: '#F5CAAA', color: '#6B3A1A', border: '1px solid #E8C49A' }}>
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Harina 000" required />
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Descripción</label>
              <button type="button" onClick={handleGenerarDescripcion} disabled={generando}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}>
                {generando ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {generando ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del producto..." />
          </div>

          {/* Precio y Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Precio (ARS) *</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.precio}
                onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" required />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select style={inputStyle} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {categorias.map(cat => <option key={cat.slug} value={cat.slug}>{cat.emoji} {cat.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label style={labelStyle}>Stock (unidades)</label>
            <input style={inputStyle} type="number" min="0" step="1" value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
          </div>

          {/* Marca y Subfamilia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Marca</label>
              <input style={inputStyle} value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Pureza" />
            </div>
            <div>
              <label style={labelStyle}>Sub Familia</label>
              <input style={inputStyle} value={form.subfamilia} onChange={e => setForm({ ...form, subfamilia: e.target.value })} placeholder="Ej: Harinas" />
            </div>
          </div>

          {/* Costo e IVA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Costo (ARS)</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.costo}
                onChange={e => setForm({ ...form, costo: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>IVA (%)</label>
              <select style={inputStyle} value={form.iva} onChange={e => setForm({ ...form, iva: e.target.value })}>
                <option value="">Sin especificar</option>
                <option value="10.5">10.5%</option>
                <option value="21">21%</option>
              </select>
            </div>
          </div>

          {/* ── FOTOS ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={labelStyle}>Fotos ({fotos.length})</label>
              {fotos.length > 0 && (
                <span style={{ fontSize: '0.7rem', color: '#A0622A' }}>La primera es la foto principal</span>
              )}
            </div>

            {/* Galería de fotos actuales */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {fotos.map((url, index) => (
                  <div key={index} className="relative group rounded-sm overflow-hidden"
                    style={{ aspectRatio: '1/1', border: index === 0 ? '2px solid #C4A040' : '1px solid #DDD0A8', backgroundColor: '#F2E6C8' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-contain p-1" />

                    {/* Badge principal */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-sm text-xs font-bold"
                        style={{ backgroundColor: '#C4A040', color: '#3D1A05', fontSize: '0.6rem' }}>
                        PRINCIPAL
                      </div>
                    )}

                    {/* Botones de acción — visibles siempre en mobile, hover en desktop */}
                    <div className="absolute inset-0 flex items-end justify-center gap-1.5 p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      style={{ background: 'linear-gradient(to top, rgba(61,26,5,0.7) 0%, transparent 50%)' }}>
                      {/* Editar con cámara */}
                      <button type="button" title="Editar con cámara"
                        onClick={() => openPickerForEdit(index, true)}
                        className="w-7 h-7 rounded-sm flex items-center justify-center hover:opacity-80"
                        style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}>
                        <Camera size={12} />
                      </button>
                      {/* Editar con galería */}
                      <button type="button" title="Reemplazar desde galería"
                        onClick={() => openPickerForEdit(index, false)}
                        className="w-7 h-7 rounded-sm flex items-center justify-center hover:opacity-80"
                        style={{ backgroundColor: '#F2E6C8', color: '#3D1A05' }}>
                        <Pencil size={12} />
                      </button>
                      {/* Eliminar */}
                      <button type="button" title="Eliminar foto"
                        onClick={() => deleteFoto(index)}
                        className="w-7 h-7 rounded-sm flex items-center justify-center hover:opacity-80"
                        style={{ backgroundColor: '#C0392B', color: '#fff' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Botón agregar foto */}
                {fotos.length < 8 && (
                  <div className="grid grid-cols-1 gap-1" style={{ aspectRatio: '1/1' }}>
                    <button type="button" onClick={() => openPickerForAdd(false)}
                      className="flex flex-col items-center justify-center gap-1 rounded-sm hover:opacity-80 transition-opacity"
                      style={{ border: '2px dashed #DDD0A8', backgroundColor: '#F2E6C8', color: '#6B3A1A' }}>
                      <Plus size={18} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Galería</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Si no hay fotos: botones grandes iniciales */}
            {fotos.length === 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openPickerForAdd(true)}
                  className="flex items-center justify-center gap-2 py-4 rounded-sm text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ border: '2px solid #C4A040', backgroundColor: '#F2E6C8', color: '#3D1A05' }}>
                  <span style={{ fontSize: '1.2rem' }}>📷</span>
                  Cámara
                </button>
                <button type="button" onClick={() => openPickerForAdd(false)}
                  className="flex items-center justify-center gap-2 py-4 rounded-sm text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ border: '2px dashed #DDD0A8', backgroundColor: '#F2E6C8', color: '#6B3A1A' }}>
                  <Upload size={16} />
                  Galería
                </button>
              </div>
            )}

            {/* Si ya hay fotos: botones pequeños debajo */}
            {fotos.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={() => openPickerForAdd(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ border: '1px solid #C4A040', backgroundColor: '#F2E6C8', color: '#3D1A05' }}>
                  <Camera size={12} /> Cámara
                </button>
                <button type="button" onClick={() => openPickerForAdd(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ border: '1px dashed #DDD0A8', backgroundColor: '#F2E6C8', color: '#6B3A1A' }}>
                  <Upload size={12} /> Galería
                </button>
              </div>
            )}
          </div>

          {/* Inputs file ocultos */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />

          {/* Botones guardar/cancelar */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-sm text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ border: '1px solid #DDD0A8', color: '#6B3A1A', backgroundColor: 'transparent' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
