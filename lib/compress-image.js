export async function compressImageFile(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Lütfen bir görsel dosyası seçin.')
  if (file.size > 12 * 1024 * 1024) throw new Error('Görsel 12 MB altında olmalıdır.')

  const bitmap = await createImageBitmap(file)
  let scale = Math.min(1, 1600 / bitmap.width, 1200 / bitmap.height)
  let quality = 0.82
  let blob

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= 1_100_000) break
    if (quality > 0.56) quality -= 0.1
    else scale *= 0.78
  }

  bitmap.close()
  if (!blob || blob.size > 1_400_000) throw new Error('Görsel sıkıştırılamadı. Daha küçük bir görsel seçin.')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Görsel okunamadı.'))
    reader.readAsDataURL(blob)
  })
}
