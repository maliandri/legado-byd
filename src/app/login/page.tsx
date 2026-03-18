'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { user, isAdmin, loading, signInCustomer } = useAuth()
  const router = useRouter()
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace(isAdmin ? '/admin' : '/mi-cuenta')
    }
  }, [user, isAdmin, loading, router])

  async function handleLogin() {
    setError('')
    setSigningIn(true)
    const result = await signInCustomer()
    if (result.error) setError(result.error)
    setSigningIn(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C4A040', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#FFFBF2', border: '1.5px solid #C4A040', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(61,26,5,0.12)' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#3D1A05', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Image src="/legado.png" alt="Legado" width={80} height={44} style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            LEGADO
          </h1>
          <p style={{ color: '#C4A040', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
            Bazar &amp; Deco
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#3D1A05', fontWeight: 600, marginBottom: 6 }}>
            Ingresá a tu cuenta
          </p>
          <p style={{ fontSize: '0.85rem', color: '#6B3A1A', marginBottom: 24, lineHeight: 1.6 }}>
            Guardá tus productos favoritos y consultá tu historial de pedidos.
          </p>

          {error && (
            <div style={{ backgroundColor: '#F5CAAA', border: '1px solid #E8C49A', borderRadius: 6, padding: '10px 14px', fontSize: '0.85rem', color: '#6B3A1A', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={signingIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '12px 20px',
              backgroundColor: '#fff',
              border: '1.5px solid #DDD0A8',
              borderRadius: 8,
              cursor: signingIn ? 'wait' : 'pointer',
              fontSize: '0.95rem',
              color: '#3D1A05',
              fontWeight: 500,
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(61,26,5,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            {/* Google logo SVG */}
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.3 30.2 0 24 0 14.8 0 7 5.4 3.2 13.3l7.8 6C13 13.5 18 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.3-4.7 7l7.3 5.7c4.3-4 6.7-9.8 7.2-16.7z"/>
              <path fill="#FBBC05" d="M11 28.3c-.5-1.5-.8-3-.8-4.8s.3-3.3.8-4.8l-7.8-6C1.2 15.9 0 19.8 0 24s1.2 8.1 3.2 11.3l7.8-7z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6 0-11-4-12.8-9.5l-7.8 7C7 42.6 14.8 48 24 48z"/>
            </svg>
            {signingIn ? 'Ingresando...' : 'Continuar con Google'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.78rem', color: '#A0622A' }}>
            Al ingresar aceptás que guardemos tu perfil de usuario en nuestra base de datos.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #EDD9A3', padding: '14px 32px', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: '0.82rem', color: '#C4A040', textDecoration: 'none' }}>
            ← Volver al catálogo
          </a>
        </div>
      </div>
    </div>
  )
}
