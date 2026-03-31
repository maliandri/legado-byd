'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { updateUsuario } from '@/lib/firebase/usuarios'
import type { TipoUsuario } from '@/types'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
]

const inp = {
  width: '100%',
  padding: '10px 13px',
  border: '1px solid #DDD0A8',
  borderRadius: 6,
  backgroundColor: '#FFFBF2',
  color: '#3D1A05',
  fontSize: '0.92rem',
  outline: 'none',
} as const

const label = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6B3A1A',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: 4,
}

export default function RegistroPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()

  const [tipo, setTipo] = useState<TipoUsuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    cuit: '',
    razonSocial: '',
    telefono: '',
    direccion: '',
    ciudad: 'Neuquén',
    provincia: 'Neuquén',
  })

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!loading && profile?.perfilCompleto) router.replace('/mi-cuenta')
  }, [loading, profile, router])

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, nombre: user.displayName ?? '' }))
    }
  }, [user])

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function validateDNI(v: string) { return /^\d{7,8}$/.test(v.replace(/\./g, '')) }
  function validateCUIT(v: string) { return /^\d{2}-?\d{8}-?\d{1}$/.test(v) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!tipo) { setError('Seleccioná el tipo de cuenta.'); return }
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    if (!form.telefono.trim()) { setError('El teléfono es requerido.'); return }
    if (!form.direccion.trim()) { setError('La dirección es requerida.'); return }
    if (!form.ciudad.trim()) { setError('La ciudad es requerida.'); return }

    if (tipo === 'cliente') {
      if (!validateDNI(form.dni)) { setError('DNI inválido (7 u 8 dígitos).'); return }
      if (!form.fechaNacimiento) { setError('La fecha de nacimiento es requerida.'); return }
    } else {
      if (!validateCUIT(form.cuit)) { setError('CUIT inválido. Formato: 20-12345678-9'); return }
      if (!form.razonSocial.trim()) { setError('La razón social es requerida.'); return }
    }

    setSaving(true)
    try {
      const data: any = {
        tipo,
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        provincia: form.provincia,
        perfilCompleto: true,
      }
      if (tipo === 'cliente') {
        data.dni = form.dni.replace(/\./g, '')
        data.fechaNacimiento = form.fechaNacimiento
      } else {
        data.cuit = form.cuit
        data.razonSocial = form.razonSocial.trim()
      }
      await updateUsuario(user!.uid, data)
      await refreshProfile()
      router.replace('/mi-cuenta')
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C4A040', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', padding: '32px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/">
            <Image src="/legado.png" alt="Legado" width={80} height={44} style={{ objectFit: 'contain' }} />
          </a>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700, marginTop: 10 }}>
            Completá tu perfil
          </h1>
          <p style={{ color: '#6B3A1A', fontSize: '0.85rem', marginTop: 4 }}>
            Ingresando como <strong>{user.email}</strong>
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFBF2', border: '1.5px solid #C4A040', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(61,26,5,0.1)' }}>

          {/* Selector de tipo */}
          {!tipo ? (
            <div style={{ padding: '32px 28px' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#3D1A05', fontWeight: 600, marginBottom: 20, textAlign: 'center' }}>
                ¿Cómo querés registrarte?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'cliente', icon: '👤', title: 'Cliente Final', desc: 'Persona física. Necesitás tu DNI.' },
                  { key: 'empresa', icon: '🏢', title: 'Empresa', desc: 'Persona jurídica. Necesitás CUIT.' },
                ].map(({ key, icon, title, desc }) => (
                  <button
                    key={key}
                    onClick={() => setTipo(key as TipoUsuario)}
                    style={{
                      padding: '24px 16px',
                      border: '2px solid #DDD0A8',
                      borderRadius: 8,
                      backgroundColor: '#FDF8EE',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4A040'; e.currentTarget.style.backgroundColor = '#F2E6C8' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD0A8'; e.currentTarget.style.backgroundColor = '#FDF8EE' }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontWeight: 700, color: '#3D1A05', fontSize: '0.95rem' }}>{title}</div>
                    <div style={{ color: '#6B3A1A', fontSize: '0.78rem', marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '28px' }}>

              {/* Tipo seleccionado */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #EDD9A3' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#3D1A05', fontSize: '1rem' }}>
                  {tipo === 'cliente' ? '👤 Cliente Final' : '🏢 Empresa'}
                </span>
                <button
                  type="button"
                  onClick={() => setTipo(null)}
                  style={{ fontSize: '0.78rem', color: '#A0622A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Cambiar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Email (readonly) */}
                <div>
                  <label style={label}>Email</label>
                  <input value={user.email ?? ''} readOnly style={{ ...inp, backgroundColor: '#F2E6C8', color: '#6B3A1A' }} />
                </div>

                {/* Nombre */}
                <div>
                  <label style={label}>Nombre completo *</label>
                  <input
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Ej: María García"
                    required
                    style={inp}
                  />
                </div>

                {/* Campos según tipo */}
                {tipo === 'cliente' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={label}>DNI *</label>
                        <input
                          value={form.dni}
                          onChange={e => set('dni', e.target.value)}
                          placeholder="12345678"
                          maxLength={8}
                          inputMode="numeric"
                          required
                          style={inp}
                        />
                      </div>
                      <div>
                        <label style={label}>Fecha de nacimiento *</label>
                        <input
                          type="date"
                          value={form.fechaNacimiento}
                          onChange={e => set('fechaNacimiento', e.target.value)}
                          max={new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)}
                          required
                          style={inp}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={label}>Razón social *</label>
                      <input
                        value={form.razonSocial}
                        onChange={e => set('razonSocial', e.target.value)}
                        placeholder="Ej: Distribuidora Sur SRL"
                        required
                        style={inp}
                      />
                    </div>
                    <div>
                      <label style={label}>CUIT *</label>
                      <input
                        value={form.cuit}
                        onChange={e => set('cuit', e.target.value)}
                        placeholder="20-12345678-9"
                        inputMode="numeric"
                        required
                        style={inp}
                      />
                    </div>
                  </>
                )}

                {/* Teléfono */}
                <div>
                  <label style={label}>Teléfono *</label>
                  <input
                    value={form.telefono}
                    onChange={e => set('telefono', e.target.value)}
                    placeholder="Ej: 2990000000"
                    inputMode="tel"
                    required
                    style={inp}
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label style={label}>Dirección *</label>
                  <input
                    value={form.direccion}
                    onChange={e => set('direccion', e.target.value)}
                    placeholder="Calle y número"
                    required
                    style={inp}
                  />
                </div>

                {/* Ciudad y Provincia */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={label}>Ciudad *</label>
                    <input
                      value={form.ciudad}
                      onChange={e => set('ciudad', e.target.value)}
                      placeholder="Neuquén"
                      required
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={label}>Provincia *</label>
                    <select
                      value={form.provincia}
                      onChange={e => set('provincia', e.target.value)}
                      style={inp}
                    >
                      {PROVINCIAS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div style={{ backgroundColor: '#F5CAAA', border: '1px solid #E8C49A', borderRadius: 6, padding: '10px 14px', fontSize: '0.85rem', color: '#6B3A1A' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '13px',
                    backgroundColor: saving ? '#A0622A' : '#3D1A05',
                    color: '#F2E6C8',
                    border: 'none',
                    borderRadius: 7,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                    letterSpacing: '0.03em',
                    marginTop: 4,
                  }}
                >
                  {saving ? 'Guardando...' : 'Crear mi cuenta →'}
                </button>

              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.78rem', color: '#A0622A' }}>
          Tus datos son confidenciales y solo se usan para gestionar tus pedidos.
        </p>
      </div>
    </div>
  )
}
