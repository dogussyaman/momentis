type PreviewTheme = {
  background: string
  foreground: string
  accent: string
  secondary: string
  ornament: string
}

export function InvitationPreview({ theme, title, compact = false }: { theme: PreviewTheme; title: string; compact?: boolean }) {
  return (
    <div
      className={`relative mx-auto flex aspect-[360/520] w-full items-center justify-center overflow-hidden p-5 ${compact ? 'max-w-[220px]' : 'max-w-[310px]'}`}
      style={{ background: theme.background, color: theme.foreground }}
      role="img"
      aria-label={`${title} tasarım önizlemesi`}
    >
      <div className="absolute inset-[6%] border" style={{ borderColor: theme.accent, opacity: 0.75 }} />
      <div className="absolute inset-[8%] border" style={{ borderColor: theme.secondary, opacity: 0.9 }} />
      {theme.ornament === 'lines' ? (
        <>
          <span className="absolute left-[15%] top-[20%] h-16 w-1" style={{ backgroundColor: theme.accent }} />
          <span className="absolute right-[15%] bottom-[20%] h-16 w-1" style={{ backgroundColor: theme.accent }} />
        </>
      ) : (
        <span className="absolute top-[11%] font-serif text-xl tracking-[0.4em]" style={{ color: theme.accent }}>
          {theme.ornament === 'stars' ? '✦ ✧ ✦' : theme.ornament === 'flowers' ? '❀ ❀ ❀' : theme.ornament === 'leaves' ? '❧ ❧ ❧' : '✧'}
        </span>
      )}
      <div className="relative z-10 flex max-w-full flex-col items-center text-center">
        <span className="text-[8px] font-medium uppercase tracking-[0.26em] opacity-75">Özel günümüze davetlisiniz</span>
        <span className="my-8 max-w-full break-words font-serif text-2xl leading-tight sm:text-3xl">Zehra <span style={{ color: theme.accent }}>&</span> Samet</span>
        <span className="h-px w-16" style={{ backgroundColor: theme.accent }} />
        <span className="mt-7 text-[10px] uppercase tracking-[0.2em]">14 Haziran 2027</span>
        <span className="mt-4 max-w-[190px] text-[9px] leading-relaxed opacity-75">Bu mutlu günümüzde sizleri de aramızda görmekten mutluluk duyarız.</span>
      </div>
      <span className="absolute bottom-[11%] font-serif text-base" style={{ color: theme.accent }}>
        {theme.ornament === 'flowers' ? '❀' : theme.ornament === 'leaves' ? '❧' : theme.ornament === 'stars' ? '✦' : '◇'}
      </span>
    </div>
  )
}
