import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const snap = await adminDb().collection('usuarios').orderBy('createdAt', 'desc').get()
    const usuarios = snap.docs.map(d => ({
      uid: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }))
    return NextResponse.json({ usuarios })
  } catch (err: any) {
    console.error('GET usuarios error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
