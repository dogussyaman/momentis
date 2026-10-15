import { ImageResponse } from 'next/og'
import { getBrandLogoDataUri } from '@/lib/brand-icon'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default async function Icon() {
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
          border: '2px solid #C9A96E',
          borderRadius: 14,
        }}
      >
        <img src={logo} alt="" style={{ width: 52, height: 46, objectFit: 'contain' }} />
      </div>
    ),
    size,
  )
}
