import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const allowed = ['estado', 'bultos', 'notas']
    const update: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }
    await adminDb().collection('orders').doc(id).update(update)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('PATCH order error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await adminDb().collection('orders').doc(id).delete()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE order error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
