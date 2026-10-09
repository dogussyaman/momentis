import { v4 as uuidv4 } from 'uuid'

const TR_MAP = { ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u' }

export function slugify(text) {
  return String(text || '')
    .split('').map((c) => TR_MAP[c] ?? c).join('')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function uniqueSlug(db, base, excludeId = null) {
  let slug = slugify(base) || 'davetiye'
  let candidate = slug
  let i = 2
  while (await db.collection('event_projects').findOne({ slug: candidate, ...(excludeId ? { id: { $ne: excludeId } } : {}) })) {
    candidate = `${slug}-${i++}`
  }
  return candidate
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const HERO_IMAGE_DATA_RE = /^data:image\/(?:jpeg|png|webp);base64,/i

function normalizeHeroImage(input) {
  const value = String(input || '').trim()
  if (/^https:\/\//i.test(value) && value.length <= 2000) return value
  if (HERO_IMAGE_DATA_RE.test(value) && value.length <= 1_500_000) return value
  return null
}

// Optional per-project colour override of the template palette.
export function normalizePalette(input) {
  if (!input || typeof input !== 'object') return null
  const keys = ['bg', 'accent', 'text', 'muted']
  const out = {}
  for (const k of keys) {
    if (HEX_RE.test(String(input[k] || ''))) out[k] = String(input[k]).toUpperCase()
  }
  return Object.keys(out).length === 4 ? out : null
}

export const DEFAULT_MENU_OPTIONS = ['Et', 'Balık', 'Vejetaryen']

// Convert any Spotify share URL or URI into an embeddable player URL.
export function spotifyEmbedUrl(input) {
  const s = String(input || '').trim()
  if (!s) return null
  // spotify:playlist:ID
  const uri = s.match(/^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]+)/)
  if (uri) return `https://open.spotify.com/embed/${uri[1]}/${uri[2]}?utm_source=generator`
  // https://open.spotify.com/(intl-xx/)?playlist/ID
  const url = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/)
  if (url) return `https://open.spotify.com/embed/${url[1]}/${url[2]}?utm_source=generator`
  return null
}

export function formatEventDate(date, time) {
  if (!date) return ''
  try {
    const d = new Date(`${date}T${time || '12:00'}:00`)
    const formatted = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(d)
    return time ? `${formatted}, ${time}` : formatted
  } catch {
    return date
  }
}

export function invitationUrl(slug) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  return `${base}/d/${slug}`
}

export function buildProjectDoc(userId, body, slug) {
  const now = new Date()
  const program = Array.isArray(body.program)
    ? body.program.filter((p) => p && (p.title || p.time)).slice(0, 12).map((p) => ({ time: String(p.time || '').slice(0, 10), title: String(p.title || '').slice(0, 80) }))
    : []
  const menu = Array.isArray(body.menu_options) && body.menu_options.length
    ? body.menu_options.map((m) => String(m).trim().slice(0, 40)).filter(Boolean).slice(0, 8)
    : DEFAULT_MENU_OPTIONS
  return {
    id: uuidv4(),
    user_id: userId,
    slug,
    title: String(body.title || '').trim().slice(0, 120),
    event_type: String(body.event_type || 'dugun'),
    template_slug: String(body.template_slug || 'aurelia'),
    card_template: String(body.card_template || 'Klasik Altın').slice(0, 60),
    card_layout: ['classic', 'editorial', 'modern', 'minimal'].includes(body.card_layout) ? body.card_layout : 'classic',
    card_message: String(body.card_message || '').trim().slice(0, 220),
    card_theme: Number.isInteger(Number(body.card_theme)) && Number(body.card_theme) >= 0 && Number(body.card_theme) <= 7
      ? Number(body.card_theme)
      : null,
    host_a: String(body.host_a || '').trim().slice(0, 60),
    host_b: String(body.host_b || '').trim().slice(0, 60),
    bride_mother: String(body.bride_mother || '').trim().slice(0, 60),
    bride_father: String(body.bride_father || '').trim().slice(0, 60),
    groom_mother: String(body.groom_mother || '').trim().slice(0, 60),
    groom_father: String(body.groom_father || '').trim().slice(0, 60),
    date: String(body.date || '').slice(0, 10),
    time: String(body.time || '').slice(0, 5),
    venue: String(body.venue || '').trim().slice(0, 120),
    address: String(body.address || '').trim().slice(0, 240),
    city: String(body.city || '').trim().slice(0, 60),
    story: String(body.story || '').trim().slice(0, 1200),
    dress_code: String(body.dress_code || '').trim().slice(0, 80),
    program,
    menu_options: menu,
    rsvp_deadline: String(body.rsvp_deadline || '').slice(0, 10),
    palette: normalizePalette(body.palette),
    website_font: ['playfair', 'dm-sans', 'georgia'].includes(body.website_font) ? body.website_font : 'playfair',
    hero_image: normalizeHeroImage(body.hero_image),
    hero_image_opacity: Number.isFinite(Number(body.hero_image_opacity)) ? Math.min(100, Math.max(0, Math.round(Number(body.hero_image_opacity)))) : 52,
    qr_enabled: body.qr_enabled === undefined ? true : Boolean(body.qr_enabled),
    qr_message: String(body.qr_message || 'Bu QR kodunu paylaşarak davet sayfasına hızlıca ulaşabilirsiniz.').trim().slice(0, 240),
    album_enabled: Boolean(body.album_enabled),
    spotify_url: String(body.spotify_url || '').trim().slice(0, 300),
    gift_enabled: Boolean(body.gift_enabled),
    gift_message: String(body.gift_message || '').trim().slice(0, 400),
    gift_iban: String(body.gift_iban || '').trim().slice(0, 40).toUpperCase(),
    gift_account_name: String(body.gift_account_name || '').trim().slice(0, 80),
    gift_url: String(body.gift_url || '').trim().slice(0, 300),
    published: Boolean(body.published ?? false),
    archived: Boolean(body.archived),
    site_data: body.site_data ? { ...body.site_data, slug } : null,
    canvas_design: body.canvas_design || null,
    event_data: body.event_data || null,
    deliverables: body.deliverables || null,
    created_at: now,
    updated_at: now,
  }
}

export const PROJECT_EDITABLE_FIELDS = ['palette', 'website_font', 'hero_image', 'hero_image_opacity', 'qr_enabled', 'qr_message', 'card_template', 'card_theme', 'card_layout', 'card_message', 'title', 'event_type', 'template_slug', 'host_a', 'host_b', 'bride_mother', 'bride_father', 'groom_mother', 'groom_father', 'date', 'time', 'venue', 'address', 'city', 'story', 'dress_code', 'program', 'menu_options', 'rsvp_deadline', 'album_enabled', 'spotify_url', 'gift_enabled', 'gift_message', 'gift_iban', 'gift_account_name', 'gift_url', 'published', 'canvas_design', 'site_data', 'event_data', 'deliverables']
