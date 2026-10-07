import { Logo } from '@/components/shared/logo'
import { IMAGES } from '@/lib/data/site'

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh bg-ivory lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-midnight lg:block">
        <img src={IMAGES.heroAlt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
          <Logo tone="light" />
          <div className="max-w-md">
            <p className="font-serif text-4xl leading-tight">Özel gününüze yakışan, hikâyenizi anlatan dijital bir davetiye.</p>
            <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-champagne">MOMENTIS · Dijital Davetiye Stüdyosu</p>
          </div>
        </div>
      </div>
      <div className="flex min-h-dvh flex-col px-5 py-5 sm:px-12 sm:py-6 lg:px-16 lg:py-4">
        <div className="lg:hidden"><Logo /></div>
        <div className="flex flex-1 items-center justify-center py-4 sm:py-5 lg:py-2">{children}</div>
      </div>
    </div>
  )
}
