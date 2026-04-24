'use client'

import { useRouter } from 'next/navigation'
import { Clock, Home } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function PagoPendiente() {
  const router = useRouter()

  return (
    <div style={{ backgroundColor: '#F9EDD3', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-sm p-10" style={{ backgroundColor: '#FDF8EE', border: '2px solid #C4A040' }}>

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#F2E6C8', border: '2px solid #C4A040' }}>
              <Clock size={44} style={{ color: '#C4A040' }} />
            </div>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
            Pago pendiente
          </h1>

          <p style={{ color: '#6B3A1A', fontSize: '1rem', lineHeight: 1.7, marginBottom: '24px' }}>
            Tu pago está siendo procesado.<br />
            Te notificaremos por email cuando se confirme. Puede demorar hasta 1 día hábil.
          </p>

          <button onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-sm"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
            <Home size={16} />
            Volver al catálogo
          </button>

        </div>
      </div>
    </div>
  )
}
