import { v4 as uuidv4 } from 'uuid'
import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { buildProjectDoc, uniqueSlug, PROJECT_EDITABLE_FIELDS, formatEventDate, invitationUrl, DEFAULT_MENU_OPTIONS } from '@/lib/projects'
import { EVENT_TYPES } from '@/lib/data/events'
import { MESSAGE_TYPES, isValidEmail, toE164, buildContext } from '@/lib/messaging/shared'
import { isEmailConfigured, sendEmail } from '@/lib/messaging/email'
import { isSmsConfigured, sendSms } from '@/lib/messaging/sms'
import { EVENT_CONFIG } from '@/lib/events/event-config'
import { FREE_PLAN_ID, getBillingPlan, isPremiumTemplate } from '@/lib/billing/plans'
import { applySiteEntitlements } from '@/lib/billing/site-entitlements'
import {
  claimEventCredit,
  consumeQuota,
  getProjectPlan,
  getRequestKey,
  releaseQuota,
  restoreEventCredit,
} from '@/lib/billing/usage'

const json = (data, init) => NextResponse.json(data, init)
const noId = { projection: { _id: 0 } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MAX_PHOTO_CHARS = 4_000_000 // ~3MB base64 per photo
const MAX_ALBUM_REQUEST_BYTES = 24_000_000
const ALBUM_PROJECT_CAP = 500
const GUESTBOOK_PROJECT_CAP = 500
const PUBLIC_JSON_MAX_BYTES = 64_000

async function readJsonObject(request, maxBytes = PUBLIC_JSON_MAX_BYTES) {
  const reader = request.body?.getReader()
  if (!reader) return { error: 'Geçersiz istek gövdesi', status: 400 }

  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return { error: 'İstek gövdesi çok büyük', status: 413 }
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  let body
  try {
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    return { error: 'Geçersiz istek gövdesi', status: 400 }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Geçersiz istek gövdesi', status: 400 }
  }
  return { body }
}

function isValidPhotoDataUrl(s) {
  return typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s) && s.length <= MAX_PHOTO_CHARS
}

function normalizePhone(value) {
  if (!value) return null
  try { return toE164(value) } catch { return null }
}

function getSiteSection(project, type) {
  const sections = Array.isArray(project.site_data?.sections) ? project.site_data.sections : []
  return sections.find((item) => item?.type === type && item.visible !== false) || null
}

function getRsvpConfiguration(project, entitlements) {
  const section = getSiteSection(project, 'rsvp')
  const props = section?.props || {}
  const configuredOptions = typeof props.menuOptions === 'string'
    ? props.menuOptions.split(',').map((option) => option.trim()).filter(Boolean)
    : Array.isArray(props.menuOptions)
      ? props.menuOptions.map((option) => String(option).trim()).filter(Boolean)
      : []
  const menuOptions = configuredOptions.length
    ? configuredOptions
    : Array.isArray(project.menu_options) && project.menu_options.length ? project.menu_options : DEFAULT_MENU_OPTIONS
  const maxGuests = section
    ? props.askGuests === false
      ? 1
      : Math.min(20, Math.max(1, Number.isInteger(Number(props.maxGuests)) && props.maxGuests !== null && props.maxGuests !== '' ? Number(props.maxGuests) : 4))
    : 10

  return {
    menuOptions,
    maxGuests,
    askMenu: Boolean(entitlements?.advancedRsvp) && (!section || props.askMenu !== false),
  }
}

function normalizeGuest(row, projectId, userId) {
  const name = String(row.name || row.ad || row['Ad Soyad'] || row['ad soyad'] || '').trim().slice(0, 100)
  const emailRaw = String(row.email || row['e-posta'] || row.eposta || row['E-posta'] || '').trim().toLowerCase()
  const phoneRaw = String(row.phone || row.telefon || row.Telefon || '').trim()
  const group = String(row.group || row.grup || row.Grup || '').trim().slice(0, 60)
  if (!name) return null
  return {
    id: uuidv4(), project_id: projectId, user_id: userId, name,
    email: isValidEmail(emailRaw) ? emailRaw : null,
    phone: normalizePhone(phoneRaw),
    group: group || null,
    status: 'pending', last_sent_at: null, rsvp_id: null,
    created_at: new Date(),
  }
}

function projectFieldValues(body) {
  const event = body.event_data || {}
  return {
    brideName: event.couple?.bride || body.host_a,
    groomName: event.couple?.groom || body.host_b,
    celebrantName: event.celebrant?.name || body.host_a,
    parentNames: event.baby?.parents || body.host_a,
    companyName: event.company?.name || body.host_a,
    eventTitle: event.eventTitle || body.title,
    date: event.date || body.date,
  }
}

