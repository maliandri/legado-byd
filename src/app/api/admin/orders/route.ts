import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const snap = await adminDb()
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const orders = snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      }
    })

    return NextResponse.json({ orders })
  } catch (err: any) {
    console.error('GET orders error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
