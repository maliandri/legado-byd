export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string // slug de categoría
  stock: number  // cantidad en stock (0 = sin stock)
  imagen: string // URL de Cloudinary
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

export type TipoUsuario = 'cliente' | 'empresa'

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
