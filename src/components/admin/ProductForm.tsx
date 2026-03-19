'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Loader2, Sparkles } from 'lucide-react'
import { createProducto, updateProducto } from '@/lib/firebase/firestore'
import type { Producto, Categoria } from '@/types'

interface Props {
  producto?: Producto
  categorias: Categoria[]
  onClose: () => void
  onSaved: () => void
}

const defaultForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: 'panaderia',
  stock: '0',
  imagen: '',
}

async function uploadViaApi(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Error al subir imagen a Cloudinary')
  const { url } = await res.json()
  return url
}

export default function ProductForm({ producto, categorias, onClose, onSaved }: Props) {
  const isEdit = !!producto

  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio: producto?.precio?.toString() || '',
    categoria: producto?.categoria || categorias[0]?.slug || 'panaderia',
    stock: typeof producto?.stock === 'boolean' ? (producto.stock ? '1' : '0') : (producto?.stock?.toString() ?? '0'),
    imagen: producto?.imagen || '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(producto?.imagen || '')
  const [saving, setSaving] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function applyFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) applyFile(f)
  }

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (f) applyFile(f)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

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
      else setError('No se pudo generar la descripción.')
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
      const data = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        categoria: form.categoria,
        stock: Number(form.stock),
        imagen: form.imagen,
      }

      if (isEdit && producto) {
        let imagenUrl = form.imagen
        if (file) {
          imagenUrl = await uploadViaApi(file)
        }
        await updateProducto(producto.id, { ...data, imagen: imagenUrl })
      } else {
        const id = await createProducto({ ...data, imagen: '' })
        if (file) {
          const imagenUrl = await uploadViaApi(file)
          await updateProducto(id, { imagen: imagenUrl })
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Hubo un error al guardar el producto. Revisá los permisos de Firebase.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #DDD0A8',
    borderRadius: '2px',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontSize: '0.9rem',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600 as const,
    color: '#6B3A1A',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(61,26,5,0.6)' }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm"
        style={{ backgroundColor: '#FDF8EE', border: '2px solid #C4A040' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #DDD0A8', backgroundColor: '#F2E6C8' }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#3D1A05',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} style={{ color: '#6B3A1A' }} className="hover:opacity-70">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div
              className="px-4 py-3 rounded-sm text-sm"
              style={{ backgroundColor: '#F5CAAA', color: '#6B3A1A', border: '1px solid #E8C49A' }}
            >
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input
              style={inputStyle}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Harina 000"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Descripción</label>
              <button
                type="button"
                onClick={handleGenerarDescripcion}
                disabled={generando}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
              >
                {generando ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {generando ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Precio y Categoría en row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Precio (ARS) *</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select
                style={inputStyle}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {categorias.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.emoji} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label style={labelStyle}>Stock (unidades)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="0"
            />
          </div>

          {/* Imagen */}
          <div>
            <label style={labelStyle}>Imagen</label>
            <div
              className="flex flex-col items-center gap-3 p-4 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
              style={{ border: '2px dashed #DDD0A8', backgroundColor: '#F2E6C8' }}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="max-h-32 object-contain rounded" />
              ) : (
                <>
                  <Upload size={24} style={{ color: '#A0622A' }} />
                  <span style={{ color: '#6B3A1A', fontSize: '0.85rem' }}>
                    Clic para subir, foto de cámara o pegá Ctrl+V
                  </span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-sm text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ border: '1px solid #DDD0A8', color: '#6B3A1A', backgroundColor: 'transparent' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
