'use client'

import { useState } from 'react'
import { X, Plus, Minus, Trash2, ShoppingCart, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/hooks/useAuth'
import { savePedido } from '@/lib/firebase/pedidos'
import { decrementStock } from '@/lib/firebase/firestore'

async function enviarEmailsPedido(params: {
  email: string
  nombre: string
  uid?: string
  items: { productoId: string; nombre: string; cantidad: number; precio: number }[]
  total: number
}) {
  try {
    await fetch('/api/pedido/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (e) {
    console.error('Error enviando email de pedido:', e)
  }
}

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'

export default function CartDrawer() {
  const { items, open, totalItems, totalPrecio, setOpen, removeItem, increment, decrement, clearCart } = useCart()
  const { user, isCustomer, profile } = useAuth()
  const [loadingMP, setLoadingMP] = useState(false)
  const [mpError, setMpError] = useState('')

  async function handlePedirPorWhatsApp() {
    if (items.length === 0) return

    const emailItems = items.map((i) => ({
      nombre: i.producto.nombre,
      precio: i.producto.precio,
      cantidad: i.cantidad,
    }))

    // Guardar pedido en Firestore si el cliente está logueado
    if (isCustomer && user) {
      try {
        await savePedido(user.uid, items.map((i) => ({
          productoId: i.producto.id,
          nombre: i.producto.nombre,
          precio: i.producto.precio,
          cantidad: i.cantidad,
        })))
      } catch (e) {
        console.error('Error guardando pedido:', e)
      }

      // Enviar emails de confirmación al cliente y notificación al admin
      if (user.email) {
        enviarEmailsPedido({
          email: user.email,
          nombre: profile?.nombre || user.displayName || 'Cliente',
          uid: user.uid,
          items: items.map(i => ({
            productoId: i.producto.id,
            nombre: i.producto.nombre,
            precio: i.producto.precio,
            cantidad: i.cantidad,
          })),
          total: totalPrecio,
        })
      }
    }

    // Decrementar stock en Firestore
    try {
      await Promise.all(items.map(i => decrementStock(i.producto.id, i.cantidad)))
    } catch (e) {
      console.error('Error decrementando stock:', e)
    }

    const lineas = items.map(
      (i) => `• *${i.producto.nombre}* x${i.cantidad} — $${(i.producto.precio * i.cantidad).toLocaleString('es-AR')}`
    )
    const total = `\n*Total estimado: $${totalPrecio.toLocaleString('es-AR')}*`
    const mensaje = encodeURIComponent(
      `¡Hola! Quisiera hacer el siguiente pedido desde Legado Bazar y Deco:\n\n${lineas.join('\n')}${total}\n\n¿Está disponible?`
    )
    window.open(`https://wa.me/${whatsapp}?text=${mensaje}`, '_blank', 'noopener,noreferrer')
  }

  async function handlePagarConMP() {
    if (items.length === 0) return
    setLoadingMP(true)
    setMpError('')
    try {
      const mpItems = items.map(i => ({
        productoId: i.producto.id,
        nombre: i.producto.nombre,
        precio: i.producto.precio,
        cantidad: i.cantidad,
      }))
      const res = await fetch('/api/mercadopago/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid || null,
          email: user?.email || null,
          nombre: profile?.nombre || user?.displayName || 'Cliente',
          items: mpItems,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago')
      window.location.href = data.init_point
    } catch (err: any) {
      setMpError(err.message || 'No se pudo iniciar el pago. Intentá de nuevo.')
      setLoadingMP(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(61,26,5,0.5)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300"
        style={{
          width: 'min(400px, 100vw)',
          backgroundColor: '#FDF8EE',
          borderLeft: '2px solid #C4A040',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? '-8px 0 32px rgba(61,26,5,0.2)' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ backgroundColor: '#3D1A05', borderBottom: '2px solid #C4A040' }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: '#C4A040' }} />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#F2E6C8',
                fontSize: '1.15rem',
                fontWeight: 700,
              }}
            >
              Tu pedido
            </h2>
            {totalItems > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
              >
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ color: '#DDD0A8' }}
            className="hover:opacity-70 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <ShoppingCart size={48} style={{ color: '#DDD0A8' }} />
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#A0622A',
                  fontSize: '1rem',
                  textAlign: 'center',
                }}
              >
                Tu pedido está vacío
              </p>
              <p style={{ color: '#6B3A1A', fontSize: '0.85rem', textAlign: 'center' }}>
                Agregá productos del catálogo
              </p>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-sm text-sm font-semibold"
                style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.producto.id}
                className="flex gap-3 p-3 rounded-sm"
                style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}
              >
                {/* Imagen */}
                <div
                  className="flex-shrink-0 rounded-sm overflow-hidden flex items-center justify-center"
                  style={{ width: 60, height: 60, backgroundColor: '#EDD9A3' }}
                >
                  {item.producto.imagen ? (
                    <Image
                      src={item.producto.imagen}
                      alt={item.producto.nombre}
                      width={60}
                      height={60}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-2xl">
                      {item.producto.categoria === 'panaderia' ? '🍞' :
                       item.producto.categoria === 'pasteleria' ? '🎂' : '✨'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: '#3D1A05',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      marginBottom: '4px',
                    }}
                    className="truncate"
                  >
                    {item.producto.nombre}
                  </p>
                  <p style={{ color: '#A0622A', fontSize: '0.82rem', marginBottom: '6px' }}>
                    ${item.producto.precio.toLocaleString('es-AR')} c/u
                  </p>

                  {/* Controles cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrement(item.producto.id)}
                      className="w-6 h-6 rounded-sm flex items-center justify-center hover:opacity-70"
                      style={{ backgroundColor: '#DDD0A8', color: '#3D1A05' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ color: '#3D1A05', fontWeight: 700, fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => increment(item.producto.id)}
                      className="w-6 h-6 rounded-sm flex items-center justify-center hover:opacity-70"
                      style={{ backgroundColor: '#DDD0A8', color: '#3D1A05' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Subtotal + eliminar */}
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  <button
                    onClick={() => removeItem(item.producto.id)}
                    style={{ color: '#A0622A' }}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: '#3D1A05',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    ${(item.producto.precio * item.cantidad).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y CTA */}
        {items.length > 0 && (
          <div
            className="flex-shrink-0 px-5 py-4 space-y-3"
            style={{ borderTop: '2px solid #DDD0A8', backgroundColor: '#F2E6C8' }}
          >
            {/* Separador ornamental */}
            <div className="flex items-center gap-2 mb-1">
              <div style={{ flex: 1, height: 1, backgroundColor: '#C4A040', opacity: 0.4 }} />
              <span style={{ color: '#C4A040', fontSize: '0.7rem' }}>✦</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#C4A040', opacity: 0.4 }} />
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span style={{ color: '#6B3A1A', fontSize: '0.9rem', fontWeight: 600 }}>Total estimado</span>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#3D1A05',
                  fontWeight: 800,
                  fontSize: '1.3rem',
                }}
              >
                ${totalPrecio.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Botón Pagar con MercadoPago */}
            <button
              onClick={handlePagarConMP}
              disabled={loadingMP}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#009EE3', color: '#fff' }}
            >
              {loadingMP
                ? <Loader2 size={16} className="animate-spin" />
                : <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}><path d="M21.5 5.5H2.5C1.12 5.5 0 6.62 0 8v8c0 1.38 1.12 2.5 2.5 2.5h19c1.38 0 2.5-1.12 2.5-2.5V8c0-1.38-1.12-2.5-2.5-2.5zM8.5 14.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm7 0c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              }
              {loadingMP ? 'Redirigiendo...' : 'Pagar con MercadoPago'}
            </button>

            {mpError && (
              <p className="text-xs text-center" style={{ color: '#C0392B' }}>{mpError}</p>
            )}

            <div className="flex items-center gap-2">
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD0A8' }} />
              <span style={{ fontSize: '0.7rem', color: '#A0622A' }}>o</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD0A8' }} />
            </div>

            <p style={{ color: '#A0622A', fontSize: '0.75rem' }}>
              * Los precios son orientativos. El pedido se confirma por WhatsApp.
            </p>

            {/* Botón pedir por WhatsApp */}
            <button
              onClick={handlePedirPorWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366', color: '#fff' }}
            >
              {/* WhatsApp SVG oficial */}
              <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>

            {/* Vaciar */}
            <button
              onClick={clearCart}
              className="w-full py-2 text-xs hover:opacity-70 transition-opacity"
              style={{ color: '#A0622A' }}
            >
              Vaciar pedido
            </button>
          </div>
        )}
      </div>
    </>
  )
}
