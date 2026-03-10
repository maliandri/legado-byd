'use client'

import { useState } from 'react'
import { Menu, X, ShoppingBag, MessageCircle } from 'lucide-react'

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'

const categorias = [
  { nombre: 'Panadería', slug: 'panaderia', emoji: '🍞' },
  { nombre: 'Pastelería', slug: 'pasteleria', emoji: '🎂' },
  { nombre: 'Decoración', slug: 'decoracion', emoji: '✨' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

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
          <a href="/" className="flex items-center gap-2 group">
            <ShoppingBag
              size={22}
              style={{ color: '#C4A040' }}
              className="group-hover:scale-110 transition-transform"
            />
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#F2E6C8',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Legado ByD
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
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
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: '#C4A040',
                color: '#3D1A05',
              }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            style={{ color: '#F2E6C8' }}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
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
