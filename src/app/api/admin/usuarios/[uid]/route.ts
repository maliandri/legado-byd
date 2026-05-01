import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params
    const body = await req.json()

    const update: Record<string, any> = {}

    if (body.bloqueado !== undefined) {
      update.bloqueado = body.bloqueado
      await adminAuth().updateUser(uid, { disabled: body.bloqueado })
    }

    if (body.tipo !== undefined) {
      update.tipo = body.tipo
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    await adminDb().collection('usuarios').doc(uid).update(update)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('PATCH usuario error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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
