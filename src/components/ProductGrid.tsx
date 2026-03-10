'use client'

import { useState } from 'react'
import ProductCard from './ProductCard'
import CategoryFilter from './CategoryFilter'
import { useProducts } from '@/hooks/useProducts'
import type { Categoria } from '@/types'

interface Props {
  categorias: Categoria[]
}

export default function ProductGrid({ categorias }: Props) {
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const { productos, loading, error } = useProducts(categoriaActiva ?? undefined)

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div
          className="inline-block animate-spin rounded-full h-10 w-10 border-4"
          style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }}
        />
        <p style={{ color: '#6B3A1A', marginTop: '12px', fontFamily: "'Playfair Display', serif" }}>
          Cargando el almacén...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: '#6B3A1A' }}>{error}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-10">
        <CategoryFilter
          categorias={categorias}
          activa={categoriaActiva}
          onChange={setCategoriaActiva}
        />
      </div>

      {/* Grid */}
      {productos.length === 0 ? (
        <div className="py-16 text-center">
          <p style={{ color: '#6B3A1A', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem' }}>
            No hay productos en esta categoría por el momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}
