import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/CartDrawer'

export const metadata: Metadata = {
  title: 'Legado Bazar y Deco — El almacén del panadero',
  description: 'Insumos para panadería, pastelería y decoración en Neuquén, Argentina. Harina, levadura, colorantes, moldes y más.',
  keywords: 'panadería, pastelería, decoración, insumos, Neuquén, harina, levadura',
  openGraph: {
    title: 'Legado Bazar y Deco — El almacén del panadero',
    description: 'Insumos con historia para panaderos y pasteleros de Neuquén.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
