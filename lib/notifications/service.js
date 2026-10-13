import crypto from 'node:crypto'
import { isEmailConfigured, sendRawEmail } from '../messaging/email.js'
import { buildNotificationEmail, getNotificationEmailTemplateNames } from './email-templates.js'

const noId = { projection: { _id: 0 } }
const indexPromises = new WeakMap()

export async function ensureNotificationIndexes(db) {
  let promise = indexPromises.get(db)
  if (!promise) {
    promise = Promise.all([
      db.collection('notifications').createIndex({ event_id: 1, recipient_id: 1 }, { unique: true }),
      db.collection('notifications').createIndex({ recipient_id: 1, audience: 1, created_at: -1 }),
      db.collection('notifications').createIndex({ recipient_id: 1, audience: 1, read_at: 1 }),
      db.collection('notifications').createIndex({ 'email.status': 1, created_at: 1 }),
    ]).catch((error) => {
      indexPromises.delete(db)
      throw error
    })
    indexPromises.set(db, promise)
  }
  await promise
}

function sanitizeEmailError(error) {
  const message = String(error?.message || 'E-posta gönderilemedi')
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    .replace(/\b(token|password|secret|authorization|api[_-]?key)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 300)
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? message.replaceAll(apiKey, '[redacted]') : message
}

