import crypto from 'node:crypto'
import { isEmailConfigured, renderEmailLayout, sendRawEmail } from '../messaging/email.js'
import { isValidEmail } from '../messaging/shared.js'

const noId = { projection: { _id: 0 } }
const indexes = new WeakMap()

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
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

async function ensureIndexes(db) {
  let promise = indexes.get(db)
  if (!promise) {
    promise = db.collection('resend_test_emails')
      .createIndex({ user_id: 1, idempotency_key: 1 }, { unique: true })
      .catch((error) => {
        indexes.delete(db)
        throw error
      })
    indexes.set(db, promise)
  }
  await promise
}

function safeError(error) {
  const message = String(error?.message || 'Resend test e-postası gönderilemedi')
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    .replace(/\b(token|password|secret|authorization|api[_-]?key)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 300)
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? message.replaceAll(apiKey, '[redacted]') : message
}

export async function handleMessagingTestRoutes({ db, route, method, request, user }, { sendEmail = sendRawEmail } = {}) {
  if (route !== '/messaging/test-email') return null
  if (method !== 'POST') return json({ error: 'Desteklenmeyen istek yöntemi' }, 405)
  if (!user?.id || !isValidEmail(user.email)) return json({ error: 'Oturum ve doğrulanmış hesap e-postası gerekli' }, 401)
  if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
  if (!isEmailConfigured()) return json({ error: 'Resend yapılandırılmamış' }, 503)

  const idempotencyKey = request.headers.get('idempotency-key') || ''
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
    return json({ error: 'Test gönderimi için geçerli Idempotency-Key başlığı zorunludur' }, 400)
  }
  await ensureIndexes(db)

  const collection = db.collection('resend_test_emails')
  const now = new Date()
  const operation = {
    id: crypto.randomUUID(),
    user_id: user.id,
    idempotency_key: idempotencyKey,
    recipient: user.email,
    provider: 'resend',
    status: 'sending',
    provider_id: null,
    error: null,
    created_at: now,
    updated_at: now,
  }
  try {
    await collection.insertOne(operation)
  } catch (error) {
    if (error?.code !== 11000) throw error
    const existing = await collection.findOne({ user_id: user.id, idempotency_key: idempotencyKey }, noId)
    if (!existing) throw error
    return json({
      ok: existing.status === 'sent',
      idempotent: true,
      status: existing.status,
      error: existing.error || undefined,
    }, existing.status === 'failed' ? 502 : existing.status === 'sent' ? 200 : 202)
  }

  try {
    const result = await sendEmail({
      to: user.email,
      subject: 'MOMENTIS · Resend bağlantı testi',
      tag: 'resend-connection-test',
      html: renderEmailLayout({
        eyebrow: 'E-posta bağlantı testi',
        title: 'Resend bağlantısı çalışıyor.',
        intro: 'Bu test e-postası, MOMENTIS hesabınızdaki e-posta gönderim yapılandırmasını doğrulamak için gönderildi.',
        footer: 'Bu otomatik test e-postasını siz başlattınız; yanıtlamanız gerekmez.',
      }),
    })
    await collection.updateOne(
      { id: operation.id, status: 'sending' },
      { $set: { status: 'sent', provider_id: result.id || null, updated_at: new Date(), sent_at: new Date() } },
    )
    return json({ ok: true, status: 'sent', providerId: result.id || null }, 201)
  } catch (error) {
    const message = safeError(error)
    await collection.updateOne(
      { id: operation.id, status: 'sending' },
      { $set: { status: 'failed', error: message, updated_at: new Date() } },
    )
    console.error('[messaging:test-email] Resend test failed', { userId: user.id, error: message })
    return json({ error: 'Test e-postası gönderilemedi; Resend yapılandırmasını ve gönderici alan adını kontrol edin', status: 'failed' }, 502)
  }
}
