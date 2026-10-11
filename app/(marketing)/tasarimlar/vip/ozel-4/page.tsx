import Link from 'next/link'

export const metadata = {
  title: 'Özel-4 | MOMENTIS VIP',
  robots: { index: false },
}

export default function Ozel4Page() {
  return (
    <main className="min-h-dvh bg-ivory px-5 py-24 text-midnight" data-vip-site="ozel-4">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">VIP site konsepti · Demo</p>
        <h1 className="mt-4 font-serif text-4xl">Özel-4</h1>
        <p className="mt-3 text-sm text-muted-foreground">Bu sayfanın tasarımı henüz hazırlanmadı.</p>
        <Link href="/tasarimlar/vip/talep/yeni?site=ozel-4" className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-midnight px-5 text-sm text-white">
          Bu konseptle talep sihirbazını aç
        </Link>
      </div>
    </main>
  )
}
