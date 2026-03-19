import crypto from 'crypto'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
const API_KEY = process.env.CLOUDINARY_API_KEY!
const API_SECRET = process.env.CLOUDINARY_API_SECRET!

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha256').update(sorted + API_SECRET).digest('hex')
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; public_id: string }> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const folder = 'legado-productos'
  const public_id = filename.replace(/\.[^/.]+$/, '')

  const signature = sign({ folder, public_id, timestamp })

  const fd = new FormData()
  fd.append('file', new Blob([new Uint8Array(buffer)]))
  fd.append('api_key', API_KEY)
  fd.append('timestamp', timestamp)
  fd.append('signature', signature)
  fd.append('folder', folder)
  fd.append('public_id', public_id)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Cloudinary ${res.status}`)

  return { url: data.secure_url, public_id: data.public_id }
}
