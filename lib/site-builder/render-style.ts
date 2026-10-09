import type { CSSProperties } from 'react'
import type { WeddingSite } from './schema'

type SiteRootStyle = CSSProperties & { [key: `--${string}`]: string | number | undefined }

export function getSiteRootStyle(site: WeddingSite, textScale = 100, viewportHeight?: number): SiteRootStyle {
  return {
    backgroundColor: site.theme.backgroundColor,
    color: site.theme.textColor,
    minHeight: viewportHeight ? `${viewportHeight}px` : undefined,
    fontSize: `${textScale}%`,
    '--sb-bg': site.theme.backgroundColor,
    '--sb-text': site.theme.textColor,
    '--sb-accent': site.theme.accentColor,
    '--sb-surface': site.theme.surfaceColor,
    '--sb-line': `${site.theme.textColor}1a`,
    '--sb-on-accent': site.theme.backgroundColor,
    '--sb-heading-font': `'${site.theme.headingFont}', serif`,
    '--sb-body-font': `'${site.theme.bodyFont}', sans-serif`,
    '--sb-script-font': `'${site.theme.scriptFont}', cursive`,
    '--sb-radius': `${site.theme.borderRadius}px`,
    '--sb-btn-radius': `${site.theme.buttonRadius}px`,
    '--sb-heading-scale': site.theme.headingScale,
    '--sb-heading-tracking': site.theme.letterSpacing === 'tight'
      ? '-0.03em'
      : site.theme.letterSpacing === 'wide'
        ? '0.06em'
        : 'normal',
    '--sb-screen': viewportHeight ? `${viewportHeight}px` : '100vh',
  } as SiteRootStyle
}
