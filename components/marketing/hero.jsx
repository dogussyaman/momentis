'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvitationPreview } from '@/components/shared/invitation-preview'
import { IMAGES, STATS } from '@/lib/data/site'
import { EASE } from '@/lib/motion'

const TEMPLATE_PREVIEW = { palette: { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' }, layout: 'classic' }

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-midnight text-ivory" data-testid="hero">
      <motion.div
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: EASE }}
        className="absolute inset-0"
      >
        <img src={IMAGES.hero} alt="" className="h-full w-full object-cover object-center" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/85 to-midnight/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-midnight/40" />

      <div className="container relative flex min-h-screen flex-col justify-end pb-16 pt-36 lg:justify-center lg:pb-24">
        <div className="grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
              className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-champagne"
            >
              <span className="h-px w-10 bg-champagne" /> Premium Dijital Davetiye Stüdyosu
            </motion.p>

            <h1 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              {['Her davet,', 'bir hikâyenin', 'ilk cümlesidir.'].map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.45 + i * 0.12, ease: EASE }}
                    className={i === 2 ? 'block italic text-champagne-light' : 'block'}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.95, ease: EASE }}
              className="mt-8 max-w-xl text-base leading-relaxed text-ivory/75 md:text-lg"
            >
              Düğününüz, nişanınız ya da özel gününüz için editoryal zarafette dijital davetiyeler tasarlayın. RSVP, konuk listesi ve anı albümünü tek bir yerden yönetin.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Button asChild size="lg" className="group h-14 rounded-2xl bg-champagne px-8 text-[13px] uppercase tracking-[0.18em] text-midnight hover:bg-champagne-light">
                <Link href="/tasarimlar" data-testid="hero-cta-templates">
                  Tasarımları Keşfet
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-ivory/30 bg-transparent px-8 text-[13px] uppercase tracking-[0.18em] text-ivory hover:bg-ivory/10 hover:text-ivory">
                <Link href="/nasil-calisir" data-testid="hero-cta-how">
                  <Play className="mr-3 h-3.5 w-3.5 fill-current" /> Nasıl Çalışır
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="relative hidden lg:col-span-5 lg:block">
            <motion.div
              initial={{ opacity: 0, y: 60, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 1.4, delay: 0.8, ease: EASE }}
              className="relative mx-auto w-[300px] xl:w-[340px]"
            >
              <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="[container-type:inline-size]">
                <InvitationPreview template={TEMPLATE_PREVIEW} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 1.5, ease: EASE }}
                className="absolute -bottom-16 -right-20 w-56 border border-ivory/10 bg-midnight/80 p-5 backdrop-blur-xl"
              >
                <p className="text-[10px] uppercase tracking-[0.28em] text-champagne">Canlı RSVP</p>
                <p className="mt-2 font-serif text-3xl">184 <span className="text-base text-ivory/60">/ 210</span></p>
                <div className="mt-3 h-px w-full bg-ivory/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} transition={{ duration: 1.6, delay: 1.8, ease: EASE }} className="h-px bg-champagne" />
                </div>
                <p className="mt-2 text-[11px] text-ivory/60">Katılım onayı alındı</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }}
          className="mt-20 grid grid-cols-2 gap-8 border-t border-ivory/10 pt-8 md:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-serif text-3xl text-ivory md:text-4xl">{s.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-ivory/50">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
