import { escapeHtml } from '../messaging/shared.js'
import { renderEmailLayout } from '../messaging/email.js'

const TEMPLATES = {
  generic: {
    eyebrow: 'MOMENTIS · Hesap bildirimi',
    ctaLabel: 'Panelde görüntüle',
    footer: 'Bu e-posta MOMENTIS hesabınızdaki önemli bir işlem hakkında bilgilendirme amacıyla gönderildi.',
  },
  accountWelcome: {
    eyebrow: 'MOMENTIS · Hoş geldiniz',
    ctaLabel: 'Etkinlik stüdyosuna git',
    footer: 'MOMENTIS hesabınızı oluşturduğunuz için teşekkür ederiz.',
  },
  adminNewRegistration: {
    eyebrow: 'MOMENTIS · Yeni hesap',
    ctaLabel: 'Yönetim panelini aç',
    footer: 'Yeni hesap kaydı tamamlandı. Bu e-posta yönetim bilgilendirmesidir.',
  },
  vipRequestCustomer: {
    eyebrow: 'MOMENTIS · VIP tasarım talebi',
    ctaLabel: 'Talebimi takip et',
    footer: 'Talebiniz özel tasarım hizmetinin satın alındığı veya otomatik olarak başlatıldığı anlamına gelmez.',
  },
  vipRequestAdmin: {
    eyebrow: 'MOMENTIS · Yeni VIP talebi',
    ctaLabel: 'Talebi yönet',
    footer: 'Yeni bir VIP talebi yönetim incelemesi bekliyor.',
  },
  vipStatusCustomer: {
    eyebrow: 'MOMENTIS · VIP talep güncellemesi',
    ctaLabel: 'Talebimin durumunu gör',
    footer: 'Talebinizin güncel aşamasını MOMENTIS panelinizden takip edebilirsiniz.',
  },
  vipStatusAdmin: {
    eyebrow: 'MOMENTIS · VIP talep aşaması',
    ctaLabel: 'Talep geçmişini gör',
    footer: 'Bu aşama değişikliği uygulama içi yönetim bildiriminde ve denetim kaydında da bulunur.',
  },
  projectCreatedCustomer: {
    eyebrow: 'MOMENTIS · Yeni etkinlik',
    ctaLabel: 'Etkinliğimi düzenle',
    footer: 'Etkinlik ve paket bilgilerinizi MOMENTIS panelinizden yönetebilirsiniz.',
  },
  projectCreatedAdmin: {
    eyebrow: 'MOMENTIS · Yeni etkinlik projesi',
    ctaLabel: 'Yönetim panelini aç',
    footer: 'Yeni etkinlik projesi oluşturuldu.',
  },
  projectDeliverablesCustomer: {
    eyebrow: 'MOMENTIS · Tasarımınız hazır',
    ctaLabel: 'Tasarımımı aç',
    footer: 'Site ve davetiye ayarlarınızı etkinlik düzenleyicisinden yönetebilirsiniz.',
  },
  projectDeliverablesAdmin: {
    eyebrow: 'MOMENTIS · Yeni site veya davetiye',
    ctaLabel: 'Yönetim panelini aç',
    footer: 'Bir etkinlik projesinde yeni bir site veya davetiye çıktısı etkinleştirildi.',
  },
  projectPublishedCustomer: {
    eyebrow: 'MOMENTIS · Yayın durumu',
    ctaLabel: 'Etkinliğimi görüntüle',
    footer: 'Yayın durumunuzu etkinlik panelinizden istediğiniz zaman yönetebilirsiniz.',
  },
  projectPublishedAdmin: {
    eyebrow: 'MOMENTIS · Etkinlik yayın durumu',
    ctaLabel: 'Yönetim panelini aç',
    footer: 'Etkinlik projesinin yayın durumu değişti.',
  },
  packageActivatedCustomer: {
    eyebrow: 'MOMENTIS · Paketiniz etkin',
    ctaLabel: 'Paket ve kredilerimi gör',
    footer: 'Krediler ve paket hakları mevcut MOMENTIS paket koşullarına tabidir.',
  },
  packageActivatedAdmin: {
    eyebrow: 'MOMENTIS · Paket etkinleştirildi',
    ctaLabel: 'Yönetim panelini aç',
    footer: 'Paket etkinleştirme ve kredi tanımı tamamlandı.',
  },
  adminCreditGranted: {
    eyebrow: 'MOMENTIS · Kredi bilgisi',
    ctaLabel: 'Paket ve kredilerimi gör',
    footer: 'Kredi hareketlerinizi MOMENTIS panelinizden inceleyebilirsiniz.',
  },
  adminCreditRevoked: {
    eyebrow: 'MOMENTIS · Kredi bilgisi',
    ctaLabel: 'Paket bilgilerimi gör',
    footer: 'Bu bilgilendirme, kullanılmamış admin tarafından tanımlanmış kredi hakkıyla ilgilidir.',
  },
}

