import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

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

let _auth: Auth | null = null
export function getFirebaseAuth(): Auth {
  if (_auth) return _auth
  const app = getFirebaseApp()
  if (typeof window === 'undefined') {
    // SSR: inicialización mínima sin APIs de browser
    _auth = getAuth(app)
  } else {
    // Browser: inicialización completa con persistence y resolver
    _auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  }
  return _auth
}

let _db: Firestore | null = null
export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp())
  return _db
}

let _storage: FirebaseStorage | null = null
export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getFirebaseApp())
  return _storage
}

// Lazy proxies — delegan al singleton correcto según entorno
export const auth = new Proxy({} as Auth, {
  get(_, prop) { return (getFirebaseAuth() as any)[prop] },
  set(_, prop, value) { ;(getFirebaseAuth() as any)[prop] = value; return true },
})

export const db = new Proxy({} as Firestore, {
  get(_, prop) { return (getFirebaseDb() as any)[prop] },
})

export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop) { return (getFirebaseStorage() as any)[prop] },
})
