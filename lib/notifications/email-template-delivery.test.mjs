import assert from 'node:assert/strict'
import test from 'node:test'
import { createNotification } from './service.js'

function matches(record, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = key.split('.').reduce((value, part) => value?.[part], record)
    if (expected && typeof expected === 'object' && '$in' in expected) return expected.$in.includes(actual)
    return actual === expected
  })
}

function setPath(target, path, value) {
  const parts = path.split('.')
  const last = parts.pop()
  const parent = parts.reduce((current, part) => (current[part] ||= {}), target)
  parent[last] = value
}

function createDb() {
  const collections = new Map([
    ['admin_email_template_settings', [{
      template_key: 'accountWelcome',
      fields: {
        subject: 'Hoş geldiniz: {{title}}',
        eyebrow: 'Özel kayıt etiketi',
        title: '{{title}}',
        intro: 'Düzenlenmiş mesaj: {{message}}',
        ctaLabel: 'Hesabı aç',
        footer: 'Yönetimden gönderildi.',
        imageUrl: 'https://momentis.test/api/email-template-assets/0123456789abcdef01234567',
        showVipShowcase: true,
      },
    }]],
  ])
  return {
    collection(name) {
      const records = collections.get(name) || []
      collections.set(name, records)
      return {
        createIndex: async () => 'ok',
        findOne: async (filter) => records.find((record) => matches(record, filter)) || null,
        insertOne: async (record) => {
          records.push({ ...record })
          return { insertedId: record.id }
        },
        updateOne: async (filter, update) => {
          const record = records.find((item) => matches(item, filter))
          if (!record) return { matchedCount: 0, modifiedCount: 0 }
          for (const [path, value] of Object.entries(update.$set || {})) setPath(record, path, value)
          return { matchedCount: 1, modifiedCount: 1 }
        },
      }
    },
  }
}

test('saved admin email templates are used for newly delivered notifications', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  try {
    const db = createDb()
    let sentMessage
    await createNotification(db, {
      eventId: 'account:user-1:created:user',
      recipientId: 'user-1',
      type: 'account',
      title: 'MOMENTIS hesabınız hazır',
      message: 'Etkinliklerinizi panelinizden yönetin.',
      href: '/panel',
      emailTo: 'user@example.test',
      emailTemplate: 'accountWelcome',
    }, { baseUrl: 'https://momentis.test', sendEmail: async (message) => { sentMessage = message; return { id: 'welcome-custom-1' } } })

    assert.equal(sentMessage.subject, 'Hoş geldiniz: MOMENTIS hesabınız hazır')
    assert.match(sentMessage.html, /Özel kayıt etiketi/)
    assert.match(sentMessage.html, /Düzenlenmiş mesaj: Etkinliklerinizi panelinizden yönetin\./)
    assert.match(sentMessage.html, /Hesabı aç/)
    assert.match(sentMessage.html, /<img src="https:\/\/momentis\.test\/api\/email-template-assets\/0123456789abcdef01234567"/)
    assert.match(sentMessage.html, /<img src="https:\/\/momentis\.test\/logo\.png"/)
    assert.match(sentMessage.html, /MOMENTIS VIP · ÖZEL TASARIMLAR/)
    assert.match(sentMessage.html, /Ivory Atelier/)
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})
