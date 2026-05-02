import type { Metadata } from 'next'
import { adminDb } from '@/lib/firebase/admin'
import ProductoClient from './ProductoClient'

const APP_URL = 'https://legadobyd.com'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  try {
    const snap = await adminDb().collection('productos').doc(id).get()
    if (!snap.exists) return { title: 'Producto no encontrado | Legado Bazar y Deco' }
    const p = snap.data()!
    const description = p.descripcion
      || `${p.nombre} — insumos para panadería y pastelería en Neuquén, Argentina.`
    const imageUrl = p.imagen || `${APP_URL}/legado.png`
    return {
      title: p.nombre,
      description,
      alternates: { canonical: `${APP_URL}/producto/${id}` },
      openGraph: {
        title: `${p.nombre} | Legado Bazar y Deco`,
        description,
        url: `${APP_URL}/producto/${id}`,
        images: [{ url: imageUrl, alt: p.nombre }],
        type: 'website',
        locale: 'es_AR',
        siteName: 'Legado Bazar y Deco',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${p.nombre} | Legado Bazar y Deco`,
        description,
        images: [imageUrl],
      },
    }
  } catch {
    return { title: 'Producto | Legado Bazar y Deco' }
  }
}

export default async function ProductoPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return <ProductoClient id={id} />
}
