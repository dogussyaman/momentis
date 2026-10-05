import { Logo } from '@/components/shared/logo'
import { IMAGES } from '@/lib/data/site'

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen bg-ivory lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-midnight lg:block">
        <img src={IMAGES.heroAlt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
          <Logo tone="light" />
          <div className="max-w-md">
            <p className="font-serif text-4xl leading-tight">“Davetiyemizi gören herkes bir stüdyoya yaptırdığımızı sandı.”</p>
            <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-champagne">Elif & Kaan · İstanbul</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:px-20">
        <div className="lg:hidden"><Logo /></div>
        <div className="flex flex-1 items-center justify-center py-12">{children}</div>
      </div>
    </div>
  )
}
