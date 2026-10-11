import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Heart, Images, Sparkles } from 'lucide-react'
import { VipInvitationCard } from '@/components/vip-design/VipInvitationCard'
import { VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES } from '@/lib/vip-design/mock-data.mjs'

export const metadata = {
  title: 'VIP Kişiye Özel Tasarımlar | MOMENTIS',
  description: 'Beş VIP site konseptini ve beş ayrı hediye davetiye tasarımını inceleyin.',
}

const steps = [
  'VIP site konseptinizi seçin.',
  'Gelin-damat ve etkinlik bilgilerinizi iletin.',
  'Fotoğraflarınızı ve kişisel tasarım tercihlerinizi belirtin.',
  'Beş hediye davetiye konseptinden birini seçin.',
  'Talebinizi gönderin; admin incelemesi sonrası süreç hakkında bilgilendirilin.',
]

export default function VipDesignLandingPage() {
  return (
    <div className="bg-ivory pb-24 pt-32 text-midnight">
      <section className="container">
        <Link href="/tasarimlar" className="mb-8 inline-flex min-h-10 items-center gap-2 rounded-full border border-midnight/15 px-4 text-[10px] uppercase tracking-[0.16em] text-midnight/70 transition hover:border-midnight hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne">
          <ArrowLeft className="h-3.5 w-3.5" /> Normal tasarımlara dön
        </Link>
        <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-champagne-dark"><span className="h-px w-8 bg-current" /> MOMENTIS VIP · DEMO</p>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] md:text-7xl">Sizin hikâyeniz için <i className="text-champagne-dark">özel</i> tasarlandı.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">VIP hizmet, hazır ve anında teslim edilen bir ürün değildir. Tasarım talebiniz admin tarafından incelenir; site konsepti ve tercihlerinize göre kişiye özel hazırlanır.</p>
          </div>
          <div className="rounded-[26px] border border-midnight/10 bg-white p-6 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-medium"><Sparkles className="h-4 w-4 text-champagne-dark" /> VIP deneyiminin kapsamı</p>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne-dark" /> Beş farklı özel site konsepti arasından seçim</li>
              <li className="flex gap-2"><Images className="mt-0.5 h-4 w-4 shrink-0 text-champagne-dark" /> QR fotoğraf albümü ve misafir fotoğraf paylaşımı talebi</li>
              <li className="flex gap-2"><Heart className="mt-0.5 h-4 w-4 shrink-0 text-champagne-dark" /> Ayrı katalogdan bir hediye davetiye konsepti seçimi</li>
            </ul>
            <p className="mt-4 border-t border-midnight/10 pt-4 text-[10px] leading-5 text-muted-foreground">Bu demo aşamasında fiyat, ödeme, ücretsiz kullanım hakkı veya gerçek teslimat tanımlanmaz.</p>
          </div>
        </div>
      </section>

      <section className="container mt-20" aria-labelledby="vip-sites">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] uppercase tracking-[0.24em] text-champagne-dark">A · VIP site konseptleri</p><h2 id="vip-sites" className="mt-3 font-serif text-3xl md:text-4xl">Beş ayrı tasarım yönü</h2></div>
          <p className="max-w-md text-xs leading-5 text-muted-foreground">Her demo farklı düzen ve görsel hiyerarşi kullanır. Örnek isimler ve görseller yalnızca tasarım sunumudur.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {VIP_SITE_TEMPLATES.map((template, index) => (
            <Link key={template.id} href={`/tasarimlar/vip/${template.slug}`} className="group overflow-hidden rounded-[24px] border border-midnight/10 bg-white transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne">
              <div className="relative flex min-h-64 flex-col justify-between overflow-hidden p-6" style={{ background: template.preview.background, color: template.preview.foreground }}>
                {template.image && (
                  <img
                    src={template.image}
                    alt={template.title}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-20 transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.24em]" style={{ color: template.preview.accent }}>0{index + 1} · VIP SITE DEMO</span>
                  {template.hasLiveDemo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-emerald-800 shadow-sm border border-emerald-200/60 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Canlı Demo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium text-midnight/70 shadow-sm backdrop-blur-sm">
                      {template.tag || 'Konsept'}
                    </span>
                  )}
                </div>
                <div className={`my-8 ${template.design.layout === 'editorial' || template.design.layout === 'minimal' ? 'max-w-[75%]' : 'text-center'}`}>
                  <p className="text-[8px] uppercase tracking-[0.24em]" style={{ color: template.preview.accent }}>{template.design.eyebrow}</p>
                  <p className={`mt-3 font-serif text-3xl leading-none ${template.design.layout === 'minimal' ? 'font-sans uppercase tracking-tight' : ''}`}>{template.design.couple[0]}<br /><i style={{ color: template.preview.accent }}>&</i> {template.design.couple[1]}</p>
                </div>
                <span className="text-[9px] uppercase tracking-widest opacity-70">{template.design.date} · {template.design.venue}</span>
                {template.design.layout === 'ivory' && <span aria-hidden className="pointer-events-none absolute inset-4 border" style={{ borderColor: `${template.preview.accent}66` }} />}
                {template.design.layout === 'botanical' && <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border" style={{ borderColor: `${template.preview.accent}55` }} />}
              </div>
              <div className="flex items-center justify-between gap-3 p-5">
                <div><h3 className="font-serif text-lg">{template.title}</h3><p className="mt-1 text-xs text-muted-foreground">{template.description}</p></div>
                <span className="shrink-0 rounded-full border border-midnight/10 p-2 transition group-hover:bg-midnight group-hover:text-white"><ArrowRight className="h-4 w-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mt-20">
        <div className="rounded-[28px] bg-midnight p-6 text-ivory sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.24em] text-champagne">Nasıl işler?</p>
          <h2 className="mt-3 font-serif text-3xl">Talep sürecinin adımları</h2>
          <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => <li key={step} className="rounded-2xl border border-ivory/10 bg-ivory/5 p-4"><span className="font-serif text-2xl text-champagne">0{index + 1}</span><p className="mt-3 text-xs leading-5 text-ivory/75">{step}</p></li>)}
          </ol>
          <p className="mt-6 max-w-3xl text-xs leading-6 text-ivory/60">QR albüm talebi; misafirlerin QR üzerinden fotoğraf paylaşabilmesini, galeride görüntüleme ve toplu indirme deneyimini kapsayacak şekilde değerlendirilir. Bu özelliklerin demo sayfalarındaki örnekleri aktif değildir.</p>
        </div>
      </section>

      <section className="container mt-20" aria-labelledby="vip-invitations">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] uppercase tracking-[0.24em] text-champagne-dark">B · Hediye davetiye konseptleri</p><h2 id="vip-invitations" className="mt-3 font-serif text-3xl md:text-4xl">Bağımsız davetiye seçkisi</h2></div>
          <p className="max-w-md text-xs leading-5 text-muted-foreground">Site ve davetiye seçimleri birbirinden bağımsızdır; aynı numaralı tasarımları seçme zorunluluğu yoktur.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {VIP_INVITATION_TEMPLATES.map((template) => <VipInvitationCard key={template.id} template={template} href={`/tasarimlar/vip/talep/yeni?invitation=${template.slug}`} />)}
        </div>
      </section>

      <section className="container mt-16 text-center">
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">Talebiniz gönderildiğinde mock kayıt olarak tarayıcıda saklanır. Gerçek bir hizmet siparişi, ödeme veya admin bildirimi oluşturulmaz.</p>
        <Link href="/tasarimlar/vip/talep/yeni" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-midnight px-7 text-xs uppercase tracking-wider text-white transition hover:bg-midnight/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne">VIP Tasarımını Seç <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  )
}
