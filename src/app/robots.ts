import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/vendedor/', '/registro/', '/mi-cuenta/', '/pago/', '/login/'],
      },
    ],
    sitemap: 'https://legadobyd.com/sitemap.xml',
  }
}
