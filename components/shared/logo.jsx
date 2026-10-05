import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, tone = 'dark', href = '/' }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2', className)} aria-label="MOMENTIS ana sayfa">
      <span className={cn('h-1.5 w-1.5 rounded-full bg-champagne transition-transform duration-500 group-hover:scale-150')} />
      <span className={cn('font-serif text-xl tracking-[0.28em] uppercase', tone === 'light' ? 'text-ivory' : 'text-midnight')}>
        Momentis
      </span>
    </Link>
  )
}
