import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { nombre, telefono, direccion, altura, provincia, items, vendedorId, vendedorNombre } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    const total = items.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0)

    const ordenRef = adminDb()
      .collection('pedidos').doc('anonimo')
      .collection('ordenes').doc()
    const ordenId = ordenRef.id

    const itemsMapped = items.map((i: any) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio: i.precio,
    }))

    const baseData: Record<string, any> = {
      uid: null,
      email_cliente: null,
      nombre_cliente: nombre || null,
      ...(telefono  ? { telefono_cliente: telefono }  : {}),
      ...(direccion ? { direccion_entrega: direccion } : {}),
      ...(altura    ? { altura_entrega: altura }        : {}),
      ...(provincia ? { provincia_entrega: provincia }  : {}),
      items: itemsMapped,
      estado: 'pagado',
      canal: 'vendedor',
      vendedorId: vendedorId || null,
      vendedorNombre: vendedorNombre || null,
      createdAt: FieldValue.serverTimestamp(),
    }

    const db = adminDb()

    // Save order docs
    await Promise.all([
      ordenRef.set({ ...baseData, total }),
      db.collection('orders').doc(ordenId).set({
        ...baseData,
        cliente_uid: null,
        monto_total: total,
      }),
    ])

    // Decrement stock for each item atomically
    const stockUpdates = items.map((i: any) =>
      db.collection('productos').doc(i.productoId).update({
        stock: FieldValue.increment(-i.cantidad),
      })
    )
    await Promise.all(stockUpdates)

    return NextResponse.json({ ok: true, ordenId })
  } catch (err: any) {
    console.error('confirmar-efectivo error:', err)
    return NextResponse.json({ error: err.message || 'Error al confirmar venta' }, { status: 500 })
  }
}
