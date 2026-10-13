import { v4 as uuidv4 } from 'uuid'
import { TEMPLATES as INVITATION_TEMPLATES } from '../data/templates.js'
import { BILLING_PLANS, getBillingPlan } from '../billing/plans.js'
import { getPackageSettings, resolvePackageSettings, savePackageSettings } from '../billing/package-settings.js'
import { getTemplateAvailability, getTemplateTier, getTemplateTierOverrides, saveTemplateAvailability, saveTemplateTier } from '../billing/template-tiers.js'
import { canManageAdmin, canManageSuperAdmin, getAdminAuthorizationError } from '../admin/authorization.js'
import { ensureBillingAccount, getRequestKey } from '../billing/usage.js'
import { withVipCreditTransaction } from '../vip-design/credits.js'
import { getNotificationBaseUrl, notifyUser, publishNotificationsSafely } from '../notifications/service.js'

const json = (data, init) => Response.json(data, init)
const noId = { projection: { _id: 0 } }
let indexesReady

async function ensureAdminIndexes(db) {
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection('admin_package_settings').createIndex({ package_id: 1 }, { unique: true }),
      db.collection('admin_audit_logs').createIndex({ created_at: -1 }),
      db.collection('admin_audit_logs').createIndex({ actor_user_id: 1, created_at: -1 }),
      db.collection('admin_credit_movements').createIndex({ user_id: 1, created_at: -1 }),
      db.collection('admin_credit_movements').createIndex({ request_key: 1 }, { unique: true }),
      db.collection('admin_user_mutation_limits').createIndex({ user_id: 1 }, { unique: true }),
      db.collection('admin_template_tier_settings').createIndex({ type: 1, template_key: 1 }, { unique: true }),
    ]).catch((error) => {
      indexesReady = null
      throw error
    })
  }
  await indexesReady
}

async function writeAudit(db, { actorId, action, targetId, before = null, after = null }) {
  await db.collection('admin_audit_logs').insertOne({
    id: uuidv4(),
    actor_user_id: actorId,
    action,
    target_type: 'package',
    target_id: targetId,
    before,
    after,
    outcome: 'success',
    created_at: new Date(),
  })
}

async function writeRecordAudit(db, { actorId, action, targetType, targetId, before, after, reason }, session) {
  await db.collection('admin_audit_logs').insertOne({
    id: uuidv4(),
    actor_user_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    before,
    after,
    reason,
    outcome: 'success',
    created_at: new Date(),
  }, session ? { session } : undefined)
}

async function writeTemplateAudit(db, { actorId, templateType, templateKey, before, after }) {
  await db.collection('admin_audit_logs').insertOne({
    id: uuidv4(),
    actor_user_id: actorId,
    action: 'template.tier.updated',
    target_type: 'template',
    target_id: `${templateType}:${templateKey}`,
    before: { tier: before },
    after: { tier: after },
    outcome: 'success',
    created_at: new Date(),
  })
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

async function allowBulkStatusMutation(db, userId) {
  const now = new Date()
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000)
  const limits = db.collection('admin_user_mutation_limits')
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await limits.findOne({ user_id: userId }, noId)
    if (!current) {
      try {
        await limits.insertOne({ user_id: userId, window_started_at: now, count: 1 })
        return true
      } catch (error) {
        if (error?.code !== 11000) throw error
        continue
      }
    }
    if (current.window_started_at > cutoff) {
      if (current.count >= 60) return false
      const result = await limits.updateOne(
        { user_id: userId, count: current.count, window_started_at: current.window_started_at },
        { $inc: { count: 1 } },
      )
      if (result.modifiedCount) return true
    } else {
      const result = await limits.updateOne(
        { user_id: userId, window_started_at: current.window_started_at },
        { $set: { window_started_at: now, count: 1 } },
      )
      if (result.modifiedCount) return true
    }
  }
  throw new Error('Admin işlem hızı sınırı güncellenemedi')
}

function sanitizeFailureText(value) {
  if (typeof value !== 'string') return null
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[phone]')
    .replace(/\b(token|password|secret|authorization)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 300)
}

function sanitizeAuditReason(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[phone]')
    .replace(/\b(token|password|secret|authorization)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 500)
}

function getQuotaSummary(grants) {
  const summary = { totalCredits: 0, remainingCredits: 0, grants: [], packages: [] }
  const packageIds = new Set()
  for (const grant of grants) {
    const total = Number.isFinite(grant.event_credits) ? grant.event_credits : 0
    const remaining = Number.isFinite(grant.remaining_event_credits) ? grant.remaining_event_credits : 0
    summary.totalCredits += total
    if (grant.status === 'active') summary.remainingCredits += remaining
    summary.grants.push({
      id: grant.id,
      packageId: grant.package_id,
      total,
      remaining,
      provider: grant.provider,
      status: grant.status,
      assigned: (grant.assigned_project_ids || []).length,
      createdAt: grant.created_at,
    })
    if (grant.status === 'active') packageIds.add(grant.package_id)
  }
  summary.packages = [...packageIds].map((id) => ({
    id,
    name: getBillingPlan(id)?.name || id,
  }))
  return summary
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email,
    role: user.role || 'user',
    status: user.account_status === 'suspended' ? 'suspended' : 'active',
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null,
  }
}

async function withAdminAccessLock(db, operation) {
  return withVipCreditTransaction(db, async (session) => {
    await db.collection('admin_access_guard').updateOne(
      { _id: 'admin-access' },
      { $inc: { version: 1 } },
      { upsert: true, session },
    )
    return operation(session)
  })
}

