import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { ensureBillingAccount } from '@/lib/billing/usage'

export const SESSION_COOKIE = 'momentis_session'
const SESSION_DAYS = 7

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET tanımlı değil')
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password, hash) {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export async function signSession(user) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function setSessionCookie(response, token) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
  return response
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}

export function sanitizeUser(user) {
  if (!user) return null
  const { _id, password_hash, ...rest } = user
  return rest
}

// Reads the session cookie (or Bearer header) and loads the user from Mongo.
export async function getCurrentUser(request, db) {
  let token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    const auth = request.headers.get('authorization') || ''
    if (auth.startsWith('Bearer ')) token = auth.slice(7)
  }
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload?.sub) return null
  const user = await db.collection('users').findOne({ id: payload.sub })
  if (user) await ensureBillingAccount(db, user.id)
  return sanitizeUser(user)
}

export async function ensureAuthIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('login_attempts').createIndex({ identifier: 1 })
  await db.collection('login_attempts').createIndex({ updated_at: 1 }, { expireAfterSeconds: 60 * 60 })
  await db.collection('password_reset_tokens').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
  await db.collection('password_reset_tokens').createIndex({ token_hash: 1 })
}
