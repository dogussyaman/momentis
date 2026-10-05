import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { TEMPLATES } from '@/lib/data/templates'
import { PACKAGES } from '@/lib/data/packages'
import { EVENT_TYPES, TEMPLATE_STYLES } from '@/lib/data/events'
import { MESSAGE_TYPES, isValidEmail, toE164, buildContext } from '@/lib/messaging/shared'
import { isEmailConfigured, getEmailSender, sendEmail, buildEmail } from '@/lib/messaging/email'
import { isSmsConfigured, getSmsSender, sendSms, buildSms } from '@/lib/messaging/sms'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function connectToMongo() {
  return getDb()
}

// Seed the template catalogue into Mongo on first use (idempotent by slug).
async function ensureTemplatesSeeded(db) {
  const col = db.collection('templates')
  const count = await col.countDocuments()
  if (count >= TEMPLATES.length) return
  const ops = TEMPLATES.map((t) => ({
    updateOne: { filter: { slug: t.slug }, update: { $set: { ...t, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } }, upsert: true },
  }))
  await col.bulkWrite(ops)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Health / root
    if ((route === '/' || route === '/root' || route === '/health') && method === 'GET') {
      return handleCORS(NextResponse.json({ ok: true, service: 'momentis-api', time: new Date().toISOString() }))
    }

    // GET /api/event-types
    if (route === '/event-types' && method === 'GET') {
      return handleCORS(NextResponse.json({ items: EVENT_TYPES, styles: TEMPLATE_STYLES }))
    }

    // GET /api/packages
    if (route === '/packages' && method === 'GET') {
      return handleCORS(NextResponse.json({ items: PACKAGES }))
    }

    // GET /api/templates?category=&style=&tier=&q=&limit=
    if (route === '/templates' && method === 'GET') {
      await ensureTemplatesSeeded(db)
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const style = url.searchParams.get('style')
      const tier = url.searchParams.get('tier')
      const q = (url.searchParams.get('q') || '').trim()
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 100)

      const filter = {}
      if (category && category !== 'all') filter.category = category
      if (style && style !== 'all') filter.style = style
      if (tier && tier !== 'all') filter.tier = tier
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        filter.$or = [{ name: rx }, { tagline: rx }, { description: rx }, { tags: rx }]
      }

      const items = await db.collection('templates')
        .find(filter, { projection: { _id: 0 } })
        .sort({ popularity: -1 })
        .limit(limit)
        .toArray()

      return handleCORS(NextResponse.json({ items, total: items.length }))
    }

    // GET /api/templates/:slug
    if (path[0] === 'templates' && path.length === 2 && method === 'GET') {
      await ensureTemplatesSeeded(db)
      const item = await db.collection('templates').findOne({ slug: path[1] }, { projection: { _id: 0 } })
      if (!item) {
        return handleCORS(NextResponse.json({ error: 'Tasarım bulunamadı' }, { status: 404 }))
      }
      return handleCORS(NextResponse.json(item))
    }

    // POST /api/leads  { email, source }
    if (route === '/leads' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = String(body.email || '').trim().toLowerCase()
      if (!EMAIL_RE.test(email)) {
        return handleCORS(NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 }))
      }
      const existing = await db.collection('leads').findOne({ email })
      if (existing) {
        return handleCORS(NextResponse.json({ ok: true, duplicate: true }))
      }
      const lead = { id: uuidv4(), email, source: String(body.source || 'website').slice(0, 50), created_at: new Date() }
      await db.collection('leads').insertOne(lead)
      const { _id, ...clean } = lead
      return handleCORS(NextResponse.json({ ok: true, lead: clean }, { status: 201 }))
    }

    // ---------------- Messaging (Resend e-posta + Twilio SMS) ----------------

    // GET /api/messaging/status
    if (route === '/messaging/status' && method === 'GET') {
      return handleCORS(NextResponse.json({
        email: { configured: isEmailConfigured(), sender: isEmailConfigured() ? getEmailSender() : null, provider: 'resend' },
        sms: { configured: isSmsConfigured(), sender: isSmsConfigured() ? getSmsSender() : null, provider: 'twilio' },
        types: MESSAGE_TYPES,
      }))
    }

    // POST /api/messaging/preview  { channel, type, ...ctx }
    if (route === '/messaging/preview' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const type = MESSAGE_TYPES.includes(body.type) ? body.type : 'invitation'
      const ctx = buildContext(body)
      if (body.channel === 'sms') {
        return handleCORS(NextResponse.json({ channel: 'sms', body: buildSms(type, ctx) }))
      }
      const { subject, html } = buildEmail(type, ctx)
      return handleCORS(NextResponse.json({ channel: 'email', subject, html }))
    }

    // GET /api/messaging/logs?limit=20&channel=
    if (route === '/messaging/logs' && method === 'GET') {
      const url = new URL(request.url)
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100)
      const channel = url.searchParams.get('channel')
      const filter = channel && channel !== 'all' ? { channel } : {}
      const items = await db.collection('message_logs')
        .find(filter, { projection: { _id: 0 } })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray()
      return handleCORS(NextResponse.json({ items }))
    }

    // POST /api/messaging/send  { channel: 'email'|'sms', type, to, guestName, eventTitle, hosts, eventDate, venue, invitationUrl }
    if (route === '/messaging/send' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const channel = body.channel === 'sms' ? 'sms' : body.channel === 'email' ? 'email' : null
      if (!channel) {
        return handleCORS(NextResponse.json({ error: "channel 'email' veya 'sms' olmalı" }, { status: 400 }))
      }
      if (!MESSAGE_TYPES.includes(body.type)) {
        return handleCORS(NextResponse.json({ error: `type şunlardan biri olmalı: ${MESSAGE_TYPES.join(', ')}` }, { status: 400 }))
      }
      const ctx = buildContext(body)
      if (body.type !== 'rsvp' && !ctx.invitationUrl) {
        return handleCORS(NextResponse.json({ error: 'invitationUrl zorunludur' }, { status: 400 }))
      }

      let destination
      if (channel === 'email') {
        if (!isEmailConfigured()) {
          return handleCORS(NextResponse.json({ error: 'E-posta servisi yapılandırılmamış (RESEND_API_KEY eksik)' }, { status: 503 }))
        }
        destination = String(body.to || '').trim().toLowerCase()
        if (!isValidEmail(destination)) {
          return handleCORS(NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 }))
        }
      } else {
        if (!isSmsConfigured()) {
          return handleCORS(NextResponse.json({ error: 'SMS servisi yapılandırılmamış (Twilio kimlik bilgileri eksik)' }, { status: 503 }))
        }
        try {
          destination = toE164(body.to)
        } catch (e) {
          return handleCORS(NextResponse.json({ error: e.message }, { status: 400 }))
        }
      }

      const log = {
        id: uuidv4(),
        channel,
        type: body.type,
        to: destination,
        guest_name: ctx.guestName || null,
        event_title: ctx.eventTitle,
        project_id: body.projectId || null,
        status: 'pending',
        provider: channel === 'email' ? 'resend' : 'twilio',
        provider_id: null,
        error: null,
        created_at: new Date(),
      }

      try {
        const result = channel === 'email'
          ? await sendEmail({ to: destination, type: body.type, ctx })
          : await sendSms({ to: destination, type: body.type, ctx })
        log.status = result.status || 'sent'
        log.provider_id = result.id || null
        log.subject = result.subject || null
        await db.collection('message_logs').insertOne({ ...log })
        const { _id, ...clean } = log
        return handleCORS(NextResponse.json({ ok: true, message: clean }, { status: 201 }))
      } catch (e) {
        log.status = 'failed'
        log.error = e.message
        log.provider_code = e.providerCode || e.providerName || null
        await db.collection('message_logs').insertOne({ ...log })
        console.error(`[messaging:${channel}] send failed`, { to: destination, error: e.message })
        const { _id, ...clean } = log
        return handleCORS(NextResponse.json({ ok: false, error: e.message, message: clean }, { status: e.status || 422 }))
      }
    }

    // Legacy status endpoints kept for compatibility
    if (route === '/status' && method === 'POST') {
      const body = await request.json()
      
      if (!body.client_name) {
        return handleCORS(NextResponse.json(
          { error: "client_name is required" }, 
          { status: 400 }
        ))
      }

      const statusObj = {
        id: uuidv4(),
        client_name: body.client_name,
        timestamp: new Date()
      }

      await db.collection('status_checks').insertOne(statusObj)
      return handleCORS(NextResponse.json(statusObj))
    }

    // Status endpoints - GET /api/status
    if (route === '/status' && method === 'GET') {
      const statusChecks = await db.collection('status_checks')
        .find({})
        .limit(1000)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedStatusChecks = statusChecks.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedStatusChecks))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute