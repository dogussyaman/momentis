import { Suspense } from 'react'
import { VipRequestWizard } from '@/components/vip-design/VipRequestWizard'

export const metadata = {
  title: 'VIP Tasarım Talebi | MOMENTIS',
  robots: { index: false },
}

export default function VipRequestPage() {
  return (
    <div className="bg-ivory px-4 pb-24 pt-32 sm:px-6">
      <Suspense fallback={<p className="py-20 text-center text-sm text-muted-foreground">Talep sihirbazı yükleniyor…</p>}>
        <VipRequestWizard />
      </Suspense>
    </div>
  )
}
