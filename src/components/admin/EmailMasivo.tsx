'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Wand2, Send, Plus, Clock, Mail } from 'lucide-react'

const inp = {
  width: '100%', padding: '10px 13px', border: '1px solid #DDD0A8',
  borderRadius: 6, backgroundColor: '#FFFBF2', color: '#3D1A05',
  fontSize: '0.92rem', outline: 'none',
} as const

const INTERVALOS = [
  { label: 'Sin espera', value: 0 },
  { label: '1 minuto', value: 1 },
  { label: '5 minutos', value: 5 },
  { label: '10 minutos', value: 10 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
]

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
}

export default function EmailMasivo() {
  const [destinatarios, setDestinatarios] = useState<string[]>([])
  const [inputEmail, setInputEmail] = useState('')
  const [intervalo, setIntervalo] = useState(10)
  const [prompt, setPrompt] = useState('')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [generando, setGenerando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [progreso, setProgreso] = useState<{ enviados: number; total: number; actual: string } | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [cancelar, setCancelar] = useState(false)
  const cancelRef = useRef(false)

  function agregarEmail(raw: string) {
    const emails = raw.split(/[\s,;]+/).map(e => e.trim()).filter(Boolean)
    const nuevos = emails.filter(e => isValidEmail(e) && !destinatarios.includes(e))
    if (nuevos.length) setDestinatarios(d => [...d, ...nuevos])
    setInputEmail('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ';', ' '].includes(e.key)) {
      e.preventDefault()
      if (inputEmail.trim()) agregarEmail(inputEmail)
    }
    if (e.key === 'Backspace' && !inputEmail && destinatarios.length) {
      setDestinatarios(d => d.slice(0, -1))
    }
  }

  function quitarEmail(email: string) {
    setDestinatarios(d => d.filter(e => e !== email))
  }

  async function handleGenerar() {
    if (!prompt.trim()) return
    setGenerando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/generar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAsunto(data.asunto)
      setCuerpo(data.cuerpo)
    } catch (err: any) {
      setMsg({ tipo: 'err', texto: err.message || 'Error al generar' })
    } finally {
      setGenerando(false)
    }
  }

  async function handleEnviar() {
    if (!destinatarios.length) { setMsg({ tipo: 'err', texto: 'Agregá al menos un destinatario.' }); return }
    if (!asunto.trim()) { setMsg({ tipo: 'err', texto: 'El asunto es requerido.' }); return }
    if (!cuerpo.trim()) { setMsg({ tipo: 'err', texto: 'El cuerpo del email es requerido.' }); return }
    if (!confirm(`¿Enviar a ${destinatarios.length} destinatario${destinatarios.length > 1 ? 's' : ''}${intervalo > 0 ? ` (1 cada ${intervalo} min)` : ''}?`)) return

    setEnviando(true)
    cancelRef.current = false
    setCancelar(false)
    setMsg(null)

    let enviados = 0
    const errores: string[] = []

    for (let i = 0; i < destinatarios.length; i++) {
      if (cancelRef.current) break

      const email = destinatarios[i]
      setProgreso({ enviados: i, total: destinatarios.length, actual: email })

      try {
        const res = await fetch('/api/admin/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, asunto, cuerpo }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        enviados++
      } catch (err: any) {
        errores.push(`${email}: ${err.message}`)
      }

      // Esperar intervalo entre envíos (excepto el último)
      if (i < destinatarios.length - 1 && intervalo > 0 && !cancelRef.current) {
        await new Promise<void>(resolve => {
          const end = Date.now() + intervalo * 60 * 1000
          const tick = setInterval(() => {
            if (cancelRef.current || Date.now() >= end) {
              clearInterval(tick)
              resolve()
            }
            // Actualizar countdown en progreso
            const restantes = Math.ceil((end - Date.now()) / 1000)
            setProgreso({ enviados: i + 1, total: destinatarios.length, actual: `Próximo en ${restantes}s...` })
          }, 1000)
        })
      }
    }

    setEnviando(false)
    setProgreso(null)
    if (errores.length) {
      setMsg({ tipo: 'err', texto: `${enviados} enviados. Errores: ${errores.join(' | ')}` })
    } else {
      setMsg({ tipo: 'ok', texto: `✓ ${enviados} email${enviados > 1 ? 's' : ''} enviado${enviados > 1 ? 's' : ''} correctamente.` })
    }
  }

  function handleCancelar() {
    cancelRef.current = true
    setCancelar(true)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ backgroundColor: '#FFFBF2', border: '1.5px solid #C4A040', borderRadius: 10, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ backgroundColor: '#3D1A05', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={18} style={{ color: '#C4A040' }} />
          <span style={{ fontFamily: "'Playfair Display', serif", color: '#F2E6C8', fontSize: '1.05rem', fontWeight: 700 }}>
            Envío masivo de emails
          </span>
        </div>

        <div style={{ padding: '24px' }}>

          {/* Destinatarios */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Destinatarios ({destinatarios.length}/100)
            </label>
            <div style={{ border: '1px solid #DDD0A8', borderRadius: 6, backgroundColor: '#FFFBF2', padding: '8px', minHeight: 52, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start' }}>
              {destinatarios.map(email => (
                <span key={email} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: '#F2E6C8', border: '1px solid #C4A040', borderRadius: 20, padding: '3px 10px', fontSize: '0.82rem', color: '#3D1A05' }}>
                  {email}
                  <button onClick={() => quitarEmail(email)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A0622A', display: 'flex', padding: 0 }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              {destinatarios.length < 100 && (
                <input
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => { if (inputEmail.trim()) agregarEmail(inputEmail) }}
                  placeholder={destinatarios.length === 0 ? 'Escribí un email y presioná Enter...' : '+'}
                  style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#3D1A05', fontSize: '0.88rem', minWidth: 200, flex: 1 }}
                />
              )}
            </div>
            <p style={{ color: '#A0622A', fontSize: '0.75rem', marginTop: 4 }}>
              Separar con Enter, coma o punto y coma. También podés pegar una lista.
            </p>
          </div>

          {/* Intervalo */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              <Clock size={13} className="inline mr-1" />
              Intervalo entre envíos
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {INTERVALOS.map(({ label, value }) => (
                <button key={value} onClick={() => setIntervalo(value)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${intervalo === value ? '#C4A040' : '#DDD0A8'}`, backgroundColor: intervalo === value ? '#F2E6C8' : '#FFFBF2', color: intervalo === value ? '#3D1A05' : '#6B3A1A' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Gemini */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              <Wand2 size={13} className="inline mr-1" />
              Prompt para Gemini
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ej: Anunciá una promoción del 20% en todos los moldes de silicona hasta el viernes. Tono cercano y entusiasta."
                rows={3}
                style={{ ...inp, resize: 'vertical', flex: 1 }}
              />
              <button onClick={handleGenerar} disabled={generando || !prompt.trim()}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 18px', backgroundColor: generando ? '#A0622A' : '#4A5E1A', color: '#fff', border: 'none', borderRadius: 6, cursor: generando ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 700, minWidth: 90, opacity: !prompt.trim() ? 0.5 : 1 }}>
                <Wand2 size={16} />
                {generando ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
          </div>

          {/* Asunto */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Asunto
            </label>
            <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Asunto del email" style={inp} />
          </div>

          {/* Cuerpo */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Cuerpo del email
              {cuerpo && <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', color: '#A0622A' }}>(generado por IA — podés editar)</span>}
            </label>
            <textarea
              value={cuerpo}
              onChange={e => setCuerpo(e.target.value)}
              placeholder="HTML del cuerpo del email. Usá el botón 'Generar con IA' o escribí directamente."
              rows={8}
              style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
          </div>

          {/* Preview */}
          {cuerpo && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Preview
              </label>
              <div style={{ border: '2px solid #C4A040', borderRadius: 8, overflow: 'hidden', backgroundColor: '#F9EDD3' }}>
                <div style={{ backgroundColor: '#3D1A05', padding: '12px 20px' }}>
                  <p style={{ color: '#C4A040', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 2px' }}>Legado Bazar y Deco</p>
                  <p style={{ color: '#F2E6C8', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{asunto || '(sin asunto)'}</p>
                </div>
                <div style={{ padding: '20px 24px' }} dangerouslySetInnerHTML={{ __html: cuerpo }} />
                <div style={{ backgroundColor: '#3D1A05', padding: '10px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#DDD0A8', fontSize: '11px', margin: 0 }}>legadobyd.com · Neuquén, Argentina</p>
                </div>
              </div>
            </div>
          )}

          {/* Progreso */}
          {progreso && (
            <div style={{ marginBottom: 16, backgroundColor: '#F2E6C8', border: '1px solid #C4A040', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#3D1A05', fontWeight: 700, fontSize: '0.9rem' }}>
                  Enviando {progreso.enviados + 1} de {progreso.total}
                </span>
                <button onClick={handleCancelar} style={{ background: 'none', border: '1px solid #A0622A', borderRadius: 4, color: '#A0622A', fontSize: '0.78rem', padding: '3px 10px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
              <div style={{ backgroundColor: '#DDD0A8', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ backgroundColor: '#C4A040', height: '100%', width: `${(progreso.enviados / progreso.total) * 100}%`, transition: 'width 0.5s' }} />
              </div>
              <p style={{ color: '#6B3A1A', fontSize: '0.82rem', margin: 0 }}>{progreso.actual}</p>
            </div>
          )}

          {/* Mensaje resultado */}
          {msg && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, fontSize: '0.85rem', backgroundColor: msg.tipo === 'ok' ? '#C8DEC8' : '#F5CAAA', color: '#3D1A05', border: `1px solid ${msg.tipo === 'ok' ? '#A8C4A8' : '#E8C49A'}` }}>
              {msg.texto}
            </div>
          )}

          {/* Botón enviar */}
          <button
            onClick={handleEnviar}
            disabled={enviando || !destinatarios.length || !asunto || !cuerpo}
            style={{ width: '100%', padding: '13px', backgroundColor: enviando ? '#A0622A' : '#3D1A05', color: '#F2E6C8', border: 'none', borderRadius: 7, fontSize: '0.95rem', fontWeight: 700, cursor: enviando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!destinatarios.length || !asunto || !cuerpo) ? 0.5 : 1 }}>
            <Send size={16} />
            {enviando ? 'Enviando...' : `Enviar a ${destinatarios.length} destinatario${destinatarios.length !== 1 ? 's' : ''}`}
          </button>

        </div>
      </div>
    </div>
  )
}
