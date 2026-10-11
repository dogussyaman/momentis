import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Car,
  Clock3,
  Gift,
  Heart,
  MapPin,
  Music2,
  QrCode,
  Sparkles,
} from 'lucide-react'
import { Ozel1Hero } from './components/hero'
import { Ozel1Nav } from './components/nav'
import { Ozel1DemoBanner } from './components/demo-banner'
import { Ozel1FooterActions } from './components/footer-actions'

export const metadata = {
  title: 'Özel-1 · Ivory Atelier | MOMENTIS VIP',
  description: 'Fildişi ve şampanya tonlarında kişiye özel VIP düğün sitesi konsepti. Demo sunumudur.',
  robots: { index: false },
}

const demoNote = 'Örnek içerik · Kişiye özel tasarımda düzenlenebilir'

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string
  title: string
  description?: string
  light?: boolean
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className={`text-[9px] uppercase tracking-[0.28em] ${light ? 'text-[#e7c98f]' : 'text-[#a98756]'}`}>{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
      {description && (
        <p className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${light ? 'text-white/60' : 'text-midnight/60'}`}>
          {description}
        </p>
      )}
    </div>
  )
}

function DemoTag({ light = false }: { light?: boolean }) {
  return (
    <p className={`mt-4 text-center text-[9px] ${light ? 'text-white/35' : 'text-midnight/45'}`}>{demoNote}</p>
  )
}

/** Rounded card wrapper for white-bg sections */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl ${className}`}>
      {children}
    </div>
  )
}

