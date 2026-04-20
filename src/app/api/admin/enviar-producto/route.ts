import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@legadobyd.com'

const baseStyle = `font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#F9EDD3;border:2px solid #C4A040;border-radius:8px;overflow:hidden;`
const headerHtml = (titulo: string) => `
  <div style="background:#3D1A05;padding:24px 32px;text-align:center;">
    <p style="color:#C4A040;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;">Legado Bazar y Deco</p>
    <h1 style="color:#F2E6C8;font-size:22px;margin:0;font-weight:700;">${titulo}</h1>
  </div>`
const footerHtml = `<div style="background:#3D1A05;padding:14px 32px;text-align:center;"><p style="color:#DDD0A8;font-size:11px;margin:0;">legadobyd.com · Neuquén, Argentina</p></div>`

export async function POST(req: Request) {
  try {
    const { to, nombre, producto, mensajePersonal } = await req.json()
    if (!to || !producto) {
      return NextResponse.json({ error: 'Destinatario y producto son requeridos' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const imagenHtml = producto.imagen
      ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="width:100%;max-height:280px;object-fit:cover;display:block;" />`
      : ''

    const msgHtml = mensajePersonal
      ? `<p style="color:#3D1A05;background:#F2E6C8;padding:12px 16px;border-left:3px solid #C4A040;border-radius:2px;margin-bottom:20px;">${mensajePersonal}</p>`
      : ''

    const html = `<div style="${baseStyle}">
      ${headerHtml('Un producto pensado para vos')}
      ${imagenHtml}
      <div style="padding:28px 32px;">
        <p style="color:#3D1A05;font-size:15px;margin-bottom:16px;">Hola <strong>${nombre}</strong>,</p>
        ${msgHtml}
        <h2 style="color:#3D1A05;font-size:20px;font-weight:700;margin:0 0 8px;">${producto.nombre}</h2>
        ${producto.descripcion ? `<p style="color:#6B3A1A;line-height:1.7;margin-bottom:16px;">${producto.descripcion}</p>` : ''}
        <p style="color:#3D1A05;font-size:22px;font-weight:800;margin-bottom:24px;">$${Number(producto.precio).toLocaleString('es-AR')}</p>
        <div style="text-align:center;">
          <a href="https://legadobyd.com" style="background:#3D1A05;color:#F2E6C8;padding:13px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;border:2px solid #C4A040;">
            Ver en el catálogo →
          </a>
        </div>
      </div>
      ${footerHtml}
    </div>`

    await resend.emails.send({
      from: FROM,
      to,
      subject: `Te recomendamos: ${producto.nombre} — Legado ByD`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('enviar-producto error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
