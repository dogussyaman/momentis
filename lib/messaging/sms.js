import twilio from 'twilio'

let twilioClient

export function isSmsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID))
}

export function getSmsSender() {
  return process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM_NUMBER || null
}

function getTwilio() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) throw new Error('Twilio kimlik bilgileri tanımlı değil')
  if (!twilioClient) twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return twilioClient
}

export function buildSms(type, ctx) {
  const name = ctx.guestName ? ` ${ctx.guestName}` : ''
  const link = ctx.invitationUrl ? ` ${ctx.invitationUrl}` : ''
  if (type === 'rsvp') return `MOMENTIS: Tesekkurler${name}! ${ctx.eventTitle} icin katilim yanitiniz alindi.${link}`
  if (type === 'reminder') return `MOMENTIS: Hatirlatma${name}. ${ctx.eventTitle}${ctx.eventDate ? ` - ${ctx.eventDate}` : ''}${ctx.venue ? `, ${ctx.venue}` : ''}.${link}`
  return `MOMENTIS: Merhaba${name}! ${ctx.hosts ? `${ctx.hosts} sizi ` : ''}${ctx.eventTitle} icin davet ediyor.${ctx.eventDate ? ` ${ctx.eventDate}.` : ''} Davetiye:${link}`
}

export async function sendSms({ to, type, ctx }) {
  const client = getTwilio()
  const body = buildSms(type, ctx)
  const params = {
    to,
    body,
    ...(process.env.TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
      : { from: process.env.TWILIO_FROM_NUMBER }),
  }
  try {
    const message = await client.messages.create(params)
    return { id: message.sid, status: message.status, body }
  } catch (e) {
    const err = new Error(e.message || 'SMS gönderilemedi')
    err.providerCode = e.code
    err.status = 422
    throw err
  }
}
