import assert from 'node:assert/strict'
import test from 'node:test'
import { Readable, Writable } from 'node:stream'
import { handleEmailTemplateRoutes } from './email-template-routes.js'

function matches(record, query) {
  return Object.entries(query).every(([key, expected]) => record[key] === expected)
}

function createDb() {
  const records = new Map()
  const db = {
    read(name) { return records.get(name) || [] },
    collection(name) {
      const rows = records.get(name) || []
      records.set(name, rows)
      return {
        createIndex: async () => 'ok',
        findOne: async (query) => rows.find((row) => matches(row, query)) || null,
        find: () => ({ toArray: async () => rows.map((row) => ({ ...row })) }),
        updateOne: async (query, update, { upsert } = {}) => {
          let record = rows.find((row) => matches(row, query))
          if (!record && upsert) {
            record = { ...query, ...update.$setOnInsert }
            rows.push(record)
          }
          if (!record) return { matchedCount: 0, modifiedCount: 0 }
          Object.assign(record, update.$setOnInsert || {}, update.$set || {})
          return { matchedCount: 1, modifiedCount: 1 }
        },
        insertOne: async (record) => {
          rows.push({ ...record })
          return { insertedId: record.id }
        },
      }
    },
    client: {
      startSession() {
        return {
          withTransaction: async (operation) => operation({}),
          endSession: async () => {},
        }
      },
    },
  }
  return db
}

