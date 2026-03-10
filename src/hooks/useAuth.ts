'use client'

import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

const provider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const isAdmin = user?.email === adminEmail

  async function signInWithGoogle(): Promise<{ error?: string }> {
    try {
      const result = await signInWithPopup(auth, provider)
      if (result.user.email !== adminEmail) {
        await firebaseSignOut(auth)
        return { error: 'Email no autorizado para acceder al panel de administración.' }
      }
      return {}
    } catch (err) {
      console.error(err)
      return { error: 'Error al iniciar sesión. Intentá de nuevo.' }
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { user, loading, isAdmin, signInWithGoogle, signOut }
}
