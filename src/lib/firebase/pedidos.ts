import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { ItemPedido, Pedido } from '@/types'

export async function savePedido(uid: string, items: ItemPedido[]): Promise<string> {
  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const ref = await addDoc(collection(db, 'pedidos', uid, 'ordenes'), {
    uid,
    items,
    total,
    estado: 'pendiente',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getPedidos(uid: string): Promise<Pedido[]> {
  const q = query(
    collection(db, 'pedidos', uid, 'ordenes'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      uid: data.uid,
      items: data.items,
      total: data.total,
      estado: data.estado,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    }
  })
}
