import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ ordenId: string }> }) {
  try {
    const { ordenId } = await params
    const snap = await adminDb().collection('orders').doc(ordenId).get()
    if (!snap.exists) {
      return NextResponse.json({ estado: 'pendiente_pago', pagado: false })
    }
    const data = snap.data()!
    return NextResponse.json({
      estado: data.estado,
      pagado: data.estado === 'pagado',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
