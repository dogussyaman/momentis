'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Navigation,
  Compass,
  Copy,
  Check,
  Clock,
  Car,
  Calendar,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Ozel1MapLocation() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'satellite'>('map')

  const venueAddress = 'Sarnıç Köşk, Boğaziçi Cad. No: 42, Sarıyer / İstanbul'
  const mapsSearchUrl = 'https://www.google.com/maps/search/?api=1&query=Sarn%C4%B1%C3%A7+K%C3%B6%C5%9Fk+%C4%B0stanbul'
  const appleMapsUrl = 'https://maps.apple.com/?q=Sarnic+Kosk+Istanbul'

  const copyAddress = () => {
    navigator.clipboard.writeText(venueAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Modern Google Maps Style Container */}
      <div className="overflow-hidden rounded-3xl border border-[#e5dcd0] bg-white shadow-xl">
        {/* Top App Bar (Google Maps Style) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6da] bg-[#faf7f2] px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a98756] text-white shadow-sm">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-midnight">Sarnıç Köşk Düğün & Davet Alanı</p>
              <p className="text-[10px] text-midnight/55">İstanbul Boğazı · Özel Tören Bahçesi</p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'map' | 'satellite')}>
              <TabsList className="h-auto rounded-lg border border-[#e2d8cb] bg-white p-0.5 text-[10px]">
                <TabsTrigger
                  value="map"
                  className="rounded-md px-2.5 py-1 text-[10px] font-medium transition text-midnight/60 hover:text-midnight data-[state=active]:bg-[#a98756] data-[state=active]:text-white data-[state=active]:shadow-xs"
                >
                  Harita
                </TabsTrigger>
                <TabsTrigger
                  value="satellite"
                  className="rounded-md px-2.5 py-1 text-[10px] font-medium transition text-midnight/60 hover:text-midnight data-[state=active]:bg-[#a98756] data-[state=active]:text-white data-[state=active]:shadow-xs"
                >
                  Uydu
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <button
              type="button"
              onClick={copyAddress}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2d8cb] bg-white px-2.5 py-1.5 text-[10px] font-medium text-midnight/75 transition hover:bg-[#f4eee6]"
              title="Adresi Kopyala"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-[#a98756]" />}
              <span>{copied ? 'Kopyalandı' : 'Adresi Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* Map Body & Live Route Panel */}
        <div className="grid lg:grid-cols-[1.3fr_1fr]">
          {/* Visual Interactive Map Section */}
          <div className="relative min-h-[340px] sm:min-h-[400px] w-full overflow-hidden bg-[#e5e3df]">
            {/* Embedded Interactive Google Map Iframe for real feel */}
            <iframe
              title="Düğün Mekânı Google Haritalar"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48074.83960098495!2d29.020000!3d41.120000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab63f7d23d8c1%3A0x6bfa33f0e0c9c30!2zU2FyxLF5ZXIsIMSwc3RhbmJ1bA!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str"
              className={`h-full w-full border-0 transition-all duration-700 ${
                activeTab === 'satellite' ? 'contrast-125 saturate-150' : ''
              }`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Custom Floating Pin Overlay over Google Maps */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="animate-bounce">
                <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2 shadow-2xl backdrop-blur-md border border-[#a98756]/30">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#a98756] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-midnight">Sarnıç Köşk</p>
                    <p className="text-[9px] text-[#a98756] font-medium">12 Eylül 2027 · 18.30</p>
                  </div>
                </div>
              </div>
              <div className="mt-1 h-3 w-3 rotate-45 bg-white border-r border-b border-[#a98756]/30 shadow-sm" />
              <div className="mt-2 h-4 w-12 rounded-full bg-black/20 blur-xs" />
            </div>

            {/* Floating Navigation Pill */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/90 p-2.5 shadow-lg backdrop-blur-md border border-white/60 sm:left-auto sm:right-4 sm:max-w-xs">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#a98756]" />
                <span className="text-[10px] text-midnight/80 font-medium">Canlı Navigasyon Desteği</span>
              </div>
              <Link
                href={mapsSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#a98756] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#8e6e41]"
              >
                Haritada Aç <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Right Information Panel (Schedule, Hours, Transportation) */}
          <div className="flex flex-col justify-between bg-[#fbf9f5] p-6 sm:p-8">
            <div className="space-y-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8dece]/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a98756]">
                  <Compass className="h-3 w-3" /> Konum & Ulaşım Rehberi
                </span>
                <h3 className="mt-2 font-serif text-2xl text-midnight">Sarnıç Köşk</h3>
                <p className="mt-1 text-xs text-midnight/65 leading-relaxed">
                  {venueAddress}
                </p>
              </div>

              {/* Saat & Program Bilgileri */}
              <div className="space-y-2.5 rounded-2xl bg-white p-4 border border-[#eee4d5] shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f2ea] text-[#a98756]">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-midnight/50">Zaman Çizelgesi</p>
                    <p className="text-xs font-semibold text-midnight">18.30 Karşılama · 19.15 Nikâh Töreni</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-[#f2ebe0]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f2ea] text-[#a98756]">
                    <Car className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-midnight/50">Otopark & Vale</p>
                    <p className="text-xs font-semibold text-midnight">Mekân Girişinde Ücretsiz Vale Hizmeti</p>
                  </div>
                </div>
              </div>

              {/* Hızlı Butonlar */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#2c302b] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-black"
                >
                  <Navigation className="h-3.5 w-3.5 text-[#e7c98f]" />
                  Google Haritalar
                </Link>

                <Link
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#d9cbb6] bg-white px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-midnight shadow-xs transition hover:bg-[#f6f2ea]"
                >
                  <Compass className="h-3.5 w-3.5 text-[#a98756]" />
                  Apple Haritalar
                </Link>
              </div>
            </div>

            {/* Alt Ulaşım Tavsiyesi */}
            <p className="mt-5 text-[10px] leading-relaxed text-midnight/45 italic">
              * Köprü trafiğini hesaba katarak en geç 18.00 civarında bölgede olunması tavsiye edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
