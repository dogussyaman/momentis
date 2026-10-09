import { BILLING_PLANS } from '@/lib/billing/plans'

export const PACKAGES = Object.values(BILLING_PLANS)

export function formatPrice(price) {
  if (price === 0) return 'Ücretsiz'
  return `₺${new Intl.NumberFormat('tr-TR').format(price)}`
}
