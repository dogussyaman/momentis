import { createHash } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { canManageSuperAdmin } from '../admin/authorization.js'
import { getRequestKey } from '../billing/usage.js'
import { withVipCreditTransaction } from '../vip-design/credits.js'
import { getNotificationBaseUrl, notifyUser, publishNotificationsSafely } from '../notifications/service.js'

const json = (data, init) => Response.json(data, init)
const noId = { projection: { _id: 0 } }
let indexesReady

async function ensureCampaignIndexes(db) {
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection('credit_coupons').createIndex({ code: 1 }, { unique: true }),
      db.collection('credit_coupons').createIndex({ active: 1, starts_at: 1, ends_at: 1 }),
      db.collection('credit_campaigns').createIndex({ created_at: -1 }),
      db.collection('admin_credit_batches').createIndex({ request_key: 1 }, { unique: true }),
      db.collection('admin_credit_batch_results').createIndex({ batch_id: 1, user_id: 1 }, { unique: true }),
      db.collection('admin_credit_batch_results').createIndex({ batch_id: 1, status: 1 }),
      db.collection('coupon_redemptions').createIndex({ request_key: 1 }, { unique: true }),
      db.collection('coupon_redemptions').createIndex({ coupon_id: 1, user_id: 1, created_at: -1 }),
      db.collection('coupon_attempt_windows').createIndex({ user_id: 1 }, { unique: true }),
      db.collection('admin_campaign_attempt_windows').createIndex({ user_id: 1 }, { unique: true }),
      db.collection('admin_credit_movements').createIndex({ request_key: 1 }, { unique: true }),
    ]).catch((error) => {
      indexesReady = null
      throw error
    })
  }
  await indexesReady
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const parsedOrigin = new URL(origin)
    if (parsedOrigin.origin !== origin) return false
    const requestUrl = new URL(request.url)
    const hosts = [
      request.headers.get('x-forwarded-host')?.split(',')[0].trim(),
      request.headers.get('host'),
      requestUrl.host,
    ].filter(Boolean)
    const protocols = [
      request.headers.get('x-forwarded-proto')?.split(',')[0].trim(),
      requestUrl.protocol.slice(0, -1),
    ].filter(Boolean)
    return hosts.some((host) => protocols.some((protocol) => parsedOrigin.origin === `${protocol}://${host}`))
  } catch {
    return false
  }
}

function userFilter(filters = {}) {
  const filter = { account_status: { $nin: ['suspended', 'deleted'] } }
  const query = typeof filters.q === 'string' ? filters.q.trim().slice(0, 100) : ''
  if (query) {
    const safeQuery = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: safeQuery }, { email: safeQuery }]
  }
  if (['user', 'support', 'admin', 'super_admin'].includes(filters.role)) filter.role = filters.role
  return filter
}

async function resolveTargets(db, selection) {
  if (selection.all === true) {
    const filter = userFilter()
    const items = await db.collection('users')
      .find(filter, { projection: { _id: 0, id: 1 } })
      .limit(10001)
      .toArray()
    if (items.length > 10000) return { error: 'Toplu işlem en fazla 10.000 aktif kullanıcıyla sınırlandırılmıştır' }
    return { userIds: items.map(({ id }) => id), requestedCount: items.length }
  }

  if (Array.isArray(selection.userIds)) {
    const ids = [...new Set(selection.userIds)]
    if (!ids.length || ids.length > 10000 || ids.some((id) => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id))) {
      return { error: 'Kullanıcı seçimi geçersiz; tek işlemde en fazla 10.000 kullanıcı seçilebilir' }
    }
    const filter = userFilter()
    filter.id = { $in: ids }
    const items = await db.collection('users')
      .find(filter, { projection: { _id: 0, id: 1 } })
      .toArray()
    return { userIds: items.map(({ id }) => id), requestedCount: ids.length }
  }

  const filters = selection.filters && typeof selection.filters === 'object' && !Array.isArray(selection.filters)
    ? selection.filters
    : null
  if (!filters || Object.keys(selection).some((key) => !['filters', 'all'].includes(key))) {
    return { error: 'Kullanıcı kimlikleri veya filtre seçimi zorunludur' }
  }
  const filter = userFilter(filters)
  if (filters.package && filters.package !== 'all') {
    const packageId = String(filters.package)
    const [grants, accounts] = await Promise.all([
      db.collection('billing_grants').find({ package_id: packageId, status: 'active' }, { projection: { _id: 0, user_id: 1 } }).toArray(),
      db.collection('billing_accounts').find({ plan_id: packageId }, { projection: { _id: 0, user_id: 1 } }).toArray(),
    ])
    filter.id = { $in: [...new Set([...grants, ...accounts].map(({ user_id: id }) => id))] }
  }
  const items = await db.collection('users')
    .find(filter, { projection: { _id: 0, id: 1 } })
    .limit(10001)
    .toArray()
  if (items.length > 10000) return { error: 'Toplu işlem en fazla 10.000 aktif kullanıcıyla sınırlandırılmıştır' }
  return { userIds: items.map(({ id }) => id), requestedCount: items.length }
}

