'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import PostCard from './PostCard'
import type { Post } from '@/types'

export default function LegadoSocialSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/posts')
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="legado-social" className="py-16" style={{ backgroundColor: '#F2E6C8' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <p style={{ color: '#A0622A', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            Novedades & comunidad
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: 12 }}>
            Legado Social
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
            <span style={{ color: '#C4A040' }}>✦</span>
            <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
          </div>
          <p style={{ color: '#6B3A1A', fontSize: '0.9rem', marginTop: 12, lineHeight: 1.6 }}>
            Novedades, recetas y tips del mundo panadero. Los clientes registrados pueden comentar.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: '#C4A040' }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#A0622A' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>Próximamente</p>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Los primeros posts están en camino.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
