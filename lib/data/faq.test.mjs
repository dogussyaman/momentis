import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFaqJsonLd, FAQ_CATEGORIES, FAQ_ITEMS, filterFaqItems } from './faq.ts'

test('FAQ search is Turkish-case-insensitive across question, answer, and category', () => {
  assert.ok(filterFaqItems(FAQ_ITEMS, 'all', 'IPTAL').some((item) => item.id === 'vip-refunds'))
  assert.ok(filterFaqItems(FAQ_ITEMS, 'all', 'fiyatlandirma').some((item) => item.id === 'package-differences'))
  assert.ok(filterFaqItems(FAQ_ITEMS, 'all', 'VIP tasarım').some((item) => item.id === 'vip-design'))
})

test('category and search filters are applied together', () => {
  const results = filterFaqItems(FAQ_ITEMS, 'billing', 'paket')
  assert.ok(results.length > 0)
  assert.ok(results.every((item) => item.category === 'billing'))
  assert.ok(results.every((item) => `${item.question} ${item.answer}`.toLocaleLowerCase('tr-TR').includes('paket')))
  assert.deepEqual(filterFaqItems(FAQ_ITEMS, 'design', 'eşleşmeyen ifade'), [])
})

test('FAQ categories and answers are complete and unique', () => {
  assert.equal(new Set(FAQ_CATEGORIES.map(({ id }) => id)).size, FAQ_CATEGORIES.length)
  assert.equal(new Set(FAQ_ITEMS.map(({ id }) => id)).size, FAQ_ITEMS.length)
  assert.ok(FAQ_CATEGORIES.every(({ id }) => FAQ_ITEMS.some((item) => item.category === id)))
  assert.ok(FAQ_ITEMS.every(({ question, answer }) => question.trim() && answer.trim()))
})

test('FAQPage JSON-LD exactly reflects the canonical FAQ questions and answers', () => {
  const schema = buildFaqJsonLd(FAQ_ITEMS)
  assert.equal(schema['@type'], 'FAQPage')
  assert.equal(schema.mainEntity.length, FAQ_ITEMS.length)
  assert.deepEqual(
    schema.mainEntity.map(({ name, acceptedAnswer }) => [name, acceptedAnswer.text]),
    FAQ_ITEMS.map(({ question, answer }) => [question, answer]),
  )
})
