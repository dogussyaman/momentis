// Editorial template catalogue. Seeded into MongoDB on first API request.
const img = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const TEMPLATES = [
  {
    id: 'tpl-aurelia', slug: 'aurelia', name: 'Aurelia', category: 'dugun', style: 'klasik', tier: 'premium',
    tagline: 'Mum ışığında altın bir akşam', is_new: false, popularity: 98,
    description: 'Aurelia, klasik düğün zarafetini şampanya altını detaylarla buluşturur. Serif tipografi ve ince çerçeve çizgileriyle zamansız bir davet deneyimi sunar.',
    cover: img('photo-1519225421980-715cb0215aed'),
    palette: { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' },
    layout: 'classic', tags: ['altın', 'klasik', 'mum ışığı', 'serif'],
    features: ['Sinematik açılış animasyonu', 'Geri sayım bloğu', 'RSVP formu', 'Konum ve harita', 'Fotoğraf galerisi', 'QR anı albümü'],
  },
  {
    id: 'tpl-verdant', slug: 'verdant', name: 'Verdant', category: 'dugun', style: 'botanik', tier: 'premium',
    tagline: 'Bahçede yeşilin en zarif hali', is_new: true, popularity: 91,
    description: 'Verdant, açık hava törenleri için tasarlandı. Adaçayı yeşili tonlar ve botanik dokularla doğayla iç içe bir davet hikâyesi anlatır.',
    cover: img('photo-1696271026740-4c0c1a367f03'),
    palette: { bg: '#F4F3EC', accent: '#7E8B72', text: '#2B3328', muted: '#8A9282' },
    layout: 'botanical', tags: ['botanik', 'yeşil', 'bahçe', 'açık hava'],
    features: ['Botanik illüstrasyon çerçeve', 'Geri sayım bloğu', 'RSVP formu', 'Program akışı', 'Konaklama önerileri', 'QR anı albümü'],
  },
  {
    id: 'tpl-noir', slug: 'noir-editorial', name: 'Noir Éditorial', category: 'dugun', style: 'modern', tier: 'premium',
    tagline: 'Gece mavisi üzerinde editoryal cesaret', is_new: true, popularity: 95,
    description: 'Noir Éditorial, moda dergilerinden ilham alan yüksek kontrastlı bir tasarım. Gece lacivert zemin ve büyük serif başlıklarla unutulmaz bir ilk izlenim bırakır.',
    cover: img('photo-1768586471676-6af1d219e99e'),
    palette: { bg: '#101827', accent: '#C9A96E', text: '#F8F4EC', muted: '#A9ADB8' },
    layout: 'modern', tags: ['lacivert', 'editoryal', 'modern', 'kontrast'],
    features: ['Tam ekran görsel kapak', 'Paralaks kaydırma', 'RSVP formu', 'Dress code bölümü', 'Fotoğraf galerisi', 'Spotify çalma listesi'],
  },
  {
    id: 'tpl-lumiere', slug: 'lumiere', name: 'Lumière', category: 'dugun', style: 'luks', tier: 'premium',
    tagline: 'Işığın ve ihtişamın buluşması', is_new: false, popularity: 89,
    description: 'Lumière, lüks mekân düğünleri için ışıltılı bir tasarım. Sıcak amber tonlar ve ince altın çizgilerle davetlilerinizi görkemli bir geceye hazırlar.',
    cover: img('photo-1729237261091-bae8eba0c60c'),
    palette: { bg: '#1C1710', accent: '#D9B66F', text: '#F8F1E4', muted: '#B9A98E' },
    layout: 'classic', tags: ['lüks', 'amber', 'ışıltı', 'gece'],
    features: ['Altın parıltı animasyonu', 'Geri sayım bloğu', 'RSVP formu', 'Ulaşım ve vale bilgisi', 'Hediye tercihi', 'QR anı albümü'],
  },
  {
    id: 'tpl-riviera', slug: 'riviera', name: 'Riviera', category: 'dugun', style: 'minimal', tier: 'free',
    tagline: 'Açık havada sade bir tören', is_new: false, popularity: 84,
    description: 'Riviera, sade ve ferah bir tasarım. Beyaz boşluklar ve yumuşak taş tonlarıyla kır düğünleri ve sahil törenleri için ideal.',
    cover: img('photo-1760972594010-e217e2f2845c'),
    palette: { bg: '#FBFAF6', accent: '#B8A590', text: '#2E2A25', muted: '#9C948A' },
    layout: 'minimal', tags: ['minimal', 'sahil', 'kır', 'sade'],
    features: ['Sade kapak', 'Geri sayım bloğu', 'RSVP formu', 'Konum ve harita'],
  },
  {
    id: 'tpl-golden-hour', slug: 'golden-hour', name: 'Golden Hour', category: 'dugun', style: 'modern', tier: 'premium',
    tagline: 'Gün batımında ilk dans', is_new: false, popularity: 92,
    description: 'Golden Hour, gün batımı tonlarında sıcak ve romantik bir tasarım. Fotoğraf odaklı bloklarla hikâyenizi görsellerle anlatın.',
    cover: img('photo-1531747056595-07f6cbbe10ad'),
    palette: { bg: '#F6EEE3', accent: '#C78B5A', text: '#3A2A1E', muted: '#A08A75' },
    layout: 'modern', tags: ['gün batımı', 'romantik', 'fotoğraf', 'sıcak'],
    features: ['Fotoğraf hikâyesi', 'Geri sayım bloğu', 'RSVP formu', 'Program akışı', 'Fotoğraf galerisi', 'QR anı albümü'],
  },
  {
    id: 'tpl-maison', slug: 'maison', name: 'Maison', category: 'dugun', style: 'klasik', tier: 'premium',
    tagline: 'Zarif detaylarda saklı bir aşk', is_new: false, popularity: 80,
    description: 'Maison, pudra ve fildişi tonlarında klasik bir stüdyo tasarımı. İnce detay fotoğrafları ve kaligrafik başlıklarla butik bir his yaratır.',
    cover: img('photo-1562616441-69265b948285'),
    palette: { bg: '#FAF5F1', accent: '#C9A0A0', text: '#3B3030', muted: '#A08E8E' },
    layout: 'classic', tags: ['pudra', 'klasik', 'butik', 'kaligrafi'],
    features: ['Kaligrafik başlık', 'Geri sayım bloğu', 'RSVP formu', 'Hediye tercihi', 'Fotoğraf galerisi'],
  },
  {
    id: 'tpl-flora', slug: 'flora-nisan', name: 'Flora', category: 'nisan', style: 'botanik', tier: 'free',
    tagline: 'Çiçeklerle örülü bir başlangıç', is_new: false, popularity: 86,
    description: 'Flora, nişan törenleri için yumuşak pembe tonlarda botanik bir tasarım. Çiçek dokuları ve ipek kurdele detaylarıyla zarif ve samimi.',
    cover: img('photo-1633037773384-27d7ac0491e7'),
    palette: { bg: '#FBF3F1', accent: '#C98B8B', text: '#3E2F2F', muted: '#A68B8B' },
    layout: 'botanical', tags: ['nişan', 'pembe', 'botanik', 'çiçek'],
    features: ['Botanik çerçeve', 'RSVP formu', 'Konum ve harita', 'Fotoğraf galerisi'],
  },
  {
    id: 'tpl-serenad', slug: 'serenad', name: 'Serenad', category: 'soz', style: 'minimal', tier: 'free',
    tagline: 'Küçük bir evet, büyük bir söz', is_new: true, popularity: 78,
    description: 'Serenad, söz törenleri için sade ve sıcak bir tasarım. Minimal tipografi ile yakın çevrenize samimi bir davet gönderin.',
    cover: img('photo-1710961716482-2e9bbc146e73'),
    palette: { bg: '#F9F6F2', accent: '#B99A7A', text: '#2F2A26', muted: '#9E9188' },
    layout: 'minimal', tags: ['söz', 'minimal', 'samimi'],
    features: ['Sade kapak', 'RSVP formu', 'Konum ve harita'],
  },
  {
    id: 'tpl-henna', slug: 'henna-gece', name: 'Henna', category: 'kina', style: 'modern', tier: 'premium',
    tagline: 'Işıltılı bir gece, modern bir kına', is_new: false, popularity: 83,
    description: 'Henna, geleneği modern bir dille yorumlar. Gece tonları ve ışıltılı detaylarla kına gecenizi unutulmaz bir davete dönüştürür.',
    cover: img('photo-1473652502225-6b6af0664e32'),
    palette: { bg: '#14101A', accent: '#D4A5A5', text: '#F7EFEA', muted: '#A99AA6' },
    layout: 'modern', tags: ['kına', 'gece', 'ışıltı', 'modern'],
    features: ['Işıltı animasyonu', 'Geri sayım bloğu', 'RSVP formu', 'Program akışı', 'Spotify çalma listesi'],
  },
  {
    id: 'tpl-petit-fete', slug: 'petit-fete', name: 'Petit Fête', category: 'dogum-gunu', style: 'modern', tier: 'free',
    tagline: 'Pastanın etrafında zarif bir kutlama', is_new: false, popularity: 74,
    description: 'Petit Fête, doğum günü kutlamaları için şık ve neşeli bir tasarım. Pastel tonlar ve oyuncu tipografiyle her yaşa uygun.',
    cover: img('photo-1535254973040-607b474cb50d'),
    palette: { bg: '#FDF7F4', accent: '#D98C9A', text: '#3A2E31', muted: '#A69095' },
    layout: 'modern', tags: ['doğum günü', 'pastel', 'kutlama'],
    features: ['Oyuncu kapak', 'RSVP formu', 'Konum ve harita', 'Hediye tercihi'],
  },
  {
    id: 'tpl-minik-mucize', slug: 'minik-mucize', name: 'Minik Mucize', category: 'baby-shower', style: 'minimal', tier: 'free',
    tagline: 'Yeni bir hayatı birlikte karşılayın', is_new: true, popularity: 71,
    description: 'Minik Mucize, baby shower partileri için yumuşak ve sade bir tasarım. Krem tonlar ve zarif tipografiyle sıcak bir karşılama.',
    cover: img('photo-1741893043659-ca8b82a8b637'),
    palette: { bg: '#FBF8F3', accent: '#A9B4A0', text: '#33332E', muted: '#9A9A90' },
    layout: 'minimal', tags: ['baby shower', 'krem', 'sade'],
    features: ['Sade kapak', 'RSVP formu', 'Hediye listesi', 'Konum ve harita'],
  },
  {
    id: 'tpl-atlas', slug: 'atlas', name: 'Atlas', category: 'kurumsal', style: 'minimal', tier: 'premium',
    tagline: 'Kurumsal zarafet, net iletişim', is_new: false, popularity: 77,
    description: 'Atlas, gala ve lansman etkinlikleri için sofistike bir tasarım. Gece mavisi ve gümüş detaylarla kurumsal kimliğinizi yansıtın.',
    cover: img('photo-1653821355226-6def361cc7ab'),
    palette: { bg: '#0F1B2D', accent: '#B9C2CF', text: '#F3F5F8', muted: '#8E98A8' },
    layout: 'modern', tags: ['kurumsal', 'gala', 'lansman', 'lacivert'],
    features: ['Kurumsal logo alanı', 'Program akışı', 'RSVP formu', 'Konum ve harita', 'Katılımcı analitiği'],
  },
]

export function getTemplateBySlug(slug) {
  return TEMPLATES.find((t) => t.slug === slug)
}

export function getFeaturedTemplates(limit = 6) {
  return [...TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, limit)
}
