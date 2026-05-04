import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const DOC = () => adminDb().collection('configuracion').doc('nosotros')

export async function GET() {
  try {
    const snap = await DOC().get()
    if (!snap.exists) return NextResponse.json({ sobre_nosotros: '', vision: '', mision: '' })
    return NextResponse.json(snap.data())
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { sobre_nosotros, vision, mision } = await req.json()
    await DOC().set({ sobre_nosotros: sobre_nosotros || '', vision: vision || '', mision: mision || '', updatedAt: FieldValue.serverTimestamp() })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
