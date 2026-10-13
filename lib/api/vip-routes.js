import crypto from 'node:crypto'
import { GridFSBucket, ObjectId } from 'mongodb'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'
import { canManageAdmin, getAdminAuthorizationError } from '../admin/authorization.js'
import { getRequestKey } from '../billing/usage.js'
import { getNotificationBaseUrl, notifyAdmins, notifyUser, publishNotificationsSafely } from '../notifications/service.js'
import { VIP_CANCELLATION_REASONS, VIP_FORM_OPTIONS, VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES, VIP_STATUS_TRANSITIONS, VIP_WORKFLOW_STATUSES } from '../vip-design/mock-data.mjs'
import { createStarterSite } from '../site-builder/normalize-site.ts'
import {
  chargeVipRequestCredits,
  recordVipRefundDecision,
  refundVipRequestCredits,
  VIP_REQUEST_CREDIT_COST,
  withVipCreditTransaction,
} from '../vip-design/credits.js'

const noId = { projection: { _id: 0 } }
const MAX_BODY_BYTES = 64_000
const MAX_SITE_DATA_BYTES = 512_000
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const MAX_DELIVERY_OUTPUT_BYTES = 10 * 1024 * 1024
const MAX_REQUEST_UPLOAD_BYTES = 8 * MAX_PHOTO_BYTES + 256_000
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const statuses = new Set(VIP_WORKFLOW_STATUSES.map(({ id }) => id))
const adminStatusFilters = new Set(['incoming', 'processing', 'completed', 'summary'])
const statusLabels = Object.fromEntries(VIP_WORKFLOW_STATUSES.map(({ id, label }) => [id, label]))
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const userNameSchema = z.string().trim().max(100)

const requestSchema = z.object({
  selectedSiteTemplateId: z.string().min(1).max(80),
  selectedInvitationTemplateId: z.string().min(1).max(80),
  eventDetails: z.object({
    brideName: z.string().trim().min(1).max(80),
    groomName: z.string().trim().min(1).max(80),
    eventType: z.enum(VIP_FORM_OPTIONS.eventTypes),
    date: z.string().regex(datePattern, 'Etkinlik tarihi YYYY-MM-DD biçiminde olmalıdır'),
    time: z.string().max(5).regex(/^$|^\d{2}:\d{2}$/),
    venue: z.string().trim().min(1).max(160),
    address: z.string().trim().max(240),
    familyInfo: z.string().trim().max(1000),
    invitationText: z.string().trim().max(2000),
  }),
  preferences: z.object({
    colors: z.string().trim().max(200),
    style: z.enum(VIP_FORM_OPTIONS.styles),
    referenceNotes: z.string().trim().max(2000),
    sections: z.array(z.enum(VIP_FORM_OPTIONS.sections)).max(VIP_FORM_OPTIONS.sections.length),
    description: z.string().trim().max(3000),
  }),
  albumPreferences: z.object({
    wantsAlbum: z.boolean(),
    guestPhotoSharing: z.boolean(),
  }),
  uploadedPhotoMetadata: z.array(z.object({
    photoId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
    name: z.string().trim().min(1).max(255),
    type: z.enum(PHOTO_TYPES),
    size: z.number().int().positive().max(MAX_PHOTO_BYTES),
  })).max(8),
}).superRefine((payload, context) => {
  const photoIds = payload.uploadedPhotoMetadata.map(({ photoId }) => photoId)
  if (new Set(photoIds).size !== photoIds.length) {
    context.addIssue({ code: 'custom', path: ['uploadedPhotoMetadata'], message: 'Aynı fotoğraf talebe birden fazla eklenemez' })
  }
})

const adminUpdateSchema = z.object({
  status: z.enum(VIP_WORKFLOW_STATUSES.map(({ id }) => id)).optional(),
  note: z.string().trim().max(1000).optional(),
  cancellationReason: z.enum(VIP_CANCELLATION_REASONS.map(({ id }) => id)).optional(),
}).refine((value) => value.status || value.note, { message: 'Durum veya iç not girilmelidir' })
  .refine((value) => value.status !== 'cancelled' || value.cancellationReason, {
    path: ['cancellationReason'],
    message: 'İptal için gerekçe seçilmelidir',
  })
  .refine((value) => value.status !== 'cancelled' || value.cancellationReason !== 'other' || value.note, {
    path: ['note'],
    message: 'Diğer gerekçesini seçtiğinizde açıklama ekleyin',
  })

const siteDataSchema = z.object({
  siteData: z.record(z.string(), z.unknown()),
})

function buildVipSiteDraft(requestRecord, now) {
  const selectedTemplate = VIP_SITE_TEMPLATES.find((item) => item.id === requestRecord.selectedSiteTemplateId)
  if (!selectedTemplate) throw new Error(`VIP site template not found: ${requestRecord.selectedSiteTemplateId}`)

  const { eventDetails, preferences } = requestRecord
  const slugSuffix = requestRecord.id.toLowerCase().replace(/^vip-/, '')
  const slug = `vip-${slugSuffix}`
  const site = createStarterSite({
    id: `site-${slugSuffix}`,
    userId: requestRecord.user_id,
    title: `${eventDetails.brideName} & ${eventDetails.groomName}`,
    slug,
    status: 'draft',
  })
  site.theme = {
    ...site.theme,
    primaryColor: selectedTemplate.preview.foreground,
    secondaryColor: selectedTemplate.preview.accent,
    accentColor: selectedTemplate.preview.accent,
    backgroundColor: selectedTemplate.preview.background,
    surfaceColor: selectedTemplate.preview.surface,
    textColor: selectedTemplate.preview.foreground,
  }
  site.settings = {
    ...site.settings,
    brideName: eventDetails.brideName,
    groomName: eventDetails.groomName,
    eventDate: eventDetails.time ? `${eventDetails.date}T${eventDetails.time}` : eventDetails.date,
    venueName: eventDetails.venue,
    venueAddress: eventDetails.address,
    seoTitle: `${eventDetails.brideName} & ${eventDetails.groomName} | VIP Davetiye`,
    seoDescription: eventDetails.invitationText || `${eventDetails.venue} etkinliğine davetlisiniz.`,
  }

  const hero = site.sections.find((section) => section.type === 'hero')
  if (hero) {
    hero.props = {
      ...hero.props,
      eyebrow: eventDetails.eventType,
      title: `${eventDetails.brideName} & ${eventDetails.groomName}`,
      subtitle: eventDetails.invitationText || 'Bu özel günü birlikte kutlamak için sizi aramızda görmekten mutluluk duyarız.',
    }
    hero.style = {
      ...hero.style,
      bgType: 'color',
      bgColor: selectedTemplate.preview.background,
      textColor: selectedTemplate.preview.foreground,
      accentColor: selectedTemplate.preview.accent,
    }
  }
  const story = site.sections.find((section) => section.type === 'story')
  if (story) {
    const storyDetails = [
      preferences.description,
      preferences.colors && `Renk tercihi: ${preferences.colors}`,
      eventDetails.familyInfo && `Aile bilgisi: ${eventDetails.familyInfo}`,
    ].filter(Boolean)
    if (storyDetails.length) {
      story.props = { ...story.props, subtitle: storyDetails.join(' · ') }
    }
  }

  return {
    templateId: selectedTemplate.id,
    templateTitle: selectedTemplate.title,
    slug,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    site_data: site,
  }
}

