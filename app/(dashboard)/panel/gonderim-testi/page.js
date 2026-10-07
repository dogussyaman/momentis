import { MessagingTester } from '@/components/messaging/messaging-tester'

export const metadata = {
  title: 'Gönderim Testi | MOMENTIS Panel',
  robots: { index: false, follow: false },
}

export default function DashboardMessagingTestPage() {
  return (
    <div className="mx-auto max-w-7xl" data-testid="dashboard-messaging-test">
      <div className="border-b border-midnight/10 pb-8">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-champagne-dark">
          <span className="h-px w-8 bg-current" /> Mesajlaşma altyapısı
        </p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-midnight sm:text-5xl">Gönderim <span className="italic text-champagne-dark">testi</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Davetiye, RSVP onayı ve hatırlatma mesajlarını e-posta ve SMS üzerinden deneyin.
        </p>
      </div>
      <div className="mt-8">
        <MessagingTester />
      </div>
    </div>
  )
}
