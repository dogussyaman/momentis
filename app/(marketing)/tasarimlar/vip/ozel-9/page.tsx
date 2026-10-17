import { VipMotionExperience } from '@/components/vip-design/VipMotionExperience'

export const metadata = {
  title: 'Özel-9 · Riviera | MOMENTIS VIP',
  description: 'Akdeniz esintisi, kum ve deniz tonları, dalga hissi veren animasyonlar.',
  robots: { index: false },
}

export default function Ozel9Page() {
  return <VipMotionExperience variant={9} />
}
