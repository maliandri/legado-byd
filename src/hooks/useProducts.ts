'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProductos } from '@/lib/firebase/firestore'
import type { Producto } from '@/types'

export function useProducts(categoriaSlug?: string, initialData?: Producto[]) {
  const [todos, setTodos] = useState<Producto[]>(initialData ?? [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((background = false) => {
    if (!background) setLoading(true)
    getProductos()
      .then(setTodos)
      .catch(() => { if (!background) setError('No se pudieron cargar los productos.') })
      .finally(() => { if (!background) setLoading(false) })
  }, [])

  // Con initialData (HTML de ISR) refrescamos en segundo plano: el usuario ve el
  // catálogo al instante y los precios se corrigen solos si cambiaron hace segundos.
  // Sin initialData es la carga normal, con spinner.
  useEffect(() => {
    load(Boolean(initialData))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const productos = categoriaSlug
    ? todos.filter(p => p.categoria === categoriaSlug)
    : todos

  return { productos, loading, error, refresh: load }
}
