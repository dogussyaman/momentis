import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function getBrandLogoDataUri() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo.png'))
  return `data:image/png;base64,${logo.toString('base64')}`
}
