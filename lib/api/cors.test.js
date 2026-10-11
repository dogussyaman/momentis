import assert from 'node:assert/strict'
import test from 'node:test'
import { applyCors } from './cors.js'

function request(origin) {
  return new Request('https://api.momentis.test/api/projects', {
    method: 'OPTIONS',
    headers: {
      ...(origin ? { Origin: origin } : {}),
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'content-type,idempotency-key',
    },
  })
}

test('CORS echoes explicitly allowed origins and preserves existing Vary values', () => {
  const response = new Response(null, { headers: { Vary: 'Accept-Encoding' } })
  applyCors(response, request('https://app.momentis.test'), 'https://app.momentis.test/')

  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://app.momentis.test')
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.equal(response.headers.get('Vary'), 'Accept-Encoding, Origin')
  assert.match(response.headers.get('Access-Control-Allow-Methods'), /\bPATCH\b/)
  assert.match(response.headers.get('Access-Control-Allow-Headers'), /\bIdempotency-Key\b/)
})

test('CORS omits access headers for untrusted origins while varying on Origin', () => {
  const response = applyCors(
    new Response(null),
    request('https://attacker.test'),
    'https://app.momentis.test',
  )

  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null)
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), null)
  assert.equal(response.headers.get('Vary'), 'Origin')
})

test('wildcard CORS is allowed only as the complete configuration and never enables credentials', () => {
  const wildcard = applyCors(new Response(null), request('https://any.test'), '*')
  const mixed = applyCors(new Response(null), request('https://any.test'), '*,https://trusted.test')

  assert.equal(wildcard.headers.get('Access-Control-Allow-Origin'), '*')
  assert.equal(wildcard.headers.get('Access-Control-Allow-Credentials'), null)
  assert.equal(mixed.headers.get('Access-Control-Allow-Origin'), null)
})

test('CORS ignores missing, opaque, and non-origin request origins', () => {
  for (const origin of [undefined, 'null', 'https://app.momentis.test/path']) {
    const response = applyCors(new Response(null), request(origin), 'https://app.momentis.test')
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
  }
})
