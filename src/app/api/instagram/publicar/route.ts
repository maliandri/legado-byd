import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const webhookUrl = process.env.MAKE_INSTAGRAM_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook de Make.com no configurado (MAKE_INSTAGRAM_WEBHOOK_URL)' }, { status: 500 })
    }

    const body = await req.json()
    const { caption, imageUrl, videoUrl, type } = body

    if (!caption) {
      return NextResponse.json({ error: 'El caption es requerido' }, { status: 400 })
    }

    const payload: Record<string, any> = {
      caption,
      type: type || 'post',
      timestamp: new Date().toISOString(),
      source: 'legado-byd',
    }

    if (imageUrl) payload.imageUrl = imageUrl
    if (videoUrl) {
      payload.videoUrl = videoUrl
      payload.url = videoUrl
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Make.com webhook respondió ${res.status}`)
    }

    return NextResponse.json({ ok: true, message: 'Enviado a Instagram vía Make.com' })
  } catch (err: any) {
    console.error('instagram/publicar error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
