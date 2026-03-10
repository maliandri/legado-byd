export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string // slug de categoría
  stock: boolean
  imagen: string // URL de Firebase Storage
  createdAt: Date
  updatedAt: Date
}

export interface Categoria {
  id: string
  nombre: string
  slug: string
  emoji: string
}
