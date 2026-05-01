'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function VendedorGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (!isAdmin && profile?.tipo !== 'vendedor') { router.replace('/'); return }
  }, [loading, user, isAdmin, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9EDD3' }}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4"
          style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }} />
      </div>
    )
  }

  if (!user || (!isAdmin && profile?.tipo !== 'vendedor')) return null

  return <>{children}</>
}
