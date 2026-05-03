import { NextResponse } from 'next/server'
import { sendPedidoClienteEmail, sendPedidoAdminEmail } from '@/lib/resend/client'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, nombre, items, total, uid, telefono, direccion, altura, provincia } = await req.json()
    if (!email || !nombre || !items || !total) {
      return NextResponse.json({ error: 'Faltan datos del pedido' }, { status: 400 })
    }

    // Guardar en colección plana `orders` para el panel de Operaciones
    await adminDb().collection('orders').add({
      cliente_uid: uid || null,
      email_cliente: email,
      nombre_cliente: nombre,
      ...(telefono  ? { telefono_cliente: telefono }   : {}),
      ...(direccion ? { direccion_entrega: direccion }  : {}),
      ...(altura    ? { altura_entrega: altura }         : {}),
      ...(provincia ? { provincia_entrega: provincia }   : {}),
      canal: 'whatsapp',
      estado: 'en_preparacion',
      items: items.map((i: any) => ({
        productoId: i.productoId || '',
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio: i.precio,
      })),
      monto_total: total,
      createdAt: FieldValue.serverTimestamp(),
    })

    await Promise.all([
      sendPedidoClienteEmail({ email, nombre, items, total }),
      sendPedidoAdminEmail({ clienteNombre: nombre, clienteEmail: email, items, total }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('pedido/confirmar error:', err)
    return NextResponse.json({ error: err.message || 'Error al enviar emails' }, { status: 500 })
  }
}
