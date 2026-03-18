import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Usuario } from '@/types'

export async function getUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    uid: snap.id,
    email: d.email,
    nombre: d.nombre,
    telefono: d.telefono,
    direccion: d.direccion,
    favoritos: d.favoritos ?? [],
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  }
}

export async function createUsuario(uid: string, data: { email: string; nombre: string }): Promise<void> {
  await setDoc(doc(db, 'usuarios', uid), {
    email: data.email,
    nombre: data.nombre,
    favoritos: [],
    createdAt: serverTimestamp(),
  })
}

export async function updateUsuario(uid: string, data: Partial<Pick<Usuario, 'nombre' | 'telefono' | 'direccion'>>): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), { ...data })
}

export async function toggleFavorito(uid: string, productoId: string, isFav: boolean): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), {
    favoritos: isFav ? arrayRemove(productoId) : arrayUnion(productoId),
  })
}