function validateProjectFields(body) {
  const config = EVENT_CONFIG[body.event_type]
  if (!config) return 'Geçersiz etkinlik türü'
  const values = projectFieldValues(body)
  const missing = config.required.find((field) => !String(values[field] || '').trim())
  if (missing) return `${config.fieldLabels[missing] || missing} zorunludur`
  const eventDate = new Date(`${values.date}T00:00:00.000Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(values.date)) || Number.isNaN(eventDate.getTime()) || eventDate.toISOString().slice(0, 10) !== values.date) {
    return 'Etkinlik tarihi geçersiz'
  }
  return null
}

function stableProjectId(userId, requestKey) {
  const bytes = crypto.createHash('sha256').update(`${userId}:${requestKey}`).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function initializeUsageFromProjects(db, userId) {
  const projects = await db.collection('event_projects').find(
    { user_id: userId },
    { projection: { id: 1, site_data: 1, canvas_design: 1, published: 1, deliverables: 1 } },
  ).toArray()
  const assignments = projects.length
    ? await db.collection('billing_project_entitlements').find({ user_id: userId, project_id: { $in: projects.map((project) => project.id) } }, { projection: { project_id: 1 } }).toArray()
    : []
  const paidProjectIds = new Set(assignments.map((assignment) => assignment.project_id))
  const baselineProjects = projects.filter((project) => !paidProjectIds.has(project.id))
  const baselineProjectCount = baselineProjects.length
  const websitesUsed = baselineProjects.filter((project) =>
    project.deliverables?.site?.enabled ?? Boolean(project.site_data || project.published),
  ).length
  const invitationsUsed = baselineProjects.filter((project) =>
    project.deliverables?.invitation?.enabled ?? Boolean(project.canvas_design),
  ).length
  await db.collection('billing_usage_counters').updateOne(
    { _id: `${userId}:projects:account` },
    { $setOnInsert: { user_id: userId, meter: 'projects', project_id: null }, $max: { used: projects.length } },
    { upsert: true },
  )
  await db.collection('billing_usage_counters').updateOne(
    { _id: `${userId}:free_projects:account` },
    { $setOnInsert: { user_id: userId, meter: 'free_projects', project_id: null }, $max: { used: baselineProjectCount } },
    { upsert: true },
  )
  for (const [meter, used] of [['websites', websitesUsed], ['invitations', invitationsUsed]]) {
    await db.collection('billing_usage_counters').updateOne(
      { _id: `${userId}:${meter}:account` },
      { $setOnInsert: { user_id: userId, meter, project_id: null }, $max: { used } },
      { upsert: true },
    )
  }
  return projects.length
}

function quotaError(meter) {
  const labels = {
    projects: 'Etkinlik projesi kotanız doldu',
    free_projects: 'Ücretsiz etkinlik projesi hakkınız kullanıldı',
    websites: 'Davet sitesi kullanım hakkınız doldu',
    invitations: 'Dijital davetiye kullanım hakkınız doldu',
    guests: 'Bu etkinlik için davetli kotanız doldu',
    messages: 'Bu etkinlik için mesaj kotanız doldu',
    invitation_exports: 'Davetiye dışa aktarma hakkınız doldu',
  }
  return labels[meter] || 'Paket kullanım kotanız doldu'
}

async function initializeProjectCounter(db, userId, projectId, meter, used) {
  const id = `${userId}:${meter}:${projectId}`
  await db.collection('billing_usage_counters').updateOne(
    { _id: id },
    { $setOnInsert: { user_id: userId, meter, project_id: projectId }, $max: { used } },
    { upsert: true },
  )
}

async function projectStats(db, projectId) {
  const [guest_count, rsvp_total, attending_agg, album_count] = await Promise.all([
    db.collection('guests').countDocuments({ project_id: projectId }),
    db.collection('rsvps').countDocuments({ project_id: projectId }),
    db.collection('rsvps').aggregate([
      { $match: { project_id: projectId, attending: true } },
      { $group: { _id: null, people: { $sum: '$guest_count' }, count: { $sum: 1 } } },
    ]).toArray(),
    db.collection('album_photos').countDocuments({ project_id: projectId }),
  ])
  const declined = await db.collection('rsvps').countDocuments({ project_id: projectId, attending: false })
  return {
    guest_count,
    rsvp_total,
    attending: attending_agg[0]?.count || 0,
    attending_people: attending_agg[0]?.people || 0,
    declined,
    album_count,
  }
}

export async function handleProjectRoutes({ db, route, path, method, request, user }) {
  if (path[0] !== 'projects') return null
  if (!user) return json({ error: 'Oturum gerekli' }, { status: 401 })

  // GET /api/projects
  if (route === '/projects' && method === 'GET') {
    const view = new URL(request.url).searchParams.get('view') || 'active'
    const filter = view === 'archive'
      ? { user_id: user.id, archived: true }
      : view === 'drafts'
        ? { user_id: user.id, archived: { $ne: true }, published: false }
        : { user_id: user.id, archived: { $ne: true }, published: true }
    const items = await db.collection('event_projects').find(filter, noId).sort({ updated_at: -1 }).toArray()
    const withStats = await Promise.all(items.map(async (p) => ({ ...p, stats: await projectStats(db, p.id), url: invitationUrl(p.slug) })))
    return json({ items: withStats })
  }

  // POST /api/projects
  if (route === '/projects' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Etkinlik kaydı için Idempotency-Key başlığı zorunludur' }, { status: 400 })
    const existing = await db.collection('event_projects').findOne({ user_id: user.id, creation_request_id: requestKey }, noId)
    if (existing) return json({ project: { ...existing, url: invitationUrl(existing.slug), stats: await projectStats(db, existing.id) } })
    const fieldError = validateProjectFields(body)
    if (fieldError) return json({ error: fieldError }, { status: 400 })
    const packageId = body.billing_package_id || FREE_PLAN_ID
    const packagePlan = getBillingPlan(packageId)
    if (!packagePlan) return json({ error: 'Geçersiz paket seçimi' }, { status: 400 })
    const siteEnabled = body.deliverables?.site?.enabled ?? Boolean(body.site_data)
    const invitationEnabled = body.deliverables?.invitation?.enabled ?? Boolean(body.canvas_design)
    if (!siteEnabled && !invitationEnabled) return json({ error: 'En az bir etkinlik çıktısı seçilmelidir' }, { status: 400 })
    if (body.template_slug) {
      const template = await db.collection('templates').findOne({ slug: body.template_slug })
      if (!template) return json({ error: 'Geçersiz tasarım' }, { status: 400 })
      if (isPremiumTemplate(template) && !packagePlan.entitlements.premiumTemplates) {
        return json({ error: 'Bu tasarım Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
      }
    }

    if (body.spotify_url && !packagePlan.entitlements.spotify) {
      return json({ error: 'Spotify özelliği Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
    }
    if (body.album_enabled && !packagePlan.entitlements.album) {
      return json({ error: 'Anı albümü Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
    }

    const typeLabel = EVENT_TYPES.find((e) => e.id === body.event_type)?.label || 'Etkinlik'
    const title = body.title || `${body.host_a || body.event_data?.company?.name || body.event_data?.celebrant?.name || 'Etkinlik'}${body.host_b ? ` & ${body.host_b}` : ''} · ${typeLabel}`
    const slug = await uniqueSlug(db, body.slug || `${body.host_a || title} ${body.host_b || ''}`)
    const doc = buildProjectDoc(user.id, {
      ...body,
      site_data: applySiteEntitlements(body.site_data, packagePlan.entitlements),
      title,
      album_enabled: packagePlan.entitlements.album && body.album_enabled === true,
      published: false,
    }, slug)
    doc.id = stableProjectId(user.id, requestKey)
    doc.creation_request_id = requestKey

    await initializeUsageFromProjects(db, user.id)
    const grants = await db.collection('billing_grants').find({ user_id: user.id }, { projection: { event_credits: 1 } }).toArray()
    const totalCredits = grants.reduce((sum, grant) => sum + (grant.event_credits || 0), 0)
    const projectSlot = await consumeQuota(db, {
      userId: user.id,
      meter: 'projects',
      requestKey,
      limit: 1 + totalCredits,
    })
    if (!projectSlot.allowed) return json({ error: quotaError('projects'), code: 'QUOTA_EXCEEDED' }, { status: 403 })

    let freeSlot = null
    let grant = null
    if (packageId === FREE_PLAN_ID) {
      freeSlot = await consumeQuota(db, { userId: user.id, meter: 'free_projects', requestKey, limit: 1 })
      if (!freeSlot.allowed) {
        await releaseQuota(db, { userId: user.id, meter: 'projects', requestKey })
        return json({ error: quotaError('free_projects'), code: 'QUOTA_EXCEEDED' }, { status: 403 })
      }
    } else {
      grant = await claimEventCredit(db, { userId: user.id, packageId, projectId: doc.id })
      if (!grant) {
        await releaseQuota(db, { userId: user.id, meter: 'projects', requestKey })
        return json({ error: 'Bu paket için kullanılabilir etkinlik krediniz yok', code: 'PACKAGE_PURCHASE_REQUIRED', packageId }, { status: 402 })
      }
    }

    const deliverableMeters = []
    for (const [enabled, meter, limit] of [
      [siteEnabled, 'websites', packagePlan.entitlements.websites],
      [invitationEnabled, 'invitations', packagePlan.entitlements.invitations],
    ]) {
      if (!enabled) continue
      const projectScoped = packageId !== FREE_PLAN_ID
      const result = await consumeQuota(db, {
        userId: user.id,
        meter,
        requestKey,
        limit,
        projectId: projectScoped ? doc.id : null,
      })
      if (!result.allowed) {
        for (const reservation of deliverableMeters) await releaseQuota(db, reservation)
        if (grant) await restoreEventCredit(db, { grantId: grant.id, projectId: doc.id })
        if (freeSlot) await releaseQuota(db, { userId: user.id, meter: 'free_projects', requestKey })
        await releaseQuota(db, { userId: user.id, meter: 'projects', requestKey })
        return json({ error: quotaError(meter), code: 'QUOTA_EXCEEDED' }, { status: 403 })
      }
      deliverableMeters.push({ userId: user.id, meter, requestKey, projectId: projectScoped ? doc.id : null })
    }

    try {
      await db.collection('event_projects').insertOne({ ...doc })
    } catch (error) {
      const duplicate = await db.collection('event_projects').findOne({ user_id: user.id, creation_request_id: requestKey }, noId)
      if (duplicate) return json({ project: { ...duplicate, url: invitationUrl(duplicate.slug), stats: await projectStats(db, duplicate.id) } })
      if (grant) await restoreEventCredit(db, { grantId: grant.id, projectId: doc.id })
      for (const reservation of deliverableMeters) await releaseQuota(db, reservation)
      if (freeSlot) await releaseQuota(db, { userId: user.id, meter: 'free_projects', requestKey })
      await releaseQuota(db, { userId: user.id, meter: 'projects', requestKey })
      throw error
    }
    return json({ project: { ...doc, url: invitationUrl(slug), stats: { guest_count: 0, rsvp_total: 0, attending: 0, attending_people: 0, declined: 0 } } }, { status: 201 })
  }

  const projectId = path[1]
  if (!projectId) return null
  const project = await db.collection('event_projects').findOne({ id: projectId, user_id: user.id }, noId)
  if (!project) return json({ error: 'Etkinlik bulunamadı' }, { status: 404 })
  const projectPlan = await getProjectPlan(db, user.id, project.id)

  if (path.length === 3 && path[2] === 'exports' && method === 'POST') {
    const invitationEnabled = project.deliverables?.invitation?.enabled ?? Boolean(project.canvas_design)
    if (!invitationEnabled) return json({ error: 'Bu projede dijital davetiye etkin değil' }, { status: 403 })
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Dışa aktarma için Idempotency-Key başlığı zorunludur' }, { status: 400 })
    const result = await consumeQuota(db, {
      userId: user.id,
      meter: 'invitation_exports',
      requestKey,
      limit: projectPlan.entitlements.invitationExports,
      projectId: projectPlan.id === FREE_PLAN_ID ? null : project.id,
    })
    if (!result.allowed) {
      return json({ error: quotaError('invitation_exports'), code: 'QUOTA_EXCEEDED' }, { status: 403 })
    }
    return json({ ok: true, idempotent: result.used }, { status: result.used ? 200 : 201 })
  }

  // PATCH /api/projects/:id/archive { archived: boolean }
  if (path.length === 3 && path[2] === 'archive' && method === 'PATCH') {
    const body = await request.json().catch(() => ({}))
    if (typeof body.archived !== 'boolean') {
      return json({ error: 'Arşiv durumu geçersiz' }, { status: 400 })
    }
    const updatedAt = new Date()
    await db.collection('event_projects').updateOne(
      { id: project.id, user_id: user.id },
      { $set: { archived: body.archived, updated_at: updatedAt } },
    )
    const updated = { ...project, archived: body.archived, updated_at: updatedAt }
    return json({ project: { ...updated, url: invitationUrl(updated.slug), stats: await projectStats(db, project.id) } })
  }

  // GET /api/projects/:id
  if (path.length === 2 && method === 'GET') {
    return json({
      project: {
        ...project,
        site_data: applySiteEntitlements(project.site_data, projectPlan.entitlements),
        advanced_rsvp: projectPlan.entitlements.advancedRsvp,
        remove_branding: projectPlan.entitlements.removeBranding,
        url: invitationUrl(project.slug),
        stats: await projectStats(db, project.id),
      },
    })
  }

  // PATCH /api/projects/:id
  if (path.length === 2 && (method === 'PATCH' || method === 'PUT')) {
    const body = await request.json().catch(() => ({}))
    let updatePlan = projectPlan
    let packageUpgrade = false
    if (body.billing_package_id && body.billing_package_id !== projectPlan.id) {
      const requestedPlan = getBillingPlan(body.billing_package_id)
      if (projectPlan.id !== FREE_PLAN_ID || !requestedPlan || requestedPlan.grantMode !== 'event_credits') {
        return json({ error: 'Bu etkinliğe seçilen paket uygulanamıyor', code: 'INVALID_PACKAGE_UPGRADE' }, { status: 409 })
      }
      updatePlan = requestedPlan
      packageUpgrade = true
    }
    const patch = {}
    for (const key of PROJECT_EDITABLE_FIELDS) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    if (patch.site_data) patch.site_data = applySiteEntitlements(patch.site_data, updatePlan.entitlements)
    if (patch.template_slug && patch.template_slug !== project.template_slug) {
      const t = await db.collection('templates').findOne({ slug: patch.template_slug })
      if (!t) return json({ error: 'Geçersiz tasarım' }, { status: 400 })
      if (isPremiumTemplate(t) && !updatePlan.entitlements.premiumTemplates) {
        return json({ error: 'Bu tasarım Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
      }
    }
    if (patch.spotify_url && patch.spotify_url !== project.spotify_url && !updatePlan.entitlements.spotify) {
      return json({ error: 'Spotify özelliği Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
    }
    if (patch.album_enabled && !project.album_enabled && !updatePlan.entitlements.album) {
      return json({ error: 'Anı albümü Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
    }
    if (patch.site_data && !updatePlan.entitlements.advancedRsvp) {
      const asksForMenu = patch.site_data.sections?.some((section) =>
        section?.type === 'rsvp' && section.props?.askMenu === true,
      )
      const previouslyAskedForMenu = project.site_data?.sections?.some((section) =>
        section?.type === 'rsvp' && section.props?.askMenu === true,
      )
      if (asksForMenu && !previouslyAskedForMenu) {
        return json({ error: 'Gelişmiş RSVP ve menü tercihleri Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
      }
    }
    if (body.published === true) {
      const siteEnabled = patch.deliverables?.site?.enabled ?? project.deliverables?.site?.enabled ?? Boolean(project.site_data)
      if (!siteEnabled) return json({ error: 'Yayınlamak için davet sitesini etkinleştirin' }, { status: 400 })
    }
    const previousDeliverables = project.deliverables || {}
    const nextDeliverables = patch.deliverables || previousDeliverables
    const newlyEnabled = [
      { meter: 'websites', name: 'site' },
      { meter: 'invitations', name: 'invitation' },
    ].filter(({ name }) =>
      nextDeliverables[name]?.enabled === true && previousDeliverables[name]?.enabled !== true,
    )
    const usageReservations = []
    if (newlyEnabled.length) {
      const requestKey = getRequestKey(request)
      if (!requestKey) return json({ error: 'Bu değişiklik için Idempotency-Key başlığı zorunludur' }, { status: 400 })
      for (const { meter } of newlyEnabled) {
        const result = await consumeQuota(db, {
          userId: user.id,
          meter,
          requestKey,
          limit: updatePlan.entitlements[meter],
          projectId: updatePlan.id === FREE_PLAN_ID ? null : project.id,
        })
        if (!result.allowed) {
          for (const reservation of usageReservations) await releaseQuota(db, reservation)
          return json({ error: quotaError(meter), code: 'QUOTA_EXCEEDED' }, { status: 403 })
        }
        usageReservations.push({
          userId: user.id,
          meter,
          requestKey,
          projectId: updatePlan.id === FREE_PLAN_ID ? null : project.id,
        })
      }
    }
    if (body.slug && body.slug !== project.slug) {
      patch.slug = await uniqueSlug(db, body.slug, project.id)
    }
    const normalized = buildProjectDoc(user.id, { ...project, ...patch }, patch.slug || project.slug)
    const final = {}
    for (const key of Object.keys(patch)) final[key] = normalized[key] !== undefined ? normalized[key] : patch[key]
    final.updated_at = new Date()
    let assignedGrant = null
    if (packageUpgrade) {
      assignedGrant = await claimEventCredit(db, {
        userId: user.id,
        packageId: updatePlan.id,
        projectId: project.id,
      })
      if (!assignedGrant) {
        for (const reservation of usageReservations) await releaseQuota(db, reservation)
        return json({ error: 'Bu paket için kullanılabilir etkinlik krediniz yok', code: 'PACKAGE_PURCHASE_REQUIRED', packageId: updatePlan.id }, { status: 402 })
      }
    }
    try {
      await db.collection('event_projects').updateOne({ id: project.id }, { $set: final })
    } catch (error) {
      for (const reservation of usageReservations) await releaseQuota(db, reservation)
      if (assignedGrant?.newlyAssigned) {
        await restoreEventCredit(db, { grantId: assignedGrant.id, projectId: project.id })
      }
      throw error
    }
    const updated = { ...project, ...final, billing_package_id: updatePlan.id }
    return json({ project: { ...updated, url: invitationUrl(updated.slug), stats: await projectStats(db, project.id) } })
  }

  // DELETE /api/projects/:id
  if (path.length === 2 && method === 'DELETE') {
    await Promise.all([
      db.collection('event_projects').deleteOne({ id: project.id }),
      db.collection('guests').deleteMany({ project_id: project.id }),
      db.collection('rsvps').deleteMany({ project_id: project.id }),
      db.collection('album_photos').deleteMany({ project_id: project.id }),
      db.collection('guestbook_messages').deleteMany({ project_id: project.id }),
    ])
    return json({ ok: true })
  }

  // ---- Guests ----
  if (path[2] === 'guests') {
    // GET /api/projects/:id/guests
    if (path.length === 3 && method === 'GET') {
      const items = await db.collection('guests').find({ project_id: project.id }, noId).sort({ created_at: -1 }).toArray()
      return json({ items, total: items.length })
    }
    // POST /api/projects/:id/guests
    if (path.length === 3 && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const guest = normalizeGuest(body, project.id, user.id)
      if (!guest) return json({ error: 'Davetli adı zorunludur' }, { status: 400 })
      if (body.email && !guest.email) return json({ error: 'E-posta adresi geçersiz' }, { status: 400 })
      if (body.phone && !guest.phone) return json({ error: 'Telefon numarası geçersiz (örn. 0532 123 45 67)' }, { status: 400 })
      const requestKey = getRequestKey(request)
      if (!requestKey) return json({ error: 'Davetli kaydı için Idempotency-Key başlığı zorunludur' }, { status: 400 })
      const existingCount = await db.collection('guests').countDocuments({ project_id: project.id })
      await initializeProjectCounter(db, user.id, project.id, 'guests', existingCount)
      const quota = await consumeQuota(db, {
        userId: user.id,
        meter: 'guests',
        requestKey,
        limit: projectPlan.entitlements.guests,
        projectId: project.id,
      })
      if (!quota.allowed) return json({ error: quotaError('guests'), code: 'QUOTA_EXCEEDED' }, { status: 403 })
      const priorGuest = await db.collection('guests').findOne({ project_id: project.id, creation_request_id: requestKey }, noId)
      if (priorGuest) return json({ guest: priorGuest, idempotent: true })
      try {
        await db.collection('guests').insertOne({ ...guest, creation_request_id: requestKey })
      } catch (error) {
        if (error?.code === 11000) {
          const duplicate = await db.collection('guests').findOne({ project_id: project.id, creation_request_id: requestKey }, noId)
          if (duplicate) return json({ guest: duplicate, idempotent: true })
        }
        await releaseQuota(db, { userId: user.id, meter: 'guests', requestKey, projectId: project.id })
        throw error
      }
      return json({ guest }, { status: 201 })
    }
    // POST /api/projects/:id/guests/import  { rows: [...] }
    if (path[3] === 'import' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const rows = Array.isArray(body.rows) ? body.rows.slice(0, 1000) : []
      if (!rows.length) return json({ error: 'Yüklenecek satır bulunamadı' }, { status: 400 })
      const existing = await db.collection('guests').find({ project_id: project.id }, { projection: { email: 1, phone: 1, name: 1 } }).toArray()
      const seen = new Set(existing.flatMap((g) => [g.email, g.phone, g.name?.toLowerCase()].filter(Boolean)))
      const docs = []
      let skipped = 0
      for (const row of rows) {
        const g = normalizeGuest(row, project.id, user.id)
        if (!g) { skipped++; continue }
        const key = g.email || g.phone || g.name.toLowerCase()
        if (seen.has(key)) { skipped++; continue }
        seen.add(key)
        docs.push(g)
      }
      if (docs.length) {
        const requestKey = getRequestKey(request)
        if (!requestKey) return json({ error: 'Davetli aktarımı için Idempotency-Key başlığı zorunludur' }, { status: 400 })
        const existingCount = await db.collection('guests').countDocuments({ project_id: project.id })
        await initializeProjectCounter(db, user.id, project.id, 'guests', existingCount)
        const quota = await consumeQuota(db, {
          userId: user.id,
          meter: 'guests',
          requestKey,
          amount: docs.length,
          limit: projectPlan.entitlements.guests,
          projectId: project.id,
        })
        if (!quota.allowed) return json({ error: quotaError('guests'), code: 'QUOTA_EXCEEDED', count: quota.count, limit: quota.limit }, { status: 403 })
        if (quota.used) return json({ imported: 0, skipped: rows.length, total: rows.length, idempotent: true }, { status: 200 })
        try {
          await db.collection('guests').insertMany(docs.map((guest) => ({
            ...guest,
            creation_request_id: `${requestKey}_${crypto.createHash('sha256').update(guest.email || guest.phone || guest.name.toLowerCase()).digest('hex').slice(0, 32)}`,
          })))
        } catch (error) {
          await releaseQuota(db, { userId: user.id, meter: 'guests', requestKey, amount: docs.length, projectId: project.id })
          throw error
        }
      }
      return json({ imported: docs.length, skipped, total: rows.length }, { status: 201 })
    }
    // DELETE /api/projects/:id/guests/:gid
    if (path.length === 4 && method === 'DELETE') {
      const r = await db.collection('guests').deleteOne({ id: path[3], project_id: project.id })
      if (!r.deletedCount) return json({ error: 'Davetli bulunamadı' }, { status: 404 })
      return json({ ok: true })
    }
    // PATCH /api/projects/:id/guests/:gid
    if (path.length === 4 && method === 'PATCH') {
      const body = await request.json().catch(() => ({}))
      const g = normalizeGuest(body, project.id, user.id)
      if (!g) return json({ error: 'Davetli adı zorunludur' }, { status: 400 })
      const patch = { name: g.name, email: g.email, phone: g.phone, group: g.group }
      await db.collection('guests').updateOne({ id: path[3], project_id: project.id }, { $set: patch })
      const updated = await db.collection('guests').findOne({ id: path[3] }, noId)
      return json({ guest: updated })
    }
  }

  // ---- Album (QR anı albümü) ----
  if (path[2] === 'album') {
    // GET /api/projects/:id/album
    if (path.length === 3 && method === 'GET') {
      const items = await db.collection('album_photos').find({ project_id: project.id }, noId).sort({ created_at: -1 }).limit(ALBUM_PROJECT_CAP).toArray()
      return json({ items, total: items.length, enabled: project.album_enabled !== false })
    }
    // DELETE /api/projects/:id/album/:photoId
    if (path.length === 4 && method === 'DELETE') {
      const r = await db.collection('album_photos').deleteOne({ id: path[3], project_id: project.id })
      if (!r.deletedCount) return json({ error: 'Fotoğraf bulunamadı' }, { status: 404 })
      return json({ ok: true })
    }
  }

  // ---- Guestbook ----
  if (path[2] === 'guestbook') {
    if (path.length === 3 && method === 'GET') {
      const items = await db.collection('guestbook_messages').find({ project_id: project.id }, noId).sort({ created_at: -1 }).limit(500).toArray()
      return json({ items })
    }
    if (path.length === 4 && method === 'PATCH') {
      const parsed = await readJsonObject(request)
      if (parsed.error) return json({ error: parsed.error }, { status: parsed.status })
      if (!['approved', 'rejected'].includes(parsed.body.status)) {
        return json({ error: 'Geçersiz mesaj durumu' }, { status: 400 })
      }
      const result = await db.collection('guestbook_messages').updateOne(
        { id: path[3], project_id: project.id },
        { $set: { status: parsed.body.status, reviewed_at: new Date() } },
      )
      if (!result.matchedCount) return json({ error: 'Mesaj bulunamadı' }, { status: 404 })
      return json({ ok: true })
    }
    if (path.length === 4 && method === 'DELETE') {
      const result = await db.collection('guestbook_messages').deleteOne({ id: path[3], project_id: project.id })
      if (!result.deletedCount) return json({ error: 'Mesaj bulunamadı' }, { status: 404 })
      return json({ ok: true })
    }
  }

  // GET /api/projects/:id/rsvps
  if (path[2] === 'rsvps' && method === 'GET') {
    const items = await db.collection('rsvps').find({ project_id: project.id }, noId).sort({ created_at: -1 }).toArray()
    return json({ items, stats: await projectStats(db, project.id) })
  }

  // GET /api/projects/:id/messages
  if (path[2] === 'messages' && method === 'GET') {
    const items = await db.collection('message_logs').find({ project_id: project.id }, noId).sort({ created_at: -1 }).limit(200).toArray()
    return json({ items })
  }

  // POST /api/projects/:id/send  { channel, type, guest_ids? }
  if (path[2] === 'send' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Gönderim için Idempotency-Key başlığı zorunludur' }, { status: 400 })
    const channel = body.channel === 'sms' ? 'sms' : body.channel === 'email' ? 'email' : null
    if (!channel) return json({ error: "channel 'email' veya 'sms' olmalı" }, { status: 400 })
    const type = MESSAGE_TYPES.includes(body.type) ? body.type : 'invitation'
    if (channel === 'email' && !isEmailConfigured()) return json({ error: 'E-posta servisi yapılandırılmamış' }, { status: 503 })
    if (channel === 'sms' && !isSmsConfigured()) return json({ error: 'SMS servisi henüz yapılandırılmadı (Twilio kimlik bilgileri eksik)' }, { status: 503 })

    const filter = { project_id: project.id }
    if (Array.isArray(body.guest_ids) && body.guest_ids.length) filter.id = { $in: body.guest_ids.slice(0, 200) }
    const guests = await db.collection('guests').find(filter, noId).limit(200).toArray()
    if (!guests.length) return json({ error: 'Gönderilecek davetli bulunamadı' }, { status: 400 })
    const sentCount = await db.collection('message_logs').countDocuments({ project_id: project.id, status: { $in: ['sent', 'delivered', 'queued'] } })
    await initializeProjectCounter(db, user.id, project.id, 'messages', sentCount)

    const typeLabel = EVENT_TYPES.find((e) => e.id === project.event_type)?.label || 'Etkinlik'
    const baseCtx = {
      hosts: [project.host_a, project.host_b].filter(Boolean).join(' & '),
      eventTitle: project.title || `${[project.host_a, project.host_b].filter(Boolean).join(' & ')} · ${typeLabel}`,
      eventDate: formatEventDate(project.date, project.time),
      venue: [project.venue, project.city].filter(Boolean).join(', '),
      invitationUrl: invitationUrl(project.slug),
    }

    const summary = { sent: 0, failed: 0, skipped: 0, results: [] }
    for (const g of guests) {
      const to = channel === 'email' ? g.email : g.phone
      if (!to) { summary.skipped++; summary.results.push({ guest_id: g.id, name: g.name, status: 'skipped', reason: channel === 'email' ? 'E-posta yok' : 'Telefon yok' }); continue }
      const messageKey = `${requestKey}_${g.id}`
      const quota = await consumeQuota(db, {
        userId: user.id,
        meter: 'messages',
        requestKey: messageKey,
        limit: projectPlan.entitlements.messages,
        projectId: project.id,
      })
      if (!quota.allowed) {
        summary.failed++
        summary.results.push({ guest_id: g.id, name: g.name, to, status: 'failed', error: quotaError('messages') })
        continue
      }
      if (quota.used) {
        summary.skipped++
        summary.results.push({ guest_id: g.id, name: g.name, to, status: 'skipped', reason: 'Bu istekte daha önce gönderildi' })
        continue
      }
      const ctx = buildContext({ ...baseCtx, guestName: g.name })
      const log = {
        id: uuidv4(), channel, type, to, guest_id: g.id, guest_name: g.name, project_id: project.id, user_id: user.id,
        idempotency_key: messageKey,
        event_title: ctx.eventTitle, status: 'pending', provider: channel === 'email' ? 'resend' : 'twilio', provider_id: null, error: null, created_at: new Date(),
      }
      try {
        const result = channel === 'email' ? await sendEmail({ to, type, ctx }) : await sendSms({ to, type, ctx })
        log.status = result.status || 'sent'
        log.provider_id = result.id || null
        summary.sent++
        await db.collection('guests').updateOne({ id: g.id }, { $set: { status: g.status === 'responded' ? 'responded' : 'invited', last_sent_at: new Date(), last_channel: channel } })
      } catch (e) {
        log.status = 'failed'
        log.error = e.message
        summary.failed++
        await releaseQuota(db, { userId: user.id, meter: 'messages', requestKey: messageKey, projectId: project.id })
      }
      await db.collection('message_logs').insertOne({ ...log })
      summary.results.push({ guest_id: g.id, name: g.name, to, status: log.status, error: log.error })
      if (guests.length > 1) await sleep(channel === 'email' ? 550 : 250)
    }
    return json({ ok: true, channel, type, ...summary })
  }

  return null
}

// ---------------- Public (no auth) ----------------
export async function handlePublicRoutes({ db, route, path, method, request }) {
  if (path[0] !== 'public') return null

  // GET /api/public/invitations/:slug
  if (path[1] === 'invitations' && path[2] && method === 'GET') {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true, archived: { $ne: true } }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const plan = await getProjectPlan(db, project.user_id, project.id)
    const template = await db.collection('templates').findOne({ slug: project.template_slug }, noId)
    delete project.user_id
    project.site_data = applySiteEntitlements(project.site_data, plan.entitlements)
    project.advanced_rsvp = plan.entitlements.advancedRsvp
    project.remove_branding = plan.entitlements.removeBranding
    return json({ project, template })
  }

  // ---- Public Album (QR anı albümü) ----
  // GET /api/public/album/:slug  -> list approved photos
  if (path[1] === 'album' && path[2] && path.length === 3 && method === 'GET') {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true, archived: { $ne: true } }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const enabled = project.album_enabled !== false
    const items = enabled
      ? await db.collection('album_photos').find({ project_id: project.id, status: 'approved' }, noId).sort({ created_at: -1 }).limit(200).toArray()
      : []
    return json({ enabled, items, total: items.length })
  }

  // POST /api/public/album/:slug  { uploader, photos: [dataUrl] }
  if (path[1] === 'album' && path[2] && path.length === 3 && method === 'POST') {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true, archived: { $ne: true } }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    if (project.album_enabled === false) return json({ error: 'Anı albümü şu anda kapalı' }, { status: 403 })
    const albumPlan = await getProjectPlan(db, project.user_id, project.id)
    const legacyAlbum = !project.creation_request_id && project.album_enabled === true
    if (!albumPlan.entitlements.album && !legacyAlbum) {
      return json({ error: 'Anı albümü Premium paket gerektirir', code: 'FEATURE_REQUIRED', packageId: 'premium' }, { status: 403 })
    }
    const parsed = await readJsonObject(request, MAX_ALBUM_REQUEST_BYTES)
    if (parsed.error) return json({ error: parsed.error }, { status: parsed.status })
    const body = parsed.body
    const uploader = String(body.uploader || '').trim().slice(0, 60) || 'Misafir'
    const incoming = Array.isArray(body.photos) ? body.photos : (body.photo ? [body.photo] : [])
    const valid = incoming.filter(isValidPhotoDataUrl).slice(0, 12)
    if (!valid.length) return json({ error: 'Geçerli bir fotoğraf bulunamadı (JPG/PNG/WEBP, en fazla ~3MB)' }, { status: 400 })
    const existingCount = await db.collection('album_photos').countDocuments({ project_id: project.id })
    if (existingCount >= ALBUM_PROJECT_CAP) return json({ error: 'Albüm kapasitesi doldu' }, { status: 400 })
    const allowed = valid.slice(0, Math.max(0, ALBUM_PROJECT_CAP - existingCount))
    const requestKey = getRequestKey(request)
    if (!requestKey) return json({ error: 'Fotoğraf yüklemesi için Idempotency-Key başlığı zorunludur' }, { status: 400 })
    const meterLimit = legacyAlbum ? ALBUM_PROJECT_CAP : Math.min(ALBUM_PROJECT_CAP, albumPlan.entitlements.albumPhotos)
    await initializeProjectCounter(db, project.user_id, project.id, 'album_photos', existingCount)
    const quota = await consumeQuota(db, {
      userId: project.user_id,
      meter: 'album_photos',
      requestKey,
      amount: allowed.length,
      limit: meterLimit,
      projectId: project.id,
    })
    if (!quota.allowed) return json({ error: 'Albüm kapasitesi doldu', code: 'QUOTA_EXCEEDED' }, { status: 429 })
    const docs = allowed.map((data_url, index) => ({
      id: crypto.createHash('sha256').update(`${requestKey}:${index}`).digest('hex'),
      creation_request_id: `${requestKey}_${index}`,
      project_id: project.id,
      slug: project.slug,
      uploader_name: uploader,
      data_url,
      status: 'approved',
      likes: 0,
      created_at: new Date(),
    }))
    try {
      const result = docs.length
        ? await db.collection('album_photos').bulkWrite(docs.map((photo) => ({
            updateOne: { filter: { project_id: project.id, id: photo.id }, update: { $setOnInsert: photo }, upsert: true },
          })))
        : { upsertedCount: 0 }
      const inserted = await db.collection('album_photos')
        .find({ project_id: project.id, creation_request_id: { $in: docs.map((photo) => photo.creation_request_id) } }, noId)
        .toArray()
      return json({
        ok: true,
        uploaded: result.upsertedCount || 0,
        photos: inserted.map(({ data_url, ...photo }) => photo),
        idempotent: quota.used,
      }, { status: quota.used ? 200 : 201 })
    } catch (error) {
      if (!quota.used) await releaseQuota(db, { userId: project.user_id, meter: 'album_photos', requestKey, amount: allowed.length, projectId: project.id })
      throw error
    }
  }

  // POST /api/public/album/:slug/like  { photo_id, liked: boolean }
  if (path[1] === 'album' && path[2] && path[3] === 'like' && path.length === 4 && method === 'POST') {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true, archived: { $ne: true } }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    if (project.album_enabled === false) return json({ error: 'Anı albümü kapalı' }, { status: 403 })
    const body = await request.json().catch(() => ({}))
    const photo = await db.collection('album_photos').findOne({ id: String(body.photo_id || ''), project_id: project.id })
    if (!photo) return json({ error: 'Fotoğraf bulunamadı' }, { status: 404 })
    const delta = body.liked === false ? -1 : 1
    const newLikes = Math.max(0, (photo.likes || 0) + delta)
    await db.collection('album_photos').updateOne({ id: photo.id }, { $set: { likes: newLikes } })
    return json({ ok: true, likes: newLikes })
  }

  // GET /api/public/guestbook/:slug -> list approved messages
  if (path[1] === 'guestbook' && path[2] && path.length === 3 && (method === 'GET' || method === 'POST')) {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true, archived: { $ne: true } }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const section = getSiteSection(project, 'guestbook')
    const enabled = Boolean(section)
    if (method === 'GET') {
      const items = enabled
        ? await db.collection('guestbook_messages').find({ project_id: project.id, status: 'approved' }, noId).sort({ created_at: -1 }).limit(200).toArray()
        : []
      return json({ enabled, items })
    }
    if (!enabled || section.props?.allowNew === false) {
      return json({ error: 'Anı defteri mesaj kabul etmiyor' }, { status: 403 })
    }
    const parsed = await readJsonObject(request)
    if (parsed.error) return json({ error: parsed.error }, { status: parsed.status })
    const body = parsed.body
    const name = String(body.name || '').trim().slice(0, 60)
    const message = String(body.message || '').trim().slice(0, 500)
    if (!name || !message) return json({ error: 'Adınız ve mesajınız zorunludur' }, { status: 400 })
    const messageCount = await db.collection('guestbook_messages').countDocuments({ project_id: project.id })
    if (messageCount >= GUESTBOOK_PROJECT_CAP) {
      return json({ error: 'Anı defterinin mesaj kapasitesi doldu' }, { status: 429 })
    }
    const item = {
      id: uuidv4(),
      project_id: project.id,
      name,
      message,
      status: 'pending',
      created_at: new Date(),
      reviewed_at: null,
    }
    await db.collection('guestbook_messages').insertOne({ ...item })
    return json({ ok: true, status: item.status }, { status: 201 })
  }

  // POST /api/public/rsvp
  if (route === '/public/rsvp' && method === 'POST') {
    const parsed = await readJsonObject(request)
    if (parsed.error) return json({ error: parsed.error }, { status: parsed.status })
    const body = parsed.body
    const project = await db.collection('event_projects').findOne({ slug: String(body.slug || ''), published: true, archived: { $ne: true } }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const name = String(body.name || '').trim().slice(0, 100)
    if (!name) return json({ error: 'Ad soyad zorunludur' }, { status: 400 })
    if (typeof body.attending !== 'boolean') return json({ error: 'Katılım bilgisi zorunludur' }, { status: 400 })
    const email = String(body.email || '').trim().toLowerCase()
    if (email && !isValidEmail(email)) return json({ error: 'E-posta adresi geçersiz' }, { status: 400 })
    const phone = body.phone ? normalizePhone(body.phone) : null
    if (body.phone && !phone) return json({ error: 'Telefon numarası geçersiz' }, { status: 400 })
    if (!email && !phone) return json({ error: 'E-posta veya telefon gerekli' }, { status: 400 })
    const rsvpProjectPlan = await getProjectPlan(db, project.user_id, project.id)
    const { menuOptions, maxGuests, askMenu } = getRsvpConfiguration(project, rsvpProjectPlan.entitlements)
    const guestCount = body.attending ? Math.min(Math.max(parseInt(body.guest_count, 10) || 1, 1), maxGuests) : 0
    const menu = body.attending && askMenu && body.menu && menuOptions.includes(body.menu) ? body.menu : null

    // Match existing guest by email/phone to link the response.
    const guestMatch = await db.collection('guests').findOne({ project_id: project.id, $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] })

    const rsvp = {
      id: uuidv4(), project_id: project.id, guest_id: guestMatch?.id || null,
      name, email: email || null, phone, attending: body.attending, guest_count: guestCount, menu,
      note: String(body.note || '').trim().slice(0, 500) || null, created_at: new Date(),
    }
    await db.collection('rsvps').insertOne({ ...rsvp })
    if (guestMatch) await db.collection('guests').updateOne({ id: guestMatch.id }, { $set: { status: 'responded', rsvp_id: rsvp.id } })

    // Confirmation messages (best effort)
    const typeLabel = EVENT_TYPES.find((e) => e.id === project.event_type)?.label || 'Etkinlik'
    const ctx = buildContext({
      guestName: name,
      hosts: [project.host_a, project.host_b].filter(Boolean).join(' & '),
      eventTitle: project.title || `${[project.host_a, project.host_b].filter(Boolean).join(' & ')} · ${typeLabel}`,
      eventDate: formatEventDate(project.date, project.time),
      venue: [project.venue, project.city].filter(Boolean).join(', '),
      invitationUrl: invitationUrl(project.slug),
    })
    const confirmations = []
    const attempts = []
    if (email && isEmailConfigured()) attempts.push({ channel: 'email', to: email, fn: () => sendEmail({ to: email, type: 'rsvp', ctx }) })
    if (phone && isSmsConfigured()) attempts.push({ channel: 'sms', to: phone, fn: () => sendSms({ to: phone, type: 'rsvp', ctx }) })
    const sentCount = await db.collection('message_logs').countDocuments({ project_id: project.id, status: { $in: ['sent', 'delivered', 'queued'] } })
    await initializeProjectCounter(db, project.user_id, project.id, 'messages', sentCount)
    for (const a of attempts) {
      const requestKey = `rsvp_${rsvp.id}_${a.channel}`
      const quota = await consumeQuota(db, {
        userId: project.user_id,
        meter: 'messages',
        requestKey,
        limit: rsvpProjectPlan.entitlements.messages,
        projectId: project.id,
      })
      if (!quota.allowed) {
        confirmations.push({ channel: a.channel, status: 'skipped', error: quotaError('messages') })
        continue
      }
      if (quota.used) {
        confirmations.push({ channel: a.channel, status: 'skipped', idempotent: true })
        continue
      }
      const log = { id: uuidv4(), channel: a.channel, type: 'rsvp', to: a.to, guest_id: guestMatch?.id || null, guest_name: name, project_id: project.id, user_id: project.user_id, idempotency_key: requestKey, event_title: ctx.eventTitle, status: 'pending', provider: a.channel === 'email' ? 'resend' : 'twilio', provider_id: null, error: null, created_at: new Date() }
      try {
        const r = await a.fn()
        log.status = r.status || 'sent'; log.provider_id = r.id || null
      } catch (e) {
        log.status = 'failed'; log.error = e.message
        await releaseQuota(db, { userId: project.user_id, meter: 'messages', requestKey, projectId: project.id })
      }
      await db.collection('message_logs').insertOne({ ...log })
      confirmations.push({ channel: a.channel, status: log.status })
    }

    return json({ ok: true, rsvp: { id: rsvp.id, attending: rsvp.attending, guest_count: rsvp.guest_count }, confirmations }, { status: 201 })
  }

  return null
}
