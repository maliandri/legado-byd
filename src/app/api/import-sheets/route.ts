import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.GOOGLE_SHEET_ID!
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

function parseNum(val: any): number | undefined {
  if (val === '' || val == null) return undefined
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/[$\s.]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? undefined : n
}

function norm(s: string): string {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function fval(field: any): any {
  if (!field) return undefined
  if ('stringValue' in field) return field.stringValue
  if ('integerValue' in field) return Number(field.integerValue)
  if ('doubleValue' in field) return Number(field.doubleValue)
  return undefined
}

export async function POST(req: Request) {
  try {
    const { reset } = await req.json().catch(() => ({ reset: false }))

    if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID no configurada')
    if (!PROJECT_ID) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID no configurada')

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
    if (!clientEmail) throw new Error('FIREBASE_CLIENT_EMAIL no configurada')
    if (!privateKeyRaw) throw new Error('FIREBASE_PRIVATE_KEY no configurada')

    const privateKey = Buffer.from(privateKeyRaw, 'base64').toString('utf8')

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/datastore',
      ],
    })

    // ── 1. Leer Sheet ─────────────────────────────────────────────────────
    const sheets = google.sheets({ version: 'v4', auth })
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'publico!A2:J2000',
    })
    const rows = (sheetRes.data.values ?? []).filter(r => r[0]?.toString().trim())
    if (rows.length === 0) return NextResponse.json({ ok: true, creados: 0, actualizados: 0 })

    const { token } = await auth.getAccessToken()
    if (!token) throw new Error('No se pudo obtener token de acceso')

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    // ── 2. MODO RESET: borrar toda la colección y recrear ─────────────────
    if (reset) {
      const fsRes = await fetch(`${FIRESTORE_BASE}/productos?pageSize=500`)
      if (!fsRes.ok) throw new Error(`Firestore GET error ${fsRes.status}`)
      const fsJson = await fsRes.json()

      // Borrar todos los docs existentes
      for (const doc of fsJson.documents ?? []) {
        await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, {
          method: 'DELETE',
          headers,
        })
      }

      // Crear productos desde el Sheet
      let creados = 0
      const now = new Date().toISOString()

      for (const row of rows) {
        const nombre = row[0]?.toString().trim()
        if (!nombre) continue

        const categoria  = row[1]?.toString().trim() || 'general'
        const subfamilia = row[2]?.toString().trim() || ''
        const marca      = row[3]?.toString().trim() || ''
        const precio     = parseNum(row[4]) ?? 0
        const iva        = parseNum(row[5])
        const costo      = parseNum(row[6])

        const fields: Record<string, any> = {
          nombre:      { stringValue: nombre },
          categoria:   { stringValue: categoria },
          subfamilia:  { stringValue: subfamilia },
          marca:       { stringValue: marca },
          precio:      { doubleValue: precio },
          stock:       { integerValue: 0 },
          imagen:      { stringValue: '' },
          descripcion: { stringValue: '' },
          createdAt:   { timestampValue: now },
          updatedAt:   { timestampValue: now },
        }
        if (iva    !== undefined) fields.iva   = { doubleValue: iva }
        if (costo  !== undefined) fields.costo = { doubleValue: costo }

        const postRes = await fetch(`${FIRESTORE_BASE}/productos`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ fields }),
        })
        if (postRes.ok) creados++
      }

      return NextResponse.json({ ok: true, creados, actualizados: 0 })
    }

    // ── 3. MODO NORMAL: actualizar por nombre ─────────────────────────────
    const fsRes = await fetch(`${FIRESTORE_BASE}/productos?pageSize=500`)
    if (!fsRes.ok) throw new Error(`Firestore GET error ${fsRes.status}`)
    const fsJson = await fsRes.json()

    const docMap = new Map<string, string>()
    for (const doc of fsJson.documents ?? []) {
      const nombre = fval(doc.fields?.nombre)
      if (nombre) docMap.set(norm(String(nombre)), doc.name.split('/').pop())
    }

    let actualizados = 0
    const noEncontrados: string[] = []

    for (const row of rows) {
      const nombre = row[0]?.toString().trim()
      if (!nombre) continue

      const categoria  = row[1]?.toString().trim() || undefined
      const subfamilia = row[2]?.toString().trim() || undefined
      const marca      = row[3]?.toString().trim() || undefined
      const precio     = parseNum(row[4])
      const iva        = parseNum(row[5])
      const costo      = parseNum(row[6])

      const docId = docMap.get(norm(nombre))
      if (!docId) { noEncontrados.push(nombre); continue }

      const fields: Record<string, any> = {}
      const mask: string[] = []

      if (categoria  !== undefined) { fields.categoria  = { stringValue: categoria };  mask.push('categoria') }
      if (subfamilia !== undefined) { fields.subfamilia = { stringValue: subfamilia }; mask.push('subfamilia') }
      if (marca      !== undefined) { fields.marca      = { stringValue: marca };      mask.push('marca') }
      if (precio     !== undefined) { fields.precio     = { doubleValue: precio };     mask.push('precio') }
      if (iva        !== undefined) { fields.iva        = { doubleValue: iva };        mask.push('iva') }
      if (costo      !== undefined) { fields.costo      = { doubleValue: costo };      mask.push('costo') }

      if (mask.length === 0) continue

      const maskQuery = mask.map(p => `updateMask.fieldPaths=${p}`).join('&')
      const patchRes = await fetch(`${FIRESTORE_BASE}/productos/${docId}?${maskQuery}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields }),
      })
      if (patchRes.ok) actualizados++
    }

    if (noEncontrados.length > 0) console.log('No encontrados:', noEncontrados)

    return NextResponse.json({ ok: true, actualizados, creados: 0, noEncontrados, totalNoEncontrados: noEncontrados.length })
  } catch (err: any) {
    console.error('import-sheets error:', err)
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 })
  }
}
