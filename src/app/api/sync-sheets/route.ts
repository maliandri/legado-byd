import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.GOOGLE_SHEET_ID!
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
const RANGE = 'backup!A1'

function pct(value: number): string {
  return value.toFixed(2) + '%'
}

// Extrae un valor de un campo Firestore REST
function fval(field: any): any {
  if (!field) return ''
  if ('stringValue' in field) return field.stringValue
  if ('integerValue' in field) return Number(field.integerValue)
  if ('doubleValue' in field) return Number(field.doubleValue)
  if ('booleanValue' in field) return field.booleanValue
  if ('nullValue' in field) return ''
  return ''
}

export async function POST() {
  try {
    if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID no configurada')
    if (!PROJECT_ID) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID no configurada')

    // ── Auth Google Sheets con FIREBASE_PRIVATE_KEY separada ─────────────
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
    if (!clientEmail) throw new Error('FIREBASE_CLIENT_EMAIL no configurada')
    if (!privateKeyRaw) throw new Error('FIREBASE_PRIVATE_KEY no configurada')

    // FIREBASE_PRIVATE_KEY se guarda en base64 para evitar corrupción de Netlify
    const privateKey = Buffer.from(privateKeyRaw, 'base64').toString('utf8')

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // ── Leer productos via Firestore REST API (pública, no requiere auth) ─
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/productos?pageSize=500`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Firestore REST error ${res.status}`)
    const json = await res.json()

    const docs: any[] = json.documents ?? []

    // Ordenar por nombre
    docs.sort((a, b) => {
      const na = fval(a.fields?.nombre) as string
      const nb = fval(b.fields?.nombre) as string
      return na.localeCompare(nb, 'es')
    })

    // ── Construir filas ───────────────────────────────────────────────────
    const header = ['PRODS LEGADO', 'FLIA PROD', 'SUB FAMILIA', 'MARCA', 'PVP', 'IVA', 'COSTO', 'MARGEN', 'MARKUP', 'STOCK']

    const rows = docs.map((d) => {
      const f = d.fields ?? {}
      const pvp = Number(fval(f.precio)) || 0
      const costo = Number(fval(f.costo)) || 0
      const stock = Number(fval(f.stock)) || 0
      const margen = pvp > 0 && costo > 0 ? ((pvp - costo) / pvp) * 100 : 0
      const markup = costo > 0 ? ((pvp - costo) / costo) * 100 : 0

      return [
        fval(f.nombre),
        fval(f.categoria),
        fval(f.subfamilia),
        fval(f.marca),
        pvp,
        fval(f.iva),
        costo > 0 ? costo : '',
        costo > 0 ? pct(margen) : '',
        costo > 0 ? pct(markup) : '',
        stock > 0 ? stock : '',
      ]
    })

    const values = [header, ...rows]

    // ── Limpiar hoja y escribir ───────────────────────────────────────────
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'backup',
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    })

    return NextResponse.json({ ok: true, filas: rows.length })
  } catch (err: any) {
    console.error('sync-sheets error:', err)
    return NextResponse.json(
      { error: err.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}
