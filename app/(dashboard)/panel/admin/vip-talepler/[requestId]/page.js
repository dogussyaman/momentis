import { VipAdminRequestDetail } from '@/components/vip-design/VipAdminRequestDetail'

export const metadata = {
  title: 'VIP Tasarım Talebi | MOMENTIS Yönetim',
  robots: { index: false },
}

export default async function VipAdminRequestDetailPage({ params }) {
  const { requestId } = await params
  return <VipAdminRequestDetail requestId={requestId} />
}
