import {
  LayoutTemplate, Heart, Clock, Image as ImageIcon, MapPin, CalendarHeart, Send, Music, MessageSquare,
  Gift, Hotel, Shirt, BookHeart, Type, Minus, PanelBottom, ListOrdered, Images, Share2, type LucideIcon,
} from 'lucide-react'
import type { ButtonConfig, FieldDef, SectionAnimation, SectionStyle } from './schema'
import { GALLERY_DEFAULT, STOCK } from './media'

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

export const btn = (label: string, action: ButtonConfig['action'], variant: ButtonConfig['variant'] = 'solid', target = ''): ButtonConfig => ({
  id: uid('btn'),
  label,
  action,
  variant,
  target,
})

export type SectionCategory = 'Giriş' | 'İçerik' | 'Etkinlik' | 'Etkileşim' | 'Bilgi' | 'Düzen'

export interface SectionDefinition {
  type: string
  name: string
  description: string
  icon: LucideIcon
  category: SectionCategory
  defaults: {
    props: Record<string, any>
    style: SectionStyle
    animation?: SectionAnimation
  }
  fields: FieldDef[]
}

/* ---------------- shared field factories ---------------- */

const headingFields = (opts: { subtitle?: boolean } = {}): FieldDef[] => [
  { key: 'eyebrow', label: 'Üst etiket', type: 'text', group: 'Başlık', placeholder: 'ör. Bizim Hikayemiz' },
  { key: 'title', label: 'Başlık', type: 'text', group: 'Başlık' },
  ...(opts.subtitle !== false
    ? ([{ key: 'subtitle', label: 'Açıklama', type: 'textarea', group: 'Başlık' }] as FieldDef[])
    : []),
]

const buttonsField = (label = 'Butonlar'): FieldDef => ({ key: 'buttons', label, type: 'buttons', group: 'Butonlar' })

const layoutField = (options: { value: string; label: string }[]): FieldDef => ({
  key: 'layout',
  label: 'Yerleşim',
  type: 'segmented',
  group: 'Düzen',
  options,
})

const baseStyle: SectionStyle = {
  bgType: 'theme',
  paddingY: 96,
  paddingX: 24,
  width: 'normal',
  align: 'center',
  minHeight: 'auto',
  radius: 0,
  marginX: 0,
  marginY: 0,
  overlayOpacity: 0,
  overlayColor: '#000000',
  shadow: 'none',
  corners: 'none',
  divider: 'none',
}

const baseAnim: SectionAnimation = { type: 'slide-up', duration: 0.8, delay: 0, stagger: true }

