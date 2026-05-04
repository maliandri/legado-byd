'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Loader2, ImagePlus, X, Search, Package } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import type { Post, Producto } from '@/types'

export default function SocialAdmin() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/posts')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadPosts() }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este post?')) return
    try {
      await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch {}
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700 }}>
            Legado Social
          </h2>
          <p style={{ color: '#A0622A', fontSize: '0.85rem', marginTop: 4 }}>
            Posts que aparecen en el feed del sitio. Los clientes registrados pueden comentar.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-semibold text-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#4A5E1A', color: '#fff' }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nuevo post'}
        </button>
      </div>

      {showForm && (
        <PostForm
          user={user}
          onCreated={(post) => { setPosts(prev => [post, ...prev]); setShowForm(false) }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: '#C4A040' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#A0622A' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>Sin posts todavía</p>
          <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Creá el primer post con el botón de arriba.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <AdminPostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Form ─────────────────────────────────────────────────────────────────────

function PostForm({ user, onCreated }: { user: any; onCreated: (p: Post) => void }) {
  const [tipo, setTipo] = useState<'producto' | 'libre'>('libre')
  const [contenido, setContenido] = useState('')
  const [imagen, setImagen] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  function handleQueryChange(v: string) {
    setQuery(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!v.trim()) { setResultados([]); return }
    setBuscando(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/buscar-productos?q=${encodeURIComponent(v)}`)
        const data = await res.json()
        setResultados(Array.isArray(data) ? data : [])
      } catch {}
      finally { setBuscando(false) }
    }, 350)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setImagen(data.url)
    } catch {}
    finally { setUploadingImg(false) }
  }

  async function handleSubmit() {
    if (!contenido.trim()) { setMsg('Escribí el contenido del post'); return }
    if (tipo === 'producto' && !producto) { setMsg('Seleccioná un producto'); return }
    setSaving(true)
    setMsg('')
    try {
      const body: Record<string, any> = {
        tipo,
        contenido,
        autorId: user?.uid || 'admin',
        autorNombre: user?.displayName || user?.email || 'Admin',
      }
      if (tipo === 'producto' && producto) {
        body.productoId = producto.id
        body.productoNombre = producto.nombre
        body.productoImagen = producto.imagen
        body.productoPrecio = producto.precio
      } else {
        body.imagen = imagen
      }
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCreated({ ...body, id: data.id, createdAt: new Date(), comentariosCount: 0 } as Post)
    } catch (err: any) {
      setMsg(`✗ ${err.message}`)
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 4,
    border: '1.5px solid #DDD0A8', backgroundColor: '#FDF8EE',
    color: '#3D1A05', fontSize: '0.9rem', outline: 'none',
  }

  return (
    <div className="mb-6 p-5 rounded-sm" style={{ backgroundColor: '#F2E6C8', border: '1.5px solid #DDD0A8' }}>
      {/* Tipo selector */}
      <div className="flex gap-3 mb-4">
        {(['libre', 'producto'] as const).map(t => (
          <button key={t} onClick={() => { setTipo(t); setProducto(null); setQuery(''); setResultados([]) }}
            className="px-4 py-2 rounded-sm text-sm font-semibold transition-all"
            style={{
              backgroundColor: tipo === t ? '#3D1A05' : '#FDF8EE',
              color: tipo === t ? '#C4A040' : '#3D1A05',
              border: '1.5px solid #DDD0A8',
            }}>
            {t === 'libre' ? '✏️ Post libre' : '📦 Producto'}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <textarea
        value={contenido}
        onChange={e => setContenido(e.target.value)}
        placeholder={tipo === 'producto'
          ? 'Contá algo sobre este producto, novedades, usos, consejos...'
          : 'Escribí tu post — novedades, eventos, recetas, tips...'}
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        className="mb-4"
      />

      {/* Imagen o producto */}
      {tipo === 'libre' ? (
        <div className="mb-4">
          {imagen ? (
            <div className="relative inline-block">
              <Image src={imagen} alt="preview" width={180} height={120}
                className="rounded-sm object-cover" style={{ maxHeight: 120 }} />
              <button onClick={() => setImagen('')}
                className="absolute top-1 right-1 rounded-full p-0.5"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              disabled={uploadingImg}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-opacity hover:opacity-70"
              style={{ border: '1.5px dashed #C4A040', color: '#A0622A', backgroundColor: '#FDF8EE' }}>
              {uploadingImg ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              {uploadingImg ? 'Subiendo...' : 'Agregar imagen (opcional)'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      ) : (
        <div className="mb-4">
          {producto ? (
            <div className="flex items-center gap-3 p-3 rounded-sm" style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}>
              {producto.imagen && (
                <Image src={producto.imagen} alt={producto.nombre} width={48} height={48}
                  className="rounded-sm object-cover" style={{ width: 48, height: 48 }} />
              )}
              <div className="flex-1">
                <p style={{ color: '#3D1A05', fontWeight: 600, fontSize: '0.9rem' }}>{producto.nombre}</p>
                <p style={{ color: '#A0622A', fontSize: '0.8rem' }}>${producto.precio.toLocaleString('es-AR')}</p>
              </div>
              <button onClick={() => { setProducto(null); setQuery(''); setResultados([]) }}
                style={{ color: '#A0622A' }}><X size={16} /></button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2" style={{ ...inputStyle, padding: '10px 12px' }}>
                <Search size={15} style={{ color: '#A0622A', flexShrink: 0 }} />
                <input value={query} onChange={e => handleQueryChange(e.target.value)}
                  placeholder="Buscar producto..." className="flex-1 bg-transparent outline-none"
                  style={{ color: '#3D1A05', fontSize: '0.9rem' }} />
                {buscando && <Loader2 size={14} className="animate-spin" style={{ color: '#A0622A' }} />}
              </div>
              {resultados.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-sm shadow-lg z-20 overflow-hidden"
                  style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8', maxHeight: 200, overflowY: 'auto' }}>
                  {resultados.map(p => (
                    <button key={p.id} onClick={() => { setProducto(p); setResultados([]) }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50 transition-colors">
                      {p.imagen
                        ? <Image src={p.imagen} alt={p.nombre} width={32} height={32} className="rounded-sm object-cover" style={{ width: 32, height: 32 }} />
                        : <Package size={28} style={{ color: '#DDD0A8' }} />}
                      <div>
                        <p style={{ color: '#3D1A05', fontSize: '0.85rem', fontWeight: 500 }}>{p.nombre}</p>
                        <p style={{ color: '#A0622A', fontSize: '0.75rem' }}>${p.precio.toLocaleString('es-AR')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {msg && (
        <p className="mb-3 text-sm" style={{ color: '#c62828' }}>{msg}</p>
      )}

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-sm font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: '#3D1A05', color: '#C4A040' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Publicar
        </button>
      </div>
    </div>
  )
}

// ── Admin post card ────────────────────────────────────────────────────────

function AdminPostCard({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const fecha = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="p-4 rounded-sm" style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: post.tipo === 'producto' ? '#EFF6E0' : '#FEF3C7', color: post.tipo === 'producto' ? '#4A5E1A' : '#92400E' }}>
              {post.tipo === 'producto' ? '📦 Producto' : '✏️ Libre'}
            </span>
            <span style={{ color: '#A0622A', fontSize: '0.75rem' }}>{fecha}</span>
            <span style={{ color: '#A0622A', fontSize: '0.75rem' }}>· {post.comentariosCount || 0} comentarios</span>
          </div>
          <p style={{ color: '#3D1A05', fontSize: '0.9rem', lineHeight: 1.5 }} className="line-clamp-2">{post.contenido}</p>
          {post.tipo === 'producto' && post.productoNombre && (
            <p style={{ color: '#4A5E1A', fontSize: '0.8rem', marginTop: 4 }}>📦 {post.productoNombre}</p>
          )}
        </div>
        {(post.productoImagen || post.imagen) && (
          <Image src={post.productoImagen || post.imagen!} alt="" width={64} height={64}
            className="rounded-sm object-cover flex-shrink-0" style={{ width: 64, height: 64 }} />
        )}
        <button onClick={() => onDelete(post.id)}
          className="flex-shrink-0 p-1.5 rounded-sm transition-opacity hover:opacity-70"
          style={{ color: '#B91C1C' }} title="Eliminar post">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
