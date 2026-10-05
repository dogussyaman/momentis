import { MessagingTester } from '@/components/messaging/messaging-tester'

export const metadata = {
  title: 'Gönderim Testi | MOMENTIS',
  robots: { index: false, follow: false },
}

export default function MessagingTestPage() {
  return (
    <div className="bg-ivory pb-28 pt-36">
      <div className="container">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Mesajlaşma Altyapısı</p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-midnight md:text-6xl">Gönderim <span className="italic text-champagne-dark">Testi</span></h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Davetiye, RSVP onayı ve hatırlatma mesajlarını Resend (e-posta) ve Twilio (SMS) üzerinden deneyin. Tüm gönderimler kayıt altına alınır.</p>
        </div>
        <div className="mt-14">
          <MessagingTester />
        </div>
      </div>
    </div>
  )
}
