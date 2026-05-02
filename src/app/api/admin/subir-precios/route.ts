import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { porcentaje } = await req.json()

    if (typeof porcentaje !== 'number' || porcentaje <= 0 || porcentaje > 1000) {
      return NextResponse.json({ error: 'Porcentaje inválido (debe ser entre 1 y 1000).' }, { status: 400 })
    }

    const db = adminDb()
    const snap = await db.collection('productos').get()

    if (snap.empty) {
      return NextResponse.json({ actualizados: 0 })
    }

    const factor = 1 + porcentaje / 100
    const BATCH_SIZE = 500
    let actualizados = 0

    // Firestore permite máximo 500 operaciones por batch
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const chunk = snap.docs.slice(i, i + BATCH_SIZE)
      for (const doc of chunk) {
        const precio = doc.data().precio
        if (typeof precio !== 'number' || precio <= 0) continue
        const nuevoPrecio = Math.round(precio * factor)
        batch.update(doc.ref, { precio: nuevoPrecio, updatedAt: new Date() })
        actualizados++
      }
      await batch.commit()
    }

    return NextResponse.json({ actualizados, porcentaje })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