export default function Ozel1Page() {
  return (
    <main
      className="relative min-h-screen bg-[#f8f5ee] text-midnight antialiased selection:bg-[#e7c98f]/40 selection:text-midnight"
      data-vip-site="ozel-1"
    >
      {/* Floating "back" + "request" banner */}
      <Ozel1DemoBanner />

      {/* ── 1. NAVBAR ── fixed top */}
      <Ozel1Nav />

      {/* ── 2. HERO ── full width */}
      <Ozel1Hero />

      {/* ── SECTIONS ── centered, standard natural browser scroll */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 flex flex-col gap-8 sm:gap-12">

            {/* ── 3. ÇİFTİMİZ ── */}
            <Card className="bg-white">
              <section id="couple" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Çiftimiz · 03"
                  title="İki ayrı hikâye, şimdi tek bir yol."
                  description="Hayatımıza neşe katan küçük anları ve birbirimizde bulduğumuz güzelliği sizlerle paylaşmak istedik."
                />
                <div className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-2">
                  {[
                    { name: 'Lal', detail: 'Her anı güzelleştiren bir gülümseme ve yeni yerler keşfetme tutkusu.' },
                    { name: 'Emir', detail: 'Küçük mutlulukların kıymetini bilen, sevdikleriyle olmayı seven biri.' },
                  ].map((person, index) => (
                    <article key={person.name} className="overflow-hidden rounded-2xl bg-[#f8f5ef]">
                      <div
                        className={`flex aspect-[5/3] items-end bg-gradient-to-br ${
                          index === 0 ? 'from-[#d9cabb] to-[#a98756]' : 'from-[#c8c7b9] to-[#707565]'
                        } p-5`}
                      >
                        <span className="rounded-full bg-white/85 px-3 py-1.5 text-[9px] uppercase tracking-wider text-midnight/65">
                          Portre fotoğrafı demo alanı
                        </span>
                      </div>
                      <div className="p-5 sm:p-6">
                        <h3 className="font-serif text-2xl">{person.name}</h3>
                        <p className="mt-2 text-xs leading-6 text-midnight/60">{person.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 4. GERİ SAYIM ── dark */}
            <Card className="bg-[#2c302b] text-white">
              <section id="countdown" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16">
                <SectionHeading
                  eyebrow="Birlikte geçireceğimiz güne"
                  title="Geri sayım"
                  description="Düğün gününe kalan süre için örnek sayaç görünümü."
                  light
                />
                <div className="mx-auto mt-8 grid max-w-xl grid-cols-4 gap-2 sm:gap-4">
                  {[
                    ['128', 'Gün'],
                    ['06', 'Saat'],
                    ['42', 'Dakika'],
                    ['18', 'Saniye'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/15 bg-white/5 px-2 py-5 text-center sm:px-4 sm:py-6">
                      <p className="font-serif text-3xl text-[#e7c98f] sm:text-4xl">{value}</p>
                      <p className="mt-2 text-[8px] uppercase tracking-[0.18em] text-white/60">{label}</p>
                    </div>
                  ))}
                </div>
                <DemoTag light />
              </section>
            </Card>

            {/* ── 5. DÜĞÜN DETAYLARI ── */}
            <Card className="bg-white">
              <section id="details" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Düğün detayları · 05"
                  title="Takvimlerinize not edin"
                  description="Bu özel günü beraber karşılamak için ihtiyacınız olan bilgiler."
                />
                <div className="mx-auto mt-9 grid max-w-4xl gap-3 sm:grid-cols-3">
                  {[
                    { icon: CalendarDays, title: 'Tarih', text: '12 Eylül 2027, Pazar' },
                    { icon: Clock3, title: 'Saat', text: '18.30 · Karşılama' },
                    { icon: MapPin, title: 'Mekân', text: 'Sarnıç Köşk · İstanbul' },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-2xl border border-[#e9e1d5] p-6 text-center">
                      <Icon className="mx-auto h-5 w-5 text-[#a98756]" />
                      <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-midnight/45">{title}</p>
                      <p className="mt-2 text-sm font-medium">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-4 max-w-4xl rounded-2xl bg-[#f8f5ef] px-5 py-4 text-center text-xs text-midnight/65">
                  <span className="font-medium text-midnight">Kıyafet kodu:</span> Bahçe şıklığı ·{' '}
                  {demoNote.toLocaleLowerCase('tr-TR')}
                </div>
              </section>
            </Card>

            {/* ── 6. KONUM ── */}
            <Card className="bg-[#f8f5ef]">
              <section id="location" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Konum ve yol tarifi · 06"
                  title="Sarnıç Köşk'te buluşalım"
                  description="Harita bağlantısı örnek mekân adını arar; kesin adres ve otopark notları çift tarafından eklenebilir."
                />
                <div className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-[1.2fr_0.8fr]">
                  <div className="flex min-h-56 items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#d9cdb9_0_4%,transparent_4.5%),linear-gradient(135deg,#ece7de,#d7ded1)] p-6">
                    <div className="rounded-xl bg-white/90 px-4 py-3 text-center shadow-sm">
                      <MapPin className="mx-auto h-5 w-5 text-[#a98756]" />
                      <p className="mt-2 text-xs font-medium">Harita önizleme alanı</p>
                      <p className="mt-1 text-[9px] text-midnight/50">Örnek konum · İstanbul</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <h3 className="font-serif text-xl">Ulaşım notları</h3>
                    <p className="mt-3 text-xs leading-6 text-midnight/60">
                      Otopark ve servis detayları gerçek davetiye hazırlanırken buraya eklenebilir.
                    </p>
                    <Link
                      href="https://www.google.com/maps/search/?api=1&query=Sarn%C4%B1%C3%A7+K%C3%B6%C5%9Fk+%C4%B0stanbul"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-[#d9cbb6] px-4 text-[9px] uppercase tracking-wider transition hover:bg-[#f8f5ef]"
                    >
                      Haritada ara <MapPin className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 7. HİKÂYEMİZ ── */}
            <Card className="bg-white">
              <section id="story" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Hikâyemiz · 07"
                  title="Bir tesadüf, güzel bir başlangıç."
                  description="Bir sonbahar akşamı başlayan hikâyemiz, şimdi en güzel gününe yaklaşıyor."
                />
                <div className="mx-auto mt-10 max-w-3xl border-l-2 border-[#d9cbb6] pl-7 sm:pl-10">
                  {[
                    ['İlk karşılaşma', 'Ortak arkadaşlarımızın davetinde başlayan uzun bir sohbet.'],
                    ['İlk yolculuk', 'Birlikte keşfettiğimiz sahil kasabasında unutulmaz bir hafta sonu.'],
                    ['Bugün', 'En sevdiğimiz insanlarla yeni bir başlangıcı kutlamaya hazırlanıyoruz.'],
                  ].map(([title, text]) => (
                    <div key={title} className="relative pb-8 last:pb-0">
                      <span className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#a98756] ring-1 ring-[#d9cbb6] sm:-left-[43px]" />
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#a98756]">{title}</p>
                      <p className="mt-2 text-sm leading-7 text-midnight/65">{text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </Card>

            {/* ── 8. ETKİNLİK PROGRAMI ── */}
            <Card className="bg-[#f8f5ef]">
              <section id="schedule" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Etkinlik programı · 08"
                  title="Günün akışı"
                  description="Kutlamanın her anında bize katılın."
                />
                <div className="mx-auto mt-8 max-w-2xl divide-y divide-[#e9e1d5] overflow-hidden rounded-2xl bg-white shadow-sm">
                  {[
                    ['18.30', 'Karşılama kokteyli', 'Bahçe terası'],
                    ['19.15', 'Nikâh töreni', 'Tören alanı'],
                    ['20.00', 'Yemek ve kutlama', 'Sarnıç salonu'],
                    ['22.30', 'Dans ve after party', 'Bahçe terası'],
                  ].map(([time, title, venue]) => (
                    <div key={time} className="flex items-center gap-5 px-6 py-4">
                      <span className="min-w-14 font-serif text-xl text-[#a98756]">{time}</span>
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-0.5 text-[9px] text-midnight/45">{venue}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 9. FOTOĞRAF GALERİSİ ── */}
            <Card className="bg-white">
              <section id="gallery" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Fotoğraf galerisi · 09"
                  title="Güzel günlerden küçük kareler"
                  description="Fotoğraf ve videolarınız için örnek galeri düzeni."
                />
                <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-3">
                  {[
                    { color: '#e8dfd2', label: '1' },
                    { color: '#d5c9b8', label: '2' },
                    { color: '#eee8de', label: '3' },
                  ].map(({ color, label }) => (
                    <div
                      key={color}
                      className="flex aspect-[4/3] items-end overflow-hidden rounded-2xl p-4"
                      style={{ background: `linear-gradient(145deg, ${color}, #a9875633)` }}
                    >
                      <span className="rounded-full bg-white/85 px-3 py-1.5 text-[9px] uppercase tracking-wider text-midnight/65">
                        Fotoğraf alanı {label}
                      </span>
                    </div>
                  ))}
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 10. QR ALBÜM ── */}
            <Card className="bg-[#f8f5ef]">
              <section id="album" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="QR fotoğraf albümü · 10"
                  title="Sizin gözünüzden bu günü görelim"
                  description="Misafir fotoğraf yükleme ve ortak albüm paylaşımı bu konseptte tasarım alanı olarak gösterilir."
                />
                <div className="mx-auto mt-8 flex max-w-md flex-col items-center rounded-2xl border border-dashed border-[#cbbb9f] bg-white p-8 text-center shadow-sm">
                  <QrCode className="h-14 w-14 text-[#a98756]" />
                  <p className="mt-5 font-serif text-xl">QR kod alanı</p>
                  <p className="mt-2 text-xs leading-6 text-midnight/55">
                    Gerçek albüm adresi tanımlandığında misafirler fotoğraflarını paylaşabilir.
                  </p>
                  <span className="mt-4 rounded-full bg-[#f8f5ef] px-3 py-1.5 text-[9px] uppercase tracking-wider text-midnight/50">
                    Demo · Aktif QR değil
                  </span>
                </div>
              </section>
            </Card>

            {/* ── 11. DİJİTAL DAVETİYE ── */}
            <Card className="bg-white">
              <section id="invitation" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Dijital davetiye · 11"
                  title="Bu mutlu günümüze davetlisiniz"
                  description="Dijital davetiye kartı önizlemesi. Paylaşma ve indirme demo kapsamında etkin değildir."
                />
                <div className="mx-auto mt-8 max-w-md rounded-[28px] border border-[#dfd2be] bg-[#fbf8f2] p-10 text-center shadow-[0_18px_60px_-40px_rgba(38,31,23,0.55)]">
                  <Sparkles className="mx-auto h-5 w-5 text-[#a98756]" />
                  <p className="mt-5 text-[9px] uppercase tracking-[0.28em] text-[#a98756]">Bir ömür, aynı hikâye</p>
                  <p className="mt-5 font-serif text-5xl leading-none">
                    Lal <i className="text-[#a98756]">&</i> Emir
                  </p>
                  <div className="my-5 h-px w-12 bg-[#d9cbb6] mx-auto" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-midnight/60">12 Eylül 2027 · 18.30</p>
                  <p className="mt-1 text-xs text-midnight/55">Sarnıç Köşk · İstanbul</p>
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 12. RSVP ── dark */}
            <Card className="bg-[#2c302b] text-white">
              <section id="rsvp" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="RSVP / Katılım · 12"
                  title="Sizi aramızda görmek bizi mutlu eder"
                  description="Yanıt formu tasarım örneğidir. Bu demoda yanıtlar kaydedilmez ve gönderilemez."
                  light
                />
                <div className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-2xl border border-white/15 bg-white/5 p-6 sm:grid-cols-2 sm:p-8">
                  <label className="text-[9px] uppercase tracking-wider text-white/60">
                    Adınız
                    <input
                      disabled
                      placeholder="Örnek: Ayşe Yılmaz"
                      className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-xs normal-case tracking-normal text-white placeholder:text-white/35 disabled:cursor-not-allowed"
                    />
                  </label>
                  <label className="text-[9px] uppercase tracking-wider text-white/60">
                    Katılım durumunuz
                    <select
                      disabled
                      defaultValue=""
                      className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-[#343832] px-3 text-xs normal-case tracking-normal text-white/70 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        Bir seçenek belirleyin
                      </option>
                      <option>Katılıyorum</option>
                      <option>Katılamıyorum</option>
                    </select>
                  </label>
                  <p className="text-[9px] leading-5 text-white/45 sm:col-span-2">
                    Kişi sayısı, not ve yanıt takibi gerçek davetiye kurulumu sırasında eklenebilir.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-full bg-[#e7c98f] text-[9px] font-medium uppercase tracking-wider text-[#332a20] opacity-50 sm:col-span-2"
                  >
                    Demo · Yanıt gönderimi kapalı
                  </button>
                </div>
              </section>
            </Card>

            {/* ── 13. AİLELER ── */}
            <Card className="bg-white">
              <section id="families" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Aileler · 13"
                  title="Ailelerimizin sevgisiyle"
                  description="Bu güzel başlangıçta yanımızda olan ailelerimize teşekkür ederiz."
                />
                <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
                  {[
                    { name: "Lal\u2019in ailesi", members: 'Selma & Kemal Demir' },
                    { name: "Emir\u2019in ailesi", members: 'Neslihan & Tar\u0131k Y\u0131ld\u0131z' },
                  ].map((family) => (
                    <div key={family.name} className="rounded-2xl bg-[#f8f5ef] p-7 text-center">
                      <Heart className="mx-auto h-5 w-5 text-[#a98756]" />
                      <p className="mt-4 font-serif text-xl">{family.name}</p>
                      <p className="mt-2 text-sm text-midnight/70">{family.members}</p>
                      <p className="mt-2 text-xs text-midnight/45">Anne ve baba isimleri burada yer alacak.</p>
                    </div>
                  ))}
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 14. ÖZEL MESAJ ── */}
            <Card className="bg-[#fbf8f2]">
              <section id="message" className="scroll-mt-20 px-6 py-14 text-center sm:px-10 sm:py-16">
                <Sparkles className="mx-auto h-5 w-5 text-[#a98756]" />
                <p className="mt-5 text-[9px] uppercase tracking-[0.28em] text-[#a98756]">Özel mesaj · 14</p>
                <h2 className="mt-4 font-serif text-4xl">Sevgiyle, Lal & Emir</h2>
                <div className="my-6 h-px w-12 bg-[#d9cbb6] mx-auto" />
                <p className="mx-auto max-w-xl text-sm leading-7 text-midnight/65">
                  Hayatımızın bu en güzel gününü bizimle paylaştığınız için şimdiden teşekkür ederiz.
                  Varlığınız en güzel hediyemiz.
                </p>
              </section>
            </Card>

            {/* ── 15. MÜZİK ── */}
            <Card className="bg-white">
              <section id="music" className="scroll-mt-20 px-6 py-10 sm:px-10 sm:py-12">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-[#e9e1d5] bg-[#fbf8f2] p-6 text-center sm:flex-row sm:text-left">
                  <span className="shrink-0 rounded-full bg-white p-3.5 shadow-sm">
                    <Music2 className="h-5 w-5 text-[#a98756]" />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-serif text-xl">Bizim şarkımız</h2>
                    <p className="mt-1 text-xs leading-6 text-midnight/55">
                      Müzik · 15 · Arka plan müziği ve kullanıcı kontrollü oynatma alanı — demo, ses çalmaz.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-4 py-2 text-[9px] uppercase tracking-wider text-midnight/50 shadow-sm sm:ml-auto">
                    Müzik kapalı
                  </span>
                </div>
              </section>
            </Card>

            {/* ── 16. KONAKLAMA & ULAŞIM ── */}
            <Card className="bg-[#f8f5ef]">
              <section id="travel" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
                <SectionHeading
                  eyebrow="Konaklama ve ulaşım · 16"
                  title="Şehir dışından gelen misafirlerimiz için"
                  description="Otel ve ulaşım önerileri örnek olarak gösterilir; rezervasyon veya servis bağlantısı bulunmaz."
                />
                <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: BedDouble,
                      title: 'Konaklama',
                      text: 'Yakın çevredeki otel önerileri ve iletişim bilgileri burada paylaşılabilir.',
                    },
                    {
                      icon: Car,
                      title: 'Ulaşım',
                      text: 'Servis saati, buluşma noktası ve transfer detayları buraya eklenebilir.',
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <article key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                      <Icon className="h-5 w-5 text-[#a98756]" />
                      <h3 className="mt-4 font-serif text-xl">{title}</h3>
                      <p className="mt-2 text-xs leading-6 text-midnight/55">{text}</p>
                    </article>
                  ))}
                </div>
                <DemoTag />
              </section>
            </Card>

            {/* ── 17. HEDİYE / DİLEKLER ── */}
            <Card className="bg-white">
              <section id="gift" className="scroll-mt-20 px-6 py-14 sm:px-10 sm:py-16">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#e9e1d5] p-8 text-center sm:p-10">
                  <Gift className="mx-auto h-6 w-6 text-[#a98756]" />
                  <p className="mt-4 text-[9px] uppercase tracking-[0.28em] text-[#a98756]">Hediye / Dilekler · 17</p>
                  <h2 className="mt-3 font-serif text-3xl">Güzel dilekleriniz yeter</h2>
                  <div className="my-5 h-px w-10 bg-[#d9cbb6] mx-auto" />
                  <p className="text-xs leading-7 text-midnight/60">
                    Dilerseniz çift için kısa bir not bırakma alanı bu bölüme eklenebilir. Demo mesajları kaydetmez.
                  </p>
                  <span className="mt-5 inline-flex rounded-full bg-[#f8f5ef] px-4 py-2 text-[9px] uppercase tracking-wider text-midnight/50">
                    Örnek içerik
                  </span>
                </div>
              </section>
            </Card>

            {/* ── 18. FOOTER ── */}
            <Card className="bg-[#2c302b] text-white">
              <footer className="px-6 py-12 text-center sm:px-10 sm:py-14">
                <p className="font-serif text-3xl">
                  Lal <i className="text-[#e7c98f]">&</i> Emir
                </p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.24em] text-white/55">12 Eylül 2027 · İstanbul</p>
                <div className="my-7 h-px w-12 bg-white/20 mx-auto" />

                {/* CTA — Şablonu seç ve kapat / Geri dön */}
                <Ozel1FooterActions />

                <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[9px] text-white/50">
                  <Link href="#home" className="transition hover:text-white">Başa dön</Link>
                  <Link href="/tasarimlar/vip" className="transition hover:text-white">VIP konseptler</Link>
                </div>
                <p className="mt-7 text-[8px] uppercase tracking-[0.2em] text-white/25">MOMENTIS · Özel-1 Ivory Atelier demo konsepti</p>
              </footer>
            </Card>
      </div>
    </main>
  )
}
