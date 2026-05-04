import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Delete comentarios subcollection first
    const comentariosSnap = await adminDb().collection('posts').doc(id).collection('comentarios').get()
    const batch = adminDb().batch()
    comentariosSnap.docs.forEach(d => batch.delete(d.ref))
    batch.delete(adminDb().collection('posts').doc(id))
    await batch.commit()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
