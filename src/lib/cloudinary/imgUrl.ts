/**
 * Inserts Cloudinary transformation params into a URL without re-uploading.
 * Works by injecting params between "/upload/" and the rest of the path.
 *
 * Example:
 *   cloudinaryImg('https://res.cloudinary.com/x/image/upload/v1/products/img.jpg', 'w_800,f_auto,q_auto')
 *   → 'https://res.cloudinary.com/x/image/upload/w_800,f_auto,q_auto/v1/products/img.jpg'
 */
export function cloudinaryImg(url: string | undefined | null, transforms: string): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  // Don't double-apply transforms (already has them)
  const uploadIdx = url.indexOf('/upload/') + '/upload/'.length
  const afterUpload = url.slice(uploadIdx)
  if (afterUpload.startsWith(transforms)) return url
  return url.slice(0, uploadIdx) + transforms + '/' + afterUpload
}

// Presets for common use cases
export const CLD = {
  /** Catalog card thumbnail — 400×400 fill */
  thumb: (url: string | null | undefined) =>
    cloudinaryImg(url, 'c_fill,f_auto,q_auto,w_400,h_400'),

  /** Product detail main image — 800px wide */
  detail: (url: string | null | undefined) =>
    cloudinaryImg(url, 'f_auto,q_auto,w_800'),

  /** Open Graph — 1200×630 fill */
  og: (url: string | null | undefined) =>
    cloudinaryImg(url, 'c_fill,f_auto,q_auto,w_1200,h_630'),
}
