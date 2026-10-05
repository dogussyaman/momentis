import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Logo />
      <p className="mt-16 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">404</p>
      <h1 className="mt-4 font-serif text-5xl text-midnight">Bu sayfa davetli listesinde yok.</h1>
      <p className="mt-4 max-w-md text-muted-foreground">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Button asChild className="mt-10 h-12 rounded-none bg-midnight px-8 text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700">
        <Link href="/">Ana sayfaya dön</Link>
      </Button>
    </div>
  )
}
