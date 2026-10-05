import { v4 as uuidv4 } from 'uuid'
import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { hashPassword, verifyPassword, signSession, setSessionCookie, clearSessionCookie, sanitizeUser, ensureAuthIndexes } from '@/lib/auth'
import { isValidEmail, escapeHtml } from '@/lib/messaging/shared'
import { isEmailConfigured, sendRawEmail, renderEmailLayout } from '@/lib/messaging/email'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15
let indexesReady = false

function json(data, init) {
  return NextResponse.json(data, init)
}

function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local'
}

async function isLocked(db, identifier) {
  const doc = await db.collection('login_attempts').findOne({ identifier })
  if (!doc) return false
  if (doc.count >= MAX_ATTEMPTS && doc.locked_until && doc.locked_until > new Date()) return true
  return false
}

async function recordFailure(db, identifier) {
  const now = new Date()
  const doc = await db.collection('login_attempts').findOneAndUpdate(
    { identifier },
    { $inc: { count: 1 }, $set: { updated_at: now } },
    { upsert: true, returnDocument: 'after' }
  )
  const count = doc?.count ?? doc?.value?.count ?? 1
  if (count >= MAX_ATTEMPTS) {
    await db.collection('login_attempts').updateOne({ identifier }, { $set: { locked_until: new Date(now.getTime() + LOCK_MINUTES * 60000) } })
  }
}

async function issueSession(user, status = 200) {
  const token = await signSession(user)
  const res = json({ user: sanitizeUser(user) }, { status })
  return setSessionCookie(res, token)
}

