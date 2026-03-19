import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
