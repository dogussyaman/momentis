import { ImageResponse } from 'next/og'
import { getBrandLogoDataUri } from '@/lib/brand-icon'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const logo = await getBrandLogoDataUri()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F5F1',
          border: '3px solid #C9A96E',
        }}
      >
        <img src={logo} alt="" style={{ width: 150, height: 132, objectFit: 'contain' }} />
      </div>
    ),
    size,
  )
}
