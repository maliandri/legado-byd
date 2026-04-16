import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@legadobyd.com'

const baseStyle = `font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F9EDD3;border:2px solid #C4A040;border-radius:8px;overflow:hidden;`
const header = `<div style="background:#3D1A05;padding:24px 32px;text-align:center;"><p style="color:#C4A040;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;">Legado Bazar y Deco</p></div>`
const footer = `<div style="background:#3D1A05;padding:14px 32px;text-align:center;"><p style="color:#DDD0A8;font-size:11px;margin:0;">legadobyd.com · Neuquén, Argentina</p></div>`

export async function POST(req: Request) {
  try {
    const { email, asunto, cuerpo } = await req.json()
    if (!email || !asunto || !cuerpo) {
      return NextResponse.json({ error: 'email, asunto y cuerpo son requeridos' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: asunto,
      html: `<div style="${baseStyle}">${header}<div style="padding:28px 32px;">${cuerpo}</div>${footer}</div>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('enviar-email error:', err)
    return NextResponse.json({ error: err.message || 'Error al enviar' }, { status: 500 })
  }
}
