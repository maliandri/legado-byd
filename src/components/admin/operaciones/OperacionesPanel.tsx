'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Search, Printer, X, Package, Truck, CheckCircle, Clock, XCircle, CreditCard, Trash2 } from 'lucide-react'
import type { Order, OrdenEstado } from '@/types'
import OrderReceipt from './OrderReceipt'

const ESTADOS: { value: OrdenEstado | 'todos'; label: string; color: string; bg: string }[] = [
  { value: 'todos',          label: 'Todos',           color: '#6B3A1A', bg: '#F2E6C8' },
  { value: 'pendiente_pago', label: 'Pendiente pago',  color: '#A0622A', bg: '#F5E6D0' },
  { value: 'pagado',         label: 'Pagado',          color: '#2D6A2D', bg: '#C8DEC8' },
  { value: 'en_preparacion', label: 'En preparación',  color: '#4A5E1A', bg: '#D8E8C0' },
  { value: 'enviado',        label: 'Enviado',         color: '#1A3A6A', bg: '#C0D0E8' },
  { value: 'entregado',      label: 'Entregado',       color: '#2D2D2D', bg: '#E0E0E0' },
  { value: 'cancelado',      label: 'Cancelado',       color: '#C0392B', bg: '#F5CAAA' },
]

const ESTADO_ICONS: Record<string, React.ReactNode> = {
  pendiente_pago: <Clock size={12} />,
  pagado:         <CreditCard size={12} />,
  en_preparacion: <Package size={12} />,
  enviado:        <Truck size={12} />,
  entregado:      <CheckCircle size={12} />,
  cancelado:      <XCircle size={12} />,
}

function EstadoBadge({ estado }: { estado: OrdenEstado }) {
  const e = ESTADOS.find(s => s.value === estado) || ESTADOS[0]
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold"
      style={{ backgroundColor: e.bg, color: e.color }}>
      {ESTADO_ICONS[estado]}{e.label}
    </span>
  )
}

