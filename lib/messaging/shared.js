// Shared helpers for Turkish-language guest messaging (email + SMS).

export const MESSAGE_TYPES = ['invitation', 'rsvp', 'reminder']

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]))
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

// Accepts +905xxxxxxxxx, 905xxxxxxxxx, 05xxxxxxxxx, or any international E.164 (+...).
export function toE164(value) {
  const raw = String(value || '').trim().replace(/[ ().-]/g, '')
  let number = raw
  if (number.startsWith('00')) number = `+${number.slice(2)}`
  if (number.startsWith('0') && !number.startsWith('+')) number = `+90${number.slice(1)}`
  else if (number.startsWith('90') && !number.startsWith('+') && number.length === 12) number = `+${number}`
  else if (/^5\d{9}$/.test(number)) number = `+90${number}`

  if (!/^\+[1-9]\d{7,14}$/.test(number)) {
    throw new Error('Telefon numarası geçerli değil. Örnek: +905321234567 veya 0532 123 45 67')
  }
  return number
}

export function buildContext(input = {}) {
  return {
    guestName: String(input.guestName || '').trim().slice(0, 100),
    eventTitle: String(input.eventTitle || 'Düğünümüz').trim().slice(0, 120),
    hosts: String(input.hosts || '').trim().slice(0, 120),
    eventDate: String(input.eventDate || '').trim().slice(0, 80),
    venue: String(input.venue || '').trim().slice(0, 160),
    invitationUrl: String(input.invitationUrl || '').trim().slice(0, 500),
  }
}
