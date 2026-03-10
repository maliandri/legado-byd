'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin/login')
    }
  }, [loading, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9EDD3' }}>
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-4 mb-4"
            style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }}
          />
          <p style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05' }}>
            Verificando acceso...
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return <>{children}</>
}
