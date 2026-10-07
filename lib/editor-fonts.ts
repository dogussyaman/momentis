export type FontCategory = 'Script' | 'Elegant' | 'Serif' | 'Sans' | 'Display' | 'Classic'

export type EditorFont = { name: string; category: FontCategory; weights?: string }

export const EDITOR_FONTS: EditorFont[] = [
  { name: 'Great Vibes', category: 'Script', weights: '400' },
  { name: 'Allura', category: 'Script', weights: '400' },
  { name: 'Alex Brush', category: 'Script', weights: '400' },
  { name: 'Parisienne', category: 'Script', weights: '400' },
  { name: 'Pinyon Script', category: 'Script', weights: '400' },
  { name: 'Sacramento', category: 'Script', weights: '400' },
  { name: 'Marck Script', category: 'Script', weights: '400' },
  { name: 'Dancing Script', category: 'Script', weights: '400;500;600;700' },
  { name: 'Satisfy', category: 'Script', weights: '400' },
  { name: 'Tangerine', category: 'Script', weights: '400;700' },
  { name: 'Italianno', category: 'Script', weights: '400' },
  { name: 'Ballet', category: 'Script', weights: '400' },
  { name: 'Playfair Display', category: 'Elegant', weights: '400;500;600;700' },
  { name: 'Cormorant Garamond', category: 'Elegant', weights: '400;500;600;700' },
  { name: 'Bodoni Moda', category: 'Elegant', weights: '400;500;600;700' },
  { name: 'DM Serif Display', category: 'Elegant', weights: '400' },
  { name: 'Libre Baskerville', category: 'Elegant', weights: '400;700' },
  { name: 'Lora', category: 'Serif', weights: '400;500;600;700' },
  { name: 'EB Garamond', category: 'Serif', weights: '400;500;600;700' },
  { name: 'Cormorant', category: 'Serif', weights: '400;500;600;700' },
  { name: 'Cinzel', category: 'Display', weights: '400;500;600;700' },
  { name: 'Oswald', category: 'Display', weights: '400;500;600;700' },
  { name: 'Montserrat', category: 'Sans', weights: '400;500;600;700' },
  { name: 'Poppins', category: 'Sans', weights: '400;500;600;700' },
  { name: 'Inter', category: 'Sans', weights: '400;500;600;700' },
  { name: 'DM Sans', category: 'Sans', weights: '300;400;500;600;700' },
  { name: 'Raleway', category: 'Sans', weights: '400;500;600;700' },
  { name: 'Josefin Sans', category: 'Sans', weights: '400;500;600;700' },
  { name: 'Cormorant SC', category: 'Display', weights: '400;500;600;700' },
  { name: 'Bebas Neue', category: 'Display', weights: '400' },
  { name: 'Georgia', category: 'Classic' },
  { name: 'Times New Roman', category: 'Classic' },
  { name: 'Arial', category: 'Classic' },
]

export const EDITOR_FONT_NAMES = EDITOR_FONTS.map((font) => font.name)

export function fontStack(name: string) {
  if (name === 'Georgia') return 'Georgia, serif'
  if (name === 'Times New Roman') return '"Times New Roman", serif'
  if (name === 'Arial') return 'Arial, sans-serif'
  return "'" + name + "', sans-serif"
}
