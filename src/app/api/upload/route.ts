import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary/upload'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera el límite de 5MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, file.name)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
