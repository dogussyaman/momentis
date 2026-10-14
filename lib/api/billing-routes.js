import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getBillingPlan, isMockPaymentEnabled } from '@/lib/billing/plans'
import { getPackageSettings } from '@/lib/billing/package-settings'
import { ensureBillingAccount, ensureBillingIndexes, getBillingSnapshot } from '@/lib/billing/usage'
import { getNotificationBaseUrl } from '@/lib/notifications/service'
import {
  isIyzicoConfigured,
  initializeIyzicoCheckout,
  retrieveIyzicoCheckout,
  verifyIyzicoWebhookSignature,
  completePurchaseAndGrantCredits,
} from '@/lib/billing/payment-adapter'

const json = (data, init) => NextResponse.json(data, init)

export async function handleBillingRoutes({ db, route, method, request, user }) {
  if (!route.startsWith('/billing')) return null
  await ensureBillingIndexes(db)

  // Webhook endpoint: Server-to-server notification from iyzico (authenticated via X-IYZ-SIGNATURE-V3)
  if (route === '/billing/iyzico/webhook' && method === 'POST') {
    const signature = request.headers.get('x-iyz-signature-v3') || request.headers.get('x-iyz-signature')
    const secretKey = process.env.IYZICO_SECRET_KEY
    if (!secretKey) return json({ error: 'Webhook secret is not configured' }, { status: 503 })

    let payload = null
    try {
      payload = await request.json()
    } catch {
      return json({ error: 'Geçersiz JSON verisi' }, { status: 400 })
    }

    const isValid = verifyIyzicoWebhookSignature({ payload, signature, secretKey })
    if (!isValid) {
      return json({ error: 'İmza doğrulaması başarısız' }, { status: 401 })
    }

    const paymentId = payload.paymentId !== undefined ? String(payload.paymentId) : null
    const conversationId = payload.paymentConversationId || null
    const token = payload.token || null
    const status = (payload.status || '').toUpperCase()

    if (status === 'SUCCESS' || payload.iyziEventType === 'PAYMENT_SUCCESS') {
      const purchases = db.collection('billing_purchases')
      let query = null
      if (conversationId) query = { id: conversationId }
      else if (token) query = { iyzico_token: token }
      else if (paymentId) query = { payment_id: paymentId }

      if (query) {
        const purchase = await purchases.findOne(query)
        if (purchase) {
          const baseUrl = getNotificationBaseUrl(request)
          await completePurchaseAndGrantCredits({
            db,
            purchaseId: purchase.id,
            provider: 'iyzico',
            paymentId,
            rawResult: payload,
            baseUrl,
          })
        }
      }
    }

    return json({ status: 'success' })
  }

  // Callback endpoint: User redirect return from iyzico checkout form
  if (route === '/billing/iyzico/callback') {
    let token = null
    if (method === 'POST') {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData().catch(() => null)
        token = formData?.get('token')
      } else {
        const body = await request.json().catch(() => ({}))
        token = body?.token
      }
    } else if (method === 'GET') {
      const url = new URL(request.url)
      token = url.searchParams.get('token')
    }

    if (!token) {
      return NextResponse.redirect(new URL('/panel/paketim?status=failed&reason=Eksik+token', request.url), 303)
    }

    try {
      const result = await retrieveIyzicoCheckout({ token })
      const purchases = db.collection('billing_purchases')
      const purchase = await purchases.findOne({
        $or: [{ iyzico_token: token }, { id: result.conversationId }],
      })

      if (!purchase) {
        return NextResponse.redirect(new URL('/panel/paketim?status=failed&reason=Siparis+bulunamadi', request.url), 303)
      }

      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        const baseUrl = getNotificationBaseUrl(request)
        await completePurchaseAndGrantCredits({
          db,
          purchaseId: purchase.id,
          provider: 'iyzico',
          paymentId: result.paymentId,
          rawResult: result,
          baseUrl,
        })
        return NextResponse.redirect(new URL('/panel/paketim?status=success&purchaseId=' + purchase.id, request.url), 303)
      } else {
        await purchases.updateOne(
          { id: purchase.id },
          { $set: { status: 'failed', failure_reason: result.errorMessage || 'Ödeme reddedildi', updated_at: new Date() } }
        )
        const errMsg = encodeURIComponent(result.errorMessage || 'Ödeme tamamlanamadı')
        return NextResponse.redirect(new URL(`/panel/paketim?status=failed&reason=${errMsg}`, request.url), 303)
      }
    } catch (err) {
      const errMsg = encodeURIComponent(err.message || 'Ödeme doğrulanamadı')
      return NextResponse.redirect(new URL(`/panel/paketim?status=failed&reason=${errMsg}`, request.url), 303)
    }
  }

  // All endpoints below require active user session
  if (!user) return json({ error: 'Oturum gerekli' }, { status: 401 })

  if (route === '/billing/account' && method === 'GET') {
    return json(await getBillingSnapshot(db, user.id), { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/billing/checkout' && method === 'POST') {
    const isMock = isMockPaymentEnabled()
    const isIyzico = isIyzicoConfigured()

    if (!isMock && !isIyzico) {
      return json({ error: 'Ödeme sağlayıcısı yapılandırılmadığı için satın alma şu anda kullanılamıyor' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const packagePlan = getBillingPlan(body.packageId)
    const requestKey = request.headers.get('idempotency-key')
    if (!packagePlan || packagePlan.grantMode !== 'event_credits' || packagePlan.price <= 0) {
      return json({ error: 'Geçersiz paket seçimi' }, { status: 400 })
    }
    if (!requestKey || !/^[A-Za-z0-9_-]{8,128}$/.test(requestKey)) {
      return json({ error: 'Satın alma için geçerli bir idempotency anahtarı zorunludur' }, { status: 400 })
    }

    const collection = db.collection('billing_purchases')
    const existing = await collection.findOne({ user_id: user.id, idempotency_key: requestKey }, { projection: { _id: 0 } })
    if (existing) {
      if (existing.package_id !== packagePlan.id) return json({ error: 'Bu istek anahtarı farklı bir paket için kullanılmış' }, { status: 409 })
      return json({ purchase: existing, checkoutFormContent: existing.checkout_form_content, paymentPageUrl: existing.payment_page_url })
    }

    const packageSettings = await getPackageSettings(db, packagePlan.id)
    if (!packageSettings.is_active || !packageSettings.is_public) {
      return json({ error: 'Bu paket şu anda satışa açık değil' }, { status: 409 })
    }

    const purchaseId = uuidv4()
    const now = new Date()

    if (isIyzico) {
      try {
        const baseUrl = getNotificationBaseUrl(request)
        const callbackUrl = `${baseUrl}/api/billing/iyzico/callback`
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'

        const iyzicoResult = await initializeIyzicoCheckout({
          user,
          packagePlan,
          purchaseId,
          callbackUrl,
          ip,
        })

        const purchase = {
          id: purchaseId,
          user_id: user.id,
          idempotency_key: requestKey,
          package_id: packagePlan.id,
          amount: packagePlan.price,
          currency: 'TRY',
          provider: 'iyzico',
          iyzico_token: iyzicoResult.token,
          checkout_form_content: iyzicoResult.checkoutFormContent,
          payment_page_url: iyzicoResult.paymentPageUrl,
          status: 'pending',
          created_at: now,
          updated_at: now,
        }

        await collection.insertOne({ ...purchase })
        return json({
          purchase,
          checkoutFormContent: iyzicoResult.checkoutFormContent,
          paymentPageUrl: iyzicoResult.paymentPageUrl,
          token: iyzicoResult.token,
        }, { status: 201 })
      } catch (err) {
        return json({ error: err.message || 'Ödeme oturumu oluşturulamadı' }, { status: 502 })
      }
    }

    // Mock provider fallback (only active when isMockPaymentEnabled() is true)
    const purchase = {
      id: purchaseId,
      user_id: user.id,
      idempotency_key: requestKey,
      package_id: packagePlan.id,
      amount: packagePlan.price,
      currency: 'TRY',
      provider: 'mock',
      status: 'pending',
      created_at: now,
      updated_at: now,
    }

    try {
      await collection.insertOne({ ...purchase })
    } catch (error) {
      if (error?.code !== 11000) throw error
      const duplicate = await collection.findOne({ user_id: user.id, idempotency_key: requestKey }, { projection: { _id: 0 } })
      if (!duplicate) throw error
      if (duplicate.package_id !== packagePlan.id) return json({ error: 'Bu istek anahtarı farklı bir paket için kullanılmış' }, { status: 409 })
      return json({ purchase: duplicate })
    }

    return json({ purchase }, { status: 201 })
  }

  if (route === '/billing/mock-confirm' && method === 'POST') {
    if (!isMockPaymentEnabled()) {
      return json({ error: 'Mock ödeme onayı üretimde devre dışıdır' }, { status: 404 })
    }
    const body = await request.json().catch(() => ({}))
    const purchaseId = typeof body.purchaseId === 'string' ? body.purchaseId : ''
    if (!purchaseId) return json({ error: 'Satın alma kimliği zorunludur' }, { status: 400 })

    const purchases = db.collection('billing_purchases')
    const purchase = await purchases.findOne({ id: purchaseId, user_id: user.id, provider: 'mock' }, { projection: { _id: 0 } })
    if (!purchase) return json({ error: 'Satın alma bulunamadı' }, { status: 404 })

    const baseUrl = getNotificationBaseUrl(request)
    const result = await completePurchaseAndGrantCredits({
      db,
      purchaseId: purchase.id,
      provider: 'mock',
      baseUrl,
    })

    return json({ ok: true, purchaseId: purchase.id, packageId: result.packageId, eventCredits: result.eventCredits })
  }

  return null
}

