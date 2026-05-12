import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const TAG_MAP: Record<string, string> = {
  panaderia: 'ambient+acoustic',
  reposteria: 'romantic+soft',
  deco: 'ambient+instrumental',
  default: 'ambient',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const theme = searchParams.get('theme') || 'default'
  const clientId = process.env.JAMENDO_CLIENT_ID

  if (!clientId) {
    return NextResponse.json({ error: 'JAMENDO_CLIENT_ID no configurado' }, { status: 500 })
  }

  const tags = TAG_MAP[theme] || TAG_MAP.default

  const url = new URL('https://api.jamendo.com/v3.0/tracks/')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '8')
  url.searchParams.set('tags', tags)
  url.searchParams.set('audioformat', 'mp32')
  url.searchParams.set('include', 'musicinfo')
  url.searchParams.set('groupby', 'artist_id')
  url.searchParams.set('orderby', 'popularity_total')

  try {
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Jamendo ${res.status}`)
    const data = await res.json()

    const tracks = (data.results ?? []).map((t: any) => ({
      id: t.id,
      nombre: t.name,
      artista: t.artist_name,
      duracion: t.duration,
      audioUrl: t.audio,
      imagen: t.album_image,
    }))

    return NextResponse.json({ tracks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
