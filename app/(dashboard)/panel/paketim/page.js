export const metadata = {
  title: 'Paketim | MOMENTIS',
}

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-serif text-midnight">Paketim</h1>
        <p className="mt-3 text-muted-foreground">Mevcut aboneliğinizi ve Premium özelliklerinizi görüntüleyin.</p>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-champagne/40 bg-gradient-to-br from-champagne/10 to-transparent p-8 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-champagne bg-champagne-light/30 px-2.5 py-0.5 text-xs font-semibold text-champagne-dark">
              Ücretsiz Plan
            </div>
            <h2 className="mt-4 text-2xl font-serif text-midnight">Standart Erişim</h2>
            <p className="mt-1 text-sm text-muted-foreground">Temel şablonlar ve temel özelliklerle başla.</p>
          </div>
          <button disabled className="rounded-full bg-midnight px-6 py-3 text-sm font-medium text-white opacity-80 transition hover:opacity-100">
            Premium'a Yükselt
          </button>
        </div>
        
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          <h3 className="text-xl font-serif text-midnight">Premium Ayrıcalıkları</h3>
          <ul className="mt-6 space-y-4">
            <li className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne/30 text-champagne-dark font-medium">✓</span>
              Tüm Premium "Web Sitesi" ve "Davetiye" şablonlarına sınırsız erişim
            </li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne/30 text-champagne-dark font-medium">✓</span>
              "MOMENTIS ile yapıldı" ibaresini kaldırma
            </li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne/30 text-champagne-dark font-medium">✓</span>
              Gelişmiş analitikler ve LCV bildirimleri
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

