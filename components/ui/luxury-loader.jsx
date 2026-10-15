'use client'

import { Sparkles, ShieldCheck, Crown, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * MomentisOrbitalRings:
 * Interlocking 4-ring orbital animation customized with Momentis luxury brand colors:
 * - Ring A: Champagne Gold (#C9A96E)
 * - Ring B: Midnight Navy (#101827)
 * - Ring C: Champagne Dark (#A8884E)
 * - Ring D: Champagne Light (#E3CFA4)
 */
export function MomentisOrbitalRings({ className = '', size = 80 }) {
  return (
    <svg
      className={cn('pl shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden="true"
    >
      <circle
        className="pl__ring pl__ring--a"
        cx="120"
        cy="120"
        r="105"
        fill="none"
        strokeWidth="20"
        strokeDasharray="0 660"
        strokeDashoffset="-330"
        strokeLinecap="round"
      />
      <circle
        className="pl__ring pl__ring--b"
        cx="120"
        cy="120"
        r="35"
        fill="none"
        strokeWidth="20"
        strokeDasharray="0 220"
        strokeDashoffset="-110"
        strokeLinecap="round"
      />
      <circle
        className="pl__ring pl__ring--c"
        cx="85"
        cy="120"
        r="70"
        fill="none"
        strokeWidth="20"
        strokeDasharray="0 440"
        strokeLinecap="round"
      />
      <circle
        className="pl__ring pl__ring--d"
        cx="155"
        cy="120"
        r="70"
        fill="none"
        strokeWidth="20"
        strokeDasharray="0 440"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * LuxuryLoader: Executive-grade loading state with ambient champagne glow,
 * the customized 4-ring interlocking orbital animation, and an animated gradient progress bar.
 */
export function LuxuryLoader({
  title = 'Veriler Senkronize Ediliyor',
  subtitle = 'MOMENTIS · GÜVENLİ BAĞLANTI',
  variant = 'card', // 'page' | 'card' | 'inline'
  className = '',
  size = 'default', // 'sm' | 'default' | 'lg'
}) {
  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-3 px-3 py-1.5 bg-transparent',
          className
        )}
      >
        <MomentisOrbitalRings size={22} className="!w-5 !h-5" />
        <span className="text-xs font-medium text-midnight">{title}</span>
        <span className="sr-only">{title}</span>
      </div>
    )
  }

  const isPage = variant === 'page'
  const ringSize = size === 'lg' || isPage ? 96 : 76

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative flex flex-col items-center justify-center text-center bg-transparent',
        isPage ? 'min-h-[420px] w-full py-16' : 'min-h-[220px] w-full py-10',
        className
      )}
    >
      {/* Momentis Customized 4-Ring Interlocking Orbital Loader */}
      <div className="relative mb-5 flex items-center justify-center">
        <MomentisOrbitalRings
          size={ringSize}
          className={isPage ? '!w-24 !h-24' : '!w-20 !h-20'}
        />
      </div>

      {/* Typography */}
      <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-champagne-dark">
        <span className="h-px w-6 bg-champagne/40" />
        {subtitle}
        <span className="h-px w-6 bg-champagne/40" />
      </p>

      <h3 className="mt-2.5 font-serif text-xl text-midnight sm:text-2xl">
        {title}
      </h3>

      {/* Shimmer indeterminate progress bar */}
      <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-midnight/10">
        <div className="h-full w-full animate-indeterminate bg-gradient-to-r from-transparent via-champagne to-transparent" />
      </div>

      <span className="sr-only">{title}</span>
    </div>
  )
}

/**
 * Shimmer element with luxury champagne sheen
 */
export function Shimmer({ className = '' }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-midnight/[0.04]',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite]',
        'after:bg-gradient-to-r after:from-transparent after:via-champagne/20 after:to-transparent',
        className
      )}
    />
  )
}

/**
 * Modern Dashboard Home Skeleton matching the 4-KPI & Executive layout
 */
export function DashboardHomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8" role="status" aria-label="Panel yükleniyor">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-[2rem] bg-midnight/90 p-8 sm:p-10 shadow-xl">
        <div className="space-y-4">
          <div className="h-3 w-40 rounded-full bg-white/10" />
          <div className="h-10 w-64 rounded-2xl bg-white/15" />
          <div className="h-4 w-96 max-w-full rounded-xl bg-white/10" />
        </div>
      </div>

      {/* 4 KPI Metric Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-midnight/10 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <Shimmer className="h-12 w-12 rounded-2xl" />
              <Shimmer className="h-5 w-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Shimmer className="h-3 w-28 rounded-md" />
              <Shimmer className="h-9 w-20 rounded-lg" />
              <Shimmer className="h-3 w-36 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Content Skeleton */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-midnight/10 bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Shimmer className="h-3 w-24 rounded-md" />
              <Shimmer className="h-7 w-44 rounded-lg" />
            </div>
            <Shimmer className="h-8 w-8 rounded-xl" />
          </div>
          <Shimmer className="h-32 w-full rounded-2xl" />
        </div>

        <div className="rounded-3xl border border-midnight/10 bg-white p-7 shadow-sm space-y-5">
          <div className="space-y-2">
            <Shimmer className="h-3 w-24 rounded-md" />
            <Shimmer className="h-7 w-36 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Shimmer key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="rounded-3xl border border-midnight/10 bg-white p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer className="h-3 w-28 rounded-md" />
            <Shimmer className="h-7 w-52 rounded-lg" />
          </div>
          <Shimmer className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Modern Card Grid Skeleton for projects, templates or packages
 */
export function CardGridSkeleton({ count = 3, columns = 'md:grid-cols-2 xl:grid-cols-3' }) {
  return (
    <div className={cn('grid gap-6', columns)} role="status" aria-label="Kartlar yükleniyor">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-midnight/10 bg-white p-6 shadow-sm space-y-4"
        >
          <Shimmer className="aspect-[16/10] w-full rounded-2xl" />
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Shimmer className="h-3 w-24 rounded-md" />
              <Shimmer className="h-4 w-16 rounded-full" />
            </div>
            <Shimmer className="h-7 w-3/4 rounded-lg" />
            <Shimmer className="h-3.5 w-full rounded-md" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-midnight/5">
            <Shimmer className="h-8 w-24 rounded-xl" />
            <Shimmer className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * TableSkeleton for data tables with realistic headers, rows, badges, and action buttons
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-midnight/10 bg-white shadow-sm" role="status" aria-label="Tablo yükleniyor">
      <div className="border-b border-midnight/10 bg-ivory-50/70 p-4">
        <div className="flex items-center justify-between gap-4">
          <Shimmer className="h-4 w-32 rounded-md" />
          <Shimmer className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <div className="divide-y divide-midnight/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Shimmer className="h-10 w-10 shrink-0 rounded-2xl" />
              <div className="space-y-2 min-w-0 flex-1">
                <Shimmer className="h-4 w-40 rounded-md" />
                <Shimmer className="h-3 w-56 rounded-md" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Shimmer className="h-6 w-20 rounded-full" />
              <Shimmer className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
