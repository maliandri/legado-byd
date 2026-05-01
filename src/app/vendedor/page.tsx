'use client'

import VendedorGuard from '@/components/vendedor/VendedorGuard'
import VendedorPanel from '@/components/vendedor/VendedorPanel'
import { useAuth } from '@/hooks/useAuth'
import { ShoppingBag, LogOut } from 'lucide-react'

export default function VendedorPage() {
  return (
    <VendedorGuard>
      <VendedorApp />
    </VendedorGuard>
  )
}

function VendedorApp() {
  const { user, profile, signOut } = useAuth()
  const nombre = profile?.nombre || user?.email || 'Vendedor'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9EDD3' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#3D1A05', borderBottom: '3px solid #C4A040' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: '#C4A040' }} />
            <span style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontWeight: 700, fontSize: '1rem' }}>
              Legado — Punto de Venta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: '#DDD0A8', fontSize: '0.8rem' }} className="hidden sm:block">{nombre}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm hover:opacity-80"
              style={{ border: '1px solid rgba(196,160,64,0.5)', color: '#F2E6C8' }}
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <VendedorPanel />
      </main>
    </div>
  )
}
