'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProducts } from '@/hooks/useProducts'
import AdminGuard from '@/components/admin/AdminGuard'
import ProductTable from '@/components/admin/ProductTable'
import BulkImageUpload from '@/components/admin/BulkImageUpload'
import EmailMasivo from '@/components/admin/EmailMasivo'
import UsuariosPanel from '@/components/admin/UsuariosPanel'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '@/lib/firebase/firestore'
import { LogOut, ShoppingBag, LayoutGrid, RefreshCw, Plus, Pencil, Trash2, FileSpreadsheet, Mail, Users } from 'lucide-react'
import type { Categoria } from '@/types'
import { useEffect } from 'react'

type Tab = 'productos' | 'categorias' | 'emails' | 'usuarios'

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminPanel />
    </AdminGuard>
  )
}

function AdminPanel() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('productos')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCats, setLoadingCats] = useState(true)

  const { productos, loading: loadingProds, refresh } = useProducts()
  const [syncingSheets, setSyncingSheets] = useState(false)
  const [importingSheets, setImportingSheets] = useState(false)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  async function handleGenerarDescripciones() {
    if (!confirm('¿Generar descripciones con IA para todos los productos sin descripción?')) return
    setGeneratingDesc(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/gemini-bulk', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setSyncMsg(data.generados === 0 ? `✓ ${data.mensaje}` : `✓ ${data.generados} descripciones generadas`)
      refresh()
    } catch (err: any) {
      setSyncMsg(`✗ ${err.message}`)
    } finally {
      setGeneratingDesc(false)
      setTimeout(() => setSyncMsg(''), 6000)
    }
  }

  async function handleSyncSheets() {
    setSyncingSheets(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/sync-sheets', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setSyncMsg(`✓ Backup guardado — ${data.filas} productos`)
    } catch (err: any) {
      setSyncMsg(`✗ ${err.message}`)
    } finally {
      setSyncingSheets(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }

  async function handleImportSheets(reset = false) {
    const msg = reset
      ? '⚠️ RESETEAR: borra TODOS los productos de Firestore y los recrea desde la hoja "publico". Las imágenes se pierden. ¿Continuar?'
      : '¿Publicar hoja "publico" a Firestore? Actualiza categoria, marca, subfamilia, precio, IVA y costo.'
    if (!confirm(msg)) return
    setImportingSheets(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/import-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      if (reset) {
        setSyncMsg(`✓ ${data.creados} productos creados desde Sheet`)
      } else {
        setSyncMsg(`✓ ${data.actualizados} actualizados${data.totalNoEncontrados ? ` · ${data.totalNoEncontrados} no encontrados` : ''}`)
      }
      refresh()
    } catch (err: any) {
      setSyncMsg(`✗ ${err.message}`)
    } finally {
      setImportingSheets(false)
      setTimeout(() => setSyncMsg(''), 6000)
    }
  }

  const fetchCategorias = useCallback(async () => {
    setLoadingCats(true)
    try {
      const cats = await getCategorias()
      setCategorias(cats)
    } finally {
      setLoadingCats(false)
    }
  }, [])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const tabStyle = (active: boolean) => ({
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: 600 as const,
    cursor: 'pointer',
    color: active ? '#3D1A05' : '#6B3A1A',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: active ? '3px solid #C4A040' : '3px solid transparent',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9EDD3' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#3D1A05', borderBottom: '3px solid #C4A040' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag size={18} style={{ color: '#C4A040', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#F2E6C8',
                fontWeight: 700,
              }}
              className="text-base sm:text-xl truncate"
            >
              <span className="hidden sm:inline">Legado Bazar y Deco — </span>Admin
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden md:block" style={{ color: '#DDD0A8', fontSize: '0.78rem' }}>{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ border: '1px solid rgba(196,160,64,0.5)', color: '#F2E6C8' }}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ backgroundColor: '#F2E6C8', borderBottom: '1px solid #DDD0A8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <button style={tabStyle(tab === 'productos')} onClick={() => setTab('productos')}>
              <LayoutGrid size={15} className="inline mr-1.5" />
              Productos
            </button>
            <button style={tabStyle(tab === 'categorias')} onClick={() => setTab('categorias')}>
              <ShoppingBag size={15} className="inline mr-1.5" />
              Categorías
            </button>
            <button style={tabStyle(tab === 'emails')} onClick={() => setTab('emails')}>
              <Mail size={15} className="inline mr-1.5" />
              Emails
            </button>
            <button style={tabStyle(tab === 'usuarios')} onClick={() => setTab('usuarios')}>
              <Users size={15} className="inline mr-1.5" />
              Usuarios
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {tab === 'productos' && (
          loadingProds ? (
            <div className="text-center py-16">
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-4 mb-3"
                style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }}
              />
              <p style={{ color: '#6B3A1A' }}>Cargando productos...</p>
            </div>
          ) : (
            <>
              {syncMsg && (
                <div className="mb-3 px-3 py-2 rounded-sm text-sm"
                  style={{ backgroundColor: syncMsg.startsWith('✓') ? '#C8DEC8' : '#F5CAAA', color: '#3D1A05' }}>
                  {syncMsg}
                </div>
              )}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-4">
                <button
                  onClick={handleGenerarDescripciones}
                  disabled={generatingDesc}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#6B3A1A', color: '#F2E6C8' }}
                >
                  {generatingDesc ? <RefreshCw size={13} className="animate-spin" /> : <span style={{ fontSize: '11px' }}>✦</span>}
                  {generatingDesc ? 'Generando...' : 'Descripciones IA'}
                </button>
                <button
                  onClick={() => handleImportSheets(true)}
                  disabled={importingSheets}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#A0622A', color: '#F2E6C8' }}
                >
                  {importingSheets ? <RefreshCw size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                  Resetear
                </button>
                <button
                  onClick={() => handleImportSheets(false)}
                  disabled={importingSheets}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
                >
                  {importingSheets ? <RefreshCw size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                  {importingSheets ? 'Publicando...' : 'Publicar Sheet'}
                </button>
                <button
                  onClick={handleSyncSheets}
                  disabled={syncingSheets}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#4A5E1A', color: '#F2E6C8' }}
                >
                  {syncingSheets ? <RefreshCw size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                  {syncingSheets ? 'Guardando...' : 'Backup Sheet'}
                </button>
              </div>
              <BulkImageUpload productos={productos} onDone={refresh} />
              <ProductTable
                productos={productos}
                categorias={categorias}
                onRefresh={refresh}
              />
            </>
          )
        )}

        {tab === 'categorias' && (
          <CategoriaManager
            categorias={categorias}
            loading={loadingCats}
            onRefresh={fetchCategorias}
          />
        )}

        {tab === 'emails' && <EmailMasivo />}
        {tab === 'usuarios' && <UsuariosPanel />}
      </main>
    </div>
  )
}

// ─── Gestión de categorías ────────────────────────────────────────────────

interface CatManagerProps {
  categorias: Categoria[]
  loading: boolean
  onRefresh: () => void
}

function CategoriaManager({ categorias, loading, onRefresh }: CatManagerProps) {
  const [form, setForm] = useState({ nombre: '', slug: '', emoji: '🍞' })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #DDD0A8',
    borderRadius: '2px',
    backgroundColor: '#FDF8EE',
    color: '#3D1A05',
    fontSize: '0.9rem',
    outline: 'none',
  }

  function startEdit(cat: Categoria) {
    setEditId(cat.id)
    setForm({ nombre: cat.nombre, slug: cat.slug, emoji: cat.emoji })
  }

  function resetForm() {
    setEditId(null)
    setForm({ nombre: '', slug: '', emoji: '🍞' })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.slug.trim()) return setError('Nombre y slug son requeridos.')
    setSaving(true)
    try {
      if (editId) {
        await updateCategoria(editId, form)
      } else {
        await createCategoria(form)
      }
      resetForm()
      onRefresh()
    } catch {
      setError('Error al guardar la categoría.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await deleteCategoria(id)
    onRefresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario */}
      <div
        className="rounded-sm p-5"
        style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#3D1A05',
            fontSize: '1rem',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          {editId ? 'Editar categoría' : 'Nueva categoría'}
        </h3>

        {error && (
          <div
            className="px-3 py-2 rounded-sm text-sm mb-4"
            style={{ backgroundColor: '#F5CAAA', color: '#6B3A1A' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>Emoji</label>
            <input
              style={{ ...inputStyle, width: '60px', textAlign: 'center', fontSize: '1.4rem' }}
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>Nombre</label>
            <input
              style={{ ...inputStyle, width: '100%' }}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '') })}
              placeholder="Ej: Panadería"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6B3A1A' }}>Slug</label>
            <input
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="panaderia"
            />
          </div>
          <div className="flex gap-2 pt-1">
            {editId && (
              <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-sm text-sm" style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}>
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-sm text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
            >
              <Plus size={13} />
              {saving ? 'Guardando...' : editId ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontWeight: 700 }}>
            {categorias.length} categorías
          </h3>
          <button onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm" style={{ border: '1px solid #DDD0A8', color: '#6B3A1A' }}>
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-4" style={{ borderColor: '#DDD0A8', borderTopColor: '#C4A040' }} />
          </div>
        ) : (
          <div className="space-y-2">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-4 py-3 rounded-sm"
                style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#3D1A05' }}>{cat.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#A0622A', fontFamily: 'monospace' }}>{cat.slug}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat)} style={{ color: '#4A5E1A' }} className="p-1.5 hover:opacity-70">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} style={{ color: '#A0622A' }} className="p-1.5 hover:opacity-70">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
