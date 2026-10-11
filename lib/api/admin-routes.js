import { v4 as uuidv4 } from 'uuid'
import { TEMPLATES as INVITATION_TEMPLATES } from '../data/templates.js'
import { BILLING_PLANS, getBillingPlan } from '../billing/plans.js'
import { getPackageSettings, resolvePackageSettings, savePackageSettings } from '../billing/package-settings.js'
import { getTemplateAvailability, getTemplateTier, getTemplateTierOverrides, saveTemplateAvailability, saveTemplateTier } from '../billing/template-tiers.js'
import { canManageAdmin, canManageSuperAdmin, getAdminAuthorizationError } from '../admin/authorization.js'
import { ensureBillingAccount, getRequestKey } from '../billing/usage.js'

const json = (data, init) => Response.json(data, init)
const noId = { projection: { _id: 0 } }
let indexesReady

async function ensureAdminIndexes(db) {
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection('admin_package_settings').createIndex({ package_id: 1 }, { unique: true }),
      db.collection('admin_audit_logs').createIndex({ created_at: -1 }),
      db.collection('admin_audit_logs').createIndex({ actor_user_id: 1, created_at: -1 }),
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

async function writeRecordAudit(db, { actorId, action, targetType, targetId, before, after, reason }) {
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
  })
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

function sanitizeFailureText(value) {
  if (typeof value !== 'string') return null
  return value
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email]')
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[phone]')
    .replace(/\b(token|password|secret|authorization)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 300)
}

export async function handleAdminRoutes({ db, route, method, request, user, siteTemplates = [] }) {
  if (route !== '/admin' && !route.startsWith('/admin/')) return null
  const authorizationError = getAdminAuthorizationError(user, method)
  if (authorizationError) return json({ error: authorizationError.error }, { status: authorizationError.status })
  await ensureAdminIndexes(db)

  if (route === '/admin/overview' && method === 'GET') {
    const [users, projects, grants, auditEntries] = await Promise.all([
      db.collection('users').countDocuments({}),
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
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 100)
    const filter = search
      ? { $or: [{ name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] }
      : {}
    const users = await db.collection('users')
      .find(filter, { projection: { _id: 0, id: 1, email: 1, name: 1, role: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()
    const grants = users.length
      ? await db.collection('billing_grants').find({ user_id: { $in: users.map((item) => item.id) } }, noId).toArray()
      : []
    const grantsByUser = new Map()
    for (const grant of grants) {
      const summary = grantsByUser.get(grant.user_id) || { totalCredits: 0, remainingCredits: 0, grants: [] }
      summary.totalCredits += grant.event_credits || 0
      summary.remainingCredits += grant.remaining_event_credits || 0
      summary.grants.push({
        id: grant.id,
        packageId: grant.package_id,
        total: grant.event_credits || 0,
        remaining: grant.remaining_event_credits || 0,
        provider: grant.provider,
        status: grant.status,
        assigned: (grant.assigned_project_ids || []).length,
      })
      grantsByUser.set(grant.user_id, summary)
    }
    return json({
      items: users.map((item) => ({ ...item, quota: grantsByUser.get(item.id) || { totalCredits: 0, remainingCredits: 0, grants: [] } })),
      total: users.length,
    }, { headers: { 'Cache-Control': 'no-store' } })
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
    const target = await db.collection('users').findOne({ id: targetId }, noId)
    if (!target) return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    if (target.role === 'super_admin') return json({ error: 'Super admin rolü bu panelden değiştirilemez' }, { status: 409 })
    if (target.role !== body.role) {
      const updated = await db.collection('users').updateOne(
        { id: targetId, role: target.role },
        { $set: { role: body.role, updated_at: new Date() } },
      )
      if (!updated.modifiedCount) return json({ error: 'Kullanıcı rolü eşzamanlı değişti; listeyi yenileyin' }, { status: 409 })
      await writeRecordAudit(db, {
        actorId: user.id,
        action: 'user.role.updated',
        targetType: 'user',
        targetId,
        before: { role: target.role },
        after: { role: body.role },
      })
    }
    return json({ ok: true, user: { id: targetId, role: body.role } })
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
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    if (!packagePlan || packagePlan.grantMode !== 'event_credits' || reason.length < 10 || reason.length > 500) {
      return json({ error: 'Geçerli bir kredi paketi ve 10–500 karakterlik gerekçe girilmelidir' }, { status: 400 })
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
    try {
      await grants.updateOne({ purchase_id: purchaseId }, { $setOnInsert: grant }, { upsert: true })
    } catch (error) {
      if (error?.code !== 11000) throw error
    }
    const savedGrant = await grants.findOne({ purchase_id: purchaseId }, noId)
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
    }
    return json({
      ok: true,
      idempotent: savedGrant.id !== grant.id,
      grant: { id: savedGrant.id, packageId: savedGrant.package_id, eventCredits: savedGrant.event_credits },
    }, { status: savedGrant.id === grant.id ? 201 : 200 })
  }

  const revokeGrantMatch = route.match(/^\/admin\/users\/([a-zA-Z0-9_-]+)\/grants\/([a-zA-Z0-9_-]+)$/)
  if (revokeGrantMatch && method === 'PATCH') {
    if (!canManageSuperAdmin(user)) return json({ error: 'Yalnızca super admin kotayı geri alabilir' }, { status: 403 })
    if (!isSameOrigin(request)) return json({ error: 'İstek kaynağı doğrulanamadı' }, { status: 403 })
    const [, targetId, grantId] = revokeGrantMatch
    const body = await request.json().catch(() => null)
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
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
    const updated = await db.collection('billing_grants').updateOne(
      { id: grantId, user_id: targetId, provider: 'admin', status: 'active', remaining_event_credits: grant.event_credits },
      { $set: { status: 'revoked', remaining_event_credits: 0, revoked_at: new Date(), revoked_by: user.id, updated_at: new Date() } },
    )
    if (!updated.modifiedCount) return json({ error: 'Kota durumu eşzamanlı değişti; listeyi yenileyin' }, { status: 409 })
    await writeRecordAudit(db, {
      actorId: user.id,
      action: 'user.quota.revoked',
      targetType: 'billing_grant',
      targetId: grantId,
      before: { status: grant.status, remaining_event_credits: grant.remaining_event_credits },
      after: { status: 'revoked', remaining_event_credits: 0 },
      reason,
    })
    return json({ ok: true, grantId })
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
