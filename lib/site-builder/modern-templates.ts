import type { SiteTheme } from './schema'
import type { SiteTemplate } from './templates'
import { btn } from './definitions'
import { STOCK } from './media'

const theme: SiteTheme = {
  primaryColor: '#26352f',
  secondaryColor: '#68776d',
  accentColor: '#b77962',
  backgroundColor: '#f8f8f4',
  surfaceColor: '#edf0e9',
  textColor: '#26312c',
  mutedColor: '#6d766f',
  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
  scriptFont: 'Great Vibes',
  borderRadius: 24,
  buttonRadius: 999,
  headingScale: 1,
  letterSpacing: 'normal',
}

export const MODERN_TEMPLATES: SiteTemplate[] = [
  {
    id: 'portfolio',
    name: 'Modern Düğün',
    tagline: 'Düğününüze özel; RSVP, program, hikâye ve QR anı albümüyle tamamlanan düzenlenebilir site',
    preview: STOCK.couple1,
    swatches: ['#f8f8f4', '#b77962', '#edf0e9'],
    theme,
    settings: { navStyle: 'floating' },
    sections: [
      [
        'hero',
        {
          props: {
            layout: 'split',
            titleFont: 'heading',
            titleSize: 85,
            eyebrow: '{{eventTypeLabel}}',
            subtitle: 'Bu özel günü birlikte kutlamak için sizi aramızda görmekten mutluluk duyarız.',
            showDivider: false,
            showScrollHint: false,
            showSideRays: true,
            rayColor1: '#d3b17e',
            rayColor2: '#d9e5d8',
            rayIntensity: 0.9,
            raySpread: 1.35,
            raySpeed: 1.2,
            rayOrigin: 'top-right',
            sideImage: STOCK.couple1,
            buttons: [btn('Katılım bildir', 'rsvp', 'solid'), btn('Yol tarifi', 'map', 'outline')],
          },
          style: {
            bgType: 'color',
            bgColor: '#f8f8f4',
            textColor: '#26312c',
            paddingY: 0,
            width: 'wide',
            align: 'left',
            minHeight: 'screen',
            overlayOpacity: 0,
          },
          animation: { type: 'slide-up' },
        },
      ],
      ['couple', { props: { layout: 'side', photoShape: 'rounded' }, style: { bgType: 'color', bgColor: '#edf0e9', width: 'wide', paddingY: 56 } }],
      [
        'story',
        {
          props: {
            eyebrow: 'Yolumuz',
            title: 'Birlikte yazdığımız hikâye',
            subtitle: 'En güzel anlarımız, şimdi sizinle paylaşacağımız yeni bir başlangıca dönüşüyor.',
            layout: 'cards',
            showImages: false,
            items: [
              { id: 'story-beginning', date: '', title: 'Her şey bir gülümsemeyle başladı', text: 'Birbirimizi tanıdıkça küçük anlar, bizim için unutulmaz bir hikâyeye dönüştü.' },
              { id: 'story-today', date: '', title: 'Şimdi yeni bir başlangıç', text: 'Bu hikâyenin en güzel bölümünü sevdiklerimizle birlikte kutlamak için sabırsızlanıyoruz.' },
            ],
          },
          style: { bgType: 'color', bgColor: '#f8f8f4', width: 'wide', paddingY: 56 },
        },
      ],
      [
        'gallery',
        {
          props: {
            eyebrow: 'Birlikte biriktirdiğimiz anlar',
            title: 'Hikâyemizden kareler',
            layout: 'grid',
            columns: 4,
            gap: 16,
            aspect: 'square',
            showCaptions: true,
          },
          style: { bgType: 'color', bgColor: '#f8f8f4', width: 'wide', paddingY: 56 },
        },
      ],
      [
        'countdown',
        {
          props: { eyebrow: 'Birlikte kutlamamıza', title: 'Kalan zaman', variant: 'boxes', showSeconds: true },
          style: {
            bgType: 'color',
            bgColor: '#e8eee7',
            textColor: '#26312c',
            width: 'normal',
            paddingY: 56,
            overlayColor: '#e8eee7',
            overlayOpacity: 0,
            bgParallax: false,
          },
        },
      ],
      ['event', { props: { layout: 'cards', showMap: true, showCalendar: true }, style: { bgType: 'color', bgColor: '#f8f8f4', width: 'wide', paddingY: 56 } }],
      [
        'schedule',
        {
          props: {
            layout: 'timeline',
            items: [
              { id: 'schedule-welcome', time: '17.30', title: 'Karşılama', desc: 'Sevdiklerimizle buluşma ve hoş geldiniz.' },
              { id: 'schedule-ceremony', time: '18.30', title: 'Tören', desc: 'Bu güzel başlangıca birlikte tanıklık edelim.' },
              { id: 'schedule-dinner', time: '19.30', title: 'Akşam yemeği', desc: 'Soframızı ve mutluluğumuzu paylaşalım.' },
              { id: 'schedule-dance', time: '21.00', title: 'Kutlama', desc: 'Müzik, dans ve birlikte biriktireceğimiz anlar.' },
            ],
          },
          style: { bgType: 'color', bgColor: '#edf0e9', width: 'narrow', paddingY: 56 },
        },
      ],
      ['rsvp', { props: { layout: 'card', askGuests: true, askPhone: true, askNote: true }, style: { width: 'wide', paddingY: 56 } }],
      [
        'guestbook',
        {
          props: {
            eyebrow: 'Güzel dilekleriniz',
            title: 'Anı defterimize bir not bırakın',
            subtitle: 'Bu özel günden bize bir hatıra bırakın.',
            allowNew: true,
            layout: 'grid',
          },
          style: { bgType: 'color', bgColor: '#f8f8f4', width: 'wide', paddingY: 56 },
        },
      ],
      [
        'album',
        {
          props: {
            eyebrow: 'Kutlamamızdan kareler',
            title: 'Anılarımızı birlikte biriktirelim',
            subtitle: 'QR kodu okutarak fotoğraflarınızı ortak albümümüze ekleyin.',
          },
          style: { bgType: 'color', bgColor: '#edf0e9', width: 'wide', paddingY: 56 },
        },
      ],
      [
        'share',
        {
          props: {
            eyebrow: 'Bu güzel günü paylaşın',
            title: 'Davetiyemiz yanınızda',
            subtitle: 'Davet sayfamıza kolayca ulaşın, sevdiklerinizle paylaşın veya QR kodunu kaydedin.',
            showQr: true,
            showWhatsapp: true,
            showInstagram: true,
          },
          style: { bgType: 'color', bgColor: '#f8f8f4', width: 'normal', paddingY: 56 },
        },
      ],
      [
        'footer',
        {
          props: {
            layout: 'split',
            monogram: '{{coupleNames}}',
            title: 'Bu günü bizimle paylaşın',
            text: '',
            date: '{{eventDate}}',
            showCredit: true,
          },
          style: { bgType: 'color', bgColor: '#26352f', textColor: '#f8f8f4', paddingY: 40 },
        },
      ],
    ],
  },
]