const TEMPLATE_LABELS = {
  generic: { label: 'Genel bildirim', audience: 'Kullanıcı / yönetim' },
  accountWelcome: { label: 'Hesap oluşturuldu', audience: 'Kullanıcı' },
  adminNewRegistration: { label: 'Yeni kullanıcı kaydı', audience: 'Yönetim' },
  vipRequestCustomer: { label: 'VIP talebi alındı', audience: 'Kullanıcı' },
  vipRequestAdmin: { label: 'Yeni VIP talebi', audience: 'Yönetim' },
  vipStatusCustomer: { label: 'VIP talep durumu', audience: 'Kullanıcı' },
  vipStatusAdmin: { label: 'VIP aşama değişikliği', audience: 'Yönetim' },
  projectCreatedCustomer: { label: 'Yeni etkinlik oluşturuldu', audience: 'Kullanıcı' },
  projectCreatedAdmin: { label: 'Yeni etkinlik projesi', audience: 'Yönetim' },
  projectDeliverablesCustomer: { label: 'Tasarım çıktısı hazır', audience: 'Kullanıcı' },
  projectDeliverablesAdmin: { label: 'Yeni site veya davetiye', audience: 'Yönetim' },
  projectPublishedCustomer: { label: 'Etkinlik yayın durumu', audience: 'Kullanıcı' },
  projectPublishedAdmin: { label: 'Etkinlik yayın bildirimi', audience: 'Yönetim' },
  packageActivatedCustomer: { label: 'Paket etkinleştirildi', audience: 'Kullanıcı' },
  packageActivatedAdmin: { label: 'Paket etkinleştirme', audience: 'Yönetim' },
  adminCreditGranted: { label: 'Kredi eklendi', audience: 'Kullanıcı' },
  adminCreditRevoked: { label: 'Kredi geri alındı', audience: 'Kullanıcı' },
}

const TEMPLATE_FIELDS = ['subject', 'eyebrow', 'title', 'intro', 'ctaLabel', 'footer', 'imageUrl', 'showVipShowcase']
const VIP_SHOWCASE = [
  { image: '/vip/ozel-1.png', alt: 'Ivory Atelier VIP site tasarımı', title: 'Ivory Atelier', background: '#f5efe3', foreground: '#463d32', accent: '#b18d58' },
  { image: '/vip/ozel-3.jpg', alt: 'Blush Garden VIP site tasarımı', title: 'Blush Garden', background: '#f9e9e6', foreground: '#573f43', accent: '#bb8583' },
  { image: '/vip/ozel-5.jpg', alt: 'Botanical Sage VIP site tasarımı', title: 'Botanical Sage', background: '#e9eee4', foreground: '#354239', accent: '#82947a' },
]
const PREVIEW_NOTIFICATION = {
  title: 'MOMENTIS hesabınız hazır',
  message: 'Etkinliklerinizi, paket bilgilerinizi ve bildirimlerinizi panelinizden yönetebilirsiniz.',
  href: '/panel',
  email: { subject: 'MOMENTIS hesabınız hazır' },
}

