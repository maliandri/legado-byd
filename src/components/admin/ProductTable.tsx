'use client'

import { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown, X, SlidersHorizontal } from 'lucide-react'
import { deleteProducto } from '@/lib/firebase/firestore'
import ProductForm from './ProductForm'
import type { Producto, Categoria } from '@/types'

interface Props {
  productos: Producto[]
  categorias: Categoria[]
  onRefresh: () => void
}

type SortField = 'nombre' | 'categoria' | 'precio' | 'stock' | 'marca' | 'iva'
type SortDir = 'asc' | 'desc'

interface Filters {
  busqueda: string
  categoria: string
  stock: 'todos' | 'con' | 'sin'
  precioMin: string
  precioMax: string
  marca: string
  subfamilia: string
  iva: string
  sinFoto: boolean
}

const FILTERS_DEFAULT: Filters = {
  busqueda: '',
  categoria: '',
  stock: 'todos',
  precioMin: '',
  precioMax: '',
  marca: '',
  subfamilia: '',
  iva: '',
  sinFoto: false,
}

function countActiveFilters(f: Filters) {
  let n = 0
  if (f.busqueda) n++
  if (f.categoria) n++
  if (f.stock !== 'todos') n++
  if (f.precioMin) n++
  if (f.precioMax) n++
  if (f.marca) n++
  if (f.subfamilia) n++
  if (f.iva) n++
  if (f.sinFoto) n++
  return n
}

