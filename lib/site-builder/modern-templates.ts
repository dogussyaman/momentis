import type { SiteTheme } from './schema'
import type { SiteTemplate } from './templates'
import { btn } from './definitions'
import { STOCK } from './media'

const theme = (t: Partial<SiteTheme>): SiteTheme => ({
  primaryColor: '#101827',
  secondaryColor: '#c9a96e',
  accentColor: '#c9a96e',
  backgroundColor: '#ffffff',
  surfaceColor: '#f5f5f5',
  textColor: '#101827',
  mutedColor: '#6b6458',
  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
  scriptFont: 'Great Vibes',
  borderRadius: 16,
  buttonRadius: 999,
  headingScale: 1,
  letterSpacing: 'normal',
  ...t,
})

const rsvpBtns = [btn('Katılım Bildir', 'rsvp', 'solid'), btn('Yol Tarifi', 'map', 'outline')]

export const MODERN_TEMPLATES: SiteTemplate[] = [
  /* ---------------- Noir & Altın ---------------- */
  {
    id: 'noir',
    name: 'Noir & Altın',
    tagline: 'Siyah zemin, altın detaylar — gala gecesi',
    preview: STOCK.hero5,
    swatches: ['#0a0a0a', '#c8a24a', '#f5efe0'],
    theme: theme({
      primaryColor: '#c8a24a', secondaryColor: '#c8a24a', accentColor: '#c8a24a',
      backgroundColor: '#0a0a0a', surfaceColor: '#151515', textColor: '#f5efe0', mutedColor: '#a39a86',
      headingFont: 'Playfair Display', bodyFont: 'Montserrat', scriptFont: 'Great Vibes',
      borderRadius: 2, buttonRadius: 2, letterSpacing: 'wide',
    }),
    settings: { navStyle: 'transparent' },
    sections: [
      ['hero', { props: { titleFont: 'heading', titleSize: 96, eyebrow: 'Bir gala gecesi', showCountdown: true, buttons: rsvpBtns }, style: { bgImage: STOCK.hero5, overlayColor: '#000000', overlayOpacity: 62, minHeight: 'screen' } }],
      ['text', { props: { variant: 'quote', eyebrow: 'Davet', title: 'Sizi en özel gecemize bekliyoruz', text: 'Işıltılı bir akşam, sevdiklerimizle.' }, style: { paddingY: 90 } }],
      ['couple', { props: { photoShape: 'square', layout: 'side' } }],
      ['story', { props: { layout: 'timeline' }, style: { bgType: 'color', bgColor: '#111111' } }],
      ['event', { props: { layout: 'split', showMap: true, showCalendar: true } }],
      ['schedule', { props: { layout: 'timeline' }, style: { bgType: 'color', bgColor: '#111111' } }],
      ['gallery', { props: { layout: 'masonry', showCaptions: false }, style: { width: 'wide' } }],
      ['dresscode', { props: { title: 'Black Tie', colors: [{ id: 'n1', color: '#000000', name: 'Siyah' }, { id: 'n2', color: '#c8a24a', name: 'Altın' }, { id: 'n3', color: '#f5efe0', name: 'Fildişi' }] } }],
      ['rsvp', { props: { layout: 'card', askGuests: true, askPhone: true, askMenu: true, askNote: true }, style: { marginX: 24, radius: 4, borderWidth: 1, borderColor: '#c8a24a55', bgType: 'color', bgColor: '#151515' } }],
      ['faq'],
      ['footer', { props: { layout: 'columns', monogram: 'A & M', title: 'Gecenin ışığında görüşmek üzere', text: 'Sevgiyle,\nAyşe & Mehmet', date: '12.06.2027', hashtag: '#AyseVeMehmet', showCredit: true }, style: { bgType: 'color', bgColor: '#050505' } }],
    ],
  },

  /* ---------------- Pudra Romantizm ---------------- */
  {
    id: 'blush',
    name: 'Pudra Romantizm',
    tagline: 'Pudra pembe, yumuşak ışık, romantik',
    preview: STOCK.bouquet,
    swatches: ['#fdf4f3', '#d98ca0', '#5a2e3a'],
    theme: theme({
      primaryColor: '#5a2e3a', secondaryColor: '#d98ca0', accentColor: '#d98ca0',
      backgroundColor: '#fdf4f3', surfaceColor: '#ffffff', textColor: '#4a2530', mutedColor: '#8d6872',
      headingFont: 'Cormorant Garamond', bodyFont: 'Jost', scriptFont: 'Parisienne',
      borderRadius: 28, buttonRadius: 999,
    }),
    settings: { navStyle: 'floating' },
    sections: [
      ['hero', { props: { layout: 'frame', contentBox: 'glass', titleFont: 'script', titleSize: 110, eyebrow: 'Evleniyoruz', buttons: rsvpBtns }, style: { bgImage: STOCK.bouquet, overlayColor: '#5a2e3a', overlayOpacity: 25, textColor: '#ffffff', corners: 'floral', cornerColor: '#ffffff' } }],
      ['countdown', { props: { variant: 'circles' } }],
      ['couple', { props: { photoShape: 'arch', layout: 'cards' } }],
      ['story', { props: { layout: 'zigzag' }, style: { bgType: 'gradient', gradientFrom: '#fdf4f3', gradientTo: '#f9e1e4', gradientAngle: 180 } }],
      ['event', { props: { layout: 'cards', showMap: true, showCalendar: true } }],
      ['gallery', { props: { layout: 'collage', showCaptions: true } }],
      ['album'],
      ['rsvp', { props: { layout: 'split', image: STOCK.bride2 }, style: { marginX: 24, radius: 32, bgType: 'color', bgColor: '#ffffff', shadow: 'xl' } }],
      ['gift'],
      ['footer', { props: { layout: 'split', monogram: 'A & M', title: 'Aşkla, sevgiyle, birlikte', text: 'Bu mutlu güne ortak olduğunuz için teşekkürler.', date: '12.06.2027', hashtag: '#AyseVeMehmet', showCredit: true }, style: { bgType: 'color', bgColor: '#f9e1e4' } }],
    ],
  },

  /* ---------------- Dergi Kapağı ---------------- */
  {
    id: 'editorial',
    name: 'Dergi Kapağı',
    tagline: 'Cesur tipografi, vermilyon vurgu, moda dergisi',
    preview: STOCK.hero2,
    swatches: ['#f4f1ea', '#e4572e', '#1a1a1a'],
    theme: theme({
      primaryColor: '#1a1a1a', secondaryColor: '#e4572e', accentColor: '#e4572e',
      backgroundColor: '#f4f1ea', surfaceColor: '#ebe6db', textColor: '#1a1a1a', mutedColor: '#6e6a60',
      headingFont: 'Fraunces', bodyFont: 'Inter', scriptFont: 'Pinyon Script',
      borderRadius: 0, buttonRadius: 0, letterSpacing: 'tight', headingScale: 1.1,
    }),
    settings: { navStyle: 'bar' },
    sections: [
      ['hero', { props: { layout: 'split', titleFont: 'heading', titleSize: 100, sideImage: STOCK.couple1, eyebrow: 'Vol. 01 — Düğün Sayısı', buttons: rsvpBtns }, style: { bgType: 'color', bgColor: '#f4f1ea', textColor: '#1a1a1a', overlayOpacity: 0, minHeight: 'screen', paddingY: 0, paddingX: 0, width: 'full' } }],
      ['divider', { props: { variant: 'line', lineWidth: 100 } }],
      ['couple', { props: { layout: 'stacked', photoShape: 'square', showAmpersand: true } }],
      ['countdown', { props: { variant: 'minimal' }, style: { bgType: 'color', bgColor: '#e4572e', textColor: '#ffffff' } }],
      ['story', { props: { layout: 'cards' } }],
      ['event', { props: { layout: 'list', showMap: true, showCalendar: true }, style: { bgType: 'color', bgColor: '#ebe6db' } }],
      ['schedule', { props: { layout: 'grid' } }],
      ['gallery', { props: { layout: 'grid', columns: 3, gap: 4, aspect: 'portrait', showCaptions: true }, style: { width: 'full', paddingX: 0 } }],
      ['rsvp', { props: { layout: 'plain', askGuests: true, askPhone: true, askNote: true } }],
      ['faq'],
      ['footer', { props: { layout: 'columns', monogram: 'A + M', title: 'Sonraki sayıda görüşürüz', text: 'Bir sayfa daha, bir hatıra daha.', date: '12.06.2027', hashtag: '#AyseVeMehmet', showCredit: true }, style: { bgType: 'color', bgColor: '#1a1a1a', textColor: '#f4f1ea' } }],
    ],
  },

  /* ---------------- Lavanta Rüyası ---------------- */
  {
    id: 'lavender',
    name: 'Lavanta Rüyası',
    tagline: 'Lila geçişler, bulutsu ve masalsı',
    preview: STOCK.hero4,
    swatches: ['#f5f2fb', '#8a74c9', '#3a2f5c'],
    theme: theme({
      primaryColor: '#3a2f5c', secondaryColor: '#8a74c9', accentColor: '#8a74c9',
      backgroundColor: '#f5f2fb', surfaceColor: '#ffffff', textColor: '#2e2650', mutedColor: '#756d99',
      headingFont: 'Lora', bodyFont: 'Raleway', scriptFont: 'Alex Brush',
      borderRadius: 22, buttonRadius: 999,
    }),
    settings: { navStyle: 'centered' },
    sections: [
      ['hero', { props: { layout: 'bottom', titleFont: 'script', titleSize: 118, eyebrow: 'Masalsı bir gün', showCountdown: true, buttons: rsvpBtns }, style: { bgImage: STOCK.hero4, overlayColor: '#3a2f5c', overlayOpacity: 40, divider: 'curve' } }],
      ['text', { props: { variant: 'script', title: 'Hoş geldiniz', text: 'Hayallerimizin gerçek olduğu günde yanımızda olun.' } }],
      ['couple', { props: { photoShape: 'circle', layout: 'side' } }],
      ['story', { props: { layout: 'timeline' }, style: { bgType: 'gradient', gradientFrom: '#f5f2fb', gradientTo: '#e6def7', gradientAngle: 180 } }],
      ['event', { props: { layout: 'cards', showMap: true, showCalendar: true } }],
      ['schedule', { props: { layout: 'timeline' } }],
      ['gallery', { props: { layout: 'carousel', aspect: 'portrait', showCaptions: true } }],
      ['accommodation'],
      ['rsvp', { props: { layout: 'card' }, style: { bgType: 'image', bgImage: STOCK.flowers, overlayColor: '#3a2f5c', overlayOpacity: 60, textColor: '#ffffff' } }],
      ['share'],
      ['footer', { props: { layout: 'centered', showLinks: true, monogram: 'A & M', title: 'Masalın devamında görüşmek üzere', text: 'Sevgiyle, Ayşe & Mehmet', date: '12.06.2027', showCredit: true }, style: { bgType: 'gradient', gradientFrom: '#3a2f5c', gradientTo: '#241c3f', gradientAngle: 180, textColor: '#f5f2fb' } }],
    ],
  },

  /* ---------------- Okyanus Esintisi ---------------- */
  {
    id: 'ocean',
    name: 'Okyanus Esintisi',
    tagline: 'Deniz mavisi, ferah plaj düğünü',
    preview: STOCK.hero3,
    swatches: ['#f2f7f9', '#2f7f95', '#12394a'],
    theme: theme({
      primaryColor: '#12394a', secondaryColor: '#2f7f95', accentColor: '#2f7f95',
      backgroundColor: '#f2f7f9', surfaceColor: '#ffffff', textColor: '#12394a', mutedColor: '#5d7f8c',
      headingFont: 'Playfair Display', bodyFont: 'Montserrat', scriptFont: 'Allura',
      borderRadius: 18, buttonRadius: 999,
    }),
    settings: { navStyle: 'transparent', venueName: 'Çeşme Plajı', venueAddress: 'Ilıca, Çeşme, İzmir' },
    sections: [
      ['hero', { props: { layout: 'bottom', titleFont: 'heading', titleSize: 88, eyebrow: 'Deniz kenarında', showCountdown: true, buttons: rsvpBtns }, style: { bgImage: STOCK.hero3, overlayColor: '#12394a', overlayOpacity: 38, minHeight: 'screen', divider: 'wave' } }],
      ['couple', { props: { photoShape: 'arch', layout: 'cards' } }],
      ['event', { props: { layout: 'split', showMap: true, showCalendar: true }, style: { bgType: 'color', bgColor: '#e3eff3' } }],
      ['schedule', { props: { layout: 'grid' } }],
      ['story', { props: { layout: 'zigzag' } }],
      ['gallery', { props: { layout: 'masonry', showCaptions: true }, style: { bgType: 'color', bgColor: '#e3eff3' } }],
      ['accommodation'],
      ['rsvp', { props: { layout: 'split', image: STOCK.ceremony }, style: { marginX: 24, radius: 28, bgType: 'color', bgColor: '#ffffff', shadow: 'lg' } }],
      ['faq'],
      ['footer', { props: { layout: 'split', monogram: 'A & M', title: 'Dalgaların sesiyle görüşmek üzere', text: 'Çeşme’de, gün batımında…', date: '12.06.2027', hashtag: '#AyseVeMehmet', showCredit: true }, style: { bgType: 'color', bgColor: '#12394a', textColor: '#f2f7f9' } }],
    ],
  },

  /* ---------------- Zümrüt Saray ---------------- */
  {
    id: 'emerald',
    name: 'Zümrüt Saray',
    tagline: 'Derin yeşil & altın, asil ve görkemli',
    preview: STOCK.flowers,
    swatches: ['#0e2a24', '#d9b86c', '#f3ecd9'],
    theme: theme({
      primaryColor: '#d9b86c', secondaryColor: '#d9b86c', accentColor: '#d9b86c',
      backgroundColor: '#0e2a24', surfaceColor: '#14382f', textColor: '#f3ecd9', mutedColor: '#a5b8ad',
      headingFont: 'Cormorant Garamond', bodyFont: 'Raleway', scriptFont: 'Pinyon Script',
      borderRadius: 6, buttonRadius: 6, letterSpacing: 'wide',
    }),
    settings: { navStyle: 'floating' },
    sections: [
      ['hero', { props: { layout: 'frame', contentBox: 'glass', titleFont: 'heading', titleSize: 92, eyebrow: 'Asil bir kutlama', buttons: rsvpBtns }, style: { bgImage: STOCK.flowers, overlayColor: '#0e2a24', overlayOpacity: 60, corners: 'classic', cornerColor: '#d9b86c' } }],
      ['divider', { props: { variant: 'monogram', monogram: 'A & M' } }],
      ['couple', { props: { photoShape: 'arch', layout: 'cards' } }],
      ['countdown', { props: { variant: 'circles' }, style: { bgType: 'color', bgColor: '#14382f' } }],
      ['story', { props: { layout: 'timeline' } }],
      ['event', { props: { layout: 'cards', showMap: true, showCalendar: true }, style: { bgType: 'color', bgColor: '#14382f' } }],
      ['gallery', { props: { layout: 'grid', columns: 3, aspect: 'portrait', showCaptions: true } }],
      ['dresscode', { props: { title: 'Resmi Kıyafet', colors: [{ id: 'e1', color: '#0e2a24', name: 'Zümrüt' }, { id: 'e2', color: '#d9b86c', name: 'Altın' }, { id: 'e3', color: '#f3ecd9', name: 'Krem' }] } }],
      ['rsvp', { props: { layout: 'card', askGuests: true, askPhone: true, askMenu: true }, style: { marginX: 24, radius: 8, borderWidth: 1, borderColor: '#d9b86c55', bgType: 'color', bgColor: '#14382f' } }],
      ['faq'],
      ['footer', { props: { layout: 'columns', monogram: 'A & M', title: 'Görkemli bir akşamda görüşmek üzere', text: 'Sevgiyle,\nAyşe & Mehmet', date: '12.06.2027', hashtag: '#AyseVeMehmet', showCredit: true }, style: { bgType: 'color', bgColor: '#081a16' } }],
    ],
  },

  /* ---------------- Bohem Çöl ---------------- */
  {
    id: 'boho',
    name: 'Bohem Çöl',
    tagline: 'Toprak tonları, pampas ve özgür ruh',
    preview: STOCK.decor,
    swatches: ['#f6ece0', '#b5651d', '#4a2c17'],
    theme: theme({
      primaryColor: '#4a2c17', secondaryColor: '#d9a066', accentColor: '#b5651d',
      backgroundColor: '#f6ece0', surfaceColor: '#fbf5ec', textColor: '#4a2c17', mutedColor: '#8d6a4e',
      headingFont: 'Fraunces', bodyFont: 'Jost', scriptFont: 'Allura',
      borderRadius: 30, buttonRadius: 999,
    }),
    settings: { navStyle: 'centered' },
    sections: [
      ['hero', { props: { layout: 'frame', contentBox: 'glass', titleFont: 'script', titleSize: 112, eyebrow: 'Özgür ruhlu bir düğün', buttons: rsvpBtns }, style: { bgImage: STOCK.decor, overlayColor: '#4a2c17', overlayOpacity: 38, textColor: '#ffffff', corners: 'leaf', cornerColor: '#ffffff' } }],
      ['text', { props: { variant: 'script', title: 'Gün batımında…', text: 'Çiçekler, müzik ve en sevdiklerimizle.' } }],
      ['couple', { props: { photoShape: 'arch', layout: 'side' } }],
      ['story', { props: { layout: 'cards' }, style: { bgType: 'color', bgColor: '#fbf5ec' } }],
      ['event', { props: { layout: 'cards', showMap: true, showCalendar: true } }],
      ['schedule', { props: { layout: 'timeline' } }],
      ['gallery', { props: { layout: 'collage', showCaptions: true } }],
      ['music', { props: { variant: 'vinyl' } }],
      ['rsvp', { props: { layout: 'card' }, style: { bgType: 'image', bgImage: STOCK.table, overlayColor: '#4a2c17', overlayOpacity: 55, textColor: '#ffffff' } }],
      ['gift'],
      ['footer', { props: { layout: 'columns', monogram: 'A & M', title: 'Dans pistinde görüşürüz', text: 'Sevgiyle, Ayşe & Mehmet', date: '12.06.2027', hashtag: '#AyseVeMehmet', showCredit: true }, style: { bgType: 'color', bgColor: '#4a2c17', textColor: '#f6ece0' } }],
    ],
  },
]
