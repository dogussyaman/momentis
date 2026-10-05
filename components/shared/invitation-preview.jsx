import { cn } from '@/lib/utils'

const DEFAULT_PALETTE = { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' }

export function InvitationPreview({ template, names = { a: 'Elif', b: 'Kaan' }, date = '14 Eylül 2025', venue = 'Four Seasons Bosphorus, İstanbul', greeting = 'Düğünümüze Davetlisiniz', className }) {
  const p = template?.palette || DEFAULT_PALETTE
  const layout = template?.layout || 'classic'
  const isModern = layout === 'modern'
  const isMinimal = layout === 'minimal'

  return (
    <div
      className={cn('relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl shadow-[0_40px_80px_-20px_rgba(16,24,39,0.45)]', className)}
      style={{ backgroundColor: p.bg, color: p.text }}
      data-testid="invitation-preview"
    >
      {!isMinimal && <div className="pointer-events-none absolute inset-[6%] border" style={{ borderColor: `${p.accent}55` }} />}
      {layout === 'botanical' && (
        <>
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: p.accent }} />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: p.accent }} />
        </>
      )}
      {isModern && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-[0.12]" style={{ background: `linear-gradient(180deg, ${p.accent}, transparent)` }} />}

      <div className="relative flex h-full flex-col items-center justify-between px-[10%] py-[12%] text-center">
        <p className={cn('text-[0.55em] uppercase', isModern ? 'tracking-[0.5em]' : 'tracking-[0.35em]')} style={{ color: p.accent, fontSize: 'clamp(8px, 2.6cqw, 11px)' }}>
          {greeting}
        </p>

        <div className="space-y-1">
          <p className={cn('font-serif leading-[1.05]', isModern && 'uppercase tracking-[0.08em]')} style={{ fontSize: 'clamp(24px, 11cqw, 48px)' }}>{names.a}</p>
          <p className="font-serif italic leading-none" style={{ color: p.accent, fontSize: 'clamp(18px, 7cqw, 30px)' }}>&amp;</p>
          <p className={cn('font-serif leading-[1.05]', isModern && 'uppercase tracking-[0.08em]')} style={{ fontSize: 'clamp(24px, 11cqw, 48px)' }}>{names.b}</p>
        </div>

        <div className="space-y-2">
          <div className="mx-auto h-px w-10" style={{ backgroundColor: p.accent }} />
          <p className="uppercase tracking-[0.22em]" style={{ fontSize: 'clamp(8px, 2.8cqw, 12px)' }}>{date}</p>
          <p style={{ color: p.muted, fontSize: 'clamp(8px, 2.6cqw, 11px)' }}>{venue}</p>
        </div>
      </div>
    </div>
  )
}
