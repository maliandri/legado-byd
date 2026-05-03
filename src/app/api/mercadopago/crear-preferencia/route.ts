import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legadobyd.com'

export async function POST(req: Request) {
  try {
    const { uid, email, nombre, telefono, direccion, altura, provincia, items, vendedorId, vendedorNombre } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    const total = items.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0)

    const subRef = adminDb()
      .collection('pedidos').doc(uid || 'anonimo')
      .collection('ordenes').doc()
    const ordenId = subRef.id
    const externalRef = uid ? `${uid}:${ordenId}` : `anonimo:${ordenId}`

    const itemsMapped = items.map((i: any) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio: i.precio,
    }))

    const isVenta = !!vendedorId
    const canal = isVenta ? 'vendedor' : 'mercadopago'

    const baseData: Record<string, any> = {
      uid: uid || null,
      email_cliente: email || null,
      nombre_cliente: nombre || null,
      ...(telefono  ? { telefono_cliente: telefono }   : {}),
      ...(direccion ? { direccion_entrega: direccion }  : {}),
      ...(altura    ? { altura_entrega: altura }         : {}),
      ...(provincia ? { provincia_entrega: provincia }   : {}),
      items: itemsMapped,
      estado: 'pendiente_pago',
      canal,
      createdAt: FieldValue.serverTimestamp(),
    }

    if (isVenta) {
      baseData.vendedorId = vendedorId
      baseData.vendedorNombre = vendedorNombre || null
    }

    await Promise.all([
      subRef.set({ ...baseData, total }),
      adminDb().collection('orders').doc(ordenId).set({
        ...baseData,
        cliente_uid: uid || null,
        monto_total: total,
      }),
    ])

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const preference = new Preference(client)

    const mpItems = items.map((i: any) => ({
      id: i.productoId,
      title: i.nombre,
      quantity: i.cantidad,
      unit_price: i.precio,
      currency_id: 'ARS',
    }))

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: { email: email || undefined, name: nombre || undefined },
        back_urls: {
          success: `${APP_URL}/pago/exitoso`,
          failure: `${APP_URL}/pago/fallido`,
          pending: `${APP_URL}/pago/pendiente`,
        },
        auto_return: 'approved',
        external_reference: externalRef,
        statement_descriptor: 'Legado ByD',
        metadata: { uid, ordenId, vendedorId: vendedorId || null },
      },
    })

    return NextResponse.json({ init_point: result.init_point, ordenId })
  } catch (err: any) {
    console.error('crear-preferencia error:', err)
    return NextResponse.json({ error: err.message || 'Error al crear preferencia' }, { status: 500 })
  }
}
