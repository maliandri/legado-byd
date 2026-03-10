'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ShoppingBag, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { user, loading, isAdmin, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [error, setError] = useState('')
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace('/admin')
    }
  }, [loading, isAdmin, router])

  async function handleLogin() {
    setError('')
    setSigning(true)
    const result = await signInWithGoogle()
    if (result.error) setError(result.error)
    setSigning(false)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F9EDD3' }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: '#C4A040' }} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #3D1A05 0%, #6B3A1A 60%, #4A5E1A 100%)',
      }}
    >
      <div
        className="w-full max-w-md rounded-sm p-8"
        style={{
          backgroundColor: '#FDF8EE',
          border: '2px solid #C4A040',
          boxShadow: '0 20px 60px rgba(61,26,5,0.4)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingBag size={24} style={{ color: '#C4A040' }} />
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#3D1A05',
                fontSize: '1.6rem',
                fontWeight: 700,
              }}
            >
              Legado Bazar y Deco
            </span>
          </div>

          {/* Separador ornamental */}
          <div className="flex items-center justify-center gap-2 my-3">
            <div style={{ width: 30, height: 1, backgroundColor: '#C4A040' }} />
            <span style={{ color: '#C4A040', fontSize: '0.8rem' }}>✦</span>
            <div style={{ width: 30, height: 1, backgroundColor: '#C4A040' }} />
          </div>

          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#6B3A1A',
              fontSize: '0.95rem',
              fontStyle: 'italic',
            }}
          >
            Panel de Administración
          </p>
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#3D1A05',
            fontSize: '1.2rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          Iniciá sesión para continuar
        </h1>

        {error && (
          <div
            className="px-4 py-3 rounded-sm text-sm mb-5"
            style={{
              backgroundColor: '#F5CAAA',
              color: '#6B3A1A',
              border: '1px solid #E8C49A',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={signing}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-sm font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
        >
          {signing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {signing ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
        </button>

        <p
          className="text-center mt-5"
          style={{ color: '#A0622A', fontSize: '0.78rem' }}
        >
          Solo el administrador autorizado puede acceder.
        </p>

        <div className="mt-6 text-center">
          <a
            href="/"
            style={{ color: '#4A5E1A', fontSize: '0.82rem' }}
            className="hover:opacity-70 transition-opacity"
          >
            ← Volver al sitio
          </a>
        </div>
      </div>
    </div>
  )
}
