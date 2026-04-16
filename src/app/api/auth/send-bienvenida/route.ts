import { NextResponse } from 'next/server'
import { sendBienvenidaEmail } from '@/lib/resend/client'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, nombre, tipo } = await req.json()
    if (!email || !nombre) {
      return NextResponse.json({ error: 'email y nombre son requeridos' }, { status: 400 })
    }

    await sendBienvenidaEmail({ email, nombre, tipo: tipo || 'cliente' })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('send-bienvenida error:', err)
    return NextResponse.json({ error: err.message || 'Error al enviar bienvenida' }, { status: 500 })
  }
}
