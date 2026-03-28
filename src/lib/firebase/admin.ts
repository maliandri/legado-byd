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
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  })

  return adminApp
}

export const adminDb = () => getFirestore(getAdminApp())
export const adminAuth = () => getAuth(getAdminApp())
