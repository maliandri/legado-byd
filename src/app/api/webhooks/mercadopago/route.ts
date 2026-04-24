import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { sendPedidoClienteEmail, sendPedidoAdminEmail } from '@/lib/resend/client'
import { createHmac } from 'node:crypto'

export const runtime = 'nodejs'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

function verificarFirmaMP(req: Request, rawBody: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true // sin secret configurado, dejar pasar

  const xSignature = req.headers.get('x-signature') || ''
  const xRequestId = req.headers.get('x-request-id') || ''

  // Formato: ts=....,v1=....
  const parts = Object.fromEntries(xSignature.split(',').map(p => p.split('=')))
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Buscar data.id en query params
  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id') || ''

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex')
  return hmac === v1
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    if (!verificarFirmaMP(req, rawBody)) {
      console.warn('Webhook MP: firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const { type, data } = body

    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ ok: true })
    }

    const payment = new Payment(client)
    const pagoData = await payment.get({ id: data.id })

    const status = pagoData.status
    const externalRef = pagoData.external_reference || ''
    const [uid, ordenId] = externalRef.split(':')

    const paymentInfo = {
      id_transaccion: String(pagoData.id),
      status,
      metodo_pago: pagoData.payment_method_id || '',
      email_cliente: pagoData.payer?.email || '',
      monto_total: pagoData.transaction_amount || 0,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (status === 'approved') {
      const orderRef = ordenId
        ? adminDb().collection('orders').doc(ordenId)
        : adminDb().collection('orders').doc()

      // Obtener datos de la orden (items, cliente) antes de actualizar
      const snap = await orderRef.get()
      const orderData = snap.exists ? snap.data() : null
      const orderItems: any[] = orderData?.items || []
      const clientEmail = pagoData.payer?.email || orderData?.email_cliente || ''
      const clientName = orderData?.nombre_cliente || ''

      // 1. Actualizar subcol pedidos/{uid}/ordenes/{ordenId}
      if (uid && uid !== 'anonimo' && ordenId) {
        await adminDb()
          .collection('pedidos').doc(uid)
          .collection('ordenes').doc(ordenId)
          .update({ estado: 'pagado', ...paymentInfo })
          .catch(() => {})
      }

      // 2. Upsert en colección plana orders
      if (snap.exists) {
        await orderRef.update({ estado: 'pagado', ...paymentInfo })
      } else {
        await orderRef.set({
          cliente_uid: uid !== 'anonimo' ? uid : null,
          canal: 'mercadopago',
          estado: 'pagado',
          items: pagoData.additional_info?.items?.map((i: any) => ({
            productoId: i.id || '',
            nombre: i.title || '',
            cantidad: Number(i.quantity) || 1,
            precio: Number(i.unit_price) || 0,
          })) || [],
          createdAt: FieldValue.serverTimestamp(),
          ...paymentInfo,
        })
      }

      // 3. Descontar stock de cada producto
      if (orderItems.length > 0) {
        const batch = adminDb().batch()
        for (const item of orderItems) {
          if (item.productoId) {
            batch.update(
              adminDb().collection('productos').doc(item.productoId),
              { stock: FieldValue.increment(-item.cantidad) }
            )
          }
        }
        await batch.commit().catch(e => console.error('Stock decrement error:', e))
      }

      // 4. Enviar email de confirmación al cliente
      if (clientEmail && orderItems.length > 0) {
        await Promise.all([
          sendPedidoClienteEmail({
            email: clientEmail,
            nombre: clientName || 'Cliente',
            items: orderItems.map((i: any) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
            total: pagoData.transaction_amount || 0,
            tipo: 'mercadopago',
          }),
          sendPedidoAdminEmail({
            clienteNombre: clientName || clientEmail,
            clienteEmail: clientEmail,
            items: orderItems.map((i: any) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
            total: pagoData.transaction_amount || 0,
          }),
        ]).catch(e => console.error('Email error:', e))
      }

      console.log(`✓ Pago aprobado: ${pagoData.id} — orden ${ordenId}`)
    } else if (status === 'rejected' || status === 'cancelled') {
      if (uid && uid !== 'anonimo' && ordenId) {
        await adminDb()
          .collection('pedidos').doc(uid)
          .collection('ordenes').doc(ordenId)
          .update({ estado: 'cancelado', ...paymentInfo })
          .catch(() => {})
      }
      if (ordenId) {
        await adminDb().collection('orders').doc(ordenId)
          .update({ estado: 'cancelado', ...paymentInfo })
          .catch(() => {})
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('webhook MP error:', err)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
