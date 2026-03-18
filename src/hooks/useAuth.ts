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
import { getUsuario, createUsuario } from '@/lib/firebase/usuarios'
import type { Usuario } from '@/types'

const provider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u && u.email !== adminEmail) {
        let userProfile = await getUsuario(u.uid)
        if (!userProfile) {
          await createUsuario(u.uid, {
            email: u.email ?? '',
            nombre: u.displayName ?? u.email?.split('@')[0] ?? 'Cliente',
          })
          userProfile = await getUsuario(u.uid)
        }
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [adminEmail])

  const isAdmin = user?.email === adminEmail
  const isCustomer = !!user && !isAdmin

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

  async function signInCustomer(): Promise<{ error?: string }> {
    try {
      await signInWithPopup(auth, provider)
      return {}
    } catch (err) {
      console.error(err)
      return { error: 'Error al iniciar sesión. Intentá de nuevo.' }
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setProfile(null)
  }

  function refreshProfile() {
    if (user && !isAdmin) {
      getUsuario(user.uid).then(setProfile)
    }
  }

  return { user, profile, loading, isAdmin, isCustomer, signInWithGoogle, signInCustomer, signOut, refreshProfile }
}
