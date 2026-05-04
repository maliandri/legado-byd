import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const snap = await adminDb()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() }))
    return NextResponse.json(posts)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tipo, contenido, productoId, productoNombre, productoImagen, productoPrecio, imagen, autorId, autorNombre } = body

    if (!tipo || !contenido?.trim() || !autorId) {
      return NextResponse.json({ error: 'Faltan datos del post' }, { status: 400 })
    }

    const data: Record<string, any> = {
      tipo,
      contenido: contenido.trim(),
      autorId,
      autorNombre: autorNombre || 'Admin',
      comentariosCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    }

    if (tipo === 'producto') {
      if (productoId) data.productoId = productoId
      if (productoNombre) data.productoNombre = productoNombre
      if (productoImagen) data.productoImagen = productoImagen
      if (productoPrecio != null) data.productoPrecio = productoPrecio
    } else {
      if (imagen) data.imagen = imagen
    }

    const ref = await adminDb().collection('posts').add(data)
    return NextResponse.json({ id: ref.id, ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
