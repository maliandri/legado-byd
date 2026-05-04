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

const FORMATO_DIMS: Record<Formato, { w: number; h: number; label: string; pdfFmt: string; landscape: boolean }> = {
  'a4':          { w: 794,  h: 1123, label: 'A4 (210×297 mm)',        pdfFmt: 'a4',     landscape: false },
  'carta':       { w: 816,  h: 1056, label: 'Carta (215×279 mm)',      pdfFmt: 'letter', landscape: false },
  'dos-por-uno': { w: 1587, h: 794,  label: '2×1 Horizontal (doble A4)', pdfFmt: 'a4',  landscape: true  },
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

  // Ref apunta al div oculto a tamaño completo (para export correcto)
  const exportRef = useRef<HTMLDivElement | null>(null)

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
    if (!exportRef.current) return
    setExportando(true)
    try {
      // Esperar que las imágenes dentro del div oculto carguen
      const imgs = exportRef.current.querySelectorAll('img')
      await Promise.all(Array.from(imgs).map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r })
      ))

      // Esperar fuentes del sistema (ya están cargadas, pero por las dudas)
      await document.fonts.ready

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const dims = FORMATO_DIMS[config.formato]

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: dims.w,
        height: dims.h,
        windowWidth: dims.w,
        windowHeight: dims.h,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      const pdf = new jsPDF({
        orientation: dims.landscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: dims.pdfFmt,
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
  // Escala para mostrar en pantalla (máx 560px de ancho)
  const maxW = 560
  const scale = Math.min(maxW / dims.w, 0.55)

  const inputStyle = {
    width: '100%', padding: '7px 10px', borderRadius: 3,
    border: '1px solid #DDD0A8', backgroundColor: '#FDF8EE',
    color: '#3D1A05', fontSize: '0.85rem', outline: 'none',
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
      {/* Div oculto a tamaño real — usado para exportar */}
      <div style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <PanfletoContent config={config} ref={exportRef} />
      </div>

      <div className="mb-5">
        <h2 style={{ fontFamily: "'Georgia, serif'", color: '#3D1A05', fontSize: '1.5rem', fontWeight: 700 }}>
          Panfletín con QR
        </h2>
        <p style={{ color: '#A0622A', fontSize: '0.85rem', marginTop: 4 }}>
          Diseñá un panfleto con QR y exportalo en PDF listo para imprimir.
        </p>
      </div>

      <div className="flex gap-6 items-start" style={{ flexWrap: 'wrap' }}>

        {/* ── Panel de controles ── */}
        <div style={{ flex: '0 0 290px', minWidth: 260 }}>

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

          <Section titulo="Plantilla">
            <div className="flex gap-2 flex-wrap">
              {(['clasica', 'moderna', 'minimalista'] as Plantilla[]).map(p => (
                <button key={p} onClick={() => set({ plantilla: p })}
                  className="px-3 py-1 rounded-sm text-xs font-semibold transition-all"
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

          <Section titulo="Mostrar">
            <div className="flex flex-col gap-1.5">
              {([
                ['mostrarQR', 'Código QR'],
                ['mostrarProductos', 'Productos'],
                ['mostrarContacto', 'WhatsApp'],
                ['mostrarInstagram', 'Instagram'],
                ['mostrarWeb', 'Sitio web'],
              ] as [keyof PanfletConfig, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.85rem', color: '#3D1A05' }}>
                  <input type="checkbox" checked={config[key] as boolean}
                    onChange={e => set({ [key]: e.target.checked } as any)}
                    className="w-3.5 h-3.5 accent-amber-800" />
                  {label}
                </label>
              ))}
            </div>
          </Section>

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
                          ? <img src={p.imagen} alt="" className="w-8 h-8 object-cover rounded-sm flex-shrink-0" crossOrigin="anonymous" />
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

          <button onClick={handleExport} disabled={exportando}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-sm font-semibold text-sm disabled:opacity-50 hover:opacity-80 transition-opacity mt-2"
            style={{ backgroundColor: '#3D1A05', color: '#C4A040' }}>
            {exportando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {exportando ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>

        {/* ── Preview escalado ── */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ fontSize: '0.75rem', color: '#A0622A', marginBottom: 8, textAlign: 'center' }}>
            Vista previa — {dims.label}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              width: dims.w * scale,
              height: dims.h * scale,
              position: 'relative',
              flexShrink: 0,
              boxShadow: '0 4px 24px rgba(61,26,5,0.18)',
            }}>
              <div style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: dims.w,
                height: dims.h,
                position: 'absolute',
                top: 0,
                left: 0,
              }}>
                <PanfletoContent config={config} />
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

// ── Contenido del panfleto (preview + export comparten el mismo componente) ───

import { forwardRef } from 'react'

const PanfletoContent = forwardRef<HTMLDivElement, { config: PanfletConfig }>(
  function PanfletoContent({ config }, ref) {
    const { plantilla, formato } = config
    const dims = FORMATO_DIMS[formato]
    const isDosX1 = formato === 'dos-por-uno'

    // Paletas por plantilla — solo colores sólidos, fuentes del sistema
    const pal = plantilla === 'moderna'
      ? { bg: '#3D1A05', header: '#2A0E00', card: '#5C2A0A', texto: '#F2E6C8', sub: '#C4A040', acento: '#C4A040', footerBg: '#2A0E00' }
      : plantilla === 'minimalista'
      ? { bg: '#FFFFFF', header: '#3D1A05', card: '#F2E6C8', texto: '#3D1A05', sub: '#6B3A1A', acento: '#C4A040', footerBg: '#3D1A05' }
      : { bg: '#F9EDD3', header: '#3D1A05', card: '#F2E6C8', texto: '#3D1A05', sub: '#6B3A1A', acento: '#C4A040', footerBg: '#3D1A05' }

    const serif = 'Georgia, "Times New Roman", serif'
    const sans = 'Arial, Helvetica, sans-serif'

    const pad = isDosX1 ? 36 : 48

    return (
      <div
        ref={ref}
        style={{
          width: dims.w,
          height: dims.h,
          backgroundColor: pal.bg,
          fontFamily: sans,
          display: 'flex',
          flexDirection: isDosX1 ? 'row' : 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Columna principal ── */}
        <div style={{
          flex: isDosX1 ? '0 0 50%' : 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: isDosX1 ? `3px solid ${pal.acento}` : 'none',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: pal.header,
            padding: isDosX1 ? '24px 36px' : '32px 48px',
            borderBottom: `4px solid ${pal.acento}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              <div style={{
                width: isDosX1 ? 38 : 48,
                height: isDosX1 ? 38 : 48,
                borderRadius: '50%',
                backgroundColor: pal.acento,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: serif,
                fontWeight: 900,
                fontSize: isDosX1 ? 20 : 26,
                color: '#3D1A05',
                flexShrink: 0,
              }}>L</div>
              <h1 style={{
                fontFamily: serif,
                color: '#F2E6C8',
                fontSize: isDosX1 ? 24 : 32,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.15,
              }}>{config.titulo}</h1>
            </div>
            {config.subtitulo && (
              <p style={{ color: pal.acento, fontSize: isDosX1 ? 12 : 14, margin: 0, lineHeight: 1.4, fontFamily: sans }}>
                {config.subtitulo}
              </p>
            )}
          </div>

          {/* Cuerpo */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: pad, gap: 20, overflow: 'hidden' }}>

            {/* Promo */}
            {config.textoPromo && (
              <div style={{
                backgroundColor: pal.card,
                border: `2px solid ${pal.acento}`,
                borderRadius: 6,
                padding: isDosX1 ? '14px 18px' : '18px 22px',
                flexShrink: 0,
              }}>
                <p style={{ color: pal.texto, fontSize: isDosX1 ? 13 : 16, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                  {config.textoPromo}
                </p>
              </div>
            )}

            {/* Productos */}
            {config.mostrarProductos && config.productos.length > 0 && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h3 style={{
                  fontFamily: serif,
                  color: pal.sub,
                  fontSize: isDosX1 ? 14 : 18,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${pal.acento}`,
                }}>
                  Nuestros productos
                </h3>
                {(() => {
                  const n = config.productos.length
                  const cols = n <= 2 ? n : 2
                  // Altura de imagen según cantidad: 1→220, 2→180, 3-4→120, 5-6→90 (ajustado para 2x1)
                  const imgH = isDosX1
                    ? (n <= 2 ? 100 : n <= 4 ? 72 : 60)
                    : (n === 1 ? 220 : n === 2 ? 180 : n <= 4 ? 120 : 90)
                  return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: 10,
                  }}>
                  {config.productos.slice(0, 6).map(p => (
                    <div key={p.id} style={{
                      backgroundColor: pal.card,
                      borderRadius: 5,
                      overflow: 'hidden',
                      border: `1px solid ${pal.acento}55`,
                    }}>
                      {p.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          crossOrigin="anonymous"
                          style={{ width: '100%', height: imgH, objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      <div style={{ padding: isDosX1 ? '6px 10px' : '8px 12px' }}>
                        <p style={{ color: pal.texto, fontSize: isDosX1 ? 11 : (n <= 2 ? 15 : 13), fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                          {p.nombre}
                        </p>
                        <p style={{ color: pal.acento, fontSize: isDosX1 ? 12 : (n <= 2 ? 17 : 15), fontWeight: 700, margin: 0, marginTop: 3 }}>
                          ${p.precio.toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                  )
                })()}
              </div>
            )}

            {/* Contacto (en formato normal) */}
            {!isDosX1 && <ContactoBloque config={config} pal={pal} sans={sans} />}
          </div>

          {/* Footer QR (en formato normal) */}
          {!isDosX1 && config.mostrarQR && (
            <div style={{
              backgroundColor: pal.footerBg,
              padding: '20px 48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexShrink: 0,
            }}>
              <div>
                <p style={{ color: pal.acento, fontSize: 14, fontWeight: 700, margin: 0, marginBottom: 4, fontFamily: sans }}>
                  ¡Visitá nuestro catálogo online!
                </p>
                <p style={{ color: '#F2E6C8', fontSize: 13, margin: 0, fontFamily: sans }}>{APP_URL}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: 10, borderRadius: 6, border: `2px solid ${pal.acento}`, flexShrink: 0 }}>
                <QRCodeSVG value={APP_URL} size={88} level="M" />
              </div>
            </div>
          )}
        </div>

        {/* ── Columna derecha (solo 2×1) ── */}
        {isDosX1 && (
          <div style={{
            flex: '0 0 50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            padding: 48,
          }}>
            {config.mostrarQR && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, border: `3px solid ${pal.acento}`, display: 'inline-block', marginBottom: 10 }}>
                  <QRCodeSVG value={APP_URL} size={160} level="M" />
                </div>
                <p style={{ color: pal.sub, fontSize: 12, margin: 0, fontFamily: sans }}>Escaneá para ver el catálogo</p>
                <p style={{ color: pal.acento, fontSize: 13, fontWeight: 700, margin: 0, marginTop: 2, fontFamily: sans }}>{APP_URL}</p>
              </div>
            )}
            <ContactoBloque config={config} pal={pal} sans={sans} />
          </div>
        )}
      </div>
    )
  }
)

// ── Bloque de contacto ────────────────────────────────────────────────────────

function ContactoBloque({ config, pal, sans }: {
  config: PanfletConfig
  pal: { card: string; texto: string; acento: string; sub: string }
  sans: string
}) {
  const items = [
    config.mostrarContacto  && { icon: '📱', text: 'WhatsApp: +54 9 299 123-4567' },
    config.mostrarInstagram && { icon: '📸', text: '@legadobazarydeco' },
    config.mostrarWeb       && { icon: '🌐', text: 'legadobyd.com' },
  ].filter(Boolean) as { icon: string; text: string }[]

  if (items.length === 0) return null

  return (
    <div style={{ flexShrink: 0, width: '100%' }}>
      <h4 style={{ color: pal.sub, fontSize: 12, fontWeight: 700, margin: 0, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: sans }}>
        Encontranos en
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            backgroundColor: pal.card, borderRadius: 4, padding: '8px 12px',
            border: `1px solid ${pal.acento}44`,
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ color: pal.texto, fontSize: 13, fontWeight: 500, fontFamily: sans }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
