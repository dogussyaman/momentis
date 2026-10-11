export const SITE_GIFT_CAMPAIGN_ID = 'site-purchase-premium-invitation'
export const SITE_GIFT_STORAGE_KEY = 'momentis:site-gift-campaign:demo:v1'

export const MOCK_GIFT_TEMPLATES = [
  {
    id: 'ivory-elegance',
    title: 'Ivory Elegance',
    description: 'Zamansız serif yazılar ve sıcak fildişi tonları.',
    styleTags: ['Fildişi', 'Şampanya altını'],
    premium: true,
    preview: { background: '#fbf7ee', foreground: '#42362d', accent: '#b69662', secondary: '#eadfc9', ornament: 'frame' },
  },
  {
    id: 'midnight',
    title: 'Midnight',
    description: 'Gece mavisi zemin üzerinde ölçülü altın detaylar.',
    styleTags: ['Gece mavisi', 'Altın'],
    premium: true,
    preview: { background: '#172033', foreground: '#f8f2e6', accent: '#d1b574', secondary: '#27334c', ornament: 'stars' },
  },
  {
    id: 'blush-garden',
    title: 'Blush Garden',
    description: 'Yumuşak pudra renkleri ve botanik çizgiler.',
    styleTags: ['Pudra', 'Botanik'],
    premium: true,
    preview: { background: '#fff3f1', foreground: '#583b3c', accent: '#ba7e7d', secondary: '#f1dcda', ornament: 'flowers' },
  },
  {
    id: 'modern-classic',
    title: 'Modern Classic',
    description: 'Siyah-beyaz kontrast ve sade geometrik çerçeve.',
    styleTags: ['Siyah', 'Beyaz'],
    premium: true,
    preview: { background: '#fffefa', foreground: '#222522', accent: '#4b554f', secondary: '#e9e9e3', ornament: 'lines' },
  },
  {
    id: 'botanical-sage',
    title: 'Botanical Sage',
    description: 'Adaçayı tonlarında doğal ve ferah bir kompozisyon.',
    styleTags: ['Adaçayı yeşili', 'Doğal botanik'],
    premium: true,
    preview: { background: '#f3f6ed', foreground: '#354236', accent: '#718a68', secondary: '#dce6d4', ornament: 'leaves' },
  },
]

function getStorage(storage) {
  if (storage) return storage
  if (typeof window === 'undefined') throw new Error('Demo kampanya yalnızca tarayıcıda kullanılabilir.')
  return window.localStorage
}

function readStore(storage) {
  const raw = getStorage(storage).getItem(SITE_GIFT_STORAGE_KEY)
  if (!raw) return { campaignId: SITE_GIFT_CAMPAIGN_ID, entitlements: {} }
  const store = JSON.parse(raw)
  if (!store || store.campaignId !== SITE_GIFT_CAMPAIGN_ID || !store.entitlements || typeof store.entitlements !== 'object') {
    throw new Error('Demo kampanya kaydı okunamadı.')
  }
  return store
}

function writeStore(store, storage) {
  getStorage(storage).setItem(SITE_GIFT_STORAGE_KEY, JSON.stringify(store))
}

function ineligible(siteEntitlementId = null) {
  return {
    campaignId: SITE_GIFT_CAMPAIGN_ID,
    eligibilityStatus: 'not_eligible',
    siteEntitlementId,
    includedInvitationCount: 1,
    eligibleTemplateIds: [],
    selectedTemplateId: null,
    selectionStatus: 'unavailable',
    createdAt: null,
    mode: 'mock',
  }
}

export async function acquireDemoSiteEntitlement(siteEntitlementId, storage) {
  const id = String(siteEntitlementId || '').trim()
  if (!id) throw new Error('Demo site hakkı kimliği bulunamadı.')

  const store = readStore(storage)
  if (store.entitlements[id]) return store.entitlements[id]

  const entitlement = {
    campaignId: SITE_GIFT_CAMPAIGN_ID,
    eligibilityStatus: 'eligible',
    siteEntitlementId: id,
    includedInvitationCount: 1,
    eligibleTemplateIds: MOCK_GIFT_TEMPLATES.map((template) => template.id),
    selectedTemplateId: null,
    selectionStatus: 'available',
    createdAt: new Date().toISOString(),
    mode: 'mock',
  }
  store.entitlements[id] = entitlement
  writeStore(store, storage)
  return entitlement
}

export async function getEligibility(siteEntitlementId, storage) {
  const id = String(siteEntitlementId || '').trim()
  if (!id) return ineligible()
  return readStore(storage).entitlements[id] || ineligible(id)
}

export async function getEligibleTemplates(siteEntitlementId, storage) {
  const eligibility = await getEligibility(siteEntitlementId, storage)
  if (eligibility.eligibilityStatus !== 'eligible') return []
  const eligibleIds = new Set(eligibility.eligibleTemplateIds)
  return MOCK_GIFT_TEMPLATES.filter((template) => eligibleIds.has(template.id))
}

export async function getSelectedTemplate(templateId, siteEntitlementId, storage) {
  const selection = await getSelectionStatus(siteEntitlementId, storage)
  if (selection.selectionStatus !== 'selected' || selection.selectedTemplateId !== templateId) return null
  const templates = await getEligibleTemplates(siteEntitlementId, storage)
  return templates.find((template) => template.id === templateId) || null
}

export async function selectTemplate(templateId, siteEntitlementId, storage) {
  const id = String(siteEntitlementId || '').trim()
  const template = MOCK_GIFT_TEMPLATES.find((item) => item.id === templateId)
  if (!template) throw new Error('Geçersiz davetiye tasarımı seçildi.')
  if (!id) throw new Error('Demo site hakkı bulunamadı.')

  const store = readStore(storage)
  const entitlement = store.entitlements[id]
  if (!entitlement || entitlement.eligibilityStatus !== 'eligible') {
    throw new Error('Bu demo kayıt ücretsiz davetiye seçimine uygun değil.')
  }
  if (!entitlement.eligibleTemplateIds.includes(templateId)) {
    throw new Error('Bu tasarım kampanya seçkisinde bulunmuyor.')
  }
  if (entitlement.selectionStatus === 'selected' || entitlement.selectedTemplateId) {
    throw new Error('Ücretsiz seçim hakkı daha önce kullanılmış. Demo kuralında seçim değiştirilemiyor.')
  }

  const selected = {
    ...entitlement,
    selectedTemplateId: templateId,
    selectionStatus: 'selected',
  }
  store.entitlements[id] = selected
  writeStore(store, storage)
  return selected
}

export async function getSelectionStatus(siteEntitlementId, storage) {
  return getEligibility(siteEntitlementId, storage)
}
