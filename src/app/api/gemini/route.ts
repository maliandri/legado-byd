import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { nombre, categoria } = await req.json()
    if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Sos un copywriter para "Legado Bazar y Deco", una tienda de insumos de panadería, pastelería y decoración en Neuquén, Argentina.

Escribí una descripción comercial muy breve para el producto "${nombre}" de la categoría "${categoria}".

Usá la regla de los 3 segundos: la primera frase debe ser un gancho (hook point) que capture la atención al instante y conecte emocionalmente con el comprador. La segunda frase completa con el beneficio concreto del producto.

Reglas estrictas:
- Exactamente 2 oraciones
- Tono cálido, artesanal, cercano
- Sin emojis, sin asteriscos, sin markdown, sin comillas, sin guiones
- Sin símbolos de ningún tipo
- Solo texto plano
- Solo devolvé la descripción, nada más`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    // Strip any markdown, emojis, or special chars that Gemini might add
    const descripcion = raw
      .replace(/[*_`~#>]/g, '')           // markdown
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, '') // emojis
      .replace(/^["']|["']$/g, '')        // surrounding quotes
      .trim()
    return NextResponse.json({ descripcion })
  } catch (err: any) {
    console.error('Gemini error:', err)
    return NextResponse.json({
      error: err.message || 'Error desconocido',
      status: err.status || null,
      details: err.errorDetails || err.toString(),
      hasKey: !!process.env.GEMINI_API_KEY,
    }, { status: 500 })
  }
}