function validateVipSiteData(siteData, siteDraft, userId) {
  if (new TextEncoder().encode(JSON.stringify(siteData)).byteLength > MAX_SITE_DATA_BYTES) {
    return 'VIP site taslağı çok büyük'
  }
  if (
    typeof siteData.title !== 'string' || !siteData.title.trim() || siteData.title.length > 120 ||
    typeof siteData.templateId !== 'string' ||
    !Array.isArray(siteData.sections) || siteData.sections.length < 1 || siteData.sections.length > 40 ||
    !siteData.theme || typeof siteData.theme !== 'object' || Array.isArray(siteData.theme) ||
    !siteData.settings || typeof siteData.settings !== 'object' || Array.isArray(siteData.settings)
  ) {
    return 'VIP site taslağı geçerli değil'
  }
  if (siteData.sections.some((section) =>
    !section || typeof section !== 'object' || typeof section.type !== 'string' ||
    !section.props || typeof section.props !== 'object' || Array.isArray(section.props)
  )) {
    return 'VIP site bölümleri geçerli değil'
  }
  siteData.id = `site-${siteDraft.slug.slice(4)}`
  siteData.userId = userId
  siteData.slug = siteDraft.slug
  siteData.status = siteDraft.status
  siteData.createdAt = siteDraft.site_data.createdAt
  siteData.updatedAt = new Date().toISOString()
  siteDraft.updatedAt = siteData.updatedAt
  siteDraft.site_data = siteData
  return null
}

const transitions = Object.fromEntries(
  Object.entries(VIP_STATUS_TRANSITIONS).map(([status, nextStatuses]) => [status, new Set(nextStatuses)]),
)

const indexPromises = new WeakMap()

async function ensureVipIndexes(db) {
  let promise = indexPromises.get(db)
  if (!promise) {
    promise = Promise.all([
      db.collection('vip_design_requests').createIndex({ id: 1 }, { unique: true }),
      db.collection('vip_design_requests').createIndex(
        { user_id: 1, idempotency_key: 1 },
        { unique: true },
      ),
      db.collection('vip_design_requests').createIndex({ user_id: 1, createdAt: -1 }),
      db.collection('vip_design_requests').createIndex({ status: 1, createdAt: -1 }),
      db.collection('vip_credit_movements').createIndex({ request_id: 1, kind: 1 }, { unique: true }),
      db.collection('vip_credit_movements').createIndex({ user_id: 1, created_at: -1 }),
      db.collection('vip_request_photos.files').createIndex(
        { 'metadata.requestId': 1, 'metadata.photoId': 1 },
        { unique: true },
      ),
    ]).catch((error) => {
      indexPromises.delete(db)
      throw error
    })
    indexPromises.set(db, promise)
  }
  await promise
}

function sameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const parsed = new URL(origin)
    const requestUrl = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
    const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
    const expectedOrigins = new Set([requestUrl.origin])
    const host = forwardedHost || request.headers.get('host')
    const protocol = forwardedProtocol || requestUrl.protocol.slice(0, -1)
    if (host && protocol) expectedOrigins.add(`${protocol}://${host}`)
    return parsed.origin === origin && expectedOrigins.has(parsed.origin)
  } catch {
    return false
  }
}

async function readJson(request, maxBytes = MAX_BODY_BYTES) {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { error: 'İstek gövdesi çok büyük', status: 413 }
  }
  const reader = request.body?.getReader()
  if (!reader) return { error: 'Geçersiz istek gövdesi', status: 400 }
  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return { error: 'İstek gövdesi çok büyük', status: 413 }
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  let body
  try {
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    return { error: 'Geçersiz istek gövdesi', status: 400 }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Geçersiz istek gövdesi', status: 400 }
  return { body }
}

async function readVipSubmission(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data')) {
    const result = await readJson(request)
    return result.error ? result : { body: result.body, files: new Map() }
  }

  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_UPLOAD_BYTES) {
    return { error: 'Toplam görsel yükleme boyutu çok büyük', status: 413 }
  }
  let formData
  try {
    formData = await request.formData()
  } catch {
    return { error: 'Geçersiz çok parçalı istek gövdesi', status: 400 }
  }
  const serialized = formData.get('payload')
  if (typeof serialized !== 'string' || new TextEncoder().encode(serialized).byteLength > MAX_BODY_BYTES) {
    return { error: 'Talep bilgileri geçersiz veya çok büyük', status: 400 }
  }
  let body
  try {
    body = JSON.parse(serialized)
  } catch {
    return { error: 'Geçersiz talep JSON verisi', status: 400 }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Geçersiz istek gövdesi', status: 400 }
  }
  const files = new Map()
  let totalSize = 0
  let payloadCount = 0
  for (const [key, value] of formData.entries()) {
    if (key === 'payload') {
      payloadCount += 1
      continue
    }
    const photoId = key.startsWith('photo:') ? key.slice(6) : ''
    if (!photoId || typeof value !== 'object' || typeof value.stream !== 'function') {
      return { error: 'Geçersiz görsel dosyası', status: 400 }
    }
    if (files.has(photoId)) return { error: 'Bir görsel birden fazla kez gönderildi', status: 400 }
    totalSize += value.size
    if (files.size >= 8 || totalSize > 8 * MAX_PHOTO_BYTES) {
      return { error: 'En fazla 8 görsel ve toplam 80 MB yüklenebilir', status: 413 }
    }
    files.set(photoId, value)
  }
  if (payloadCount !== 1) return { error: 'Talep bilgileri eksik veya birden fazla kez gönderildi', status: 400 }
  return { body, files }
}

function requestHash(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function hasPhotoSignature(bytes, type) {
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (type === 'image/gif') return bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))
  if (type === 'image/webp') return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  return false
}

async function storePhoto(bucket, file, metadata, userId, requestId) {
  if (!PHOTO_TYPES.includes(file.type) || file.size !== metadata.size || file.size > MAX_PHOTO_BYTES) {
    throw new Error('Görsel türü veya boyutu geçersiz')
  }
  if (file.name !== metadata.name || file.type !== metadata.type) {
    throw new Error('Görsel dosyası talep metadata bilgileriyle eşleşmiyor')
  }

  let size = 0
  let signature = Buffer.alloc(0)
  const hash = crypto.createHash('sha256')
  const validator = new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length
      if (size > MAX_PHOTO_BYTES) return callback(Object.assign(new Error('Görsel 10 MB sınırını aşıyor'), { status: 400 }))
      if (signature.length < 12) signature = Buffer.concat([signature, chunk]).subarray(0, 12)
      hash.update(chunk)
      callback(null, chunk)
    },
    flush(callback) {
      if (!hasPhotoSignature(signature, metadata.type)) {
        return callback(Object.assign(new Error('Dosya içeriği seçilen görsel türüyle eşleşmiyor'), { status: 400 }))
      }
      callback()
    },
  })
  const upload = bucket.openUploadStream(metadata.name, {
    contentType: metadata.type,
    metadata: { userId, requestId, photoId: metadata.photoId, name: metadata.name, type: metadata.type, size: metadata.size },
  })
  try {
    await pipeline(Readable.fromWeb(file.stream()), validator, upload)
  } catch (error) {
    await upload.abort()
    throw error
  }
  if (size !== metadata.size) {
    await bucket.delete(upload.id)
    throw Object.assign(new Error('Yüklenen görselin boyutu değişti'), { status: 400 })
  }
  return { fileId: upload.id.toString(), sha256: hash.digest('hex') }
}

