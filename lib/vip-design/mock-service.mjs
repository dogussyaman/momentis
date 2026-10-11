import { VIP_FORM_OPTIONS, VIP_INVITATION_TEMPLATES, VIP_REQUEST_STATUSES, VIP_SITE_TEMPLATES } from './mock-data.mjs'

export const VIP_REQUEST_STORAGE_KEY = 'momentis:vip-design:mock:v1'

function storageFor(storage) {
  if (storage) return storage
  if (typeof window === 'undefined') throw new Error('VIP demo talepleri yalnızca bu tarayıcı oturumunda kullanılabilir.')
  return window.localStorage
}

function readStore(storage) {
  const raw = storageFor(storage).getItem(VIP_REQUEST_STORAGE_KEY)
  if (!raw) return { version: 1, requests: [] }
  const value = JSON.parse(raw)
  if (value?.version !== 1 || !Array.isArray(value.requests)) throw new Error('VIP demo talep kaydı okunamadı.')
  return value
}

function writeStore(value, storage) {
  storageFor(storage).setItem(VIP_REQUEST_STORAGE_KEY, JSON.stringify(value))
}

function requiredString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} alanı zorunludur.`)
  return value.trim()
}

export async function listVipSiteTemplates() {
  return VIP_SITE_TEMPLATES
}

export async function getVipSiteTemplate(idOrSlug) {
  return VIP_SITE_TEMPLATES.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null
}

export async function listVipInvitationTemplates() {
  return VIP_INVITATION_TEMPLATES
}

export async function getVipDesignRequestFormOptions() {
  return VIP_FORM_OPTIONS
}

export async function createVipDesignRequest(payload, storage) {
  const site = VIP_SITE_TEMPLATES.find((item) => item.id === payload?.selectedSiteTemplateId)
  const invitation = VIP_INVITATION_TEMPLATES.find((item) => item.id === payload?.selectedInvitationTemplateId)
  if (!site) throw new Error('Geçerli bir VIP site konsepti seçin.')
  if (!invitation) throw new Error('Bir hediye davetiye tasarımı seçin.')
  const brideName = requiredString(payload?.eventDetails?.brideName, 'Gelin adı')
  const groomName = requiredString(payload?.eventDetails?.groomName, 'Damat adı')
  const date = requiredString(payload?.eventDetails?.date, 'Etkinlik tarihi')
  const userEmail = requiredString(payload?.userEmail, 'E-posta')
  const now = new Date().toISOString()
  const store = readStore(storage)
  const request = {
    ...payload,
    userId: requiredString(payload?.userId, 'Kullanıcı'),
    userName: String(payload.userName || '').trim(),
    userEmail,
    eventDetails: { ...payload.eventDetails, brideName, groomName, date },
    id: `VIP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: VIP_REQUEST_STATUSES[0].id,
    createdAt: now,
    adminNotes: [],
    timeline: [{ status: VIP_REQUEST_STATUSES[0].id, createdAt: now, note: 'Mock/demo talep tarayıcıya kaydedildi.' }],
  }
  store.requests.unshift(request)
  writeStore(store, storage)
  return request
}

export async function listMyVipDesignRequests(userId, storage) {
  const id = requiredString(userId, 'Kullanıcı')
  return readStore(storage).requests.filter((item) => item.userId === id)
}

export async function getMyVipDesignRequest(requestId, userId, storage) {
  return (await listMyVipDesignRequests(userId, storage)).find((item) => item.id === requestId) || null
}

export async function listAdminVipDesignRequests(filters = {}, storage) {
  let requests = readStore(storage).requests
  if (filters.status && filters.status !== 'all') requests = requests.filter((item) => item.status === filters.status)
  if (filters.query) {
    const query = filters.query.toLocaleLowerCase('tr')
    requests = requests.filter((item) => [item.id, item.userName, item.userEmail].some((value) => String(value || '').toLocaleLowerCase('tr').includes(query)))
  }
  return requests
}

export async function getAdminVipDesignRequest(requestId, storage) {
  return readStore(storage).requests.find((item) => item.id === requestId) || null
}

export async function updateMockVipRequestStatus(requestId, status, note = '', storage) {
  if (!VIP_REQUEST_STATUSES.some((item) => item.id === status)) throw new Error('Geçersiz talep durumu.')
  const store = readStore(storage)
  const index = store.requests.findIndex((item) => item.id === requestId)
  if (index < 0) throw new Error('VIP demo talebi bulunamadı.')
  const previous = store.requests[index]
  const now = new Date().toISOString()
  const updated = {
    ...previous,
    status,
    timeline: [...previous.timeline, { status, createdAt: now, note: note.trim() || 'Mock durum güncellendi.' }],
    adminNotes: note.trim() ? [...previous.adminNotes, { note: note.trim(), createdAt: now }] : previous.adminNotes,
  }
  store.requests[index] = updated
  writeStore(store, storage)
  return updated
}
