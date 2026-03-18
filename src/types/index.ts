export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string // slug de categoría
  stock: boolean
  imagen: string // URL de Cloudinary
  createdAt: Date
  updatedAt: Date
}

export interface Categoria {
  id: string
  nombre: string
  slug: string
  emoji: string
}

export interface Usuario {
  uid: string
  email: string
  nombre: string
  telefono?: string
  direccion?: string
  favoritos: string[] // array de producto IDs
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
