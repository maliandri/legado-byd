import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@legadobyd.com'
const ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

function resend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const baseStyle = `
  font-family: 'Georgia', serif;
  max-width: 600px;
  margin: 0 auto;
  background: #F9EDD3;
  border: 2px solid #C4A040;
  border-radius: 8px;
  overflow: hidden;
`
const header = (titulo: string) => `
  <div style="background:#3D1A05; padding:24px 32px; text-align:center;">
    <p style="color:#C4A040; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; margin:0 0 6px;">Legado Bazar y Deco</p>
    <h1 style="color:#F2E6C8; font-size:22px; margin:0; font-weight:700;">${titulo}</h1>
  </div>
`
const footer = `
  <div style="background:#3D1A05; padding:14px 32px; text-align:center;">
    <p style="color:#DDD0A8; font-size:11px; margin:0;">legadobyd.com · Neuquén, Argentina</p>
  </div>
`

// ── 1. Consulta de contacto ────────────────────────────────────────────────

export async function sendContactEmail(params: {
  nombre: string
  email: string
  mensaje: string
  producto?: string
}): Promise<void> {
  await resend().emails.send({
    from: FROM,
    to: ADMIN,
    subject: params.producto ? `Consulta sobre: ${params.producto}` : 'Nueva consulta — Legado ByD',
    html: `<div style="${baseStyle}">
      ${header('Nueva consulta')}
      <div style="padding:28px 32px;">
        ${params.producto ? `<p style="color:#6B3A1A; font-weight:bold; margin-bottom:12px;">Producto: ${params.producto}</p>` : ''}
        <p style="color:#3D1A05; margin:6px 0;"><strong>Nombre:</strong> ${params.nombre}</p>
        <p style="color:#3D1A05; margin:6px 0;"><strong>Email:</strong> ${params.email}</p>
        <p style="color:#3D1A05; margin:12px 0 6px;"><strong>Mensaje:</strong></p>
        <p style="color:#3D1A05; background:#F2E6C8; padding:12px 16px; border-left:3px solid #C4A040; border-radius:2px;">${params.mensaje}</p>
      </div>
      ${footer}
    </div>`,
  })
}

// ── 2. OTP de verificación ─────────────────────────────────────────────────

export async function sendOTPEmail(params: {
  email: string
  nombre: string
  code: string
}): Promise<void> {
  await resend().emails.send({
    from: FROM,
    to: params.email,
    subject: `${params.code} — Tu código de verificación · Legado ByD`,
    html: `<div style="${baseStyle}">
      ${header('Verificá tu cuenta')}
      <div style="padding:32px; text-align:center;">
        <p style="color:#3D1A05; font-size:15px; margin-bottom:24px;">
          Hola <strong>${params.nombre}</strong>, usá este código para completar tu registro:
        </p>
        <div style="display:inline-block; background:#3D1A05; color:#F2E6C8; font-size:38px; font-weight:900; letter-spacing:0.25em; padding:18px 36px; border-radius:6px; border:2px solid #C4A040;">
          ${params.code}
        </div>
        <p style="color:#A0622A; font-size:13px; margin-top:20px;">
          Este código expira en <strong>10 minutos</strong>.<br/>
          Si no solicitaste esto, ignorá este mensaje.
        </p>
      </div>
      ${footer}
    </div>`,
  })
}

// ── 3. Bienvenida al completar registro ───────────────────────────────────

export async function sendBienvenidaEmail(params: {
  email: string
  nombre: string
  tipo: 'cliente' | 'empresa'
}): Promise<void> {
  await resend().emails.send({
    from: FROM,
    to: params.email,
    subject: '¡Bienvenido/a a Legado Bazar y Deco!',
    html: `<div style="${baseStyle}">
      ${header('¡Bienvenido/a!')}
      <div style="padding:32px;">
        <p style="color:#3D1A05; font-size:16px; margin-bottom:16px;">
          Hola <strong>${params.nombre}</strong> 👋
        </p>
        <p style="color:#3D1A05; line-height:1.7; margin-bottom:16px;">
          Tu cuenta de ${params.tipo === 'empresa' ? 'empresa' : 'cliente'} fue creada con éxito en <strong>Legado Bazar y Deco</strong>.
          Ya podés explorar nuestro catálogo completo de insumos para panadería, pastelería y decoración.
        </p>
        <div style="text-align:center; margin:28px 0;">
          <a href="https://legadobyd.com" style="background:#3D1A05; color:#F2E6C8; padding:13px 32px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px; border:2px solid #C4A040;">
            Ver catálogo →
          </a>
        </div>
        <p style="color:#6B3A1A; font-size:13px;">
          Ante cualquier consulta escribinos por WhatsApp o desde la sección de contacto del sitio.
        </p>
      </div>
      ${footer}
    </div>`,
  })
}

