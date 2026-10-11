const READ_ROLES = new Set(['super_admin', 'admin', 'support'])
const MANAGE_ROLES = new Set(['super_admin', 'admin'])

export function isAdminRole(user) {
  return READ_ROLES.has(user?.role)
}

export function canManageSuperAdmin(user) {
  return user?.role === 'super_admin'
}

export function canReadAdmin(user) {
  return isAdminRole(user)
}

export function canManageAdmin(user) {
  return MANAGE_ROLES.has(user?.role)
}

export function getAdminAuthorizationError(user, method) {
  if (!user) return { status: 401, error: 'Oturum gerekli' }
  if (!canReadAdmin(user)) return { status: 403, error: 'Bu işlem için yönetici yetkisi gerekli' }
  if (method !== 'GET' && !canManageAdmin(user)) {
    return { status: 403, error: 'Bu işlem için admin yetkisi gerekli' }
  }
  return null
}

export function getPostLoginDestination(user, next, fallback = '/panel') {
  let requested = fallback
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    try {
      const url = new URL(next, 'https://momentis.invalid')
      if (url.origin === 'https://momentis.invalid') requested = `${url.pathname}${url.search}${url.hash}`
    } catch {
      requested = fallback
    }
  }
  if (!isAdminRole(user) && (requested === '/panel/admin' || requested.startsWith('/panel/admin/'))) {
    return '/panel'
  }
  if (isAdminRole(user) && (requested === '/panel' || requested.startsWith('/panel/'))) {
    return '/panel/admin'
  }
  return requested
}
