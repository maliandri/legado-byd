import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App

function getAdminApp(): App {
  if (adminApp) return adminApp
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  // Usar variables individuales en vez del JSON completo (evita límite 4KB de Lambda)
  const projectId     = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail   = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey        = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      `Firebase Admin: faltan variables. project=${!!projectId} email=${!!clientEmail} key=${!!rawKey}`
    )
  }

  // La clave puede estar en base64 (Netlify corrompe \n en PEM directo)
  let privateKey: string
  if (!rawKey.startsWith('-----')) {
    privateKey = Buffer.from(rawKey, 'base64').toString('utf8')
  } else {
    privateKey = rawKey.replace(/\\n/g, '\n')
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  })

  return adminApp
}

export const adminDb   = () => getFirestore(getAdminApp())
export const adminAuth = () => getAuth(getAdminApp())
