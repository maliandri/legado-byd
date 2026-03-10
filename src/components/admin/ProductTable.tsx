'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, RefreshCw } from 'lucide-react'
import { deleteProducto } from '@/lib/firebase/firestore'
import ProductForm from './ProductForm'
import type { Producto, Categoria } from '@/types'

interface Props {
  productos: Producto[]
  categorias: Categoria[]
  onRefresh: () => void
}

export default function ProductTable({ productos, categorias, onRefresh }: Props) {
  const [editando, setEditando] = useState<Producto | null>(null)
  const [creando, setCreando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const catMap = Object.fromEntries(categorias.map((c) => [c.slug, c]))

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

  const thStyle = {
    padding: '10px 16px',
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B3A1A',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    borderBottom: '2px solid #C4A040',
  }

  const tdStyle = {
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#3D1A05',
    borderBottom: '1px solid #EDD9A3',
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#3D1A05',
            fontSize: '1.1rem',
            fontWeight: 700,
          }}
        >
          {productos.length} productos
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm transition-opacity hover:opacity-70"
            style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
          >
            <Plus size={14} />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm" style={{ border: '1px solid #DDD0A8' }}>
        <table style={{ width: '100%', backgroundColor: '#FDF8EE', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F2E6C8' }}>
            <tr>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Precio</th>
              <th style={thStyle}>Stock</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: '#A0622A' }}>
                  No hay productos. ¡Agregá el primero!
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} className="hover:bg-[#F9EDD3] transition-colors">
                  <td style={tdStyle}>
                    <div className="flex items-center gap-3">
                      {p.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen} alt={p.nombre} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center text-xl"
                          style={{ backgroundColor: '#F2E6C8' }}
                        >
                          {catMap[p.categoria]?.emoji || '📦'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        {p.descripcion && (
                          <div style={{ color: '#6B3A1A', fontSize: '0.8rem' }} className="line-clamp-1">
                            {p.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      className="px-2 py-1 rounded-sm text-xs font-semibold"
                      style={{ backgroundColor: '#EDD9A3', color: '#3D1A05' }}
                    >
                      {catMap[p.categoria]?.emoji} {catMap[p.categoria]?.nombre || p.categoria}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem' }}>
                    ${p.precio.toLocaleString('es-AR')}
                  </td>
                  <td style={tdStyle}>
                    <span
                      className="px-2 py-1 rounded-sm text-xs font-semibold"
                      style={
                        p.stock
                          ? { backgroundColor: '#C8DEC8', color: '#2A4A2A' }
                          : { backgroundColor: '#F5CAAA', color: '#6B3A1A' }
                      }
                    >
                      {p.stock ? 'Disponible' : 'Sin stock'}
                    </span>
                  </td>
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

      {/* Modal confirmar eliminar */}
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

      {/* Formulario nuevo/editar */}
      {creando && (
        <ProductForm
          categorias={categorias}
          onClose={() => setCreando(false)}
          onSaved={onRefresh}
        />
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
