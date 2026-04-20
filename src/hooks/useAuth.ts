'use client'

import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { getUsuario, createUsuario } from '@/lib/firebase/usuarios'
import type { Usuario } from '@/types'

const provider = new GoogleAuthProvider()

function isMobile() {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
    .split(',').map(e => e.trim()).filter(Boolean)

  useEffect(() => {
    const auth = getFirebaseAuth()

    // Manejar resultado de redirect (mobile)
    getRedirectResult(auth).catch(() => {})

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      try {
        if (u && !adminEmails.includes(u.email ?? '')) {
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
      } catch (err) {
        console.error('useAuth profile error:', err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const isAdmin = adminEmails.includes(user?.email ?? '')
  const isCustomer = !!user && !isAdmin

  async function signInWithGoogle(): Promise<{ error?: string }> {
    try {
      const auth = getFirebaseAuth()
      if (isMobile()) {
        await signInWithRedirect(auth, provider)
        return {}
      } else {
        await signInWithPopup(auth, provider)
        return {}
      }
    } catch (err: any) {
      console.error('signInWithGoogle error:', err)
      return { error: err.message || 'Error al iniciar sesión.' }
    }
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth())
    setProfile(null)
  }

  function refreshProfile() {
    if (user && !isAdmin) {
      getUsuario(user.uid).then(setProfile)
    }
  }

  return {
    user, profile, loading, isAdmin, isCustomer,
    signInWithGoogle,
    signInCustomer: signInWithGoogle,
    signOut, refreshProfile,
  }
}