export default function OperacionesPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<OrdenEstado | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const receiptRef = useRef<HTMLDivElement>(null)

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (res.ok) setOrders(data.orders)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  function showMsg(text: string, ok = true) {
    setMsg(ok ? `✓ ${text}` : `✗ ${text}`)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleEliminar(orderId: string) {
    if (!confirm('¿Eliminar esta orden? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setSelectedOrder(null)
      showMsg('Orden eliminada')
    } catch {
      showMsg('Error al eliminar', false)
    }
  }

  async function handleCambiarEstado(orderId: string, nuevoEstado: OrdenEstado) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) throw new Error()
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: nuevoEstado } : o))
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, estado: nuevoEstado } : prev)
      showMsg('Estado actualizado')
    } catch {
      showMsg('Error al actualizar', false)
    } finally {
      setUpdatingId(null)
    }
  }

  function handleImprimir() {
    window.print()
  }

  const filtered = orders.filter(o => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      o.nombre_cliente?.toLowerCase().includes(q) ||
      o.email_cliente?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    const matchE = filtroEstado === 'todos' || o.estado === filtroEstado
    return matchQ && matchE
  })

  return (
    <div>
      {msg && (
        <div className="mb-3 px-3 py-2 rounded-sm text-sm"
          style={{ backgroundColor: msg.startsWith('✓') ? '#C8DEC8' : '#F5CAAA', color: '#3D1A05' }}>
          {msg}
        </div>
      )}

      {/* Barra herramientas */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0622A' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, email o N° orden..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-sm"
            style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}
          />
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm"
          style={{ border: '1px solid #DDD0A8', color: '#6B3A1A', backgroundColor: '#FDF8EE' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ESTADOS.map(e => (
          <button key={e.value}
            onClick={() => setFiltroEstado(e.value as any)}
            className="px-3 py-1 rounded-sm text-xs font-semibold transition-all"
            style={{
              backgroundColor: filtroEstado === e.value ? e.color : '#F2E6C8',
              color: filtroEstado === e.value ? '#fff' : e.color,
              border: `1px solid ${e.color}44`,
            }}>
            {e.label} {e.value !== 'todos' && `(${orders.filter(o => o.estado === e.value).length})`}
          </button>
        ))}
      </div>

      <p className="text-xs mb-3" style={{ color: '#A0622A' }}>
        {filtered.length} de {orders.length} orden{orders.length !== 1 ? 'es' : ''}
      </p>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4"
            style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#A0622A' }}>
          {busqueda || filtroEstado !== 'todos' ? 'Sin resultados.' : 'No hay órdenes registradas.'}
        </div>
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block overflow-x-auto rounded-sm" style={{ border: '1px solid #DDD0A8' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide">N° Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide">Canal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id}
                    style={{ backgroundColor: i % 2 === 0 ? '#FDF8EE' : '#F9EDD3', borderBottom: '1px solid #EDD9A3', cursor: 'pointer' }}
                    onClick={() => setSelectedOrder(o)}>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B3A1A' }}>
                        #{o.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontWeight: 600, color: '#3D1A05' }}>{o.nombre_cliente || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B3A1A' }}>{o.email_cliente || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.72rem', color: '#6B3A1A', textTransform: 'capitalize' }}>
                        {o.canal === 'mercadopago' ? '💳 MercadoPago' : '💬 WhatsApp'}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontWeight: 700, color: '#3D1A05' }}>
                      ${o.monto_total.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <EstadoSelector
                        orden={o}
                        updating={updatingId === o.id}
                        onChange={e => handleCambiarEstado(o.id, e)}
                      />
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: '0.75rem', color: '#6B3A1A' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 rounded-sm text-xs font-semibold hover:opacity-80"
                          style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleEliminar(o.id)}
                          className="p-1.5 rounded-sm hover:opacity-80"
                          style={{ backgroundColor: '#F5CAAA', color: '#A0622A' }}
                          title="Eliminar orden">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map(o => (
              <div key={o.id} className="rounded-sm p-4"
                style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}
                onClick={() => setSelectedOrder(o)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#A0622A' }}>
                      #{o.id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, color: '#3D1A05' }}>{o.nombre_cliente || 'Sin nombre'}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#3D1A05' }}>${o.monto_total.toLocaleString('es-AR')}</div>
                </div>
                <div className="flex items-center justify-between">
                  <EstadoBadge estado={o.estado} />
                  <span style={{ fontSize: '0.7rem', color: '#6B3A1A' }}>
                    {o.canal === 'mercadopago' ? '💳' : '💬'} {o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-AR') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          receiptRef={receiptRef}
          onClose={() => setSelectedOrder(null)}
          onCambiarEstado={handleCambiarEstado}
          updating={updatingId === selectedOrder.id}
          onImprimir={handleImprimir}
          onEliminar={handleEliminar}
        />
      )}

      {/* Componente de impresión (oculto en pantalla) */}
      {selectedOrder && (
        <div className="hidden print:block">
          <OrderReceipt ref={receiptRef} order={selectedOrder} />
        </div>
      )}
    </div>
  )
}

// ─── Selector de estado ───────────────────────────────────────────────────────

