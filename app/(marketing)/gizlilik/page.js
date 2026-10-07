import Link from 'next/link'

export const metadata = {
  title: 'Gizlilik | MOMENTIS',
  description: 'MOMENTIS gizlilik bildirimi taslağı.',
  robots: { index: false, follow: false },
}

const items = [
  'Veri sorumlusunun resmi unvanı, adresi ve başvuru kanalı',
  'Hesap, etkinlik, davetli yanıtları, yüklenen medya ve bülten verilerinin işlenme amaçları ve hukuki dayanakları',
  'Kullanılan hizmet sağlayıcılar, olası yurt dışı aktarımları ve saklama süreleri',
  'Verilere erişme, düzeltme, silme ve diğer başvuru haklarının nasıl kullanılacağı',
  'Çerezler ve oturum bilgilerinin kullanımı',
]

export default function PrivacyPage() {
  return (
    <main className="bg-ivory px-6 pb-24 pt-36">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-white p-7 shadow-sm sm:p-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-champagne-dark">MOMENTIS · Gizlilik</p>
        <h1 className="mt-4 font-serif text-4xl text-midnight sm:text-5xl">Gizlilik bildirimi</h1>
        <div role="status" className="mt-8 rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
          <strong className="block font-semibold">Taslak — yayıma hazır değildir.</strong>
          Bu örnek metin MOMENTIS için hukuki bildirim yerine geçmez. Gerçek veri uygulamaları ve işletme bilgileri doğrulanıp metin gözden geçirilmeden bu sayfa nihai politika olarak kullanılmamalıdır.
        </div>
        <section className="mt-9 space-y-4 text-sm leading-7 text-muted-foreground">
          <h2 className="font-serif text-2xl text-midnight">Tamamlanması gereken bilgiler</h2>
          <p>Yayımdan önce aşağıdaki başlıklar MOMENTIS'in gerçek işleyişine göre açıklanmalıdır:</p>
          <ul className="list-disc space-y-2 pl-5">
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p>Bu alanlar henüz doğrulanmış bilgiyle doldurulmadı. Sorular için <a className="text-midnight underline underline-offset-4" href="mailto:merhaba@momentis.app">merhaba@momentis.app</a> adresine ulaşabilirsiniz; bu iletişim adresi tek başına resmi veri sorumlusu veya başvuru usulünü tanımlamaz.</p>
        </section>
        <Link href="/" className="mt-9 inline-flex text-sm font-medium text-midnight underline decoration-champagne underline-offset-4">Ana sayfaya dön</Link>
      </article>
    </main>
  )
}
