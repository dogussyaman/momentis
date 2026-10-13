export type FaqCategory = {
  id: string
  label: string
}

export const FAQ_CATEGORIES = [
  { id: 'general', label: 'Genel' },
  { id: 'products', label: 'Davetiye ve site' },
  { id: 'guest-tools', label: 'RSVP, konum ve fotoğraf' },
  { id: 'design', label: 'Şablonlar ve VIP tasarım' },
  { id: 'billing', label: 'Krediler ve paketler' },
  { id: 'account', label: 'Hesap ve güvenlik' },
  { id: 'publishing', label: 'Yayınlama ve destek' },
] as const satisfies readonly FaqCategory[]

export type FaqCategoryId = (typeof FAQ_CATEGORIES)[number]['id']

export type FaqItem = {
  id: string
  category: FaqCategoryId
  question: string
  answer: string
}

export const FAQ_ITEMS = [
  {
    id: 'what-is-momentis',
    category: 'general',
    question: 'MOMENTIS nedir?',
    answer: 'MOMENTIS; dijital davetiye, kişiselleştirilebilir davet sitesi ve özel etkinlik deneyimleri oluşturmanıza yardımcı olan bir platformdur.',
  },
  {
    id: 'supported-events',
    category: 'general',
    question: 'Hangi etkinlikler için kullanabilirim?',
    answer: 'Düğün, nişan, söz ve kına gibi özel günler için kullanabilirsiniz. Diğer etkinlik türlerinin kullanılabilirliği etkinlik oluşturma ekranında sunulan seçeneklere bağlıdır.',
  },
  {
    id: 'design-skills',
    category: 'general',
    question: 'Tasarım bilgisi gerekir mi?',
    answer: 'Hayır. Hazır şablonlar ve düzenleme araçlarıyla metin, renk ve görsellerinizi kendiniz uyarlayabilirsiniz.',
  },
  {
    id: 'mobile-use',
    category: 'general',
    question: 'Telefonumdan kullanabilir miyim?',
    answer: 'Güncel mobil tarayıcılarla MOMENTIS’i kullanabilirsiniz. Temel etkinlik bilgileri ve tarih seçimi mobil ekrana uyumludur; ayrıntılı tasarım düzenlemeleri geniş ekranda daha rahat olabilir.',
  },
  {
    id: 'invitation-vs-site',
    category: 'products',
    question: 'Dijital davetiye ile davet sitesi arasındaki fark nedir?',
    answer: 'Dijital davetiye paylaşılabilir bir tasarımdır. Davet sitesi ise yayınlandığında etkinlik bilgilerini ve etkinlik için etkinleştirilmiş bölümleri tek bir bağlantıda sunar.',
  },
  {
    id: 'site-sections',
    category: 'products',
    question: 'Davet siteme hangi bölümleri ekleyebilirim?',
    answer: 'Seçtiğiniz şablona ve etkinleştirilen özelliklere göre çiftin hikâyesi, etkinlik programı, konum, galeri, geri sayım, RSVP, sık sorulan sorular ve fotoğraf paylaşımı gibi bölümler eklenebilir.',
  },
  {
    id: 'personalize-invitation',
    category: 'products',
    question: 'Davetiye ve sitemi kişiselleştirebilir miyim?',
    answer: 'Evet. Kullanılabilir düzenleme araçlarıyla metin, isim, tarih, renk, görsel ve tasarım seçeneklerini değiştirebilirsiniz.',
  },
  {
    id: 'share-invitation',
    category: 'products',
    question: 'Davetiyemi nasıl paylaşırım?',
    answer: 'Yayınlanmış davet sitesi bağlantısını paylaşabilirsiniz. Davetiye görseli indirme ve diğer dışa aktarma seçenekleri hesabınızdaki paket haklarına ve ilgili ekranda sunulan seçeneklere bağlıdır.',
  },
  {
    id: 'edit-after-publish',
    category: 'products',
    question: 'Yayınladıktan sonra davetiyemi güncelleyebilir miyim?',
    answer: 'Projeniz yayındayken düzenleyip kaydedebilirsiniz. Değişikliklerin ziyaretçilere görünmesi için projenin yayın durumunu ve kaydetme sonucunu kontrol edin.',
  },
  {
    id: 'rsvp',
    category: 'guest-tools',
    question: 'RSVP nedir?',
    answer: 'RSVP, misafirlerin etkinliğe katılıp katılmayacaklarını bildirmesini sağlayan katılım yanıtı özelliğidir. Etkinleştirildiğinde yanıtları panelinizden takip edebilirsiniz.',
  },
  {
    id: 'venue-map',
    category: 'guest-tools',
    question: 'Etkinlik mekânının konumunu ekleyebilir miyim?',
    answer: 'Evet. Desteklenen etkinlik veya site bölümlerine mekân ve adres bilgisi ekleyebilir, mevcutsa harita bağlantısını gösterebilirsiniz.',
  },
  {
    id: 'guest-photos',
    category: 'guest-tools',
    question: 'Misafirler etkinlik fotoğraflarını yükleyebilir mi?',
    answer: 'QR anı albümü Premium ve Atölye paketlerinde etkinleştirilebilir; bu paketlerde etkinlik başına en fazla 500 fotoğraf yüklenebilir. Misafirler bağlantı üzerinden fotoğraf paylaşabilir.',
  },
  {
    id: 'qr-code',
    category: 'guest-tools',
    question: 'QR kodu ne işe yarar?',
    answer: 'Etkinleştirilen özelliğe göre QR kodu davet sayfanıza veya ortak fotoğraf albümünüze hızlı erişim sağlar. QR kodunun yönlendirdiği alanı paylaşmadan önce kontrol edin.',
  },
  {
    id: 'preview-templates',
    category: 'design',
    question: 'Demo ve şablonları incelemek ücretsiz mi?',
    answer: 'Herkese açık tasarım kataloğunu ve demoları inceleyebilirsiniz. Premium şablonlar ve diğer ücretli özellikler için güncel paket ve kullanım hakları geçerlidir.',
  },
  {
    id: 'vip-design',
    category: 'design',
    question: 'VIP özel tasarım talebi nedir?',
    answer: 'İhtiyacınızı ve tasarım yönlendirmenizi ekibe ileterek özel tasarım değerlendirme ve üretim sürecini başlatan bir taleptir. Talebin aşamalarını hesabınızdaki VIP talepleri alanından takip edebilirsiniz.',
  },
  {
    id: 'vip-credits',
    category: 'design',
    question: 'VIP tasarım talebi göndermek için kaç kredi gerekir?',
    answer: 'Talep oluşturmak için en az 2 kullanılabilir VIP talep kredisi gerekir. Başarılı oluşturma sırasında 2 kredi düşülür; kullanılabilir kredi bakiyenizi talep öncesinde kontrol edin.',
  },
  {
    id: 'vip-refunds',
    category: 'design',
    question: 'VIP talebim reddedilirse veya iptal edilirse kredilerim iade edilir mi?',
    answer: 'Reddedilen bir talep için düşülen 2 kredi iade edilir. Üretim başlamadan önce iptal talebi yönetim tarafından uygun bulunup iptal kararı verildiğinde de krediler iade edilir. Üretim başladıktan sonraki iptallerde kredi iadesi yapılmaz. İade ve iptal kararı talep durumunda gösterilir.',
  },
  {
    id: 'vip-timeline',
    category: 'design',
    question: 'VIP talebim ne zaman tamamlanır?',
    answer: 'Talep önce değerlendirilir; ardından onay, üretim ve teslimat adımları izlenir. Süreç ve kapsam netleşmeden kesin bir teslim tarihi vaat edilmez. Güncel durumu VIP talepleri alanından takip edin.',
  },
  {
    id: 'credits',
    category: 'billing',
    question: 'Kredi sistemi nasıl çalışır?',
    answer: 'Etkinlik kredileri, paket koşullarında belirtilen etkinlik haklarını kullanmak için tanımlanır. VIP talepleri de en az 2 kullanılabilir kredi gerektirir. İşlem öncesinde ilgili ekranda gösterilen ücret ve koşulları inceleyin.',
  },
  {
    id: 'package-differences',
    category: 'billing',
    question: 'Ücretsiz ve ücretli paketlerin farkı nedir?',
    answer: 'Paketler etkinlik kredisi, davetli sınırı, premium şablonlar, RSVP, fotoğraf albümü ve diğer özellikler bakımından farklılaşabilir. Güncel hakları Fiyatlandırma sayfasında ve hesabınızdaki paket alanında karşılaştırın.',
  },
  {
    id: 'check-credits',
    category: 'billing',
    question: 'Kredilerimi nereden görebilirim?',
    answer: 'Giriş yaptıktan sonra panelinizdeki “Paketim” alanından kullanılabilir etkinlik kredilerinizi ve paket bilgilerinizi görebilirsiniz.',
  },
  {
    id: 'payment-not-activated',
    category: 'billing',
    question: 'Ödeme sonrasında paketim etkinleşmezse ne yapmalıyım?',
    answer: 'Önce panelinizdeki “Paketim” alanını yenileyip işlem durumunu kontrol edin. Şu anda ödeme sağlayıcısı yapılandırılmadığından gerçek paket satın alımı kullanılamaz; test ortamındaki deneme onayı gerçek bir ödeme değildir. Sorun sürerse işlem bilgilerinizi ve mümkünse ekran görüntüsünü merhaba@momentis.app adresine iletin.',
  },
  {
    id: 'unused-credits',
    category: 'billing',
    question: 'Kullanmadığım krediler iade edilir mi?',
    answer: 'Kullanılmayan krediler için otomatik bir iade akışı doğrulanmamıştır; iade koşulları işlem ve geçerli koşullara bağlıdır. VIP taleplerine ait özel kredi iade koşulları VIP bölümünde açıklanmıştır. Ayrıca şu anda gerçek paket satın alımı üretimde kullanılamaz.',
  },
  {
    id: 'create-account',
    category: 'account',
    question: 'Nasıl hesap oluşturabilirim?',
    answer: 'Kayıt sayfasından e-posta ve istenen hesap bilgileriyle kayıt olabilirsiniz. Sunulan oturum açma yöntemleri zaman içinde değişebilir.',
  },
  {
    id: 'google-login',
    category: 'account',
    question: 'Google ile giriş yapabilir miyim?',
    answer: 'Google ile giriş seçeneği kayıt veya giriş ekranında etkin olarak sunuluyorsa kullanabilirsiniz.',
  },
  {
    id: 'forgot-password',
    category: 'account',
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer: 'Giriş ekranındaki “Şifremi unuttum” bağlantısını kullanarak e-posta adresinize gönderilen sıfırlama adımlarını izleyin. E-posta gelmezse gereksiz posta klasörünüzü de kontrol edin.',
  },
  {
    id: 'delete-account',
    category: 'account',
    question: 'Hesabımı silebilir miyim?',
    answer: 'Hesap silme işlemi profil alanından başlatılır ve yeniden kimlik doğrulaması gerektirir. Bekleyen VIP talepleri veya siparişler sonuçlanmadan silme yapılamaz. İşlem projeleri ve bunlara bağlı bazı verileri siler, VIP taleplerindeki kullanıcı bilgilerini anonimleştirir ve kullanılmamış kredileri kapatır. Satın alma ve denetim kayıtları gibi bazı kayıtlar sistemde kalabilir; silme önizlemesindeki özeti onaylamadan önce inceleyin.',
  },
  {
    id: 'privacy',
    category: 'account',
    question: 'Bilgilerim nasıl korunuyor?',
    answer: 'Hesap ve etkinlik verilerine erişim uygulamadaki oturum ve yetkilendirme kurallarıyla sınırlandırılır. Gizlilik sayfası mevcut veri akışları hakkında bilgi verir; ancak hukuki bildirim ve bazı saklama süreleri henüz tamamlanmadığından bu sayfa yayıma hazır bir gizlilik politikası olarak değerlendirilmemelidir. Hassas bilgileri herkese açık davetiye alanlarında paylaşmayın.',
  },
  {
    id: 'public-site',
    category: 'publishing',
    question: 'Yayınlanan davet sitesi herkese açık mı?',
    answer: 'Yayın durumundaki davet sitesi, bağlantısına erişebilen kişiler tarafından görüntülenebilir; ziyaretçilerden hesapla giriş yapmaları istenmez. Bağlantıyı ve sayfada paylaştığınız kişisel bilgileri yalnızca uygun gördüğünüz kişilerle paylaşın.',
  },
  {
    id: 'changes-lost',
    category: 'publishing',
    question: 'Yaptığım değişiklikler kaybolursa ne yapmalıyım?',
    answer: 'Önce editördeki kaydetme durumunu ve doğru etkinlik projesinde olduğunuzu kontrol edin. Sorun sürerse ilgili sayfanın ekran görüntüsünü ve hangi adımlarda oluştuğunu merhaba@momentis.app adresine gönderin.',
  },
  {
    id: 'page-not-loading',
    category: 'publishing',
    question: 'Davet veya panel sayfası açılmıyorsa ne yapabilirim?',
    answer: 'Güncel bir tarayıcı kullandığınızı ve internet bağlantınızı kontrol edin; ardından sayfayı yenileyip bağlantıyı tekrar deneyin. Sorun sürerse sayfa adresini ve ekran görüntüsünü destek ekibine iletin.',
  },
  {
    id: 'contact',
    category: 'publishing',
    question: 'Destek ekibine nasıl ulaşabilirim?',
    answer: 'merhaba@momentis.app adresine e-posta gönderebilirsiniz. Sorununuzu ve ilgili etkinlik ya da işlem bilgilerini eklemek, destek ekibinin konuyu incelemesine yardımcı olur.',
  },
] as const satisfies readonly FaqItem[]

export function normalizeFaqSearch(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

export function filterFaqItems(items: readonly FaqItem[], categoryId: 'all' | FaqCategoryId, query: string) {
  const normalizedQuery = normalizeFaqSearch(query)
  return items.filter((item) => {
    const matchesCategory = categoryId === 'all' || item.category === categoryId
    if (!matchesCategory) return false
    if (!normalizedQuery) return true
    const categoryLabel = FAQ_CATEGORIES.find((category) => category.id === item.category)?.label || ''
    const searchableText = normalizeFaqSearch(`${categoryLabel} ${item.question} ${item.answer}`)
    return searchableText.includes(normalizedQuery)
  })
}

export function buildFaqJsonLd(items: readonly FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