function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function sanitizeReason(value) {
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[phone]')
    .replace(/\b(token|password|secret|authorization)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 500)
}

async function getBatchReport(db, batch) {
  const results = await db.collection('admin_credit_batch_results')
    .find({ batch_id: batch.id }, { projection: { _id: 0, user_id: 1, status: 1, amount: 1, error: 1, created_at: 1 } })
    .toArray()
  return {
    id: batch.id,
    campaignId: batch.campaign_id,
    status: batch.status,
    requested: batch.user_ids.length,
    amountPerUser: batch.amount_per_user,
    totalAmount: batch.amount_per_user * batch.user_ids.length,
    reason: batch.reason,
    results,
    summary: {
      succeeded: results.filter((item) => item.status === 'applied').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      failed: results.filter((item) => item.status === 'failed').length,
    },
    createdAt: batch.created_at,
    completedAt: batch.completed_at || null,
  }
}

async function processCreditBatch(db, batch, actor, options = {}) {
  const baseUrl = options.baseUrl
  const results = db.collection('admin_credit_batch_results')
  for (const targetId of batch.user_ids) {
    const priorResult = await results.findOne({ batch_id: batch.id, user_id: targetId }, noId)
    if (priorResult && priorResult.status !== 'failed') continue
    let target = null
    try {
      await withVipCreditTransaction(db, async (session) => {
        const existingResult = await results.findOne({ batch_id: batch.id, user_id: targetId }, { ...noId, session })
        if (existingResult && existingResult.status !== 'failed') return
        if (existingResult?.status === 'failed') {
          await results.deleteOne({ batch_id: batch.id, user_id: targetId, status: 'failed' }, { session })
        }
        target = await db.collection('users').findOne(
          { id: targetId, account_status: { $nin: ['suspended', 'deleted'] } },
          { projection: { _id: 0, id: 1, email: 1, name: 1 }, session },
        )
        if (!target) {
          await results.insertOne({
            batch_id: batch.id, user_id: targetId, status: 'skipped',
            error: 'Hesap etkin değil veya bulunamadı', created_at: new Date(),
          }, { session })
          return
        }
        const now = new Date()
        const grantId = uuidv4()
        const movementId = uuidv4()
        const requestKey = `${batch.id}:${targetId}`
        const grant = {
          id: grantId,
          user_id: targetId,
          purchase_id: `admin-batch:${batch.id}:${targetId}`,
          package_id: 'premium',
          scope: 'event',
          grant_mode: 'event_credits',
          event_credits: batch.amount_per_user,
          remaining_event_credits: batch.amount_per_user,
          assigned_project_ids: [],
          provider: 'admin',
          status: 'active',
          campaign_id: batch.campaign_id,
          created_at: now,
          updated_at: now,
        }
        await db.collection('billing_grants').insertOne(grant, { session })
        await db.collection('admin_credit_movements').insertOne({
          id: movementId,
          user_id: targetId,
          request_key: requestKey,
          kind: 'credit',
          amount: batch.amount_per_user,
          package_id: 'premium',
          grant_id: grantId,
          campaign_id: batch.campaign_id,
          batch_id: batch.id,
          reason: batch.reason,
          actor_user_id: actor.id,
          created_at: now,
        }, { session })
        await db.collection('admin_audit_logs').insertOne({
          id: uuidv4(),
          actor_user_id: actor.id,
          action: 'user.credits.bulk_granted',
          target_type: 'user',
          target_id: targetId,
          before: null,
          after: { amount: batch.amount_per_user, campaign_id: batch.campaign_id },
          reason: batch.reason,
          outcome: 'success',
          created_at: now,
        }, { session })
        await results.insertOne({
          batch_id: batch.id,
          user_id: targetId,
          status: 'applied',
          amount: batch.amount_per_user,
          created_at: now,
        }, { session })
      })

      if (batch.send_email && target?.email) {
        await publishNotificationsSafely('admin-bulk-credit-grant', () => notifyUser(db, target, {
          eventId: `admin-bulk-grant:${batch.id}:${target.id}`,
          type: 'billing',
          title: 'Hediye etkinlik kredisi hesabınıza eklendi',
          message: `${batch.amount_per_user} adet Premium etkinlik kredisi hesabınıza tanımlandı.${batch.reason ? ` Kampanya: ${batch.reason}` : ''}`,
          href: '/panel/paketim',
          emailTemplate: 'adminCreditGranted',
          email: true,
        }, { baseUrl }))
      }
    } catch {
      const alreadySaved = await results.findOne({ batch_id: batch.id, user_id: targetId }, noId)
      if (alreadySaved && alreadySaved.status !== 'failed') continue
      try {
        const failure = {
          status: 'failed',
          error: 'Kredi işlemi tamamlanamadı',
          attempted_at: new Date(),
        }
        if (alreadySaved) {
          await results.updateOne({ batch_id: batch.id, user_id: targetId }, { $set: failure })
        } else {
          await results.insertOne({
            batch_id: batch.id,
            user_id: targetId,
            ...failure,
            created_at: new Date(),
          })
        }
      } catch (error) {
        if (error?.code !== 11000) throw error
      }
    }
  }
  const report = await getBatchReport(db, batch)
  const completedAt = report.results.length === batch.user_ids.length && report.summary.failed === 0 ? new Date() : null
  await db.collection('admin_credit_batches').updateOne(
    { id: batch.id },
    { $set: { status: completedAt ? 'completed' : 'partial', completed_at: completedAt, summary: report.summary } },
  )
  return { ...report, status: completedAt ? 'completed' : 'partial', completedAt }
}

