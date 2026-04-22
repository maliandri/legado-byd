'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { getProducto } from '@/lib/firebase/firestore'
import { useCart } from '@/context/CartContext'
import type { Producto } from '@/types'
import Navbar from '@/components/Navbar'

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492994290637'

const categoriaLabel: Record<string, string> = {
  panaderia: '🍞 Panadería',
  pasteleria: '🎂 Pastelería',
  decoracion: '✨ Decoración',
}

export default function ProductoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addItem, setOpen } = useCart()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    getProducto(id).then((p) => {
      setProducto(p)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FDF8EE', minHeight: '100vh' }}>
        <Navbar />
        <div className="flex items-center justify-center" style={{ height: '60vh' }}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }}
            />
            <span style={{ color: '#A0622A', fontFamily: "'Playfair Display', serif" }}>Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div style={{ backgroundColor: '#FDF8EE', minHeight: '100vh' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-4" style={{ height: '60vh' }}>
          <p style={{ color: '#3D1A05', fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>
            Producto no encontrado
          </p>
          <button onClick={() => router.push('/')} style={{ color: '#A0622A', fontSize: '0.9rem' }}>
            ← Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  // Usar array de imágenes si existe, sino caer a la foto principal
  const imagenes = (producto.imagenes && producto.imagenes.length > 0)
    ? producto.imagenes
    : [producto.imagen].filter(Boolean)
  const hasMultiple = imagenes.length > 1
  const imgActual = imagenes[imgIndex] || null

  const mensaje = encodeURIComponent(
    `Hola! Me interesa el producto: *${producto.nombre}* ($${producto.precio.toLocaleString('es-AR')}). ¿Está disponible?`
  )

  function handleAgregar() {
    addItem(producto!)
    setOpen(true)
  }

  return (
    <div style={{ backgroundColor: '#FDF8EE', minHeight: '100vh' }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 mb-6 hover:opacity-70 transition-opacity"
          style={{ color: '#A0622A', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} />
          Volver
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* ── Carrusel de imágenes ── */}
          <div>
            <div
              className="relative overflow-hidden rounded-sm"
              style={{
                backgroundColor: '#F2E6C8',
                border: '1px solid #DDD0A8',
                aspectRatio: '1 / 1',
              }}
            >
              {imgActual ? (
                <Image
                  src={imgActual}
                  alt={producto.nombre}
                  fill
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span style={{ fontSize: '5rem' }}>
                    {producto.categoria === 'panaderia' ? '🍞' :
                     producto.categoria === 'pasteleria' ? '🎂' : '✨'}
                  </span>
                  <span style={{ color: '#A0622A', fontSize: '0.85rem' }}>Sin imagen</span>
                </div>
              )}

              {/* Controles carrusel */}
              {hasMultiple && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => (i - 1 + imagenes.length) % imagenes.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
                    style={{ backgroundColor: 'rgba(253,248,238,0.9)', color: '#3D1A05', boxShadow: '0 2px 8px rgba(61,26,5,0.15)' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i + 1) % imagenes.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
                    style={{ backgroundColor: 'rgba(253,248,238,0.9)', color: '#3D1A05', boxShadow: '0 2px 8px rgba(61,26,5,0.15)' }}
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {imagenes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{ backgroundColor: i === imgIndex ? '#C4A040' : '#DDD0A8' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Miniaturas (si hay múltiples) */}
            {hasMultiple && (
              <div className="flex gap-2 mt-3">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className="relative flex-shrink-0 overflow-hidden rounded-sm transition-all"
                    style={{
                      width: 64, height: 64,
                      border: i === imgIndex ? '2px solid #C4A040' : '2px solid #DDD0A8',
                      backgroundColor: '#F2E6C8',
                    }}
                  >
                    <Image src={img} alt="" fill className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info del producto ── */}
          <div className="flex flex-col">
            {/* Categoría */}
            <span style={{ color: '#A0622A', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {categoriaLabel[producto.categoria] || producto.categoria}
            </span>

            {/* Nombre */}
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#3D1A05',
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                fontWeight: 700,
                lineHeight: 1.2,
                marginTop: '8px',
                marginBottom: '12px',
              }}
            >
              {producto.nombre}
            </h1>

            {/* Stock badge */}
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1 rounded-sm text-sm font-semibold"
                style={
                  producto.stock > 0
                    ? { backgroundColor: '#C8DEC8', color: '#2A4A2A' }
                    : { backgroundColor: '#E8C49A', color: '#6B3A1A' }
                }
              >
                {producto.stock > 0 ? `Stock disponible: ${producto.stock}` : 'Sin stock'}
              </span>
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <p
                style={{
                  color: '#6B3A1A',
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  marginBottom: '24px',
                  flexGrow: 1,
                }}
              >
                {producto.descripcion}
              </p>
            )}

            {/* Separador */}
            <div className="flex items-center gap-2 mb-5">
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD0A8' }} />
              <span style={{ color: '#C4A040', fontSize: '0.7rem' }}>✦</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD0A8' }} />
            </div>

            {/* Precio */}
            <div className="mb-6">
              <span style={{ color: '#A0622A', fontSize: '0.8rem', fontWeight: 600 }}>Precio</span>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#3D1A05',
                  fontSize: '2rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  marginTop: '4px',
                }}
              >
                ${producto.precio.toLocaleString('es-AR')}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${whatsapp}?text=${mensaje}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-4 rounded-sm font-bold text-base transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#25D366', color: '#fff' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar por WhatsApp
              </a>

              {/* Agregar al carrito */}
              <button
                onClick={handleAgregar}
                disabled={!producto.stock}
                className="flex items-center justify-center gap-2 py-3.5 rounded-sm font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
              >
                <ShoppingCart size={16} />
                {producto.stock ? 'Agregar al carrito' : 'Sin stock'}
              </button>
            </div>

            <p style={{ color: '#A0622A', fontSize: '0.75rem', marginTop: '12px', textAlign: 'center' }}>
              * Los precios son orientativos. Se confirman por WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
