import { NextResponse } from 'next/server'
import { getFirebaseDb } from '@/lib/firebase/config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { sendOTPEmail } from '@/lib/resend/client'

export const runtime = 'nodejs'

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  try {
    const { uid, email, nombre } = await req.json()
    if (!uid || !email) {
      return NextResponse.json({ error: 'uid y email son requeridos' }, { status: 400 })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Guardar OTP en Firestore
    try {
      await setDoc(doc(getFirebaseDb(), 'otps', uid), {
        code,
        expiresAt,
        createdAt: serverTimestamp(),
      })
    } catch (firestoreErr: any) {
      console.error('send-otp FIRESTORE error:', firestoreErr)
      return NextResponse.json({ error: `Firestore: ${firestoreErr.message}` }, { status: 500 })
    }

    // Enviar email
    try {
      await sendOTPEmail({ email, nombre: nombre || email.split('@')[0], code })
    } catch (resendErr: any) {
      console.error('send-otp RESEND error:', resendErr)
      return NextResponse.json({ error: `Email: ${resendErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: err.message || 'Error al enviar OTP' }, { status: 500 })
  }
}
