import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, data } = body

    // Solo procesar eventos de pago
    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ ok: true })
    }

    const payment = new Payment(client)
    const pagoData = await payment.get({ id: data.id })

    const status = pagoData.status // approved | rejected | pending | in_process
    const externalRef = pagoData.external_reference || ''
    const [uid, ordenId] = externalRef.split(':')

    // Datos del pago
    const paymentInfo = {
      id_transaccion: String(pagoData.id),
      status,
      metodo_pago: pagoData.payment_method_id || '',
      email_cliente: pagoData.payer?.email || '',
      monto_total: pagoData.transaction_amount || 0,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (status === 'approved') {
      // 1. Actualizar orden existente en subcolección pedidos/{uid}/ordenes/{ordenId}
      if (uid && uid !== 'anonimo' && ordenId) {
        try {
          await adminDb()
            .collection('pedidos').doc(uid)
            .collection('ordenes').doc(ordenId)
            .update({ estado: 'pagado', ...paymentInfo })
        } catch {
          // La orden puede no existir en subcolección — continuar
        }
      }

      // 2. Upsert en colección plana `orders` para el panel admin
      const orderRef = ordenId
        ? adminDb().collection('orders').doc(ordenId)
        : adminDb().collection('orders').doc()

      const snap = await orderRef.get()
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

      console.log(`✓ Pago aprobado: ${pagoData.id} — orden ${ordenId}`)
    } else if (status === 'rejected' || status === 'cancelled') {
      if (uid && uid !== 'anonimo' && ordenId) {
        await adminDb()
          .collection('pedidos').doc(uid)
          .collection('ordenes').doc(ordenId)
          .update({ estado: 'cancelado', ...paymentInfo })
          .catch(() => {})
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('webhook MP error:', err)
    // Siempre devolver 200 a MP para que no reintente indefinidamente
    return NextResponse.json({ ok: true })
  }
}

// MP envía GET para verificar que el endpoint existe
export async function GET() {
  return NextResponse.json({ ok: true })
}
