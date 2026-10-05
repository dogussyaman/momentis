import { Resend } from 'resend'
import { escapeHtml } from './shared'

let resendClient

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export function getEmailSender() {
  return process.env.RESEND_FROM_EMAIL || 'MOMENTIS <onboarding@resend.dev>'
}

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY tanımlı değil')
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

function layout({ eyebrow, title, intro, details = [], ctaLabel, ctaUrl, footer }) {
  const detailRows = details
    .filter((d) => d.value)
    .map((d) => `<tr><td style="padding:6px 0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#A8884E;width:120px;">${escapeHtml(d.label)}</td><td style="padding:6px 0;font-size:15px;color:#101827;">${escapeHtml(d.value)}</td></tr>`)
    .join('')
  const cta = ctaUrl
    ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;margin-top:28px;padding:14px 28px;background:#C9A96E;color:#101827;text-decoration:none;font-size:12px;letter-spacing:.2em;text-transform:uppercase;">${escapeHtml(ctaLabel || 'Davetiyeyi Aç')}</a>`
    : ''
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#F8F4EC;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#101827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F4EC;padding:40px 16px;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDFBF7;border:1px solid #E4DAC8;">
      <tr><td style="padding:28px 40px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;letter-spacing:.3em;text-transform:uppercase;color:#101827;">• Momentis</td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#A8884E;">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.15;color:#101827;">${title}</h1>
        <p style="margin:20px 0 0;font-size:16px;line-height:1.7;color:#4B4A46;">${intro}</p>
        ${detailRows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #E4DAC8;border-bottom:1px solid #E4DAC8;padding:8px 0;width:100%;">${detailRows}</table>` : ''}
        ${cta}
      </td></tr>
      <tr><td style="padding:36px 40px 32px;font-size:12px;line-height:1.6;color:#8B8577;">${footer || 'Bu e-posta MOMENTIS aracılığıyla gönderildi.'}</td></tr>
    </table>
  </td></tr></table></body></html>`
}

export function buildEmail(type, ctx) {
  const name = ctx.guestName ? escapeHtml(ctx.guestName) : 'Sevgili Misafirimiz'
  const title = escapeHtml(ctx.eventTitle)
  const hosts = ctx.hosts ? escapeHtml(ctx.hosts) : ''
  const details = [
    { label: 'Tarih', value: ctx.eventDate },
    { label: 'Mekân', value: ctx.venue },
  ]

  if (type === 'rsvp') {
    return {
      subject: `Katılım onayınız alındı — ${ctx.eventTitle}`,
      html: layout({
        eyebrow: 'RSVP Onayı',
        title: `Teşekkürler, ${name}.`,
        intro: `<strong>${title}</strong> için katılım yanıtınız başarıyla kaydedildi.${hosts ? ` ${hosts} sizi aralarında görmekten mutluluk duyacak.` : ''}`,
        details, ctaLabel: 'Davetiyeyi Görüntüle', ctaUrl: ctx.invitationUrl,
      }),
    }
  }
  if (type === 'reminder') {
    return {
      subject: `Hatırlatma: ${ctx.eventTitle}${ctx.eventDate ? ` — ${ctx.eventDate}` : ''}`,
      html: layout({
        eyebrow: 'Nazik Bir Hatırlatma',
        title: `${name}, gün yaklaşıyor.`,
        intro: `<strong>${title}</strong> için hazırlıklar tamamlanıyor. Program, konum ve ulaşım bilgileri davetiyede sizi bekliyor.`,
        details, ctaLabel: 'Detayları Gör', ctaUrl: ctx.invitationUrl,
      }),
    }
  }
  return {
    subject: `${hosts ? `${ctx.hosts} — ` : ''}${ctx.eventTitle} davetiyeniz`,
    html: layout({
      eyebrow: 'Davetlisiniz',
      title: `${name},<br/>sizi aramızda görmek istiyoruz.`,
      intro: `${hosts ? `<strong>${hosts}</strong>, ` : ''}<strong>${title}</strong> için sizi davet ediyor. Davetiyeyi açarak detayları görebilir ve katılımınızı bildirebilirsiniz.`,
      details, ctaLabel: 'Davetiyeyi Aç', ctaUrl: ctx.invitationUrl,
    }),
  }
}

export async function sendEmail({ to, type, ctx }) {
  const resend = getResend()
  const { subject, html } = buildEmail(type, ctx)
  return sendRawEmail({ to, subject, html, tag: type })
}

export function renderEmailLayout(opts) {
  return layout(opts)
}

export async function sendRawEmail({ to, subject, html, tag = 'transactional' }) {
  const resend = getResend()
  const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const { data, error } = await resend.emails.send({
    from: getEmailSender(),
    to: [to],
    subject,
    html,
    text,
    tags: [{ name: 'flow', value: tag }],
  })
  if (error) {
    const err = new Error(error.message || 'E-posta sağlayıcısı mesajı reddetti')
    err.providerName = error.name
    err.status = 422
    throw err
  }
  return { id: data?.id, status: 'sent', subject }
}
