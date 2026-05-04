'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { Post, Comentario } from '@/types'

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loadingC, setLoadingC] = useState(false)
  const [showC, setShowC] = useState(false)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [count, setCount] = useState(post.comentariosCount || 0)

  const fecha = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  async function toggleComentarios() {
    if (!showC && comentarios.length === 0) {
      setLoadingC(true)
      try {
        const res = await fetch(`/api/posts/${post.id}/comentarios`)
        const data = await res.json()
        setComentarios(Array.isArray(data) ? data : [])
      } catch {}
      finally { setLoadingC(false) }
    }
    setShowC(v => !v)
  }

  async function handleComment() {
    if (!texto.trim() || !user) return
    setSending(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/posts/${post.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const nuevo: Comentario = {
        id: data.id,
        texto,
        autorId: user.uid,
        autorNombre: user.displayName || user.email || 'Usuario',
        createdAt: new Date(),
      }
      setComentarios(prev => [...prev, nuevo])
      setCount(c => c + 1)
      setTexto('')
    } catch {}
    finally { setSending(false) }
  }

  const hasMedia = post.productoImagen || post.imagen

  return (
    <article
      className="rounded-sm overflow-hidden"
      style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8', boxShadow: '0 1px 4px rgba(61,26,5,0.06)' }}
    >
      {/* Imagen */}
      {hasMedia && (
        <div className="relative w-full" style={{ aspectRatio: '16/9', backgroundColor: '#F2E6C8' }}>
          <Image
            src={post.productoImagen || post.imagen!}
            alt={post.productoNombre || 'Post'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 680px"
          />
          {post.tipo === 'producto' && post.productoId && (
            <Link href={`/producto/${post.productoId}`}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-sm text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}>
              Ver producto →
            </Link>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Si es post de producto sin imagen grande, mostrar mini card */}
        {post.tipo === 'producto' && !hasMedia && post.productoNombre && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm"
            style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
            <span style={{ color: '#4A5E1A', fontSize: '0.8rem' }}>📦</span>
            <span style={{ color: '#3D1A05', fontSize: '0.85rem', fontWeight: 600 }}>{post.productoNombre}</span>
            {post.productoPrecio && (
              <span style={{ color: '#A0622A', fontSize: '0.8rem', marginLeft: 'auto' }}>
                ${post.productoPrecio.toLocaleString('es-AR')}
              </span>
            )}
            {post.productoId && (
              <Link href={`/producto/${post.productoId}`}
                className="text-xs font-medium hover:underline"
                style={{ color: '#4A5E1A' }}>Ver →</Link>
            )}
          </div>
        )}

        {/* Contenido */}
        <p style={{ color: '#3D1A05', fontSize: '0.95rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
          {post.contenido}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #EDD9A3' }}>
          <span style={{ color: '#A0622A', fontSize: '0.75rem' }}>Legado ByD · {fecha}</span>
          <button
            onClick={toggleComentarios}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#4A5E1A' }}
          >
            <MessageCircle size={15} />
            {count > 0 ? `${count} comentario${count !== 1 ? 's' : ''}` : 'Comentar'}
            {showC ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Sección comentarios */}
        {showC && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EDD9A3' }}>
            {loadingC ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin" style={{ color: '#C4A040' }} />
              </div>
            ) : (
              <>
                {comentarios.length === 0 && (
                  <p style={{ color: '#A0622A', fontSize: '0.8rem', textAlign: 'center', marginBottom: 12 }}>
                    Sé el primero en comentar.
                  </p>
                )}
                <div className="flex flex-col gap-2 mb-3">
                  {comentarios.map(c => (
                    <ComentarioItem key={c.id} comentario={c} />
                  ))}
                </div>

                {user ? (
                  <div className="flex gap-2">
                    <input
                      value={texto}
                      onChange={e => setTexto(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                      placeholder="Escribí un comentario..."
                      className="flex-1 px-3 py-2 rounded-sm text-sm outline-none"
                      style={{ border: '1.5px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05' }}
                    />
                    <button
                      onClick={handleComment}
                      disabled={sending || !texto.trim()}
                      className="px-3 py-2 rounded-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ backgroundColor: '#4A5E1A', color: '#fff' }}
                    >
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#A0622A', fontSize: '0.8rem' }}>
                    <Link href="/login" className="underline hover:opacity-70" style={{ color: '#4A5E1A' }}>Ingresá</Link> para dejar un comentario.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function ComentarioItem({ comentario }: { comentario: Comentario }) {
  const fecha = comentario.createdAt
    ? new Date(comentario.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    : ''
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: '#F2E6C8', color: '#3D1A05' }}>
        {comentario.autorNombre?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 px-3 py-2 rounded-sm" style={{ backgroundColor: '#F2E6C8' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3D1A05' }}>{comentario.autorNombre}</span>
          <span style={{ fontSize: '0.7rem', color: '#A0622A' }}>{fecha}</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#3D1A05', lineHeight: 1.5 }}>{comentario.texto}</p>
      </div>
    </div>
  )
}
