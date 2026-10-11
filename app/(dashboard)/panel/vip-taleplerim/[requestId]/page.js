import { VipMyRequestDetail } from '@/components/vip-design/VipMyRequestDetail'

export const metadata = {
  title: 'VIP Talep Özeti | MOMENTIS Panel',
  robots: { index: false },
}

export default async function VipMyRequestDetailPage({ params }) {
  const { requestId } = await params
  return <VipMyRequestDetail requestId={requestId} />
}
