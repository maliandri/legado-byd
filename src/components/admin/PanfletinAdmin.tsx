'use client'

import { useState, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Search, Package, X, Loader2, Download, Plus, Trash2 } from 'lucide-react'

// ── Tipos ────────────────────────────────────────────────────────────────────

type Formato = 'a4' | 'carta' | 'dos-por-uno'
type Plantilla = 'clasica' | 'moderna' | 'minimalista'

interface ProductoItem {
  id: string
  nombre: string
  precio: number
  imagen?: string
}

interface PanfletConfig {
  titulo: string
  subtitulo: string
  textoPromo: string
  mostrarQR: boolean
  mostrarProductos: boolean
  mostrarContacto: boolean
  mostrarInstagram: boolean
  mostrarWeb: boolean
  productos: ProductoItem[]
  formato: Formato
  plantilla: Plantilla
}

const APP_URL = 'https://legadobyd.com'

const FORMATO_DIMS: Record<Formato, { w: number; h: number; label: string }> = {
  'a4':          { w: 794, h: 1123, label: 'A4 (210×297 mm)' },
  'carta':       { w: 816, h: 1056, label: 'Carta (215×279 mm)' },
  'dos-por-uno': { w: 1123, h: 794, label: '2×1 Horizontal (A4 apaisado)' },
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PanfletinAdmin() {
  const [config, setConfig] = useState<PanfletConfig>({
    titulo: 'Legado Bazar y Deco',
    subtitulo: 'Insumos para panaderos, pasteleros y decoradores',
    textoPromo: '',
    mostrarQR: true,
    mostrarProductos: true,
    mostrarContacto: true,
    mostrarInstagram: true,
    mostrarWeb: true,
    productos: [],
    formato: 'a4',
    plantilla: 'clasica',
  })

  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ProductoItem[]>([])
  const [buscando, setBuscando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const set = useCallback((patch: Partial<PanfletConfig>) => setConfig(c => ({ ...c, ...patch })), [])

  function buscarProductos(q: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setResultados([]); return }
    setBuscando(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/buscar-productos?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        setResultados(Array.isArray(data) ? data.filter((p: ProductoItem) => !config.productos.find(x => x.id === p.id)) : [])
      } catch {}
      finally { setBuscando(false) }
    }, 300)
  }

  function agregarProducto(p: ProductoItem) {
    if (config.productos.length >= 6) return
    set({ productos: [...config.productos, p] })
    setQuery('')
    setResultados([])
  }

  function quitarProducto(id: string) {
    set({ productos: config.productos.filter(p => p.id !== id) })
  }

  async function handleExport() {
    if (!previewRef.current) return
    setExportando(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const dims = FORMATO_DIMS[config.formato]
      const isLandscape = config.formato === 'dos-por-uno'

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#F9EDD3',
        width: dims.w,
        height: dims.h,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: config.formato === 'carta' ? 'letter' : 'a4',
      })

      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
      pdf.save(`legado-panfleto-${config.formato}.pdf`)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExportando(false)
    }
  }

  const dims = FORMATO_DIMS[config.formato]
  const scale = config.formato === 'dos-por-uno' ? 0.42 : 0.48

  const inputStyle = {
    width: '100%', padding: '7px 10px', borderRadius: 3,
    border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE',
    color: '#3D1A05', fontSize: '0.85rem', outline: 'none',
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
      <div className="mb-5">
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700 }}>
          Panfletín con QR
        </h2>
        <p style={{ color: '#A0622A', fontSize: '0.85rem', marginTop: 4 }}>
          Diseñá un panfleto con QR y exportalo en PDF listo para imprimir.
        </p>
      </div>

      <div className="flex gap-6 items-start" style={{ flexWrap: 'wrap' }}>

        {/* ── Panel de controles ── */}
        <div style={{ flex: '0 0 300px', minWidth: 260 }}>

          {/* Formato */}
          <Section titulo="Formato">
            <div className="flex flex-col gap-1.5">
              {(Object.entries(FORMATO_DIMS) as [Formato, typeof FORMATO_DIMS[Formato]][]).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.85rem', color: '#3D1A05' }}>
                  <input type="radio" name="formato" value={k} checked={config.formato === k}
                    onChange={() => set({ formato: k })} className="accent-amber-800" />
                  {v.label}
                </label>
              ))}
            </div>
          </Section>

          {/* Plantilla */}
          <Section titulo="Plantilla">
            <div className="flex gap-2 flex-wrap">
              {(['clasica', 'moderna', 'minimalista'] as Plantilla[]).map(p => (
                <button key={p} onClick={() => set({ plantilla: p })}
                  className="px-3 py-1 rounded-sm text-xs font-semibold capitalize transition-all"
                  style={{
                    backgroundColor: config.plantilla === p ? '#3D1A05' : '#FDF8EE',
                    color: config.plantilla === p ? '#C4A040' : '#6B3A1A',
                    border: '1px solid #DDD0A8',
                  }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </Section>

          {/* Textos */}
          <Section titulo="Textos">
            <div className="flex flex-col gap-2">
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6B3A1A', fontWeight: 600 }}>Título</label>
                <input style={inputStyle} value={config.titulo}
                  onChange={e => set({ titulo: e.target.value })} placeholder="Título principal" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6B3A1A', fontWeight: 600 }}>Subtítulo</label>
                <input style={inputStyle} value={config.subtitulo}
                  onChange={e => set({ subtitulo: e.target.value })} placeholder="Subtítulo" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6B3A1A', fontWeight: 600 }}>Texto promocional</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64, fontFamily: 'inherit' }}
                  value={config.textoPromo}
                  onChange={e => set({ textoPromo: e.target.value })}
                  placeholder="Ej: ¡Oferta de temporada! 20% off en toda la línea de decoración..." />
              </div>
            </div>
          </Section>

          {/* Secciones visibles */}
          <Section titulo="Mostrar">
            <div className="flex flex-col gap-1.5">
              {[
                ['mostrarQR', 'Código QR'],
                ['mostrarProductos', 'Productos'],
                ['mostrarContacto', 'WhatsApp'],
                ['mostrarInstagram', 'Instagram'],
                ['mostrarWeb', 'Sitio web'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.85rem', color: '#3D1A05' }}>
                  <input type="checkbox" checked={config[key as keyof PanfletConfig] as boolean}
                    onChange={e => set({ [key]: e.target.checked } as any)}
                    className="w-3.5 h-3.5 accent-amber-800" />
                  {label}
                </label>
              ))}
            </div>
          </Section>

          {/* Productos */}
          {config.mostrarProductos && (
            <Section titulo={`Productos (${config.productos.length}/6)`}>
              <div className="relative mb-2">
                <div className="flex items-center gap-2" style={{ ...inputStyle, padding: '7px 10px' }}>
                  <Search size={13} style={{ color: '#A0622A', flexShrink: 0 }} />
                  <input value={query} onChange={e => { setQuery(e.target.value); buscarProductos(e.target.value) }}
                    placeholder="Buscar producto..."
                    disabled={config.productos.length >= 6}
                    className="flex-1 bg-transparent outline-none"
                    style={{ color: '#3D1A05', fontSize: '0.85rem' }} />
                  {buscando && <Loader2 size={12} className="animate-spin" style={{ color: '#A0622A' }} />}
                </div>
                {resultados.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-sm shadow-lg z-20"
                    style={{ backgroundColor: '#FDF8EE', border: '1px solid #DDD0A8', maxHeight: 180, overflowY: 'auto' }}>
                    {resultados.map(p => (
                      <button key={p.id} onClick={() => agregarProducto(p)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-amber-50 transition-colors">
                        {p.imagen
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.imagen} alt="" className="w-8 h-8 object-cover rounded-sm flex-shrink-0" />
                          : <Package size={20} style={{ color: '#DDD0A8' }} />}
                        <div className="min-w-0">
                          <p style={{ fontSize: '0.8rem', color: '#3D1A05', fontWeight: 500 }} className="truncate">{p.nombre}</p>
                          <p style={{ fontSize: '0.7rem', color: '#A0622A' }}>${p.precio.toLocaleString('es-AR')}</p>
                        </div>
                        <Plus size={13} style={{ color: '#4A5E1A', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {config.productos.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1 rounded-sm"
                    style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
                    {p.imagen
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imagen} alt="" className="w-7 h-7 object-cover rounded-sm flex-shrink-0" />
                      : <Package size={16} style={{ color: '#DDD0A8' }} />}
                    <span className="flex-1 truncate" style={{ fontSize: '0.78rem', color: '#3D1A05' }}>{p.nombre}</span>
                    <span style={{ fontSize: '0.72rem', color: '#A0622A', flexShrink: 0 }}>${p.precio.toLocaleString('es-AR')}</span>
                    <button onClick={() => quitarProducto(p.id)} style={{ color: '#B91C1C' }} className="hover:opacity-70">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Exportar */}
          <button onClick={handleExport} disabled={exportando}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-sm font-semibold text-sm disabled:opacity-50 hover:opacity-80 transition-opacity mt-2"
            style={{ backgroundColor: '#3D1A05', color: '#C4A040' }}>
            {exportando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {exportando ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>

        {/* ── Preview ── */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <p style={{ fontSize: '0.75rem', color: '#A0622A', marginBottom: 8, textAlign: 'center' }}>
            Vista previa — {FORMATO_DIMS[config.formato].label}
          </p>
          <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: dims.w * scale,
              height: dims.h * scale,
              transform: `scale(1)`,
              transformOrigin: 'top left',
              flexShrink: 0,
            }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: dims.w, height: dims.h }}>
                <PanfletoPreview config={config} previewRef={previewRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sección colapsable ────────────────────────────────────────────────────────

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-3 rounded-sm" style={{ backgroundColor: '#F2E6C8', border: '1px solid #DDD0A8' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B3A1A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

// ── Preview del panfleto ──────────────────────────────────────────────────────

function PanfletoPreview({ config, previewRef }: { config: PanfletConfig; previewRef: React.RefObject<HTMLDivElement | null> }) {
  const { plantilla } = config
  const isMinimalista = plantilla === 'minimalista'
  const isModerna = plantilla === 'moderna'

  const bgPrimario = isMinimalista ? '#FFFFFF' : isModerna ? '#3D1A05' : '#F9EDD3'
  const bgSecundario = isMinimalista ? '#F9EDD3' : isModerna ? '#5C2A0A' : '#F2E6C8'
  const textoPrimario = isMinimalista ? '#3D1A05' : isModerna ? '#F2E6C8' : '#3D1A05'
  const textoSecundario = isMinimalista ? '#6B3A1A' : isModerna ? '#C4A040' : '#6B3A1A'
  const acento = '#C4A040'
  const isDosX1 = config.formato === 'dos-por-uno'

  return (
    <div
      ref={previewRef as React.RefObject<HTMLDivElement>}
      style={{
        width: FORMATO_DIMS[config.formato].w,
        height: FORMATO_DIMS[config.formato].h,
        backgroundColor: bgPrimario,
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: isDosX1 ? 'row' : 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Mitad izquierda (o columna principal) ── */}
      <div style={{
        flex: isDosX1 ? '0 0 50%' : 1,
        display: 'flex',
        flexDirection: 'column',
        padding: isDosX1 ? 40 : 48,
        borderRight: isDosX1 ? `3px solid ${acento}` : 'none',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: isModerna ? '#2A0E00' : isMinimalista ? '#3D1A05' : '#3D1A05',
          margin: isDosX1 ? -40 : -48,
          marginBottom: isDosX1 ? 32 : 40,
          padding: isDosX1 ? '28px 40px' : '36px 48px',
          borderBottom: `4px solid ${acento}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: isDosX1 ? 36 : 44,
              height: isDosX1 ? 36 : 44,
              borderRadius: '50%',
              backgroundColor: acento,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: isDosX1 ? 18 : 22,
              color: '#3D1A05',
              flexShrink: 0,
            }}>L</div>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                color: '#F2E6C8',
                fontSize: isDosX1 ? 22 : 28,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.2,
              }}>{config.titulo}</h1>
            </div>
          </div>
          {config.subtitulo && (
            <p style={{ color: acento, fontSize: isDosX1 ? 11 : 13, margin: 0, marginTop: 6, lineHeight: 1.4 }}>
              {config.subtitulo}
            </p>
          )}
        </div>

        {/* Texto promocional */}
        {config.textoPromo && (
          <div style={{
            backgroundColor: bgSecundario,
            border: `2px solid ${acento}`,
            borderRadius: 4,
            padding: isDosX1 ? '14px 18px' : '18px 22px',
            marginBottom: isDosX1 ? 20 : 28,
          }}>
            <p style={{ color: textoPrimario, fontSize: isDosX1 ? 13 : 15, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {config.textoPromo}
            </p>
          </div>
        )}

        {/* Productos (en formato normal van en la misma columna, en 2x1 solo aquí) */}
        {config.mostrarProductos && config.productos.length > 0 && (
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              color: textoSecundario,
              fontSize: isDosX1 ? 14 : 16,
              fontWeight: 700,
              marginBottom: isDosX1 ? 10 : 14,
              borderBottom: `1px solid ${acento}`,
              paddingBottom: 6,
            }}>
              Nuestros productos
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDosX1 ? 'repeat(2, 1fr)' : config.productos.length <= 2 ? '1fr' : 'repeat(2, 1fr)',
              gap: isDosX1 ? 8 : 10,
            }}>
              {config.productos.slice(0, isDosX1 ? 6 : 6).map(p => (
                <div key={p.id} style={{
                  backgroundColor: bgSecundario,
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: `1px solid ${acento}40`,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {p.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt={p.nombre}
                      style={{ width: '100%', height: isDosX1 ? 60 : 80, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: isDosX1 ? '6px 8px' : '8px 10px' }}>
                    <p style={{ color: textoPrimario, fontSize: isDosX1 ? 10 : 12, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                      {p.nombre}
                    </p>
                    <p style={{ color: acento, fontSize: isDosX1 ? 11 : 13, fontWeight: 700, margin: 0, marginTop: 2 }}>
                      ${p.precio.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacto — solo en formato normal (no 2x1, va en columna derecha) */}
        {!isDosX1 && (
          <ContactoFooter config={config} textoPrimario={textoPrimario} textoSecundario={textoSecundario} acento={acento} bgSecundario={bgSecundario} small={false} />
        )}
      </div>

      {/* ── Mitad derecha (solo en 2x1) ── */}
      {isDosX1 && (
        <div style={{
          flex: '0 0 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          gap: 24,
        }}>
          {config.mostrarQR && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 8,
                border: `3px solid ${acento}`,
                display: 'inline-block',
                marginBottom: 10,
              }}>
                <QRCodeSVG value={APP_URL} size={150} level="M" />
              </div>
              <p style={{ color: textoSecundario, fontSize: 11, margin: 0 }}>Escaneá para ver el catálogo</p>
              <p style={{ color: acento, fontSize: 12, fontWeight: 700, margin: 0, marginTop: 2 }}>{APP_URL}</p>
            </div>
          )}
          <ContactoFooter config={config} textoPrimario={textoPrimario} textoSecundario={textoSecundario} acento={acento} bgSecundario={bgSecundario} small={true} />
        </div>
      )}

      {/* ── QR en formato normal (pie de página) ── */}
      {!isDosX1 && config.mostrarQR && (
        <div style={{
          backgroundColor: '#3D1A05',
          padding: '20px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          <div>
            <p style={{ color: acento, fontSize: 13, fontWeight: 700, margin: 0, marginBottom: 4 }}>
              ¡Visitá nuestro catálogo online!
            </p>
            <p style={{ color: '#F2E6C8', fontSize: 12, margin: 0 }}>{APP_URL}</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 6,
            border: `2px solid ${acento}`,
            flexShrink: 0,
          }}>
            <QRCodeSVG value={APP_URL} size={80} level="M" />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bloque de contacto reutilizable ───────────────────────────────────────────

function ContactoFooter({ config, textoPrimario, textoSecundario, acento, bgSecundario, small }: {
  config: PanfletConfig
  textoPrimario: string
  textoSecundario: string
  acento: string
  bgSecundario: string
  small: boolean
}) {
  const fs = small ? 11 : 13
  const iconSize = small ? 14 : 16

  const items: { show: boolean; icon: string; texto: string }[] = [
    { show: config.mostrarContacto, icon: '📱', texto: 'WhatsApp: +54 9 299 123-4567' },
    { show: config.mostrarInstagram, icon: '📸', texto: '@legadobazarydeco' },
    { show: config.mostrarWeb, icon: '🌐', texto: 'legadobyd.com' },
  ].filter(i => i.show)

  if (items.length === 0) return null

  return (
    <div style={{
      marginTop: small ? 0 : 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
    }}>
      {!small && (
        <h4 style={{ color: textoSecundario, fontSize: 12, fontWeight: 700, margin: 0, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Encontranos en
        </h4>
      )}
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: bgSecundario,
          borderRadius: 4,
          padding: small ? '6px 10px' : '8px 12px',
          border: `1px solid ${acento}40`,
        }}>
          <span style={{ fontSize: iconSize }}>{item.icon}</span>
          <span style={{ color: textoPrimario, fontSize: fs, fontWeight: 500 }}>{item.texto}</span>
        </div>
      ))}
    </div>
  )
}
