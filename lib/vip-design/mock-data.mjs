const siteSeeds = [
  {
    id: 'vip-site-1', slug: 'ozel-1', title: 'Özel-1 · Ivory Atelier',
    description: 'Fildişi tonları, geniş boşluklar ve şampanya yansımalarıyla sakin bir lüks.',
    image: '/vip/ozel-1.png', hasLiveDemo: true, tag: 'Canlı Demo',
    preview: { background: '#f5efe3', foreground: '#463d32', accent: '#b18d58', surface: '#fffdf8' },
    design: { variant: 'ivory', eyebrow: 'Bir ömür, aynı hikâye', couple: ['Lal', 'Emir'], date: '12 Eylül 2027', venue: 'Sarnıç Köşk · İstanbul', story: 'Bir sonbahar akşamı başlayan hikâyemiz, şimdi en güzel gününe yaklaşıyor.', sections: ['Hikâyemiz', 'Kutlama Programı', 'Fotoğraf Günlüğü', 'Davet & RSVP', 'QR Albüm'], layout: 'centered' },
  },
  {
    id: 'vip-site-2', slug: 'ozel-2', title: 'Özel-2 · Midnight Editorial',
    description: 'Gece mavisi zemin, cesur editoryal tipografi ve altın çizgiler.',
    image: '/vip/ozel-2.jpg', hasLiveDemo: true, tag: 'Canlı Demo',
    preview: { background: '#101a2b', foreground: '#f8f3e8', accent: '#d3b77e', surface: '#1a2940' },
    design: { variant: 'midnight', eyebrow: 'The night is ours', couple: ['Defne', 'Atlas'], date: '24 Haziran 2027', venue: 'Rıhtım Teras · İzmir', story: 'İki ayrı yol, aynı ufukta buluştu. Bu geceyi bizimle paylaşın.', sections: ['The Story', 'The Evening', 'The Gallery', 'The Invitation', 'Shared Album'], layout: 'editorial' },
  },
  {
    id: 'vip-site-3', slug: 'ozel-3', title: 'Özel-3 · Blush Garden',
    description: 'Romantik pudra tonları, çiçek illüstrasyonları ve yumuşak geçişler.',
    image: '/vip/ozel-3.jpg', hasLiveDemo: true, tag: 'Canlı Demo',
    preview: { background: '#f9e9e6', foreground: '#573f43', accent: '#bb8583', surface: '#fff9f7' },
    design: { variant: 'blush', eyebrow: 'Sevgiyle büyüyen bir hikâye', couple: ['Mina', 'Can'], date: '18 Temmuz 2027', venue: 'Lavanta Bahçesi · Bursa', story: 'Küçük anılarımızın kocaman bir sevgiye dönüştüğü bu yolculuğa tanık olun.', sections: ['Tanışmamız', 'Düğün Günü', 'Anılarımız', 'Davetimiz', 'Fotoğraf Albümü'], layout: 'split' },
  },
  {
    id: 'vip-site-4', slug: 'ozel-4', title: 'Özel-4 · Modern Monochrome',
    description: 'Siyah-beyaz kontrast, net grid ve çağdaş minimal çizgiler.',
    image: '/vip/ozel-4.jpg', hasLiveDemo: true, tag: 'Canlı Demo',
    preview: { background: '#f5f5f2', foreground: '#191b1c', accent: '#747c7e', surface: '#ffffff' },
    design: { variant: 'mono', eyebrow: 'Together, intentionally', couple: ['Ada', 'Aras'], date: '03 Ekim 2027', venue: 'Modern Salon · Ankara', story: 'En sevdiğimiz şey, hayatın her hâlini yan yana karşılamak.', sections: ['01 / Hikâye', '02 / Program', '03 / Galeri', '04 / Katılım', '05 / Albüm'], layout: 'minimal' },
  },
  {
    id: 'vip-site-5', slug: 'ozel-5', title: 'Özel-5 · Botanical Sage',
    description: 'Adaçayı yeşili, doğal dokular ve botanik detaylarla dingin bir davet.',
    image: '/vip/ozel-5.jpg', hasLiveDemo: true, tag: 'Canlı Demo',
    preview: { background: '#e9eee4', foreground: '#354239', accent: '#82947a', surface: '#f8faf5' },
    design: { variant: 'sage', eyebrow: 'Doğanın içinde, birlikte', couple: ['Ece', 'Deniz'], date: '09 Mayıs 2027', venue: 'Zeytinli Bahçe · Muğla', story: 'Birlikte kurduğumuz küçük dünyayı, sevdiğimiz insanlarla kutluyoruz.', sections: ['Bizim Hikâyemiz', 'Doğada Bir Gün', 'Fotoğraflar', 'Davet Bilgileri', 'Ortak Albüm'], layout: 'botanical' },
  },
]

