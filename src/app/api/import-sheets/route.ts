import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.GOOGLE_SHEET_ID!
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// Parsea "$72.300,00" o "72300.00" o 72300 → number
function parseNum(val: any): number | undefined {
  if (val === '' || val == null) return undefined
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/[$\s.]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? undefined : n
}

// Normaliza para comparación: minúsculas, sin tildes, espacios simples
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

export async function POST() {
  try {
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

    // ── 1. Leer Sheet (sin la fila de header) ─────────────────────────────
    const sheets = google.sheets({ version: 'v4', auth })
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'publico!A2:J2000',
    })
    const rows = sheetRes.data.values ?? []
    if (rows.length === 0) return NextResponse.json({ ok: true, actualizados: 0 })

    // ── 2. Traer todos los productos de Firestore (REST, público) ──────────
    const fsRes = await fetch(
      `${FIRESTORE_BASE}/productos?pageSize=500`,
    )
    if (!fsRes.ok) throw new Error(`Firestore GET error ${fsRes.status}`)
    const fsJson = await fsRes.json()

    // Mapa nombre normalizado → docId
    const docMap = new Map<string, string>()
    for (const doc of fsJson.documents ?? []) {
      const nombre = fval(doc.fields?.nombre)
      if (nombre) docMap.set(norm(String(nombre)), doc.name.split('/').pop())
    }

    // ── 3. Obtener token para escribir en Firestore ────────────────────────
    const { token } = await auth.getAccessToken()
    if (!token) throw new Error('No se pudo obtener token de acceso')

    // ── 4. Actualizar cada producto en Firestore ───────────────────────────
    let actualizados = 0
    const noEncontrados: string[] = []

    for (const row of rows) {
      const nombre = row[0]?.toString().trim()
      if (!nombre) continue

      // Columnas: A=nombre B=categoria C=subfamilia D=marca E=precio F=iva G=costo
      const categoria  = row[1]?.toString().trim() || undefined
      const subfamilia = row[2]?.toString().trim() || undefined
      const marca      = row[3]?.toString().trim() || undefined
      const precio     = parseNum(row[4])
      const iva        = parseNum(row[5])
      const costo      = parseNum(row[6])

      const docId = docMap.get(norm(nombre))
      if (!docId) { noEncontrados.push(nombre); continue }

      // Construir campos y máscara
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
      const patchRes = await fetch(
        `${FIRESTORE_BASE}/productos/${docId}?${maskQuery}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        }
      )

      if (patchRes.ok) actualizados++
    }

    if (noEncontrados.length > 0) {
      console.log('No encontrados en Firestore:', noEncontrados)
    }

    return NextResponse.json({ ok: true, actualizados, noEncontrados, totalNoEncontrados: noEncontrados.length })
  } catch (err: any) {
    console.error('import-sheets error:', err)
    return NextResponse.json({ error: err.message || 'Error desconocido' }, { status: 500 })
  }
}
