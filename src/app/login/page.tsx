'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

const inp = {
  width: '100%', padding: '10px 13px', border: '1px solid #DDD0A8',
  borderRadius: 6, backgroundColor: '#FFFBF2', color: '#3D1A05',
  fontSize: '0.92rem', outline: 'none',
} as const

export default function LoginPage() {
  const { user, profile, isAdmin, isVendedor, loading, signInCustomer, redirectError,
          signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<'google' | 'email'>('google')
  const [modo, setModo] = useState<'login' | 'registro' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (redirectError) setError(redirectError) }, [redirectError])
  useEffect(() => {
    if (loading || !user) return
    if (isAdmin) { router.replace('/admin'); return }
    if (isVendedor) { router.replace('/vendedor'); return }
    router.replace(profile?.perfilCompleto ? '/mi-cuenta' : '/registro')
  }, [user, isAdmin, isVendedor, loading, profile, router])

  async function handleGoogle() {
    setError(''); setBusy(true)
    const r = await signInCustomer()
    if (r.error) setError(r.error)
    setBusy(false)
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setMsg(''); setBusy(true)
    if (modo === 'reset') {
      const r = await resetPassword(email)
      if (r.error) setError(r.error)
      else setMsg('Te enviamos un email para restablecer tu contraseña.')
    } else if (modo === 'registro') {
      if (!nombre.trim()) { setError('El nombre es requerido.'); setBusy(false); return }
      const r = await signUpWithEmail(email, password, nombre)
      if (r.error) setError(r.error)
    } else {
      const r = await signInWithEmail(email, password)
      if (r.error) setError(r.error)
    }
    setBusy(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #C4A040', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const tabBtn = (active: boolean) => ({
    flex: 1, padding: '10px', fontSize: '0.88rem', fontWeight: 600 as const,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    backgroundColor: active ? '#3D1A05' : 'transparent',
    color: active ? '#F2E6C8' : '#6B3A1A',
    borderBottom: active ? '3px solid #C4A040' : '3px solid transparent',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#FFFBF2', border: '1.5px solid #C4A040', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(61,26,5,0.12)' }}>

        {/* Header */}
        <div style={{ backgroundColor: '#3D1A05', padding: '24px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <Image src="/legado.png" alt="Legado" width={70} height={40} style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontSize: '1.3rem', fontWeight: 700 }}>LEGADO</h1>
          <p style={{ color: '#C4A040', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Bazar &amp; Deco</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#F2E6C8', borderBottom: '1px solid #DDD0A8' }}>
          <button style={tabBtn(tab === 'google')} onClick={() => { setTab('google'); setError(''); setMsg('') }}>
            Google
          </button>
          <button style={tabBtn(tab === 'email')} onClick={() => { setTab('email'); setError(''); setMsg('') }}>
            Email
          </button>
        </div>

        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{ backgroundColor: '#F5CAAA', border: '1px solid #E8C49A', borderRadius: 6, padding: '10px 14px', fontSize: '0.85rem', color: '#6B3A1A', marginBottom: 16 }}>
              {error}
            </div>
          )}
          {msg && (
            <div style={{ backgroundColor: '#C8DEC8', border: '1px solid #A8C4A8', borderRadius: 6, padding: '10px 14px', fontSize: '0.85rem', color: '#3D1A05', marginBottom: 16 }}>
              {msg}
            </div>
          )}

          {/* ── TAB GOOGLE ── */}
          {tab === 'google' && (
            <>
              <p style={{ fontSize: '0.85rem', color: '#6B3A1A', marginBottom: 20, lineHeight: 1.6 }}>
                Ingresá con tu cuenta de Google. Rápido y seguro.
              </p>
              <button onClick={handleGoogle} disabled={busy}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 20px', backgroundColor: '#fff', border: '1.5px solid #DDD0A8', borderRadius: 8, cursor: busy ? 'wait' : 'pointer', fontSize: '0.95rem', color: '#3D1A05', fontWeight: 500 }}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.3 30.2 0 24 0 14.8 0 7 5.4 3.2 13.3l7.8 6C13 13.5 18 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.3-4.7 7l7.3 5.7c4.3-4 6.7-9.8 7.2-16.7z"/>
                  <path fill="#FBBC05" d="M11 28.3c-.5-1.5-.8-3-.8-4.8s.3-3.3.8-4.8l-7.8-6C1.2 15.9 0 19.8 0 24s1.2 8.1 3.2 11.3l7.8-7z"/>
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6 0-11-4-12.8-9.5l-7.8 7C7 42.6 14.8 48 24 48z"/>
                </svg>
                {busy ? 'Ingresando...' : 'Continuar con Google'}
              </button>
            </>
          )}

          {/* ── TAB EMAIL ── */}
          {tab === 'email' && (
            <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.85rem', color: '#6B3A1A', marginBottom: 4 }}>
                {modo === 'login' ? 'Ingresá con tu email y contraseña.' :
                 modo === 'registro' ? 'Creá tu cuenta con email.' :
                 'Te enviamos un link para restablecer tu contraseña.'}
              </p>

              {modo === 'registro' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', marginBottom: 4 }}>Nombre *</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" required style={inp} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', marginBottom: 4 }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required style={inp} />
              </div>

              {modo !== 'reset' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', marginBottom: 4 }}>Contraseña *</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} style={inp} />
                </div>
              )}

              <button type="submit" disabled={busy}
                style={{ width: '100%', padding: '12px', backgroundColor: busy ? '#A0622A' : '#3D1A05', color: '#F2E6C8', border: 'none', borderRadius: 7, fontSize: '0.95rem', fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
                {busy ? 'Procesando...' :
                 modo === 'login' ? 'Ingresar' :
                 modo === 'registro' ? 'Crear cuenta' : 'Enviar email'}
              </button>

              {/* Links de modo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                {modo === 'login' && (
                  <>
                    <button type="button" onClick={() => { setModo('registro'); setError(''); setMsg('') }}
                      style={{ background: 'none', border: 'none', color: '#4A5E1A', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Crear cuenta nueva
                    </button>
                    <button type="button" onClick={() => { setModo('reset'); setError(''); setMsg('') }}
                      style={{ background: 'none', border: 'none', color: '#A0622A', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                      Olvidé mi contraseña
                    </button>
                  </>
                )}
                {(modo === 'registro' || modo === 'reset') && (
                  <button type="button" onClick={() => { setModo('login'); setError(''); setMsg('') }}
                    style={{ background: 'none', border: 'none', color: '#6B3A1A', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    ← Volver al inicio de sesión
                  </button>
                )}
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: '#A0622A' }}>
            Al ingresar aceptás que guardemos tu perfil en nuestra base de datos.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #EDD9A3', padding: '14px 32px', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: '0.82rem', color: '#C4A040', textDecoration: 'none' }}>← Volver al catálogo</a>
        </div>
      </div>
    </div>
  )
}
