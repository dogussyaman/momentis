import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { GridFSBucket, ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { canManageAdmin, canReadAdmin } from '../admin/authorization.js'
import { getNotificationBaseUrl } from '../notifications/service.js'
import {
  buildNotificationEmailPreview,
  getNotificationEmailTemplateFields,
  getNotificationEmailTemplateNames,
  getNotificationEmailTemplate,
  listNotificationEmailTemplates,
} from '../notifications/email-templates.js'

const noId = { projection: { _id: 0 } }
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const ALLOWED_FIELDS = new Set(getNotificationEmailTemplateFields())
const ALLOWED_TOKENS = new Set(['subject', 'title', 'message'])
const indexPromises = new WeakMap()
const EMAIL_ASSET_BUCKET = 'email_template_assets'
const MAX_EMAIL_ASSET_BYTES = 4 * 1024 * 1024
const EMAIL_ASSET_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function hasImageSignature(bytes, type) {
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (type === 'image/gif') return bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))
  if (type === 'image/webp') return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  return false
}

function validStoredImageUrl(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    if (url.protocol === 'https:') {
      return true
    }
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
    return localHttp && /^\/api\/email-template-assets\/[a-f0-9]{24}$/i.test(url.pathname)
  } catch {
    return false
  }
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const parsedOrigin = new URL(origin)
    if (origin !== parsedOrigin.origin) return false
    const requestUrl = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
    const host = request.headers.get('host')
    const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim()
    const hosts = [forwardedHost, host, requestUrl.host].filter(Boolean)
    const protocols = [forwardedProtocol, requestUrl.protocol.slice(0, -1)].filter(Boolean)
    return hosts.some((candidateHost) => protocols.some((protocol) =>
      parsedOrigin.origin === `${protocol}://${candidateHost}`,
    ))
  } catch {
    return false
  }
}

function validateFields(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
    Object.keys(input).some((key) => !ALLOWED_FIELDS.has(key))) {
    return { error: 'E-posta şablonu alanları geçersiz' }
  }
  const fields = {}
  for (const [key, rawValue] of Object.entries(input)) {
    if (key === 'showVipShowcase') {
      if (typeof rawValue !== 'boolean') return { error: 'VIP tasarım vitrini etkin/pasif olarak seçilmelidir' }
      fields[key] = rawValue
      continue
    }
    if (typeof rawValue !== 'string') return { error: 'Şablon alanları metin olmalıdır' }
    const value = rawValue.trim()
    const maximum = key === 'intro' || key === 'footer' ? 1000 : key === 'imageUrl' ? 1000 : 180
    if (value.length > maximum || (key !== 'ctaLabel' && key !== 'footer' && key !== 'imageUrl' && value.length === 0)) {
      return { error: 'Şablon alanlarından biri boş veya izin verilen uzunluğun dışında' }
    }
    if (key === 'subject' && /[\r\n]/.test(value)) return { error: 'E-posta konusu satır sonu içeremez' }
    if (key === 'imageUrl' && !validStoredImageUrl(value)) return { error: 'Geçerli bir görsel bağlantısı (URL) girin veya dosya yükleyin' }
    const tokens = [...value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((match) => match[1])
    if (tokens.some((token) => !ALLOWED_TOKENS.has(token)) || value.replace(/\{\{\s*[^{}]+?\s*\}\}/g, '').includes('{{') ||
      value.replace(/\{\{\s*[^{}]+?\s*\}\}/g, '').includes('}}')) {
      return { error: 'Desteklenmeyen değişken. Kullanılabilir değişkenler: {{subject}}, {{title}}, {{message}}' }
    }
    fields[key] = value
  }
  return { fields }
}

async function ensureIndexes(db) {
  let promise = indexPromises.get(db)
  if (!promise) {
    promise = Promise.all([
      db.collection('admin_email_template_settings').createIndex({ template_key: 1 }, { unique: true }),
      db.collection('admin_audit_logs').createIndex({ created_at: -1 }),
    ]).catch((error) => {
      indexPromises.delete(db)
      throw error
    })
    indexPromises.set(db, promise)
  }
  await promise
}

