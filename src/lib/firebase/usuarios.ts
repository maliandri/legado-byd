import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from './config'
import type { Usuario } from '@/types'

export async function getUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'usuarios', uid))
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
  await setDoc(doc(getFirebaseDb(), 'usuarios', uid), {
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
  await updateDoc(doc(getFirebaseDb(), 'usuarios', uid), { ...data })
}

export async function toggleFavorito(uid: string, productoId: string, isFav: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'usuarios', uid), {
    favoritos: isFav ? arrayRemove(productoId) : arrayUnion(productoId),
  })
}

export async function getUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'usuarios'))
  return snap.docs.map(d => {
    const data = d.data()
    return {
      uid: d.id,
      email: data.email,
      nombre: data.nombre,
      tipo: data.tipo,
      dni: data.dni,
      fechaNacimiento: data.fechaNacimiento,
      cuit: data.cuit,
      razonSocial: data.razonSocial,
      telefono: data.telefono,
      direccion: data.direccion,
      ciudad: data.ciudad,
      provincia: data.provincia,
      favoritos: data.favoritos ?? [],
      perfilCompleto: data.perfilCompleto ?? false,
      bloqueado: data.bloqueado ?? false,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as Usuario
  })
}

export async function deleteUsuario(uid: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'usuarios', uid))
}