// ── 4. Confirmación de pedido al cliente ──────────────────────────────────

export async function sendPedidoClienteEmail(params: {
  email: string
  nombre: string
  items: { nombre: string; cantidad: number; precio: number }[]
  total: number
  tipo?: 'whatsapp' | 'mercadopago'
}): Promise<void> {
  const esMp = params.tipo === 'mercadopago'
  const lineas = params.items.map(i => `
    <tr>
      <td style="padding:8px 12px; color:#3D1A05; border-bottom:1px solid #EDD9A3;">${i.nombre}</td>
      <td style="padding:8px 12px; color:#3D1A05; text-align:center; border-bottom:1px solid #EDD9A3;">${i.cantidad}</td>
      <td style="padding:8px 12px; color:#3D1A05; text-align:right; border-bottom:1px solid #EDD9A3; font-weight:600;">
        $${(i.precio * i.cantidad).toLocaleString('es-AR')}
      </td>
    </tr>
  `).join('')

  await resend().emails.send({
    from: FROM,
    to: params.email,
    subject: esMp ? '¡Pago confirmado! Tu pedido está en preparación — Legado ByD' : 'Tu pedido fue enviado a Legado ByD',
    html: `<div style="${baseStyle}">
      ${header(esMp ? 'Pago confirmado ✓' : 'Pedido enviado ✓')}
      <div style="padding:28px 32px;">
        <p style="color:#3D1A05; margin-bottom:20px;">
          Hola <strong>${params.nombre}</strong>, ${esMp
            ? 'tu pago fue aprobado. Tu pedido está siendo preparado y te avisaremos cuando esté listo para retirar o enviar.'
            : 'recibimos tu pedido por WhatsApp. En breve un asesor te contactará para confirmar disponibilidad y coordinar la entrega.'
          }
        </p>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <thead>
            <tr style="background:#3D1A05;">
              <th style="padding:10px 12px; color:#F2E6C8; text-align:left; font-size:12px;">PRODUCTO</th>
              <th style="padding:10px 12px; color:#F2E6C8; text-align:center; font-size:12px;">CANT.</th>
              <th style="padding:10px 12px; color:#F2E6C8; text-align:right; font-size:12px;">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>${lineas}</tbody>
        </table>
        <div style="text-align:right; padding:12px; background:#F2E6C8; border:1px solid #DDD0A8; border-radius:4px;">
          <span style="color:#6B3A1A; font-size:13px;">Total estimado: </span>
          <span style="color:#3D1A05; font-size:20px; font-weight:800;">$${params.total.toLocaleString('es-AR')}</span>
        </div>
        <p style="color:#A0622A; font-size:12px; margin-top:12px;">
          * Los precios son orientativos y se confirman al momento de la entrega.
        </p>
      </div>
      ${footer}
    </div>`,
  })
}

// ── 5. Notificación de nuevo pedido al admin ──────────────────────────────

export async function sendPedidoAdminEmail(params: {
  clienteNombre: string
  clienteEmail: string
  items: { nombre: string; cantidad: number; precio: number }[]
  total: number
}): Promise<void> {
  const lineas = params.items.map(i =>
    `• ${i.nombre} x${i.cantidad} — $${(i.precio * i.cantidad).toLocaleString('es-AR')}`
  ).join('<br/>')

  await resend().emails.send({
    from: FROM,
    to: ADMIN,
    subject: `Nuevo pedido de ${params.clienteNombre} — $${params.total.toLocaleString('es-AR')}`,
    html: `<div style="${baseStyle}">
      ${header('Nuevo pedido recibido')}
      <div style="padding:28px 32px;">
        <p style="color:#3D1A05; margin-bottom:16px;">
          <strong>${params.clienteNombre}</strong> (${params.clienteEmail}) realizó un pedido por WhatsApp.
        </p>
        <div style="background:#F2E6C8; padding:16px; border-left:3px solid #C4A040; border-radius:2px; margin-bottom:16px; line-height:1.8;">
          ${lineas}
        </div>
        <p style="color:#3D1A05; font-size:18px; font-weight:800; text-align:right;">
          Total: $${params.total.toLocaleString('es-AR')}
        </p>
      </div>
      ${footer}
    </div>`,
  })
}
