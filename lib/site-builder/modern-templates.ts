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
