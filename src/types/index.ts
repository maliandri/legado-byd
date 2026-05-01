export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string // slug de categoría
  stock: number  // cantidad en stock (0 = sin stock)
  imagen: string // URL de Cloudinary (foto principal)
  imagenes?: string[] // todas las fotos incluyendo la principal
  subfamilia?: string
  marca?: string
  iva?: number       // porcentaje: 10.5 | 21
  costo?: number
  createdAt: Date
  updatedAt: Date
}

export interface Categoria {
  id: string
  nombre: string
  slug: string
  emoji: string
}

export type TipoUsuario = 'cliente' | 'empresa' | 'vendedor'

export interface Usuario {
  uid: string
  email: string
  nombre: string
  tipo?: TipoUsuario
  // Cliente final
  dni?: string
  fechaNacimiento?: string   // ISO date string: YYYY-MM-DD
  // Empresa
  cuit?: string
  razonSocial?: string
  // Compartidos
  telefono?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  favoritos: string[]
  perfilCompleto?: boolean
  bloqueado?: boolean
  createdAt: Date
}

// ── Órdenes (MercadoPago + WhatsApp) ──────────────────────────────────────

export type OrdenEstado =
  | 'pendiente_pago'
  | 'pagado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

export type OrdenCanal = 'mercadopago' | 'whatsapp' | 'vendedor'

export interface OrdenItem {
  productoId: string
  nombre: string
  cantidad: number
  precio: number
}

export interface Order {
  id: string
  // Cliente
  cliente_uid?: string
  email_cliente?: string
  nombre_cliente?: string
  // Pago
  id_transaccion?: string
  metodo_pago?: string
  canal: OrdenCanal
  // Estado logístico
  estado: OrdenEstado
  // Items
  items: OrdenItem[]
  monto_total: number
  // Timestamps
  createdAt: Date
  updatedAt?: Date
  // Logística
  bultos?: number
  notas?: string
  // Vendedor
  vendedorId?: string
  vendedorNombre?: string
}

export interface ItemPedido {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
}

export interface Pedido {
  id: string
  uid: string
  items: ItemPedido[]
  total: number
  estado: 'pendiente' | 'enviado' | 'entregado'
  createdAt: Date
}
