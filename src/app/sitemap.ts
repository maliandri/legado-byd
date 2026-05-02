import type { MetadataRoute } from 'next'
import { adminDb } from '@/lib/firebase/admin'

const APP_URL = 'https://legadobyd.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_pages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    const snap = await adminDb().collection('productos').select('updatedAt', 'createdAt').get()
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
    return [...static_pages, ...productos]
  } catch {
    return static_pages
  }
}
