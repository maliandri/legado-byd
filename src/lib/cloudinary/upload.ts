import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = 'legado/productos'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
        overwrite: false,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve({ url: result.secure_url, public_id: result.public_id })
      }
    )
    uploadStream.end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch {
    // ignorar si ya no existe
  }
}
