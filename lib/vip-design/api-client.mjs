export async function fetchVipApi(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error || 'VIP işlemi tamamlanamadı.')
  return result
}