async function deleteUploadedPhotos(bucket, files) {
  for (const { fileId } of files) {
    await bucket.delete(new ObjectId(fileId))
  }
}

function publicRequest(request) {
  const {
    user_id,
    user_snapshot,
    idempotency_key,
    request_hash,
    internal_notes,
    audit_trail,
    site_draft,
    delivery_outputs,
    vip_credit,
    cancellation_decision,
    ...visible
  } = request
  const refundReason = vip_credit?.refund_reason
  const cancellationReason = cancellation_decision?.reason
  const cancellationLabel = VIP_CANCELLATION_REASONS.find(({ id }) => id === cancellationReason)?.label
  return {
    ...visible,
    creditStatus: vip_credit ? {
      charged: vip_credit.charged_amount || 0,
      refunded: vip_credit.refunded_amount || 0,
      refundStatus: vip_credit.refund_status || 'not_refunded',
      refundReason: refundReason?.startsWith('production_started_non_refundable:')
        ? `Üretim başladıktan sonraki iptallerde iade yapılmaz. Gerekçe: ${cancellationLabel || 'Diğer'}`
        : refundReason?.startsWith('vip_request_cancelled:')
          ? `Üretim öncesi iptal nedeniyle kredi iade edildi. Gerekçe: ${cancellationLabel || 'Diğer'}`
          : refundReason === 'vip_request_rejected'
            ? 'Talep reddedildiği için kredi iade edildi.'
            : refundReason === 'no_vip_credit_charge_to_refund'
              ? 'Bu kayıt için iade edilebilir kredi düşümü bulunamadı.'
              : null,
    } : { charged: 0, refunded: 0, refundStatus: 'not_charged', refundReason: null },
    cancellationStatus: cancellation_decision ? {
      reason: cancellationLabel || 'Diğer',
      refundStatus: cancellation_decision.refund_status,
      refunded: cancellation_decision.refunded_amount || 0,
    } : null,
    publishedSite: request.site_draft?.status === 'published'
      ? { slug: request.site_draft.slug, title: request.site_draft.site_data?.title || '' }
      : null,
    giftInvitationOutput: delivery_outputs?.gift_invitation ? {
      name: delivery_outputs.gift_invitation.name,
      type: delivery_outputs.gift_invitation.type,
      size: delivery_outputs.gift_invitation.size,
      uploadedAt: delivery_outputs.gift_invitation.uploaded_at,
    } : null,
    timeline: (visible.timeline || []).map(({ status, createdAt }) => ({ status, createdAt })),
    uploadedPhotoMetadata: (visible.uploadedPhotoMetadata || []).map(({ fileId, sha256, ...photo }) => ({
      ...photo,
      uploaded: Boolean(fileId),
    })),
  }
}

function adminRequest(request, { includeSiteDraft = false } = {}) {
  const { user_id, idempotency_key, request_hash, site_draft, delivery_outputs, ...visible } = request
  return {
    ...visible,
    ...(delivery_outputs?.gift_invitation ? {
      gift_invitation_output: {
        name: delivery_outputs.gift_invitation.name,
        type: delivery_outputs.gift_invitation.type,
        size: delivery_outputs.gift_invitation.size,
        uploaded_at: delivery_outputs.gift_invitation.uploaded_at,
        uploaded_by: delivery_outputs.gift_invitation.uploaded_by,
      },
    } : {}),
    ...(includeSiteDraft && site_draft ? { site_draft } : {}),
    uploadedPhotoMetadata: (visible.uploadedPhotoMetadata || []).map(({ fileId, sha256, ...photo }) => ({
      ...photo,
      uploaded: Boolean(fileId),
    })),
  }
}

function isValidDeliveryOutput(bytes, type) {
  if (type === 'application/pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-'
  return hasPhotoSignature(bytes, type)
}

async function storeDeliveryOutput(bucket, file, requestId, userId) {
  if (
    file.size < 1 ||
    file.size > MAX_DELIVERY_OUTPUT_BYTES ||
    !['application/pdf', ...PHOTO_TYPES].includes(file.type)
  ) {
    throw Object.assign(new Error('Hediye davetiye çıktısı PDF veya görsel olmalı ve 10 MB sınırını aşmamalıdır'), { status: 400 })
  }
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.length !== file.size || !isValidDeliveryOutput(bytes, file.type)) {
    throw Object.assign(new Error('Dosya içeriği seçilen çıktı türüyle eşleşmiyor'), { status: 400 })
  }
  const hash = crypto.createHash('sha256').update(bytes).digest('hex')
  const upload = bucket.openUploadStream(file.name, {
    contentType: file.type,
    metadata: { requestId, userId, kind: 'gift_invitation', sha256: hash },
  })
  try {
    await pipeline(Readable.from(bytes), upload)
  } catch (error) {
    await upload.abort()
    throw error
  }
  return {
    fileId: upload.id.toString(),
    sha256: hash,
    name: file.name.slice(0, 255),
    type: file.type,
    size: bytes.length,
    uploaded_at: new Date(),
    uploaded_by: userId,
  }
}

