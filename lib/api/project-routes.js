import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { buildProjectDoc, uniqueSlug, PROJECT_EDITABLE_FIELDS, formatEventDate, invitationUrl, DEFAULT_MENU_OPTIONS } from '@/lib/projects'
import { EVENT_TYPES } from '@/lib/data/events'
import { MESSAGE_TYPES, isValidEmail, toE164, buildContext } from '@/lib/messaging/shared'
import { isEmailConfigured, sendEmail } from '@/lib/messaging/email'
import { isSmsConfigured, sendSms } from '@/lib/messaging/sms'

const json = (data, init) => NextResponse.json(data, init)
const noId = { projection: { _id: 0 } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MAX_PHOTO_CHARS = 4_000_000 // ~3MB base64 per photo
const ALBUM_PROJECT_CAP = 500
function isValidPhotoDataUrl(s) {
  return typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s) && s.length <= MAX_PHOTO_CHARS
}

function normalizePhone(value) {
  if (!value) return null
  try { return toE164(value) } catch { return null }
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
    const items = await db.collection('event_projects').find({ user_id: user.id }, noId).sort({ created_at: -1 }).toArray()
    const withStats = await Promise.all(items.map(async (p) => ({ ...p, stats: await projectStats(db, p.id), url: invitationUrl(p.slug) })))
    return json({ items: withStats })
  }

  // POST /api/projects
  if (route === '/projects' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    if (!body.host_a) return json({ error: 'En az bir ev sahibi adı zorunludur' }, { status: 400 })
    if (!body.date) return json({ error: 'Etkinlik tarihi zorunludur' }, { status: 400 })
    if (!EVENT_TYPES.some((e) => e.id === body.event_type)) return json({ error: 'Geçersiz etkinlik türü' }, { status: 400 })
    const template = await db.collection('templates').findOne({ slug: body.template_slug })
    if (!template) return json({ error: 'Geçersiz tasarım' }, { status: 400 })

    const typeLabel = EVENT_TYPES.find((e) => e.id === body.event_type)?.label || 'Etkinlik'
    const title = body.title || `${body.host_a}${body.host_b ? ` & ${body.host_b}` : ''} · ${typeLabel}`
    const slug = await uniqueSlug(db, body.slug || `${body.host_a} ${body.host_b || ''}`)
    const doc = buildProjectDoc(user.id, { ...body, title }, slug)
    await db.collection('event_projects').insertOne({ ...doc })
    return json({ project: { ...doc, url: invitationUrl(slug), stats: { guest_count: 0, rsvp_total: 0, attending: 0, attending_people: 0, declined: 0 } } }, { status: 201 })
  }

  const projectId = path[1]
  if (!projectId) return null
  const project = await db.collection('event_projects').findOne({ id: projectId, user_id: user.id }, noId)
  if (!project) return json({ error: 'Etkinlik bulunamadı' }, { status: 404 })

  // GET /api/projects/:id
  if (path.length === 2 && method === 'GET') {
    return json({ project: { ...project, url: invitationUrl(project.slug), stats: await projectStats(db, project.id) } })
  }

  // PATCH /api/projects/:id
  if (path.length === 2 && (method === 'PATCH' || method === 'PUT')) {
    const body = await request.json().catch(() => ({}))
    const patch = {}
    for (const key of PROJECT_EDITABLE_FIELDS) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    if (patch.template_slug) {
      const t = await db.collection('templates').findOne({ slug: patch.template_slug })
      if (!t) return json({ error: 'Geçersiz tasarım' }, { status: 400 })
    }
    if (body.slug && body.slug !== project.slug) {
      patch.slug = await uniqueSlug(db, body.slug, project.id)
    }
    const normalized = buildProjectDoc(user.id, { ...project, ...patch }, patch.slug || project.slug)
    const final = {}
    for (const key of Object.keys(patch)) final[key] = normalized[key] !== undefined ? normalized[key] : patch[key]
    final.updated_at = new Date()
    await db.collection('event_projects').updateOne({ id: project.id }, { $set: final })
    const updated = { ...project, ...final }
    return json({ project: { ...updated, url: invitationUrl(updated.slug), stats: await projectStats(db, project.id) } })
  }

  // DELETE /api/projects/:id
  if (path.length === 2 && method === 'DELETE') {
    await Promise.all([
      db.collection('event_projects').deleteOne({ id: project.id }),
      db.collection('guests').deleteMany({ project_id: project.id }),
      db.collection('rsvps').deleteMany({ project_id: project.id }),
      db.collection('album_photos').deleteMany({ project_id: project.id }),
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
      await db.collection('guests').insertOne({ ...guest })
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
      if (docs.length) await db.collection('guests').insertMany(docs.map((d) => ({ ...d })))
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
    const channel = body.channel === 'sms' ? 'sms' : body.channel === 'email' ? 'email' : null
    if (!channel) return json({ error: "channel 'email' veya 'sms' olmalı" }, { status: 400 })
    const type = MESSAGE_TYPES.includes(body.type) ? body.type : 'invitation'
    if (channel === 'email' && !isEmailConfigured()) return json({ error: 'E-posta servisi yapılandırılmamış' }, { status: 503 })
    if (channel === 'sms' && !isSmsConfigured()) return json({ error: 'SMS servisi henüz yapılandırılmadı (Twilio kimlik bilgileri eksik)' }, { status: 503 })

    const filter = { project_id: project.id }
    if (Array.isArray(body.guest_ids) && body.guest_ids.length) filter.id = { $in: body.guest_ids.slice(0, 200) }
    const guests = await db.collection('guests').find(filter, noId).limit(200).toArray()
    if (!guests.length) return json({ error: 'Gönderilecek davetli bulunamadı' }, { status: 400 })

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
      const ctx = buildContext({ ...baseCtx, guestName: g.name })
      const log = {
        id: uuidv4(), channel, type, to, guest_id: g.id, guest_name: g.name, project_id: project.id, user_id: user.id,
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
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true }, { projection: { _id: 0, user_id: 0 } })
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const template = await db.collection('templates').findOne({ slug: project.template_slug }, noId)
    return json({ project, template })
  }

  // ---- Public Album (QR anı albümü) ----
  // GET /api/public/album/:slug  -> list approved photos
  if (path[1] === 'album' && path[2] && method === 'GET') {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const enabled = project.album_enabled !== false
    const items = enabled
      ? await db.collection('album_photos').find({ project_id: project.id, status: 'approved' }, noId).sort({ created_at: -1 }).limit(200).toArray()
      : []
    return json({ enabled, items, total: items.length })
  }

  // POST /api/public/album/:slug  { uploader, photos: [dataUrl] }
  if (path[1] === 'album' && path[2] && method === 'POST') {
    const project = await db.collection('event_projects').findOne({ slug: path[2], published: true }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    if (project.album_enabled === false) return json({ error: 'Anı albümü şu anda kapalı' }, { status: 403 })
    const body = await request.json().catch(() => ({}))
    const uploader = String(body.uploader || '').trim().slice(0, 60) || 'Misafir'
    const incoming = Array.isArray(body.photos) ? body.photos : (body.photo ? [body.photo] : [])
    const valid = incoming.filter(isValidPhotoDataUrl).slice(0, 12)
    if (!valid.length) return json({ error: 'Geçerli bir fotoğraf bulunamadı (JPG/PNG/WEBP, en fazla ~3MB)' }, { status: 400 })
    const existingCount = await db.collection('album_photos').countDocuments({ project_id: project.id })
    if (existingCount >= ALBUM_PROJECT_CAP) return json({ error: 'Albüm kapasitesi doldu' }, { status: 400 })
    const allowed = valid.slice(0, Math.max(0, ALBUM_PROJECT_CAP - existingCount))
    const docs = allowed.map((data_url) => ({ id: uuidv4(), project_id: project.id, slug: project.slug, uploader_name: uploader, data_url, status: 'approved', created_at: new Date() }))
    if (docs.length) await db.collection('album_photos').insertMany(docs.map((d) => ({ ...d })))
    return json({ ok: true, uploaded: docs.length, photos: docs.map(({ data_url, ...r }) => r) }, { status: 201 })
  }

  // POST /api/public/rsvp
  if (route === '/public/rsvp' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const project = await db.collection('event_projects').findOne({ slug: String(body.slug || ''), published: true }, noId)
    if (!project) return json({ error: 'Davetiye bulunamadı' }, { status: 404 })
    const name = String(body.name || '').trim().slice(0, 100)
    if (!name) return json({ error: 'Ad soyad zorunludur' }, { status: 400 })
    if (typeof body.attending !== 'boolean') return json({ error: 'Katılım bilgisi zorunludur' }, { status: 400 })
    const email = String(body.email || '').trim().toLowerCase()
    if (email && !isValidEmail(email)) return json({ error: 'E-posta adresi geçersiz' }, { status: 400 })
    const phone = body.phone ? normalizePhone(body.phone) : null
    if (body.phone && !phone) return json({ error: 'Telefon numarası geçersiz' }, { status: 400 })
    if (!email && !phone) return json({ error: 'E-posta veya telefon gerekli' }, { status: 400 })
    const guestCount = body.attending ? Math.min(Math.max(parseInt(body.guest_count, 10) || 1, 1), 10) : 0
    const menuOptions = project.menu_options?.length ? project.menu_options : DEFAULT_MENU_OPTIONS
    const menu = body.attending && body.menu && menuOptions.includes(body.menu) ? body.menu : null

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
    for (const a of attempts) {
      const log = { id: uuidv4(), channel: a.channel, type: 'rsvp', to: a.to, guest_id: guestMatch?.id || null, guest_name: name, project_id: project.id, user_id: project.user_id, event_title: ctx.eventTitle, status: 'pending', provider: a.channel === 'email' ? 'resend' : 'twilio', provider_id: null, error: null, created_at: new Date() }
      try {
        const r = await a.fn()
        log.status = r.status || 'sent'; log.provider_id = r.id || null
      } catch (e) {
        log.status = 'failed'; log.error = e.message
      }
      await db.collection('message_logs').insertOne({ ...log })
      confirmations.push({ channel: a.channel, status: log.status })
    }

    return json({ ok: true, rsvp: { id: rsvp.id, attending: rsvp.attending, guest_count: rsvp.guest_count }, confirmations }, { status: 201 })
  }

  return null
}
