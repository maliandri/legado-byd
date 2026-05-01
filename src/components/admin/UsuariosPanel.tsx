'use client'

import { useState, useEffect, useRef } from 'react'
import {
  RefreshCw, Trash2, Ban, CheckCircle, Mail, Package,
  Search, ChevronDown, X, Send, Sparkles, Eye, UserCog
} from 'lucide-react'
import type { Usuario } from '@/types'

type ModalType = 'email' | 'producto' | null

interface SelectedUser {
  uid: string
  email: string
  nombre: string
}

export default function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cliente' | 'empresa' | 'vendedor'>('todos')
  const [msg, setMsg] = useState('')
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)

  async function fetchUsuarios() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      const data = await res.json()
      if (res.ok) setUsuarios(data.usuarios)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [])

  function showMsg(text: string, ok = true) {
    setMsg(ok ? `✓ ${text}` : `✗ ${text}`)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleBloquear(uid: string, bloqueado: boolean) {
    const accion = bloqueado ? 'desbloquear' : 'bloquear'
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} este usuario?`)) return
    try {
      const res = await fetch(`/api/admin/usuarios/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloqueado: !bloqueado }),
      })
      if (!res.ok) throw new Error()
      showMsg(`Usuario ${!bloqueado ? 'bloqueado' : 'desbloqueado'}`)
      setUsuarios(us => us.map(u => u.uid === uid ? { ...u, bloqueado: !bloqueado } : u))
    } catch {
      showMsg('Error al actualizar el usuario', false)
    }
  }

  async function handlePromover(uid: string, tipoActual: string | undefined) {
    const nuevoTipo = tipoActual === 'vendedor' ? 'cliente' : 'vendedor'
    const accion = nuevoTipo === 'vendedor' ? 'promover a Vendedor' : 'quitar rol de Vendedor'
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)}?`)) return
    try {
      const res = await fetch(`/api/admin/usuarios/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: nuevoTipo }),
      })
      if (!res.ok) throw new Error()
      showMsg(`Usuario actualizado a ${nuevoTipo}`)
      setUsuarios(us => us.map(u => u.uid === uid ? { ...u, tipo: nuevoTipo as any } : u))
    } catch {
      showMsg('Error al actualizar el usuario', false)
    }
  }

  async function handleEliminar(uid: string, nombre: string) {
    if (!confirm(`¿Eliminar permanentemente a ${nombre}? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/admin/usuarios/${uid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showMsg('Usuario eliminado')
      setUsuarios(us => us.filter(u => u.uid !== uid))
    } catch {
      showMsg('Error al eliminar el usuario', false)
    }
  }

  function openModal(type: ModalType, user: SelectedUser) {
    setSelectedUser(user)
    setModal(type)
  }

  const filtered = usuarios.filter(u => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchT = filtroTipo === 'todos' || u.tipo === filtroTipo
    return matchQ && matchT
  })

  return (
    <div>
      {/* Mensaje flash */}
      {msg && (
        <div className="mb-3 px-3 py-2 rounded-sm text-sm"
          style={{ backgroundColor: msg.startsWith('✓') ? '#C8DEC8' : '#F5CAAA', color: '#3D1A05' }}>
          {msg}
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A0622A' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-sm"
            style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}
          />
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value as typeof filtroTipo)}
          className="px-3 py-2 text-sm rounded-sm"
          style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}
        >
          <option value="todos">Todos los tipos</option>
          <option value="cliente">Clientes</option>
          <option value="empresa">Empresas</option>
          <option value="vendedor">Vendedores</option>
        </select>
        <button
          onClick={fetchUsuarios}
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm"
          style={{ border: '1px solid #DDD0A8', color: '#6B3A1A', backgroundColor: '#FDF8EE' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Contador */}
      <p className="text-xs mb-3" style={{ color: '#A0622A' }}>
        {filtered.length} de {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
      </p>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4"
            style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#A0622A' }}>
          {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay usuarios registrados.'}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-sm" style={{ border: '1px solid #DDD0A8' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Ciudad</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Perfil</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Registro</th>
                  <th className="px-4 py-3 text-right font-semibold text-xs tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.uid}
                    style={{ backgroundColor: i % 2 === 0 ? '#FDF8EE' : '#F9EDD3', borderBottom: '1px solid #EDD9A3' }}>
                    <td className="px-4 py-3">
                      <div style={{ fontWeight: 600, color: '#3D1A05' }}>{u.nombre || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B3A1A' }}>{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={u.tipo} />
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6B3A1A' }}>
                      {u.ciudad || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.72rem', color: u.perfilCompleto ? '#4A5E1A' : '#A0622A' }}>
                        {u.perfilCompleto ? '✓ Completo' : 'Incompleto'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge bloqueado={u.bloqueado} />
                    </td>
                    <td className="px-4 py-3" style={{ color: '#6B3A1A', fontSize: '0.75rem' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AccionesRow
                        u={u}
                        onBloquear={() => handleBloquear(u.uid, !!u.bloqueado)}
                        onEliminar={() => handleEliminar(u.uid, u.nombre)}
                        onEmail={() => openModal('email', { uid: u.uid, email: u.email, nombre: u.nombre })}
                        onProducto={() => openModal('producto', { uid: u.uid, email: u.email, nombre: u.nombre })}
                        onPromover={() => handlePromover(u.uid, u.tipo)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(u => (
              <div key={u.uid} className="rounded-sm p-4"
                style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div style={{ fontWeight: 600, color: '#3D1A05' }} className="truncate">{u.nombre || '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B3A1A' }} className="truncate">{u.email}</div>
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    <TipoBadge tipo={u.tipo} />
                    <EstadoBadge bloqueado={u.bloqueado} />
                  </div>
                </div>
                {u.ciudad && (
                  <div style={{ fontSize: '0.75rem', color: '#6B3A1A', marginBottom: '8px' }}>
                    📍 {u.ciudad}{u.provincia ? `, ${u.provincia}` : ''}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap mt-3">
                  <ActionButton icon={<Mail size={12} />} label="Email" color="#3D1A05"
                    onClick={() => openModal('email', { uid: u.uid, email: u.email, nombre: u.nombre })} />
                  <ActionButton icon={<Package size={12} />} label="Producto" color="#4A5E1A"
                    onClick={() => openModal('producto', { uid: u.uid, email: u.email, nombre: u.nombre })} />
                  <ActionButton
                    icon={u.bloqueado ? <CheckCircle size={12} /> : <Ban size={12} />}
                    label={u.bloqueado ? 'Desbloquear' : 'Bloquear'}
                    color={u.bloqueado ? '#4A5E1A' : '#A0622A'}
                    onClick={() => handleBloquear(u.uid, !!u.bloqueado)}
                  />
                  <ActionButton
                    icon={<UserCog size={12} />}
                    label={u.tipo === 'vendedor' ? 'Quitar vendedor' : 'Hacer vendedor'}
                    color={u.tipo === 'vendedor' ? '#A0622A' : '#1A3A6A'}
                    onClick={() => handlePromover(u.uid, u.tipo)}
                  />
                  <ActionButton icon={<Trash2 size={12} />} label="Eliminar" color="#C0392B"
                    onClick={() => handleEliminar(u.uid, u.nombre)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modales */}
      {modal === 'email' && selectedUser && (
        <EmailModal user={selectedUser} onClose={() => setModal(null)} onSent={() => showMsg(`Email enviado a ${selectedUser.nombre}`)} />
      )}
      {modal === 'producto' && selectedUser && (
        <ProductoModal user={selectedUser} onClose={() => setModal(null)} onSent={() => showMsg(`Producto enviado a ${selectedUser.nombre}`)} />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo?: string }) {
  if (!tipo) return <span style={{ fontSize: '0.7rem', color: '#A0622A' }}>—</span>
  const bg = tipo === 'empresa' ? '#3D1A05' : tipo === 'vendedor' ? '#1A3A6A' : '#4A5E1A'
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
      backgroundColor: bg, color: '#F2E6C8', textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {tipo}
    </span>
  )
}

function EstadoBadge({ bloqueado }: { bloqueado?: boolean }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
      backgroundColor: bloqueado ? '#C0392B' : '#C8DEC8',
      color: bloqueado ? '#fff' : '#2D6A2D',
    }}>
      {bloqueado ? 'Bloqueado' : 'Activo'}
    </span>
  )
}

function AccionesRow({ u, onBloquear, onEliminar, onEmail, onProducto, onPromover }: {
  u: Usuario
  onBloquear: () => void
  onEliminar: () => void
  onEmail: () => void
  onProducto: () => void
  onPromover: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionIcon icon={<Mail size={13} />} title="Enviar email" color="#3D1A05" onClick={onEmail} />
      <ActionIcon icon={<Package size={13} />} title="Enviar producto" color="#4A5E1A" onClick={onProducto} />
      <ActionIcon
        icon={<UserCog size={13} />}
        title={u.tipo === 'vendedor' ? 'Quitar rol vendedor' : 'Hacer vendedor'}
        color={u.tipo === 'vendedor' ? '#A0622A' : '#1A3A6A'}
        onClick={onPromover}
      />
      <ActionIcon
        icon={u.bloqueado ? <CheckCircle size={13} /> : <Ban size={13} />}
        title={u.bloqueado ? 'Desbloquear' : 'Bloquear'}
        color={u.bloqueado ? '#4A5E1A' : '#A0622A'}
        onClick={onBloquear}
      />
      <ActionIcon icon={<Trash2 size={13} />} title="Eliminar" color="#C0392B" onClick={onEliminar} />
    </div>
  )
}

function ActionIcon({ icon, title, color, onClick }: { icon: React.ReactNode; title: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded-sm hover:opacity-70 transition-opacity"
      style={{ color, border: `1px solid ${color}22`, backgroundColor: `${color}11` }}>
      {icon}
    </button>
  )
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-semibold hover:opacity-80 transition-opacity"
      style={{ backgroundColor: color, color: '#F2E6C8' }}>
      {icon}{label}
    </button>
  )
}

// ─── Modal Email ─────────────────────────────────────────────────────────────

function EmailModal({ user, onClose, onSent }: { user: SelectedUser; onClose: () => void; onSent: () => void }) {
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generando, setGenerando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerar() {
    if (!prompt.trim()) return
    setGenerando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/generar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Para el usuario ${user.nombre}. ${prompt}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error Gemini')
      setAsunto(data.asunto || '')
      setCuerpo(data.cuerpo || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerando(false)
    }
  }

  async function handleEnviar() {
    if (!asunto.trim() || !cuerpo.trim()) return setError('Completá asunto y cuerpo.')
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email, nombre: user.nombre, asunto, cuerpo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      onSent()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose} title={`Email a ${user.nombre}`}>
      <div className="space-y-3">
        <div className="px-4 py-2 rounded-sm text-xs" style={{ backgroundColor: '#F2E6C8', color: '#6B3A1A' }}>
          Para: <strong>{user.email}</strong>
        </div>

        {/* Prompt Gemini */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
            <Sparkles size={11} className="inline mr-1" />Prompt para IA (opcional)
          </label>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerar()}
              placeholder="Ej: Ofrecerle descuento en artículos de deco..."
              className="flex-1 px-3 py-2 text-sm rounded-sm"
              style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}
            />
            <button onClick={handleGenerar} disabled={generando || !prompt.trim()}
              className="px-3 py-2 rounded-sm text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}>
              {generando ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>Asunto</label>
          <input
            value={asunto}
            onChange={e => setAsunto(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-sm"
            style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold" style={{ color: '#6B3A1A' }}>Cuerpo (HTML)</label>
            <button onClick={() => setPreview(!preview)}
              className="flex items-center gap-1 text-xs"
              style={{ color: '#A0622A' }}>
              <Eye size={11} />{preview ? 'Editar' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="rounded-sm border p-3 overflow-auto max-h-48 text-sm"
              style={{ borderColor: '#DDD0A8', backgroundColor: '#fff' }}
              dangerouslySetInnerHTML={{ __html: cuerpo }} />
          ) : (
            <textarea
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-sm font-mono"
              style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none', resize: 'vertical' }}
            />
          )}
        </div>

        {error && <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-sm text-sm"
            style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}>
            Cancelar
          </button>
          <button onClick={handleEnviar} disabled={enviando || !asunto || !cuerpo}
            className="flex-1 py-2 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}>
            {enviando ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            {enviando ? 'Enviando...' : 'Enviar email'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Modal Producto ───────────────────────────────────────────────────────────

function ProductoModal({ user, onClose, onSent }: { user: SelectedUser; onClose: () => void; onSent: () => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [productos, setProductos] = useState<{ id: string; nombre: string; precio: number; imagen: string; descripcion: string }[]>([])
  const [loadingProds, setLoadingProds] = useState(false)
  const [seleccionado, setSeleccionado] = useState<typeof productos[0] | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!busqueda.trim()) { setProductos([]); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoadingProds(true)
      try {
        const res = await fetch(`/api/admin/buscar-productos?q=${encodeURIComponent(busqueda)}`)
        const data = await res.json()
        setProductos(data.productos || [])
      } finally {
        setLoadingProds(false)
      }
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [busqueda])

  async function handleEnviar() {
    if (!seleccionado) return setError('Seleccioná un producto.')
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/enviar-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          nombre: user.nombre,
          producto: seleccionado,
          mensajePersonal: mensaje,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      onSent()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <ModalWrapper onClose={onClose} title={`Enviar producto a ${user.nombre}`}>
      <div className="space-y-3">
        <div className="px-4 py-2 rounded-sm text-xs" style={{ backgroundColor: '#F2E6C8', color: '#6B3A1A' }}>
          Para: <strong>{user.email}</strong>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>Buscar producto</label>
          <input
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setSeleccionado(null) }}
            placeholder="Escribí el nombre del producto..."
            className="w-full px-3 py-2 text-sm rounded-sm"
            style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none' }}
          />
        </div>

        {/* Resultados búsqueda */}
        {loadingProds && (
          <div className="text-center py-3">
            <RefreshCw size={14} className="animate-spin inline" style={{ color: '#C4A040' }} />
          </div>
        )}
        {!loadingProds && productos.length > 0 && !seleccionado && (
          <div className="rounded-sm overflow-hidden max-h-48 overflow-y-auto"
            style={{ border: '1px solid #DDD0A8' }}>
            {productos.map(p => (
              <button key={p.id} onClick={() => setSeleccionado(p)}
                className="w-full text-left px-3 py-2 hover:opacity-80 flex items-center gap-2 text-sm"
                style={{ backgroundColor: '#FDF8EE', borderBottom: '1px solid #EDD9A3', color: '#3D1A05' }}>
                {p.imagen && (
                  <img src={p.imagen} alt="" className="w-8 h-8 object-cover rounded-sm flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: '#A0622A' }}>${p.precio?.toLocaleString('es-AR')}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Producto seleccionado */}
        {seleccionado && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-sm"
            style={{ backgroundColor: '#C8DEC8', border: '1px solid #A0C8A0' }}>
            {seleccionado.imagen && (
              <img src={seleccionado.imagen} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div style={{ fontWeight: 600, color: '#2D6A2D' }} className="truncate">{seleccionado.nombre}</div>
              <div style={{ fontSize: '0.72rem', color: '#4A5E1A' }}>${seleccionado.precio?.toLocaleString('es-AR')}</div>
            </div>
            <button onClick={() => setSeleccionado(null)} style={{ color: '#4A5E1A' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>
            Mensaje personal (opcional)
          </label>
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            rows={3}
            placeholder="Ej: Pensé que este producto te puede interesar..."
            className="w-full px-3 py-2 text-sm rounded-sm"
            style={{ border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE', color: '#3D1A05', outline: 'none', resize: 'vertical' }}
          />
        </div>

        {error && <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-sm text-sm"
            style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}>
            Cancelar
          </button>
          <button onClick={handleEnviar} disabled={enviando || !seleccionado}
            className="flex-1 py-2 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#4A5E1A', color: '#F2E6C8' }}>
            {enviando ? <RefreshCw size={13} className="animate-spin" /> : <Package size={13} />}
            {enviando ? 'Enviando...' : 'Enviar producto'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function ModalWrapper({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-sm overflow-hidden shadow-xl"
        style={{ backgroundColor: '#F9EDD3', border: '2px solid #C4A040', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: '#3D1A05', borderBottom: '2px solid #C4A040' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontWeight: 700, fontSize: '1rem' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: '#DDD0A8' }} className="hover:opacity-70">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