async function getUserRelationships(db, userId, session) {
  const checks = [
    ['events', 'event_projects', { user_id: userId }],
    ['credits', 'billing_grants', { user_id: userId }],
    ['orders', 'billing_purchases', { user_id: userId }],
    ['vipRequests', 'vip_design_requests', { user_id: userId }],
    ['creditMovements', 'vip_credit_movements', { user_id: userId }],
    ['adminCreditMovements', 'admin_credit_movements', { user_id: userId }],
    ['usageOperations', 'billing_usage_operations', { user_id: userId }],
    ['usageCounters', 'billing_usage_counters', { user_id: userId }],
    ['projectEntitlements', 'billing_project_entitlements', { user_id: userId }],
  ]
  const entries = await Promise.all(checks.map(async ([key, collection, filter]) => [
    key,
    await db.collection(collection).countDocuments(filter, session ? { session } : undefined),
  ]))
  return Object.fromEntries(entries)
}

export async function handleAdminRoutes({ db, route, method, request, user, siteTemplates = [] }) {
  if (route !== '/admin' && !route.startsWith('/admin/')) return null
  const authorizationError = getAdminAuthorizationError(user, method)
  if (authorizationError) return json({ error: authorizationError.error }, { status: authorizationError.status })
  await ensureAdminIndexes(db)

  if (route === '/admin/overview' && method === 'GET') {
    const [users, projects, grants, auditEntries] = await Promise.all([
      db.collection('users').countDocuments({ account_status: { $ne: 'deleted' } }),
      db.collection('event_projects').countDocuments({}),
      db.collection('billing_grants').countDocuments({ status: 'active' }),
      db.collection('admin_audit_logs').countDocuments({}),
    ])
    return json({
      role: user.role,
      canManage: getAdminAuthorizationError(user, 'PATCH') === null,
      stats: { users, projects, activeGrants: grants, auditEntries },
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/admin/packages' && method === 'GET') {
    const stored = await db.collection('admin_package_settings').find({}, noId).toArray()
    const byId = new Map(stored.map((item) => [item.package_id, item]))
    const items = Object.values(BILLING_PLANS).map((plan) => ({
      ...plan,
      settings: resolvePackageSettings(plan, byId.get(plan.id)),
    }))
    return json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/admin/templates' && method === 'GET') {
    const overrides = await getTemplateTierOverrides(db)
    const overrideMap = new Map(overrides.map((item) => [`${item.type}:${item.template_key}`, item]))
    const invitationItems = INVITATION_TEMPLATES
      .filter((template) => !(template.tags || []).includes('web sitesi'))
      .map((template) => ({
      id: template.id,
      key: template.slug,
      type: 'invitation',
      name: template.name,
      description: template.tagline,
      preview: template.cover,
      tier: overrideMap.get(`invitation:${template.slug}`)?.tier || template.tier || 'free',
      active: overrideMap.get(`invitation:${template.slug}`)?.active !== false,
      }))
    const websiteItems = siteTemplates.map((template) => ({
      id: template.id,
      key: template.id,
      type: 'website',
      name: template.name,
      description: template.tagline,
      preview: template.preview,
      tier: overrideMap.get(`website:${template.id}`)?.tier || 'free',
      active: overrideMap.get(`website:${template.id}`)?.active !== false,
    }))
    return json({ items: [...websiteItems, ...invitationItems], canManage: canManageAdmin(user) }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const packageMatch = route.match(/^\/admin\/packages\/([a-z0-9_-]+)$/)
  if (packageMatch && method === 'PATCH') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const plan = BILLING_PLANS[packageMatch[1]]
    if (!plan) return json({ error: 'Paket bulunamadı' }, { status: 404 })

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    }
    const allowedFields = ['is_active', 'is_public']
    if (!Object.keys(body).length || Object.keys(body).some((key) => !allowedFields.includes(key))) {
      return json({ error: 'Yalnızca paket aktifliği ve görünürlüğü değiştirilebilir' }, { status: 400 })
    }
    if (Object.values(body).some((value) => typeof value !== 'boolean')) {
      return json({ error: 'Paket durum alanları boolean olmalıdır' }, { status: 400 })
    }

    const before = await getPackageSettings(db, plan.id)
    const after = await savePackageSettings(db, plan, body, user.id)
    if (before.is_active !== after.is_active || before.is_public !== after.is_public) {
      await writeAudit(db, {
        actorId: user.id,
        action: 'package.settings.updated',
        targetId: plan.id,
        before,
        after: { is_active: after.is_active, is_public: after.is_public },
      })
    }
    return json({ ok: true, settings: after })
  }

  const templateMatch = route.match(/^\/admin\/templates\/(website|invitation)\/([a-z0-9_-]+)$/)
  if (templateMatch && method === 'PATCH') {
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, templateType, templateKey] = templateMatch
    const template = templateType === 'website'
      ? siteTemplates.find((item) => item.id === templateKey)
      : INVITATION_TEMPLATES.find((item) => item.slug === templateKey && !(item.tags || []).includes('web sitesi'))
    if (!template) return json({ error: 'Şablon bulunamadı' }, { status: 404 })

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 ||
      Object.keys(body).some((key) => !['tier', 'active'].includes(key)) ||
      (body.tier !== undefined && !['free', 'premium'].includes(body.tier)) ||
      (body.active !== undefined && typeof body.active !== 'boolean')) {
      return json({ error: 'Yalnızca erişim paketi ve şablon aktifliği değiştirilebilir' }, { status: 400 })
    }

    const fallbackTier = templateType === 'website' ? 'free' : template.tier || 'free'
    const before = {
      tier: await getTemplateTier(db, templateType, templateKey, fallbackTier),
      active: await getTemplateAvailability(db, templateType, templateKey),
    }
    const after = { ...before }
    if (body.tier !== undefined) after.tier = (await saveTemplateTier(db, {
      type: templateType, templateKey, tier: body.tier, actorId: user.id,
    })).tier
    if (body.active !== undefined) after.active = (await saveTemplateAvailability(db, {
      type: templateType, templateKey, active: body.active, actorId: user.id,
    })).active
    if (before.tier !== after.tier) {
      await writeTemplateAudit(db, { actorId: user.id, templateType, templateKey, before: before.tier, after: after.tier })
    }
    if (before.active !== after.active) {
      await writeRecordAudit(db, {
        actorId: user.id,
        action: 'template.availability.updated',
        targetType: 'template',
        targetId: `${templateType}:${templateKey}`,
        before: { active: before.active },
        after: { active: after.active },
      })
    }
    return json({ ok: true, template: { type: templateType, key: templateKey, ...after } })
  }

  if (route === '/admin/users' && method === 'GET') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kullanıcı yönetebilir' }, { status: 403 })
    const url = new URL(request.url)
    const search = (url.searchParams.get('q') || '').trim().slice(0, 100)
    const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10)
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '25', 10)
    const page = Number.isInteger(requestedPage) ? Math.max(requestedPage, 1) : 1
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 25
    const filter = {}
    if (search) {
      const safeSearch = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: safeSearch }, { email: safeSearch }]
    }
    const role = url.searchParams.get('role')
    if (['user', 'support', 'admin', 'super_admin'].includes(role)) filter.role = role
    const status = url.searchParams.get('status')
    if (status === 'suspended') {
      filter.account_status = 'suspended'
    } else {
      filter.account_status = status === 'active'
        ? { $nin: ['suspended', 'deleted'] }
        : { $ne: 'deleted' }
    }
    const packageId = url.searchParams.get('package')
    if (packageId && getBillingPlan(packageId)) {
      const [packageGrants, packageAccounts] = await Promise.all([
        db.collection('billing_grants')
          .find({ package_id: packageId, status: 'active' }, { projection: { user_id: 1 } })
          .toArray(),
        db.collection('billing_accounts')
          .find({ plan_id: packageId }, { projection: { user_id: 1 } })
          .toArray(),
      ])
      filter.id = { $in: [...new Set([...packageGrants, ...packageAccounts].map((item) => item.user_id))] }
    }
    const total = await db.collection('users').countDocuments(filter)
    const sortField = url.searchParams.get('sort')
    const sortBy = ['name', 'email', 'role', 'account_status', 'created_at'].includes(sortField)
      ? sortField
      : 'created_at'
    const sortDirection = url.searchParams.get('direction') === 'asc' ? 1 : -1
    const users = await db.collection('users')
      .find(filter, { projection: { _id: 0, id: 1, email: 1, name: 1, role: 1, created_at: 1, account_status: 1 } })
      .sort({ [sortBy]: sortDirection, id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
    const grants = users.length
      ? await db.collection('billing_grants').find({ user_id: { $in: users.map((item) => item.id) } }, noId).toArray()
      : []
    const accounts = users.length
      ? await db.collection('billing_accounts').find({ user_id: { $in: users.map((item) => item.id) } }, { projection: { _id: 0, user_id: 1, plan_id: 1 } }).toArray()
      : []
    const plansByUser = new Map(accounts.map((item) => [item.user_id, getBillingPlan(item.plan_id || 'baslangic')]))
    const grantsByUser = new Map()
    for (const grant of grants) {
      const summary = grantsByUser.get(grant.user_id) || []
      summary.push(grant)
      grantsByUser.set(grant.user_id, summary)
    }
    return json({
      items: users.map((item) => ({
        ...safeUser(item),
        package: (() => {
          const plan = plansByUser.get(item.id)
          return plan ? { id: plan.id, name: plan.name } : null
        })(),
        quota: getQuotaSummary(grantsByUser.get(item.id) || []),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/admin/users/bulk-status' && method === 'POST') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin hesap durumunu değiştirebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    if (!await allowBulkStatusMutation(db, user.id)) {
      return json({ error: 'Çok fazla toplu kullanıcı işlemi. 10 dakika sonra tekrar deneyin.' }, { status: 429 })
    }
    const body = await request.json().catch(() => null)
    const userIds = Array.isArray(body?.userIds) ? [...new Set(body.userIds)] : []
    const reason = sanitizeAuditReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    if (!body || Object.keys(body).length !== 3 || !userIds.length || userIds.length > 100 ||
      userIds.some((id) => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) ||
      !['active', 'suspended'].includes(body.status) || reason.length < 10 || reason.length > 500) {
      return json({ error: 'En fazla 100 kullanıcı, geçerli durum ve 10–500 karakterlik gerekçe zorunludur' }, { status: 400 })
    }
    if (body.status === 'suspended' && userIds.includes(user.id)) {
      return json({ error: 'Kendi hesabınızı askıya alamazsınız' }, { status: 409 })
    }

    const outcome = await withAdminAccessLock(db, async (session) => {
      const targets = await db.collection('users')
        .find({ id: { $in: userIds } }, { ...noId, session })
        .toArray()
      if (targets.some((target) => target.role === 'super_admin' || target.account_status === 'deleted')) {
        return { status: 409, error: 'Super admin veya silinmiş hesaplar toplu olarak değiştirilemez' }
      }
      if (body.status === 'suspended' && targets.some((target) => target.role === 'admin' && target.account_status !== 'suspended')) {
        const activeAdmins = await db.collection('users')
          .find({
            role: { $in: ['admin', 'super_admin'] },
            account_status: { $nin: ['suspended', 'deleted'] },
          }, { projection: { _id: 0, id: 1 }, session })
          .toArray()
        const remainingAdmins = activeAdmins.filter((item) =>
          !userIds.includes(item.id) || targets.find((target) => target.id === item.id)?.account_status === 'suspended',
        )
        if (!remainingAdmins.length) {
          return { status: 409, error: 'Son etkin yönetici hesabı askıya alınamaz' }
        }
      }

      const changed = []
      const unchanged = userIds.filter((id) => !targets.some((target) => target.id === id))
      for (const target of targets) {
        const previousStatus = target.account_status === 'suspended' ? 'suspended' : 'active'
        if (previousStatus === body.status) {
          unchanged.push(target.id)
          continue
        }
        const result = await db.collection('users').updateOne(
          { id: target.id, account_status: target.account_status },
          { $set: { account_status: body.status, updated_at: new Date() } },
          { session },
        )
        if (!result.modifiedCount) return { status: 409, error: 'Kullanıcı eşzamanlı değişti; işlemi yeniden deneyin' }
        await writeRecordAudit(db, {
          actorId: user.id,
          action: `user.${body.status === 'suspended' ? 'suspended' : 'activated'}`,
          targetType: 'user',
          targetId: target.id,
          before: { status: previousStatus },
          after: { status: body.status },
          reason,
        }, session)
        changed.push(target.id)
      }
      return { changed, unchanged }
    })
    if (outcome.error) return json({ error: outcome.error }, { status: outcome.status })
    return json({ ok: true, changed: outcome.changed, unchanged: outcome.unchanged })
  }

  const userDetailMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)$/)
  if (userDetailMatch && method === 'GET') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kullanıcı yönetebilir' }, { status: 403 })
    const [, targetId] = userDetailMatch
    const target = await db.collection('users').findOne({ id: targetId }, {
      projection: { _id: 0, id: 1, name: 1, email: 1, role: 1, created_at: 1, updated_at: 1, account_status: 1 },
    })
    if (!target) return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    const [grants, account, projects, vipRequests, purchases, adminMovements, vipMovements] = await Promise.all([
      db.collection('billing_grants').find({ user_id: targetId }, noId).sort({ created_at: -1 }).toArray(),
      db.collection('billing_accounts').findOne({ user_id: targetId }, { projection: { _id: 0, plan_id: 1 } }),
      db.collection('event_projects').find({ user_id: targetId }, {
        projection: {
          _id: 0, id: 1, title: 1, event_type: 1, date: 1, created_at: 1, updated_at: 1,
          published: 1, archived: 1, slug: 1, deliverables: 1, canvas_design: 1, template_slug: 1,
        },
      }).sort({ created_at: -1 }).limit(100).toArray(),
      db.collection('vip_design_requests').find({ user_id: targetId }, {
        projection: {
          _id: 0, id: 1, status: 1, createdAt: 1, updatedAt: 1,
          'eventDetails.eventType': 1, 'eventDetails.date': 1, 'site_draft.status': 1,
        },
      }).sort({ createdAt: -1 }).limit(100).toArray(),
      db.collection('billing_purchases').find({ user_id: targetId }, {
        projection: { _id: 0, id: 1, package_id: 1, amount: 1, currency: 1, provider: 1, status: 1, created_at: 1, updated_at: 1 },
      }).sort({ created_at: -1 }).limit(100).toArray(),
      db.collection('admin_credit_movements').find({ user_id: targetId }, {
        projection: {
          _id: 0, id: 1, kind: 1, amount: 1, reason: 1, package_id: 1,
          grant_id: 1, campaign_id: 1, coupon_id: 1, batch_id: 1,
          request_key: 1, created_at: 1, actor_user_id: 1,
        },
      }).sort({ created_at: -1 }).limit(100).toArray(),
      db.collection('vip_credit_movements').find({ user_id: targetId }, {
        projection: { _id: 0, request_id: 1, kind: 1, amount: 1, reason: 1, created_at: 1, admin_id: 1 },
      }).sort({ created_at: -1 }).limit(100).toArray(),
    ])
    const invitations = projects
      .filter((project) => project.deliverables?.invitation?.enabled || Boolean(project.canvas_design))
      .map((project) => ({
        id: project.id,
        title: project.title,
        date: project.date || null,
        template: project.template_slug || null,
        published: Boolean(project.published),
        createdAt: project.created_at || null,
      }))
    const movements = [
      ...adminMovements.map((item) => ({ ...item, source: 'admin' })),
      ...vipMovements.map((item) => ({
        id: item.request_id,
        kind: item.kind,
        amount: item.amount,
        created_at: item.created_at,
        source: 'vip',
      })),
    ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 100)
    const plan = getBillingPlan(account?.plan_id)
    return json({
      user: safeUser(target),
      package: plan ? { id: plan.id, name: plan.name } : null,
      quota: getQuotaSummary(grants),
      events: projects.map((project) => ({
        id: project.id,
        title: project.title,
        type: project.event_type,
        date: project.date || null,
        createdAt: project.created_at || null,
        updatedAt: project.updated_at || null,
        published: Boolean(project.published),
        archived: Boolean(project.archived),
        slug: project.slug || null,
      })),
      invitations,
      vipRequests: vipRequests.map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
        eventDetails: item.eventDetails ? {
          eventType: item.eventDetails.eventType || null,
          date: item.eventDetails.date || null,
        } : null,
        siteStatus: item.site_draft?.status || null,
      })),
      orders: purchases.map((purchase) => ({
        id: purchase.id,
        package_id: purchase.package_id,
        amount: purchase.amount,
        currency: purchase.currency,
        provider: purchase.provider,
        status: purchase.status,
        created_at: purchase.created_at || null,
        updated_at: purchase.updated_at || null,
      })),
      creditMovements: movements,
      relationships: await getUserRelationships(db, targetId),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const userProfileMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)$/)
  if (userProfileMatch && method === 'PATCH') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kullanıcı bilgilerini yönetebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId] = userProfileMatch
    const body = await request.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!body || Object.keys(body).length !== 1 || !name || name.length > 100) {
      return json({ error: 'Yalnızca 1–100 karakterlik ad soyad güncellenebilir' }, { status: 400 })
    }
    const target = await db.collection('users').findOne({ id: targetId }, {
      projection: { _id: 0, id: 1, name: 1, email: 1, role: 1, account_status: 1, created_at: 1, updated_at: 1 },
    })
    if (!target) return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    if (target.name !== name) {
      const updated = await db.collection('users').updateOne(
        { id: targetId, name: target.name },
        { $set: { name, updated_at: new Date() } },
      )
      if (!updated.modifiedCount) return json({ error: 'Kullanıcı eşzamanlı değişti; sayfayı yenileyin' }, { status: 409 })
      await writeRecordAudit(db, {
        actorId: user.id, action: 'user.profile.updated', targetType: 'user', targetId,
        before: { name: target.name || '' }, after: { name },
      })
    }
    return json({ ok: true, user: { id: targetId, name } })
  }

  const userStatusMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)\/status$/)
  if (userStatusMatch && method === 'PATCH') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin hesap durumunu değiştirebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId] = userStatusMatch
    const body = await request.json().catch(() => null)
    if (!body || Object.keys(body).length !== 1 || !['active', 'suspended'].includes(body.status)) {
      return json({ error: 'Hesap durumu active veya suspended olmalıdır' }, { status: 400 })
    }
    if (targetId === user.id) return json({ error: 'Kendi hesabınızı askıya alamazsınız' }, { status: 409 })
    const outcome = await withAdminAccessLock(db, async (session) => {
      const target = await db.collection('users').findOne({ id: targetId }, { ...noId, session })
      if (!target) return { status: 404, error: 'Kullanıcı bulunamadı' }
      if (target.role === 'super_admin') return { status: 409, error: 'Super admin hesabı bu panelden askıya alınamaz' }
      const previousStatus = target.account_status === 'suspended' ? 'suspended' : 'active'
      if (previousStatus === body.status) return { status: body.status }
      if (body.status === 'suspended' && target.role === 'admin') {
        const activeAdmins = await db.collection('users')
          .find({ role: { $in: ['admin', 'super_admin'] }, account_status: { $ne: 'suspended' } }, { projection: { _id: 0, id: 1 }, session })
          .toArray()
        if (activeAdmins.filter((item) => item.id !== targetId).length === 0) {
          return { status: 409, error: 'Son etkin yönetici hesabı askıya alınamaz' }
        }
      }
      const updated = await db.collection('users').updateOne(
        { id: targetId, account_status: target.account_status },
        { $set: { account_status: body.status, updated_at: new Date() } },
        { session },
      )
      if (!updated.modifiedCount) return { status: 409, error: 'Hesap durumu eşzamanlı değişti; sayfayı yenileyin' }
      await writeRecordAudit(db, {
        actorId: user.id, action: `user.${body.status === 'suspended' ? 'suspended' : 'activated'}`,
        targetType: 'user', targetId, before: { status: previousStatus }, after: { status: body.status },
      }, session)
      return { status: body.status }
    })
    if (outcome.error) return json({ error: outcome.error }, { status: outcome.status })
    return json({ ok: true, status: outcome.status })
  }

  const userDeleteMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)$/)
  if (userDeleteMatch && method === 'DELETE') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kullanıcı silebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId] = userDeleteMatch
    if (targetId === user.id) return json({ error: 'Kendi hesabınızı silemezsiniz' }, { status: 409 })
    const body = await request.json().catch(() => null)
    if (!body || Object.keys(body).length !== 1 || typeof body.confirmEmail !== 'string' ||
      body.confirmEmail !== body.confirmEmail.trim().toLowerCase()) {
      return json({ error: 'Silme işlemi için kullanıcının e-posta adresini aynen onaylayın' }, { status: 400 })
    }
    const outcome = await withAdminAccessLock(db, async (session) => {
      const target = await db.collection('users').findOne({ id: targetId }, {
        projection: { _id: 0, id: 1, email: 1, role: 1, account_status: 1 },
        session,
      })
      if (!target) return { status: 404, error: 'Kullanıcı bulunamadı' }
      if (body.confirmEmail !== target.email) return { status: 400, error: 'E-posta onayı eşleşmiyor' }
      if (target.role === 'super_admin') return { status: 409, error: 'Super admin hesabı bu panelden silinemez' }
      if (target.role === 'admin' && target.account_status !== 'suspended') {
        const activeAdmins = await db.collection('users')
          .find({ role: { $in: ['admin', 'super_admin'] }, account_status: { $ne: 'suspended' } }, { projection: { _id: 0, id: 1 }, session })
          .toArray()
        if (activeAdmins.filter((item) => item.id !== targetId).length === 0) {
          return { status: 409, error: 'Son etkin yönetici hesabı silinemez' }
        }
      }
      const relationships = await getUserRelationships(db, targetId, session)
      const linkedData = Object.values(relationships).reduce((total, count) => total + count, 0)
      if (linkedData) {
        return {
          status: 409,
          error: 'İlişkili etkinlik, VIP, kredi, sipariş veya kullanım kayıtları bulunduğu için hesap silinmedi',
          relationships,
        }
      }
      const deleted = await db.collection('users').deleteOne({ id: targetId, email: target.email }, { session })
      if (!deleted.deletedCount) return { status: 409, error: 'Kullanıcı eşzamanlı değişti; sayfayı yenileyin' }
      await db.collection('billing_accounts').deleteOne({ user_id: targetId }, { session })
      await db.collection('password_reset_tokens').deleteMany({ user_id: targetId }, { session })
      await writeRecordAudit(db, {
        actorId: user.id, action: 'user.deleted', targetType: 'user', targetId,
        before: { role: target.role, status: target.account_status === 'suspended' ? 'suspended' : 'active' },
        after: null,
      }, session)
      return { ok: true }
    })
    if (outcome.error) {
      return json({ error: outcome.error, ...(outcome.relationships ? { relationships: outcome.relationships } : {}) }, { status: outcome.status })
    }
    return json({ ok: true })
  }

  const userRoleMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)\/role$/)
  if (userRoleMatch && method === 'PATCH') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kullanıcı rollerini yönetebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId] = userRoleMatch
    if (targetId === user.id) return json({ error: 'Kendi rolünüzü bu panelden değiştiremezsiniz' }, { status: 409 })
    const body = await request.json().catch(() => null)
    if (!body || Object.keys(body).length !== 1 || !['user', 'support', 'admin'].includes(body.role)) {
      return json({ error: 'Rol user, support veya admin olmalıdır; super_admin rolü yalnızca bootstrap ile atanır' }, { status: 400 })
    }
    const outcome = await withAdminAccessLock(db, async (session) => {
      const target = await db.collection('users').findOne({ id: targetId }, { ...noId, session })
      if (!target) return { status: 404, error: 'Kullanıcı bulunamadı' }
      if (target.role === 'super_admin') return { status: 409, error: 'Super admin rolü bu panelden değiştirilemez' }
      if (target.role === 'admin' && body.role !== 'admin' && target.account_status !== 'suspended') {
        const activeAdmins = await db.collection('users')
          .find({ role: { $in: ['admin', 'super_admin'] }, account_status: { $ne: 'suspended' } }, { projection: { _id: 0, id: 1 }, session })
          .toArray()
        if (activeAdmins.filter((item) => item.id !== targetId).length === 0) {
          return { status: 409, error: 'Son etkin yönetici hesabının rolü düşürülemez' }
        }
      }
      if (target.role === body.role) return { user: { id: targetId, role: body.role } }
      const updated = await db.collection('users').updateOne(
        { id: targetId, role: target.role },
        { $set: { role: body.role, updated_at: new Date() } },
        { session },
      )
      if (!updated.modifiedCount) return { status: 409, error: 'Kullanıcı rolü eşzamanlı değişti; listeyi yenileyin' }
      await writeRecordAudit(db, {
        actorId: user.id,
        action: 'user.role.updated',
        targetType: 'user',
        targetId,
        before: { role: target.role },
        after: { role: body.role },
      }, session)
      return { user: { id: targetId, role: body.role } }
    })
    if (outcome.error) return json({ error: outcome.error }, { status: outcome.status })
    return json({ ok: true, user: outcome.user })
  }

  const grantMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)\/grants$/)
  if (grantMatch && method === 'POST') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kota verebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId] = grantMatch
    const target = await db.collection('users').findOne({ id: targetId }, noId)
    if (!target) return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Kota işlemi için Idempotency-Key başlığı zorunludur' }, { status: 400 })
    const body = await request.json().catch(() => null)
    const packagePlan = body && getBillingPlan(body.packageId)
    const amount = Number(body?.amount)
    const reason = sanitizeAuditReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    if (!packagePlan || packagePlan.grantMode !== 'event_credits' || !Number.isInteger(amount) ||
      amount !== packagePlan.eventCredits || reason.length < 10 || reason.length > 500) {
      return json({ error: 'Kredi miktarı seçilen paketin kotasıyla aynı olmalı ve 10–500 karakterlik gerekçe girilmelidir' }, { status: 400 })
    }
    const grants = db.collection('billing_grants')
    const purchaseId = `admin:${requestKey}`
    const previousGrant = await grants.findOne({ purchase_id: purchaseId }, noId)
    if (previousGrant) {
      if (previousGrant.user_id !== targetId || previousGrant.package_id !== packagePlan.id) {
        return json({ error: 'Bu istek anahtarı farklı bir kota işlemi için kullanılmış' }, { status: 409 })
      }
      return json({
        ok: true,
        idempotent: true,
        grant: { id: previousGrant.id, packageId: previousGrant.package_id, eventCredits: previousGrant.event_credits },
      })
    }
    if (await db.collection('admin_credit_movements').findOne({ request_key: requestKey }, noId)) {
      return json({ error: 'Bu istek anahtarı başka bir kredi işlemi için kullanılmış' }, { status: 409 })
    }
    const packageSettings = await getPackageSettings(db, packagePlan.id)
    if (!packageSettings.is_active) return json({ error: 'Devre dışı paket için yeni kota verilemez' }, { status: 409 })
    await ensureBillingAccount(db, targetId)
    const grant = {
      id: uuidv4(),
      user_id: targetId,
      purchase_id: purchaseId,
      package_id: packagePlan.id,
      scope: packagePlan.scope,
      grant_mode: packagePlan.grantMode,
      event_credits: packagePlan.eventCredits,
      remaining_event_credits: packagePlan.eventCredits,
      assigned_project_ids: [],
      provider: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }
    const savedGrant = await withVipCreditTransaction(db, async (session) => {
      try {
        await grants.updateOne({ purchase_id: purchaseId }, { $setOnInsert: grant }, { upsert: true, session })
      } catch (error) {
        if (error?.code !== 11000) throw error
      }
      const saved = await grants.findOne({ purchase_id: purchaseId }, { ...noId, session })
      if (saved?.id === grant.id) {
        await db.collection('admin_credit_movements').insertOne({
          id: uuidv4(),
          user_id: targetId,
          request_key: requestKey,
          kind: 'credit',
          amount,
          package_id: packagePlan.id,
          grant_id: grant.id,
          reason,
          actor_user_id: user.id,
          created_at: new Date(),
        }, { session })
      }
      return saved
    })
    if (!savedGrant || savedGrant.user_id !== targetId || savedGrant.package_id !== packagePlan.id) {
      return json({ error: 'Kota işlemi eşzamanlı değişti; kullanıcı kotasını yenileyin' }, { status: 409 })
    }
    if (savedGrant.id === grant.id) {
      await writeRecordAudit(db, {
        actorId: user.id,
        action: 'user.quota.granted',
        targetType: 'billing_grant',
        targetId: grant.id,
        before: null,
        after: { user_id: targetId, package_id: packagePlan.id, event_credits: packagePlan.eventCredits },
        reason,
      })
      const baseUrl = getNotificationBaseUrl(request)
      await publishNotificationsSafely('admin-credit-grant', () => notifyUser(db, target, {
        eventId: `admin-grant:${grant.id}:user`,
        type: 'billing',
        title: 'Etkinlik kredisi hesabınıza eklendi',
        message: `${packagePlan.eventCredits} ${packagePlan.name} etkinlik kredisi hesabınıza tanımlandı.`,
        href: '/panel/paketim',
        emailTemplate: 'adminCreditGranted',
      }, { baseUrl }))
    }
    return json({
      ok: true,
      idempotent: savedGrant.id !== grant.id,
      grant: { id: savedGrant.id, packageId: savedGrant.package_id, eventCredits: savedGrant.event_credits },
    }, { status: savedGrant.id === grant.id ? 201 : 200 })
  }

  const creditMovementMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)\/credits$/)
  if (creditMovementMatch && method === 'POST') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kredi düşebilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId] = creditMovementMatch
    const target = await db.collection('users').findOne({ id: targetId }, noId)
    if (!target) return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Kredi işlemi için Idempotency-Key başlığı zorunludur' }, { status: 400 })
    const body = await request.json().catch(() => null)
    const amount = Number(body?.amount)
    const reason = sanitizeAuditReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    if (!body || Object.keys(body).length !== 3 || body.kind !== 'subtract' ||
      !Number.isInteger(amount) || amount < 1 || amount > 1000 || reason.length < 10 || reason.length > 500) {
      return json({ error: 'Kredi düşüşü için 1–1000 arası tam miktar ve 10–500 karakterlik açıklama zorunludur' }, { status: 400 })
    }
    const movements = db.collection('admin_credit_movements')
    const previous = await movements.findOne({ request_key: requestKey }, noId)
    if (previous) {
      if (previous.user_id !== targetId || previous.kind !== 'debit' || previous.amount !== amount || previous.reason !== reason) {
        return json({ error: 'Bu istek anahtarı farklı bir kredi işlemi için kullanılmış' }, { status: 409 })
      }
      return json({ ok: true, idempotent: true, movement: { id: previous.id, amount: previous.amount } })
    }
    const movement = await withVipCreditTransaction(db, async (session) => {
      const grants = await db.collection('billing_grants')
        .find({ user_id: targetId, status: 'active', remaining_event_credits: { $gt: 0 } }, { ...noId, session })
        .sort({ created_at: 1 })
        .toArray()
      const available = grants.reduce((total, grant) => total + (grant.remaining_event_credits || 0), 0)
      if (available < amount) return null

      let remaining = amount
      const allocations = []
      for (const grant of grants) {
        if (!remaining) break
        const allocated = Math.min(remaining, grant.remaining_event_credits)
        const updated = await db.collection('billing_grants').updateOne(
          { id: grant.id, user_id: targetId, status: 'active', remaining_event_credits: { $gte: allocated } },
          { $inc: { remaining_event_credits: -allocated }, $set: { updated_at: new Date() } },
          { session },
        )
        if (!updated.modifiedCount) throw new Error('Kredi bakiyesi eşzamanlı değişti; işlemi yeniden deneyin')
        allocations.push({ grant_id: grant.id, amount: allocated })
        remaining -= allocated
      }
      const record = {
        id: uuidv4(),
        user_id: targetId,
        request_key: requestKey,
        kind: 'debit',
        amount,
        allocations,
        reason,
        actor_user_id: user.id,
        created_at: new Date(),
      }
      await movements.insertOne(record, { session })
      return record
    })
    if (!movement) return json({ error: 'Kullanılabilir kredi bakiyesi bu düşüş için yetersiz' }, { status: 409 })
    await writeRecordAudit(db, {
      actorId: user.id, action: 'user.credits.debited', targetType: 'user', targetId,
      before: { amount: movement.amount }, after: { amount: -movement.amount }, reason,
    })
    return json({ ok: true, movement: { id: movement.id, amount: movement.amount } }, { status: 201 })
  }

  const revokeGrantMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)\/grants\/([a-zA-Z0-9_-]+)$/)
  if (revokeGrantMatch && method === 'PATCH') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kotayı geri alabilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId, grantId] = revokeGrantMatch
    const body = await request.json().catch(() => null)
    const reason = sanitizeAuditReason(typeof body?.reason === 'string' ? body.reason.trim() : '')
    if (body?.action !== 'revoke' || reason.length < 10 || reason.length > 500) {
      return json({ error: 'Geri alma işlemi ve 10–500 karakterlik gerekçe zorunludur' }, { status: 400 })
    }
    const grant = await db.collection('billing_grants').findOne({ id: grantId, user_id: targetId, provider: 'admin' }, noId)
    if (!grant) return json({ error: 'Aktif admin kota kaydı bulunamadı' }, { status: 404 })
    if (grant.status === 'revoked') return json({ ok: true, idempotent: true, grantId })
    if (grant.status !== 'active') return json({ error: 'Aktif admin kota kaydı bulunamadı' }, { status: 404 })
    if (grant.remaining_event_credits !== grant.event_credits || (grant.assigned_project_ids || []).length) {
      return json({ error: 'Kullanılmış veya atanmış kotalar geri alınamaz' }, { status: 409 })
    }
    const requestKey = `revoke:${grant.id}`
    const movement = await withVipCreditTransaction(db, async (session) => {
      const existingMovement = await db.collection('admin_credit_movements').findOne({ request_key: requestKey }, { ...noId, session })
      if (existingMovement) return { idempotent: true, movement: existingMovement }
      const now = new Date()
      const updated = await db.collection('billing_grants').updateOne(
        { id: grantId, user_id: targetId, provider: 'admin', status: 'active', remaining_event_credits: grant.event_credits },
        { $set: { status: 'revoked', remaining_event_credits: 0, revoked_at: now, revoked_by: user.id, updated_at: now } },
        { session },
      )
      if (!updated.modifiedCount) return null
      const record = {
        id: uuidv4(),
        user_id: targetId,
        request_key: requestKey,
        kind: 'revoke',
        amount: -grant.event_credits,
        package_id: grant.package_id,
        grant_id: grantId,
        reason,
        actor_user_id: user.id,
        created_at: now,
      }
      await db.collection('admin_credit_movements').insertOne(record, { session })
      await writeRecordAudit(db, {
        actorId: user.id,
        action: 'user.quota.revoked',
        targetType: 'billing_grant',
        targetId: grantId,
        before: { status: grant.status, remaining_event_credits: grant.remaining_event_credits },
        after: { status: 'revoked', remaining_event_credits: 0 },
        reason,
      }, session)
      return { idempotent: false, movement: record }
    })
    if (!movement) return json({ error: 'Kota durumu eşzamanlı değişti; listeyi yenileyin' }, { status: 409 })
    const target = await db.collection('users').findOne({ id: targetId }, noId)
    if (target && !movement.idempotent) {
      const baseUrl = getNotificationBaseUrl(request)
      await publishNotificationsSafely('admin-credit-revoked', () => notifyUser(db, target, {
        eventId: `admin-grant:${grant.id}:revoked:user`,
        type: 'billing',
        title: 'Kullanılmamış etkinlik kredisi geri alındı',
        message: 'Yönetim tarafından tanımlanmış kullanılmayan kredi hesabınızdan kaldırıldı. Detay için destek ekibine ulaşabilirsiniz.',
        href: '/panel/paketim',
        emailTemplate: 'adminCreditRevoked',
      }, { baseUrl }))
    }
    return json({ ok: true, grantId, idempotent: movement.idempotent })
  }

  if (route === '/admin/diagnostics' && method === 'GET') {
    if (!canManageAdmin(user)) return json({ error: 'Bu işlem için admin yetkisi gerekli' }, { status: 403 })
    const now = new Date()
    const [failedMessages, lockedAccounts, pendingUsage, database] = await Promise.all([
      db.collection('message_logs').countDocuments({ status: 'failed' }),
      db.collection('login_attempts').countDocuments({ locked_until: { $gt: now } }),
      db.collection('billing_usage_operations').countDocuments({
        status: { $in: ['pending', 'reserving', 'releasing'] },
        updated_at: { $lt: new Date(now.getTime() - 5 * 60 * 1000) },
      }),
      db.command({ ping: 1 }).then(() => ({ ok: true })).catch(() => ({ ok: false })),
    ])
    const failures = await db.collection('message_logs')
      .find({ status: 'failed' }, { projection: { _id: 0, id: 1, type: 1, channel: 1, project_id: 1, error: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray()
    return json({
      checkedAt: now,
      checks: {
        database,
        failedMessages,
        lockedAccounts,
        pendingUsage,
      },
      failures: failures.map((item) => ({
        id: item.id,
        type: item.type,
        channel: item.channel,
        projectId: item.project_id,
        error: sanitizeFailureText(item.error),
        createdAt: item.created_at,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (route === '/admin/audit-logs' && method === 'GET') {
    const url = new URL(request.url)
    const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '50', 10)
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50
    const items = await db.collection('admin_audit_logs')
      .find({}, noId)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()
    return json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return json({ error: 'Yönetim rotası bulunamadı' }, { status: 404 })
}
