import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-midnight/5 text-midnight">
        <SearchX className="h-10 w-10 opacity-70" />
      </div>
      <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark">404</p>
      <h1 className="mt-4 font-serif text-4xl text-midnight">Şablon bulunamadı.</h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        Aradığınız site şablonu taşınmış, silinmiş ya da hiç var olmamış olabilir. Lütfen geçerli bir şablon seçtiğinizden emin olun.
      </p>
      <Button asChild className="mt-10 h-12 rounded-2xl bg-midnight px-8 text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700">
        <Link href="/panel/sablonlar">Tüm Şablonlara Dön</Link>
      </Button>
    </div>
  )
}
