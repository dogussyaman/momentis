import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'MOMENTIS dijital davetiye stüdyosu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo.png'))
  const logoSource = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#101827',
          padding: 44,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            background: '#F8F5F1',
            border: '2px solid #C9A96E',
            color: '#101827',
          }}
        >
          <img src={logoSource} alt="" style={{ width: 112, height: 100, objectFit: 'contain' }} />
          <div style={{ display: 'flex', marginTop: 16, fontSize: 58, fontFamily: 'Georgia, serif' }}>
            MOMENTIS
          </div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 25, color: '#6D6250' }}>
            Premium dijital davetiye stüdyosu
          </div>
        </div>
      </div>
    ),
    size,
  )
}
