import { NextResponse } from 'next/server'
import { sendPedidoClienteEmail, sendPedidoAdminEmail } from '@/lib/resend/client'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, nombre, items, total } = await req.json()
    if (!email || !nombre || !items || !total) {
      return NextResponse.json({ error: 'Faltan datos del pedido' }, { status: 400 })
    }

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
