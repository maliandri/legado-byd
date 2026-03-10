import { Resend } from 'resend'

export async function sendContactEmail(params: {
  nombre: string
  email: string
  mensaje: string
  producto?: string
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@legadobyd.com'
  const to = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

  await resend.emails.send({
    from,
    to,
    subject: params.producto
      ? `Consulta sobre: ${params.producto}`
      : 'Nueva consulta desde Legado ByD',
    html: `
      <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F2E6C8; border: 2px solid #C4A040;">
        <h1 style="color: #3D1A05; font-size: 24px; margin-bottom: 16px;">Nueva consulta desde Legado ByD</h1>
        ${params.producto ? `<p style="color: #6B3A1A; font-weight: bold; margin-bottom: 8px;">Producto: ${params.producto}</p>` : ''}
        <p style="color: #4A2C0A; margin-bottom: 4px;"><strong>Nombre:</strong> ${params.nombre}</p>
        <p style="color: #4A2C0A; margin-bottom: 4px;"><strong>Email:</strong> ${params.email}</p>
        <p style="color: #4A2C0A; margin-bottom: 16px;"><strong>Mensaje:</strong></p>
        <p style="color: #3D1A05; background: #FDF6E3; padding: 12px; border-left: 3px solid #C4A040;">${params.mensaje}</p>
      </div>
    `,
  })
}
