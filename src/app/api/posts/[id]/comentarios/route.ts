import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const snap = await adminDb()
      .collection('posts').doc(id)
      .collection('comentarios')
      .orderBy('createdAt', 'asc')
      .get()
    const comentarios = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    }))
    return NextResponse.json(comentarios)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const { id } = await params
    const { texto } = await req.json()

    if (!texto?.trim()) return NextResponse.json({ error: 'Comentario vacío' }, { status: 400 })

    const postRef = adminDb().collection('posts').doc(id)
    const postSnap = await postRef.get()
    if (!postSnap.exists) return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })

    const comentarioRef = await postRef.collection('comentarios').add({
      texto: texto.trim(),
      autorId: decoded.uid,
      autorNombre: decoded.name || decoded.email || 'Usuario',
      createdAt: FieldValue.serverTimestamp(),
    })

    await postRef.update({ comentariosCount: FieldValue.increment(1) })

    return NextResponse.json({ id: comentarioRef.id, ok: true })
  } catch (err: any) {
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
