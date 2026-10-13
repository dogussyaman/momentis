import { canManageAdmin, canReadAdmin } from '../admin/authorization.js'
import { getEmailIntegrationStatus, retryNotificationEmail } from '../notifications/service.js'

const noId = { projection: { _id: 0 } }
const ADMIN_ROLES = ['super_admin', 'admin', 'support']

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

function publicNotification(item) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    href: item.href,
    audience: item.audience,
    readAt: item.read_at || null,
    createdAt: item.created_at,
    email: item.email ? {
      status: item.email.status,
      attempts: item.email.attempts || 0,
      lastAttemptAt: item.email.last_attempt_at || null,
      lastError: item.email.last_error || null,
    } : null,
  }
}

export async function handleNotificationRoutes({ db, route, method, request, user }) {
  if (!route.startsWith('/notifications') && !route.startsWith('/admin/notifications')) return null
  if (!user?.id) return json({ error: 'Oturum gerekli' }, 401)

  const collection = db.collection('notifications')
  if (route === '/notifications' && method === 'GET') {
    const isAdmin = ADMIN_ROLES.includes(user.role)
    const url = new URL(request.url)
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10)
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20
    const filter = {
      recipient_id: user.id,
      ...(isAdmin ? { audience: { $in: ['user', 'admin'] } } : { audience: 'user' }),
    }
    const [items, unreadCount] = await Promise.all([
      collection.find(filter, noId).sort({ created_at: -1 }).limit(limit).toArray(),
      collection.countDocuments({ ...filter, read_at: null }),
    ])
    return json({ items: items.map(publicNotification), unreadCount })
  }

  if (route === '/notifications/read-all' && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
    const isAdmin = ADMIN_ROLES.includes(user.role)
    const filter = {
      recipient_id: user.id,
      read_at: null,
      ...(isAdmin ? { audience: { $in: ['user', 'admin'] } } : { audience: 'user' }),
    }
    await collection.updateMany(filter, { $set: { read_at: new Date() } })
    return json({ ok: true })
  }

  const readMatch = route.match(/^\/notifications\/([A-Za-z0-9_-]+)$/)
  if (readMatch && method === 'PATCH') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
    const isAdmin = ADMIN_ROLES.includes(user.role)
    const filter = {
      id: readMatch[1],
      recipient_id: user.id,
      ...(isAdmin ? { audience: { $in: ['user', 'admin'] } } : { audience: 'user' }),
    }
    const result = await collection.updateOne(filter, { $set: { read_at: new Date() } })
    if (!result.matchedCount) return json({ error: 'Bildirim bulunamadı' }, 404)
    return json({ ok: true })
  }

  if (route === '/admin/notifications/email-status' && method === 'GET') {
    if (!canReadAdmin(user)) return json({ error: 'Bu işlem için yönetici yetkisi gerekli' }, 403)
    return json(getEmailIntegrationStatus())
  }

  const retryMatch = route.match(/^\/admin\/notifications\/([A-Za-z0-9_-]+)\/retry-email$/)
  if (retryMatch && method === 'POST') {
    if (!canManageAdmin(user)) return json({ error: 'Bu işlem için admin yetkisi gerekli' }, 403)
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, 403)
    const notification = await collection.findOne({
      id: retryMatch[1],
      audience: 'admin',
    }, noId)
    if (!notification) return json({ error: 'Yönetim bildirimi bulunamadı' }, 404)
    const result = await retryNotificationEmail(db, notification.id)
    if (result.error) return json({ error: result.error }, result.status)
    return json({ ok: true, emailStatus: result.emailStatus })
  }

  return json({ error: 'Bildirim rotası bulunamadı' }, 404)
}
