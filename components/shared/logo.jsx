import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, tone = 'dark', href = '/', showText = true }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 outline-none', className)} aria-label="MOMENTIS ana sayfa">
      <img 
        src="/logo.png" 
        alt="Momentis Logo" 
        className={cn(
          "h-8 w-auto object-contain transition-transform duration-500 group-hover:scale-105", 
          tone === 'light' ? 'brightness-0 invert' : ''
        )} 
      />
      {showText && (
        <span className={cn('font-serif text-xl tracking-[0.28em] uppercase', tone === 'light' ? 'text-ivory' : 'text-midnight')}>
          Momentis
        </span>
      )}
    </Link>
  )
}
