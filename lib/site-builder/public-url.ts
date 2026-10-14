/**
 * Builds an absolute public invitation URL on the current deployment origin.
 * QR codes and externally shared links must never contain a relative URL.
 */
export function getPublicInvitationUrl(origin: string, slug: string, anchor?: string): string {
  if (!origin || !slug) return ''
  const url = new URL(`/d/${encodeURIComponent(slug)}`, origin)
  if (anchor) url.hash = anchor
  return url.toString()
}

/**
 * SiteViewer wraps each visible section with id="section-{section.id}".
 * The legacy invitation renderer has a fixed #album anchor. A modern site
 * without a visible album section must not receive a QR that points nowhere.
 */
export function getAlbumSectionAnchor(siteData: unknown): string {
  if (siteData == null) return 'album'
  if (typeof siteData !== 'object') return 'album'

  const sections = (siteData as { sections?: unknown }).sections
  if (!Array.isArray(sections)) return ''

  const albumSection = (sections as Array<{ id?: unknown; type?: unknown; visible?: unknown }>).find((section) =>
    section?.type === 'album' && section.visible === true && typeof section.id === 'string' && section.id.length > 0,
  )
  return albumSection ? `section-${albumSection.id}` : ''
}
