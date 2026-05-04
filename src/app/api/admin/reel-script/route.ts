import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { productos } = await req.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })

    const listaProductos = (productos as { nombre: string; precio?: number }[])
      .map((p, i) => `${i + 1}. ${p.nombre}${p.precio ? ` - $${p.precio.toLocaleString('es-AR')}` : ''}`)
      .join('\n')

    const prompt = `Creá un script para un reel de Instagram de "Legado Bazar y Deco", insumos para panadería, pastelería y decoración en Neuquén, Argentina.

Productos:
${listaProductos}

Devolvé SOLO un JSON con este formato (sin markdown ni texto extra):
{"slides":[{"titulo":"texto","subtitulo":"texto opcional","duracion":3}],"cta":"texto final"}

Reglas:
- 1 slide de intro + 1 slide por producto + 1 slide de cierre con "legadobyd.com"
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
