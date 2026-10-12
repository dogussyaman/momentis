'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Calendar, Clock, Heart } from 'lucide-react'

// Target date: September 12, 2027 18:30:00
const TARGET_DATE = new Date('2027-09-12T18:30:00').getTime()

export function Ozel1Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isMounted: false,
  })

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const difference = TARGET_DATE - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isMounted: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isMounted: true })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  const items = [
    { label: 'GÜN', val: timeLeft.days, sub: 'Büyük Buluşma' },
    { label: 'SAAT', val: String(timeLeft.hours).padStart(2, '0'), sub: 'Sabırsızlıkla' },
    { label: 'DAKİKA', val: String(timeLeft.minutes).padStart(2, '0'), sub: 'Heyecanla' },
    { label: 'SANİYE', val: String(timeLeft.seconds).padStart(2, '0'), sub: 'Atan Kalpler' },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Glow highlight */}
      <div className="relative mx-auto max-w-2xl">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#e7c98f]/20 via-[#a98756]/30 to-[#e7c98f]/20 blur-xl opacity-70" />

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item, idx) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-md transition-all duration-300 hover:border-[#e7c98f]/50 hover:bg-white/[0.08] hover:shadow-[0_8px_30px_rgb(231,201,143,0.12)] hover:-translate-y-1"
            >
              {/* Top ambient line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#e7c98f]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              
              <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-[0.22em] text-[#e7c98f]/80">
                {idx === 0 && <Calendar className="h-3 w-3" />}
                {idx === 1 && <Clock className="h-3 w-3" />}
                {idx === 2 && <Sparkles className="h-3 w-3" />}
                {idx === 3 && <Heart className="h-3 w-3 animate-pulse text-[#e7c98f]" />}
                <span>{item.label}</span>
              </div>

              <div className="mt-3 relative">
                <p className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-[#e7c98f] transition-transform duration-300 group-hover:scale-105">
                  {timeLeft.isMounted ? item.val : '--'}
                </p>
              </div>

              <p className="mt-2 text-[10px] text-white/40 tracking-wide font-light">
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative footer tag */}
      <div className="mt-6 flex items-center justify-center gap-3 text-xs text-white/50">
        <span className="h-px w-8 bg-white/20" />
        <span className="font-serif italic text-white/70">12 Eylül 2027 · Sarnıç Köşk</span>
        <span className="h-px w-8 bg-white/20" />
      </div>
    </div>
  )
}
