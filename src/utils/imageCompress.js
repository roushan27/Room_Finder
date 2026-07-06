// Compresses an image file in the browser before upload using Canvas.
// Resizes to max 1280px width/height and re-encodes as JPEG at 70% quality.
// This drastically reduces file size (often 5-10x smaller) for smooth loading.
export function compressImage(file, maxDimension = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.onerror = reject

    img.onload = () => {
      let { width, height } = img

      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width)
        width = maxDimension
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height)
        height = maxDimension
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = reject

    reader.readAsDataURL(file)
  })
}
