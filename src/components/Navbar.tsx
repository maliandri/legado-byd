'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, X, ShoppingCart, MessageCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'

const categorias = [
  { nombre: 'Panadería', slug: 'panaderia', emoji: '🍞' },
  { nombre: 'Pastelería', slug: 'pasteleria', emoji: '🎂' },
  { nombre: 'Decoración', slug: 'decoracion', emoji: '✨' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { totalItems, setOpen: setCartOpen } = useCart()

  return (
    <nav
      style={{
        backgroundColor: '#3D1A05',
        borderBottom: '3px solid #C4A040',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Image
              src="/legado.png"
              alt="Legado Bazar y Deco"
              width={120}
              height={44}
              className="object-contain group-hover:opacity-90 transition-opacity"
              style={{ maxHeight: 44 }}
              priority
            />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            {categorias.map((cat) => (
              <a
                key={cat.slug}
                href={`#${cat.slug}`}
                style={{ color: '#F2E6C8' }}
                className="text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                <span>{cat.emoji}</span>
                <span>{cat.nombre}</span>
              </a>
            ))}

            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
            >
              {/* WhatsApp SVG oficial */}
              <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>

            {/* Botón carrito */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold transition-all hover:opacity-90"
              style={{ border: '1.5px solid rgba(196,160,64,0.6)', color: '#F2E6C8' }}
              aria-label="Ver pedido"
            >
              <ShoppingCart size={16} />
              <span className="hidden lg:inline">Pedido</span>
              {totalItems > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: carrito + menú */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2"
              style={{ color: '#F2E6C8' }}
              aria-label="Ver pedido"
            >
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span
                  className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            <button
              className="p-2"
              style={{ color: '#F2E6C8' }}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{ backgroundColor: '#4A2C0A', borderTop: '1px solid #C4A040' }}
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3"
        >
          {categorias.map((cat) => (
            <a
              key={cat.slug}
              href={`#${cat.slug}`}
              style={{ color: '#F2E6C8' }}
              className="flex items-center gap-2 py-2 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <span>{cat.emoji}</span>
              <span>{cat.nombre}</span>
            </a>
          ))}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-sm text-sm font-semibold text-center justify-center mt-2"
            style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
          >
            <MessageCircle size={16} />
            Consultar por WhatsApp
          </a>
        </div>
      )}
    </nav>
  )
}
