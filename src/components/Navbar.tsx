'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

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
      style={{ backgroundColor: '#F2E6C8', borderBottom: '3px solid #C4A040' }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-20">

          {/* Logo */}
          <a href="/" className="flex-shrink-0 group">
            <Image
              src="/legado.png"
              alt="Legado"
              width={286}
              height={73}
              className="object-contain group-hover:opacity-90 transition-opacity"
              style={{ maxHeight: 73, width: 'auto', display: 'block' }}
              priority
            />
          </a>

          {/* BAZAR & DECO — centrado absoluto */}
          <span
            className="hidden md:block absolute left-1/2 -translate-x-1/2 pointer-events-none select-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#3D1A05',
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            BAZAR &amp; DECO
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            {categorias.map((cat) => (
              <a key={cat.slug} href={`#${cat.slug}`}
                style={{ color: '#4A5E1A' }}
                className="text-sm font-semibold hover:opacity-70 transition-opacity flex items-center gap-1"
              >
                <span>{cat.emoji}</span>
                <span>{cat.nombre}</span>
              </a>
            ))}

            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ border: '1.5px solid #C4A040', color: '#3D1A05' }}
            >
              <ShoppingCart size={16} />
              <span className="hidden lg:inline">Pedido</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <span style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em' }}>
              BAZAR &amp; DECO
            </span>
            <button onClick={() => setCartOpen(true)} className="relative p-2" style={{ color: '#3D1A05' }}>
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
            <button className="p-2" style={{ color: '#3D1A05' }} onClick={() => setOpen(!open)}>
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ backgroundColor: '#EDD9A3', borderTop: '1px solid #C4A040' }}
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3">
          {categorias.map((cat) => (
            <a key={cat.slug} href={`#${cat.slug}`}
              style={{ color: '#4A5E1A' }}
              className="flex items-center gap-2 py-2 text-sm font-semibold"
              onClick={() => setOpen(false)}>
              <span>{cat.emoji}</span>
              <span>{cat.nombre}</span>
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
