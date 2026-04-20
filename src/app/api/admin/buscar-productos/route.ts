import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    if (!q) return NextResponse.json({ productos: [] })

    const snap = await adminDb().collection('productos').limit(200).get()
    const todos = snap.docs.map(d => ({
      id: d.id,
      nombre: d.data().nombre as string,
      precio: d.data().precio as number,
      imagen: d.data().imagen as string,
      descripcion: d.data().descripcion as string,
    }))

    const productos = todos
      .filter(p => p.nombre?.toLowerCase().includes(q))
      .slice(0, 10)

    return NextResponse.json({ productos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
