import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { productos } = await req.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })

    const listaProductos = (productos as { nombre: string; precio?: number }[])
      .map((p, i) => `${i + 1}. ${p.nombre}${p.precio ? ` - $${p.precio.toLocaleString('es-AR')}` : ''}`)
      .join('\n')

    const prompt = `Creá un script para un reel de Instagram de "Legado Bazar y Deco", insumos para panadería, pastelería y decoración en Neuquén, Argentina.

Productos (índice base 0):
${listaProductos}

Devolvé SOLO un JSON con este formato (sin markdown ni texto extra):
{"slides":[{"titulo":"texto","subtitulo":"texto opcional","duracion":3,"productoIndex":null}],"cta":"texto final"}

Reglas:
- 1 slide de intro (productoIndex: null) + 1 slide por cada producto (productoIndex: 0, 1, 2...) + 1 slide de cierre con "legadobyd.com" (productoIndex: null)
- productoIndex debe ser el índice exacto (0-based) del producto al que corresponde el slide, o null si es intro/cierre
- Titulo: máximo 5 palabras, impactante
- Subtitulo: máximo 7 palabras, complementario (puede omitirse)
- Duración: 3 segundos por slide (número entero)
- Tono entusiasta y artesanal, español argentino`

    const result = await model.generateContent(prompt)
    let raw = result.response.text().trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    const script = JSON.parse(raw)
    return NextResponse.json(script)
  } catch (err: any) {
    console.error('reel-script error:', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
