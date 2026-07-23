import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import WhatsAppButton from '@/components/WhatsAppButton'
import type { Categoria, Producto } from '@/types'

const APP_URL = 'https://legadobyd.com'

// Ver nota en src/app/page.tsx — sin esto los precios quedan congelados en el build.
export const revalidate = 60

/** Copy propio por categoría: le da a Google contenido único que rankear. */
const COPY: Record<string, { titulo: string; intro: string }> = {
  panaderia: {
    titulo: 'Insumos de panadería en Neuquén',
    intro:
      'Todo para la panadería profesional y casera: harinas, levaduras, mejoradores, asaderas, moldes y utensilios. Atendemos a panaderos de Neuquén y toda la Patagonia.',
  },
  pasteleria: {
    titulo: 'Insumos de pastelería y repostería en Neuquén',
    intro:
      'Colorantes, esencias, moldes, cortantes, coberturas y todo lo que necesitás para tortas y postres. Calidad profesional para pasteleros de Neuquén.',
  },
  decoracion: {
    titulo: 'Artículos de decoración y bazar en Neuquén',
    intro:
      'Decoración, bazar y accesorios para tu mesa y tu negocio. Encontrá piezas con estilo para regalar o ambientar, en Neuquén.',
  },
}

async function getCategoria(slug: string): Promise<Categoria | null> {
  const snap = await adminDb().collection('categorias').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Categoria
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  try {
    const cat = await getCategoria(slug)
    if (!cat) return { title: 'Categoría no encontrada' }

    const copy = COPY[slug]
    const title = copy?.titulo ?? `${cat.nombre} en Neuquén`
    const description =
      copy?.intro ??
      `Comprá ${cat.nombre.toLowerCase()} en Legado Bazar y Deco, Neuquén. Insumos para panadería, pastelería y decoración con envío a toda la Patagonia.`

    return {
      // El template global agrega " | Legado Bazar y Deco"
      title: title.length > 38 ? title.slice(0, 35) + '...' : title,
      description: description.length > 155 ? description.slice(0, 152) + '...' : description,
      alternates: { canonical: `${APP_URL}/categoria/${slug}` },
      openGraph: {
        title: `${title} | Legado Bazar y Deco`,
        description,
        url: `${APP_URL}/categoria/${slug}`,
        type: 'website',
        locale: 'es_AR',
        siteName: 'Legado Bazar y Deco',
        images: [{ url: `${APP_URL}/legado.png`, width: 1200, height: 630, alt: title }],
      },
    }
  } catch {
    return { title: 'Categoría' }
  }
}

/** Pre-genera las categorías existentes en el build; el resto se renderiza on-demand. */
export async function generateStaticParams() {
  try {
    const snap = await adminDb().collection('categorias').get()
    return snap.docs.map(d => ({ slug: (d.data() as Categoria).slug })).filter(p => p.slug)
  } catch {
    return []
  }
}

export default async function CategoriaPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  let categorias: Categoria[] = []
  let productos: Producto[] = []
  let categoria: Categoria | null = null

  try {
    const [catsSnap, prodsSnap] = await Promise.all([
      adminDb().collection('categorias').get(),
      adminDb().collection('productos').where('categoria', '==', slug).get(),
    ])
    categorias = catsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Categoria))
    categoria = categorias.find(c => c.slug === slug) ?? null
    productos = prodsSnap.docs.map(d => {
      // Los Timestamps de Firestore no son serializables como props de Client Component
      const { createdAt: _c, updatedAt: _u, ...rest } = d.data()
      return { id: d.id, ...rest } as Producto
    })
  } catch {}

  if (!categoria) notFound()

  const copy = COPY[slug]
  const titulo = copy?.titulo ?? `${categoria.nombre} en Neuquén`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: categoria.nombre, item: `${APP_URL}/categoria/${slug}` },
    ],
  }

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: titulo,
    description: copy?.intro,
    url: `${APP_URL}/categoria/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'Legado Bazar y Deco', url: APP_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: productos.length,
      itemListElement: productos.slice(0, 30).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${APP_URL}/producto/${p.id}`,
        name: p.nombre,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Navbar />

      <main style={{ backgroundColor: '#FDF8EE', minHeight: '100vh' }}>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <nav aria-label="breadcrumb" style={{ marginBottom: 20 }}>
            <ol className="flex items-center gap-2" style={{ fontSize: '0.85rem', color: '#A0622A' }}>
              <li><a href="/" style={{ color: '#A0622A' }}>Inicio</a></li>
              <li>/</li>
              <li style={{ color: '#6B3A1A' }}>{categoria.nombre}</li>
            </ol>
          </nav>

          <div className="text-center">
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
              {categoria.emoji} {categoria.nombre}
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#3D1A05',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 700,
                marginBottom: '14px',
                lineHeight: 1.2,
              }}
            >
              {titulo}
            </h1>
            {copy?.intro && (
              <p
                style={{
                  color: '#6B3A1A',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  maxWidth: '640px',
                  margin: '0 auto 20px',
                }}
              >
                {copy.intro}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
              <span style={{ color: '#C4A040' }}>✦</span>
              <div style={{ width: 50, height: 1, backgroundColor: '#C4A040' }} />
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductGrid
              categorias={categorias}
              initialProductos={productos}
              categoriaInicial={slug}
            />
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  )
}