// Returns a Response or null (not handled).
export async function handleAuthRoutes({ db, route, method, request, user }) {
  if (!route.startsWith('/auth/')) return null
  if (!indexesReady) {
    try { await ensureAuthIndexes(db); indexesReady = true } catch (e) { console.error('auth index error', e.message) }
  }

  // POST /api/auth/register
  if (route === '/auth/register' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const name = String(body.name || '').trim().slice(0, 100)
    if (!isValidEmail(email)) return json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 })
    if (password.length < 6) return json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    if (!name) return json({ error: 'Ad soyad zorunludur' }, { status: 400 })

    const existing = await db.collection('users').findOne({ email })
    if (existing) return json({ error: 'Bu e-posta ile zaten bir hesap var' }, { status: 409 })

    const now = new Date()
    const newUser = {
      id: uuidv4(), email, name, password_hash: await hashPassword(password),
      auth_provider: 'password', picture: null, role: 'user',
      created_at: now, updated_at: now,
    }
    await db.collection('users').insertOne({ ...newUser })
    return issueSession(newUser, 201)
  }

  // POST /api/auth/login
  if (route === '/auth/login' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!isValidEmail(email) || !password) return json({ error: 'E-posta ve şifre zorunludur' }, { status: 400 })

    const identifier = `${clientIp(request)}:${email}`
    if (await isLocked(db, identifier)) {
      return json({ error: `Çok fazla başarısız deneme. ${LOCK_MINUTES} dakika sonra tekrar deneyin.` }, { status: 429 })
    }
    const existing = await db.collection('users').findOne({ email })
    const ok = existing && await verifyPassword(password, existing.password_hash)
    if (!ok) {
      await recordFailure(db, identifier)
      return json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }
    await db.collection('login_attempts').deleteOne({ identifier })
    return issueSession(existing)
  }

  // POST /api/auth/google/exchange  { sessionId }  (Emergent managed Google OAuth)
  if (route === '/auth/google/exchange' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const sessionId = body.sessionId
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 4096) {
      return json({ error: 'Geçersiz oturum kimliği' }, { status: 400 })
    }
    let upstream
    try {
      upstream = await fetch('https://auth.emergentagent.com/api/auth/session', {
        method: 'POST', headers: { 'X-Session-ID': sessionId, Accept: 'application/json' }, cache: 'no-store',
      })
    } catch (e) {
      return json({ error: 'Google oturumu doğrulanamadı' }, { status: 502 })
    }
    if (!upstream.ok) return json({ error: 'Google oturumu doğrulanamadı' }, { status: 401 })
    const data = await upstream.json().catch(() => ({}))
    const gUser = data?.user || data
    const gEmail = String(gUser?.email || '').trim().toLowerCase()
    if (!isValidEmail(gEmail)) return json({ error: 'Google hesabından e-posta alınamadı' }, { status: 502 })

    const now = new Date()
    let existing = await db.collection('users').findOne({ email: gEmail })
    if (!existing) {
      existing = {
        id: uuidv4(), email: gEmail, name: gUser.name || gUser.full_name || gEmail.split('@')[0],
        password_hash: null, auth_provider: 'google', google_id: String(gUser.id ?? gUser.user_id ?? ''),
        picture: gUser.picture || gUser.image || null, role: 'user', created_at: now, updated_at: now,
      }
      await db.collection('users').insertOne({ ...existing })
    } else {
      const patch = { updated_at: now, picture: existing.picture || gUser.picture || gUser.image || null }
      if (!existing.google_id) patch.google_id = String(gUser.id ?? gUser.user_id ?? '')
      await db.collection('users').updateOne({ id: existing.id }, { $set: patch })
      existing = { ...existing, ...patch }
    }
    return issueSession(existing)
  }

  // POST /api/auth/forgot-password  { email }
  if (route === '/auth/forgot-password' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    if (!isValidEmail(email)) return json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 })
    const existing = await db.collection('users').findOne({ email })
    // Always respond OK to avoid leaking account existence.
    if (!existing) return json({ ok: true })

    const token = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await db.collection('password_reset_tokens').insertOne({ id: uuidv4(), user_id: existing.id, token_hash: tokenHash, expires_at: expiresAt, used: false, created_at: new Date() })

    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
    const link = `${base}/sifre-sifirla?token=${token}`
    console.log(`[auth] Şifre sıfırlama bağlantısı (${email}): ${link}`)

    let delivery = 'skipped'
    if (isEmailConfigured()) {
      try {
        await sendRawEmail({
          to: email,
          subject: 'MOMENTIS şifre sıfırlama bağlantınız',
          tag: 'password-reset',
          html: renderEmailLayout({
            eyebrow: 'Şifre Sıfırlama',
            title: `Merhaba ${escapeHtml(existing.name || '')},`,
            intro: 'Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bağlantı 1 saat boyunca geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
            ctaLabel: 'Şifremi Sıfırla', ctaUrl: link,
            footer: 'Bağlantı çalışmazsa şu adresi tarayıcınıza yapıştırın: ' + escapeHtml(link),
          }),
        })
        delivery = 'sent'
      } catch (e) {
        delivery = 'failed'
        console.error('[auth] reset e-postası gönderilemedi', e.message)
      }
    }
    return json({ ok: true, delivery })
  }

  // POST /api/auth/reset-password  { token, password }
  if (route === '/auth/reset-password' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const token = String(body.token || '')
    const password = String(body.password || '')
    if (!token) return json({ error: 'Geçersiz bağlantı' }, { status: 400 })
    if (password.length < 6) return json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const record = await db.collection('password_reset_tokens').findOne({ token_hash: tokenHash })
    if (!record || record.used || record.expires_at < new Date()) {
      return json({ error: 'Bağlantı geçersiz ya da süresi dolmuş' }, { status: 400 })
    }
    const existing = await db.collection('users').findOne({ id: record.user_id })
    if (!existing) return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    await db.collection('users').updateOne({ id: existing.id }, { $set: { password_hash: await hashPassword(password), updated_at: new Date(), auth_provider: existing.auth_provider === 'google' ? 'google+password' : existing.auth_provider } })
    await db.collection('password_reset_tokens').updateOne({ id: record.id }, { $set: { used: true, used_at: new Date() } })
    await db.collection('login_attempts').deleteMany({ identifier: { $regex: `:${existing.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$` } })
    return issueSession(existing)
  }

  // GET /api/auth/me
  if (route === '/auth/me' && method === 'GET') {
    if (!user) return json({ user: null }, { status: 401 })
    return json({ user })
  }

  // POST /api/auth/logout
  if (route === '/auth/logout' && method === 'POST') {
    return clearSessionCookie(json({ ok: true }))
  }

  return null
}
