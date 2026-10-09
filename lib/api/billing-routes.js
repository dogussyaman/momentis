import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getBillingPlan, isMockPaymentEnabled } from '@/lib/billing/plans'
import { ensureBillingAccount, ensureBillingIndexes, getBillingSnapshot } from '@/lib/billing/usage'

const json = (data, init) => NextResponse.json(data, init)

export async function handleBillingRoutes({ db, route, method, request, user }) {
  if (!route.startsWith('/billing')) return null
  if (!user) return json({ error: 'Oturum gerekli' }, { status: 401 })
  await ensureBillingIndexes(db)

  if (route === '/billing/account' && method === 'GET') {
    return json(await getBillingSnapshot(db, user.id), { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/billing/checkout' && method === 'POST') {
    if (!isMockPaymentEnabled()) {
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
      return json({ purchase: existing })
    }

    const purchase = {
      id: uuidv4(),
      user_id: user.id,
      idempotency_key: requestKey,
      package_id: packagePlan.id,
      amount: packagePlan.price,
      currency: 'TRY',
      provider: 'mock',
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
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
    const packagePlan = getBillingPlan(purchase.package_id)
    if (!packagePlan || packagePlan.grantMode !== 'event_credits') {
      return json({ error: 'Satın alınan paket geçersiz' }, { status: 409 })
    }

    await purchases.updateOne(
      { id: purchase.id, status: { $in: ['pending', 'mock_verified'] } },
      { $set: { status: 'mock_verified', verified_at: purchase.verified_at || new Date(), updated_at: new Date() } },
    )
    const grant = {
      id: uuidv4(),
      user_id: user.id,
      purchase_id: purchase.id,
      package_id: packagePlan.id,
      scope: packagePlan.scope,
      grant_mode: packagePlan.grantMode,
      event_credits: packagePlan.eventCredits,
      remaining_event_credits: packagePlan.eventCredits,
      assigned_project_ids: [],
      provider: 'mock',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }
    await db.collection('billing_grants').updateOne(
      { purchase_id: purchase.id },
      { $setOnInsert: grant },
      { upsert: true },
    )
    await ensureBillingAccount(db, user.id)
    return json({ ok: true, purchaseId: purchase.id, packageId: packagePlan.id, eventCredits: packagePlan.eventCredits })
  }

  return null
}
