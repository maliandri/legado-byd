import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    const categoria = (searchParams.get('categoria') || '').toLowerCase().trim()

    if (!q && !categoria) return NextResponse.json([])

    const snap = await adminDb().collection('productos').limit(400).get()
    const todos = snap.docs.map(d => ({
      id: d.id,
      nombre: d.data().nombre as string,
      precio: d.data().precio as number,
      imagen: d.data().imagen as string,
      categoria: d.data().categoria as string,
    }))

    const productos = todos
      .filter(p => {
        const matchCat = categoria ? p.categoria?.toLowerCase() === categoria : true
        const matchQ = q ? p.nombre?.toLowerCase().includes(q) : true
        return matchCat && matchQ
      })
      .slice(0, 20)

    return NextResponse.json(productos)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
