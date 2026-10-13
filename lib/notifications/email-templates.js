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

export function getNotificationEmailTemplate(template) {
  return Object.hasOwn(TEMPLATES, template) ? TEMPLATES[template] : TEMPLATES.generic
}

export function buildNotificationEmail(notification, baseUrl) {
  const template = getNotificationEmailTemplate(notification.email?.template)
  const href = notification.href ? new URL(notification.href, baseUrl).toString() : ''
  const title = String(notification.title || '')
  return {
    subject: notification.email?.subject || title,
    html: renderEmailLayout({
      eyebrow: template.eyebrow,
      title: escapeHtml(title),
      intro: escapeHtml(notification.message || ''),
      ctaLabel: href ? template.ctaLabel : undefined,
      ctaUrl: href || undefined,
      footer: template.footer,
    }),
  }
}

export function getNotificationEmailTemplateNames() {
  return Object.keys(TEMPLATES)
}
