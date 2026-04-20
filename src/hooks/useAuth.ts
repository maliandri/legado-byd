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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirectError, setRedirectError] = useState<string | null>(null)

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
    .split(',').map(e => e.trim()).filter(Boolean)

  useEffect(() => {
    const auth = getFirebaseAuth()

    // Procesar resultado de redirect (mobile) — captura errores visibles
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) setRedirectError(null)
      })
      .catch(err => {
        console.error('getRedirectResult error:', err)
        setRedirectError(err.message || 'Error al iniciar sesión con Google.')
      })

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
      // Intentar popup primero; si está bloqueado (mobile) usar redirect
      try {
        await signInWithPopup(auth, provider)
      } catch (popupErr: any) {
        if (
          popupErr.code === 'auth/popup-blocked' ||
          popupErr.code === 'auth/popup-closed-by-user' ||
          popupErr.code === 'auth/cancelled-popup-request'
        ) {
          await signInWithRedirect(auth, provider)
          // La página navega — no hay más código que ejecutar
        } else {
          throw popupErr
        }
      }
      return {}
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
    redirectError,
    signInWithGoogle,
    signInCustomer: signInWithGoogle,
    signOut, refreshProfile,
  }
}
