import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

// PATCH — bloquear/desbloquear
export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params
    const { bloqueado } = await req.json()
    await adminDb().collection('usuarios').doc(uid).update({ bloqueado })
    await adminAuth().updateUser(uid, { disabled: bloqueado })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('PATCH usuario error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — eliminar usuario de Auth + Firestore
export async function DELETE(_: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params
    await adminDb().collection('usuarios').doc(uid).delete()
    try {
      await adminAuth().deleteUser(uid)
    } catch {
      // Si no existe en Auth igual continuamos
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE usuario error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
