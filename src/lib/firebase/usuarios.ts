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
    tipo: d.tipo,
    dni: d.dni,
    fechaNacimiento: d.fechaNacimiento,
    cuit: d.cuit,
    razonSocial: d.razonSocial,
    telefono: d.telefono,
    direccion: d.direccion,
    ciudad: d.ciudad,
    provincia: d.provincia,
    favoritos: d.favoritos ?? [],
    perfilCompleto: d.perfilCompleto ?? false,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  }
}

export async function createUsuario(uid: string, data: { email: string; nombre: string }): Promise<void> {
  await setDoc(doc(db, 'usuarios', uid), {
    email: data.email,
    nombre: data.nombre,
    favoritos: [],
    perfilCompleto: false,
    createdAt: serverTimestamp(),
  })
}

export async function updateUsuario(
  uid: string,
  data: Partial<Omit<Usuario, 'uid' | 'email' | 'favoritos' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), { ...data })
}

export async function toggleFavorito(uid: string, productoId: string, isFav: boolean): Promise<void> {
  await updateDoc(doc(db, 'usuarios', uid), {
    favoritos: isFav ? arrayRemove(productoId) : arrayUnion(productoId),
  })
}
