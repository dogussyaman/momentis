'use client'

const CHANNEL_NAME = 'momentis:vip-selection'
const STORAGE_KEY = 'momentis:vip-selected-site'

/**
 * Sends a message to the opener / parent wizard tab to select this site,
 * then closes the current tab. If the tab cannot be closed by script,
 * it redirects the current tab to the wizard with the selected site.
 */
export function selectVipSiteAndClose(siteId = 'vip-site-1', slug = 'ozel-1') {
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

  // 2. window.opener postMessage (if window was opened with target="_blank" rel="opener")
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, '*')
    }
  } catch {
    // ignore
  }

  // 3. localStorage storage event fallback
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ siteId, slug, timestamp: Date.now() }))
  } catch {
    // ignore
  }

  // 4. Close this demo tab
  try {
    window.close()
  } catch {
    // ignore
  }

  // 5. If opened directly (no opener) and window.close was blocked, redirect gracefully
  setTimeout(() => {
    try {
      if (!window.closed && (!window.opener || window.opener.closed)) {
        window.location.href = `/tasarimlar/vip/talep/yeni?site=${encodeURIComponent(slug || siteId)}`
      }
    } catch {
      // ignore
    }
  }, 400)
}

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
