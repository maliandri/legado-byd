import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

function normalizarIva(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  if (isNaN(n) || n === 0) return null
  // "10,5" importado como 105 por el parseNum que borra comas
  if (n === 105 || (n >= 10 && n <= 11)) return 10.5
  if (n >= 20 && n <= 22) return 21
  return null
}

export async function POST() {
  try {
    const db = adminDb()
    const snap = await db.collection('productos').get()

    if (snap.empty) return NextResponse.json({ normalizados: 0 })

    const BATCH_SIZE = 500
    let normalizados = 0

    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const chunk = snap.docs.slice(i, i + BATCH_SIZE)

      for (const doc of chunk) {
        const ivaActual = doc.data().iva
        const ivaNuevo = normalizarIva(ivaActual)

        // Solo actualiza si cambió
        if (ivaNuevo === ivaActual) continue
        if (ivaNuevo === null && ivaActual === undefined) continue

        if (ivaNuevo === null) {
          batch.update(doc.ref, { iva: FieldValue.delete(), updatedAt: new Date() })
        } else {
          batch.update(doc.ref, { iva: ivaNuevo, updatedAt: new Date() })
        }
        normalizados++
      }

      await batch.commit()
    }

    return NextResponse.json({ normalizados })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
