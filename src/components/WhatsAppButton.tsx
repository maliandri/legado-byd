import { MessageCircle } from 'lucide-react'

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492990000000'

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      style={{ backgroundColor: '#25D366', color: '#fff' }}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={22} />
      <span className="text-sm font-semibold hidden sm:inline">¿Consultas?</span>
    </a>
  )
}
