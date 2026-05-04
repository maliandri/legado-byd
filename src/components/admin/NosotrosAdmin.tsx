'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

export default function NosotrosAdmin() {
  const [sobre, setSobre] = useState('')
  const [vision, setVision] = useState('')
  const [mision, setMision] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/nosotros')
      .then(r => r.json())
      .then(d => {
        setSobre(d.sobre_nosotros || '')
        setVision(d.vision || '')
        setMision(d.mision || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/nosotros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sobre_nosotros: sobre, vision, mision }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('✓ Guardado correctamente')
    } catch (err: any) {
      setMsg(`✗ ${err.message}`)
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: '#C4A040' }} />
      </div>
    )
  }

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 4,
    border: '1.5px solid #DDD0A8',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    resize: 'vertical' as const,
    minHeight: 120,
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontFamily: "'Playfair Display', serif",
    color: '#3D1A05',
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: 6,
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 0' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700 }}>
            Nosotros
          </h2>
          <p style={{ color: '#A0622A', fontSize: '0.85rem', marginTop: 4 }}>
            Esta información se muestra en la sección "Nosotros" del sitio.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: '#4A5E1A', color: '#fff' }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Guardar
        </button>
      </div>

      {msg && (
        <div className="mb-6 px-4 py-3 rounded-sm text-sm font-medium"
          style={{ backgroundColor: msg.startsWith('✓') ? '#EDF7ED' : '#FDECEA', color: msg.startsWith('✓') ? '#2e7d32' : '#c62828' }}>
          {msg}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <label style={labelStyle}>Sobre nosotros</label>
          <textarea
            value={sobre}
            onChange={e => setSobre(e.target.value)}
            placeholder="Contá la historia de Legado ByD, quiénes son, de dónde vienen..."
            style={fieldStyle}
            rows={5}
          />
        </div>

        <div>
          <label style={labelStyle}>Nuestra visión</label>
          <textarea
            value={vision}
            onChange={e => setVision(e.target.value)}
            placeholder="¿Hacia dónde va Legado? ¿Qué futuro imaginan?"
            style={fieldStyle}
            rows={4}
          />
        </div>

        <div>
          <label style={labelStyle}>Nuestra misión</label>
          <textarea
            value={mision}
            onChange={e => setMision(e.target.value)}
            placeholder="¿Por qué existe Legado? ¿Qué los mueve cada día?"
            style={fieldStyle}
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