/* ---------------- definitions ---------------- */

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  /* ============ HERO ============ */
  {
    type: 'hero',
    name: 'Kapak',
    description: 'Tam ekran karşılama, görsel & butonlar',
    icon: LayoutTemplate,
    category: 'Giriş',
    defaults: {
      props: {
        eyebrow: 'Evleniyoruz',
        title: 'Ayşe & Mehmet',
        date: '12 Haziran 2027 · İstanbul',
        subtitle: 'Hayatımızın en özel gününde sizleri de aramızda görmekten mutluluk duyarız.',
        layout: 'center',
        titleFont: 'script',
        titleSize: 100,
        sideImage: STOCK.couple1,
        contentBox: 'none',
        showDivider: true,
        showScrollHint: true,
        showCountdown: false,
        buttons: [btn('Katılımını Bildir', 'rsvp', 'solid'), btn('Takvime Ekle', 'calendar', 'outline')],
      },
      style: {
        ...baseStyle,
        bgType: 'image',
        bgImage: STOCK.hero1,
        bgPosition: 'center',
        bgZoom: true,
        overlayColor: '#000000',
        overlayOpacity: 40,
        textColor: '#ffffff',
        minHeight: 'screen',
        corners: 'none',
      },
      animation: { type: 'fade', duration: 1.2, delay: 0.1, stagger: true },
    },
    fields: [
      { key: 'eyebrow', label: 'Üst etiket', type: 'text', group: 'İçerik' },
      { key: 'title', label: 'İsimler / Başlık', type: 'text', group: 'İçerik' },
      { key: 'date', label: 'Tarih satırı', type: 'text', group: 'İçerik' },
      { key: 'subtitle', label: 'Davet metni', type: 'textarea', group: 'İçerik' },
      layoutField([
        { value: 'center', label: 'Ortalı' },
        { value: 'split', label: 'Bölünmüş' },
        { value: 'frame', label: 'Çerçeve' },
        { value: 'bottom', label: 'Alt' },
      ]),
      { key: 'sideImage', label: 'Yan görsel', type: 'image', group: 'Düzen', showIf: (p) => p.layout === 'split' },
      {
        key: 'contentBox', label: 'İçerik kutusu', type: 'segmented', group: 'Düzen',
        options: [{ value: 'none', label: 'Yok' }, { value: 'glass', label: 'Cam' }, { value: 'solid', label: 'Dolu' }],
      },
      {
        key: 'titleFont', label: 'Başlık fontu', type: 'segmented', group: 'Tipografi',
        options: [{ value: 'heading', label: 'Başlık' }, { value: 'script', label: 'El yazısı' }, { value: 'body', label: 'Sade' }],
      },
      { key: 'titleSize', label: 'Başlık boyutu', type: 'slider', min: 60, max: 160, step: 5, unit: '%', group: 'Tipografi' },
      { key: 'showDivider', label: 'Süs çizgisi', type: 'toggle', group: 'Ekstralar' },
      { key: 'showCountdown', label: 'Mini geri sayım', type: 'toggle', group: 'Ekstralar' },
      { key: 'showScrollHint', label: 'Aşağı kaydır ikonu', type: 'toggle', group: 'Ekstralar' },
      buttonsField(),
    ],
  },

  /* ============ COUPLE ============ */
  {
    type: 'couple',
    name: 'Çift',
    description: 'Gelin & damat tanıtımı',
    icon: Heart,
    category: 'İçerik',
    defaults: {
      props: {
        eyebrow: 'Biz',
        title: 'Gelin & Damat',
        subtitle: 'İki kalp, tek bir hikaye.',
        layout: 'side',
        photoShape: 'arch',
        showAmpersand: true,
        brideName: 'Ayşe Yılmaz',
        brideRole: 'Gelin',
        brideBio: 'Kahve, kitaplar ve uzun yürüyüşlerin tutkunu. Mimar.',
        brideParents: 'Fatma & Ali Yılmaz’ın kızı',
        bridePhoto: STOCK.bride,
        brideInstagram: '',
        groomName: 'Mehmet Demir',
        groomRole: 'Damat',
        groomBio: 'Müzik, deniz ve iyi yemeğe düşkün. Yazılım mühendisi.',
        groomParents: 'Zeynep & Hasan Demir’in oğlu',
        groomPhoto: STOCK.groom,
        groomInstagram: '',
      },
      style: { ...baseStyle },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      { key: 'brideName', label: 'İsim', type: 'text', group: 'Gelin' },
      { key: 'brideRole', label: 'Unvan', type: 'text', group: 'Gelin' },
      { key: 'bridePhoto', label: 'Fotoğraf', type: 'image', group: 'Gelin' },
      { key: 'brideParents', label: 'Aile', type: 'text', group: 'Gelin' },
      { key: 'brideBio', label: 'Kısa bio', type: 'textarea', group: 'Gelin' },
      { key: 'brideInstagram', label: 'Instagram', type: 'text', group: 'Gelin', placeholder: '@kullanici' },
      { key: 'groomName', label: 'İsim', type: 'text', group: 'Damat' },
      { key: 'groomRole', label: 'Unvan', type: 'text', group: 'Damat' },
      { key: 'groomPhoto', label: 'Fotoğraf', type: 'image', group: 'Damat' },
      { key: 'groomParents', label: 'Aile', type: 'text', group: 'Damat' },
      { key: 'groomBio', label: 'Kısa bio', type: 'textarea', group: 'Damat' },
      { key: 'groomInstagram', label: 'Instagram', type: 'text', group: 'Damat', placeholder: '@kullanici' },
      layoutField([
        { value: 'side', label: 'Yan yana' },
        { value: 'cards', label: 'Kartlar' },
        { value: 'stacked', label: 'Alt alta' },
      ]),
      {
        key: 'photoShape', label: 'Foto şekli', type: 'segmented', group: 'Düzen',
        options: [
          { value: 'circle', label: 'Daire' },
          { value: 'arch', label: 'Kemer' },
          { value: 'rounded', label: 'Yuvarlak' },
          { value: 'square', label: 'Kare' },
        ],
      },
      { key: 'showAmpersand', label: '& işareti göster', type: 'toggle', group: 'Düzen' },
    ],
  },

  /* ============ STORY ============ */
  {
    type: 'story',
    name: 'Hikayemiz',
    description: 'Zaman tüneli',
    icon: Clock,
    category: 'İçerik',
    defaults: {
      props: {
        eyebrow: 'Bizim Hikayemiz',
        title: 'Nasıl Başladı?',
        subtitle: 'Küçük anlardan büyük bir aşka uzanan yolculuk.',
        layout: 'zigzag',
        showImages: true,
        items: [
          { id: uid('it'), date: 'Eylül 2019', title: 'İlk Tanışma', text: 'Bir arkadaş doğum gününde, aynı şarkıya eşlik ederken tanıştık.', image: STOCK.couple2 },
          { id: uid('it'), date: 'Mart 2021', title: 'İlk Seyahat', text: 'Kapadokya’da balonların arasında gün doğumunu izledik.', image: STOCK.hero3 },
          { id: uid('it'), date: 'Aralık 2024', title: 'Evlilik Teklifi', text: 'Galata’da, ilk buluştuğumuz yerde “evet” dedi.', image: STOCK.rings },
        ],
      },
      style: { ...baseStyle },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'items', label: 'Anılar', type: 'list', group: 'Anılar', itemLabelKey: 'title',
        newItem: () => ({ id: uid('it'), date: '2025', title: 'Yeni anı', text: 'Bu anıyı anlatın…', image: '' }),
        itemFields: [
          { key: 'date', label: 'Tarih', type: 'text' },
          { key: 'title', label: 'Başlık', type: 'text' },
          { key: 'text', label: 'Metin', type: 'textarea' },
          { key: 'image', label: 'Görsel', type: 'image' },
        ],
      },
      layoutField([
        { value: 'zigzag', label: 'Zigzag' },
        { value: 'timeline', label: 'Dikey' },
        { value: 'cards', label: 'Kartlar' },
      ]),
      { key: 'showImages', label: 'Görselleri göster', type: 'toggle', group: 'Düzen' },
    ],
  },

  /* ============ GALLERY ============ */
  {
    type: 'gallery',
    name: 'Galeri',
    description: 'Grid, masonry, carousel',
    icon: ImageIcon,
    category: 'İçerik',
    defaults: {
      props: {
        eyebrow: 'Anılarımız',
        title: 'Galeri',
        subtitle: '',
        layout: 'masonry',
        columns: 3,
        gap: 12,
        aspect: 'portrait',
        lightbox: true,
        hoverZoom: true,
        showCaptions: false,
        images: GALLERY_DEFAULT.map((src) => ({ id: uid('img'), src, caption: '' })),
      },
      style: { ...baseStyle, width: 'wide' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'images', label: 'Fotoğraflar', type: 'list', group: 'Fotoğraflar', itemLabelKey: 'caption',
        newItem: () => ({ id: uid('img'), src: STOCK.flowers, caption: '' }),
        itemFields: [
          { key: 'src', label: 'Görsel', type: 'image' },
          { key: 'caption', label: 'Açıklama', type: 'text' },
        ],
      },
      layoutField([
        { value: 'grid', label: 'Grid' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'carousel', label: 'Kaydırma' },
        { value: 'collage', label: 'Kolaj' },
      ]),
      { key: 'columns', label: 'Sütun', type: 'slider', min: 2, max: 5, step: 1, group: 'Düzen', showIf: (p) => p.layout !== 'carousel' && p.layout !== 'collage' },
      { key: 'gap', label: 'Boşluk', type: 'slider', min: 0, max: 32, step: 2, unit: 'px', group: 'Düzen' },
      {
        key: 'aspect', label: 'Oran', type: 'segmented', group: 'Düzen', showIf: (p) => p.layout === 'grid' || p.layout === 'carousel',
        options: [{ value: 'square', label: '1:1' }, { value: 'portrait', label: '3:4' }, { value: 'landscape', label: '4:3' }],
      },
      { key: 'lightbox', label: 'Tıklayınca büyüt', type: 'toggle', group: 'Etkileşim' },
      { key: 'hoverZoom', label: 'Hover zoom', type: 'toggle', group: 'Etkileşim' },
      { key: 'showCaptions', label: 'Açıklamaları göster', type: 'toggle', group: 'Etkileşim' },
    ],
  },

  /* ============ EVENT ============ */
  {
    type: 'event',
    name: 'Etkinlik',
    description: 'Nikah, kına, düğün + harita',
    icon: MapPin,
    category: 'Etkinlik',
    defaults: {
      props: {
        eyebrow: 'Ne Zaman & Nerede',
        title: 'Etkinlikler',
        subtitle: 'Bu mutlu günde bizimle olun.',
        layout: 'cards',
        showMap: true,
        showDirections: true,
        showCalendar: true,
        events: [
          { id: uid('ev'), name: 'Nikah Töreni', date: '2027-06-12T17:00', time: '17:00', venue: 'Feriye Sarayı', address: 'Çırağan Cd. No:40, Beşiktaş, İstanbul', note: 'Tören bahçede gerçekleşecektir.', image: STOCK.ceremony },
          { id: uid('ev'), name: 'Düğün Yemeği', date: '2027-06-12T19:30', time: '19:30', venue: 'Feriye Sarayı', address: 'Çırağan Cd. No:40, Beşiktaş, İstanbul', note: 'Kokteyl ile başlayacaktır.', image: STOCK.table },
        ],
      },
      style: { ...baseStyle, width: 'wide' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'events', label: 'Etkinlikler', type: 'list', group: 'Etkinlikler', itemLabelKey: 'name',
        newItem: () => ({ id: uid('ev'), name: 'Yeni Etkinlik', date: '', time: '20:00', venue: 'Mekan adı', address: '', note: '', image: '', link: '' }),
        itemFields: [
          { key: 'name', label: 'Etkinlik adı', type: 'text' },
          { key: 'date', label: 'Tarih & saat', type: 'datetime' },
          { key: 'time', label: 'Saat metni', type: 'text' },
          { key: 'venue', label: 'Mekan', type: 'text' },
          { key: 'address', label: 'Adres', type: 'textarea' },
          { key: 'note', label: 'Not', type: 'text' },
          { key: 'image', label: 'Görsel', type: 'image' },
          { key: 'link', label: 'Ek bağlantı', type: 'url', placeholder: 'https://…' },
        ],
      },
      layoutField([
        { value: 'cards', label: 'Kartlar' },
        { value: 'list', label: 'Liste' },
        { value: 'split', label: 'Görselli' },
      ]),
      { key: 'showMap', label: 'Harita göster', type: 'toggle', group: 'Düzen' },
      { key: 'showDirections', label: '“Yol tarifi” butonu', type: 'toggle', group: 'Düzen' },
      { key: 'showCalendar', label: '“Takvime ekle” butonu', type: 'toggle', group: 'Düzen' },
    ],
  },

  /* ============ SCHEDULE ============ */
  {
    type: 'schedule',
    name: 'Program',
    description: 'Saat saat gün akışı',
    icon: ListOrdered,
    category: 'Etkinlik',
    defaults: {
      props: {
        eyebrow: 'Günün Akışı',
        title: 'Program',
        subtitle: '',
        layout: 'timeline',
        items: [
          { id: uid('sc'), time: '17:00', title: 'Karşılama', desc: 'Hoş geldin içecekleri' },
          { id: uid('sc'), time: '17:30', title: 'Nikah Töreni', desc: 'Bahçede' },
          { id: uid('sc'), time: '18:30', title: 'Kokteyl', desc: 'Canlı müzik eşliğinde' },
          { id: uid('sc'), time: '20:00', title: 'Yemek', desc: 'Akşam yemeği' },
          { id: uid('sc'), time: '21:30', title: 'İlk Dans & Parti', desc: 'Sabaha kadar' },
        ],
      },
      style: { ...baseStyle, width: 'narrow' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'items', label: 'Akış', type: 'list', group: 'Akış', itemLabelKey: 'title',
        newItem: () => ({ id: uid('sc'), time: '22:00', title: 'Yeni madde', desc: '' }),
        itemFields: [
          { key: 'time', label: 'Saat', type: 'text' },
          { key: 'title', label: 'Başlık', type: 'text' },
          { key: 'desc', label: 'Açıklama', type: 'text' },
        ],
      },
      layoutField([
        { value: 'timeline', label: 'Çizgi' },
        { value: 'grid', label: 'Kart' },
      ]),
    ],
  },

  /* ============ COUNTDOWN ============ */
  {
    type: 'countdown',
    name: 'Geri Sayım',
    description: 'Canlı sayaç',
    icon: CalendarHeart,
    category: 'Etkinlik',
    defaults: {
      props: {
        eyebrow: 'Büyük Güne',
        title: 'Kalan Zaman',
        subtitle: '',
        targetDate: '',
        variant: 'boxes',
        showSeconds: true,
        finishedText: 'Bugün evleniyoruz! 🎉',
        buttons: [btn('Takvime Ekle', 'calendar', 'outline')],
      },
      style: { ...baseStyle, paddingY: 80, bgType: 'image', bgImage: STOCK.hero4, overlayColor: '#0b1020', overlayOpacity: 60, textColor: '#ffffff', bgParallax: true },
      animation: { type: 'zoom', duration: 0.8 },
    },
    fields: [
      ...headingFields(),
      { key: 'targetDate', label: 'Hedef tarih', type: 'datetime', group: 'Sayaç', help: 'Boş bırakırsanız site ayarlarındaki düğün tarihi kullanılır.' },
      {
        key: 'variant', label: 'Stil', type: 'segmented', group: 'Sayaç',
        options: [{ value: 'boxes', label: 'Kutu' }, { value: 'minimal', label: 'Sade' }, { value: 'circles', label: 'Daire' }],
      },
      { key: 'showSeconds', label: 'Saniye göster', type: 'toggle', group: 'Sayaç' },
      { key: 'finishedText', label: 'Bitince metin', type: 'text', group: 'Sayaç' },
      buttonsField(),
    ],
  },

  /* ============ RSVP ============ */
  {
    type: 'rsvp',
    name: 'LCV',
    description: 'Katılım formu',
    icon: Send,
    category: 'Etkileşim',
    defaults: {
      props: {
        eyebrow: 'Lütfen Cevap Veriniz',
        title: 'Katılım Durumu',
        subtitle: 'Planlamamıza yardımcı olmak için lütfen 1 Haziran 2027’ye kadar bildirin.',
        layout: 'card',
        image: STOCK.bouquet,
        askGuests: true,
        maxGuests: 4,
        askPhone: true,
        askMenu: true,
        menuOptions: 'Et, Tavuk, Vejetaryen',
        askSong: false,
        askNote: true,
        submitLabel: 'Gönder',
        successTitle: 'Teşekkürler!',
        successText: 'Cevabınızı aldık. Sizi görmek için sabırsızlanıyoruz.',
      },
      style: { ...baseStyle, width: 'normal' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      layoutField([
        { value: 'card', label: 'Kart' },
        { value: 'split', label: 'Görselli' },
        { value: 'plain', label: 'Sade' },
      ]),
      { key: 'image', label: 'Görsel', type: 'image', group: 'Düzen', showIf: (p) => p.layout === 'split' },
      { key: 'askGuests', label: 'Kişi sayısı sor', type: 'toggle', group: 'Form alanları' },
      { key: 'maxGuests', label: 'Maks. kişi', type: 'number', min: 1, max: 20, group: 'Form alanları', showIf: (p) => p.askGuests },
      { key: 'askPhone', label: 'Telefon sor', type: 'toggle', group: 'Form alanları' },
      { key: 'askMenu', label: 'Menü tercihi sor', type: 'toggle', group: 'Form alanları' },
      { key: 'menuOptions', label: 'Menü seçenekleri', type: 'text', group: 'Form alanları', help: 'Virgülle ayırın', showIf: (p) => p.askMenu },
      { key: 'askSong', label: 'Şarkı isteği sor', type: 'toggle', group: 'Form alanları' },
      { key: 'askNote', label: 'Not alanı', type: 'toggle', group: 'Form alanları' },
      { key: 'submitLabel', label: 'Buton metni', type: 'text', group: 'Mesajlar' },
      { key: 'successTitle', label: 'Başarı başlığı', type: 'text', group: 'Mesajlar' },
      { key: 'successText', label: 'Başarı metni', type: 'textarea', group: 'Mesajlar' },
    ],
  },

  /* ============ MUSIC ============ */
  {
    type: 'music',
    name: 'Müzik',
    description: 'Şarkı oynatıcı',
    icon: Music,
    category: 'Etkileşim',
    defaults: {
      props: {
        title: 'Bizim Şarkımız',
        songTitle: 'Perfect',
        artist: 'Ed Sheeran',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        cover: STOCK.couple3,
        variant: 'card',
        loop: true,
      },
      style: { ...baseStyle, paddingY: 64, width: 'narrow' },
      animation: baseAnim,
    },
    fields: [
      { key: 'title', label: 'Başlık', type: 'text', group: 'İçerik' },
      { key: 'songTitle', label: 'Şarkı adı', type: 'text', group: 'İçerik' },
      { key: 'artist', label: 'Sanatçı', type: 'text', group: 'İçerik' },
      { key: 'src', label: 'MP3 URL', type: 'url', group: 'İçerik' },
      { key: 'cover', label: 'Kapak', type: 'image', group: 'İçerik' },
      {
        key: 'variant', label: 'Stil', type: 'segmented', group: 'Düzen',
        options: [{ value: 'card', label: 'Kart' }, { value: 'vinyl', label: 'Plak' }, { value: 'minimal', label: 'Sade' }],
      },
      { key: 'loop', label: 'Tekrarla', type: 'toggle', group: 'Düzen' },
    ],
  },

  /* ============ FAQ ============ */
  {
    type: 'faq',
    name: 'S.S.S.',
    description: 'Sıkça sorulan sorular',
    icon: MessageSquare,
    category: 'Bilgi',
    defaults: {
      props: {
        eyebrow: 'Merak Edilenler',
        title: 'Sıkça Sorulan Sorular',
        subtitle: '',
        layout: 'accordion',
        items: [
          { id: uid('q'), q: 'Çocuklar davetli mi?', a: 'Sevgili minikler de bizimle kutlayabilir, lütfen LCV formunda belirtin.' },
          { id: uid('q'), q: 'Otopark var mı?', a: 'Mekanda ücretsiz vale hizmeti bulunmaktadır.' },
          { id: uid('q'), q: 'Kıyafet kuralı nedir?', a: 'Şık / kokteyl. Lütfen beyaz giymekten kaçının.' },
          { id: uid('q'), q: 'Hediye vermek istiyorum?', a: 'Varlığınız en güzel hediye! Yine de dilerseniz Hediye bölümüne göz atabilirsiniz.' },
        ],
      },
      style: { ...baseStyle, width: 'narrow' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'items', label: 'Sorular', type: 'list', group: 'Sorular', itemLabelKey: 'q',
        newItem: () => ({ id: uid('q'), q: 'Yeni soru?', a: 'Cevap…' }),
        itemFields: [
          { key: 'q', label: 'Soru', type: 'text' },
          { key: 'a', label: 'Cevap', type: 'textarea' },
        ],
      },
      layoutField([
        { value: 'accordion', label: 'Akordeon' },
        { value: 'grid', label: 'Grid' },
      ]),
    ],
  },

  /* ============ GIFT ============ */
  {
    type: 'gift',
    name: 'Hediye',
    description: 'IBAN & hediye listesi',
    icon: Gift,
    category: 'Bilgi',
    defaults: {
      props: {
        eyebrow: 'Hediye',
        title: 'Takı & Hediye',
        subtitle: 'Varlığınız bizim için en büyük hediye. Yine de bir jest yapmak isterseniz:',
        accounts: [{ id: uid('acc'), bank: 'Ziraat Bankası', holder: 'Ayşe Yılmaz', iban: 'TR00 0000 0000 0000 0000 0000 00' }],
        registryLabel: 'Hediye Listemiz',
        registryUrl: '',
      },
      style: { ...baseStyle, width: 'narrow' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'accounts', label: 'Hesaplar', type: 'list', group: 'Hesaplar', itemLabelKey: 'bank',
        newItem: () => ({ id: uid('acc'), bank: 'Banka', holder: 'Ad Soyad', iban: 'TR' }),
        itemFields: [
          { key: 'bank', label: 'Banka', type: 'text' },
          { key: 'holder', label: 'Alıcı', type: 'text' },
          { key: 'iban', label: 'IBAN', type: 'text' },
        ],
      },
      { key: 'registryLabel', label: 'Liste buton metni', type: 'text', group: 'Hediye listesi' },
      { key: 'registryUrl', label: 'Liste URL', type: 'url', group: 'Hediye listesi' },
    ],
  },

  /* ============ ACCOMMODATION ============ */
  {
    type: 'accommodation',
    name: 'Konaklama',
    description: 'Otel & ulaşım önerileri',
    icon: Hotel,
    category: 'Bilgi',
    defaults: {
      props: {
        eyebrow: 'Şehir Dışından Gelenler',
        title: 'Konaklama',
        subtitle: 'Misafirlerimiz için anlaşmalı oteller.',
        items: [
          { id: uid('h'), name: 'Çırağan Palace', image: STOCK.hotel1, distance: '200 m', price: '₺₺₺₺', desc: 'MOMENTIS koduyla %15 indirim.', url: '' },
          { id: uid('h'), name: 'The Stay Bosphorus', image: STOCK.hotel2, distance: '1.2 km', price: '₺₺₺', desc: 'Boğaz manzaralı butik otel.', url: '' },
          { id: uid('h'), name: 'Radisson Ortaköy', image: STOCK.hotel3, distance: '2 km', price: '₺₺', desc: 'Ücretsiz servis imkanı.', url: '' },
        ],
      },
      style: { ...baseStyle, width: 'wide' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'items', label: 'Oteller', type: 'list', group: 'Oteller', itemLabelKey: 'name',
        newItem: () => ({ id: uid('h'), name: 'Otel', image: STOCK.hotel1, distance: '', price: '₺₺', desc: '', url: '' }),
        itemFields: [
          { key: 'name', label: 'Ad', type: 'text' },
          { key: 'image', label: 'Görsel', type: 'image' },
          { key: 'distance', label: 'Mesafe', type: 'text' },
          { key: 'price', label: 'Fiyat', type: 'text' },
          { key: 'desc', label: 'Açıklama', type: 'textarea' },
          { key: 'url', label: 'Web/rezervasyon', type: 'url' },
        ],
      },
    ],
  },

  /* ============ DRESS CODE ============ */
  {
    type: 'dresscode',
    name: 'Kıyafet',
    description: 'Dress code & renk paleti',
    icon: Shirt,
    category: 'Bilgi',
    defaults: {
      props: {
        eyebrow: 'Dress Code',
        title: 'Şık & Kokteyl',
        subtitle: 'Bu renkler bizim için çok özel. Kombinlerinizde kullanırsanız çok mutlu oluruz.',
        colors: [
          { id: uid('c'), color: '#d8c3a5', name: 'Bej' },
          { id: uid('c'), color: '#8e9e82', name: 'Adaçayı' },
          { id: uid('c'), color: '#c9a96e', name: 'Şampanya' },
          { id: uid('c'), color: '#e7cfc4', name: 'Pudra' },
          { id: uid('c'), color: '#101827', name: 'Gece' },
        ],
        womenNote: 'Uzun / midi elbise, rahat topuklu ayakkabı (bahçe zemini).',
        menNote: 'Takım elbise, kravat opsiyonel.',
        avoid: 'Lütfen beyaz giymekten kaçının.',
      },
      style: { ...baseStyle, width: 'narrow' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      {
        key: 'colors', label: 'Renkler', type: 'list', group: 'Renk paleti', itemLabelKey: 'name',
        newItem: () => ({ id: uid('c'), color: '#cccccc', name: 'Renk' }),
        itemFields: [
          { key: 'color', label: 'Renk', type: 'color' },
          { key: 'name', label: 'Ad', type: 'text' },
        ],
      },
      { key: 'womenNote', label: 'Kadınlar', type: 'textarea', group: 'Notlar' },
      { key: 'menNote', label: 'Erkekler', type: 'textarea', group: 'Notlar' },
      { key: 'avoid', label: 'Kaçınılacak', type: 'text', group: 'Notlar' },
    ],
  },

  /* ============ GUESTBOOK ============ */
  {
    type: 'guestbook',
    name: 'Anı Defteri',
    description: 'Misafir mesajları',
    icon: BookHeart,
    category: 'Etkileşim',
    defaults: {
      props: {
        eyebrow: 'Anı Defteri',
        title: 'Dilekleriniz',
        subtitle: 'Bize güzel bir not bırakın.',
        allowNew: true,
        entries: [],
      },
      style: { ...baseStyle },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
      { key: 'allowNew', label: 'Misafir mesaj yazabilsin', type: 'toggle', group: 'Ayarlar' },
      {
        key: 'entries', label: 'Mesajlar', type: 'list', group: 'Mesajlar', itemLabelKey: 'name',
        newItem: () => ({ id: uid('g'), name: 'Misafir', message: 'Mesaj…' }),
        itemFields: [
          { key: 'name', label: 'İsim', type: 'text' },
          { key: 'message', label: 'Mesaj', type: 'textarea' },
        ],
      },
    ],
  },

  /* ============ ALBUM ============ */
  {
    type: 'album',
    name: 'QR Anı Albümü',
    description: 'Konuklar QR ile fotoğraf yüklesin',
    icon: Images,
    category: 'Etkileşim',
    defaults: {
      props: {
        eyebrow: 'Birlikte Biriktirelim',
        title: 'Gecenin güzel anıları',
        subtitle: 'QR kodu okutarak fotoğraflarınızı ortak albümümüze ekleyin.',
      },
      style: { ...baseStyle, width: 'wide' },
      animation: baseAnim,
    },
    fields: [
      ...headingFields(),
    ],
  },

  /* ============ SHARE ============ */
  {
    type: 'share',
    name: 'Paylaş & QR',
    description: 'Davetiyeyi paylaşın veya QR kodunu indirin',
    icon: Share2,
    category: 'Etkileşim',
    defaults: {
      props: {
        eyebrow: 'Bu güzel günü paylaşın',
        title: 'Davetiyemiz cebinizde',
        subtitle: 'Davet sayfamıza kolayca ulaşın; sevdiklerinizle paylaşın veya QR kodunu kaydedin.',
        showQr: true,
        showWhatsapp: true,
        showInstagram: true,
        qrLabel: 'Davetiyeyi QR ile aç',
      },
      style: { ...baseStyle, width: 'normal', paddingY: 72, bgType: 'color', bgColor: '#ffffff' },
      animation: { type: 'zoom', duration: 0.65, stagger: true },
    },
    fields: [
      ...headingFields(),
      { key: 'qrLabel', label: 'QR açıklaması', type: 'text', group: 'Paylaşım' },
      { key: 'showQr', label: 'QR kod göster', type: 'toggle', group: 'Paylaşım' },
      { key: 'showWhatsapp', label: 'WhatsApp paylaşımı', type: 'toggle', group: 'Paylaşım' },
      { key: 'showInstagram', label: 'Instagram paylaşımı', type: 'toggle', group: 'Paylaşım' },
    ],
  },

  /* ============ TEXT ============ */
  {
    type: 'text',
    name: 'Metin & Görsel',
    description: 'Serbest metin, alıntı, görsel',
    icon: Type,
    category: 'Düzen',
    defaults: {
      props: {
        eyebrow: '',
        title: 'Sevgili Misafirlerimiz',
        text: 'Bu yolculukta yanımızda olan herkese teşekkür ederiz. Sizinle bu özel günü paylaşmak bizim için tarif edilemez bir mutluluk.',
        variant: 'plain',
        author: '',
        image: '',
        imagePosition: 'none',
        buttons: [],
      },
      style: { ...baseStyle, width: 'narrow' },
      animation: baseAnim,
    },
    fields: [
      { key: 'eyebrow', label: 'Üst etiket', type: 'text', group: 'İçerik' },
      { key: 'title', label: 'Başlık', type: 'text', group: 'İçerik' },
      { key: 'text', label: 'Metin', type: 'textarea', group: 'İçerik' },
      {
        key: 'variant', label: 'Stil', type: 'segmented', group: 'Düzen',
        options: [{ value: 'plain', label: 'Düz' }, { value: 'quote', label: 'Alıntı' }, { value: 'script', label: 'El yazısı' }],
      },
      { key: 'author', label: 'Alıntı sahibi', type: 'text', group: 'Düzen', showIf: (p) => p.variant === 'quote' },
      {
        key: 'imagePosition', label: 'Görsel', type: 'segmented', group: 'Görsel',
        options: [{ value: 'none', label: 'Yok' }, { value: 'top', label: 'Üst' }, { value: 'left', label: 'Sol' }, { value: 'right', label: 'Sağ' }],
      },
      { key: 'image', label: 'Görsel', type: 'image', group: 'Görsel', showIf: (p) => p.imagePosition !== 'none' },
      buttonsField(),
    ],
  },

  /* ============ DIVIDER ============ */
  {
    type: 'divider',
    name: 'Ayraç',
    description: 'Süslü bölüm ayırıcı',
    icon: Minus,
    category: 'Düzen',
    defaults: {
      props: { variant: 'ornament', monogram: 'A & M', lineWidth: 40 },
      style: { ...baseStyle, paddingY: 40 },
      animation: { type: 'fade', duration: 0.8 },
    },
    fields: [
      {
        key: 'variant', label: 'Stil', type: 'select', group: 'Ayraç',
        options: [
          { value: 'line', label: 'İnce çizgi' },
          { value: 'ornament', label: 'Süs' },
          { value: 'hearts', label: 'Kalpler' },
          { value: 'floral', label: 'Çiçek' },
          { value: 'dots', label: 'Noktalar' },
          { value: 'monogram', label: 'Monogram' },
        ],
      },
      { key: 'monogram', label: 'Monogram', type: 'text', group: 'Ayraç', showIf: (p) => p.variant === 'monogram' },
      { key: 'lineWidth', label: 'Genişlik', type: 'slider', min: 10, max: 100, step: 5, unit: '%', group: 'Ayraç' },
    ],
  },

  /* ============ FOOTER ============ */
  {
    type: 'footer',
    name: 'Kapanış',
    description: 'Teşekkür & alt bilgi',
    icon: PanelBottom,
    category: 'Düzen',
    defaults: {
      props: {
        monogram: 'A & M',
        title: 'Sizi bekliyoruz',
        text: 'Sevgiyle,\nAyşe & Mehmet',
        date: '12.06.2027',
        hashtag: '#AyseVeMehmet',
        instagram: '',
        showCredit: true,
        buttons: [btn('Başa Dön', 'scroll', 'ghost')],
      },
      style: { ...baseStyle, paddingY: 80, bgType: 'color', bgColor: '#101827', textColor: '#f8f4ec' },
      animation: { type: 'fade', duration: 1 },
    },
    fields: [
      { key: 'layout', label: 'Yerleşim', type: 'select', group: 'Yerleşim', options: [{ value: 'centered', label: 'Ortalı' }, { value: 'split', label: 'İki sütun + linkler' }, { value: 'columns', label: '3 sütunlu' }, { value: 'minimal', label: 'Minimal şerit' }] },
      { key: 'showLinks', label: 'Hızlı linkleri göster', type: 'toggle', group: 'Yerleşim', showIf: (p) => !p.layout || p.layout === 'centered' },
      { key: 'monogram', label: 'Monogram', type: 'text', group: 'İçerik' },
      { key: 'title', label: 'Başlık', type: 'text', group: 'İçerik' },
      { key: 'text', label: 'Metin', type: 'textarea', group: 'İçerik' },
      { key: 'date', label: 'Tarih', type: 'text', group: 'İçerik' },
      { key: 'hashtag', label: 'Hashtag', type: 'text', group: 'Sosyal' },
      { key: 'instagram', label: 'Instagram', type: 'text', group: 'Sosyal', placeholder: '@kullanici' },
      { key: 'showCredit', label: '“MOMENTIS ile yapıldı”', type: 'toggle', group: 'Sosyal' },
      buttonsField(),
    ],
  },
]

export const SECTION_MAP: Record<string, SectionDefinition> = Object.fromEntries(SECTION_DEFINITIONS.map((d) => [d.type, d]))

export const SECTION_CATEGORIES: SectionCategory[] = ['Giriş', 'İçerik', 'Etkinlik', 'Etkileşim', 'Bilgi', 'Düzen']

/** Deep clone defaults & regenerate nested ids so duplicated items stay unique. */
export function createSectionFromDefinition(type: string, overrides: { props?: Record<string, any>; style?: SectionStyle; animation?: SectionAnimation } = {}) {
  const def = SECTION_MAP[type]
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
  const props = refreshIds(clone({ ...(def?.defaults.props ?? {}), ...(overrides.props ?? {}) }))
  return {
    id: uid('section'),
    type,
    visible: true,
    order: 0,
    props,
    style: clone({ ...(def?.defaults.style ?? baseStyle), ...(overrides.style ?? {}) }),
    animation: clone(overrides.animation ?? def?.defaults.animation ?? baseAnim),
  }
}

export function refreshIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => refreshIds(v)) as any
  if (value && typeof value === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(value as any)) {
      out[k] = k === 'id' && typeof v === 'string' ? uid(v.split('_')[0] || 'id') : refreshIds(v)
    }
    return out
  }
  return value
}

export const STYLE_FIELDS_DEFAULT = baseStyle
