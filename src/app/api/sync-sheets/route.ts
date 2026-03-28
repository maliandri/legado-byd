import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID = process.env.GOOGLE_SHEET_ID!
const RANGE = 'Hoja 1!A1'

function pct(value: number): string {
  return value.toFixed(2) + '%'
}

export async function POST() {
  try {
    // ── Auth con service account ──────────────────────────────────────────
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no configurada')
    if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID no configurada')

    const serviceAccount = JSON.parse(serviceAccountKey)

    // Normalizar private_key: Netlify puede entregar literal \n o newlines reales
    const privateKey = (serviceAccount.private_key as string)
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .trim()

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // ── Leer productos desde Firestore (Admin SDK) ────────────────────────
    const snap = await adminDb().collection('productos').orderBy('nombre').get()

    // ── Construir filas ───────────────────────────────────────────────────
    const header = ['PRODS LEGADO', 'FLIA PROD', 'SUB FAMILIA', 'MARCA', 'PVP', 'IVA', 'COSTO', 'MARGEN', 'MARKUP', 'STOCK']

    const rows = snap.docs.map((d) => {
      const p = d.data()
      const pvp: number = p.precio ?? 0
      const costo: number = p.costo ?? 0
      const stock: number = p.stock ?? 0
      const margen = pvp > 0 && costo > 0 ? ((pvp - costo) / pvp) * 100 : 0
      const markup = costo > 0 ? ((pvp - costo) / costo) * 100 : 0

      return [
        p.nombre ?? '',
        p.categoria ?? '',
        p.subfamilia ?? '',
        p.marca ?? '',
        pvp,
        p.iva ?? '',
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
      range: 'Hoja 1',
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
