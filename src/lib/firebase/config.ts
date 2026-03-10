import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { type Auth } from 'firebase/auth'
import { type Firestore } from 'firebase/firestore'
import { type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000:web:000000',
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export function getFirebaseAuth(): Auth {
  const { getAuth } = require('firebase/auth')
  return getAuth(getFirebaseApp())
}

export function getFirebaseDb(): Firestore {
  const { getFirestore } = require('firebase/firestore')
  return getFirestore(getFirebaseApp())
}

export function getFirebaseStorage(): FirebaseStorage {
  const { getStorage } = require('firebase/storage')
  return getStorage(getFirebaseApp())
}

// Lazy singletons — sólo se instancian en el cliente
let _auth: Auth | null = null
let _db: Firestore | null = null
let _storage: FirebaseStorage | null = null

export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getFirebaseAuth()
    return (_auth as any)[prop]
  },
})

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) _db = getFirebaseDb()
    return (_db as any)[prop]
  },
})

export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    if (!_storage) _storage = getFirebaseStorage()
    return (_storage as any)[prop]
  },
})
