'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Plus, Minus, Trash2, QrCode, RefreshCw, CheckCircle, X, ShoppingCart, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { getProductos } from '@/lib/firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import type { Producto } from '@/types'

interface CartItem {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  imagen?: string
}

type PanelState = 'carrito' | 'qr' | 'pagado'

export default function VendedorPanel() {
  const { user, profile } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loadingProds, setLoadingProds] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [clienteAltura, setClienteAltura] = useState('')
  const [clienteProvincia, setClienteProvincia] = useState('')
  const [state, setState] = useState<PanelState>('carrito')
  const [initPoint, setInitPoint] = useState('')
  const [ordenId, setOrdenId] = useState('')
  const [generando, setGenerando] = useState(false)
  const [msg, setMsg] = useState('')
  const [viewMode, setViewMode] = useState<'lista' | 'galeria'>('galeria')
  const [sortBy, setSortBy] = useState<'nombre' | 'precio-asc' | 'precio-desc' | 'stock-desc'>('nombre')
  const [soloConStock, setSoloConStock] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch(console.error)
      .finally(() => setLoadingProds(false))
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const filtered = useMemo(() => {
    let list = busqueda
      ? productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      : [...productos]
    if (soloConStock) list = list.filter(p => p.stock > 0)
    if (sortBy === 'precio-asc') list.sort((a, b) => a.precio - b.precio)
    else if (sortBy === 'precio-desc') list.sort((a, b) => b.precio - a.precio)
    else if (sortBy === 'stock-desc') list.sort((a, b) => b.stock - a.stock)
    else list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return busqueda ? list : list.slice(0, 80)
  }, [productos, busqueda, sortBy, soloConStock])

  const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0)

  function addToCart(p: Producto) {
    setCart(prev => {
      const ex = prev.find(i => i.productoId === p.id)
      if (ex) return prev.map(i => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, imagen: p.imagen }]
    })
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) setCart(prev => prev.filter(i => i.productoId !== id))
    else setCart(prev => prev.map(i => i.productoId === id ? { ...i, cantidad: qty } : i))
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(i => i.productoId !== id))
  }

  function startPolling(ordId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/vendedor/estado-pago/${ordId}`)
        const data = await res.json()
        if (data.pagado) {
          clearInterval(pollRef.current!)
          setState('pagado')
        }
      } catch { /* ignore */ }
    }, 3000)
  }

  async function handleGenerarQR() {
    if (cart.length === 0) { setMsg('Agregá al menos un producto'); return }
    setGenerando(true)
    setMsg('')
    try {
      const res = await fetch('/api/mercadopago/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'anonimo',
          email: null,
          nombre: clienteNombre || null,
          telefono: clienteTelefono || null,
          direccion: clienteDireccion || null,
          altura: clienteAltura || null,
          provincia: clienteProvincia || null,
          items: cart,
          vendedorId: user?.uid,
          vendedorNombre: profile?.nombre || user?.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear preferencia')
      setInitPoint(data.init_point)
      setOrdenId(data.ordenId)
      setState('qr')
      startPolling(data.ordenId)
    } catch (err: any) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setGenerando(false)
    }
  }

  function handleNuevaVenta() {
    if (pollRef.current) clearInterval(pollRef.current)
    setCart([])
    setClienteNombre('')
    setClienteTelefono('')
    setClienteDireccion('')
    setClienteAltura('')
    setClienteProvincia('')
    setInitPoint('')
    setOrdenId('')
    setState('carrito')
    setMsg('')
  }

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #DDD0A8',
    borderRadius: '4px',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  } as const

  // ── ESTADO PAGADO ──
  if (state === 'pagado') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <CheckCircle size={72} style={{ color: '#4A5E1A', marginBottom: 16 }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>
          ¡Pago confirmado!
        </h2>
        <p style={{ color: '#6B3A1A', marginBottom: 8 }}>
          Total cobrado: <strong style={{ fontSize: '1.3rem' }}>${total.toLocaleString('es-AR')}</strong>
        </p>
        {clienteNombre && (
          <p style={{ color: '#6B3A1A', marginBottom: 24 }}>Cliente: {clienteNombre}</p>
        )}
        <button
          onClick={handleNuevaVenta}
          className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold text-sm hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
        >
          <ShoppingCart size={16} />
          Nueva venta
        </button>
      </div>
    )
  }

  // ── ESTADO QR ──
  if (state === 'qr') {
    return (
      <div className="flex flex-col items-center px-4 py-6 max-w-sm mx-auto text-center">
        <div className="flex items-center gap-2 mb-4">
          <QrCode size={20} style={{ color: '#C4A040' }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.3rem', fontWeight: 700 }}>
            Mostrar al cliente
          </h2>
        </div>

        <p style={{ color: '#6B3A1A', fontSize: '0.85rem', marginBottom: 20 }}>
          El cliente escanea el QR con su teléfono y paga con MercadoPago.
        </p>

        <div className="p-4 rounded-sm mb-4" style={{ backgroundColor: 'white', border: '3px solid #C4A040' }}>
          <QRCodeSVG value={initPoint} size={220} level="M" />
        </div>

        <div className="mb-4 p-3 rounded-sm w-full" style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B3A1A', marginBottom: 4 }}>Total a cobrar</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 800, color: '#3D1A05' }}>
            ${total.toLocaleString('es-AR')}
          </div>
          {clienteNombre && (
            <div style={{ fontSize: '0.8rem', color: '#6B3A1A', marginTop: 4 }}>Cliente: {clienteNombre}</div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: '#A0622A' }}>
          <RefreshCw size={13} className="animate-spin" />
          Esperando confirmación de pago...
        </div>

        <div className="flex gap-2 w-full">
          <a
            href={initPoint}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2.5 rounded-sm text-sm font-semibold hover:opacity-80"
            style={{ border: '1px solid #C4A040', color: '#3D1A05' }}
          >
            Abrir en browser
          </a>
          <button
            onClick={handleNuevaVenta}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-sm"
            style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}
          >
            <X size={13} />
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // ── ESTADO CARRITO ──
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 max-w-5xl mx-auto">

      {/* Panel izquierdo: productos */}
      <div className="lg:col-span-3">
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>
          Elegir productos
        </h3>

        {/* Búsqueda + toggle vista */}
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#A0622A', pointerEvents: 'none' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 32 }}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
            />
          </div>
          <button
            onClick={() => setViewMode(v => v === 'lista' ? 'galeria' : 'lista')}
            className="flex-shrink-0 flex items-center justify-center px-3 rounded-sm transition-all"
            style={{
              border: `1px solid ${viewMode === 'galeria' ? '#C4A040' : '#DDD0A8'}`,
              backgroundColor: viewMode === 'galeria' ? '#F2E6C8' : 'transparent',
              color: '#3D1A05',
            }}
            title={viewMode === 'galeria' ? 'Vista lista' : 'Vista galería'}
          >
            {viewMode === 'galeria' ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>
        </div>

        {/* Filtros: orden + solo con stock */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 140 }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{ ...inputStyle, width: '100%', paddingRight: 28, appearance: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '6px 28px 6px 10px' }}
            >
              <option value="nombre">A → Z</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="stock-desc">Mayor stock primero</option>
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#A0622A', pointerEvents: 'none' }} />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap" style={{ fontSize: '0.8rem', color: '#3D1A05', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={soloConStock}
              onChange={e => setSoloConStock(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-800"
            />
            Con stock
          </label>
        </div>

        <div className="rounded-sm overflow-hidden" style={{ border: '1px solid #DDD0A8', maxHeight: 420, overflowY: 'auto' }}>
          {loadingProds ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4"
                style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-sm" style={{ color: '#A0622A' }}>Sin resultados</div>
          ) : viewMode === 'galeria' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-1" style={{ backgroundColor: '#EDD9A3' }}>
              {filtered.map(p => (
                <button
                  key={p.id}
                  disabled={p.stock === 0}
                  onClick={() => p.stock > 0 && addToCart(p)}
                  className="relative overflow-hidden disabled:opacity-50"
                  style={{ aspectRatio: '1 / 1', backgroundColor: '#F2E6C8' }}
                >
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">📦</div>
                  )}
                  <div
                    className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-1.5 pb-1.5 pt-6"
                    style={{ background: 'linear-gradient(to top, rgba(20,8,0,0.85) 0%, transparent 100%)' }}
                  >
                    <p className="text-white font-semibold leading-tight line-clamp-2 text-left"
                      style={{ fontSize: '0.68rem' }}>
                      {p.nombre}
                    </p>
                    <p className="font-bold text-left" style={{ fontSize: '0.72rem', color: '#F2CC6B' }}>
                      ${p.precio.toLocaleString('es-AR')}
                    </p>
                  </div>
                  {p.stock === 0 && (
                    <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-white"
                      style={{ backgroundColor: 'rgba(160,98,42,0.85)', fontSize: '0.55rem', fontWeight: 700 }}>
                      SIN STOCK
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            filtered.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderBottom: '1px solid #EEE0C0', backgroundColor: '#FDF8EE' }}
                onClick={() => p.stock > 0 && addToCart(p)}
              >
                {p.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imagen} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: '#F2E6C8' }}>📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '0.875rem', color: '#3D1A05', fontWeight: 600 }} className="truncate">{p.nombre}</div>
                  <div style={{ fontSize: '0.78rem', color: p.stock > 0 ? '#4A5E1A' : '#A0622A' }}>
                    ${p.precio.toLocaleString('es-AR')} · {p.stock > 0 ? `${p.stock} en stock` : 'Sin stock'}
                  </div>
                </div>
                <button
                  disabled={p.stock === 0}
                  className="flex-shrink-0 p-1.5 rounded-full disabled:opacity-30"
                  style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
                  onClick={e => { e.stopPropagation(); p.stock > 0 && addToCart(p) }}
                >
                  <Plus size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel derecho: carrito */}
      <div className="lg:col-span-2">
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>
          Carrito {cart.length > 0 && <span style={{ color: '#C4A040' }}>({cart.length})</span>}
        </h3>

        {/* Datos del cliente y entrega */}
        <div className="mb-3 flex flex-col gap-2">
          <input style={inputStyle} value={clienteNombre}
            onChange={e => setClienteNombre(e.target.value)}
            placeholder="Nombre del cliente (opcional)" />
          <input style={inputStyle} value={clienteTelefono}
            onChange={e => setClienteTelefono(e.target.value)}
            placeholder="Teléfono" inputMode="tel" />
          <div className="flex gap-2">
            <input style={{ ...inputStyle, flex: 2 }} value={clienteDireccion}
              onChange={e => setClienteDireccion(e.target.value)}
              placeholder="Dirección (calle)" />
            <input style={{ ...inputStyle, flex: 1 }} value={clienteAltura}
              onChange={e => setClienteAltura(e.target.value)}
              placeholder="Altura" />
          </div>
          <input style={inputStyle} value={clienteProvincia}
            onChange={e => setClienteProvincia(e.target.value)}
            placeholder="Localidad / Provincia" />
        </div>

        {/* Items */}
        <div className="rounded-sm overflow-hidden mb-3" style={{ border: '1px solid #DDD0A8', minHeight: 120 }}>
          {cart.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: '#A0622A' }}>
              Agregá productos desde la lista
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productoId} className="flex items-center gap-2 px-3 py-2.5"
                style={{ borderBottom: '1px solid #EEE0C0', backgroundColor: '#FDF8EE' }}>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#3D1A05' }} className="truncate">{item.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6B3A1A' }}>${item.precio.toLocaleString('es-AR')} c/u</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setQty(item.productoId, item.cantidad - 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}>
                    <Minus size={10} />
                  </button>
                  <span style={{ minWidth: 22, textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>{item.cantidad}</span>
                  <button onClick={() => setQty(item.productoId, item.cantidad + 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}>
                    <Plus size={10} />
                  </button>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#3D1A05', minWidth: 64, textAlign: 'right' }}>
                  ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </div>
                <button onClick={() => removeItem(item.productoId)} style={{ color: '#A0622A' }} className="hover:opacity-70 ml-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        {cart.length > 0 && (
          <div className="flex justify-between items-center px-3 py-2.5 rounded-sm mb-3"
            style={{ backgroundColor: '#F2E6C8', border: '2px solid #C4A040' }}>
            <span style={{ fontWeight: 700, color: '#6B3A1A' }}>TOTAL</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '1.4rem', color: '#3D1A05' }}>
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
        )}

        {msg && (
          <div className="px-3 py-2 rounded-sm text-sm mb-3"
            style={{ backgroundColor: '#F5CAAA', color: '#3D1A05' }}>
            {msg}
          </div>
        )}

        <button
          onClick={handleGenerarQR}
          disabled={cart.length === 0 || generando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-sm font-semibold text-sm disabled:opacity-40 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
        >
          {generando ? <RefreshCw size={15} className="animate-spin" /> : <QrCode size={15} />}
          {generando ? 'Generando...' : 'Generar QR de cobro'}
        </button>
      </div>
    </div>
  )
}
