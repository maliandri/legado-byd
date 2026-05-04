'use client'

import { useState, useEffect } from 'react'
import type { NosotrosContent } from '@/types'

export default function NosotrosSection() {
  const [data, setData] = useState<NosotrosContent | null>(null)

  useEffect(() => {
    fetch('/api/admin/nosotros')
      .then(r => r.json())
      .then(d => {
        if (d.sobre_nosotros || d.vision || d.mision) setData(d)
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <section id="nosotros" className="py-16" style={{ backgroundColor: '#FDF8EE' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <p style={{ color: '#A0622A', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            Quiénes somos
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: 12 }}>
            Nosotros
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
            <span style={{ color: '#C4A040' }}>✦</span>
            <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-1">
          {/* Sobre nosotros */}
          {data.sobre_nosotros && (
            <div className="p-6 rounded-sm" style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
              <p style={{ color: '#3D1A05', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {data.sobre_nosotros}
              </p>
            </div>
          )}

          {/* Visión y Misión */}
          {(data.vision || data.mision) && (
            <div className="grid sm:grid-cols-2 gap-6">
              {data.vision && (
                <div className="p-5 rounded-sm" style={{ backgroundColor: '#FDF8EE', border: '1.5px solid #C4A040' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ color: '#C4A040', fontSize: '1.2rem' }}>✦</span>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontWeight: 700, fontSize: '1.1rem' }}>
                      Nuestra visión
                    </h3>
                  </div>
                  <p style={{ color: '#6B3A1A', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {data.vision}
                  </p>
                </div>
              )}
              {data.mision && (
                <div className="p-5 rounded-sm" style={{ backgroundColor: '#FDF8EE', border: '1.5px solid #C4A040' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ color: '#C4A040', fontSize: '1.2rem' }}>✦</span>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontWeight: 700, fontSize: '1.1rem' }}>
                      Nuestra misión
                    </h3>
                  </div>
                  <p style={{ color: '#6B3A1A', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {data.mision}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