export async function handleEmailTemplateRoutes({ db, route, method, request, user, assetBucket }) {
  const assetMatch = route.match(/^\/email-template-assets\/([a-f0-9]{24})$/i)
  if (assetMatch && method === 'GET') {
    const bucket = assetBucket || new GridFSBucket(db, { bucketName: EMAIL_ASSET_BUCKET })
    const [file] = await bucket.find({ _id: new ObjectId(assetMatch[1]) }).limit(1).toArray()
    if (!file || !EMAIL_ASSET_TYPES.has(file.contentType)) return json({ error: 'E-posta görseli bulunamadı' }, 404)
    return new Response(Readable.toWeb(bucket.openDownloadStream(file._id)), {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': file.contentType,
        'Content-Length': String(file.length),
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
  if (!route.startsWith('/admin/email-templates')) return null
  if (!user) return json({ error: 'Oturum gerekli' }, 401)
  if (!canReadAdmin(user)) return json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
  await ensureIndexes(db)

  if (route === '/admin/email-templates' && method === 'GET') {
    return json({ items: await listNotificationEmailTemplates(db, getNotificationBaseUrl(request)), canManage: canManageAdmin(user) })
  }

  if (route === '/admin/email-templates/assets' && method === 'POST') {
    if (!canManageAdmin(user)) return json({ error: 'Bu işlem için admin yetkisi gerekli' }, 403)
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
    const contentLength = Number(request.headers.get('content-length'))
    if (Number.isFinite(contentLength) && contentLength > MAX_EMAIL_ASSET_BYTES + 256_000) {
      return json({ error: 'Görsel yüklemesi 4 MB sınırını aşıyor' }, 413)
    }
    let form
    try {
      form = await request.formData()
    } catch {
      return json({ error: 'Görsel yükleme formu okunamadı' }, 400)
    }
    const files = form.getAll('image')
    if (files.length !== 1 || typeof files[0]?.arrayBuffer !== 'function') {
      return json({ error: 'Tek bir görsel dosyası seçin' }, 400)
    }
    const file = files[0]
    if (!EMAIL_ASSET_TYPES.has(file.type) || file.size < 1 || file.size > MAX_EMAIL_ASSET_BYTES) {
      return json({ error: 'JPEG, PNG, WebP veya GIF görseli seçin (en fazla 4 MB)' }, 400)
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length !== file.size || !hasImageSignature(bytes, file.type)) {
      return json({ error: 'Dosya içeriği desteklenen görsel türüyle eşleşmiyor' }, 400)
    }
    const bucket = assetBucket || new GridFSBucket(db, { bucketName: EMAIL_ASSET_BUCKET })
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.slice('image/'.length)
    const upload = bucket.openUploadStream(`email-${crypto.randomUUID()}.${extension}`, {
      contentType: file.type,
      metadata: { uploaded_by: user.id, purpose: 'email_template', size: bytes.length },
    })
    try {
      await pipeline(Readable.from(bytes), upload)
    } catch (error) {
      await upload.abort()
      throw error
    }
    const imageUrl = `${getNotificationBaseUrl(request)}/api/email-template-assets/${upload.id.toString()}`
    return json({ imageUrl }, 201)
  }

  if (route === '/admin/email-templates/preview' && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
    const body = await request.json().catch(() => null)
    if (!body || Object.keys(body).some((key) => !['key', 'fields'].includes(key))) {
      return json({ error: 'Önizleme isteği geçersiz' }, 400)
    }
    if (!getNotificationEmailTemplateNames().includes(body?.key)) {
      return json({ error: 'E-posta şablonu bulunamadı' }, 404)
    }
    const validation = validateFields(body.fields)
    if (validation.error || Object.keys(validation.fields || {}).length !== ALLOWED_FIELDS.size) {
      return json({ error: validation.error || 'Tüm e-posta şablonu alanları zorunludur' }, 400)
    }
    const preview = buildNotificationEmailPreview(body.key, validation.fields, getNotificationBaseUrl(request))
    return json({ preview })
  }

  const match = route.match(/^\/admin\/email-templates\/([A-Za-z0-9_-]+)$/)
  if (match && method === 'PATCH') {
    if (!canManageAdmin(user)) return json({ error: 'Bu işlem için admin yetkisi gerekli' }, 403)
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
    const key = match[1]
    if (!getNotificationEmailTemplateNames().includes(key)) {
      return json({ error: 'E-posta şablonu bulunamadı' }, 404)
    }
    const body = await request.json().catch(() => null)
    if (!body || Object.keys(body).some((field) => field !== 'fields')) {
      return json({ error: 'Şablon güncelleme isteği geçersiz' }, 400)
    }
    const validation = validateFields(body?.fields)
    if (validation.error || Object.keys(validation.fields || {}).length !== ALLOWED_FIELDS.size) {
      return json({ error: validation.error || 'Tüm e-posta şablonu alanları zorunludur' }, 400)
    }

    const collection = db.collection('admin_email_template_settings')
    const beforeDoc = await collection.findOne({ template_key: key }, noId)
    const before = getNotificationEmailTemplate(key, beforeDoc?.fields)
    const fields = validation.fields
    const now = new Date()
    const session = await db.client.startSession()
    try {
      await session.withTransaction(async () => {
        await collection.updateOne(
          { template_key: key },
          { $set: { fields, updated_by: user.id, updated_at: now }, $setOnInsert: { created_at: now } },
          { upsert: true, session },
        )
        await db.collection('admin_audit_logs').insertOne({
          id: uuidv4(),
          actor_user_id: user.id,
          action: 'email_template.updated',
          target_type: 'email_template',
          target_id: key,
          before,
          after: fields,
          outcome: 'success',
          created_at: now,
        }, { session })
      })
    } finally {
      await session.endSession()
    }
    return json({ ok: true, fields, updatedAt: now })
  }

  return json({ error: 'E-posta şablonu rotası bulunamadı' }, 404)
}
