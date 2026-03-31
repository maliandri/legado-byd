'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProductos } from '@/lib/firebase/firestore'
import type { Producto } from '@/types'

export function useProducts(categoriaSlug?: string) {
  const [todos, setTodos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getProductos()
      .then(setTodos)
      .catch(() => setError('No se pudieron cargar los productos.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const productos = categoriaSlug
    ? todos.filter(p => p.categoria === categoriaSlug)
    : todos

  return { productos, loading, error, refresh: load }
}
