/* Curated stock imagery (Unsplash) used by defaults, templates & image picker */
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const STOCK = {
  hero1: u('1519741497674-611481863552', 2000),
  hero2: u('1511285560929-80b456fea0bc', 2000),
  hero3: u('1465495976277-4387d4b0b4c6', 2000),
  hero4: u('1469371670807-013ccf25f16a', 2000),
  hero5: u('1606216794074-735e91aa2c92', 2000),
  bride: u('1494790108377-be9c29b29330', 800),
  groom: u('1507003211169-0a1dd7228f2d', 800),
  rings: u('1515934751635-c81c6bc9a2d8', 1200),
  bouquet: u('1494774157365-9e04c6720e47', 1200),
  table: u('1478146896981-b80fe463b330', 1200),
  decor: u('1550005809-91ad75fb315f', 1200),
  couple1: u('1522673607200-164d1b6ce486', 1200),
  couple2: u('1525258946800-98cfd641d0de', 1200),
  couple3: u('1460978812857-470ed1c77af0', 1200),
  flowers: u('1507504031003-b417219a0fde', 1200),
  bride2: u('1520854221256-17451cc331bf', 1200),
  ceremony: u('1537633552985-df8429e8048b', 1200),
  venue: u('1519225421980-715cb0215aed', 1200),
  hotel1: u('1566073771259-6a8506099945', 1000),
  hotel2: u('1542314831-068cd1dbfeeb', 1000),
  hotel3: u('1551882547-ff40c63fe5fa', 1000),
}

export const STOCK_LIBRARY: { src: string; label: string }[] = [
  { src: STOCK.hero1, label: 'Çift' },
  { src: STOCK.hero2, label: 'Tören' },
  { src: STOCK.hero3, label: 'Gün batımı' },
  { src: STOCK.hero4, label: 'Mekan' },
  { src: STOCK.hero5, label: 'Romantik' },
  { src: STOCK.couple1, label: 'Çift 2' },
  { src: STOCK.couple2, label: 'Çift 3' },
  { src: STOCK.couple3, label: 'Eller' },
  { src: STOCK.rings, label: 'Yüzükler' },
  { src: STOCK.bouquet, label: 'Buket' },
  { src: STOCK.flowers, label: 'Çiçekler' },
  { src: STOCK.table, label: 'Masa' },
  { src: STOCK.decor, label: 'Dekor' },
  { src: STOCK.bride2, label: 'Gelin' },
  { src: STOCK.ceremony, label: 'Seremoni' },
  { src: STOCK.venue, label: 'Salon' },
  { src: STOCK.bride, label: 'Portre K' },
  { src: STOCK.groom, label: 'Portre E' },
]

export const GALLERY_DEFAULT = [
  STOCK.couple1,
  STOCK.rings,
  STOCK.hero3,
  STOCK.bouquet,
  STOCK.couple2,
  STOCK.table,
  STOCK.couple3,
  STOCK.flowers,
]

export type SiteMediaAsset = { src: string; label: string }

const publicAsset = (path: string) =>
  `/${path.split('/').map((part) => encodeURIComponent(part)).join('/')}`

const numberedAssets = (directory: string, extension: string, count: number, prefix: string): SiteMediaAsset[] =>
  Array.from({ length: count }, (_, index) => {
    const file = `${index + 1}.${extension}`
    return { src: publicAsset(`${directory}/${file}`), label: `${prefix} ${String(index + 1).padStart(2, '0')}` }
  })

const namedAssets = (directory: string, files: string[]): SiteMediaAsset[] =>
  files.map((file) => ({
    src: publicAsset(`${directory}/${file}`),
    label: file.replace(/\.(svg|png|jpg)$/i, '').trim(),
  }))

