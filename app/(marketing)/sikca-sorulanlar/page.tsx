import { FaqPage } from '@/components/marketing/faq-page'
import { buildFaqJsonLd, FAQ_ITEMS } from '@/lib/data/faq'

const faqJsonLd = buildFaqJsonLd(FAQ_ITEMS)

export const metadata = {
  title: 'Sıkça Sorulan Sorular | MOMENTIS',
  description: 'MOMENTIS dijital davetiye, davet sitesi, RSVP, VIP tasarım, paketler ve hesap kullanımı hakkında merak edilenler.',
  alternates: {
    canonical: 'https://momentis.app/sikca-sorulanlar',
  },
}

export default function FrequentlyAskedQuestionsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <FaqPage />
    </>
  )
}
