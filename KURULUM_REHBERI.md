# MOMENTIS - Kurulum ve API Anahtarları Rehberi

Bu proje tamamen bağımsız çalışacak şekilde yapılandırılmıştır (Emergent servislerine bağımlılık kaldırılmıştır). Projenin tam olarak çalışabilmesi için `.env.local` dosyasındaki ayarların doldurulması gerekmektedir.

Aşağıda ihtiyacınız olan tüm API anahtarlarını adım adım nereden ve nasıl alacağınız anlatılmaktadır.

---

## 1. MONGODB (Veritabanı)
Projenin kullanıcı hesaplarını, tasarımları ve davetiyeleri kaydetmesi için gereklidir.

1. **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** adresine gidin ve ücretsiz hesap oluşturun (veya giriş yapın).
2. Yeni bir proje (Project) ve ardından yeni bir **Cluster** oluşturun (Ücretsiz/M0 (Free) seçeneğini seçin).
3. Cluster oluştuktan sonra sol menüden **Database Access**'e tıklayın.
   - **Add New Database User** diyerek bir kullanıcı adı (örneğin `admin`) ve şifre oluşturun. **(Bu şifreyi not edin!)**
4. Sol menüden **Network Access**'e tıklayın.
   - **Add IP Address** diyerek **Allow Access From Anywhere** (`0.0.0.0/0`) seçeneğini ekleyin (Böylece Vercel veya bilgisayarınız veritabanına bağlanabilir).
5. Sol menüden **Database**'e tıklayın ve cluster'ınızın yanındaki **Connect** butonuna basın.
   - **Drivers** (veya Node.js) seçeneğini seçin.
   - Size verilen bağlantı adresini kopyalayın. Şuna benzeyecektir:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. `.env.local` dosyanızdaki `MONGO_URL` kısmına bu adresi yapıştırın. `<username>` ve `<password>` kısımlarını 3. adımda oluşturduğunuz bilgilerle değiştirin.
7. `DB_NAME` karşısına veritabanı adı olarak `momentis` yazabilirsiniz.

---

## 2. GOOGLE OAUTH (Google ile Giriş)
Kullanıcıların kendi Google hesaplarıyla sitenize üye olabilmesi için gereklidir.

1. **[Google Cloud Console](https://console.cloud.google.com/)** adresine gidin.
2. Üst menüden **Select a project** (Proje seç) kısmına tıklayıp **New Project** (Yeni Proje) diyerek "Momentis" adında bir proje oluşturun.
3. Sol menüden **APIs & Services > OAuth consent screen** (OAuth izin ekranı) bölümüne gidin.
   - User Type olarak **External** (Harici) seçin ve **Create** (Oluştur) deyin.
   - Uygulama adı (App name) olarak `MOMENTIS`, destek e-postası olarak kendi e-postanızı girin.
   - En alttaki **Developer contact information** kısmına yine e-postanızı girip kaydedin (Diğer adımları Save and Continue diyerek geçebilirsiniz).
   - *Not: Uygulamanız şu an "Testing" modunda olduğu için sadece yetki verdiğiniz kişiler giriş yapabilir. Test Users (Test Kullanıcıları) kısmından giriş yapacağınız e-posta adresini eklemeyi unutmayın.*
4. Sol menüden **Credentials** (Kimlik Bilgileri) sekmesine geçin.
5. Üstteki **+ CREATE CREDENTIALS** butonuna tıklayıp **OAuth client ID** seçin.
   - Application type: **Web application**
   - Name: `Momentis Web` (veya istediğiniz bir isim)
   - **Authorized JavaScript origins** (Yetkili JavaScript kaynakları) altındaki **ADD URI** butonuna basıp şunu ekleyin:
     `http://localhost:3000`
   - **Authorized redirect URIs** (Yetkili yönlendirme URI'leri) altındaki **ADD URI** butonuna basıp şunu ekleyin (sonunda slash `/` OLMASIN):
     `http://localhost:3000/api/auth/google/callback`
6. **Create** (Oluştur) butonuna basın.
7. Karşınıza çıkan ekrandaki **Client ID** ve **Client Secret** değerlerini kopyalayın.
8. `.env.local` dosyanıza şu şekilde ekleyin:
   ```env
   GOOGLE_CLIENT_ID="kopyaladiginiz_client_id"
   GOOGLE_CLIENT_SECRET="kopyaladiginiz_client_secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
   ```
   *(Not: Projeyi Vercel vb. bir yere yüklediğinizde, Authorized origins ve redirect URI kısımlarına canlı sitenizin adreslerini de eklemelisiniz.)*

---

## 3. RESEND (E-posta Gönderimi - İsteğe Bağlı)
Şifre sıfırlama, davetiye e-postaları vb. bildirimler göndermek için gereklidir. Ayarlamazsanız proje çalışmaya devam eder ancak e-postalar gönderilmez (sadece terminalde görünür).

1. **[Resend](https://resend.com/)** adresine gidip hesap oluşturun.
2. Sol menüden **API Keys** sekmesine tıklayın.
3. **Create API Key** butonuna basıp bir anahtar oluşturun.
4. Çıkan `re_xxxxx...` formatındaki anahtarı kopyalayın.
5. `.env.local` dosyanıza şu şekilde ekleyin:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxx"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   ```
   *(Not: Kendi özel alan adınız (domain) yoksa, test amaçlı olarak sadece kendi kayıtlı e-posta adresinize mail gönderebilirsiniz ve `onboarding@resend.dev` gönderici adresini kullanmalısınız. Kendi alan adınızı (ör. iletisim@momentis.com) kullanmak isterseniz Resend üzerinden "Domains" kısmından alan adınızı doğrulamanız gerekir.)*

---

## 4. TWILIO (SMS Gönderimi - İsteğe Bağlı)
Kullanıcılara veya misafirlere SMS atmak için gereklidir. Ayarlamazsanız SMS özellikleri devre dışı kalır.

1. **[Twilio](https://www.twilio.com/)** adresine gidip ücretsiz hesap oluşturun (Telefon doğrulaması isteyecektir).
2. Twilio Console sayfasına girdiğinizde ana ekranda (Account Info bölümünde) şunları göreceksiniz:
   - **Account SID**
   - **Auth Token** (Gizlidir, göz ikonuna basarak görünür yapıp kopyalayın)
   - **My Twilio phone number** (Size atanan ücretsiz sanal numara)
3. Bu üç bilgiyi alıp `.env.local` dosyanıza ekleyin:
   ```env
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_FROM_NUMBER="+1234567890"
   ```
   *(Not: Twilio deneme (trial) hesaplarında sadece doğruladığınız telefon numaralarına SMS gönderebilirsiniz. Başkalarına SMS atmak için hesabınızı yükseltmeniz (upgrade) gerekir.)*

---

## Örnek .env.local Dosyası Görünümü

Tüm bu adımları tamamladığınızda `.env.local` dosyanız şuna benzemelidir:

```env
MONGO_URL="mongodb+srv://admin:sifreniz@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
DB_NAME="momentis"
MONGO_DNS_SERVERS="8.8.8.8,1.1.1.1"

JWT_SECRET="rasgele-uzun-bir-sifre-metni-yazabilirsiniz"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"

GOOGLE_CLIENT_ID="xxxxx-yyyyy.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-zzzzzzzz"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"

TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="xxxxx"
TWILIO_FROM_NUMBER="+1234567890"
```

Tüm bu ayarları girdikten sonra terminalde Next.js sunucusunu kapatıp (`Ctrl + C`) tekrar başlatın (`npm run dev`).
