# MOMENTIS

MOMENTIS, düğün ve diğer özel etkinlikler için dijital davetiye ve davet sitesi oluşturma platformudur. Hazır tasarımları kişiselleştirme, RSVP yanıtlarını yönetme, etkinlik bilgilerini paylaşma ve QR anı albümünde fotoğraf toplama akışları sunar. VIP tasarım talebi ve yönetim araçları da uygulamanın parçasıdır.

## Teknoloji ve mimari

- Next.js 16 App Router ve React 19; JavaScript ve TypeScript birlikte kullanılır.
- Tailwind CSS 4, Radix UI ve `components/ui` tabanlı arayüz bileşenleri.
- MongoDB 6 uygulama verileri için; API katmanı Next.js Route Handler'ları üzerinden çalışır.
- Oturumlar `jose` ile imzalanan JWT'ler ve HTTP-only çerezlerle yönetilir; parolalar `bcryptjs` ile hash'lenir.
- `next.config.js`, üretim derlemesini `standalone` çıktı biçiminde ayarlar.

## Geliştirme ortamı

Node.js 22, npm ve MongoDB erişimi gerekir. Bağımlılıkları kilit dosyasına göre kurun:

```bash
npm ci
```

Yerel ortam değişkenlerini `.env.local` içinde tanımlayın. En azından `MONGO_URL` ve `JWT_SECRET` gerekir; veritabanı seçimi için `DB_NAME` kullanın. Gerçek değerleri kaynak koda veya dokümantasyona eklemeyin.

Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışır.

## Kontroller ve derleme

```bash
npm test
npm run typecheck
npm run build
```

`package.json` içinde `npm run start` komutu tanımlıdır; ancak `next.config.js` `output: 'standalone'` kullandığından, Next.js'in bu çıktı biçimi için önerdiği üretim sunucusu `node .next/standalone/server.js` komutuyla başlatılır. Standalone sunucu `public/` ve `.next/static/` dosyalarını kendiliğinden kopyalamaz; dağıtımda bunları CDN üzerinden sunun veya Next.js'in standalone yönergesine göre çıktıya dahil edin. GitHub Actions iş akışı (`.github/workflows/ci.yml`) pull request ve `main` dalı değişikliklerinde typecheck ve testleri çalıştırır; depoda otomatik canlı yayınlama komutu veya yayın iş akışı tanımlı değildir.

## Başlıca klasörler

- `app/`: App Router sayfaları, route group'ları, metadata ve API giriş noktaları.
- `components/`: pazarlama, kimlik doğrulama, panel, editör, davetiye ve ortak UI bileşenleri.
- `lib/api/`: API yönlendirme ve alanlara göre ayrılmış API işlemleri.
- `lib/billing/`, `lib/auth.js`, `lib/db.js`: paket/erişim kuralları, oturum doğrulaması ve MongoDB bağlantısı.
- `lib/data/`, `lib/site-builder/`, `lib/themes/`: sabit kataloglar, site düzenleyici modeli ve tema verileri.
- `store/` ve `hooks/`: istemci durumu ve React hook'ları.
- `scripts/`: yönetim ve bakım komutları; `bootstrap-admin.mjs` ilk super-admin hesabını kontrollü biçimde tanımlar.
- `tests/` ve `lib/**/*.test.*`: otomatik testler; `docs/`: mevcut teknik/yönetim dokümanları.

## Kimlik doğrulama, veritabanı ve yayınlama

`lib/db.js`, MongoDB istemcisini geliştirme hot reload'larında yeniden kullanır. API istekleri `app/api/[[...path]]/route.js` üzerinden uygun API modülüne yönlendirilir. Oturum doğrulaması `momentis_session` adlı HTTP-only çerezi kullanır; hassas yönetim işlemleri API tarafında kullanıcı rolüyle ayrıca doğrulanır.

Kullanıcı, panelde etkinlik projesini düzenleyip yayınladığında proje veritabanında yayın durumu ile saklanır. Yayımlanmış ve arşivlenmemiş davetiyeler `/d/[slug]` rotasında gösterilir. Kod derlemesi `next build` ile yapılır; bu depo için bir barındırma sağlayıcısına otomatik dağıtım adımı tanımlı değildir. Canlı ortamda veritabanı ve entegrasyon değişkenleri dağıtım platformunun güvenli ortam yapılandırmasında sağlanmalıdır.

SEO canonical adresinin tek kaynağı [`lib/seo.js`](./lib/seo.js) içindeki `SITE_ORIGIN` sabitidir. Özel alan adı kullanımı doğrulandıktan sonra bu değer güncellenmelidir; `NEXT_PUBLIC_BASE_URL` OAuth ve paylaşım bağlantılarında kullanılır, SEO canonical değerini değiştirmez.

