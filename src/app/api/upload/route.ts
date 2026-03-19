import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, file.name)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Cloudinary upload error:', err)
    return NextResponse.json({
      error: err.message || 'Error desconocido',
      http_code: err.http_code || null,
      details: err.error?.message || err.toString(),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'FALTA',
      hasKey: !!process.env.CLOUDINARY_API_KEY,
      hasSecret: !!process.env.CLOUDINARY_API_SECRET,
    }, { status: 500 })
  }
}
