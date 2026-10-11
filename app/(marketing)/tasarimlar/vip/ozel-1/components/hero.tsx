import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Ozel1Hero() {
  return (
    <section id="home" className="relative isolate min-h-[92vh] sm:min-h-screen w-full overflow-hidden bg-[#201c19] flex items-center justify-center">
      <div className="absolute inset-0">
        <Image
          src="/svg/genel/beautiful-archway-decorated-with-floral-composition-outdoors.jpg"
          alt="Çiçeklerle süslenmiş tören kemeri, demo görsel"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#201c19]/60 via-[#201c19]/30 to-[#201c19]/70" />
      </div>

      <div className="relative z-10 w-full py-28 sm:py-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-5 text-center text-white sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/15 px-4 py-2 text-[9px] font-medium uppercase tracking-[0.24em] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#e7c98f]" />
            <span>Bir ömür, aynı hikâye</span>
          </span>

          <p className="mt-6 text-[10px] uppercase tracking-[0.34em] text-white/80">Sizi mutluluğumuza ortak olmaya davet ediyoruz</p>
          <h1 className="mt-5 font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-7xl md:text-8xl">
            Lal
            <span className="mx-3 block py-2 font-serif text-4xl italic text-[#e7c98f] sm:mx-5 sm:inline sm:text-6xl">&</span>
            <span className="block sm:inline">Emir</span>
          </h1>
          <span className="mt-7 h-px w-16 bg-[#e7c98f]" />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[10px] uppercase tracking-[0.16em] text-white/90 sm:text-xs">
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#e7c98f]" /> 12 Eylül 2027 · 18.30</span>
            <span className="hidden h-4 w-px bg-white/50 sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#e7c98f]" /> Sarnıç Köşk · İstanbul</span>
          </div>

          <p className="mt-6 max-w-lg text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
            Yeni bir başlangıca adım atarken bu özel günümüzü sevdiklerimizle paylaşmak istiyoruz.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-[#e7c98f] px-7 text-[10px] uppercase tracking-[0.16em] text-[#332a20] shadow-lg hover:bg-white">
              <Link href="#details">Davet detayları <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/60 bg-white/10 px-7 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-sm hover:bg-white hover:text-midnight">
              <Link href="#rsvp">Katılım bildir</Link>
            </Button>
          </div>

          <Link href="#couple" aria-label="Çiftimize kaydır" className="absolute bottom-7 left-1/2 inline-flex -translate-x-1/2 animate-bounce items-center justify-center rounded-full border border-white/40 p-3 text-white/80 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowDown className="h-4 w-4" />
          </Link>
        </div>

        <span className="absolute bottom-6 right-7 hidden text-[8px] uppercase tracking-[0.22em] text-white/65 md:block">Özel-1 · Demo konsept</span>
      </div>
    </section>
  )
}
