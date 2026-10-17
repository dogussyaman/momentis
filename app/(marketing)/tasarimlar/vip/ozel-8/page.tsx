import { VipMotionExperience } from '@/components/vip-design/VipMotionExperience'

export const metadata = {
  title: 'Özel-8 · Secret Garden | MOMENTIS VIP',
  description: 'Adaçayı tonları, botanik atmosfer ve yavaş hareket eden organik ışıklar.',
  robots: { index: false },
}

export default function Ozel8Page() {
  return <VipMotionExperience variant={8} />
}
