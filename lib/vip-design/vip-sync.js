'use client'

const CHANNEL_NAME = 'momentis:vip-selection'
const STORAGE_KEY = 'momentis:vip-selected-site'

/**
 * Saves the selected VIP site to local/session storage, broadcasts the event,
 * and navigates back to the request wizard in the current tab.
 */
export function selectVipSiteAndReturn(siteId = 'vip-site-1', slug = 'ozel-1') {
  if (typeof window === 'undefined') return

  const payload = { type: 'SELECT_VIP_SITE', siteId, slug }

  // 1. BroadcastChannel across same-origin tabs
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage(payload)
      channel.close()
    }
  } catch {
    // ignore
  }

  // 2. window.opener postMessage if opened via window.open
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, '*')
    }
  } catch {
    // ignore
  }

  // 3. localStorage storage event
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ siteId, slug, timestamp: Date.now() }))
  } catch {
    // ignore
  }

  // 4. Update session storage draft so the wizard immediately has this site selected
  try {
    const DRAFT_KEY = 'momentis:vip-design:request-draft:v1'
    const saved = window.sessionStorage.getItem(DRAFT_KEY)
    if (saved) {
      const draft = JSON.parse(saved)
      if (draft?.form) {
        draft.form.siteId = siteId
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      }
    }
  } catch {
    // ignore
  }

  // 5. Navigate directly back to the VIP request wizard in the same tab
  window.location.href = `/tasarimlar/vip/talep/yeni?site=${encodeURIComponent(slug || siteId)}`
}

/**
 * Backward compatible alias for selectVipSiteAndReturn
 */
export const selectVipSiteAndClose = selectVipSiteAndReturn

/**
 * Subscribes to VIP site selection events across tabs.
 * Calls callback(siteId, slug) when an event is received.
 */
export function subscribeToVipSiteSelection(callback) {
  if (typeof window === 'undefined') return () => {}

  // 1. BroadcastChannel
  let channel = null
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.onmessage = (event) => {
        if (event.data?.type === 'SELECT_VIP_SITE' && event.data?.siteId) {
          callback(event.data.siteId, event.data.slug)
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. window.postMessage
  const onMessage = (event) => {
    if (event.data?.type === 'SELECT_VIP_SITE' && event.data?.siteId) {
      callback(event.data.siteId, event.data.slug)
    }
  }
  window.addEventListener('message', onMessage)

  // 3. Storage event
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue)
        if (parsed?.siteId) {
          callback(parsed.siteId, parsed.slug)
        }
      } catch {
        callback(event.newValue)
      }
    }
  }
  window.addEventListener('storage', onStorage)

  return () => {
    try {
      channel?.close()
    } catch {
      // ignore
    }
    window.removeEventListener('message', onMessage)
    window.removeEventListener('storage', onStorage)
  }
}