function EstadoSelector({ orden, updating, onChange }: {
  orden: Order
  updating: boolean
  onChange: (e: OrdenEstado) => void
}) {
  const estados = ESTADOS.filter(e => e.value !== 'todos') as { value: OrdenEstado; label: string; color: string; bg: string }[]
  return (
    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
      {updating ? (
        <RefreshCw size={14} className="animate-spin" style={{ color: '#C4A040' }} />
      ) : (
        <select
          value={orden.estado}
          onChange={e => onChange(e.target.value as OrdenEstado)}
          className="text-xs font-semibold rounded-sm py-1 pl-2 pr-6 appearance-none"
          style={{ border: 'none', outline: 'none', cursor: 'pointer',
            backgroundColor: ESTADOS.find(s => s.value === orden.estado)?.bg || '#F2E6C8',
            color: ESTADOS.find(s => s.value === orden.estado)?.color || '#6B3A1A',
          }}>
          {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      )}
    </div>
  )
}

// ─── Modal detalle ────────────────────────────────────────────────────────────

function OrderDetailModal({ order, receiptRef, onClose, onCambiarEstado, updating, onImprimir, onEliminar }: {
  order: Order
  receiptRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  onCambiarEstado: (id: string, e: OrdenEstado) => void
  updating: boolean
  onImprimir: () => void
  onEliminar: (id: string) => void
}) {
  const estados = ESTADOS.filter(e => e.value !== 'todos') as { value: OrdenEstado; label: string; color: string; bg: string }[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-xl rounded-sm overflow-hidden shadow-xl"
        style={{ backgroundColor: '#F9EDD3', border: '2px solid #C4A040', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: '#3D1A05', borderBottom: '2px solid #C4A040' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontWeight: 700 }}>
              Orden #{order.id.slice(-8).toUpperCase()}
            </h3>
            <p style={{ color: '#DDD0A8', fontSize: '0.72rem' }}>
              {order.canal === 'mercadopago' ? '💳 MercadoPago' : '💬 WhatsApp'} ·{' '}
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#DDD0A8' }} className="hover:opacity-70"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Estado + cambio */}
          <div className="flex items-center gap-3 flex-wrap">
            <EstadoBadge estado={order.estado} />
            <select
              value={order.estado}
              onChange={e => onCambiarEstado(order.id, e.target.value as OrdenEstado)}
              disabled={updating}
              className="text-sm rounded-sm px-3 py-1.5 font-semibold"
              style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}>
              {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            {updating && <RefreshCw size={14} className="animate-spin" style={{ color: '#C4A040' }} />}
          </div>

          {/* Datos del cliente */}
          <div className="rounded-sm p-4" style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#6B3A1A' }}>Cliente</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span style={{ color: '#A0622A', fontSize: '0.72rem' }}>Nombre</span><br />
                <span style={{ fontWeight: 600, color: '#3D1A05' }}>{order.nombre_cliente || '—'}</span></div>
              <div><span style={{ color: '#A0622A', fontSize: '0.72rem' }}>Email</span><br />
                <span style={{ color: '#3D1A05' }}>{order.email_cliente || '—'}</span></div>
              {order.id_transaccion && (
                <div><span style={{ color: '#A0622A', fontSize: '0.72rem' }}>ID Transacción</span><br />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#3D1A05' }}>{order.id_transaccion}</span></div>
              )}
              {order.metodo_pago && (
                <div><span style={{ color: '#A0622A', fontSize: '0.72rem' }}>Método de pago</span><br />
                  <span style={{ color: '#3D1A05', textTransform: 'capitalize' }}>{order.metodo_pago}</span></div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-sm overflow-hidden" style={{ border: '1px solid #DDD0A8' }}>
            <div className="px-4 py-2" style={{ backgroundColor: '#3D1A05' }}>
              <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#F2E6C8' }}>Productos</h4>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5"
                style={{ borderBottom: '1px solid #EDD9A3', backgroundColor: i % 2 === 0 ? '#FDF8EE' : '#F9EDD3' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#3D1A05', fontSize: '0.875rem' }}>{item.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: '#A0622A' }}>{item.cantidad} × ${item.precio.toLocaleString('es-AR')}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#3D1A05' }}>
                  ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3"
              style={{ backgroundColor: '#F2E6C8', borderTop: '2px solid #C4A040' }}>
              <span style={{ fontWeight: 700, color: '#6B3A1A' }}>TOTAL</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '1.2rem', color: '#3D1A05' }}>
                ${order.monto_total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onImprimir}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm font-semibold text-sm hover:opacity-80 transition-opacity"
              style={{ border: '2px solid #3D1A05', color: '#3D1A05', backgroundColor: 'transparent' }}>
              <Printer size={15} />
              Imprimir comprobante
            </button>
            <button onClick={() => onEliminar(order.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-semibold text-sm hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#F5CAAA', color: '#A0622A', border: '2px solid #F5CAAA' }}>
              <Trash2 size={15} />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Receipt oculto para print */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <OrderReceipt ref={receiptRef} order={order} />
      </div>
    </div>
  )
}
