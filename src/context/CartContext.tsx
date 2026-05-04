'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Producto } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CartItem {
  producto: Producto
  cantidad: number
}

interface CartState {
  items: CartItem[]
  open: boolean
}

type CartAction =
  | { type: 'ADD'; producto: Producto }
  | { type: 'REMOVE'; id: string }
  | { type: 'INCREMENT'; id: string }
  | { type: 'DECREMENT'; id: string }
  | { type: 'CLEAR' }
  | { type: 'SET_OPEN'; open: boolean }
  | { type: 'HYDRATE'; items: CartItem[] }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.items }

    case 'ADD': {
      const existing = state.items.find((i) => i.producto.id === action.producto.id)
      if (existing) {
        if (existing.cantidad >= action.producto.stock) return state
        return {
          ...state,
          items: state.items.map((i) =>
            i.producto.id === action.producto.id
              ? { ...i, cantidad: i.cantidad + 1 }
              : i
          ),
        }
      }
      if (action.producto.stock <= 0) return state
      return {
        ...state,
        items: [...state.items, { producto: action.producto, cantidad: 1 }],
      }
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.producto.id !== action.id) }

    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.producto.id === action.id && i.cantidad < i.producto.stock
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        ),
      }

    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.producto.id === action.id ? { ...i, cantidad: i.cantidad - 1 } : i
          )
          .filter((i) => i.cantidad > 0),
      }

    case 'CLEAR':
      return { ...state, items: [] }

    case 'SET_OPEN':
      return { ...state, open: action.open }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[]
  open: boolean
  totalItems: number
  totalPrecio: number
  addItem: (producto: Producto) => void
  removeItem: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void
  setOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'legado-bazar-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], open: false })

  // Hidratar desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const items: CartItem[] = JSON.parse(saved)
        dispatch({ type: 'HYDRATE', items })
      }
    } catch {
      // localStorage no disponible
    }
  }, [])

  // Persistir en localStorage al cambiar items
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // localStorage no disponible
    }
  }, [state.items])

  const totalItems = state.items.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = state.items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0)

  const value: CartContextValue = {
    items: state.items,
    open: state.open,
    totalItems,
    totalPrecio,
    addItem: (producto) => dispatch({ type: 'ADD', producto }),
    removeItem: (id) => dispatch({ type: 'REMOVE', id }),
    increment: (id) => dispatch({ type: 'INCREMENT', id }),
    decrement: (id) => dispatch({ type: 'DECREMENT', id }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    setOpen: (open) => dispatch({ type: 'SET_OPEN', open }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