async function createCoupon(db, body, actor) {
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
  const credits = Number(body?.credits || body?.credits_per_package || 4)
  const creditsPerPackage = Number(body?.credits_per_package || credits || 4)
  const startsAt = new Date(body?.startsAt)
  const endsAt = new Date(body?.endsAt)
  const totalLimit = body?.totalLimit === null || body?.totalLimit === '' ? null : Number(body?.totalLimit)
  const perUserLimit = Number(body?.perUserLimit)
  const terms = typeof body?.terms === 'string' ? body.terms.trim() : ''
  const isTestOnly = Boolean(body?.is_test_only ?? false)
  const rawPackages = Array.isArray(body?.packages) ? body.packages : ['premium']
  const packages = [...new Set(rawPackages.map(String).filter((p) => ['premium', 'atolye'].includes(p)))]
  const allowedKeys = ['code', 'kind', 'credits', 'credits_per_package', 'packages', 'is_test_only', 'startsAt', 'endsAt', 'totalLimit', 'perUserLimit', 'terms', 'active']

  if (!body || Object.keys(body).some((key) => !allowedKeys.includes(key)) ||
    body.kind !== 'credit_gift' || !/^[A-Z0-9_-]{3,32}$/.test(code) ||
    !packages.length ||
    !Number.isInteger(creditsPerPackage) || creditsPerPackage < 1 || creditsPerPackage > 1000 ||
    !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt ||
    (totalLimit !== null && (!Number.isInteger(totalLimit) || totalLimit < 1 || totalLimit > 1000000)) ||
    !Number.isInteger(perUserLimit) || perUserLimit < 1 || perUserLimit > 10 ||
    terms.length > 500 || (body.active !== undefined && typeof body.active !== 'boolean')) {
    return { error: 'Yalnızca geçerli süre/limit koşulları ve ücretli paket seçenekleri olan kredi hediyesi kuponları oluşturulabilir' }
  }
  const now = new Date()
  const campaignId = uuidv4()
  const coupon = {
    id: uuidv4(),
    campaign_id: campaignId,
    code,
    kind: 'credit_gift',
    credits: creditsPerPackage * packages.length,
    credits_per_package: creditsPerPackage,
    packages,
    is_test_only: isTestOnly,
    starts_at: startsAt,
    ends_at: endsAt,
    total_limit: totalLimit,
    per_user_limit: perUserLimit,
    redemption_count: 0,
    terms,
    active: body.active !== false,
    created_by: actor.id,
    created_at: now,
    updated_at: now,
  }
  const campaign = {
    id: campaignId,
    kind: 'coupon',
    label: code,
    credits_per_redemption: coupon.credits,
    distributed_credits: 0,
    coupon_id: coupon.id,
    created_by: actor.id,
    created_at: now,
  }
  try {
    await withVipCreditTransaction(db, async (session) => {
      await db.collection('credit_coupons').insertOne(coupon, { session })
      await db.collection('credit_campaigns').insertOne(campaign, { session })
      await db.collection('admin_audit_logs').insertOne({
        id: uuidv4(),
        actor_user_id: actor.id,
        action: 'coupon.created',
        target_type: 'coupon',
        target_id: coupon.id,
        before: null,
        after: { kind: coupon.kind, credits: coupon.credits, packages, is_test_only: isTestOnly, total_limit: totalLimit, per_user_limit: perUserLimit },
        outcome: 'success',
        created_at: now,
      }, { session })
    })
  } catch (error) {
    if (error?.code === 11000) return { error: 'Bu kupon kodu zaten kullanılıyor', status: 409 }
    throw error
  }
  return { coupon }
}

