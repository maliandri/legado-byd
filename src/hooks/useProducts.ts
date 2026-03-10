'use client'

import { useState, useEffect } from 'react'
import { getProductos, getProductosByCategoria } from '@/lib/firebase/firestore'
import type { Producto } from '@/types'

export function useProducts(categoriaSlug?: string) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const fetch = categoriaSlug
      ? getProductosByCategoria(categoriaSlug)
      : getProductos()

    fetch
      .then(setProductos)
      .catch(() => setError('No se pudieron cargar los productos.'))
      .finally(() => setLoading(false))
  }, [categoriaSlug])

  function refresh() {
    setLoading(true)
    const fetch = categoriaSlug
      ? getProductosByCategoria(categoriaSlug)
      : getProductos()

    fetch
      .then(setProductos)
      .catch(() => setError('No se pudieron cargar los productos.'))
      .finally(() => setLoading(false))
  }

  return { productos, loading, error, refresh }
}