export const SITE_SVG_LIBRARY: { id: string; label: string; items: SiteMediaAsset[] }[] = [
  {
    id: 'genel',
    label: 'Genel SVG',
    items: namedAssets('svg/genel', [
      'Adsız tasarım (1).svg',
      'Adsız tasarım (2).svg',
      'Adsız tasarım (3).svg',
      'Adsız tasarım (4).svg',
      'Adsız tasarım (5).svg',
      'Adsız tasarım2.svg',
      'Yeşil ve Antrasit Sade Monogram Yapraklı Düğün Davetiyesi.svg',
    ]),
  },
  {
    id: 'flower',
    label: 'Çiçek SVG',
    items: [
      ...numberedAssets('svg/flower', 'svg', 25, 'Çiçek'),
      ...namedAssets('svg/flower', ['k.svg', 'm.svg', 'p.svg', 'q.svg', 'w.svg', 'ı.svg']),
    ],
  },
]

const WEDDING_NAMED_ASSETS = [
  'Beyaz ve Altın Klasik Düğün Davetiye.png',
  'Beyaz ve Mavi Geleneksel Düğün Davetiye.png',
  'Beyaz ve Yeşil Zarif Düğün Davetiyesi.png',
  'Grey And Brown Elegant Wedding Invitation.png',
  'Gri Beyaz Minimalist Suluboya Düğün Davetiyesi .png',
  'Kahverengi ve Beyaz Fotoğraflı Düğün Davetiyesi.png',
  'Mor Bej Zarif Düğün Davetiyesi.png',
  'Pink and White Floral Illustration Save The Date Mobile Video.png',
  'Tek Renkli Minimalist Çiçek Düğün Davetiyesi (A6).png',
  'Altın Sarısı Modern Düğün Davetiyesi.svg',
  'Beyaz ve Altın Klasik Düğün Davetiye.svg',
  'Beyaz ve Mavi Geleneksel Düğün Davetiye.svg',
  'Kahverengi ve Beyaz Fotoğraflı Düğün Davetiyesi.svg',
  'Siyah Beyaz Minimalist Eğlenceli Düğün Davetiyesi.svg',
  'Tek Renkli Minimalist Çiçek Düğün Davetiyesi (A6).svg',
  'a (1).svg',
  'a (2).svg',
  'dqwd (1).svg',
  'dqwd (2).svg',
  'ggr (1).svg',
  'ggr (2).svg',
  'juju.svg',
  'qwdqw.svg',
  'qwdqwd.svg',
  'rs (1).svg',
  'rs (2).svg',
  'ü.svg',
  'üğğ.svg',
  'üğğü.svg',
  'ğ.svg',
  'ğü.svg',
]

export const WEDDING_MEDIA_LIBRARY: SiteMediaAsset[] = [
  ...numberedAssets('dugun', 'png', 23, 'Düğün görseli'),
  ...namedAssets('dugun', WEDDING_NAMED_ASSETS),
]

export const SITE_MEDIA_LIBRARY: { id: string; label: string; items: SiteMediaAsset[] }[] = [
  {
    id: 'photos',
    label: 'Fotoğraflar',
    items: STOCK_LIBRARY.map(({ src, label }) => ({ src, label })),
  },
  ...SITE_SVG_LIBRARY,
  {
    id: 'wedding',
    label: 'Düğün',
    items: WEDDING_MEDIA_LIBRARY,
  },
]

export const SITE_AUDIO_LIBRARY: SiteMediaAsset[] = [
  {
    src: publicAsset('sound/ElevenLabs_audio_elevenlabs-music-v2_Romantic acoust_2026-10-08T13_25_01.mp3'),
    label: 'Romantik akustik',
  },
  {
    src: publicAsset('sound/ElevenLabs_audio_elevenlabs-music-v2_Romantic solo p_2026-10-08T14_01_53.mp3'),
    label: 'Romantik solo piyano',
  },
  {
    src: publicAsset('sound/ElevenLabs_audio_elevenlabs-music-v2_Romantic solo p_2026-10-08T14_06_56.mp3'),
    label: 'Romantik solo piyano 2',
  },
  {
    src: publicAsset('sound/ElevenLabs_audio_elevenlabs-music-v2_Joyful upbeat p_2026-10-08T13_27_35.mp3'),
    label: 'Neşeli ve hareketli',
  },
]
