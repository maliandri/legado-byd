import { MapPin, Phone, Instagram, MessageCircle } from 'lucide-react'

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#3D1A05',
        borderTop: '3px solid #C4A040',
        color: '#F2E6C8',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Marca */}
          <div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#C4A040',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              Legado ByD
            </h3>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#DDD0A8',
                fontSize: '0.85rem',
                fontStyle: 'italic',
                marginBottom: '12px',
              }}
            >
              El almacén del panadero · Insumos con historia
            </p>
            <p style={{ color: '#DDD0A8', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Proveemos insumos de calidad para panaderos, pasteleros y decoradores
              de Neuquén y la región.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h4
              style={{
                color: '#C4A040',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: '12px',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin size={16} style={{ color: '#C4A040', marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: '#DDD0A8', fontSize: '0.875rem' }}>
                  Neuquén, Argentina
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} style={{ color: '#C4A040', flexShrink: 0 }} />
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#DDD0A8', fontSize: '0.875rem' }}
                  className="hover:text-[#C4A040] transition-colors"
                >
                  +54 299 000-0000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Instagram size={16} style={{ color: '#C4A040', flexShrink: 0 }} />
                <a
                  href="https://instagram.com/legadobyd"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#DDD0A8', fontSize: '0.875rem' }}
                  className="hover:text-[#C4A040] transition-colors"
                >
                  @legadobyd
                </a>
              </li>
            </ul>
          </div>

          {/* CTA WhatsApp */}
          <div>
            <h4
              style={{
                color: '#C4A040',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: '12px',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              ¿Necesitás algo?
            </h4>
            <p style={{ color: '#DDD0A8', fontSize: '0.875rem', marginBottom: '16px' }}>
              Consultanos por cualquier insumo, pedido al por mayor o consulta especial.
              Respondemos rápido.
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-sm font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
            >
              <MessageCircle size={18} />
              Escribinos al WhatsApp
            </a>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{ borderTop: '1px solid rgba(196, 160, 64, 0.3)', marginTop: '40px', paddingTop: '20px' }}
          className="flex flex-col sm:flex-row justify-between items-center gap-2"
        >
          <p style={{ color: '#7A6040', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Legado ByD — Todos los derechos reservados
          </p>
          <p style={{ color: '#7A6040', fontSize: '0.8rem' }}>
            Neuquén, Patagonia Argentina 🌾
          </p>
        </div>
      </div>
    </footer>
  )
}
