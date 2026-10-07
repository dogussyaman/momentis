import { EDITOR_FONTS } from '@/lib/editor-fonts'

export const HEADING_FONTS = [
  ...EDITOR_FONTS.filter((font) => font.category !== 'Script').map((font) => font.name),
  'Marcellus',
  'Italiana',
]

export const BODY_FONTS = [...new Set([...HEADING_FONTS, 'Lato', 'Jost', 'Nunito Sans', 'Outfit'])]

export const SCRIPT_FONTS = EDITOR_FONTS.filter((font) => font.category === 'Script').map((font) => font.name)

const loaded = new Set<string>()
const SYSTEM_FONTS = new Set(['Georgia', 'Times New Roman', 'Arial'])

/** Injects a Google Fonts stylesheet for the given families (client only, idempotent). */
export function loadGoogleFonts(families: (string | undefined)[]) {
  if (typeof document === 'undefined') return
  const missing = families.filter((f): f is string => !!f && !SYSTEM_FONTS.has(f) && !loaded.has(f))
  if (!missing.length) return
  missing.forEach((f) => loaded.add(f))
  const query = missing
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400`)
    .join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`
  document.head.appendChild(link)
}

export function fontStack(name: string, fallback: 'serif' | 'sans' | 'script' = 'serif') {
  const fb = fallback === 'sans' ? 'system-ui, sans-serif' : fallback === 'script' ? 'cursive' : 'Georgia, serif'
  return `'${name}', ${fb}`
}
