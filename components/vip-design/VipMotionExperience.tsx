'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Camera, Heart, MapPin, Music2, Sparkles, Stars } from 'lucide-react'

const designs = {
  6: { name: 'Editorial Romance', couple: 'Lara & Mert', eyebrow: 'A story worth keeping', title: 'The beginning of forever.', story: 'Bazı hikâyeler sessizce başlar; sonra hayatın en güzel anına dönüşür.', date: '18 Eylül 2027', venue: 'Tarihi Bahçe · İstanbul', bg: '#f4eee4', fg: '#332b26', accent: '#a66f4d', surface: '#fffaf2', image: 'photo-1519741497674-611481863552', effect: 'aurora', layout: 'editorial', label: 'Modern editorial' },
  7: { name: 'Noir Luxe', couple: 'Defne & Atlas', eyebrow: 'An evening in gold', title: 'Some nights become forever.', story: 'Gece, ışıklar ve bizim hikâyemiz. Bu özel akşamda yanımızda olmanız dileğiyle.', date: '24 Haziran 2027', venue: 'The Grand Hall · İzmir', bg: '#0b0d12', fg: '#f6f0e5', accent: '#d7b775', surface: '#171922', image: 'photo-1511285560929-80b456fea0bc', effect: 'rays', layout: 'noir', label: 'Black tie luxury' },
  8: { name: 'Secret Garden', couple: 'Mina & Can', eyebrow: 'Rooted in love', title: 'Love, in full bloom.', story: 'Birlikte büyüyen hayallerimizi, doğanın kalbinde sevdiklerimizle kutluyoruz.', date: '18 Temmuz 2027', venue: 'Lavanta Bahçesi · Bursa', bg: '#e9eee4', fg: '#293c31', accent: '#71876b', surface: '#f7f8f1', image: 'photo-1519225421980-715cb0215aed', effect: 'petals', layout: 'garden', label: 'Botanical romance' },
  9: { name: 'Riviera', couple: 'Ada & Ege', eyebrow: 'By the blue horizon', title: 'Meet us by the sea.', story: 'Tuzlu esinti, gün batımı ve en sevdiğimiz insanlar. Yeni bir başlangıcı birlikte karşılayalım.', date: '07 Ağustos 2027', venue: 'Marina Terrace · Bodrum', bg: '#f2e8d7', fg: '#1c4149', accent: '#c77757', surface: '#fff9ef', image: 'photo-1537633552985-df8429e8048b', effect: 'waves', layout: 'riviera', label: 'Destination wedding' },
  10: { name: 'Fine Art Bloom', couple: 'İdil & Kerem', eyebrow: 'A love in every detail', title: 'Where our worlds meet.', story: 'En güzel anlarımızın, küçük detaylarda saklı olduğuna inanıyoruz. Bu günü sizinle paylaşmak istiyoruz.', date: '05 Eylül 2027', venue: 'Orangerie · Sapanca', bg: '#fbf5ef', fg: '#503d3a', accent: '#bd8b91', surface: '#fffdf9', image: 'photo-1523438885200-e635ba2c371e', effect: 'bloom', layout: 'fineart', label: 'Fine art garden' },
  11: { name: 'Architectural', couple: 'Eylül & Aras', eyebrow: 'Two lives, one direction', title: 'Together, by design.', story: 'İki ayrı yol, aynı geleceğe açılıyor. Bizi bir araya getiren bu günü sizinle paylaşmak için sabırsızlanıyoruz.', date: '03 Ekim 2027', venue: 'Atelier No. 8 · Ankara', bg: '#f1f0ec', fg: '#202321', accent: '#9b7754', surface: '#ffffff', image: 'photo-1511795409834-ef04bbd61622', effect: 'grid', layout: 'architecture', label: 'Contemporary minimal' },
  12: { name: 'Art Deco', couple: 'Selin & Kaan', eyebrow: 'A golden kind of love', title: 'An affair to remember.', story: 'Zamansız bir gece, altın detaylar ve birlikte yazacağımız yepyeni bir bölüm.', date: '21 Kasım 2027', venue: 'Pera Palace · İstanbul', bg: '#10100f', fg: '#f8edcf', accent: '#d0aa61', surface: '#1d1b18', image: 'photo-1519225421980-715cb0215aed', effect: 'deco', layout: 'deco', label: 'Deco glamour' },
  13: { name: 'Film Memories', couple: 'Defne & Deniz', eyebrow: 'A little like the movies', title: 'Our favourite frame.', story: 'Bir fotoğraf karesi gibi aklımızda kalacak bu günü, en sevdiğimiz insanlarla hatırlamak istiyoruz.', date: '14 Ağustos 2027', venue: 'Olive Grove · Urla', bg: '#e8dfcf', fg: '#423a30', accent: '#a15f45', surface: '#f8f1e5', image: 'photo-1465495976277-4387d4b0b4c6', effect: 'film', layout: 'film', label: 'Analog memories' },
  14: { name: 'Cobalt Modern', couple: 'Nil & Bora', eyebrow: 'A new chapter starts here', title: 'All our tomorrows.', story: 'Cesur hayaller, spontane anlar ve bir ömür sürecek bir evet. Bu başlangıçta bizimle olun.', date: '12 Haziran 2027', venue: 'Mavi Teras · İstanbul', bg: '#edf0ff', fg: '#17245c', accent: '#3159d8', surface: '#ffffff', image: 'photo-1507504031003-b417219a0fde', effect: 'cobalt', layout: 'cobalt', label: 'Bold contemporary' },
  15: { name: 'Burgundy Affair', couple: 'Zeynep & Emir', eyebrow: 'Forever, with feeling', title: 'A love written in wine.', story: 'Kalbimizde yer eden bu hikâyenin yeni bölümünü, ailemiz ve dostlarımızla birlikte kutluyoruz.', date: '09 Ekim 2027', venue: 'Maison Rouge · Bursa', bg: '#f1e5e3', fg: '#4d202b', accent: '#8c3549', surface: '#fff8f6', image: 'photo-1511795409834-ef04bbd61622', effect: 'velvet', layout: 'burgundy', label: 'Classic romance' },
}

