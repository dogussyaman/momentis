import { VipMotionExperience } from '@/components/vip-design/VipMotionExperience'

export const metadata = {
  title: 'Özel-13 · Film Memories | MOMENTIS VIP',
  description: 'Analog fotoğraf günlüğü, sıcak film renkleri ve katmanlı galeri.',
  robots: { index: false },
}

export default function Ozel13Page() {
  return <VipMotionExperience variant={13} />
}
