'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { updateProducto } from '@/lib/firebase/firestore'
import type { Producto } from '@/types'

interface Props {
  productos: Producto[]
  onDone: () => void
}

interface FileResult {
  filename: string
  status: 'pending' | 'uploading' | 'matched' | 'unmatched' | 'error'
  mensaje?: string
}

function norm(s: string): string {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function sinExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

export default function BulkImageUpload({ productos, onDone }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<FileResult[]>([])
  const [running, setRunning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(selected: FileList | null) {
    if (!selected) return
    const arr = Array.from(selected).filter(f => f.type.startsWith('image/'))
    setFiles(arr)
    setResults(arr.map(f => ({ filename: f.name, status: 'pending' })))
  }

  function updateResult(index: number, update: Partial<FileResult>) {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...update } : r))
  }

  async function handleUpload() {
    if (!files.length) return
    setRunning(true)

    const productoMap = new Map<string, Producto>()
    for (const p of productos) {
      productoMap.set(norm(p.nombre), p)
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      updateResult(i, { status: 'uploading' })

      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

        const url: string = data.url
        const nombreArchivo = sinExtension(file.name)
        const producto = productoMap.get(norm(nombreArchivo))

        if (!producto) {
          updateResult(i, { status: 'unmatched', mensaje: `Sin coincidencia para "${nombreArchivo}"` })
          continue
        }

        await updateProducto(producto.id, { imagen: url })
        updateResult(i, { status: 'matched', mensaje: `→ ${producto.nombre}` })
      } catch (err: any) {
        updateResult(i, { status: 'error', mensaje: err.message })
      }
    }

    setRunning(false)
    onDone()
  }

  const statusIcon = (s: FileResult['status']) => {
    if (s === 'uploading') return <Loader2 size={14} className="animate-spin" style={{ color: '#C4A040' }} />
    if (s === 'matched')   return <CheckCircle size={14} style={{ color: '#4A5E1A' }} />
    if (s === 'unmatched') return <AlertCircle size={14} style={{ color: '#E8A020' }} />
    if (s === 'error')     return <X size={14} style={{ color: '#A0320A' }} />
    return <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#DDD0A8' }} />
  }

  return (
    <div className="rounded-sm p-5 mb-6" style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>
        Carga masiva de imágenes
      </h3>
      <p style={{ fontSize: '0.8rem', color: '#6B3A1A', marginBottom: '12px' }}>
        Nombrá cada imagen igual al producto (ej: <code>Dispenser 8000ml.jpg</code>) y se asignará automáticamente.
      </p>

      <div
        className="flex flex-col items-center gap-2 p-5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity mb-4"
        style={{ border: '2px dashed #DDD0A8', backgroundColor: '#F2E6C8' }}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <Upload size={22} style={{ color: '#A0622A' }} />
        <span style={{ color: '#6B3A1A', fontSize: '0.85rem' }}>
          Clic o arrastrá una o varias imágenes
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-sm" style={{ backgroundColor: '#F2E6C8' }}>
              {statusIcon(r.status)}
              <span style={{ fontSize: '0.82rem', color: '#3D1A05', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.filename}
              </span>
              {r.mensaje && (
                <span style={{ fontSize: '0.75rem', color: '#6B3A1A', flexShrink: 0 }}>{r.mensaje}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={running}
          className="w-full py-2.5 rounded-sm text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#3D1A05', color: '#F2E6C8' }}
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {running ? 'Subiendo...' : `Subir ${files.length} imagen${files.length > 1 ? 'es' : ''}`}
        </button>
      )}
    </div>
  )
}