type TemplateLook = {
  id: string
  name: string
  tagline: string
  preview: string
  palette: [string, string, string]
  theme: SiteTheme
  navStyle: NonNullable<SiteTemplate['settings']>['navStyle']
  hero: 'split' | 'center' | 'frame' | 'bottom'
  heroImage: string
  heroOverlay: number
  heroFont: 'heading' | 'script' | 'body'
  couple: 'side' | 'cards' | 'stacked'
  story: 'zigzag' | 'timeline' | 'cards'
  gallery: 'grid' | 'masonry' | 'carousel' | 'collage' | 'cards'
  event: 'cards' | 'list' | 'split'
  schedule: 'timeline' | 'grid'
  countdown: 'boxes' | 'minimal' | 'circles'
  rsvp: 'card' | 'split' | 'plain'
  flow: 'classic' | 'story-first' | 'celebration' | 'rsvp-first' | 'gallery-first'
  motion: 'fade' | 'slide-up' | 'zoom'
}

const templateLooks: TemplateLook[] = [
  {
    id: 'noir-gold', name: 'Noir & Gold', tagline: 'Siyah zemin, altın detaylar ve sinematik kapakla gece şıklığı.',
    preview: STOCK.hero2, palette: ['#171717', '#c6a15b', '#29251e'],
    theme: { ...theme, primaryColor: '#171717', secondaryColor: '#c6a15b', accentColor: '#c6a15b', backgroundColor: '#f5f1e8', surfaceColor: '#ebe4d5', textColor: '#211d17', mutedColor: '#6f685d', headingFont: 'Bodoni Moda', bodyFont: 'DM Sans', scriptFont: 'Pinyon Script', borderRadius: 8, buttonRadius: 4, letterSpacing: 'wide' },
    navStyle: 'transparent', hero: 'frame', heroImage: STOCK.hero2, heroOverlay: 52, heroFont: 'heading', couple: 'cards', story: 'timeline', gallery: 'masonry', event: 'list', schedule: 'timeline', countdown: 'minimal', rsvp: 'plain', flow: 'classic', motion: 'fade',
  },
  {
    id: 'botanical-romance', name: 'Botanical Romance', tagline: 'Yaprak tonları, kemerli portreler ve organik fotoğraf akışı.',
    preview: STOCK.flowers, palette: ['#34483b', '#a77d58', '#e8eee5'],
    theme: { ...theme, primaryColor: '#34483b', secondaryColor: '#71836e', accentColor: '#a77d58', backgroundColor: '#f7f7f0', surfaceColor: '#e8eee5', textColor: '#29382f', mutedColor: '#70796f', headingFont: 'Cormorant Garamond', bodyFont: 'Lato', scriptFont: 'Allura', borderRadius: 28, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'split', heroImage: STOCK.couple2, heroOverlay: 0, heroFont: 'script', couple: 'side', story: 'zigzag', gallery: 'masonry', event: 'cards', schedule: 'timeline', countdown: 'circles', rsvp: 'card', flow: 'story-first', motion: 'slide-up',
  },
  {
    id: 'editorial-ivory', name: 'Editorial Ivory', tagline: 'Dergi kapağı hissi, geniş boşluklar ve tipografi odaklı akış.',
    preview: STOCK.hero1, palette: ['#292722', '#aa806b', '#eee9df'],
    theme: { ...theme, primaryColor: '#292722', secondaryColor: '#817a70', accentColor: '#aa806b', backgroundColor: '#faf8f3', surfaceColor: '#eee9df', textColor: '#292722', mutedColor: '#77736d', headingFont: 'Playfair Display', bodyFont: 'Montserrat', scriptFont: 'Parisienne', borderRadius: 2, buttonRadius: 2, headingScale: 1.08, letterSpacing: 'wide' },
    navStyle: 'centered', hero: 'split', heroImage: STOCK.hero1, heroOverlay: 0, heroFont: 'heading', couple: 'stacked', story: 'cards', gallery: 'grid', event: 'list', schedule: 'grid', countdown: 'minimal', rsvp: 'split', flow: 'story-first', motion: 'fade',
  },
  {
    id: 'terracotta-sunset', name: 'Terracotta Sunset', tagline: 'Gün batımı fotoğrafları, sıcak kil tonları ve rahat kartlar.',
    preview: STOCK.hero3, palette: ['#713f32', '#c4775b', '#f1ded0'],
    theme: { ...theme, primaryColor: '#713f32', secondaryColor: '#a85f49', accentColor: '#c4775b', backgroundColor: '#fbf4ed', surfaceColor: '#f1ded0', textColor: '#482c24', mutedColor: '#81675e', headingFont: 'Lora', bodyFont: 'Jost', scriptFont: 'Dancing Script', borderRadius: 22, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'center', heroImage: STOCK.hero3, heroOverlay: 38, heroFont: 'script', couple: 'cards', story: 'zigzag', gallery: 'collage', event: 'cards', schedule: 'grid', countdown: 'boxes', rsvp: 'card', flow: 'celebration', motion: 'zoom',
  },
  {
    id: 'ege-esintisi', name: 'Ege Esintisi', tagline: 'Deniz mavisi, ferah tam ekran kapak ve yatay etkinlik listesi.',
    preview: STOCK.venue, palette: ['#244b58', '#4e8790', '#e2f0ef'],
    theme: { ...theme, primaryColor: '#244b58', secondaryColor: '#5b8d91', accentColor: '#c18d62', backgroundColor: '#f5faf9', surfaceColor: '#e2f0ef', textColor: '#213c43', mutedColor: '#668087', headingFont: 'Cormorant Garamond', bodyFont: 'DM Sans', scriptFont: 'Sacramento', borderRadius: 18, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'transparent', hero: 'bottom', heroImage: STOCK.venue, heroOverlay: 34, heroFont: 'heading', couple: 'side', story: 'timeline', gallery: 'carousel', event: 'list', schedule: 'grid', countdown: 'minimal', rsvp: 'split', flow: 'celebration', motion: 'slide-up',
  },
  {
    id: 'lavanta-ruyasi', name: 'Lavanta Rüyası', tagline: 'Yumuşak leylak paleti, dairesel sayaç ve romantik kolaj.',
    preview: STOCK.bouquet, palette: ['#51425f', '#9880a8', '#eee7f1'],
    theme: { ...theme, primaryColor: '#51425f', secondaryColor: '#8e789f', accentColor: '#ad8290', backgroundColor: '#faf7fb', surfaceColor: '#eee7f1', textColor: '#382f40', mutedColor: '#766c7c', headingFont: 'Cormorant', bodyFont: 'Nunito Sans', scriptFont: 'Alex Brush', borderRadius: 26, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'center', heroImage: STOCK.bouquet, heroOverlay: 42, heroFont: 'script', couple: 'stacked', story: 'cards', gallery: 'collage', event: 'cards', schedule: 'timeline', countdown: 'circles', rsvp: 'card', flow: 'gallery-first', motion: 'fade',
  },
  {
    id: 'garden-party', name: 'Garden Party', tagline: 'Çiçekli bahçe havası, canlı kolaj galerisi ve kutlama odaklı akış.',
    preview: STOCK.ceremony, palette: ['#43543a', '#c18472', '#edf0df'],
    theme: { ...theme, primaryColor: '#43543a', secondaryColor: '#87936d', accentColor: '#c18472', backgroundColor: '#fbfaf2', surfaceColor: '#edf0df', textColor: '#34402d', mutedColor: '#727865', headingFont: 'Lora', bodyFont: 'Lato', scriptFont: 'Satisfy', borderRadius: 30, buttonRadius: 18, letterSpacing: 'normal' },
    navStyle: 'centered', hero: 'frame', heroImage: STOCK.ceremony, heroOverlay: 36, heroFont: 'script', couple: 'cards', story: 'zigzag', gallery: 'collage', event: 'split', schedule: 'grid', countdown: 'boxes', rsvp: 'split', flow: 'celebration', motion: 'zoom',
  },
  {
    id: 'modern-minimal', name: 'Modern Minimal', tagline: 'Siyah-beyaz kontrast, sade başlıklar ve içerik öncelikli düzen.',
    preview: STOCK.hero4, palette: ['#252525', '#8c8c86', '#eeede8'],
    theme: { ...theme, primaryColor: '#252525', secondaryColor: '#686a65', accentColor: '#a98768', backgroundColor: '#fafaf8', surfaceColor: '#eeede8', textColor: '#20211f', mutedColor: '#6c6d68', headingFont: 'DM Serif Display', bodyFont: 'Inter', scriptFont: 'Tangerine', borderRadius: 4, buttonRadius: 2, headingScale: 1.04, letterSpacing: 'wide' },
    navStyle: 'bar', hero: 'split', heroImage: STOCK.hero4, heroOverlay: 0, heroFont: 'heading', couple: 'side', story: 'timeline', gallery: 'grid', event: 'list', schedule: 'timeline', countdown: 'minimal', rsvp: 'plain', flow: 'rsvp-first', motion: 'fade',
  },
  {
    id: 'film-noir', name: 'Film Noir', tagline: 'Siyah-beyaz film karesi estetiği ve dramatik, görsel ağırlıklı bölümler.',
    preview: STOCK.couple3, palette: ['#202020', '#b1a895', '#e8e5df'],
    theme: { ...theme, primaryColor: '#202020', secondaryColor: '#77736b', accentColor: '#b1a895', backgroundColor: '#f7f6f3', surfaceColor: '#e8e5df', textColor: '#242321', mutedColor: '#716e68', headingFont: 'Bodoni Moda', bodyFont: 'Montserrat', scriptFont: 'Italianno', borderRadius: 0, buttonRadius: 0, headingScale: 1.12, letterSpacing: 'wide' },
    navStyle: 'transparent', hero: 'bottom', heroImage: STOCK.couple3, heroOverlay: 58, heroFont: 'heading', couple: 'stacked', story: 'zigzag', gallery: 'masonry', event: 'split', schedule: 'timeline', countdown: 'minimal', rsvp: 'split', flow: 'gallery-first', motion: 'fade',
  },
  {
    id: 'bordo-klasik', name: 'Bordo Klasik', tagline: 'Bordo ve şampanya tonlarıyla klasik davetiye ve zaman tüneli yaklaşımı.',
    preview: STOCK.rings, palette: ['#542c37', '#b58b67', '#eee3df'],
    theme: { ...theme, primaryColor: '#542c37', secondaryColor: '#8e5962', accentColor: '#b58b67', backgroundColor: '#faf5f1', surfaceColor: '#eee3df', textColor: '#442b32', mutedColor: '#78656a', headingFont: 'Libre Baskerville', bodyFont: 'Lato', scriptFont: 'Great Vibes', borderRadius: 14, buttonRadius: 6, letterSpacing: 'normal' },
    navStyle: 'centered', hero: 'frame', heroImage: STOCK.rings, heroOverlay: 44, heroFont: 'script', couple: 'side', story: 'timeline', gallery: 'cards', event: 'cards', schedule: 'timeline', countdown: 'boxes', rsvp: 'card', flow: 'classic', motion: 'slide-up',
  },
  {
    id: 'akdeniz-zeytin', name: 'Akdeniz Zeytin', tagline: 'Zeytin yeşili ve kireç taşı dokusuyla sakin, doğal bir davet.',
    preview: STOCK.table, palette: ['#4b5239', '#9b825b', '#e9e6d8'],
    theme: { ...theme, primaryColor: '#4b5239', secondaryColor: '#788064', accentColor: '#a57c55', backgroundColor: '#f8f6ed', surfaceColor: '#e9e6d8', textColor: '#373d2d', mutedColor: '#737568', headingFont: 'EB Garamond', bodyFont: 'Jost', scriptFont: 'Marck Script', borderRadius: 16, buttonRadius: 10, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'split', heroImage: STOCK.table, heroOverlay: 0, heroFont: 'heading', couple: 'cards', story: 'cards', gallery: 'masonry', event: 'list', schedule: 'grid', countdown: 'circles', rsvp: 'card', flow: 'story-first', motion: 'slide-up',
  },
  {
    id: 'art-deco', name: 'Art Deco', tagline: 'Geometrik çerçeveler, yüksek kontrast ve ritimli program kartları.',
    preview: STOCK.decor, palette: ['#183d3a', '#c49a53', '#e9e2d1'],
    theme: { ...theme, primaryColor: '#183d3a', secondaryColor: '#54746b', accentColor: '#c49a53', backgroundColor: '#f8f5eb', surfaceColor: '#e9e2d1', textColor: '#203632', mutedColor: '#68716a', headingFont: 'Cinzel', bodyFont: 'Raleway', scriptFont: 'Ballet', borderRadius: 3, buttonRadius: 2, headingScale: 1.06, letterSpacing: 'wide' },
    navStyle: 'bar', hero: 'frame', heroImage: STOCK.decor, heroOverlay: 48, heroFont: 'heading', couple: 'side', story: 'cards', gallery: 'grid', event: 'cards', schedule: 'grid', countdown: 'boxes', rsvp: 'plain', flow: 'celebration', motion: 'fade',
  },
  {
    id: 'boho-earth', name: 'Boho Earth', tagline: 'Toprak renkleri, serbest kolaj ve hikâye anlatımı merkezli tasarım.',
    preview: STOCK.couple2, palette: ['#5b4637', '#a57958', '#eee2d2'],
    theme: { ...theme, primaryColor: '#5b4637', secondaryColor: '#8b7159', accentColor: '#b47e5d', backgroundColor: '#faf5ed', surfaceColor: '#eee2d2', textColor: '#46382e', mutedColor: '#7a6d60', headingFont: 'Cormorant Garamond', bodyFont: 'DM Sans', scriptFont: 'Dancing Script', borderRadius: 32, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'center', heroImage: STOCK.couple2, heroOverlay: 36, heroFont: 'script', couple: 'stacked', story: 'zigzag', gallery: 'collage', event: 'split', schedule: 'timeline', countdown: 'circles', rsvp: 'split', flow: 'story-first', motion: 'zoom',
  },
  {
    id: 'gece-yildizi', name: 'Gece Yıldızı', tagline: 'Gece mavisi, ışıklı sinematik kapak ve gece kutlaması hissi.',
    preview: STOCK.hero5, palette: ['#202b46', '#b69a72', '#e7e8ed'],
    theme: { ...theme, primaryColor: '#202b46', secondaryColor: '#53617f', accentColor: '#c4a873', backgroundColor: '#f5f6fa', surfaceColor: '#e7e8ed', textColor: '#252d40', mutedColor: '#6c7384', headingFont: 'Cormorant', bodyFont: 'DM Sans', scriptFont: 'Parisienne', borderRadius: 20, buttonRadius: 999, letterSpacing: 'wide' },
    navStyle: 'transparent', hero: 'center', heroImage: STOCK.hero5, heroOverlay: 58, heroFont: 'script', couple: 'side', story: 'timeline', gallery: 'carousel', event: 'cards', schedule: 'grid', countdown: 'boxes', rsvp: 'card', flow: 'celebration', motion: 'fade',
  },
  {
    id: 'provence', name: 'Provence', tagline: 'Fransız kır düğünü etkisi, yumuşak lavanta ve zarif liste düzeni.',
    preview: STOCK.flowers, palette: ['#555348', '#9b8d72', '#ebe8da'],
    theme: { ...theme, primaryColor: '#555348', secondaryColor: '#88816d', accentColor: '#a68a72', backgroundColor: '#f8f6ee', surfaceColor: '#ebe8da', textColor: '#454438', mutedColor: '#767467', headingFont: 'Lora', bodyFont: 'Montserrat', scriptFont: 'Alex Brush', borderRadius: 12, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'centered', hero: 'split', heroImage: STOCK.flowers, heroOverlay: 0, heroFont: 'script', couple: 'side', story: 'cards', gallery: 'masonry', event: 'list', schedule: 'timeline', countdown: 'minimal', rsvp: 'card', flow: 'story-first', motion: 'slide-up',
  },
  {
    id: 'inci-luks', name: 'İnci Lüks', tagline: 'İnci beyazı, zarif serif yazılar ve temiz, dengeli simetri.',
    preview: STOCK.bride2, palette: ['#423c3a', '#b69a83', '#eee9e2'],
    theme: { ...theme, primaryColor: '#423c3a', secondaryColor: '#8d8278', accentColor: '#b69a83', backgroundColor: '#fcfaf7', surfaceColor: '#eee9e2', textColor: '#3e3936', mutedColor: '#78716b', headingFont: 'Italiana', bodyFont: 'Inter', scriptFont: 'Tangerine', borderRadius: 18, buttonRadius: 999, letterSpacing: 'wide' },
    navStyle: 'centered', hero: 'frame', heroImage: STOCK.bride2, heroOverlay: 32, heroFont: 'heading', couple: 'stacked', story: 'timeline', gallery: 'grid', event: 'cards', schedule: 'timeline', countdown: 'circles', rsvp: 'plain', flow: 'classic', motion: 'fade',
  },
  {
    id: 'kir-cicegi', name: 'Kır Çiçeği', tagline: 'Açık renkli doğa fotoğrafları, samimi hikâye kartları ve kolaj.',
    preview: STOCK.bouquet, palette: ['#4b5b45', '#c4867b', '#edf0e6'],
    theme: { ...theme, primaryColor: '#4b5b45', secondaryColor: '#78876b', accentColor: '#c4867b', backgroundColor: '#fafbf5', surfaceColor: '#edf0e6', textColor: '#354435', mutedColor: '#747c70', headingFont: 'EB Garamond', bodyFont: 'Nunito Sans', scriptFont: 'Satisfy', borderRadius: 24, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'bottom', heroImage: STOCK.bouquet, heroOverlay: 34, heroFont: 'script', couple: 'cards', story: 'zigzag', gallery: 'collage', event: 'split', schedule: 'grid', countdown: 'boxes', rsvp: 'card', flow: 'gallery-first', motion: 'slide-up',
  },
  {
    id: 'sehir-sikligi', name: 'Şehir Şıklığı', tagline: 'Modern şehir düğünleri için net çizgiler ve dengeli tipografi.',
    preview: STOCK.venue, palette: ['#34404a', '#9e7e69', '#e6e9e9'],
    theme: { ...theme, primaryColor: '#34404a', secondaryColor: '#697985', accentColor: '#ad8067', backgroundColor: '#f8f9f8', surfaceColor: '#e6e9e9', textColor: '#2f383e', mutedColor: '#737a7d', headingFont: 'DM Serif Display', bodyFont: 'Montserrat', scriptFont: 'Allura', borderRadius: 10, buttonRadius: 6, letterSpacing: 'wide' },
    navStyle: 'bar', hero: 'split', heroImage: STOCK.venue, heroOverlay: 0, heroFont: 'heading', couple: 'side', story: 'cards', gallery: 'grid', event: 'list', schedule: 'grid', countdown: 'minimal', rsvp: 'split', flow: 'rsvp-first', motion: 'fade',
  },
  {
    id: 'sage-atelier', name: 'Sage Atelier', tagline: 'Adaçayı paleti, sakin ritim ve günün hikâyesini öne çıkaran kurgu.',
    preview: STOCK.couple1, palette: ['#35463d', '#8b9a83', '#e7ece4'],
    theme: { ...theme, primaryColor: '#35463d', secondaryColor: '#71816f', accentColor: '#b77962', backgroundColor: '#f8f8f4', surfaceColor: '#e7ece4', textColor: '#293830', mutedColor: '#6c776f', headingFont: 'Playfair Display', bodyFont: 'Inter', scriptFont: 'Great Vibes', borderRadius: 24, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'floating', hero: 'split', heroImage: STOCK.couple1, heroOverlay: 0, heroFont: 'heading', couple: 'side', story: 'cards', gallery: 'grid', event: 'cards', schedule: 'timeline', countdown: 'boxes', rsvp: 'card', flow: 'rsvp-first', motion: 'slide-up',
  },
  {
    id: 'kiraz-cicegi', name: 'Kiraz Çiçeği', tagline: 'Pudra pembe, yumuşak geçişler ve zarif dikey hikâye anlatımı.',
    preview: STOCK.bride, palette: ['#58434a', '#bd8790', '#f2e6e8'],
    theme: { ...theme, primaryColor: '#58434a', secondaryColor: '#92727a', accentColor: '#bd8790', backgroundColor: '#fcf8f8', surfaceColor: '#f2e6e8', textColor: '#45383c', mutedColor: '#7a6c70', headingFont: 'Cormorant Garamond', bodyFont: 'Lato', scriptFont: 'Ballet', borderRadius: 28, buttonRadius: 999, letterSpacing: 'normal' },
    navStyle: 'centered', hero: 'center', heroImage: STOCK.bride, heroOverlay: 38, heroFont: 'script', couple: 'stacked', story: 'timeline', gallery: 'carousel', event: 'cards', schedule: 'timeline', countdown: 'circles', rsvp: 'card', flow: 'story-first', motion: 'fade',
  },
]

const sectionFlows: Record<TemplateLook['flow'], string[]> = {
  classic: ['hero', 'couple', 'story', 'gallery', 'countdown', 'event', 'schedule', 'rsvp', 'guestbook', 'album', 'share', 'footer'],
  'story-first': ['hero', 'story', 'couple', 'gallery', 'event', 'schedule', 'countdown', 'rsvp', 'guestbook', 'album', 'share', 'footer'],
  celebration: ['hero', 'countdown', 'event', 'schedule', 'couple', 'gallery', 'story', 'rsvp', 'album', 'guestbook', 'share', 'footer'],
  'rsvp-first': ['hero', 'couple', 'event', 'rsvp', 'story', 'gallery', 'countdown', 'schedule', 'guestbook', 'album', 'share', 'footer'],
  'gallery-first': ['hero', 'gallery', 'couple', 'story', 'countdown', 'event', 'schedule', 'rsvp', 'album', 'guestbook', 'share', 'footer'],
}

const sectionBackgrounds: Record<string, 'backgroundColor' | 'surfaceColor' | 'primaryColor'> = {
  couple: 'surfaceColor',
  story: 'backgroundColor',
  gallery: 'backgroundColor',
  countdown: 'surfaceColor',
  event: 'backgroundColor',
  schedule: 'surfaceColor',
  rsvp: 'backgroundColor',
  guestbook: 'backgroundColor',
  album: 'surfaceColor',
  share: 'backgroundColor',
  footer: 'primaryColor',
}

function createTemplate(look: TemplateLook): SiteTemplate {
  const baseSections = new Map(MODERN_TEMPLATES[0].sections.map(([type, overrides]) => [type, overrides]))
  const layoutByType: Record<string, string> = {
    hero: look.hero,
    couple: look.couple,
    story: look.story,
    gallery: look.gallery,
    event: look.event,
    schedule: look.schedule,
    countdown: look.countdown,
    rsvp: look.rsvp,
  }
  const sections = sectionFlows[look.flow].map((type, order) => {
    const base = baseSections.get(type)
    if (!base) throw new Error(`Missing base section for template type "${type}"`)
    const background = sectionBackgrounds[type]
    const props = {
      ...base.props,
      ...(layoutByType[type] ? { layout: layoutByType[type] } : {}),
      ...(type === 'hero' ? {
        titleFont: look.heroFont,
        showSideRays: false,
        sideImage: look.heroImage,
        rayColor1: look.theme.accentColor,
        rayColor2: look.theme.surfaceColor,
      } : {}),
      ...(type === 'couple' ? { photoShape: look.theme.borderRadius < 10 ? 'square' : look.id === 'botanical-romance' ? 'arch' : 'rounded' } : {}),
      ...(type === 'gallery' ? {
        columns: look.gallery === 'grid' || look.gallery === 'cards' ? 4 : 3,
        aspect: look.id === 'ege-esintisi' || look.id === 'kiraz-cicegi' ? 'portrait' : 'square',
      } : {}),
      ...(type === 'countdown' ? { showSeconds: look.countdown !== 'minimal' } : {}),
    }
    const style = {
      ...base.style,
      bgType: type === 'hero' && look.hero !== 'split' ? 'image' : 'color',
      ...(background ? { bgColor: look.theme[background] } : {}),
      ...(type === 'hero' ? {
        bgImage: look.heroImage,
        bgColor: look.theme.backgroundColor,
        overlayColor: '#111111',
        overlayOpacity: look.hero === 'split' ? 0 : look.heroOverlay,
        textColor: look.hero === 'split' ? look.theme.textColor : '#ffffff',
        minHeight: 'screen',
        paddingY: 0,
        width: 'wide',
        align: look.hero === 'split' ? 'left' : 'center',
      } : {
        paddingY: type === 'footer' ? 40 : 56,
        width: ['couple', 'gallery', 'event', 'album'].includes(type) ? 'wide' : type === 'schedule' ? 'narrow' : 'normal',
        textColor: type === 'footer' ? '#ffffff' : look.theme.textColor,
      }),
    }
    return [type, { ...base, props, style, ...(type === 'footer' ? {} : { animation: { type: look.motion, duration: 0.8, stagger: true } }) }] as SiteTemplate['sections'][number]
  })

  return {
    id: look.id,
    name: look.name,
    tagline: look.tagline,
    preview: look.preview,
    swatches: look.palette,
    theme: look.theme,
    settings: { navStyle: look.navStyle },
    sections,
  }
}

MODERN_TEMPLATES.push(...templateLooks.map(createTemplate))
