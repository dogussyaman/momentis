# MOMENTIS — PRD & Durum Özeti

## Ürün
Premium düğün/etkinlik dijital davetiye platformu (lüks stüdyo + editoryal + SaaS + Canva benzeri editör). Dil: Türkçe.
Marka: Midnight Navy #101827, Champagne Gold #C9A96E, Ivory #F8F4EC. Fontlar: Playfair Display (serif), DM Sans (sans).
Stack: Next.js 15 App Router + MongoDB (MONGO_URL) + Tailwind + shadcn/ui + Framer Motion. (Supabase isteği ortam kısıtı nedeniyle MongoDB ile karşılandı.)

## Kullanıcı kararları (1a-5a)
- Faz 1'den sırayla başla; kendi e-posta/şifre auth (sonraki faz); 3D yok, Framer Motion; görseller vision_expert_agent; faz faz MVP.
- Resend (e-posta) + Twilio (SMS): davetiye gönderimi + RSVP onayı + hatırlatma. Önce pazarlama sitesi, sonra mesajlaşma + test sayfası.

## Tamamlanan (bu oturum)
- Tasarım sistemi: tailwind.config.js (midnight/champagne/ivory, fontlar, marquee/float), globals.css token'ları, root layout (lang=tr, Toaster).
- Route grupları: (marketing) [/, /tasarimlar, /tasarimlar/[slug], /fiyatlandirma, /nasil-calisir, /gonderim-testi], (auth) [/giris, /kayit — UI only, submit toast], not-found.
- Veri: lib/data/{templates(13), packages(3), events, site}.js, lib/motion.js, lib/db.js.
- API (app/api/[[...path]]/route.js): /health, /event-types, /packages, /templates(+filters, auto-seed), /templates/:slug, /leads, /messaging/{status,preview,send,logs}.
- Mesajlaşma: lib/messaging/{shared,email(Resend),sms(Twilio)}.js; message_logs koleksiyonu. next.config serverExternalPackages: twilio, resend (bellek fix).
- .env: RESEND_API_KEY (verildi), RESEND_FROM_EMAIL=onboarding@resend.dev (test gönderici → yalnızca hesap sahibine gönderim). TWILIO_* boş (kullanıcıdan bekleniyor).

## Sonraki fazlar
- Twilio kimlik bilgileri → SMS testi.
- Faz 11-13: Auth (e-posta/şifre, JWT cookie) + onboarding sihirbazı.
- Faz 14-16: Dashboard, proje yönetimi, Canva benzeri editör.
- Faz 17-19: Public davetiye /d/[slug], RSVP (→ e-posta/SMS onayı), QR anı albümü, konuk listesi toplu gönderim.
- Faz 20: Ayarlar/admin. Mesajlaşma uçlarına auth koruması eklenmeli (şu an açık, test amaçlı).
