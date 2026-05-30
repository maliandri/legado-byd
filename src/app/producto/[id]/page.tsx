import type { Metadata } from 'next'
import { adminDb } from '@/lib/firebase/admin'
import ProductoClient from './ProductoClient'
import type { Producto } from '@/types'

const APP_URL = 'https://legadobyd.com'
const STORE_SUFFIX =
  ' — Legado Bazar y Deco, insumos para panadería, pastelería y decoración en Neuquén, Argentina.'

function buildMetaDescription(nombre: string, descripcion?: string): string {
  const raw = descripcion?.trim() ?? ''
  if (raw.length >= 100) {
    return raw.length > 155 ? raw.slice(0, 152) + '...' : raw
  }
  const combined = raw ? `${raw} ${nombre}${STORE_SUFFIX}` : `${nombre}${STORE_SUFFIX}`
  return combined.length > 155 ? combined.slice(0, 152) + '...' : combined
}

function cloudinaryOgUrl(url: string): string {
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/c_fill,f_auto,q_auto,w_1200,h_630/')
  }
  return url
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  try {
    const snap = await adminDb().collection('productos').doc(id).get()
    if (!snap.exists) return { title: 'Producto no encontrado | Legado Bazar y Deco' }
    const p = snap.data()!
    const description = buildMetaDescription(p.nombre, p.descripcion)
    const rawImage = p.imagen || `${APP_URL}/legado.png`
    const imageUrl = cloudinaryOgUrl(rawImage)
    // Keep title ≤ 38 chars so full title (+ " | Legado Bazar y Deco") stays ≤ 60 chars
    const title = p.nombre.length > 38 ? p.nombre.slice(0, 35) + '...' : p.nombre
    return {
      title,
      description,
      alternates: { canonical: `${APP_URL}/producto/${id}` },
      openGraph: {
        title: `${p.nombre} | Legado Bazar y Deco`,
        description,
        url: `${APP_URL}/producto/${id}`,
        images: [{ url: imageUrl, alt: p.nombre, width: 1200, height: 630 }],
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
  let initialProducto = null
  try {
    const snap = await adminDb().collection('productos').doc(id).get()
    if (snap.exists) {
      // Strip Firestore Timestamps — not serializable as Client Component props
      const { createdAt: _c, updatedAt: _u, ...rest } = snap.data()!
      initialProducto = { id: snap.id, ...rest } as Producto
    }
  } catch {}
  return <ProductoClient id={id} initialProducto={initialProducto} />
}
