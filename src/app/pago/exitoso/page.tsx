'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, ShoppingBag, Home } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useCart } from '@/context/CartContext'

function ExitosoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const [paymentId, setPaymentId] = useState('')

  useEffect(() => {
    setPaymentId(searchParams.get('payment_id') || '')
    clearCart()
  }, [])

  return (
    <div className="rounded-sm p-10" style={{ backgroundColor: '#FDF8EE', border: '2px solid #C4A040' }}>
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C8DEC8' }}>
          <CheckCircle size={44} style={{ color: '#2D6A2D' }} />
        </div>
      </div>

      <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
        ¡Pago aprobado!
      </h1>

      <p style={{ color: '#6B3A1A', fontSize: '1rem', lineHeight: 1.7, marginBottom: '24px' }}>
        Tu pago fue procesado correctamente.<br />
        En breve nos pondremos en contacto para coordinar la entrega.
      </p>

      {paymentId && (
        <div className="px-4 py-3 rounded-sm mb-6" style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
          <p style={{ fontSize: '0.75rem', color: '#A0622A' }}>N° de operación</p>
          <p style={{ fontFamily: 'monospace', color: '#3D1A05', fontWeight: 700 }}>{paymentId}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-sm"
          style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
          <Home size={16} /> Volver al catálogo
        </button>
        <button onClick={() => router.push('/mi-cuenta')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-sm font-semibold text-sm"
          style={{ border: '1px solid #DDD0A8', color: '#6B3A1A', backgroundColor: 'transparent' }}>
          <ShoppingBag size={15} /> Ver mis pedidos
        </button>
      </div>
    </div>
  )
}

export default function PagoExitoso() {
  return (
    <div style={{ backgroundColor: '#F9EDD3', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Suspense fallback={<div className="text-center py-16" style={{ color: '#A0622A' }}>Verificando pago...</div>}>
          <ExitosoContent />
        </Suspense>
      </div>
    </div>
  )
}
