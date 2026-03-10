import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/resend/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, email, mensaje, producto } = body

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Campos requeridos: nombre, email, mensaje' }, { status: 400 })
    }

    await sendContactEmail({ nombre, email, mensaje, producto })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error enviando email:', err)
    return NextResponse.json({ error: 'Error al enviar el mensaje' }, { status: 500 })
  }
}