const invitationSeeds = [
  {
    id: 'vip-invite-1',
    slug: 'bej-minimalist',
    legacySlug: 'vip-davetiye-1',
    title: 'Bej Minimalist Davetiye',
    description: 'Sıcak bej tonları, zarif serif tipografi ve yalın minimalist çizgilere sahip dikey davetiye.',
    image: '/vipdavet/bej-minimalist.png',
    preview: { background: '#f5efe6', foreground: '#3d362e', accent: '#c4a47c', ornament: 'minimal' },
    design: { variant: 'beige', typography: 'serif', layout: 'portrait' },
  },
  {
    id: 'vip-invite-2',
    slug: 'beyaz-altin-minimalist',
    legacySlug: 'vip-davetiye-2',
    title: 'Beyaz & Altın Minimalist Davetiye',
    description: 'Beyaz zemin üzerinde altın yaldız detaylar, editoryal tipografi ve zamansız lüks sadelik.',
    image: '/vipdavet/beyaz-altin-minimalist.png',
    preview: { background: '#ffffff', foreground: '#1f2421', accent: '#d4af37', ornament: 'gold' },
    design: { variant: 'gold', typography: 'editorial', layout: 'portrait' },
  },
  {
    id: 'vip-invite-3',
    slug: 'gri-beyaz-suluboya',
    legacySlug: 'vip-davetiye-3',
    title: 'Gri Beyaz Minimalist Suluboya',
    description: 'Yumuşak gri ve beyaz suluboya dokuları, sanatsal geçişler ve asil yazı karakterleri.',
    image: '/vipdavet/gri-beyaz-suluboya.png',
    preview: { background: '#f4f4f4', foreground: '#2e3033', accent: '#8a929a', ornament: 'watercolor' },
    design: { variant: 'watercolor', typography: 'serif', layout: 'portrait' },
  },
  {
    id: 'vip-invite-4',
    slug: 'kahverengi-beyaz-klasik',
    legacySlug: 'vip-davetiye-4',
    title: 'Kahverengi & Beyaz Klasik Davetiye',
    description: 'Toprak ve kahve tonlarında klasik zarafet, sıcak kontrastlar ve geleneksel lüks estetik.',
    image: '/vipdavet/kahverengi-beyaz-klasik.png',
    preview: { background: '#ebe5df', foreground: '#4a3525', accent: '#8c6239', ornament: 'classic' },
    design: { variant: 'classic', typography: 'serif', layout: 'portrait' },
  },
  {
    id: 'vip-invite-5',
    slug: 'krem-mavi-minimalist',
    legacySlug: 'vip-davetiye-5',
    title: 'Krem & Mavi Minimalist Davetiye',
    description: 'Fildişi krem arka planda derin gece mavisi vurgular ve modern dikey tasarım.',
    image: '/vipdavet/krem-mavi-minimalist.png',
    preview: { background: '#fbf8f2', foreground: '#1a2b49', accent: '#3b5998', ornament: 'modern' },
    design: { variant: 'cream-blue', typography: 'sans', layout: 'portrait' },
  },
  {
    id: 'vip-invite-6',
    slug: 'mavi-yesil-suluboya',
    legacySlug: 'vip-davetiye-6',
    title: 'Mavi & Yeşil Suluboya Çiçek Davetiye',
    description: 'Canlı botanik çiçek illüstrasyonları, taze suluboya yapraklar ve romantik bahçe teması.',
    image: '/vipdavet/mavi-yesil-suluboya.png',
    preview: { background: '#f6faf6', foreground: '#1b3b2b', accent: '#4a8265', ornament: 'floral' },
    design: { variant: 'botanical', typography: 'serif', layout: 'portrait' },
  },
]

export const VIP_SITE_TEMPLATES = siteSeeds
export const VIP_INVITATION_TEMPLATES = invitationSeeds
export const VIP_REQUEST_STATUSES = [
  { id: 'created', label: 'Talep oluşturuldu' },
  { id: 'reviewing', label: 'İnceleniyor' },
  { id: 'preparing', label: 'Tasarım hazırlanıyor' },
  { id: 'feedback', label: 'Kullanıcı geri bildirimi bekleniyor' },
  { id: 'completed', label: 'Tamamlandı' },
]
export const VIP_WORKFLOW_STATUSES = [
  { id: 'pending', label: 'Yeni talep' },
  { id: 'approved', label: 'Onaylandı · üretim başlangıcı bekleniyor' },
  { id: 'rejected', label: 'Reddedildi' },
  { id: 'in_progress', label: 'Üretimde' },
  { id: 'delivered', label: 'Teslim edildi' },
  { id: 'cancelled', label: 'İptal edildi' },
]
export const VIP_CANCELLATION_REASONS = [
  { id: 'capacity', label: 'Üretim kapasitesi' },
  { id: 'scope_change', label: 'Hizmet kapsamı değişikliği' },
  { id: 'customer_request', label: 'Kullanıcı talebi' },
  { id: 'policy', label: 'İş politikası' },
  { id: 'other', label: 'Diğer' },
]
export const VIP_STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['in_progress', 'rejected', 'cancelled'],
  rejected: [],
  in_progress: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}
export const VIP_FORM_OPTIONS = {
  eventTypes: ['Düğün', 'Nişan', 'Kına', 'Söz', 'Diğer'],
  styles: ['Romantik', 'Modern', 'Klasik', 'Doğal', 'Editoryal'],
  sections: ['Hikâyemiz', 'Program', 'Galeri', 'Davet & RSVP', 'Konum', 'Geri sayım', 'QR fotoğraf albümü'],
}