async function allowAttempts(db, collectionName, userId, limit, windowMinutes) {
  const now = new Date()
  const cutoff = new Date(now.getTime() - windowMinutes * 60 * 1000)
  const collection = db.collection(collectionName)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const existing = await collection.findOne({ user_id: userId }, noId)
    if (!existing) {
      try {
        await collection.insertOne({ user_id: userId, window_started_at: now, count: 1 })
        return true
      } catch (error) {
        if (error?.code !== 11000) throw error
        continue
      }
    }
    if (existing.window_started_at > cutoff) {
      if (existing.count >= limit) return false
      const updated = await collection.updateOne(
        { user_id: userId, count: existing.count, window_started_at: existing.window_started_at },
        { $inc: { count: 1 } },
      )
      if (updated.modifiedCount) return true
      continue
    }
    const updated = await collection.updateOne(
      { user_id: userId, window_started_at: existing.window_started_at },
      { $set: { window_started_at: now, count: 1 } },
    )
    if (updated.modifiedCount) return true
  }
  throw new Error('Kupon deneme sınırı güncellenemedi')
}

async function redeemCoupon(db, user, code, requestKey) {
  const redemptions = db.collection('coupon_redemptions')
  const previous = await redemptions.findOne({ request_key: requestKey }, noId)
  if (previous) {
    if (previous.user_id !== user.id || previous.code !== code) return { status: 409, error: 'İstek anahtarı başka bir işlemde kullanılmış' }
    return { ok: true, idempotent: true, credits: previous.credits }
  }
  const now = new Date()
  return withVipCreditTransaction(db, async (session) => {
    const coupon = await db.collection('credit_coupons').findOne(
      { code, active: true, kind: 'credit_gift', starts_at: { $lte: now }, ends_at: { $gt: now } },
      { ...noId, session },
    )
    if (!coupon) return { status: 404, error: 'Kupon geçersiz, pasif veya kullanım süresi dışında' }

    if (coupon.is_test_only) {
      const isProd = process.env.NODE_ENV === 'production'
      if (isProd) {
        const allowTestInProd = process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD === 'true'
        if (!allowTestInProd) {
          return { status: 403, error: 'Test kuponları üretim ortamında kullanılamaz' }
        }
        const allowedEmails = (process.env.MOMENTIS_TEST_COUPON_ALLOWLIST || '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
        const isPrivileged = ['super_admin', 'admin'].includes(user.role)
        const isAllowlisted = allowedEmails.includes(user.email?.toLowerCase()) || allowedEmails.includes(user.id)
        const isExplicitlyAllowed = Array.isArray(coupon.allowed_user_ids) && coupon.allowed_user_ids.includes(user.id)
        if (!isPrivileged && !isAllowlisted && !isExplicitlyAllowed) {
          return { status: 403, error: 'Test kuponları üretim ortamında yalnızca yetkili test hesapları tarafından kullanılabilir' }
        }
      }
    }

    const userCount = await redemptions.countDocuments({ coupon_id: coupon.id, user_id: user.id }, { session })
    if (userCount >= coupon.per_user_limit) return { status: 409, error: 'Bu kupon için kullanıcı başına kullanım sınırına ulaşıldı' }
    const couponFilter = { id: coupon.id, active: true }
    if (coupon.total_limit !== null) couponFilter.redemption_count = { $lt: coupon.total_limit }
    const reserved = await db.collection('credit_coupons').updateOne(
      couponFilter,
      { $inc: { redemption_count: 1 }, $set: { updated_at: now } },
      { session },
    )
    if (!reserved.modifiedCount) return { status: 409, error: 'Kuponun toplam kullanım limiti doldu' }

    const targetPackages = Array.isArray(coupon.packages) && coupon.packages.length ? coupon.packages : ['premium']
    const creditsPerPkg = coupon.credits_per_package || (targetPackages.length === 1 ? coupon.credits : Math.floor(coupon.credits / targetPackages.length)) || 4
    const totalCredits = creditsPerPkg * targetPackages.length

    const redemption = {
      id: uuidv4(),
      coupon_id: coupon.id,
      campaign_id: coupon.campaign_id,
      user_id: user.id,
      code,
      credits: totalCredits,
      packages: targetPackages,
      credits_per_package: creditsPerPkg,
      request_key: requestKey,
      is_test_only: Boolean(coupon.is_test_only),
      created_at: now,
    }

    for (const pkg of targetPackages) {
      const grantId = uuidv4()
      await db.collection('billing_grants').insertOne({
        id: grantId,
        user_id: user.id,
        purchase_id: `coupon-redemption:${redemption.id}:${pkg}`,
        package_id: pkg,
        scope: 'event',
        grant_mode: 'event_credits',
        event_credits: creditsPerPkg,
        remaining_event_credits: creditsPerPkg,
        assigned_project_ids: [],
        provider: coupon.is_test_only ? 'test_coupon' : 'coupon',
        status: 'active',
        campaign_id: coupon.campaign_id,
        coupon_id: coupon.id,
        redemption_id: redemption.id,
        is_test: Boolean(coupon.is_test_only),
        created_at: now,
        updated_at: now,
      }, { session })

      await db.collection('admin_credit_movements').insertOne({
        id: uuidv4(),
        user_id: user.id,
        request_key: `coupon:${requestKey}:${pkg}`,
        kind: 'credit',
        amount: creditsPerPkg,
        package_id: pkg,
        grant_id: grantId,
        campaign_id: coupon.campaign_id,
        coupon_id: coupon.id,
        redemption_id: redemption.id,
        reason: `Kupon kullanımı: ${code} (${pkg})`,
        actor_user_id: null,
        created_at: now,
      }, { session })
    }

    await redemptions.insertOne(redemption, { session })
    await db.collection('credit_campaigns').updateOne(
      { id: coupon.campaign_id },
      { $inc: { distributed_credits: totalCredits }, $set: { updated_at: now } },
      { session },
    )
    return { ok: true, credits: totalCredits, packages: targetPackages, redemptionId: redemption.id }
  })
}

export async function handleCampaignRoutes({ db, route, method, request, user }) {
  const isAdminRoute = route === '/admin/campaigns' || route.startsWith('/admin/campaigns/') ||
    route === '/admin/coupons' || route.startsWith('/admin/coupons/')
  const isCouponUserRoute = route === '/billing/coupons/redeem' || route === '/billing/coupons/history'
  if (!isAdminRoute && !isCouponUserRoute) return null
  await ensureCampaignIndexes(db)

  if (isAdminRoute && !canManageSuperAdmin(user)) {
    return json({ error: user ? 'Yalnızca super admin kampanya yönetebilir' : 'Oturum gerekli' }, { status: user ? 403 : 401 })
  }
  if (isCouponUserRoute && !user) return json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  if (isAdminRoute && method !== 'GET') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    if (!await allowAttempts(db, 'admin_campaign_attempt_windows', user.id, 60, 10)) {
      return json({ error: 'Çok fazla kampanya işlemi. 10 dakika sonra tekrar deneyin.' }, { status: 429 })
    }
  }

  if (route === '/admin/campaigns/bulk-preview' && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const body = await request.json().catch(() => null)
    const selection = body?.all === true ? { all: true } : body?.userIds ? { userIds: body.userIds } : { filters: body?.filters }
    const resolved = await resolveTargets(db, selection)
    if (resolved.error) return json({ error: resolved.error }, { status: 400 })
    const amount = Number(body?.creditsPerUser)
    const reason = sanitizeReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000 || reason.length < 10 || reason.length > 500) {
      return json({ error: '1–1000 kredi ve 10–500 karakterlik açıklama zorunludur' }, { status: 400 })
    }
    return json({
      userIds: resolved.userIds,
      userCount: resolved.userIds.length,
      requestedCount: resolved.requestedCount,
      creditsPerUser: amount,
      totalCredits: resolved.userIds.length * amount,
      sendEmail: Boolean(body?.sendEmail),
      reason,
      plan: 'premium',
    })
  }

  if (route === '/admin/campaigns/credit-batch' && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Toplu kredi işlemi için Idempotency-Key zorunludur' }, { status: 400 })
    const body = await request.json().catch(() => null)
    const selection = body?.all === true ? { all: true } : body?.userIds ? { userIds: body.userIds } : { filters: body?.filters }
    const resolved = await resolveTargets(db, selection)
    if (resolved.error) return json({ error: resolved.error }, { status: 400 })
    const amount = Number(body?.creditsPerUser)
    const reason = sanitizeReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    const sendEmail = Boolean(body?.sendEmail)
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000 || reason.length < 10 || reason.length > 500 ||
      Object.keys(body || {}).some((key) => !['userIds', 'filters', 'all', 'creditsPerUser', 'reason', 'sendEmail'].includes(key))) {
      return json({ error: '1–1000 kredi ve 10–500 karakterlik açıklama zorunludur' }, { status: 400 })
    }
    if (!resolved.userIds.length) return json({ error: 'Kredi dağıtımı için en az bir etkin kullanıcı eşleşmelidir' }, { status: 400 })
    const requestFingerprint = fingerprint({ userIds: resolved.userIds, amount, reason, sendEmail })
    let batch = await db.collection('admin_credit_batches').findOne({ request_key: requestKey }, noId)
    if (batch) {
      if (batch.fingerprint !== requestFingerprint || batch.actor_user_id !== user.id) {
        return json({ error: 'Bu Idempotency-Key farklı bir işlemde kullanılmış' }, { status: 409 })
      }
      if (batch.status === 'completed') return json(await getBatchReport(db, batch))
    } else {
      const now = new Date()
      batch = {
        id: uuidv4(),
        request_key: requestKey,
        fingerprint: requestFingerprint,
        user_ids: resolved.userIds,
        amount_per_user: amount,
        reason,
        send_email: sendEmail,
        actor_user_id: user.id,
        status: 'processing',
        created_at: now,
      }
      const campaign = {
        id: uuidv4(),
        kind: 'admin_gift',
        label: reason.slice(0, 80),
        credits_per_user: amount,
        target_count: resolved.userIds.length,
        distributed_credits: 0,
        created_by: user.id,
        batch_id: batch.id,
        created_at: now,
      }
      batch.campaign_id = campaign.id
      try {
        await withVipCreditTransaction(db, async (session) => {
          await db.collection('admin_credit_batches').insertOne(batch, { session })
          await db.collection('credit_campaigns').insertOne(campaign, { session })
          await db.collection('admin_audit_logs').insertOne({
            id: uuidv4(),
            actor_user_id: user.id,
            action: 'credits.bulk_started',
            target_type: 'credit_campaign',
            target_id: campaign.id,
            before: null,
            after: { users: resolved.userIds.length, credits_per_user: amount, send_email: sendEmail },
            reason,
            outcome: 'success',
            created_at: now,
          }, { session })
        })
      } catch (error) {
        if (error?.code !== 11000) throw error
        batch = await db.collection('admin_credit_batches').findOne({ request_key: requestKey }, noId)
        if (!batch || batch.fingerprint !== requestFingerprint || batch.actor_user_id !== user.id) {
          return json({ error: 'Bu Idempotency-Key başka bir işlemde kullanılmış' }, { status: 409 })
        }
        if (batch.status === 'completed') return json(await getBatchReport(db, batch))
      }
    }

    const report = await processCreditBatch(db, batch, user, { baseUrl: getNotificationBaseUrl(request) })
    await db.collection('credit_campaigns').updateOne(
      { id: batch.campaign_id },
      { $set: { distributed_credits: report.summary.succeeded * amount, updated_at: new Date() } },
    )
    return json(report)
  }

  if (route === '/admin/campaigns' && method === 'GET') {
    const [campaigns, coupons, batches] = await Promise.all([
      db.collection('credit_campaigns').find({}, noId).sort({ created_at: -1 }).limit(200).toArray(),
      db.collection('credit_coupons').find({}, {
        projection: { _id: 0, id: 1, campaign_id: 1, code: 1, kind: 1, credits: 1, credits_per_package: 1, packages: 1, is_test_only: 1, starts_at: 1, ends_at: 1, total_limit: 1, per_user_limit: 1, redemption_count: 1, terms: 1, active: 1, created_at: 1 },
      }).sort({ created_at: -1 }).limit(200).toArray(),
      db.collection('admin_credit_batches').find({}, {
        projection: { _id: 0, id: 1, campaign_id: 1, status: 1, user_ids: 1, amount_per_user: 1, reason: 1, created_at: 1, completed_at: 1 },
      }).sort({ created_at: -1 }).limit(200).toArray(),
    ])
    return json({ campaigns, coupons, batches: batches.map((batch) => ({
      id: batch.id,
      campaignId: batch.campaign_id,
      status: batch.status,
      userCount: batch.user_ids.length,
      amountPerUser: batch.amount_per_user,
      reason: batch.reason,
      createdAt: batch.created_at,
      completedAt: batch.completed_at || null,
    })) }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const batchMatch = route.match(/^\/admin\/campaigns\/batches\/([a-zA-Z0-9_-]+)$/)
  if (batchMatch && method === 'GET') {
    const batch = await db.collection('admin_credit_batches').findOne({ id: batchMatch[1] }, noId)
    if (!batch) return json({ error: 'Kredi dağıtımı bulunamadı' }, { status: 404 })
    return json(await getBatchReport(db, batch), { headers: { 'Cache-Control': 'no-store' } })
  }

  const retryBatchMatch = route.match(/^\/admin\/campaigns\/batches\/([a-zA-Z0-9_-]+)\/retry$/)
  if (retryBatchMatch && method === 'POST') {
    const batch = await db.collection('admin_credit_batches').findOne({ id: retryBatchMatch[1] }, noId)
    if (!batch) return json({ error: 'Kredi dağıtımı bulunamadı' }, { status: 404 })
    if (batch.status === 'completed') return json(await getBatchReport(db, batch))
    const report = await processCreditBatch(db, batch, { id: batch.actor_user_id }, { baseUrl: getNotificationBaseUrl(request) })
    await db.collection('credit_campaigns').updateOne(
      { id: batch.campaign_id },
      { $set: { distributed_credits: report.summary.succeeded * batch.amount_per_user, updated_at: new Date() } },
    )
    return json(report)
  }

  if (route === '/admin/coupons' && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const body = await request.json().catch(() => null)
    const result = await createCoupon(db, body, user)
    if (result.error) return json({ error: result.error }, { status: result.status || 400 })
    return json({ ok: true, coupon: result.coupon }, { status: 201 })
  }

  const couponMatch = route.match(/^\/admin\/coupons\/([a-zA-Z0-9_-]+)$/)
  const couponRedemptionsMatch = route.match(/^\/admin\/coupons\/([a-zA-Z0-9_-]+)\/redemptions$/)
  if (couponRedemptionsMatch && method === 'GET') {
    const coupon = await db.collection('credit_coupons').findOne({ id: couponRedemptionsMatch[1] }, {
      projection: { _id: 0, id: 1 },
    })
    if (!coupon) return json({ error: 'Kupon bulunamadı' }, { status: 404 })
    const items = await db.collection('coupon_redemptions')
      .find({ coupon_id: coupon.id }, {
        projection: { _id: 0, id: 1, user_id: 1, credits: 1, packages: 1, credits_per_package: 1, is_test_only: 1, created_at: 1 },
      })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()
    return json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const revokeUnusedMatch = route.match(/^\/admin\/coupons\/([a-zA-Z0-9_-]+)\/revoke-unused$/)
  if (revokeUnusedMatch && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const body = await request.json().catch(() => null)
    const reason = sanitizeReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    if (reason.length < 10 || reason.length > 500) {
      return json({ error: '10–500 karakterlik iptal gerekçesi zorunludur' }, { status: 400 })
    }
    const coupon = await db.collection('credit_coupons').findOne({ id: revokeUnusedMatch[1] }, noId)
    if (!coupon) return json({ error: 'Kupon bulunamadı' }, { status: 404 })

    const grants = await db.collection('billing_grants')
      .find({ coupon_id: coupon.id, status: 'active' })
      .toArray()

    let revokedCount = 0
    let revokedCredits = 0
    let skippedCount = 0
    let skippedCredits = 0

    const now = new Date()
    for (const grant of grants) {
      const isCompletelyUnused = (grant.remaining_event_credits === grant.event_credits) &&
        (!Array.isArray(grant.assigned_project_ids) || grant.assigned_project_ids.length === 0)

      if (!isCompletelyUnused) {
        skippedCount += 1
        skippedCredits += (grant.remaining_event_credits || 0)
        continue
      }

      await withVipCreditTransaction(db, async (session) => {
        const updateRes = await db.collection('billing_grants').updateOne(
          { id: grant.id, status: 'active', remaining_event_credits: grant.event_credits },
          { $set: { status: 'revoked', remaining_event_credits: 0, revoked_at: now, revocation_reason: reason, revoked_by: user.id, updated_at: now } },
          { session }
        )
        if (updateRes.modifiedCount) {
          revokedCount += 1
          revokedCredits += grant.event_credits
          await db.collection('admin_credit_movements').insertOne({
            id: uuidv4(),
            user_id: grant.user_id,
            request_key: `revoke:${grant.id}:${now.getTime()}`,
            kind: 'debit',
            amount: grant.event_credits,
            package_id: grant.package_id,
            grant_id: grant.id,
            campaign_id: grant.campaign_id,
            coupon_id: coupon.id,
            reason: `Kupon kullanılmamış kredi iptali: ${reason}`,
            actor_user_id: user.id,
            created_at: now,
          }, { session })
          await db.collection('admin_audit_logs').insertOne({
            id: uuidv4(),
            actor_user_id: user.id,
            action: 'coupon.grants_revoked',
            target_type: 'billing_grant',
            target_id: grant.id,
            before: { status: 'active', credits: grant.event_credits },
            after: { status: 'revoked', credits: 0 },
            reason,
            outcome: 'success',
            created_at: now,
          }, { session })
        }
      })
    }

    return json({
      ok: true,
      couponId: coupon.id,
      code: coupon.code,
      revokedCount,
      revokedCredits,
      skippedCount,
      skippedCredits,
      message: skippedCount > 0
        ? `${revokedCount} adet kullanılmamış kredi paketi iptal edildi. ${skippedCount} adet etkinliğe atanmış veya kısmen kullanılmış paket kullanıcı verisini korumak için muhafaza edildi.`
        : `${revokedCount} adet kullanılmamış kredi paketi başarıyla geri alındı.`
    })
  }

  if (couponMatch && method === 'PATCH') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const body = await request.json().catch(() => null)
    if (!body || Object.keys(body).length !== 1 || typeof body.active !== 'boolean') {
      return json({ error: 'Yalnızca kupon aktifliği değiştirilebilir' }, { status: 400 })
    }
    const coupon = await db.collection('credit_coupons').findOne({ id: couponMatch[1] }, noId)
    if (!coupon) return json({ error: 'Kupon bulunamadı' }, { status: 404 })
    if (coupon.active !== body.active) {
      await db.collection('credit_coupons').updateOne({ id: coupon.id, active: coupon.active }, {
        $set: { active: body.active, updated_at: new Date() },
      })
      await db.collection('admin_audit_logs').insertOne({
        id: uuidv4(),
        actor_user_id: user.id,
        action: `coupon.${body.active ? 'activated' : 'deactivated'}`,
        target_type: 'coupon',
        target_id: coupon.id,
        before: { active: coupon.active },
        after: { active: body.active },
        outcome: 'success',
        created_at: new Date(),
      })
    }
    return json({ ok: true, active: body.active })
  }

  if (route === '/admin/campaigns/report' && method === 'GET') {
    const [campaigns, coupons, batches] = await Promise.all([
      db.collection('credit_campaigns').find({}, noId).sort({ created_at: -1 }).limit(200).toArray(),
      db.collection('credit_coupons').find({}, {
        projection: { _id: 0, id: 1, campaign_id: 1, redemption_count: 1 },
      }).toArray(),
      db.collection('admin_credit_batches').find({}, {
        projection: { _id: 0, id: 1, campaign_id: 1, summary: 1 },
      }).toArray(),
    ])
    const couponByCampaign = new Map(coupons.map((coupon) => [coupon.campaign_id, coupon]))
    const batchByCampaign = new Map(batches.map((batch) => [batch.campaign_id, batch]))
    const couponReports = campaigns.map((campaign) => {
      const coupon = couponByCampaign.get(campaign.id)
      const batch = batchByCampaign.get(campaign.id)
      return {
        id: campaign.id,
        kind: campaign.kind,
        label: campaign.label,
        distributedCredits: campaign.distributed_credits || 0,
        redemptionCount: campaign.kind === 'coupon'
          ? coupon?.redemption_count || 0
          : batch?.summary?.succeeded || 0,
        createdAt: campaign.created_at,
      }
    })
    return json({ items: couponReports }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/billing/coupons/redeem' && method === 'POST') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Kupon kullanımı için Idempotency-Key zorunludur' }, { status: 400 })
    if (!await allowAttempts(db, 'coupon_attempt_windows', user.id, 10, 10)) return json({ error: 'Çok fazla kupon denemesi. 10 dakika sonra tekrar deneyin.' }, { status: 429 })
    const body = await request.json().catch(() => null)
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (!body || Object.keys(body).length !== 1 || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return json({ error: 'Geçerli bir kupon kodu girin' }, { status: 400 })
    }
    try {
      const result = await redeemCoupon(db, user, code, requestKey)
      if (result.error) return json({ error: result.error }, { status: result.status })
      return json(result)
    } catch (error) {
      if (error?.code === 11000) {
        const existing = await db.collection('coupon_redemptions').findOne({ request_key: requestKey }, noId)
        if (existing?.user_id === user.id && existing.code === code) return json({ ok: true, idempotent: true, credits: existing.credits })
        return json({ error: 'Kupon işlemi eşzamanlı değişti; tekrar deneyin' }, { status: 409 })
      }
      throw error
    }
  }

  if (route === '/billing/coupons/history' && method === 'GET') {
    const items = await db.collection('coupon_redemptions')
      .find({ user_id: user.id }, {
        projection: { _id: 0, id: 1, code: 1, credits: 1, created_at: 1 },
      })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()
    return json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return json({ error: 'Kampanya rotası bulunamadı' }, { status: 404 })
}
