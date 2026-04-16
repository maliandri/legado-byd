'use client'

import { useEffect, useState, useRef } from 'react'
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
  width: '100%', padding: '10px 13px', border: '1px solid #DDD0A8',
  borderRadius: 6, backgroundColor: '#FFFBF2', color: '#3D1A05',
  fontSize: '0.92rem', outline: 'none',
} as const

const lbl = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A',
  textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4,
}

type Step = 'tipo' | 'form' | 'otp'

export default function RegistroPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>('tipo')
  const [tipo, setTipo] = useState<TipoUsuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpResendSeconds, setOtpResendSeconds] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [form, setForm] = useState({
    nombre: '', dni: '', fechaNacimiento: '', cuit: '', razonSocial: '',
    telefono: '', direccion: '', ciudad: 'Neuquén', provincia: 'Neuquén',
  })

  useEffect(() => { if (!loading && !user) router.replace('/login') }, [loading, user, router])
  useEffect(() => { if (!loading && profile?.perfilCompleto) router.replace('/mi-cuenta') }, [loading, profile, router])
  useEffect(() => { if (user) setForm(f => ({ ...f, nombre: user.displayName ?? '' })) }, [user])

  // Countdown para reenvío OTP
  useEffect(() => {
    if (otpResendSeconds <= 0) return
    const t = setTimeout(() => setOtpResendSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [otpResendSeconds])

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function validateDNI(v: string) { return /^\d{7,8}$/.test(v.replace(/\./g, '')) }
  function validateCUIT(v: string) { return /^\d{2}-?\d{8}-?\d{1}$/.test(v) }

  function validateForm(): string | null {
    if (!form.nombre.trim()) return 'El nombre es requerido.'
    if (!form.telefono.trim()) return 'El teléfono es requerido.'
    if (!form.direccion.trim()) return 'La dirección es requerida.'
    if (!form.ciudad.trim()) return 'La ciudad es requerida.'
    if (tipo === 'cliente') {
      if (!validateDNI(form.dni)) return 'DNI inválido (7 u 8 dígitos).'
      if (!form.fechaNacimiento) return 'La fecha de nacimiento es requerida.'
    } else {
      if (!validateCUIT(form.cuit)) return 'CUIT inválido. Formato: 20-12345678-9'
      if (!form.razonSocial.trim()) return 'La razón social es requerida.'
    }
    return null
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const err = validateForm()
    if (err) { setError(err); return }
    // Enviar OTP
    setOtpSending(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user!.uid, email: user!.email, nombre: form.nombre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('otp')
      setOtpResendSeconds(60)
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código.')
    } finally {
      setOtpSending(false)
    }
  }

  async function handleResendOTP() {
    if (otpResendSeconds > 0) return
    setOtpSending(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user!.uid, email: user!.email, nombre: form.nombre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOtpCode(['', '', '', '', '', ''])
      setOtpResendSeconds(60)
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setOtpSending(false)
    }
  }

  function handleOtpInput(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...otpCode]
    next[index] = value
    setOtpCode(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const code = otpCode.join('')
    if (code.length !== 6) { setError('Ingresá los 6 dígitos del código.'); return }
    setOtpVerifying(true)
    try {
      // Verificar OTP
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user!.uid, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Guardar perfil en Firestore
      const userData: any = {
        tipo, nombre: form.nombre.trim(), telefono: form.telefono.trim(),
        direccion: form.direccion.trim(), ciudad: form.ciudad.trim(),
        provincia: form.provincia, perfilCompleto: true,
      }
      if (tipo === 'cliente') {
        userData.dni = form.dni.replace(/\./g, '')
        userData.fechaNacimiento = form.fechaNacimiento
      } else {
        userData.cuit = form.cuit
        userData.razonSocial = form.razonSocial.trim()
      }
      await updateUsuario(user!.uid, userData)

      // Email de bienvenida (no bloqueante)
      fetch('/api/auth/send-bienvenida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, nombre: form.nombre, tipo }),
      }).catch(() => {})

      await refreshProfile()
      router.replace('/mi-cuenta')
    } catch (err: any) {
      setError(err.message || 'Error al verificar.')
    } finally {
      setOtpVerifying(false)
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

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/"><Image src="/legado.png" alt="Legado" width={80} height={44} style={{ objectFit: 'contain' }} /></a>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700, marginTop: 10 }}>
            {step === 'otp' ? 'Verificá tu email' : 'Completá tu perfil'}
          </h1>
          <p style={{ color: '#6B3A1A', fontSize: '0.85rem', marginTop: 4 }}>
            {step === 'otp'
              ? <>Enviamos un código a <strong>{user.email}</strong></>
              : <>Ingresando como <strong>{user.email}</strong></>
            }
          </p>
        </div>

        <div style={{ backgroundColor: '#FFFBF2', border: '1.5px solid #C4A040', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(61,26,5,0.1)' }}>

          {/* ── STEP 1: Elegir tipo ── */}
          {step === 'tipo' && (
            <div style={{ padding: '32px 28px' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#3D1A05', fontWeight: 600, marginBottom: 20, textAlign: 'center' }}>
                ¿Cómo querés registrarte?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'cliente', icon: '👤', title: 'Cliente Final', desc: 'Persona física. Necesitás tu DNI.' },
                  { key: 'empresa', icon: '🏢', title: 'Empresa', desc: 'Persona jurídica. Necesitás CUIT.' },
                ].map(({ key, icon, title, desc }) => (
                  <button key={key}
                    onClick={() => { setTipo(key as TipoUsuario); setStep('form') }}
                    style={{ padding: '24px 16px', border: '2px solid #DDD0A8', borderRadius: 8, backgroundColor: '#FDF8EE', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
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
          )}

          {/* ── STEP 2: Formulario ── */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #EDD9A3' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#3D1A05', fontSize: '1rem' }}>
                  {tipo === 'cliente' ? '👤 Cliente Final' : '🏢 Empresa'}
                </span>
                <button type="button" onClick={() => setStep('tipo')}
                  style={{ fontSize: '0.78rem', color: '#A0622A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Cambiar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Email</label>
                  <input value={user.email ?? ''} readOnly style={{ ...inp, backgroundColor: '#F2E6C8', color: '#6B3A1A' }} />
                </div>
                <div>
                  <label style={lbl}>Nombre completo *</label>
                  <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: María García" required style={inp} />
                </div>

                {tipo === 'cliente' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>DNI *</label>
                      <input value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678" maxLength={8} inputMode="numeric" required style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Fecha de nacimiento *</label>
                      <input type="date" value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)}
                        max={new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10)} required style={inp} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={lbl}>Razón social *</label>
                      <input value={form.razonSocial} onChange={e => set('razonSocial', e.target.value)} placeholder="Ej: Distribuidora Sur SRL" required style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>CUIT *</label>
                      <input value={form.cuit} onChange={e => set('cuit', e.target.value)} placeholder="20-12345678-9" inputMode="numeric" required style={inp} />
                    </div>
                  </>
                )}

                <div>
                  <label style={lbl}>Teléfono *</label>
                  <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Ej: 2990000000" inputMode="tel" required style={inp} />
                </div>
                <div>
                  <label style={lbl}>Dirección *</label>
                  <input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle y número" required style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Ciudad *</label>
                    <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Neuquén" required style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Provincia *</label>
                    <select value={form.provincia} onChange={e => set('provincia', e.target.value)} style={inp}>
                      {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div style={{ backgroundColor: '#F5CAAA', border: '1px solid #E8C49A', borderRadius: 6, padding: '10px 14px', fontSize: '0.85rem', color: '#6B3A1A' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={otpSending}
                  style={{ width: '100%', padding: '13px', backgroundColor: otpSending ? '#A0622A' : '#3D1A05', color: '#F2E6C8', border: 'none', borderRadius: 7, fontSize: '0.95rem', fontWeight: 700, cursor: otpSending ? 'wait' : 'pointer', marginTop: 4 }}>
                  {otpSending ? 'Enviando código...' : 'Verificar email →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} style={{ padding: '32px 28px', textAlign: 'center' }}>
              <p style={{ color: '#3D1A05', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.6 }}>
                Revisá tu bandeja de entrada y escribí el código de <strong>6 dígitos</strong>:
              </p>

              {/* Inputs OTP */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 50, height: 60, textAlign: 'center', fontSize: '1.6rem', fontWeight: 800,
                      border: `2px solid ${digit ? '#C4A040' : '#DDD0A8'}`, borderRadius: 8,
                      backgroundColor: digit ? '#F2E6C8' : '#FFFBF2', color: '#3D1A05', outline: 'none',
                    }}
                  />
                ))}
              </div>

              {error && (
                <div style={{ backgroundColor: '#F5CAAA', border: '1px solid #E8C49A', borderRadius: 6, padding: '10px 14px', fontSize: '0.85rem', color: '#6B3A1A', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={otpVerifying || otpCode.join('').length < 6}
                style={{ width: '100%', padding: '13px', backgroundColor: '#3D1A05', color: '#F2E6C8', border: 'none', borderRadius: 7, fontSize: '0.95rem', fontWeight: 700, cursor: otpVerifying ? 'wait' : 'pointer', opacity: otpCode.join('').length < 6 ? 0.5 : 1, marginBottom: 16 }}>
                {otpVerifying ? 'Verificando...' : 'Confirmar →'}
              </button>

              <button type="button" onClick={handleResendOTP} disabled={otpResendSeconds > 0 || otpSending}
                style={{ background: 'none', border: 'none', color: otpResendSeconds > 0 ? '#A0622A' : '#C4A040', fontSize: '0.85rem', cursor: otpResendSeconds > 0 ? 'default' : 'pointer', textDecoration: otpResendSeconds > 0 ? 'none' : 'underline' }}>
                {otpResendSeconds > 0 ? `Reenviar en ${otpResendSeconds}s` : 'Reenviar código'}
              </button>

              <div style={{ marginTop: 16 }}>
                <button type="button" onClick={() => { setStep('form'); setError(''); setOtpCode(['', '', '', '', '', '']) }}
                  style={{ background: 'none', border: 'none', color: '#6B3A1A', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  ← Volver al formulario
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