async function deliverEmail(db, notification, { sendEmail = sendRawEmail, baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost' } = {}) {
  if (!notification.email?.to) {
    await db.collection('notifications').updateOne(
      { id: notification.id },
      { $set: { 'email.status': 'not_available', 'email.updated_at': new Date() } },
    )
    return { status: 'not_available' }
  }
  if (!isEmailConfigured()) {
    await db.collection('notifications').updateOne(
      { id: notification.id },
      { $set: { 'email.status': 'not_configured', 'email.updated_at': new Date() } },
    )
    return { status: 'not_configured' }
  }

  const now = new Date()
  const claimed = await db.collection('notifications').updateOne(
    { id: notification.id, 'email.status': { $in: ['pending', 'failed', 'not_configured'] } },
    {
      $set: { 'email.status': 'sending', 'email.updated_at': now, 'email.last_attempt_at': now },
      $inc: { 'email.attempts': 1 },
    },
  )
  if (!claimed.modifiedCount) {
    const current = await db.collection('notifications').findOne({ id: notification.id }, noId)
    return { status: current?.email?.status || 'unknown', idempotent: true }
  }

  try {
    const email = buildNotificationEmail(notification, baseUrl)
    const result = await sendEmail({
      to: notification.email.to,
      subject: email.subject,
      html: email.html,
      tag: `notification-${notification.email.template || 'generic'}`,
    })
    await db.collection('notifications').updateOne(
      { id: notification.id, 'email.status': 'sending' },
      {
        $set: {
          'email.status': 'sent',
          'email.provider_id': result?.id || null,
          'email.sent_at': new Date(),
          'email.updated_at': new Date(),
        },
        $unset: { 'email.last_error': '' },
      },
    )
    return { status: 'sent', providerId: result?.id || null }
  } catch (error) {
    const safeMessage = sanitizeEmailError(error)
    await db.collection('notifications').updateOne(
      { id: notification.id, 'email.status': 'sending' },
      { $set: { 'email.status': 'failed', 'email.last_error': safeMessage, 'email.updated_at': new Date() } },
    )
    console.error('[notifications] email delivery failed', { eventId: notification.event_id, error: safeMessage })
    return { status: 'failed', error: safeMessage }
  }
}

export async function createNotification(db, {
  eventId,
  recipientId,
  audience = 'user',
  type,
  title,
  message,
  href = '/panel/bildirimler',
  emailTo = '',
  emailSubject,
  emailTemplate = 'generic',
  email = true,
}, options = {}) {
  if (!eventId || !recipientId || !type || !title || !message) {
    throw new TypeError('Bildirim olayı, alıcısı, türü, başlığı ve mesajı zorunludur')
  }
  if (!['user', 'admin'].includes(audience)) throw new TypeError('Bildirim hedef kitlesi geçersiz')
  if (!getNotificationEmailTemplateNames().includes(emailTemplate)) {
    throw new TypeError(`Bilinmeyen e-posta şablonu: ${emailTemplate}`)
  }
  await ensureNotificationIndexes(db)

  const now = new Date()
  const record = {
    id: crypto.randomUUID(),
    event_id: eventId,
    recipient_id: recipientId,
    audience,
    type,
    title: String(title).slice(0, 160),
    message: String(message).slice(0, 1000),
    href,
    read_at: null,
    created_at: now,
    email: {
      to: emailTo || null,
      subject: String(emailSubject || title).slice(0, 180),
      template: emailTemplate,
      status: email ? (emailTo ? (isEmailConfigured() ? 'pending' : 'not_configured') : 'not_available') : 'not_requested',
      attempts: 0,
      last_attempt_at: null,
      sent_at: null,
      provider_id: null,
      last_error: null,
    },
  }

  try {
    await db.collection('notifications').insertOne(record)
  } catch (error) {
    if (error?.code !== 11000) throw error
    const existing = await db.collection('notifications').findOne({ event_id: eventId, recipient_id: recipientId }, noId)
    if (existing) return { notification: existing, duplicate: true }
    throw error
  }

  if (email) {
    const emailResult = await deliverEmail(db, record, options)
    record.email.status = emailResult.status
    if (emailResult.providerId) record.email.provider_id = emailResult.providerId
    if (emailResult.error) record.email.last_error = emailResult.error
  }
  return { notification: record, duplicate: false }
}

export async function notifyAdmins(db, input, options = {}) {
  await ensureNotificationIndexes(db)
  const admins = await db.collection('users')
    .find({ role: { $in: ['super_admin', 'admin', 'support'] } }, { projection: { _id: 0, id: 1, email: 1 } })
    .toArray()
  return Promise.all(admins.map((admin) => createNotification(db, {
    ...input,
    recipientId: admin.id,
    audience: 'admin',
    emailTo: admin.email,
  }, options)))
}

export async function notifyUser(db, user, input, options = {}) {
  return createNotification(db, {
    ...input,
    recipientId: user.id,
    audience: 'user',
    emailTo: user.email,
  }, options)
}

export async function retryNotificationEmail(db, notificationId, options = {}) {
  await ensureNotificationIndexes(db)
  const notification = await db.collection('notifications').findOne({ id: notificationId }, noId)
  if (!notification) return { error: 'Bildirim bulunamadı', status: 404 }
  if (!notification.email?.to) return { error: 'Bu bildirim için e-posta alıcısı bulunmuyor', status: 409 }
  if (notification.email.status === 'sent') return { error: 'E-posta daha önce gönderilmiş', status: 409 }
  if (!isEmailConfigured()) return { error: 'Resend yapılandırılmamış; RESEND_API_KEY tanımlandıktan sonra yeniden deneyin', status: 503 }
  if (notification.email.status === 'sending') {
    const lastAttempt = new Date(notification.email.last_attempt_at || 0).getTime()
    if (Date.now() - lastAttempt < 5 * 60 * 1000) return { error: 'E-posta gönderimi halen sürüyor', status: 409 }
    const reset = await db.collection('notifications').updateOne(
      { id: notification.id, 'email.status': 'sending', 'email.last_attempt_at': notification.email.last_attempt_at },
      { $set: { 'email.status': 'failed', 'email.last_error': 'Önceki gönderim yanıt vermedi; yeniden denenebilir.' } },
    )
    if (!reset.modifiedCount) return { error: 'E-posta durumu eşzamanlı değişti; yeniden yükleyin', status: 409 }
    notification.email.status = 'failed'
  }
  const result = await deliverEmail(db, notification, options)
  if (result.status === 'failed') return { error: 'E-posta gönderilemedi; hata kaydı oluşturuldu', status: 502 }
  if (result.idempotent && result.status === 'sending') return { error: 'E-posta gönderimi halen sürüyor', status: 409 }
  return { notificationId, emailStatus: result.status }
}

export function getEmailIntegrationStatus() {
  return {
    provider: 'resend',
    configured: isEmailConfigured(),
    status: isEmailConfigured() ? 'enabled' : 'not_configured',
    message: isEmailConfigured()
      ? 'Resend yapılandırılmış; bildirim e-postaları gönderilebilir.'
      : 'Resend yapılandırılmamış. Uygulama içi bildirimler çalışır; e-posta gönderilmez ve durum kaydedilir.',
  }
}

export function getNotificationBaseUrl(request) {
  return (process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, '')
}

export async function publishNotificationsSafely(context, publish) {
  try {
    return await publish()
  } catch (error) {
    console.error('[notifications] in-app notification persistence failed', {
      context,
      error: String(error?.message || error).slice(0, 300),
    })
    return null
  }
}