const photos = [
  'photo-1519741497674-611481863552',
  'photo-1511285560929-80b456fea0bc',
  'photo-1522673607200-164d1b6ce486',
]

function photoUrl(id, width = 1200) {
  return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + width + '&q=85'
}

export function VipMotionExperience({ variant }) {
  const design = designs[variant] || designs[6]
  const reduceMotion = useReducedMotion()
  const isDark = variant === 7 || variant === 12
  const motionProps = reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.65, ease: 'easeOut' } }
  const heroImage = photoUrl(design.image, 2000)
  const titleClass = design.layout === 'cobalt' ? 'font-sans font-black uppercase tracking-[-0.08em]' : 'font-serif font-normal'
  const centerHero = ['garden', 'fineart', 'deco', 'burgundy'].includes(design.layout)

  return (
    <main data-vip-site={'ozel-' + variant} className="min-h-screen overflow-hidden antialiased" style={{ background: design.bg, color: design.fg }}>
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur-xl sm:px-8" style={{ borderColor: design.accent + '35', background: design.bg + 'dd' }}>
        <Link href="/tasarimlar/vip" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-75 transition hover:opacity-100"><ArrowLeft size={14} /> VIP koleksiyonu</Link>
        <span className="hidden text-[9px] uppercase tracking-[0.28em] sm:block">MOMENTIS · {design.name}</span>
        <Link href="/tasarimlar/vip/talep" className="rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.14em] transition hover:opacity-75" style={{ borderColor: design.accent, color: design.fg }}>Bu tasarımı iste <ArrowRight className="ml-1 inline" size={12} /></Link>
      </div>

      <section className={'relative flex min-h-[92svh] items-center overflow-hidden px-5 pb-16 pt-28 sm:px-10 lg:px-16 ' + (centerHero ? 'justify-center text-center' : 'justify-start')} style={{ background: design.layout === 'noir' || design.layout === 'deco' ? design.bg : 'linear-gradient(120deg,' + design.bg + ' 0%, ' + design.surface + ' 70%)' }}>
        <motion.div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full blur-3xl" style={{ background: design.accent + (design.effect === 'aurora' ? '55' : '35') }} animate={reduceMotion ? {} : { x: [0, -55, 20, 0], y: [0, 45, -25, 0], scale: [1, 1.15, 0.94, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-[20%] h-[25rem] w-[35rem] rounded-full blur-3xl" style={{ background: design.accent + '24' }} animate={reduceMotion ? {} : { x: [0, 60, -25, 0], y: [0, -25, 40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
        {design.effect === 'rays' && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'repeating-conic-gradient(from 225deg at 75% 20%, transparent 0deg, ' + design.accent + '18 2deg, transparent 5deg, transparent 14deg)' }} animate={reduceMotion ? {} : { rotate: [0, 4, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />}
        {design.effect === 'grid' && <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(' + design.accent + '20 1px,transparent 1px),linear-gradient(90deg,' + design.accent + '20 1px,transparent 1px)', backgroundSize: '64px 64px' }} />}
        {design.effect === 'deco' && <div aria-hidden="true" className="pointer-events-none absolute inset-5 border sm:inset-10" style={{ borderColor: design.accent + '80' }}><div className="absolute inset-3 border" style={{ borderColor: design.accent + '40' }} /></div>}
        {design.effect === 'waves' && <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-[140%] rounded-[50%] border opacity-40" style={{ borderColor: design.accent, boxShadow: '0 -22px 0 -21px ' + design.accent + ', 0 -44px 0 -43px ' + design.accent }} animate={reduceMotion ? {} : { x: [0, 35, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />}
        <div className={'relative z-10 w-full ' + (centerHero ? 'mx-auto max-w-4xl' : 'max-w-6xl')}>
          <motion.p {...motionProps} className="flex items-center gap-3 text-[9px] uppercase tracking-[0.32em]" style={{ color: design.accent, justifyContent: centerHero ? 'center' : 'flex-start' }}><span className="h-px w-8" style={{ background: design.accent }} />{design.eyebrow}<span className="h-px w-8" style={{ background: design.accent }} /></motion.p>
          <motion.h1 {...motionProps} transition={reduceMotion ? undefined : { duration: 0.8, delay: 0.12 }} className={'mt-7 max-w-5xl text-5xl leading-[0.98] sm:text-7xl lg:text-[6.5rem] ' + titleClass} style={{ letterSpacing: design.layout === 'cobalt' ? '-0.08em' : '-0.045em' }}>{design.title}</motion.h1>
          <motion.p {...motionProps} transition={reduceMotion ? undefined : { duration: 0.8, delay: 0.22 }} className={'mt-6 max-w-xl text-sm leading-7 opacity-75 sm:text-base ' + (centerHero ? 'mx-auto' : '')}>{design.story}</motion.p>
          <motion.div {...motionProps} transition={reduceMotion ? undefined : { duration: 0.8, delay: 0.32 }} className={'mt-8 flex flex-wrap items-center gap-3 ' + (centerHero ? 'justify-center' : '')}>
            <a href="#invitation" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[10px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5" style={{ background: design.accent, color: isDark ? '#10100f' : '#fffdf8' }}>Davet detayları <ArrowDown size={13} /></a>
            <span className="text-[10px] uppercase tracking-[0.12em] opacity-60">Birlikte kutlayalım · 2027</span>
          </motion.div>
          <motion.div className={'mt-12 grid gap-4 sm:grid-cols-2 ' + (centerHero ? 'mx-auto max-w-2xl text-left' : 'max-w-2xl')} {...motionProps}>
            <div className="flex items-center gap-3 border-t pt-4" style={{ borderColor: design.accent + '55' }}><CalendarDays size={17} style={{ color: design.accent }} /><div><p className="text-[9px] uppercase tracking-[0.18em] opacity-55">Tarih</p><p className="mt-1 text-sm">{design.date}</p></div></div>
            <div className="flex items-center gap-3 border-t pt-4" style={{ borderColor: design.accent + '55' }}><MapPin size={17} style={{ color: design.accent }} /><div><p className="text-[9px] uppercase tracking-[0.18em] opacity-55">Mekân</p><p className="mt-1 text-sm">{design.venue}</p></div></div>
          </motion.div>
        </div>
        <motion.div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 hidden h-[68%] w-[42%] overflow-hidden lg:block" style={{ clipPath: design.layout === 'architecture' ? 'polygon(14% 0,100% 0,100% 100%,0 100%)' : design.layout === 'deco' ? 'inset(0 8% 0 8% round 48% 48% 0 0)' : design.layout === 'riviera' ? 'ellipse(65% 70% at 70% 60%)' : 'inset(0 0 0 0 round 48% 0 0 0)' }} initial={reduceMotion ? false : { opacity: 0, scale: 1.06, x: 24 }} animate={reduceMotion ? {} : { opacity: 0.94, scale: 1, x: 0 }} transition={{ duration: 1.1, delay: 0.2 }}>
          <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(0deg,' + design.bg + '12,' + design.bg + '05),url(' + heroImage + ')', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 1px ' + design.accent + '45' }} />
        </motion.div>
        <span className="absolute bottom-6 left-6 text-[8px] uppercase tracking-[0.3em] opacity-45 sm:left-10">VIP COLLECTION · {String(variant).padStart(2, '0')}</span>
      </section>

      <motion.section id="invitation" {...motionProps} className="px-5 py-20 sm:px-10 sm:py-28" style={{ background: design.surface }}>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1fr] lg:items-center">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: design.accent }}>The invitation · 01</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">Sevincimizi sizinle paylaşmak istiyoruz.</h2>
            <p className="mt-5 text-sm leading-7 opacity-70">Bu özel günümüzde yanımızda olmanız, hikâyemizin en güzel parçası olacak. Takvimlerinize not edin; ayrıntıları birlikte keşfedelim.</p>
            <div className="mt-8 flex items-start gap-3"><Heart size={18} style={{ color: design.accent }} /><p className="text-xs leading-6 opacity-75">Sevgiyle hazırlanmış küçük detaylar, birlikte biriktireceğimiz büyük anılar.</p></div>
          </div>
          <div className="relative overflow-hidden p-7 sm:p-12" style={{ background: design.bg, border: '1px solid ' + design.accent + '55', borderRadius: design.layout === 'architecture' ? '0' : design.layout === 'deco' ? '180px 180px 8px 8px' : '8px' }}>
            <div className="absolute inset-4 border opacity-40" style={{ borderColor: design.accent }} />
            <div className="relative py-10 text-center">
              <Sparkles className="mx-auto" size={20} style={{ color: design.accent }} />
              <p className="mt-5 text-[9px] uppercase tracking-[0.32em]" style={{ color: design.accent }}>Save the date</p>
              <p className="mt-4 font-serif text-3xl sm:text-4xl">{design.couple}</p>
              <div className="mx-auto my-6 h-px w-16" style={{ background: design.accent }} />
              <p className="text-sm">{design.date}</p>
              <p className="mt-2 text-xs opacity-65">{design.venue}</p>
              <p className="mt-8 text-[9px] uppercase tracking-[0.22em] opacity-50">MOMENTIS · A day to remember</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...motionProps} className="px-5 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div><p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: design.accent }}>The story · 02</p><h2 className="mt-4 font-serif text-4xl sm:text-5xl">Küçük anlar, büyük bir hikâye.</h2></div>
            <p className="max-w-sm text-xs leading-6 opacity-65">Birlikte güldüğümüz, öğrendiğimiz ve hayal kurduğumuz anlardan bir seçki.</p>
          </div>
          <div className={'mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ' + (design.layout === 'architecture' ? 'lg:gap-0' : '')}>
            {photos.map((photo, index) => <motion.figure key={photo} whileHover={reduceMotion ? undefined : { y: -6 }} transition={{ duration: 0.3 }} className={'group relative overflow-hidden ' + (index === 1 && ['editorial', 'film'].includes(design.layout) ? 'lg:translate-y-8' : '')} style={{ background: design.bg, border: '1px solid ' + design.accent + '30', borderRadius: design.layout === 'architecture' ? '0' : design.layout === 'film' ? '2px' : '12px' }}>
              <div className="h-72 overflow-hidden sm:h-80"><motion.img src={photoUrl(photo, 900)} alt={design.name + ' düğün fotoğrafı ' + (index + 1)} loading="lazy" className="h-full w-full object-cover" whileHover={reduceMotion ? undefined : { scale: 1.06 }} transition={{ duration: 0.7 }} /></div>
              <figcaption className="flex items-center justify-between gap-3 p-4"><div><p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: design.accent }}>FRAME 0{index + 1}</p><p className="mt-1 font-serif text-lg">{['İlk karşılaşma', 'Birlikte geçen zaman', 'Yeni başlangıç'][index]}</p></div><Camera size={17} style={{ color: design.accent }} /></figcaption>
            </motion.figure>)}
          </div>
        </div>
      </motion.section>

      <motion.section {...motionProps} className="px-5 py-20 sm:px-10 sm:py-24" style={{ background: isDark ? design.surface : design.fg, color: isDark ? design.fg : design.bg }}>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          <div className="md:col-span-1"><p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: design.accent }}>The evening · 03</p><h2 className="mt-4 font-serif text-4xl">Günün akışı</h2><p className="mt-4 text-xs leading-6 opacity-65">Bu güzel günü birlikte karşılamak için bize katılın.</p></div>
          <div className="md:col-span-2">
            {[['18:00', 'Karşılama', 'Hoş geldiniz içeceği ve ilk buluşmalar'], ['19:00', 'Tören', 'Birbirimize verdiğimiz sözler'], ['20:00', 'Kutlama', 'Yemek, müzik ve dans']].map((item, index) => <div key={item[0]} className="grid grid-cols-[72px_1fr] gap-4 border-t py-5 sm:grid-cols-[100px_1fr]" style={{ borderColor: design.accent + '50' }}><p className="font-serif text-xl" style={{ color: design.accent }}>{item[0]}</p><div><p className="text-sm">{item[1]}</p><p className="mt-1 text-xs opacity-60">{item[2]}</p></div></div>)}
          </div>
        </div>
      </motion.section>

      <motion.section {...motionProps} className="px-5 py-20 text-center sm:px-10 sm:py-28" style={{ background: design.surface }}>
        <Stars className="mx-auto" size={22} style={{ color: design.accent }} />
        <p className="mt-5 text-[9px] uppercase tracking-[0.3em]" style={{ color: design.accent }}>We saved you a place</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">Bu hikâyenin bir parçası olun.</h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 opacity-65">Katılımınızı paylaşmak ve kişiye özel bir VIP tasarım talebi oluşturmak için bize ulaşın.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/tasarimlar/vip/talep" className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[10px] uppercase tracking-[0.16em] transition hover:-translate-y-0.5" style={{ background: design.accent, color: isDark ? '#111' : '#fff' }}>VIP tasarım talebi <ArrowRight size={13} /></Link><a href="#invitation" className="rounded-full border px-7 py-3 text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: design.accent + '80' }}>Davetiyeyi incele</a></div>
        <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-3 border-t pt-6" style={{ borderColor: design.accent + '35' }}><Music2 size={16} style={{ color: design.accent }} /><p className="text-[9px] uppercase tracking-[0.2em] opacity-60">{design.couple} · {design.date}</p></div>
      </motion.section>
      <footer className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 text-[9px] uppercase tracking-[0.18em] sm:px-10" style={{ background: design.bg, borderTop: '1px solid ' + design.accent + '35' }}><span>MOMENTIS VIP · CONCEPT {String(variant).padStart(2, '0')}</span><span>{design.name}</span><Link href="/tasarimlar/vip" className="inline-flex items-center gap-2 opacity-70 hover:opacity-100">Tüm VIP tasarımları <ArrowRight size={12} /></Link></footer>
    </main>
  )
}
