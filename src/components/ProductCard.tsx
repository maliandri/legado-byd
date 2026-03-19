'use client'

import { MessageCircle, Tag, ShoppingCart, Heart } from 'lucide-react'
import Image from 'next/image'
import type { Producto } from '@/types'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/hooks/useAuth'
import { toggleFavorito } from '@/lib/firebase/usuarios'
import { useState } from 'react'

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'

const categoriaLabel: Record<string, string> = {
  panaderia: '🍞 Panadería',
  pasteleria: '🎂 Pastelería',
  decoracion: '✨ Decoración',
}

interface Props {
  producto: Producto
}

export default function ProductCard({ producto }: Props) {
  const { addItem, setOpen } = useCart()
  const { user, isCustomer, profile, refreshProfile } = useAuth()
  const isFav = profile?.favoritos?.includes(producto.id) ?? false
  const [toggling, setToggling] = useState(false)

  const mensaje = encodeURIComponent(
    `Hola! Me interesa el producto: *${producto.nombre}*. ¿Podrías darme más información?`
  )

  function handleAgregar() {
    addItem(producto)
    setOpen(true)
  }

  async function handleFavorito() {
    if (!isCustomer || !user) { window.location.href = '/login'; return }
    setToggling(true)
    await toggleFavorito(user.uid, producto.id, isFav)
    refreshProfile()
    setToggling(false)
  }

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-sm transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: '#FDF8EE',
        border: '1px solid #DDD0A8',
        boxShadow: '0 2px 8px rgba(61, 26, 5, 0.08)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 8px 32px rgba(61, 26, 5, 0.18)'
        el.style.borderColor = '#C4A040'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 2px 8px rgba(61, 26, 5, 0.08)'
        el.style.borderColor = '#DDD0A8'
      }}
    >
      {/* Imagen */}
      <div
        className="relative overflow-hidden"
        style={{ height: 200, backgroundColor: '#F2E6C8' }}
      >
        {producto.imagen ? (
          <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: '3rem' }}>
              {producto.categoria === 'panaderia' ? '🍞' :
               producto.categoria === 'pasteleria' ? '🎂' : '✨'}
            </span>
            <span style={{ color: '#A0622A', fontSize: '0.75rem' }}>Sin imagen</span>
          </div>
        )}

        {/* Botón favorito */}
        <button
          onClick={handleFavorito}
          disabled={toggling}
          className="absolute top-3 left-3 p-1.5 rounded-full transition-all hover:scale-110"
          style={{ backgroundColor: 'rgba(253,248,238,0.85)', color: isFav ? '#C4A040' : '#A0622A' }}
          title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart size={14} fill={isFav ? '#C4A040' : 'none'} />
        </button>

        {/* Badge stock */}
        <div className="absolute top-3 right-3">
          <span
            className="px-2 py-1 rounded-sm text-xs font-semibold"
            style={
              producto.stock > 0
                ? { backgroundColor: '#C8DEC8', color: '#2A4A2A' }
                : { backgroundColor: '#E8C49A', color: '#6B3A1A' }
            }
          >
            {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Sin stock'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-1 mb-2">
          <Tag size={11} style={{ color: '#A0622A' }} />
          <span style={{ color: '#A0622A', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {categoriaLabel[producto.categoria] || producto.categoria}
          </span>
        </div>

        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#3D1A05',
            fontSize: '1.1rem',
            fontWeight: 600,
            marginBottom: '6px',
            lineHeight: '1.3',
          }}
        >
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p
            style={{ color: '#6B3A1A', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '12px', flexGrow: 1 }}
            className="line-clamp-2"
          >
            {producto.descripcion}
          </p>
        )}

        <div className="mt-auto pt-3" style={{ borderTop: '1px solid #DDD0A8' }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#3D1A05',
              fontSize: '1.3rem',
              fontWeight: 700,
              display: 'block',
              marginBottom: '10px',
            }}
          >
            ${producto.precio.toLocaleString('es-AR')}
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleAgregar}
              disabled={!producto.stock}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
            >
              <ShoppingCart size={12} />
              {producto.stock ? 'Agregar' : 'Sin stock'}
            </button>

            <a
              href={`https://wa.me/${whatsapp}?text=${mensaje}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#4A5E1A', color: '#F2E6C8' }}
            >
              <MessageCircle size={12} />
              Consultar
            </a>
          </div>
        </div>
      </div>

      <div
        className="h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: '#C4A040' }}
      />
    </article>
  )
}
