import crypto from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { BILLING_PLANS, getBillingPlan } from './plans.js'
import { ensureBillingAccount } from './usage.js'
import { withVipCreditTransaction } from '../vip-design/credits.js'
import { notifyAdmins, notifyUser, publishNotificationsSafely } from '../notifications/service.js'

export function isIyzicoConfigured() {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY)
}

export function getIyzicoBaseUrl() {
  if (process.env.IYZICO_BASE_URL) return process.env.IYZICO_BASE_URL.replace(/\/+$/, '')
  return process.env.NODE_ENV === 'production'
    ? 'https://api.iyzipay.com'
    : 'https://sandbox-api.iyzipay.com'
}

export function generateIyzWSv2Header({ apiKey, secretKey, uriPath, randomKey, body }) {
  const minifiedBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : ''
  const payload = `${randomKey}${uriPath}${minifiedBody}`
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex')
  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`
  const base64Auth = Buffer.from(authString, 'utf-8').toString('base64')
  return `IYZWSv2 ${base64Auth}`
}

export function verifyIyzicoWebhookSignature({ payload, signature, secretKey }) {
  if (!signature || !secretKey || !payload || typeof payload !== 'object') return false
  const eventType = payload.iyziEventType || ''
  const paymentId = payload.paymentId !== undefined ? String(payload.paymentId) : ''
  const token = payload.token || ''
  const conversationId = payload.paymentConversationId || ''
  const status = payload.status || ''

  const rawString = `${secretKey}${eventType}${paymentId}${token}${conversationId}${status}`
  const calculatedHex = crypto
    .createHmac('sha256', secretKey)
    .update(rawString)
    .digest('hex')
    .toLowerCase()

  const incomingClean = String(signature).trim().toLowerCase()
  const bufCalculated = Buffer.from(calculatedHex, 'utf-8')
  const bufIncoming = Buffer.from(incomingClean, 'utf-8')

  if (bufCalculated.length !== bufIncoming.length) return false
  return crypto.timingSafeEqual(bufCalculated, bufIncoming)
}

export async function initializeIyzicoCheckout({
  user,
  packagePlan,
  purchaseId,
  callbackUrl,
  ip = '127.0.0.1',
}) {
  const apiKey = process.env.IYZICO_API_KEY
  const secretKey = process.env.IYZICO_SECRET_KEY
  if (!apiKey || !secretKey) {
    throw new Error('iyzico API anahtarları yapılandırılmamış')
  }

  const uriPath = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
  const randomKey = String(Date.now())
  const priceFormatted = Number(packagePlan.price).toFixed(2)

  const buyerNameParts = (user.name || 'Müşteri').trim().split(/\s+/)
  const buyerName = buyerNameParts[0] || 'Müşteri'
  const buyerSurname = buyerNameParts.slice(1).join(' ') || 'Kullanıcı'

  const payload = {
    locale: 'tr',
    conversationId: purchaseId,
    price: priceFormatted,
    paidPrice: priceFormatted,
    currency: 'TRY',
    basketId: `B-${purchaseId.slice(0, 12)}`,
    paymentGroup: 'PRODUCT',
    callbackUrl,
    enabledInstallments: [1, 2, 3, 6],
    buyer: {
      id: user.id,
      name: buyerName,
      surname: buyerSurname,
      gsmNumber: user.phone || '+905555555555',
      email: user.email || 'musteri@momentis.com.tr',
      identityNumber: '11111111110',
      registrationAddress: 'Türkiye',
      ip,
      city: 'Istanbul',
      country: 'Turkey',
    },
    shippingAddress: {
      address: 'Dijital Hizmet / Online Teslimat',
      contactName: user.name || 'Müşteri',
      city: 'Istanbul',
      country: 'Turkey',
    },
    billingAddress: {
      address: 'Dijital Hizmet / Online Teslimat',
      contactName: user.name || 'Müşteri',
      city: 'Istanbul',
      country: 'Turkey',
    },
    basketItems: [
      {
        id: `PKG-${packagePlan.id}`,
        name: `MOMENTİS ${packagePlan.name} Paketi`,
        category1: 'Dijital Hizmet',
        category2: 'Etkinlik Paketi',
        itemType: 'VIRTUAL',
        price: priceFormatted,
      },
    ],
  }

  const authHeader = generateIyzWSv2Header({
    apiKey,
    secretKey,
    uriPath,
    randomKey,
    body: payload,
  })

  const endpointUrl = `${getIyzicoBaseUrl()}${uriPath}`
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'x-iyzi-rnd': randomKey,
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok || result.status !== 'success') {
    const errorMsg = result.errorMessage || result.error || 'iyzico oturumu başlatılamadı'
    const error = new Error(errorMsg)
    error.raw = result
    throw error
  }

  return {
    token: result.token,
    checkoutFormContent: result.checkoutFormContent,
    paymentPageUrl: result.paymentPageUrl,
  }
}

export async function retrieveIyzicoCheckout({ token }) {
  const apiKey = process.env.IYZICO_API_KEY
  const secretKey = process.env.IYZICO_SECRET_KEY
  if (!apiKey || !secretKey) throw new Error('iyzico API anahtarları yapılandırılmamış')

  const uriPath = '/payment/iyzipos/checkoutform/auth/ecom/detail'
  const randomKey = String(Date.now())
  const payload = { locale: 'tr', token }

  const authHeader = generateIyzWSv2Header({
    apiKey,
    secretKey,
    uriPath,
    randomKey,
    body: payload,
  })

  const endpointUrl = `${getIyzicoBaseUrl()}${uriPath}`
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'x-iyzi-rnd': randomKey,
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))
  return result
}

export async function completePurchaseAndGrantCredits({
  db,
  purchaseId,
  provider,
  paymentId = null,
  rawResult = null,
  baseUrl = null,
}) {
  const purchases = db.collection('billing_purchases')
  const purchase = await purchases.findOne({ id: purchaseId })
  if (!purchase) {
    const error = new Error('Satın alma kaydı bulunamadı')
    error.status = 404
    throw error
  }

  if (purchase.status === 'paid' || purchase.status === 'mock_verified') {
    return { ok: true, idempotent: true, purchase }
  }

  const packagePlan = getBillingPlan(purchase.package_id)
  if (!packagePlan || packagePlan.grantMode !== 'event_credits') {
    const error = new Error('Geçersiz paket planı')
    error.status = 400
    throw error
  }

  const now = new Date()
  const grantId = uuidv4()
  const movementId = uuidv4()

  await withVipCreditTransaction(db, async (session) => {
    const current = await purchases.findOne({ id: purchase.id }, { session })
    if (current && (current.status === 'paid' || current.status === 'mock_verified')) return

    await purchases.updateOne(
      { id: purchase.id },
      {
        $set: {
          status: 'paid',
          provider,
          payment_id: paymentId || current.payment_id || null,
          verified_at: now,
          updated_at: now,
          ...(rawResult ? { provider_result: { status: rawResult.status, paymentStatus: rawResult.paymentStatus } } : {}),
        },
      },
      { session },
    )

    const grant = {
      id: grantId,
      user_id: purchase.user_id,
      purchase_id: purchase.id,
      package_id: packagePlan.id,
      scope: packagePlan.scope,
      grant_mode: packagePlan.grantMode,
      event_credits: packagePlan.eventCredits,
      remaining_event_credits: packagePlan.eventCredits,
      assigned_project_ids: [],
      provider,
      status: 'active',
      created_at: now,
      updated_at: now,
    }

    await db.collection('billing_grants').updateOne(
      { purchase_id: purchase.id },
      { $setOnInsert: grant },
      { upsert: true, session },
    )

    await db.collection('admin_credit_movements').insertOne(
      {
        id: movementId,
        user_id: purchase.user_id,
        request_key: `purchase:${purchase.id}`,
        kind: 'credit',
        amount: packagePlan.eventCredits,
        package_id: packagePlan.id,
        grant_id: grantId,
        purchase_id: purchase.id,
        reason: `Paket satın alımı: ${packagePlan.name} (${provider})`,
        actor_user_id: null,
        created_at: now,
      },
      { session },
    )

    await db.collection('admin_audit_logs').insertOne(
      {
        id: uuidv4(),
        actor_user_id: purchase.user_id,
        action: 'package.purchased',
        target_type: 'purchase',
        target_id: purchase.id,
        before: { status: 'pending' },
        after: { status: 'paid', package_id: packagePlan.id, credits: packagePlan.eventCredits, provider },
        reason: 'Payment verified and credits granted',
        outcome: 'success',
        created_at: now,
      },
      { session },
    )
  })

  await ensureBillingAccount(db, purchase.user_id)
  const user = await db.collection('users').findOne({ id: purchase.user_id }, { projection: { _id: 0, id: 1, name: 1, email: 1 } })

  await publishNotificationsSafely('billing-package-activated', () => Promise.all([
    notifyUser(db, user || { id: purchase.user_id }, {
      eventId: `purchase:${purchase.id}:activated:user`,
      type: 'billing',
      title: `${packagePlan.name} paketi hesabınıza tanımlandı`,
      message: `${packagePlan.eventCredits} etkinlik krediniz kullanılabilir. Paket ve kredi bilgilerinizi panelinizden takip edebilirsiniz.`,
      href: '/panel/paketim',
      emailTemplate: 'packageActivatedCustomer',
    }, { baseUrl }),
    notifyAdmins(db, {
      eventId: `purchase:${purchase.id}:activated:admin`,
      type: 'billing',
      title: 'Yeni paket satın alındı',
      message: `${user?.name || 'Bir kullanıcı'} için ${packagePlan.name} paketi ve ${packagePlan.eventCredits} etkinlik kredisi tanımlandı.`,
      href: '/panel/admin',
      emailTemplate: 'packageActivatedAdmin',
    }, { baseUrl }),
  ]))

  return { ok: true, purchaseId: purchase.id, packageId: packagePlan.id, eventCredits: packagePlan.eventCredits }
}