function requestIdFromRoute(route) {
  const match = route.match(/^\/(?:vip\/requests|admin\/vip-requests)\/([A-Za-z0-9_-]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

function validateCalendarDate(value) {
  if (!datePattern.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= daysPerMonth[month - 1]
}

function errorResponse(message, status) {
  return Response.json({ error: message }, { status })
}

function downloadResponse(bucket, file) {
  const filename = encodeURIComponent(file.metadata.name).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
  return new Response(Readable.toWeb(bucket.openDownloadStream(file._id)), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      'Content-Type': file.metadata.type,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function handleVipRoutes({ db, route, method, request, user, photoBucket: injectedPhotoBucket }) {
  if (route === '/vip/site-templates' && method === 'GET') {
    return Response.json({ items: VIP_SITE_TEMPLATES }, { headers: { 'Cache-Control': 'public, max-age=300' } })
  }
  if (route === '/vip/invitation-templates' && method === 'GET') {
    return Response.json({ items: VIP_INVITATION_TEMPLATES }, { headers: { 'Cache-Control': 'public, max-age=300' } })
  }
  if (route === '/vip/options' && method === 'GET') {
    return Response.json(VIP_FORM_OPTIONS, { headers: { 'Cache-Control': 'public, max-age=300' } })
  }

  const adminPhotoMatch = route.match(/^\/admin\/vip-requests\/([A-Za-z0-9_-]+)\/photos\/([A-Za-z0-9_-]+)$/)
  if (adminPhotoMatch && method === 'GET') {
    const authorizationError = getAdminAuthorizationError(user, method)
    if (authorizationError) return errorResponse(authorizationError.error, authorizationError.status)
    await ensureVipIndexes(db)
    const requestRecord = await db.collection('vip_design_requests').findOne({ id: adminPhotoMatch[1] }, noId)
    const photo = requestRecord?.uploadedPhotoMetadata?.find((item) => item.photoId === adminPhotoMatch[2] && item.fileId)
    if (!photo) return errorResponse('VIP talep görseli bulunamadı', 404)
    const bucket = injectedPhotoBucket || new GridFSBucket(db, { bucketName: 'vip_request_photos' })
    return downloadResponse(bucket, { _id: new ObjectId(photo.fileId), metadata: { name: photo.name, type: photo.type } })
  }

  const adminList = route === '/admin/vip-requests'
  const adminDraftMatch = route.match(/^\/admin\/vip-requests\/([A-Za-z0-9_-]+)\/site-draft$/)
  const adminPublishMatch = route.match(/^\/admin\/vip-requests\/([A-Za-z0-9_-]+)\/site-draft\/publish$/)
  const adminDeliveryMatch = route.match(/^\/admin\/vip-requests\/([A-Za-z0-9_-]+)\/delivery\/invitation$/)
  const customerDeliveryMatch = route.match(/^\/vip\/requests\/([A-Za-z0-9_-]+)\/delivery\/invitation$/)
  const adminId = adminDraftMatch?.[1] || adminPublishMatch?.[1] || adminDeliveryMatch?.[1] ||
    (route.startsWith('/admin/vip-requests/') ? requestIdFromRoute(route) : null)
  if (adminList || adminId) {
    const authorizationError = getAdminAuthorizationError(user, method)
    if (authorizationError) return errorResponse(authorizationError.error, authorizationError.status)
    await ensureVipIndexes(db)

    if (adminDeliveryMatch && method === 'GET') {
      const item = await db.collection('vip_design_requests').findOne({ id: adminId }, noId)
      const output = item?.delivery_outputs?.gift_invitation
      if (!output) return errorResponse('Hediye davetiye çıktısı bulunamadı', 404)
      const bucket = injectedPhotoBucket || new GridFSBucket(db, { bucketName: 'vip_delivery_outputs' })
      return downloadResponse(bucket, {
        _id: new ObjectId(output.fileId),
        metadata: { name: output.name, type: output.type },
      })
    }

    if (adminDeliveryMatch && method === 'POST') {
      if (!canManageAdmin(user)) return errorResponse('Bu işlem için admin yetkisi gerekli', 403)
      if (!sameOrigin(request)) return errorResponse('İstek kaynağı doğrulanamadı', 403)
      const collection = db.collection('vip_design_requests')
      const current = await collection.findOne({ id: adminId }, noId)
      if (!current) return errorResponse('VIP talebi bulunamadı', 404)
      if (current.delivery_outputs?.gift_invitation) {
        return Response.json({ request: adminRequest(current), idempotent: true }, { headers: { 'Cache-Control': 'no-store' } })
      }
      if (current.status !== 'in_progress') return errorResponse('Hediye davetiye çıktısı yalnızca üretimdeki taleplere eklenebilir', 409)
      const contentLength = Number(request.headers.get('content-length'))
      if (Number.isFinite(contentLength) && contentLength > MAX_DELIVERY_OUTPUT_BYTES + 256_000) {
        return errorResponse('Hediye davetiye çıktısı isteği çok büyük', 413)
      }
      let formData
      try {
        formData = await request.formData()
      } catch {
        return errorResponse('Hediye davetiye dosyası okunamadı', 400)
      }
      const file = formData.get('file')
      if (typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
        return errorResponse('Hediye davetiye çıktısı dosyası zorunludur', 400)
      }
      const bucket = injectedPhotoBucket || new GridFSBucket(db, { bucketName: 'vip_delivery_outputs' })
      let output
      try {
        output = await storeDeliveryOutput(bucket, file, adminId, user.id)
      } catch (error) {
        if (error?.status === 400) return errorResponse(error.message, 400)
        throw error
      }
      const now = new Date()
      const saved = await collection.updateOne(
        { id: adminId, status: 'in_progress', 'delivery_outputs.gift_invitation': { $exists: false } },
        {
          $set: { 'delivery_outputs.gift_invitation': output, updatedAt: now },
          $push: {
            audit_trail: {
              actor_id: user.id,
              actor_role: user.role,
              action: 'gift_invitation_output.uploaded',
              previous_status: current.status,
              next_status: current.status,
              created_at: now,
              output_sha256: output.sha256,
            },
          },
        },
      )
      if (!saved.modifiedCount) {
        await bucket.delete(new ObjectId(output.fileId))
        const updated = await collection.findOne({ id: adminId }, noId)
        if (updated?.delivery_outputs?.gift_invitation) {
          return Response.json({ request: adminRequest(updated), idempotent: true }, { headers: { 'Cache-Control': 'no-store' } })
        }
        return errorResponse('Talep eşzamanlı değişti; sayfayı yenileyin', 409)
      }
      const updated = await collection.findOne({ id: adminId }, noId)
      return Response.json({ request: adminRequest(updated) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (adminList && method === 'GET') {
      const url = new URL(request.url)
      const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10)
      const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10)
      const page = Number.isInteger(requestedPage) ? Math.max(1, requestedPage) : 1
      const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20
      const status = url.searchParams.get('status')
      const query = (url.searchParams.get('q') || '').trim().slice(0, 100)
      if (status && status !== 'all' && !statuses.has(status) && !adminStatusFilters.has(status)) return errorResponse('Geçersiz talep durumu', 400)
      const baseFilter = {}
      if (query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const expression = new RegExp(escaped, 'i')
        baseFilter.$or = [
          { id: expression },
          { 'user_snapshot.name': expression },
          { 'user_snapshot.email': expression },
          { 'eventDetails.brideName': expression },
          { 'eventDetails.groomName': expression },
        ]
      }
      const collection = db.collection('vip_design_requests')
      if (status === 'summary') {
        const [incoming, processing, completed, total] = await Promise.all([
          collection.countDocuments({ ...baseFilter, status: 'pending' }),
          collection.countDocuments({ ...baseFilter, status: { $in: ['approved', 'in_progress'] } }),
          collection.countDocuments({ ...baseFilter, status: { $in: ['delivered', 'rejected'] } }),
          collection.countDocuments(baseFilter),
        ])
        return Response.json({ counts: { incoming, processing, completed, all: total } }, { headers: { 'Cache-Control': 'no-store' } })
      }
      const filter = { ...baseFilter }
      if (status === 'incoming') filter.status = 'pending'
      else if (status === 'processing') filter.status = { $in: ['approved', 'in_progress'] }
      else if (status === 'completed') filter.status = { $in: ['delivered', 'rejected', 'cancelled'] }
      else if (status && status !== 'all') filter.status = status
      const [items, total] = await Promise.all([
        collection.find(filter, noId).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
        collection.countDocuments(filter),
      ])
      return Response.json({
        items: items.map(adminRequest),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (adminId && !adminDraftMatch && !adminPublishMatch && !adminDeliveryMatch && method === 'GET') {
      const item = await db.collection('vip_design_requests').findOne({ id: adminId }, noId)
      if (!item) return errorResponse('VIP talebi bulunamadı', 404)
      const escapedId = adminId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const [creditMovements, emailNotifications] = await Promise.all([
        db.collection('vip_credit_movements').find({ request_id: adminId }, noId).sort({ created_at: 1 }).toArray(),
        db.collection('notifications').find(
          { event_id: new RegExp(`^vip:${escapedId}:`) },
          { projection: { _id: 0, id: 1, event_id: 1, recipient_id: 1, audience: 1, title: 1, created_at: 1, email: 1 } },
        ).sort({ created_at: 1 }).toArray(),
      ])
      return Response.json({
        request: {
          ...adminRequest(item, { includeSiteDraft: true }),
          credit_movements: creditMovements,
          email_notifications: emailNotifications,
        },
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (adminDraftMatch && method === 'POST') {
      if (!canManageAdmin(user)) return errorResponse('Bu işlem için admin yetkisi gerekli', 403)
      if (!sameOrigin(request)) return errorResponse('İstek kaynağı doğrulanamadı', 403)
      const collection = db.collection('vip_design_requests')
      const current = await collection.findOne({ id: adminId }, noId)
      if (!current) return errorResponse('VIP talebi bulunamadı', 404)
      if (!['approved', 'in_progress'].includes(current.status)) {
        return errorResponse('VIP taslağı oluşturmak için talep onaylanmış olmalıdır', 409)
      }
      if (current.site_draft) {
        return Response.json({ request: adminRequest(current, { includeSiteDraft: true }), idempotent: true }, { headers: { 'Cache-Control': 'no-store' } })
      }
      const now = new Date()
      const siteDraft = buildVipSiteDraft(current, now)
      const saved = await collection.updateOne(
        { id: adminId, status: current.status, site_draft: { $exists: false } },
        {
          $set: { site_draft: siteDraft, updatedAt: now },
          $push: {
            audit_trail: {
              actor_id: user.id,
              actor_role: user.role,
              action: 'site_draft.created',
              previous_status: current.status,
              next_status: current.status,
              created_at: now,
              site_slug: siteDraft.slug,
            },
          },
        },
      )
      const updated = await collection.findOne({ id: adminId }, noId)
      if (!updated?.site_draft) return errorResponse('VIP talep eşzamanlı değişti; talebi yenileyin', 409)
      return Response.json({
        request: adminRequest(updated, { includeSiteDraft: true }),
        idempotent: !saved.modifiedCount,
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (adminDraftMatch && method === 'PATCH') {
      if (!canManageAdmin(user)) return errorResponse('Bu işlem için admin yetkisi gerekli', 403)
      if (!sameOrigin(request)) return errorResponse('İstek kaynağı doğrulanamadı', 403)
      const parsedBody = await readJson(request, MAX_SITE_DATA_BYTES)
      if (parsedBody.error) return errorResponse(parsedBody.error, parsedBody.status)
      const parsed = siteDataSchema.safeParse(parsedBody.body)
      if (!parsed.success) return errorResponse('VIP site taslağı geçerli değil', 400)
      const collection = db.collection('vip_design_requests')
      const current = await collection.findOne({ id: adminId }, noId)
      if (!current?.site_draft) return errorResponse('VIP site taslağı bulunamadı', 404)
      if (current.status === 'rejected' && current.site_draft.status === 'draft') {
        return errorResponse('Reddedilen VIP talebin taslağı düzenlenemez', 409)
      }
      const siteDraft = structuredClone(current.site_draft)
      const validationError = validateVipSiteData(parsed.data.siteData, siteDraft, current.user_id)
      if (validationError) return errorResponse(validationError, 400)
      const now = new Date()
      const saved = await collection.updateOne(
        { id: adminId, 'site_draft.updatedAt': current.site_draft.updatedAt },
        {
          $set: { site_draft: siteDraft, updatedAt: now },
          $push: {
            audit_trail: {
              actor_id: user.id,
              actor_role: user.role,
              action: 'site_draft.updated',
              previous_status: current.status,
              next_status: current.status,
              created_at: now,
              site_slug: siteDraft.slug,
            },
          },
        },
      )
      if (!saved.modifiedCount) return errorResponse('VIP taslağı eşzamanlı değişti; sayfayı yenileyin', 409)
      const updated = await collection.findOne({ id: adminId }, noId)
      return Response.json({ request: adminRequest(updated, { includeSiteDraft: true }) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (adminPublishMatch && method === 'POST') {
      if (!canManageAdmin(user)) return errorResponse('Bu işlem için admin yetkisi gerekli', 403)
      if (!sameOrigin(request)) return errorResponse('İstek kaynağı doğrulanamadı', 403)
      const collection = db.collection('vip_design_requests')
      const current = await collection.findOne({ id: adminId }, noId)
      if (!current) return errorResponse('VIP talebi bulunamadı', 404)
      if (!current.site_draft) return errorResponse('Önce VIP site taslağı oluşturun', 409)
      if (current.site_draft.status === 'published') {
        return Response.json({ request: adminRequest(current, { includeSiteDraft: true }), idempotent: true }, { headers: { 'Cache-Control': 'no-store' } })
      }
      if (current.status !== 'in_progress') return errorResponse('Yayınlamak için talep üretimde olmalıdır', 409)

      const now = new Date()
      const siteDraft = {
        ...current.site_draft,
        status: 'published',
        updatedAt: now,
        site_data: {
          ...current.site_draft.site_data,
          status: 'published',
          updatedAt: now.toISOString(),
        },
      }
      const saved = await collection.updateOne(
        {
          id: adminId,
          status: 'in_progress',
          'site_draft.status': 'draft',
          'site_draft.updatedAt': current.site_draft.updatedAt,
        },
        {
          $set: { site_draft: siteDraft, updatedAt: now },
          $push: {
            audit_trail: {
              actor_id: user.id,
              actor_role: user.role,
              action: 'site_draft.published',
              previous_status: 'in_progress',
              next_status: 'in_progress',
              created_at: now,
              site_slug: siteDraft.slug,
            },
          },
        },
      )
      if (!saved.modifiedCount) return errorResponse('VIP talep veya taslak eşzamanlı değişti; sayfayı yenileyin', 409)
      const updated = await collection.findOne({ id: adminId }, noId)
      const baseUrl = getNotificationBaseUrl(request)
      await publishNotificationsSafely('vip-site-published', () => Promise.all([
        notifyUser(db, {
          id: current.user_id,
          email: current.user_snapshot?.email,
        }, {
          eventId: `vip:${adminId}:site-published`,
          type: 'vip_status',
          title: 'VIP site çıktınız hazır',
          message: 'VIP site çıktınız yayınlandı. Hediye davetiye çıktısı da tamamlandığında talebiniz teslim edilecek.',
          href: `/d/${siteDraft.slug}`,
          emailTemplate: 'vipStatusCustomer',
        }, { baseUrl }),
        notifyAdmins(db, {
          eventId: `vip:${adminId}:site-published:admin`,
          type: 'vip_status',
          title: 'VIP site çıktısı yayınlandı',
          message: `${adminId} numaralı talebin site çıktısı yayınlandı; hediye davetiye çıktısı teslimat için bekleniyor.`,
          href: `/panel/admin/vip-talepler/${adminId}`,
          email: false,
        }, { baseUrl }),
      ]))
      return Response.json({ request: adminRequest(updated, { includeSiteDraft: true }) }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (adminId && !adminDraftMatch && !adminPublishMatch && !adminDeliveryMatch && method === 'PATCH') {
      if (!canManageAdmin(user)) return errorResponse('Bu işlem için admin yetkisi gerekli', 403)
      if (!sameOrigin(request)) return errorResponse('İstek kaynağı doğrulanamadı', 403)
      const parsedBody = await readJson(request)
      if (parsedBody.error) return errorResponse(parsedBody.error, parsedBody.status)
      const parsed = adminUpdateSchema.safeParse(parsedBody.body)
      if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || 'Geçersiz talep güncellemesi', 400)

      const collection = db.collection('vip_design_requests')
      const { status: nextStatus, note = '' } = parsed.data
      const now = new Date()
      let transitionResult
      try {
        transitionResult = await withVipCreditTransaction(db, async (session) => {
          const current = await collection.findOne({ id: adminId }, { ...noId, session })
          if (!current) {
            const error = new Error('VIP talebi bulunamadı')
            error.status = 404
            throw error
          }
          if (nextStatus && nextStatus !== current.status && !transitions[current.status]?.has(nextStatus)) {
            const error = new Error(`Geçersiz durum geçişi: ${statusLabels[current.status]} → ${statusLabels[nextStatus]}`)
            error.status = 409
            throw error
          }
          if (nextStatus === current.status && !note) {
            return { current, idempotent: true, creditDecision: null }
          }
          if (
            nextStatus === 'delivered' &&
            (current.site_draft?.status !== 'published' || !current.delivery_outputs?.gift_invitation?.fileId)
          ) {
            const error = new Error('Teslimat için VIP site yayınlanmış ve hediye davetiye çıktısı yüklenmiş olmalıdır')
            error.status = 409
            throw error
          }

          const changedStatus = Boolean(nextStatus && nextStatus !== current.status)
          const status = nextStatus || current.status
          const auditEntry = {
            actor_id: user.id,
            actor_role: user.role,
            action: changedStatus ? 'status.updated' : 'note.added',
            previous_status: current.status,
            next_status: status,
            created_at: now,
          }
          const update = {
            $set: { updatedAt: now },
            $push: { audit_trail: auditEntry },
          }
          if (changedStatus) {
            update.$set.status = status
            update.$push.timeline = { status, createdAt: now, actorId: user.id }
          }
          if (status === 'in_progress' && changedStatus) update.$set.production_started_at = now
          if (note) {
            update.$push.internal_notes = { note, actorId: user.id, createdAt: now }
            auditEntry.internal_note = note
          }

          let creditDecision = null
          if (changedStatus && ['rejected', 'cancelled'].includes(status)) {
            const cancellationReason = status === 'cancelled' ? parsed.data.cancellationReason : 'request_rejected'
            const shouldRefund = status === 'rejected' || current.status !== 'in_progress'
            let refundStatus
            let refundedAmount = 0
            let reason
            if (shouldRefund && current.vip_credit?.charged_amount === VIP_REQUEST_CREDIT_COST) {
              refundedAmount = await refundVipRequestCredits(db, {
                request: current,
                reason: status === 'rejected' ? 'vip_request_rejected' : `vip_request_cancelled:${cancellationReason}`,
                admin: user,
                now,
                session,
              })
              refundStatus = 'refunded'
              reason = status === 'rejected' ? 'vip_request_rejected' : `vip_request_cancelled:${cancellationReason}`
            } else {
              const afterProduction = status === 'cancelled' && current.status === 'in_progress'
              refundStatus = afterProduction ? 'not_refunded_after_production' : 'not_applicable'
              reason = afterProduction
                ? `production_started_non_refundable:${cancellationReason}`
                : 'no_vip_credit_charge_to_refund'
              await recordVipRefundDecision(db, {
                request: current,
                reason,
                admin: user,
                now,
                session,
              })
            }
            const credit = {
              ...(current.vip_credit || {}),
              charged_amount: current.vip_credit?.charged_amount || 0,
              refunded_amount: refundedAmount,
              refund_status: refundStatus,
              refund_reason: reason,
              refund_admin_id: user.id,
              refunded_at: now,
            }
            update.$set.vip_credit = credit
            update.$push.audit_trail.refund_status = refundStatus
            update.$push.audit_trail.refund_amount = refundedAmount
            update.$push.audit_trail.cancellation_reason = cancellationReason
            if (status === 'cancelled') {
              update.$set.cancellation_decision = {
                reason: cancellationReason,
                refund_status: refundStatus,
                refunded_amount: refundedAmount,
                decided_by: user.id,
                decided_at: now,
                policy: !shouldRefund ? 'no_refund_after_production_started' : null,
              }
            }
            creditDecision = { refundStatus, refundedAmount, reason, cancellationReason }
          }

          const saved = await collection.updateOne({ id: adminId, status: current.status }, update, { session })
          if (!saved.modifiedCount) {
            const error = new Error('Talep eşzamanlı değişti; sayfayı yenileyin')
            error.status = 409
            throw error
          }
          const updated = await collection.findOne({ id: adminId }, { ...noId, session })
          return { current, updated, idempotent: false, creditDecision }
        })
      } catch (error) {
        if (error?.status) return errorResponse(error.message, error.status)
        if (error?.code === 'VIP_REFUND_UNAVAILABLE' || error?.code === 'VIP_REFUND_SOURCE_MISSING') {
          return errorResponse('Talebin kredi iadesi doğrulanamadı; durum değiştirilmedi', 409)
        }
        if (error?.code === 'VIP_CREDIT_CONFLICT') {
          return errorResponse(error.message, 409)
        }
        throw error
      }
      const { current, updated } = transitionResult
      if (transitionResult.idempotent) {
        return Response.json({ request: adminRequest(current, { includeSiteDraft: true }), idempotent: true }, { headers: { 'Cache-Control': 'no-store' } })
      }
      if (nextStatus && nextStatus !== current.status) {
        const statusLabel = statusLabels[nextStatus]
        const baseUrl = getNotificationBaseUrl(request)
        await publishNotificationsSafely('vip-request-status-updated', () => Promise.all([
          notifyUser(db, {
            id: current.user_id,
            email: current.user_snapshot?.email,
          }, {
            eventId: `vip:${adminId}:status:${nextStatus}`,
            type: 'vip_status',
            title: `VIP talebiniz: ${statusLabel}`,
            message: `VIP tasarım talebinizin aşaması "${statusLabel}" olarak güncellendi.`,
            href: `/panel/vip-taleplerim/${adminId}`,
            emailTemplate: 'vipStatusCustomer',
          }, { baseUrl }),
          notifyAdmins(db, {
            eventId: `vip:${adminId}:admin-status:${nextStatus}`,
            type: 'vip_status',
            title: `VIP talep aşaması güncellendi`,
            message: `${current.user_snapshot?.name || 'Bir kullanıcı'} kullanıcısının ${adminId} numaralı talebi "${statusLabel}" aşamasına geçti.`,
            href: `/panel/admin/vip-talepler/${adminId}`,
            emailTemplate: 'vipStatusAdmin',
          }, { baseUrl }),
        ]))
        if (transitionResult.creditDecision) {
          const decision = transitionResult.creditDecision
          const message = decision.refundedAmount
            ? `VIP talebiniz ${decision.refundedAmount} kredi iadesiyle sonuçlandırıldı.`
            : decision.refundStatus === 'not_refunded_after_production'
              ? 'Üretim başladıktan sonra talep iptal edildi; iş politikası gereği kredi iadesi yapılmadı.'
              : 'Bu talep için iade edilebilir VIP kredi kaydı bulunmadığından iade yapılmadı.'
          await publishNotificationsSafely('vip-credit-decision', () => Promise.all([
            notifyUser(db, { id: current.user_id, email: current.user_snapshot?.email }, {
              eventId: `vip:${adminId}:credit-decision:user`,
              type: 'vip_credit',
              title: decision.refundedAmount ? 'VIP kredileriniz iade edildi' : 'VIP kredi iadesi yapılmadı',
              message,
              href: `/panel/vip-taleplerim/${adminId}`,
              emailTemplate: 'vipStatusCustomer',
            }, { baseUrl }),
            notifyAdmins(db, {
              eventId: `vip:${adminId}:credit-decision:admin`,
              type: 'vip_credit',
              title: decision.refundedAmount ? 'VIP kredisi iade edildi' : 'VIP kredi iadesi yapılmadı',
              message: `${adminId} numaralı talep: ${message}`,
              href: `/panel/admin/vip-talepler/${adminId}`,
              emailTemplate: 'vipStatusAdmin',
            }, { baseUrl }),
          ]))
        }
      }
      return Response.json({ request: adminRequest(updated, { includeSiteDraft: true }) }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return errorResponse('VIP yönetim rotası bulunamadı', 404)
  }

  const customerPhotoMatch = route.match(/^\/vip\/requests\/([A-Za-z0-9_-]+)\/photos\/([A-Za-z0-9_-]+)$/)
  const customerRequestId = customerDeliveryMatch?.[1] ||
    (route.startsWith('/vip/requests/') ? requestIdFromRoute(route) : null)
  if (route !== '/vip/requests' && !customerRequestId && !customerPhotoMatch) return null
  if (!user?.id) return errorResponse('Oturum gerekli', 401)
  await ensureVipIndexes(db)

  if (customerPhotoMatch && method === 'GET') {
    const requestRecord = await db.collection('vip_design_requests').findOne({
      id: customerPhotoMatch[1],
      user_id: user.id,
    }, noId)
    const photo = requestRecord?.uploadedPhotoMetadata?.find((item) => item.photoId === customerPhotoMatch[2] && item.fileId)
    if (!photo) return errorResponse('VIP talep görseli bulunamadı', 404)
    const bucket = injectedPhotoBucket || new GridFSBucket(db, { bucketName: 'vip_request_photos' })
    return downloadResponse(bucket, { _id: new ObjectId(photo.fileId), metadata: { name: photo.name, type: photo.type } })
  }

  if (customerDeliveryMatch && method === 'GET') {
    const requestRecord = await db.collection('vip_design_requests').findOne({
      id: customerDeliveryMatch[1],
      user_id: user.id,
    }, noId)
    const output = requestRecord?.delivery_outputs?.gift_invitation
    if (requestRecord?.status !== 'delivered' || !output) return errorResponse('Hediye davetiye çıktısı bulunamadı', 404)
    const bucket = injectedPhotoBucket || new GridFSBucket(db, { bucketName: 'vip_delivery_outputs' })
    return downloadResponse(bucket, {
      _id: new ObjectId(output.fileId),
      metadata: { name: output.name, type: output.type },
    })
  }

  if (route === '/vip/requests' && method === 'POST') {
    if (!sameOrigin(request)) return errorResponse('İstek kaynağı doğrulanamadı', 403)
    const idempotencyKey = getRequestKey(request)
    if (!idempotencyKey) return errorResponse('Talep gönderimi için Idempotency-Key başlığı zorunludur', 400)
    const parsedBody = await readVipSubmission(request)
    if (parsedBody.error) return errorResponse(parsedBody.error, parsedBody.status)
    const parsed = requestSchema.safeParse(parsedBody.body)
    if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message || 'Talep bilgileri geçersiz', 400)
    const payload = parsed.data
    if (!validateCalendarDate(payload.eventDetails.date)) return errorResponse('Geçerli bir etkinlik tarihi girin', 400)
    if (!VIP_SITE_TEMPLATES.some((item) => item.id === payload.selectedSiteTemplateId)) {
      return errorResponse('Geçerli bir VIP site konsepti seçin', 400)
    }
    if (!VIP_INVITATION_TEMPLATES.some((item) => item.id === payload.selectedInvitationTemplateId)) {
      return errorResponse('Geçerli bir hediye davetiye tasarımı seçin', 400)
    }
    if (parsedBody.files.size !== payload.uploadedPhotoMetadata.length ||
      payload.uploadedPhotoMetadata.some((photo) => !parsedBody.files.has(photo.photoId))) {
      return errorResponse('Talebe eklenen her fotoğrafın dosyasını da gönderin', 400)
    }
    for (const photo of payload.uploadedPhotoMetadata) {
      const file = parsedBody.files.get(photo.photoId)
      if (!file || file.name !== photo.name || file.type !== photo.type || file.size !== photo.size) {
        return errorResponse('Fotoğraf dosyası talep bilgileriyle eşleşmiyor', 400)
      }
    }
    const hash = requestHash(payload)
    const collection = db.collection('vip_design_requests')
    const existing = await collection.findOne({ user_id: user.id, idempotency_key: idempotencyKey }, noId)
    if (existing) {
      if (existing.request_hash !== hash) return errorResponse('Bu istek anahtarı farklı bir talep için kullanılmış', 409)
      const baseUrl = getNotificationBaseUrl(request)
      await publishNotificationsSafely('vip-request-created-retry', () => Promise.all([
        notifyUser(db, { id: user.id, email: user.email }, {
          eventId: `vip:${existing.id}:created:user`,
          type: 'vip_request',
          title: 'VIP tasarım talebiniz alındı',
          message: 'Talebiniz ekibimize ulaştı. Talep aşamalarını panelinizden takip edebilirsiniz.',
          href: `/panel/vip-taleplerim/${existing.id}`,
          emailTemplate: 'vipRequestCustomer',
        }, { baseUrl }),
        notifyAdmins(db, {
          eventId: `vip:${existing.id}:created:admin`,
          type: 'vip_request',
          title: 'Yeni VIP tasarım talebi',
          message: `${existing.user_snapshot?.name || existing.user_snapshot?.email || 'Bir kullanıcı'} yeni bir VIP tasarım talebi gönderdi.`,
          href: `/panel/admin/vip-talepler/${existing.id}`,
          emailTemplate: 'vipRequestAdmin',
        }, { baseUrl }),
      ]))
      return Response.json({ request: publicRequest(existing), idempotent: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const now = new Date()
    const userName = typeof user.name === 'string' ? user.name : ''
    const id = `VIP-${now.getUTCFullYear()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
    const bucket = payload.uploadedPhotoMetadata.length
      ? (injectedPhotoBucket || new GridFSBucket(db, { bucketName: 'vip_request_photos' }))
      : null
    const storedPhotos = []
    try {
      for (const photo of payload.uploadedPhotoMetadata) {
        const stored = await storePhoto(bucket, parsedBody.files.get(photo.photoId), photo, user.id, id)
        storedPhotos.push({ ...photo, ...stored })
      }
    } catch (error) {
      await deleteUploadedPhotos(bucket, storedPhotos)
      if (error?.status === 400) return errorResponse(error.message, 400)
      throw error
    }
    const requestRecord = {
      id,
      user_id: user.id,
      user_snapshot: { name: userNameSchema.parse(userName), email: user.email || '' },
      idempotency_key: idempotencyKey,
      request_hash: hash,
      ...payload,
      uploadedPhotoMetadata: storedPhotos,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'pending', createdAt: now, actorId: user.id }],
      internal_notes: [],
      audit_trail: [{
        actor_id: user.id,
        actor_role: user.role || 'user',
        action: 'request.created',
        previous_status: null,
        next_status: 'pending',
        created_at: now,
      }],
    }
    let transactionResult
    try {
      transactionResult = await withVipCreditTransaction(db, async (session) => {
        const concurrentDuplicate = await collection.findOne(
          { user_id: user.id, idempotency_key: idempotencyKey },
          { ...noId, session },
        )
        if (concurrentDuplicate) {
          if (concurrentDuplicate.request_hash !== hash) {
            const error = new Error('Bu istek anahtarı farklı bir talep için kullanılmış')
            error.code = 'VIP_IDEMPOTENCY_CONFLICT'
            throw error
          }
          return { request: concurrentDuplicate, idempotent: true }
        }
        const allocations = await chargeVipRequestCredits(db, {
          requestId: id,
          userId: user.id,
          amount: VIP_REQUEST_CREDIT_COST,
          reason: 'vip_request_submitted',
          now,
          session,
        })
        requestRecord.vip_credit = {
          charged_amount: VIP_REQUEST_CREDIT_COST,
          refunded_amount: 0,
          refund_status: 'not_refunded',
          allocations,
        }
        await collection.insertOne(requestRecord, { session })
        return { request: requestRecord, idempotent: false }
      })
    } catch (error) {
      const persisted = await collection.findOne({ user_id: user.id, idempotency_key: idempotencyKey }, noId)
      if (persisted && persisted.request_hash === hash) {
        transactionResult = { request: persisted, idempotent: true }
      } else {
        await deleteUploadedPhotos(bucket, storedPhotos)
        if (error?.code === 'VIP_INSUFFICIENT_CREDITS') return errorResponse(error.message, 402)
        if (error?.code === 'VIP_IDEMPOTENCY_CONFLICT' || (persisted && persisted.request_hash !== hash)) {
          return errorResponse('Bu istek anahtarı farklı bir talep için kullanılmış', 409)
        }
        throw error
      }
    }
    if (transactionResult.idempotent && transactionResult.request.id !== id) {
      await deleteUploadedPhotos(bucket, storedPhotos)
    }
    const savedRequest = transactionResult.request
    const baseUrl = getNotificationBaseUrl(request)
    await publishNotificationsSafely('vip-request-created', () => Promise.all([
      notifyUser(db, { id: user.id, email: user.email }, {
        eventId: `vip:${savedRequest.id}:created:user`,
        type: 'vip_request',
        title: 'VIP tasarım talebiniz alındı',
        message: `Talebiniz ekibimize ulaştı. ${VIP_REQUEST_CREDIT_COST} VIP kredisi kullanıldı; süreci panelinizden takip edebilirsiniz.`,
        href: `/panel/vip-taleplerim/${savedRequest.id}`,
        emailTemplate: 'vipRequestCustomer',
      }, { baseUrl }),
      notifyAdmins(db, {
        eventId: `vip:${savedRequest.id}:created:admin`,
        type: 'vip_request',
        title: 'Yeni VIP tasarım talebi',
        message: `${userName || user.email || 'Bir kullanıcı'} yeni bir VIP tasarım talebi gönderdi.`,
        href: `/panel/admin/vip-talepler/${savedRequest.id}`,
        emailTemplate: 'vipRequestAdmin',
      }, { baseUrl }),
    ]))
    return Response.json(
      { request: publicRequest(savedRequest), ...(transactionResult.idempotent ? { idempotent: true } : {}) },
      { status: transactionResult.idempotent ? 200 : 201, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (route === '/vip/requests' && method === 'GET') {
    const url = new URL(request.url)
    const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10)
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10)
    const page = Number.isInteger(requestedPage) ? Math.max(1, requestedPage) : 1
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20
    const collection = db.collection('vip_design_requests')
    const [items, total] = await Promise.all([
      collection.find({ user_id: user.id }, noId).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments({ user_id: user.id }),
    ])
    const grants = await db.collection('billing_grants').find(
      { user_id: user.id, status: 'active' },
      { projection: { _id: 0, remaining_event_credits: 1 } },
    ).toArray()
    return Response.json({
      items: items.map(publicRequest),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      vipCreditBalance: grants.reduce((sum, grant) => sum + (grant.remaining_event_credits || 0), 0),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (customerRequestId && method === 'GET') {
    const item = await db.collection('vip_design_requests').findOne({ id: customerRequestId, user_id: user.id }, noId)
    if (!item) return errorResponse('VIP talebi bulunamadı', 404)
    const grants = await db.collection('billing_grants').find(
      { user_id: user.id, status: 'active' },
      { projection: { _id: 0, remaining_event_credits: 1 } },
    ).toArray()
    return Response.json({
      request: publicRequest(item),
      vipCreditBalance: grants.reduce((sum, grant) => sum + (grant.remaining_event_credits || 0), 0),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return errorResponse('VIP talep rotası bulunamadı', 404)
}
