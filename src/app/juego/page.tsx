import type { Metadata } from 'next'
import PanaderiaRush from '@/components/game/PanaderiaRush'

export const metadata: Metadata = {
  title: 'Panadería Rush | Legado Bazar y Deco',
  description: '¡Atrapá los ingredientes y sumá puntos! El mini-juego de Legado Bazar y Deco, Neuquén.',
}

export default function JuegoPage() {
  return <PanaderiaRush />
}
