'use client'

import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'
import { useProducts } from '@/hooks/useProducts'
import type { Categoria } from '@/types'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'

interface Props {
  categorias: Categoria[]
}

type SortOption = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre-asc' | 'nombre-desc'

interface Filters {
  busqueda: string
  categoria: string | null
  soloConStock: boolean
  precioMin: string
  precioMax: string
  marca: string
}

const FILTERS_DEFAULT: Filters = {
  busqueda: '',
  categoria: null,
  soloConStock: false,
  precioMin: '',
  precioMax: '',
  marca: '',
}

function countActive(f: Filters) {
  let n = 0
  if (f.soloConStock) n++
  if (f.precioMin) n++
  if (f.precioMax) n++
  if (f.marca) n++
  return n
}

export default function ProductGrid({ categorias }: Props) {
  const { productos: todos, loading, error } = useProducts()
  const [filters, setFilters] = useState<Filters>(FILTERS_DEFAULT)
  const [sort, setSort] = useState<SortOption>('relevancia')
  const [showExtra, setShowExtra] = useState(false)

  function setFilter<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }))
  }

  const uniqueMarcas = useMemo(
    () => [...new Set(todos.map(p => p.marca).filter(Boolean))].sort() as string[],
    [todos],
  )

  const result = useMemo(() => {
    let list = [...todos]

    if (filters.categoria) list = list.filter(p => p.categoria === filters.categoria)

    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase()
      list = list.filter(
        p =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q),
      )
    }

    if (filters.soloConStock) list = list.filter(p => p.stock > 0)
    if (filters.precioMin) list = list.filter(p => p.precio >= Number(filters.precioMin))
    if (filters.precioMax) list = list.filter(p => p.precio <= Number(filters.precioMax))
    if (filters.marca) list = list.filter(p => p.marca === filters.marca)

    if (sort === 'precio-asc') list.sort((a, b) => a.precio - b.precio)
    else if (sort === 'precio-desc') list.sort((a, b) => b.precio - a.precio)
    else if (sort === 'nombre-asc') list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    else if (sort === 'nombre-desc') list.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))

    return list
  }, [todos, filters, sort])

  const activeExtra = countActive(filters)
  const hasAnyFilter = !!filters.busqueda || !!filters.categoria || activeExtra > 0

  function clearAll() {
    setFilters(FILTERS_DEFAULT)
    setSort('relevancia')
  }

  const inputBase = {
    padding: '8px 12px',
    border: '1px solid #DDD0A8',
    borderRadius: '4px',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontSize: '0.9rem',
    outline: 'none',
  } as const

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
      {/* ── Barra superior: búsqueda + ordenar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A0622A',
              pointerEvents: 'none',
            }}
          />
          <input
            style={{ ...inputBase, width: '100%', paddingLeft: 36 }}
            value={filters.busqueda}
            onChange={e => setFilter('busqueda', e.target.value)}
            placeholder="Buscar productos..."
          />
          {filters.busqueda && (
            <button
              onClick={() => setFilter('busqueda', '')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#A0622A',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            style={{ ...inputBase, paddingRight: 32, appearance: 'none', cursor: 'pointer', minWidth: 190 }}
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
          >
            <option value="relevancia">Ordenar: Relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nombre-asc">Nombre: A → Z</option>
            <option value="nombre-desc">Nombre: Z → A</option>
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A0622A',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Filtros extras toggle */}
        <button
          onClick={() => setShowExtra(s => !s)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded"
          style={{
            border: `1px solid ${showExtra || activeExtra > 0 ? '#C4A040' : '#DDD0A8'}`,
            backgroundColor: showExtra || activeExtra > 0 ? '#F2E6C8' : 'transparent',
            color: '#3D1A05',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeExtra > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
            >
              {activeExtra}
            </span>
          )}
        </button>
      </div>

      {/* ── Pills de categoría ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter('categoria', null)}
          className="px-5 py-2 rounded-sm text-sm font-semibold transition-all"
          style={
            filters.categoria === null
              ? { backgroundColor: '#3D1A05', color: '#F2E6C8', border: '1px solid #3D1A05' }
              : { backgroundColor: 'transparent', color: '#6B3A1A', border: '1px solid #DDD0A8' }
          }
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setFilter('categoria', cat.slug)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-sm text-sm font-semibold transition-all"
            style={
              filters.categoria === cat.slug
                ? { backgroundColor: '#3D1A05', color: '#F2E6C8', border: '1px solid #3D1A05' }
                : { backgroundColor: 'transparent', color: '#6B3A1A', border: '1px solid #DDD0A8' }
            }
          >
            <span>{cat.emoji}</span>
            <span>{cat.nombre}</span>
          </button>
        ))}
      </div>

      {/* ── Panel de filtros extra ── */}
      {showExtra && (
        <div
          className="mb-6 p-4 rounded-sm"
          style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Precio mín */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B3A1A' }}>
                Precio mínimo
              </label>
              <input
                type="number"
                style={{ ...inputBase, width: '100%' }}
                value={filters.precioMin}
                onChange={e => setFilter('precioMin', e.target.value)}
                placeholder="$0"
                min={0}
              />
            </div>

            {/* Precio máx */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B3A1A' }}>
                Precio máximo
              </label>
              <input
                type="number"
                style={{ ...inputBase, width: '100%' }}
                value={filters.precioMax}
                onChange={e => setFilter('precioMax', e.target.value)}
                placeholder="Sin límite"
                min={0}
              />
            </div>

            {/* Marca */}
            {uniqueMarcas.length > 0 && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B3A1A' }}>
                  Marca
                </label>
                <div className="relative">
                  <select
                    style={{ ...inputBase, width: '100%', paddingRight: 28, appearance: 'none', cursor: 'pointer' }}
                    value={filters.marca}
                    onChange={e => setFilter('marca', e.target.value)}
                  >
                    <option value="">Todas las marcas</option>
                    {uniqueMarcas.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#A0622A',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Solo con stock */}
            <div className="flex flex-col justify-end">
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ color: '#3D1A05', fontSize: '0.9rem', fontWeight: 500 }}
              >
                <input
                  type="checkbox"
                  checked={filters.soloConStock}
                  onChange={e => setFilter('soloConStock', e.target.checked)}
                  className="w-4 h-4 accent-amber-800 cursor-pointer"
                />
                Solo con stock
              </label>
            </div>
          </div>

          {activeExtra > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #DDD0A8' }}>
              <button
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    soloConStock: false,
                    precioMin: '',
                    precioMax: '',
                    marca: '',
                  }))
                }
                className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#A0622A' }}
              >
                <X size={12} />
                Limpiar filtros extra
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Contador + limpiar todo ── */}
      <div className="flex items-center justify-between mb-6">
        <p style={{ color: '#6B3A1A', fontSize: '0.88rem' }}>
          {result.length === todos.length ? (
            <span>{todos.length} productos</span>
          ) : (
            <span>
              <strong style={{ color: '#3D1A05' }}>{result.length}</strong> de {todos.length} productos
            </span>
          )}
        </p>
        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: '#A0622A' }}
          >
            <X size={12} />
            Limpiar todo
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {result.length === 0 ? (
        <div className="py-16 text-center">
          <p
            style={{
              color: '#6B3A1A',
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.1rem',
              marginBottom: 8,
            }}
          >
            No encontramos productos con esos filtros.
          </p>
          <button
            onClick={clearAll}
            className="text-sm underline hover:opacity-70"
            style={{ color: '#A0622A' }}
          >
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {result.map(producto => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}
