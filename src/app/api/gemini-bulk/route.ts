import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

function fval(field: any): any {
  if (!field) return ''
  if ('stringValue' in field) return field.stringValue
  if ('integerValue' in field) return Number(field.integerValue)
  if ('doubleValue' in field) return Number(field.doubleValue)
  return ''
}

async function generarDescripcion(
  genAI: GoogleGenerativeAI,
  nombre: string,
  categoria: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })
  const prompt = `Sos un copywriter para "Legado Bazar y Deco", una tienda de insumos de panadería, pastelería y decoración en Neuquén, Argentina.

Escribí una descripción comercial muy breve para el producto "${nombre}" de la categoría "${categoria}".

Usá la regla de los 3 segundos: la primera frase debe ser un gancho que capture la atención al instante y conecte emocionalmente con el comprador. La segunda frase completa con el beneficio concreto del producto.

Reglas estrictas:
- Exactamente 2 oraciones
- Tono cálido, artesanal, cercano
- Sin emojis, sin asteriscos, sin markdown, sin comillas, sin guiones
- Solo texto plano
- Solo devolvé la descripción, nada más`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
    .replace(/[*_`~#>]/g, '')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}

// Procesa un array en lotes de N concurrentes
async function batch<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    const settled = await Promise.allSettled(chunk.map(fn))
    for (const s of settled) {
      results.push(s.status === 'fulfilled' ? s.value : null as any)
    }
  }
  return results
}

export async function POST() {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada')

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
    if (!clientEmail || !privateKeyRaw) throw new Error('Credenciales Firebase no configuradas')

    const privateKey = Buffer.from(privateKeyRaw, 'base64').toString('utf8')

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/datastore'],
    })

    // ── 1. Traer todos los productos ──────────────────────────────────────
    const fsRes = await fetch(`${FIRESTORE_BASE}/productos?pageSize=500`)
    if (!fsRes.ok) throw new Error(`Firestore GET error ${fsRes.status}`)
    const fsJson = await fsRes.json()
    const docs: any[] = fsJson.documents ?? []

    // Solo los que no tienen descripción
    const sinDesc = docs.filter(d => {
      const desc = fval(d.fields?.descripcion)
      return !desc || String(desc).trim() === ''
    })

    if (sinDesc.length === 0) {
      return NextResponse.json({ ok: true, generados: 0, mensaje: 'Todos los productos ya tienen descripción' })
    }

    // ── 2. Obtener token Firestore ────────────────────────────────────────
    const { token } = await auth.getAccessToken()
    if (!token) throw new Error('No se pudo obtener token de acceso')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // ── 3. Generar y guardar en lotes de 5 ───────────────────────────────
    let generados = 0

    await batch(sinDesc, 5, async (doc) => {
      const nombre   = String(fval(doc.fields?.nombre) || '')
      const categoria = String(fval(doc.fields?.categoria) || '')
      const docId    = doc.name.split('/').pop()

      if (!nombre || !docId) return

      const descripcion = await generarDescripcion(genAI, nombre, categoria)

      const patchRes = await fetch(
        `${FIRESTORE_BASE}/productos/${docId}?updateMask.fieldPaths=descripcion`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { descripcion: { stringValue: descripcion } } }),
        }
      )
      if (patchRes.ok) generados++
    })

    return NextResponse.json({ ok: true, generados, total: sinDesc.length })
  } catch (err: any) {
    console.error('gemini-bulk error:', err)
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 })
  }
}