function defaultFields(template) {
  return {
    subject: '{{subject}}',
    eyebrow: template.eyebrow,
    title: '{{title}}',
    intro: '{{message}}',
    ctaLabel: template.ctaLabel,
    footer: template.footer,
    imageUrl: '',
    showVipShowcase: true,
  }
}

function applyTokens(value, notification) {
  return String(value)
    .replaceAll('{{subject}}', String(notification.email?.subject || notification.title || ''))
    .replaceAll('{{title}}', String(notification.title || ''))
    .replaceAll('{{message}}', String(notification.message || ''))
}

export function getNotificationEmailTemplate(template, override = null) {
  const base = Object.hasOwn(TEMPLATES, template) ? TEMPLATES[template] : TEMPLATES.generic
  return { ...defaultFields(base), ...(override || {}) }
}

export function buildNotificationEmail(notification, baseUrl, override = null) {
  const template = getNotificationEmailTemplate(notification.email?.template, override)
  const href = notification.href ? new URL(notification.href, baseUrl).toString() : ''
  const showcaseCards = template.showVipShowcase
    ? VIP_SHOWCASE.map((card) => ({ ...card, image: new URL(card.image, baseUrl).toString() }))
    : []
  return {
    subject: applyTokens(template.subject, notification).replace(/[\r\n]+/g, ' ').trim(),
    html: renderEmailLayout({
      eyebrow: applyTokens(template.eyebrow, notification),
      title: escapeHtml(applyTokens(template.title, notification)),
      intro: escapeHtml(applyTokens(template.intro, notification)).replace(/\n/g, '<br/>'),
      imageUrl: template.imageUrl,
      logoUrl: new URL('/logo.png', baseUrl).toString(),
      showcaseCards,
      ctaLabel: href ? applyTokens(template.ctaLabel, notification) : undefined,
      ctaUrl: href || undefined,
      footer: escapeHtml(applyTokens(template.footer, notification)),
    }),
  }
}

export function getNotificationEmailTemplateNames() {
  return Object.keys(TEMPLATES)
}

export function getNotificationEmailTemplateFields() {
  return [...TEMPLATE_FIELDS]
}

export async function listNotificationEmailTemplates(db, baseUrl = 'https://momentis.example') {
  const overrides = await db.collection('admin_email_template_settings')
    .find({}, { projection: { _id: 0 } })
    .toArray()
  const overrideByKey = new Map(overrides.map((item) => [item.template_key, item.fields]))
  return getNotificationEmailTemplateNames().map((key) => {
    const config = getNotificationEmailTemplate(key, overrideByKey.get(key))
    const preview = buildNotificationEmail({
      ...PREVIEW_NOTIFICATION,
      title: key === 'adminNewRegistration' ? 'Yeni kullanıcı kaydı' : PREVIEW_NOTIFICATION.title,
      email: { ...PREVIEW_NOTIFICATION.email, template: key },
    }, baseUrl, config)
    return {
      key,
      ...TEMPLATE_LABELS[key],
      fields: config,
      preview: { subject: preview.subject, html: preview.html },
      updatedAt: overrides.find((item) => item.template_key === key)?.updated_at || null,
    }
  })
}

export function buildNotificationEmailPreview(template, fields, baseUrl = 'https://momentis.example') {
  const label = TEMPLATE_LABELS[template]
  if (!label) return null
  const preview = buildNotificationEmail({
    ...PREVIEW_NOTIFICATION,
    title: template === 'adminNewRegistration' ? 'Yeni kullanıcı kaydı' : PREVIEW_NOTIFICATION.title,
    email: { ...PREVIEW_NOTIFICATION.email, template },
  }, baseUrl, fields)
  return { subject: preview.subject, html: preview.html }
}
