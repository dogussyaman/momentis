const img = (id, w = 1800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const IMAGES = {
  hero: img('photo-1761816172782-d3dfa19cd24b', 2000),
  heroAlt: img('photo-1768586471676-6af1d219e99e'),
  editorial: img('photo-1780541952163-d9ad11e8ce82'),
  stationery: img('photo-1633037773384-27d7ac0491e7'),
  stationeryAlt: img('photo-1741893043659-ca8b82a8b637'),
  ring: img('photo-1710961716482-2e9bbc146e73'),
  jewelry: img('photo-1620650893164-fb56b7e66067'),
  table: img('photo-1519225421980-715cb0215aed'),
  garden: img('photo-1696271026740-4c0c1a367f03'),
  sparklers: img('photo-1473652502225-6b6af0664e32'),
  dance: img('photo-1531747056595-07f6cbbe10ad'),
  candles: img('photo-1729237261091-bae8eba0c60c'),
}

export const NAV_LINKS = [
  { href: '/tasarimlar', label: 'Tasarımlar' },
  { href: '/nasil-calisir', label: 'Nasıl Çalışır' },
  { href: '/fiyatlandirma', label: 'Fiyatlandırma' },
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kosullar', label: 'Koşullar' },
]

export const STATS = [
  { value: '12.000+', label: 'Mutlu Çift' },
  { value: '180+', label: 'Editoryal Tasarım' },
  { value: '%97', label: 'RSVP Yanıt Oranı' },
  { value: '4.9/5', label: 'Memnuniyet' },
]

export const TRUST_ITEMS = [
  'Dakikalar içinde yayında', 'Sınırsız düzenleme', 'QR anı albümü', 'Akıllı RSVP', 'Konuk yönetimi', 'Spotify entegrasyonu', 'Editoryal tasarımlar', 'Türkçe destek',
]

export const STEPS = [
  { number: '01', title: 'Tasarımını Seç', description: 'Düğün, nişan, kına ya da özel günün için editoryal koleksiyonumuzdan sana en yakın hissettireni seç.' },
  { number: '02', title: 'Hikâyeni Kişiselleştir', description: 'İsimler, tarih, mekân, fotoğraflar ve müzik. Canva benzeri düzenleyicimizde her detayı dakikalar içinde kendin yap.' },
  { number: '03', title: 'Paylaş ve Yönet', description: 'Tek bir bağlantıyla davetiyeni gönder; RSVP yanıtlarını, konuk listeni ve anı albümünü panelinden takip et.' },
]

export const FEATURES = [
  { icon: 'PenTool', title: 'Canlı Düzenleyici', description: 'Renk, tipografi, blok sırası ve fotoğraflar; her şey gerçek zamanlı önizlemeyle elinizin altında.' },
  { icon: 'MailCheck', title: 'Akıllı RSVP', description: 'Katılım, kişi sayısı, menü tercihi ve notlar. Yanıtlar anında panelinize düşer.' },
  { icon: 'Users', title: 'Konuk Yönetimi', description: 'Davetlilerinizi gruplayın, masa planı oluşturun, hatırlatma gönderin.' },
  { icon: 'QrCode', title: 'QR Anı Albümü', description: 'Masalardaki QR kodla konuklarınız çektikleri fotoğrafları ortak albüme yükler.' },
  { icon: 'Music', title: 'Müzik ve Atmosfer', description: 'Spotify çalma listenizi davetiyenize ekleyin; hikâyeniz sesle de anlatılsın.' },
  { icon: 'BarChart3', title: 'Katılım Analitiği', description: 'Kaç kişi açtı, kaç kişi yanıtladı, hangi gün en çok görüntülendi; hepsi tek ekranda.' },
]

export const TESTIMONIALS = [
  { quote: 'Davetiyemizi gören herkes bir stüdyoya yaptırdığımızı sandı. Oysa bir akşam, bir fincan kahveyle hazırladık.', name: 'Elif & Kaan', event: 'Düğün, İstanbul', initials: 'EK' },
  { quote: 'RSVP yanıtlarını tek tek aramak zorunda kalmadık. Menü tercihleri bile hazır geldi; organizasyon şirketimiz bayıldı.', name: 'Zeynep & Mert', event: 'Düğün, İzmir', initials: 'ZM' },
  { quote: 'QR anı albümü gecenin yıldızıydı. Sabah uyandığımızda 600’den fazla fotoğraf bizi bekliyordu.', name: 'Selin & Arda', event: 'Kına & Düğün, Bodrum', initials: 'SA' },
]

export const FAQ = [
  { q: 'Davetiyemi kaç kişiye gönderebilirim?', a: 'Başlangıç paketinde 50 davetliye kadar, Premium ve Atölye paketlerinde sınırsız davetliye gönderebilirsiniz. Tek bir bağlantıyı WhatsApp, e-posta veya SMS ile paylaşmanız yeterli.' },
  { q: 'Davetiyemi yayınladıktan sonra düzenleyebilir miyim?', a: 'Evet. Tüm paketlerde yayın sonrası sınırsız düzenleme yapabilirsiniz; değişiklikler anında aynı bağlantıda görünür.' },
  { q: 'Ödeme tek seferlik mi?', a: 'Evet. Fiyatlar etkinlik başına tek seferliktir; abonelik ya da gizli ücret yoktur. Davetiyeniz etkinlik tarihinden sonra 12 ay boyunca erişilebilir kalır.' },
  { q: 'QR anı albümü nasıl çalışır?', a: 'Panelinizden oluşturduğunuz QR kodu masalara yerleştirirsiniz. Konuklarınız telefon kamerasıyla okutur, uygulama indirmeden fotoğraf yükler. Siz albümü panelden yönetirsiniz.' },
  { q: 'Atölye paketinde tasarımcı desteği ne içeriyor?', a: 'Kişisel bir tasarımcı sizinle görüşür; renk paleti, illüstrasyon ve tipografiyi hikâyenize göre özelleştirir. Baskıya uygun PDF sürümü de bu pakete dahildir.' },
]
