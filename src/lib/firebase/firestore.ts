import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from './config'
import type { Producto, Categoria } from '@/types'

const db = () => getFirebaseDb()

// ─── Productos ─────────────────────────────────────────────────────────────

export async function getProductos(): Promise<Producto[]> {
  const snap = await getDocs(query(collection(db(), 'productos'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as Producto
  })
}

export async function getProductosByCategoria(slug: string): Promise<Producto[]> {
  const snap = await getDocs(
    query(collection(db(), 'productos'), where('categoria', '==', slug), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as Producto
  })
}

export async function getProducto(id: string): Promise<Producto | null> {
  const snap = await getDoc(doc(db(), 'productos', id))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  } as Producto
}

export async function createProducto(data: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'productos'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProducto(id: string, data: Partial<Omit<Producto, 'id' | 'createdAt'>>): Promise<void> {
  await updateDoc(doc(db(), 'productos', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProducto(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'productos', id))
}

// ─── Categorías ────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const snap = await getDocs(collection(db(), 'categorias'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Categoria))
}

export async function createCategoria(data: Omit<Categoria, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'categorias'), data)
  return ref.id
}

export async function updateCategoria(id: string, data: Partial<Omit<Categoria, 'id'>>): Promise<void> {
  await updateDoc(doc(db(), 'categorias', id), data)
}

export async function deleteCategoria(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'categorias', id))
}
