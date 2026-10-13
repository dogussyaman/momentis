import { VipAdminSiteDraft } from '@/components/vip-design/VipAdminSiteDraft'

export const metadata = {
  title: 'VIP Site Taslağı | MOMENTIS Yönetim',
  robots: { index: false },
}

export default async function VipAdminSiteDraftPage({ params }) {
  const { requestId } = await params
  return <VipAdminSiteDraft requestId={requestId} />
}
