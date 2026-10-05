import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { NewsletterForm } from './newsletter-form'

const COLUMNS = [
  { title: 'Ürün', links: [{ label: 'Tasarımlar', href: '/tasarimlar' }, { label: 'Nasıl Çalışır', href: '/nasil-calisir' }, { label: 'Fiyatlandırma', href: '/fiyatlandirma' }] },
  { title: 'Etkinlikler', links: [{ label: 'Düğün', href: '/tasarimlar?kategori=dugun' }, { label: 'Nişan', href: '/tasarimlar?kategori=nisan' }, { label: 'Kına Gecesi', href: '/tasarimlar?kategori=kina' }, { label: 'Doğum Günü', href: '/tasarimlar?kategori=dogum-gunu' }] },
  { title: 'Hesap', links: [{ label: 'Giriş Yap', href: '/giris' }, { label: 'Hesap Oluştur', href: '/kayit' }] },
]

export function Footer() {
  return (
    <footer className="bg-midnight text-ivory" data-testid="footer">
      <div className="container py-20">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo tone="light" />
            <p className="mt-6 max-w-sm font-serif text-2xl leading-snug text-ivory/90">
              Her anın, zarafetle anlatılmaya değer bir hikâyesi var.
            </p>
            <div className="mt-10 max-w-sm">
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-champagne">İlham Bülteni</p>
              <NewsletterForm />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:pl-12">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-champagne">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-ivory/70 transition-colors hover:text-ivory">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-ivory/10 pt-8 text-xs text-ivory/50 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} MOMENTIS. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="transition-colors hover:text-ivory">Gizlilik</Link>
            <Link href="#" className="transition-colors hover:text-ivory">Koşullar</Link>
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-ivory"><Instagram className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