function request(path, { method = 'GET', body, origin = 'https://momentis.test' } = {}) {
  return new Request(`https://momentis.test/api${path}`, {
    method,
    headers: {
      ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

test('email template routes restrict reads and writes to persisted admin roles', async () => {
  const db = createDb()
  const anonymous = await handleEmailTemplateRoutes({
    db, route: '/admin/email-templates', method: 'GET', request: request('/admin/email-templates'), user: null,
  })
  assert.equal(anonymous.status, 401)

  const support = { id: 'support-1', role: 'support' }
  const readable = await handleEmailTemplateRoutes({
    db, route: '/admin/email-templates', method: 'GET', request: request('/admin/email-templates'), user: support,
  })
  assert.equal(readable.status, 200)
  assert.equal((await readable.json()).canManage, false)

  const denied = await handleEmailTemplateRoutes({
    db,
    route: '/admin/email-templates/accountWelcome',
    method: 'PATCH',
    request: request('/admin/email-templates/accountWelcome', {
      method: 'PATCH',
      body: { fields: { subject: 'Yeni konu' } },
    }),
    user: support,
  })
  assert.equal(denied.status, 403)
})

test('email template edits validate placeholders, save overrides, audit changes, and preview safely', async () => {
  const db = createDb()
  const fields = {
    subject: 'Hoş geldin: {{title}}',
    eyebrow: 'Kayıt tamamlandı',
    title: 'Merhaba {{title}}',
    intro: '{{message}}\nEtkinliklerini şimdi oluştur.',
    ctaLabel: 'Panele git',
    footer: 'Bu otomatik bildirimdir.',
    imageUrl: '',
    showVipShowcase: true,
  }
  const admin = { id: 'admin-1', role: 'admin' }

  const unsafe = await handleEmailTemplateRoutes({
    db,
    route: '/admin/email-templates/accountWelcome',
    method: 'PATCH',
    request: request('/admin/email-templates/accountWelcome', {
      method: 'PATCH',
      body: { fields: { ...fields, intro: '{{secret}}' } },
    }),
    user: admin,
  })
  assert.equal(unsafe.status, 400)

  const saved = await handleEmailTemplateRoutes({
    db,
    route: '/admin/email-templates/accountWelcome',
    method: 'PATCH',
    request: request('/admin/email-templates/accountWelcome', { method: 'PATCH', body: { fields } }),
    user: admin,
  })
  assert.equal(saved.status, 200)
  assert.deepEqual(db.read('admin_email_template_settings')[0].fields, fields)
  assert.equal(db.read('admin_audit_logs')[0].action, 'email_template.updated')
  assert.equal(db.read('admin_audit_logs')[0].actor_user_id, admin.id)

  const preview = await handleEmailTemplateRoutes({
    db,
    route: '/admin/email-templates/preview',
    method: 'POST',
    request: request('/admin/email-templates/preview', {
      method: 'POST',
      body: { key: 'accountWelcome', fields: { ...fields, intro: '<script>alert(1)</script>\nSatır2' } },
    }),
    user: admin,
  })
  const previewData = await preview.json()
  assert.equal(preview.status, 200)
  assert.match(previewData.preview.subject, /MOMENTIS hesabınız hazır/)
  assert.match(previewData.preview.html, /&lt;script&gt;/, 'dynamic and configured HTML content must be escaped')
  assert.match(previewData.preview.html, /&lt;\/script&gt;<br\/>Satır2/)
  assert.match(previewData.preview.html, /MOMENTIS VIP · ÖZEL TASARIMLAR/)
  assert.match(previewData.preview.html, /\/vip\/ozel-1\.png/)
  assert.match(previewData.preview.html, /\/vip\/ozel-3\.jpg/)
  assert.match(previewData.preview.html, /\/vip\/ozel-5\.jpg/)
  assert.match(previewData.preview.html, /\/logo\.png/)

  const withoutShowcase = await handleEmailTemplateRoutes({
    db,
    route: '/admin/email-templates/preview',
    method: 'POST',
    request: request('/admin/email-templates/preview', {
      method: 'POST',
      body: { key: 'accountWelcome', fields: { ...fields, showVipShowcase: false } },
    }),
    user: admin,
  })
  assert.doesNotMatch((await withoutShowcase.json()).preview.html, /MOMENTIS VIP · ÖZEL TASARIMLAR/)
})

test('email template images require admin upload, validate the image signature, and are served as public assets', async () => {
  const db = createDb()
  let storedImage
  const assetId = '0123456789abcdef01234567'
  const assetBucket = {
    openUploadStream: () => {
      const upload = new Writable({
        write(chunk, encoding, callback) {
          storedImage = Buffer.concat([storedImage || Buffer.alloc(0), chunk])
          callback()
        },
      })

      test('generic and registration drafts include VIP designs by default', async () => {
        const db = createDb()
        const response = await handleEmailTemplateRoutes({
          db,
          route: '/admin/email-templates',
          method: 'GET',
          request: request('/admin/email-templates'),
          user: { id: 'admin-1', role: 'admin' },
        })
        const { items } = await response.json()
        for (const key of ['generic', 'accountWelcome', 'adminNewRegistration']) {
          const draft = items.find((item) => item.key === key)
          assert.equal(draft.fields.showVipShowcase, true)
          assert.match(draft.preview.html, /MOMENTIS VIP · ÖZEL TASARIMLAR/)
        }
      })
      upload.id = { toString: () => assetId }
      return upload
    },
    find: () => ({
      limit() { return this },
      toArray: async () => [{
        _id: assetId,
        contentType: 'image/png',
        length: storedImage.length,
      }],
    }),
    openDownloadStream: () => Readable.from(storedImage),
  }
  const admin = { id: 'admin-1', role: 'admin' }
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])
  const form = new FormData()
  form.append('image', new Blob([pngBytes], { type: 'image/png' }), 'banner.png')
  const upload = await handleEmailTemplateRoutes({
    db,
    route: '/admin/email-templates/assets',
    method: 'POST',
    request: new Request('https://momentis.test/api/admin/email-templates/assets', {
      method: 'POST',
      headers: { Origin: 'https://momentis.test' },
      body: form,
    }),
    user: admin,
    assetBucket,
  })
  const uploadData = await upload.json()
  assert.equal(upload.status, 201)
  assert.equal(uploadData.imageUrl, `https://momentis.test/api/email-template-assets/${assetId}`)
  assert.deepEqual(storedImage, pngBytes)

  const fetched = await handleEmailTemplateRoutes({
    db,
    route: `/email-template-assets/${assetId}`,
    method: 'GET',
    request: request(`/email-template-assets/${assetId}`),
    user: null,
    assetBucket,
  })
  assert.equal(fetched.status, 200)
  assert.equal(fetched.headers.get('content-type'), 'image/png')
  assert.equal(fetched.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(Buffer.from(await fetched.arrayBuffer()), pngBytes)
})
