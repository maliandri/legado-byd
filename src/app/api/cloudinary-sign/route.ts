import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

export const runtime = 'nodejs'

function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return createHash('sha1').update(sorted + secret).digest('hex')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const resourceType = searchParams.get('type') === 'video' ? 'video' : 'image'
  const folder = resourceType === 'video' ? 'legado-reels' : 'legado-productos'

  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const timestamp = String(Math.floor(Date.now() / 1000))

  const params = { folder, timestamp }
  const signature = sign(params, apiSecret)

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder })
}
