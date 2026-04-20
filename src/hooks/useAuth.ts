'use client'

import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
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

  async function signInWithEmail(email: string, password: string): Promise<{ error?: string }> {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      return {}
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
      }
      return { error: msg[err.code] || err.message }
    }
  }

  async function signUpWithEmail(email: string, password: string, nombre: string): Promise<{ error?: string }> {
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      await updateProfile(cred.user, { displayName: nombre })
      return {}
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Iniciá sesión.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-email': 'El email no es válido.',
      }
      return { error: msg[err.code] || err.message }
    }
  }

  async function resetPassword(email: string): Promise<{ error?: string }> {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email)
      return {}
    } catch (err: any) {
      return { error: 'No se pudo enviar el email. Verificá la dirección.' }
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
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut, refreshProfile,
  }
}
