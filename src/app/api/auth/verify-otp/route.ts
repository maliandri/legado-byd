import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { uid, code } = await req.json()
    if (!uid || !code) {
      return NextResponse.json({ error: 'uid y code son requeridos' }, { status: 400 })
    }

    const snap = await adminDb().collection('otps').doc(uid).get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Código no encontrado. Solicitá uno nuevo.' }, { status: 400 })
    }

    const data = snap.data()!
    const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)

    if (new Date() > expiresAt) {
      await adminDb().collection('otps').doc(uid).delete()
      return NextResponse.json({ error: 'El código expiró. Solicitá uno nuevo.' }, { status: 400 })
    }

    if (data.code !== code) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 400 })
    }

    await adminDb().collection('otps').doc(uid).delete()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: err.message || 'Error al verificar' }, { status: 500 })
  }
}
