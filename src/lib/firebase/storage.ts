import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

export async function uploadProductImage(file: File, productoId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `productos/${productoId}_${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  const snap = await uploadBytes(storageRef, file)
  return getDownloadURL(snap.ref)
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // Ignorar si la imagen no existe
  }
}
