function normalizeOrigin(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null
    return url.origin
  } catch {
    return null
  }
}

function getAllowedOrigin(request, configuredOrigins) {
  const origin = request?.headers.get('origin')
  if (!origin) return null

  const normalizedOrigin = normalizeOrigin(origin)
  if (!normalizedOrigin) return null

  const allowedOrigins = configuredOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (allowedOrigins.length === 1 && allowedOrigins[0] === '*') return '*'
  return allowedOrigins.some((allowed) => normalizeOrigin(allowed) === normalizedOrigin)
    ? normalizedOrigin
    : null
}

function addVaryOrigin(headers) {
  const vary = headers.get('Vary')
  const values = (vary || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!values.some((value) => value.toLowerCase() === 'origin')) values.push('Origin')
  headers.set('Vary', values.join(', '))
}

export function applyCors(response, request, configuredOrigins = process.env.CORS_ORIGINS || '') {
  const allowedOrigin = getAllowedOrigin(request, configuredOrigins)
  addVaryOrigin(response.headers)

  if (!allowedOrigin) {
    response.headers.delete('Access-Control-Allow-Origin')
    response.headers.delete('Access-Control-Allow-Credentials')
    response.headers.delete('Access-Control-Allow-Methods')
    response.headers.delete('Access-Control-Allow-Headers')
    return response
  }

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key')
  if (allowedOrigin === '*') {
    response.headers.delete('Access-Control-Allow-Credentials')
  } else {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}
