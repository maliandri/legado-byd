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

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no configurada')
  }

  const serviceAccount = JSON.parse(serviceAccountKey)

  // FIREBASE_PRIVATE_KEY en Netlify está en base64 para evitar que corrompa los \n
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || serviceAccount.private_key
  let privateKey = rawKey
  if (rawKey && !rawKey.startsWith('-----')) {
    privateKey = Buffer.from(rawKey, 'base64').toString('utf8')
  } else {
    privateKey = rawKey.replace(/\\n/g, '\n')
  }
  serviceAccount.private_key = privateKey

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  })

  return adminApp
}

export const adminDb = () => getFirestore(getAdminApp())
export const adminAuth = () => getAuth(getAdminApp())
