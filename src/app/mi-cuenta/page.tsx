'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { updateUsuario } from '@/lib/firebase/usuarios'
import { getPedidos } from '@/lib/firebase/pedidos'
import { getProducto } from '@/lib/firebase/firestore'
import type { Pedido, Producto } from '@/types'

export default function MiCuentaPage() {
  const { user, profile, isCustomer, loading, signOut, refreshProfile } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<'perfil' | 'favoritos' | 'pedidos'>('perfil')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [favoritos, setFavoritos] = useState<Producto[]>([])
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '', direccion: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (profile) {
      setEditForm({ nombre: profile.nombre, telefono: profile.telefono ?? '', direccion: profile.direccion ?? '' })
    }
  }, [profile])

  useEffect(() => {
    if (user && tab === 'pedidos') {
      getPedidos(user.uid).then(setPedidos)
    }
  }, [user, tab])

  useEffect(() => {
    if (profile && tab === 'favoritos' && profile.favoritos.length > 0) {
      Promise.all(profile.favoritos.map((id) => getProducto(id)))
        .then((prods) => setFavoritos(prods.filter(Boolean) as Producto[]))
    } else if (tab === 'favoritos') {
      setFavoritos([])
    }
  }, [profile, tab])

  async function handleSavePerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await updateUsuario(user.uid, { nombre: editForm.nombre, telefono: editForm.telefono, direccion: editForm.direccion })
    refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading || !user || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C4A040', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const tabStyle = (t: typeof tab) => ({
    padding: '10px 20px',
    fontSize: '0.85rem',
    fontWeight: 600 as const,
    cursor: 'pointer',
    border: 'none',
    borderBottom: tab === t ? '2px solid #C4A040' : '2px solid transparent',
    backgroundColor: 'transparent',
    color: tab === t ? '#3D1A05' : '#A0622A',
    transition: 'color 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#3D1A05', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/">
            <Image src="/legado.png" alt="Legado" width={70} height={38} style={{ objectFit: 'contain' }} />
          </a>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontSize: '1rem', fontWeight: 700 }}>
              Mi Cuenta
            </p>
            <p style={{ color: '#C4A040', fontSize: '0.75rem' }}>{profile.email}</p>
          </div>
        </div>
        <button
          onClick={() => { signOut(); router.replace('/') }}
          style={{ fontSize: '0.82rem', color: '#DDD0A8', background: 'none', border: '1px solid #6B3A1A', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#F2E6C8', borderBottom: '1px solid #DDD0A8', display: 'flex', paddingLeft: 24 }}>
        <button style={tabStyle('perfil')} onClick={() => setTab('perfil')}>Perfil</button>
        <button style={tabStyle('favoritos')} onClick={() => setTab('favoritos')}>
          Favoritos {profile.favoritos.length > 0 && `(${profile.favoritos.length})`}
        </button>
        <button style={tabStyle('pedidos')} onClick={() => setTab('pedidos')}>Mis pedidos</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── PERFIL ── */}
        {tab === 'perfil' && (
          <form onSubmit={handleSavePerfil} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#3D1A05' }}>Tus datos</h2>
            {(['nombre', 'telefono', 'direccion'] as const).map((field) => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {field === 'nombre' ? 'Nombre' : field === 'telefono' ? 'Teléfono' : 'Dirección'}
                </label>
                <input
                  value={editForm[field]}
                  onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #DDD0A8', borderRadius: 6, backgroundColor: '#FFFBF2', color: '#3D1A05', fontSize: '0.9rem' }}
                  placeholder={field === 'nombre' ? 'Tu nombre completo' : field === 'telefono' ? 'Ej: 2990000000' : 'Tu dirección en Neuquén'}
                />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '10px 24px', backgroundColor: '#3D1A05', color: '#F2E6C8', border: 'none', borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {saved && <span style={{ color: '#4A5E1A', fontSize: '0.85rem' }}>✓ Guardado</span>}
            </div>
          </form>
        )}

        {/* ── FAVORITOS ── */}
        {tab === 'favoritos' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#3D1A05', marginBottom: 20 }}>Tus favoritos</h2>
            {favoritos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0622A' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>♡</p>
                <p>Todavía no guardaste favoritos.</p>
                <a href="/" style={{ color: '#C4A040', fontSize: '0.88rem' }}>Ver catálogo →</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {favoritos.map((p) => (
                  <div key={p.id} style={{ backgroundColor: '#FFFBF2', border: '1px solid #DDD0A8', borderRadius: 8, overflow: 'hidden' }}>
                    {p.imagen && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    )}
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontWeight: 600, color: '#3D1A05', fontSize: '0.9rem' }}>{p.nombre}</p>
                      <p style={{ color: '#C4A040', fontWeight: 700, fontSize: '0.95rem', marginTop: 4 }}>
                        ${p.precio.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PEDIDOS ── */}
        {tab === 'pedidos' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#3D1A05', marginBottom: 20 }}>Historial de pedidos</h2>
            {pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0622A' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>📦</p>
                <p>Todavía no realizaste pedidos.</p>
                <a href="/" style={{ color: '#C4A040', fontSize: '0.88rem' }}>Ver catálogo →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedidos.map((p) => (
                  <div key={p.id} style={{ backgroundColor: '#FFFBF2', border: '1px solid #DDD0A8', borderRadius: 8, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.78rem', color: '#A0622A' }}>
                        {p.createdAt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '0.78rem', backgroundColor: '#C8DEC8', color: '#2A4A2A', padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>
                        {p.estado}
                      </span>
                    </div>
                    {p.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#3D1A05', padding: '3px 0' }}>
                        <span>{item.nombre} × {item.cantidad}</span>
                        <span>${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #EDD9A3', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#3D1A05' }}>
                      <span>Total</span>
                      <span>${p.total.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