export default function ProductTable({ productos, categorias, onRefresh }: Props) {
  const [editando, setEditando] = useState<Producto | null>(null)
  const [creando, setCreando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortField, setSortField] = useState<SortField>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filters, setFilters] = useState<Filters>(FILTERS_DEFAULT)
  const [showFilters, setShowFilters] = useState(false)

  const catMap = useMemo(
    () => Object.fromEntries(categorias.map(c => [c.slug, c])),
    [categorias],
  )

  const uniqueMarcas = useMemo(
    () => [...new Set(productos.map(p => p.marca).filter(Boolean))].sort() as string[],
    [productos],
  )

  const uniqueSubfamilias = useMemo(
    () => [...new Set(productos.map(p => p.subfamilia).filter(Boolean))].sort() as string[],
    [productos],
  )

  const activeFilters = countActiveFilters(filters)

  function setFilter<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }))
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let list = [...productos]

    if (filters.busqueda) {
      const q = filters.busqueda.toLowerCase()
      list = list.filter(
        p =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q),
      )
    }
    if (filters.categoria) list = list.filter(p => p.categoria === filters.categoria)
    if (filters.stock === 'con') list = list.filter(p => p.stock > 0)
    if (filters.stock === 'sin') list = list.filter(p => p.stock === 0)
    if (filters.precioMin) list = list.filter(p => p.precio >= Number(filters.precioMin))
    if (filters.precioMax) list = list.filter(p => p.precio <= Number(filters.precioMax))
    if (filters.marca) list = list.filter(p => p.marca === filters.marca)
    if (filters.subfamilia) list = list.filter(p => p.subfamilia === filters.subfamilia)
    if (filters.iva) list = list.filter(p => String(p.iva ?? '') === filters.iva)
    if (filters.sinFoto) list = list.filter(p => !p.imagen)

    list.sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortField === 'nombre') { va = a.nombre; vb = b.nombre }
      else if (sortField === 'categoria') {
        va = catMap[a.categoria]?.nombre ?? a.categoria
        vb = catMap[b.categoria]?.nombre ?? b.categoria
      }
      else if (sortField === 'precio') { va = a.precio; vb = b.precio }
      else if (sortField === 'stock') { va = a.stock; vb = b.stock }
      else if (sortField === 'marca') { va = a.marca ?? ''; vb = b.marca ?? '' }
      else if (sortField === 'iva') { va = a.iva ?? 0; vb = b.iva ?? 0 }

      if (typeof va === 'string') {
        const cmp = va.localeCompare(vb as string, 'es', { sensitivity: 'base' })
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })

    return list
  }, [productos, filters, sortField, sortDir, catMap])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteProducto(id)
      onRefresh()
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const selectStyle = {
    padding: '6px 8px',
    border: '1px solid #DDD0A8',
    borderRadius: '2px',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontSize: '0.82rem',
    outline: 'none',
  } as const

  const inputStyle = { ...selectStyle, width: '100%' }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.35 }} />
    return sortDir === 'asc'
      ? <ChevronUp size={13} style={{ color: '#C4A040' }} />
      : <ChevronDown size={13} style={{ color: '#C4A040' }} />
  }

  function SortTh({
    field,
    children,
    right,
  }: {
    field: SortField
    children: React.ReactNode
    right?: boolean
  }) {
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          padding: '10px 16px',
          textAlign: right ? 'right' : 'left',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#6B3A1A',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          borderBottom: '2px solid #C4A040',
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <SortIcon field={field} />
        </span>
      </th>
    )
  }

  const tdStyle = {
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#3D1A05',
    borderBottom: '1px solid #EDD9A3',
  } as const

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#3D1A05',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            {filtered.length !== productos.length
              ? `${filtered.length} / ${productos.length} productos`
              : `${productos.length} productos`}
          </h3>
          {activeFilters > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
            >
              {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm transition-opacity hover:opacity-70"
            style={{
              border: `1px solid ${showFilters ? '#C4A040' : '#DDD0A8'}`,
              color: showFilters ? '#3D1A05' : '#6B3A1A',
              backgroundColor: showFilters ? '#F2E6C8' : 'transparent',
            }}
          >
            <SlidersHorizontal size={14} />
            Filtros
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm transition-opacity hover:opacity-70"
            style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>
      </div>

      {/* ── Panel de filtros ── */}
      {showFilters && (
        <div
          className="mb-4 p-4 rounded-sm"
          style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Búsqueda texto */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Buscar
              </label>
              <input
                style={inputStyle}
                value={filters.busqueda}
                onChange={e => setFilter('busqueda', e.target.value)}
                placeholder="Nombre, descripción o marca..."
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Categoría
              </label>
              <select
                style={{ ...selectStyle, width: '100%' }}
                value={filters.categoria}
                onChange={e => setFilter('categoria', e.target.value)}
              >
                <option value="">Todas</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.slug}>
                    {c.emoji} {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Stock
              </label>
              <select
                style={{ ...selectStyle, width: '100%' }}
                value={filters.stock}
                onChange={e => setFilter('stock', e.target.value as Filters['stock'])}
              >
                <option value="todos">Todos</option>
                <option value="con">Con stock</option>
                <option value="sin">Sin stock</option>
              </select>
            </div>

            {/* Precio mín */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Precio mín
              </label>
              <input
                type="number"
                style={inputStyle}
                value={filters.precioMin}
                onChange={e => setFilter('precioMin', e.target.value)}
                placeholder="0"
                min={0}
              />
            </div>

            {/* Precio máx */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Precio máx
              </label>
              <input
                type="number"
                style={inputStyle}
                value={filters.precioMax}
                onChange={e => setFilter('precioMax', e.target.value)}
                placeholder="∞"
                min={0}
              />
            </div>

            {/* Marca */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Marca
              </label>
              <select
                style={{ ...selectStyle, width: '100%' }}
                value={filters.marca}
                onChange={e => setFilter('marca', e.target.value)}
              >
                <option value="">Todas</option>
                {uniqueMarcas.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Subfamilia */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                Subfamilia
              </label>
              <select
                style={{ ...selectStyle, width: '100%' }}
                value={filters.subfamilia}
                onChange={e => setFilter('subfamilia', e.target.value)}
              >
                <option value="">Todas</option>
                {uniqueSubfamilias.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* IVA */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
                IVA
              </label>
              <select
                style={{ ...selectStyle, width: '100%' }}
                value={filters.iva}
                onChange={e => setFilter('iva', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="10.5">10,5%</option>
                <option value="21">21%</option>
              </select>
            </div>

            {/* Sin foto */}
            <div className="flex flex-col justify-end pb-1">
              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                style={{ color: '#3D1A05', fontSize: '0.85rem', fontWeight: 500 }}
              >
                <input
                  type="checkbox"
                  checked={filters.sinFoto}
                  onChange={e => setFilter('sinFoto', e.target.checked)}
                  className="w-4 h-4 accent-amber-800 cursor-pointer"
                />
                Solo sin foto
              </label>
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setFilters(FILTERS_DEFAULT)}
                className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#A0622A' }}
              >
                <X size={12} />
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="overflow-x-auto rounded-sm" style={{ border: '1px solid #DDD0A8' }}>
        <table style={{ width: '100%', backgroundColor: '#FDF8EE', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F2E6C8' }}>
            <tr>
              <SortTh field="nombre">Producto</SortTh>
              <SortTh field="categoria">Categoría</SortTh>
              <SortTh field="marca">Marca</SortTh>
              <SortTh field="precio">Precio</SortTh>
              <SortTh field="stock">Stock</SortTh>
              <SortTh field="iva">IVA</SortTh>
              <th
                style={{
                  padding: '10px 16px',
                  textAlign: 'right',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#6B3A1A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '2px solid #C4A040',
                }}
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: '#A0622A' }}
                >
                  {productos.length === 0
                    ? 'No hay productos. ¡Agregá el primero!'
                    : 'No hay productos que coincidan con los filtros.'}
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#F9EDD3] transition-colors">
                  {/* Nombre */}
                  <td style={tdStyle}>
                    <div className="flex items-center gap-3">
                      {p.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          className="w-10 h-10 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: '#F2E6C8' }}
                        >
                          {catMap[p.categoria]?.emoji || '📦'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div style={{ fontWeight: 600 }} className="truncate max-w-[180px]">
                          {p.nombre}
                        </div>
                        {p.subfamilia && (
                          <div style={{ color: '#A0622A', fontSize: '0.75rem' }}>{p.subfamilia}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td style={tdStyle}>
                    <span
                      className="px-2 py-1 rounded-sm text-xs font-semibold whitespace-nowrap"
                      style={{ backgroundColor: '#EDD9A3', color: '#3D1A05' }}
                    >
                      {catMap[p.categoria]?.emoji} {catMap[p.categoria]?.nombre || p.categoria}
                    </span>
                  </td>

                  {/* Marca */}
                  <td style={{ ...tdStyle, fontSize: '0.82rem', color: '#6B3A1A' }}>
                    {p.marca || <span style={{ color: '#C4A040' }}>—</span>}
                  </td>

                  {/* Precio */}
                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 700,
                      fontSize: '1rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ${p.precio.toLocaleString('es-AR')}
                  </td>

                  {/* Stock */}
                  <td style={tdStyle}>
                    <span
                      className="px-2 py-1 rounded-sm text-xs font-semibold whitespace-nowrap"
                      style={
                        p.stock > 0
                          ? { backgroundColor: '#C8DEC8', color: '#2A4A2A' }
                          : { backgroundColor: '#F5CAAA', color: '#6B3A1A' }
                      }
                    >
                      {p.stock > 0 ? `${p.stock} u.` : 'Sin stock'}
                    </span>
                  </td>

                  {/* IVA */}
                  <td style={{ ...tdStyle, fontSize: '0.82rem', color: '#6B3A1A', whiteSpace: 'nowrap' }}>
                    {p.iva ? `${String(p.iva).replace('.', ',')}%` : <span style={{ color: '#C4A040' }}>—</span>}
                  </td>

                  {/* Acciones */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditando(p)}
                        className="p-1.5 rounded hover:opacity-70 transition-opacity"
                        style={{ color: '#4A5E1A' }}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="p-1.5 rounded hover:opacity-70 transition-opacity"
                        style={{ color: '#A0622A' }}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal confirmar eliminar ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(61,26,5,0.6)' }}
        >
          <div
            className="w-full max-w-sm rounded-sm p-6"
            style={{ backgroundColor: '#FDF8EE', border: '2px solid #C4A040' }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#3D1A05',
                fontSize: '1.15rem',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              ¿Eliminar producto?
            </h3>
            <p style={{ color: '#6B3A1A', fontSize: '0.9rem', marginBottom: '20px' }}>
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-sm text-sm font-semibold"
                style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="flex-1 py-2 rounded-sm text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: '#A0622A', color: '#FDF8EE' }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulario nuevo/editar ── */}
      {creando && (
        <ProductForm categorias={categorias} onClose={() => setCreando(false)} onSaved={onRefresh} />
      )}
      {editando && (
        <ProductForm
          producto={editando}
          categorias={categorias}
          onClose={() => setEditando(null)}
          onSaved={onRefresh}
        />
      )}
    </>
  )
}
