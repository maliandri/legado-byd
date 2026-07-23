import type { MetadataRoute } from 'next'
import { adminDb } from '@/lib/firebase/admin'

const APP_URL = 'https://legadobyd.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_pages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  ]

  try {
    const [snap, catsSnap] = await Promise.all([
      adminDb().collection('productos').select('updatedAt', 'createdAt').get(),
      adminDb().collection('categorias').select('slug').get(),
    ])

    const productos: MetadataRoute.Sitemap = snap.docs.map(doc => {
      const data = doc.data()
      const lastMod = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date()
      return {
        url: `${APP_URL}/producto/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    })

    // Landings de categoría: prioridad alta, son las que captan las búsquedas genéricas
    const categorias: MetadataRoute.Sitemap = catsSnap.docs
      .map(doc => doc.data().slug as string | undefined)
      .filter((slug): slug is string => Boolean(slug))
      .map(slug => ({
        url: `${APP_URL}/categoria/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }))

    return [...static_pages, ...categorias, ...productos]
  } catch {
    return static_pages
  }
}
