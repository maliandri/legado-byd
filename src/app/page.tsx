import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import WhatsAppButton from '@/components/WhatsAppButton'

const categorias = [
  { id: '1', nombre: 'Panadería', slug: 'panaderia', emoji: '🍞' },
  { id: '2', nombre: 'Pastelería', slug: 'pasteleria', emoji: '🎂' },
  { id: '3', nombre: 'Decoración', slug: 'decoracion', emoji: '✨' },
]

export default function HomePage() {

  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #3D1A05 0%, #6B3A1A 50%, #4A5E1A 100%)',
            minHeight: '520px',
          }}
        >
          {/* Textura de fondo */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C4A040' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
            {/* Ornamento superior */}
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 60, height: 1, backgroundColor: '#C4A040' }} />
              <span style={{ color: '#C4A040', fontSize: '1.2rem' }}>✦</span>
              <div style={{ width: 60, height: 1, backgroundColor: '#C4A040' }} />
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#F2E6C8',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '16px',
                textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              El almacén del panadero
            </h1>

            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#C4A040',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                fontStyle: 'italic',
                marginBottom: '24px',
              }}
            >
              — Insumos con historia —
            </p>

            <p
              style={{
                color: '#DDD0A8',
                fontSize: '1rem',
                maxWidth: '560px',
                lineHeight: '1.7',
                marginBottom: '40px',
              }}
            >
              Proveemos a panaderos, pasteleros y decoradores de Neuquén los mejores insumos
              con el sabor artesanal de siempre. Calidad que se transmite de generación en generación.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#catalogo"
                className="px-7 py-3.5 rounded-sm font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#C4A040', color: '#3D1A05' }}
              >
                Ver catálogo completo
              </a>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-sm font-semibold text-sm transition-all hover:opacity-80"
                style={{ border: '1.5px solid #C4A040', color: '#F2E6C8', backgroundColor: 'transparent' }}
              >
                Consultar por WhatsApp
              </a>
            </div>

            {/* Ornamento inferior */}
            <div className="flex items-center gap-3 mt-12">
              <div style={{ width: 40, height: 1, backgroundColor: 'rgba(196,160,64,0.4)' }} />
              <span style={{ color: 'rgba(196,160,64,0.6)', fontSize: '0.9rem' }}>✦</span>
              <div style={{ width: 40, height: 1, backgroundColor: 'rgba(196,160,64,0.4)' }} />
            </div>
          </div>
        </section>

        {/* ── CATEGORÍAS ── */}
        <section
          style={{ backgroundColor: '#F2E6C8', borderBottom: '2px solid #DDD0A8' }}
          className="py-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {categorias.map((cat) => (
                <a
                  key={cat.slug}
                  href={`#${cat.slug}`}
                  className="flex flex-col items-center gap-3 p-5 rounded-sm text-center transition-all hover:-translate-y-1 group"
                  style={{
                    backgroundColor: '#FDF8EE',
                    border: '1px solid #DDD0A8',
                  }}
                  id={cat.slug}
                >
                  <span
                    className="text-4xl group-hover:scale-110 transition-transform"
                    role="img"
                    aria-label={cat.nombre}
                  >
                    {cat.emoji}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: '#3D1A05',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  >
                    {cat.nombre}
                  </span>
                  <div
                    style={{ width: 30, height: 2, backgroundColor: '#C4A040' }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATÁLOGO ── */}
        <section id="catalogo" className="py-16" style={{ backgroundColor: '#FDF8EE' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Encabezado de sección */}
            <div className="text-center mb-12">
              <p
                style={{
                  color: '#A0622A',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: '8px',
                }}
              >
                Nuestros productos
              </p>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#3D1A05',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}
              >
                El almacén completo
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
                <span style={{ color: '#C4A040' }}>✦</span>
                <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
              </div>
            </div>

            <ProductGrid categorias={categorias} />
          </div>
        </section>

        {/* ── FRANJA FINAL ── */}
        <section
          className="py-12 text-center"
          style={{ backgroundColor: '#F2E6C8', borderTop: '2px solid #DDD0A8' }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#6B3A1A',
              fontSize: '1.1rem',
              fontStyle: 'italic',
            }}
          >
            🌾 &nbsp; Insumos de calidad para cada hornada &nbsp; 🌾
          </p>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
