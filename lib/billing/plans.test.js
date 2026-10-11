import assert from 'node:assert/strict'
import test from 'node:test'
import { FREE_PLAN_ID, getBillingPlan, isMockPaymentEnabled } from './plans.js'
import { applySiteEntitlements } from './site-entitlements.js'

test('free entitlement limits follow the published package promise', () => {
  const free = getBillingPlan(FREE_PLAN_ID)
  assert.equal(free.grantMode, 'baseline')
  assert.equal(free.eventCredits, 0)
  assert.equal(free.entitlements.guests, 50)
  assert.equal(free.entitlements.websites, 1)
  assert.equal(free.entitlements.invitations, 1)
  assert.equal(free.entitlements.album, false)
})

test('export quota is a single counted entitlement and no extra file-type rule is enforced in code', () => {
  const premium = getBillingPlan('premium')
  const atelier = getBillingPlan('atolye')
  assert.equal(premium.entitlements.invitationExports, 1)
  assert.equal(atelier.entitlements.invitationExports, 1)
  assert.equal(premium.entitlements.printPdf, 0)
  assert.equal(atelier.entitlements.printPdf, 1)
})

test('Atelier grants three assignable event credits with per-event premium rights', () => {
  const atelier = getBillingPlan('atolye')
  assert.equal(atelier.eventCredits, 3)
  assert.equal(atelier.scope, 'account')
  assert.equal(atelier.entitlements.premiumTemplates, true)
  assert.equal(atelier.entitlements.printPdf, 1)
})

test('package cards explain account-level free access and package-specific quotas', () => {
  const free = getBillingPlan(FREE_PLAN_ID)
  const premium = getBillingPlan('premium')
  const atelier = getBillingPlan('atolye')

  assert.ok(free.features.some((feature) => feature.includes('ücretli etkinlik kredisi içermez')))
  assert.ok(premium.features.some((feature) => feature.includes('PDF hakkı Premium için tanımlı değil')))
  assert.ok(atelier.features.some((feature) => feature.includes('Etkinlik başına 1 baskıya uygun PDF hakkı')))
  assert.ok(premium.features.some((feature) => feature.includes('500 fotoğrafa kadar QR anı albümü')))
})

test('unknown package IDs cannot resolve to an entitlement', () => {
  assert.equal(getBillingPlan('unknown'), null)
})

test('mock payment is enabled only outside production', () => {
  assert.equal(isMockPaymentEnabled('development'), true)
  assert.equal(isMockPaymentEnabled('test'), true)
  assert.equal(isMockPaymentEnabled('production'), false)
})

test('free site data keeps attribution and hides advanced RSVP menu settings', () => {
  const source = {
    sections: [
      { type: 'rsvp', props: { askMenu: true } },
      { type: 'footer', props: { showCredit: false } },
    ],
  }
  const normalized = applySiteEntitlements(source, getBillingPlan('baslangic').entitlements)

  assert.equal(normalized.sections[0].props.askMenu, false)
  assert.equal(normalized.sections[1].props.showCredit, true)
  assert.equal(source.sections[0].props.askMenu, true)
  assert.equal(source.sections[1].props.showCredit, false)
})

test('paid site data retains its branding and RSVP choices', () => {
  const source = {
    sections: [
      { type: 'rsvp', props: { askMenu: true } },
      { type: 'footer', props: { showCredit: false } },
    ],
  }
  const normalized = applySiteEntitlements(source, getBillingPlan('premium').entitlements)

  assert.equal(normalized.sections[0].props.askMenu, true)
  assert.equal(normalized.sections[1].props.showCredit, false)
})
