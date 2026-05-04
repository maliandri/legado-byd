import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'prompt requerido' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })

    const systemPrompt = `Sos el redactor de emails de Legado Bazar y Deco, una tienda de insumos para panadería, pastelería y decoración en Neuquén, Argentina.
Escribís emails comerciales/promocionales en español rioplatense (vos/ustedes), cálidos y profesionales.
La identidad visual usa colores chocolate (#3D1A05), dorado (#C4A040) y pergamino (#F2E6C8).

El usuario te va a dar una instrucción. Devolvé ÚNICAMENTE un JSON con este formato exacto:
{
  "asunto": "El asunto del email",
  "preview": "Texto breve de preview (max 120 caracteres)",
  "cuerpo": "El cuerpo completo del email en HTML inline (sin <html><body>, solo el contenido interior). Usá <p>, <strong>, <ul>, <li>, <a> con estilos inline. Colores del tema."
}
No agregues texto antes ni después del JSON.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nInstrucción: ${prompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      const geminiError = data.error?.message || JSON.stringify(data)
      console.error('generar-email Gemini HTTP error:', res.status, geminiError)
      return NextResponse.json({ error: `Gemini error ${res.status}: ${geminiError}` }, { status: 500 })
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!raw.trim()) {
      const reason = data.candidates?.[0]?.finishReason || JSON.stringify(data)
      return NextResponse.json({ error: `Gemini no devolvió contenido (${reason}). Intentá con otro prompt.` }, { status: 500 })
    }

    // Limpiar posibles markdown code blocks
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Gemini no devolvió JSON válido — intentar extraer con regex
      const asunto = cleaned.match(/"asunto"\s*:\s*"([^"]+)"/)?.[1] || 'Sin asunto'
      const cuerpo = cleaned.match(/"cuerpo"\s*:\s*"([\s\S]+?)"\s*[,}]/)?.[1] || cleaned
      return NextResponse.json({ ok: true, asunto, preview: '', cuerpo })
    }

    return NextResponse.json({ ok: true, asunto: parsed.asunto, preview: parsed.preview ?? '', cuerpo: parsed.cuerpo })
  } catch (err: any) {
    console.error('generar-email error:', err)
    return NextResponse.json({ error: err.message || 'Error al generar email' }, { status: 500 })
  }
}
