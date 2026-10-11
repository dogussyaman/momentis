import { Suspense } from 'react'
import { SiteGiftCampaign } from '@/components/site-gift-campaign/SiteGiftCampaign'

export default function SiteGiftCampaignPage() {
  return <Suspense fallback={<p className="p-8 text-center text-sm text-muted-foreground">Kampanya yükleniyor…</p>}>
    <SiteGiftCampaign />
  </Suspense>
}
