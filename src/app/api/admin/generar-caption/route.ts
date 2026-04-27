import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { productos, tema } = await req.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const listaProductos = (productos as { nombre: string; precio?: number }[])
      .map(p => `${p.nombre}${p.precio ? ` - $${p.precio.toLocaleString('es-AR')}` : ''}`)
      .join('\n')

    const prompt = `Sos el community manager de "Legado Bazar y Deco", una tienda de insumos para panaderos, pasteleros y decoradores en Neuquén, Argentina.

Escribí un caption para Instagram/WhatsApp sobre estos productos:
${listaProductos}
${tema ? `\nContexto/tema: ${tema}` : ''}

Reglas:
- Tono cálido, cercano y artesanal
- Entre 3 y 5 oraciones
- Incluí 2-4 emojis relevantes (panadería, pastelería o cocina)
- Terminá con una llamada a la acción breve
- Agregá entre 5 y 8 hashtags relevantes al final separados por espacio
- Sin asteriscos ni markdown
- Idioma: español argentino
- Solo devolvé el caption, sin explicaciones`

    const result = await model.generateContent(prompt)
    const caption = result.response.text().trim()
    return NextResponse.json({ caption })
  } catch (err: any) {
    console.error('generar-caption error:', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
