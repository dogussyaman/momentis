import { FaqPage } from '@/components/marketing/faq-page'
import { buildFaqJsonLd, FAQ_ITEMS } from '@/lib/data/faq'
import { buildMarketingMetadata } from '@/lib/seo'

const faqJsonLd = buildFaqJsonLd(FAQ_ITEMS)

export const metadata = buildMarketingMetadata({
  title: 'Sıkça Sorulan Sorular | MOMENTIS',
  description: 'MOMENTIS dijital davetiye, davet sitesi, RSVP, VIP tasarım, paketler ve hesap kullanımı hakkında merak edilenler.',
  path: '/sikca-sorulanlar',
})

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
