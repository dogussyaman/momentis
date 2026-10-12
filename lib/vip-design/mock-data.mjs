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
  { id: 'vip-invite-1', slug: 'vip-davetiye-1', title: 'VIP Davetiye-1 · Heirloom', description: 'Fildişi zemin üzerinde ince çerçeve ve klasik serif harfler.', preview: { background: '#fbf7ed', foreground: '#42372e', accent: '#b48d57', ornament: 'frame' }, design: { variant: 'ivory', typography: 'serif', layout: 'portrait' } },
  { id: 'vip-invite-2', slug: 'vip-davetiye-2', title: 'VIP Davetiye-2 · Afterglow', description: 'Koyu lacivertte güçlü başlık ve altın editoryal ayrıntılar.', preview: { background: '#162239', foreground: '#f8f1e3', accent: '#d1b16f', ornament: 'stars' }, design: { variant: 'midnight', typography: 'editorial', layout: 'editorial' } },
  { id: 'vip-invite-3', slug: 'vip-davetiye-3', title: 'VIP Davetiye-3 · Fleur', description: 'Pudra tonlarında zarif botanik köşeler ve romantik yazı.', preview: { background: '#fff1ef', foreground: '#593d40', accent: '#bd8584', ornament: 'flowers' }, design: { variant: 'blush', typography: 'serif', layout: 'frame' } },
  { id: 'vip-invite-4', slug: 'vip-davetiye-4', title: 'VIP Davetiye-4 · Form', description: 'Minimal monokrom kompozisyon ve çağdaş tipografik hiyerarşi.', preview: { background: '#fcfcf9', foreground: '#222526', accent: '#747b7c', ornament: 'lines' }, design: { variant: 'mono', typography: 'sans', layout: 'editorial' } },
  { id: 'vip-invite-5', slug: 'vip-davetiye-5', title: 'VIP Davetiye-5 · Verdant', description: 'Adaçayı tonları, doğal çizgiler ve ferah bir davet.', preview: { background: '#f1f5ec', foreground: '#354337', accent: '#788c6d', ornament: 'leaves' }, design: { variant: 'sage', typography: 'serif', layout: 'portrait' } },
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
export const VIP_FORM_OPTIONS = {
  eventTypes: ['Düğün', 'Nişan', 'Kına', 'Söz', 'Diğer'],
  styles: ['Romantik', 'Modern', 'Klasik', 'Doğal', 'Editoryal'],
  sections: ['Hikâyemiz', 'Program', 'Galeri', 'Davet & RSVP', 'Konum', 'Geri sayım', 'QR fotoğraf albümü'],
}
