import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Tags por estilo predefinido (chips)
const STYLE_TAGS: Record<string, string> = {
  ambiental:    'ambient',
  acustica:     'acoustic',
  piano:        'piano',
  jazz:         'jazz',
  folk:         'folk',
  clasica:      'classical',
  lounge:       'lounge',
  chill:        'chill',
  romantica:    'romantic',
  festivo:      'happy',
  latina:       'latin',
  instrumental: 'instrumental',
  electronica:  'electronic',
  pop:          'pop',
}

// Fallback por tema del reel cuando no hay chip seleccionado
const THEME_TAGS: Record<string, string[]> = {
  panaderia:  ['ambient+acoustic', 'folk+acoustic', 'acoustic+guitar', 'country+acoustic', 'ambient+folk'],
  reposteria: ['romantic+soft', 'piano+soft', 'classical+piano', 'jazz+soft', 'lounge+soft'],
  deco:       ['ambient+instrumental', 'instrumental+relaxing', 'ambient+relaxing', 'lounge+ambient', 'chill+instrumental'],
  default:    ['ambient', 'instrumental', 'relaxing', 'acoustic', 'lounge'],
}

const PAGE_SIZE = 20

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const theme  = searchParams.get('theme')  || 'default'
  const style  = searchParams.get('style')  || ''
  const query  = searchParams.get('q')      || ''
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const clientId = process.env.JAMENDO_CLIENT_ID

  if (!clientId) {
    return NextResponse.json({ error: 'JAMENDO_CLIENT_ID no configurado' }, { status: 500 })
  }

  const url = new URL('https://api.jamendo.com/v3.0/tracks/')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('audioformat', 'mp32')
  url.searchParams.set('include', 'musicinfo')
  url.searchParams.set('orderby', 'popularity_total')

  // Chip de estilo → tag exacto
  if (style && STYLE_TAGS[style]) {
    url.searchParams.set('tags', STYLE_TAGS[style])
  } else {
    // Fallback: tags por tema del reel, rotando por página
    const tagList = THEME_TAGS[theme] ?? THEME_TAGS.default
    const page = Math.floor(offset / PAGE_SIZE)
    url.searchParams.set('tags', tagList[page % tagList.length])
  }

  // Búsqueda libre → busca en nombre del track y artista
  if (query.trim()) {
    url.searchParams.set('namesearch', query.trim())
  }

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
