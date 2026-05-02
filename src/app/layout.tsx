import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/CartDrawer'

const APP_URL = 'https://legadobyd.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Legado Bazar y Deco — El almacén del panadero en Neuquén',
    template: '%s | Legado Bazar y Deco',
  },
  description: 'Insumos para panadería, pastelería y decoración en Neuquén, Argentina. Harina, levadura, colorantes, moldes y más. Comprá online o consultá por WhatsApp.',
  keywords: ['panadería', 'pastelería', 'decoración', 'insumos', 'Neuquén', 'harina', 'levadura', 'moldes', 'colorantes', 'bazar'],
  authors: [{ name: 'Legado Bazar y Deco', url: APP_URL }],
  creator: 'Legado Bazar y Deco',
  publisher: 'Legado Bazar y Deco',
  alternates: { canonical: APP_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: APP_URL,
    siteName: 'Legado Bazar y Deco',
    title: 'Legado Bazar y Deco — El almacén del panadero en Neuquén',
    description: 'Insumos para panadería, pastelería y decoración en Neuquén, Argentina.',
    images: [{ url: '/legado.png', width: 1200, height: 630, alt: 'Legado Bazar y Deco' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legado Bazar y Deco — El almacén del panadero en Neuquén',
    description: 'Insumos para panadería, pastelería y decoración en Neuquén, Argentina.',
    images: ['/legado.png'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Legado Bazar y Deco',
  description: 'Insumos para panadería, pastelería y decoración en Neuquén, Argentina.',
  url: APP_URL,
  logo: `${APP_URL}/legado.png`,
  image: `${APP_URL}/legado.png`,
  telephone: '+5492994290637',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Neuquén',
    addressRegion: 'Neuquén',
    addressCountry: 'AR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -38.9516,
    longitude: -68.0591,
  },
  sameAs: ['https://www.instagram.com/legadobazarydeco/'],
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' },
  ],
  priceRange: '$$',
  currenciesAccepted: 'ARS',
  paymentAccepted: 'Cash, Credit Card, Mercado Pago',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