## Ortam değişkenleri

Değişken adları kaynak kodda kullanılan yapılandırmayı yansıtır. Hepsi her kurulumda gerekli değildir; servis kullanılıyorsa ilgili kimlik bilgilerini yerel `.env.local` veya dağıtım platformunun gizli değişken yönetiminde tanımlayın.

| Değişken | Amaç |
| --- | --- |
| `MONGO_URL` | MongoDB bağlantısı; uygulamanın veritabanı bağlantısı için gereklidir. |
| `DB_NAME` | MongoDB içinde kullanılacak veritabanı adı. |
| `JWT_SECRET` | Oturum ve imzalı token işlemlerinin anahtarı. |
| `NODE_ENV` | Çalışma kipini belirtir; oturum çerezlerinin güvenli bayrağı ve bazı üretim/test davranışları buna göre belirlenir. |
| `MONGO_DNS_SERVERS` | Gerekirse MongoDB SRV DNS sorguları için virgülle ayrılmış DNS sunucuları. |
| `NEXT_PUBLIC_BASE_URL` | OAuth callback ve mutlak davetiye/bildirim bağlantıları için uygulama temel adresi. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | İsteğe bağlı Google OAuth yapılandırması; callback adresi ayrıca ayarlanmazsa uygulama temel adresinden türetilir. |
| `CORS_ORIGINS` | İsteğe bağlı API CORS origin yapılandırması. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | İsteğe bağlı e-posta sağlayıcısı erişimi ve gönderici tanımı. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_MESSAGING_SERVICE_SID` | İsteğe bağlı SMS sağlayıcısı yapılandırması; gönderici numarası veya Messaging Service SID kullanılır. |
| `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` | Ödeme sağlayıcısı entegrasyonu için kullanılır. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Tanımlanırsa pazarlama altbilgisindeki Instagram bağlantısını gösterir. |
| `NEXT_PUBLIC_SITE_GIFT_CAMPAIGN_MOCK` | Site hediye kampanyası demo arayüzünün mock kipini etkinleştirir. |
| `MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD`, `MOMENTIS_TEST_COUPON_ALLOWLIST` | Test kuponlarının üretim ortamındaki deneme ve e-posta izin listesi davranışını kontrol eder. |
| `MOMENTIS_INITIAL_SUPER_ADMIN_EMAIL`, `MOMENTIS_INITIAL_SUPER_ADMIN_CONFIRM` | Güvenilir makinede, mevcut bir kullanıcıya ilk super-admin rolünü vermek için tek seferlik bootstrap komutunda kullanılır. |

Gerçek bağlantı adresi, anahtar, token, parola veya kişisel bilgi README'ye ya da Git'e eklenmemelidir. İlk super-admin bootstrap işlemi için [yönetim dokümantasyonundaki güvenlik adımlarını](./docs/admin-panel.md#initial-super-admin) izleyin.

## Yerel ve canlı ortam

- Yerelde `MONGO_URL`, `JWT_SECRET` ve gerekiyorsa diğer servis ayarlarını `.env.local` içinde tutun; paylaşmayın veya commit etmeyin.
- Canlı ortamda veritabanı ve sağlayıcı anahtarlarını barındırma platformunun gizli değişken deposunda yapılandırın. Test/mock ayarlarını canlıda etkinleştirmeden önce kullanımını ve izin listesini gözden geçirin.
- Canonical adres `lib/seo.js` içinde `https://momentis-mu.vercel.app` olarak ayarlanmıştır. Doğrulanmış özel alan adına geçişte bu tek değeri değiştirip sitemap ve metadata çıktısını yeniden kontrol edin.
- `next.config.js` içindeki standalone çıktı, barındırma ortamında Next.js uygulamasının üretim çalışma biçimine göre dağıtılmalıdır. Depoda sağlayıcıya özgü otomatik yayın komutu bulunmaz.

## Güvenlik ve katkı

- Secret'ları, `.env` dosyalarını, gerçek davetli verilerini ve kişisel içerikleri commit etmeyin.
- Yönetici işlemlerini yalnızca UI görünürlüğüyle güvenceye almayın; API yetkilendirmesi de gereklidir.
- Değişikliklerden önce ilgili modülün mevcut desenlerini inceleyin; alan dışı davranışları değiştirmeyin.
- Pull request öncesi uygun testleri, `npm run typecheck` ve `npm run build` kontrollerini çalıştırın. Kimlik doğrulama, yetkilendirme veya veritabanı değişikliklerine regresyon testleri ekleyin.
