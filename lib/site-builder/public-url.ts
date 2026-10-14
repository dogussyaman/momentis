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
 * Legacy invitation templates render the album section with id="album".
 */
export function getAlbumSectionAnchor(siteData: unknown): string {
  if (siteData && typeof siteData === 'object' && Array.isArray((siteData as { sections?: unknown[] }).sections)) {
    const sections = (siteData as { sections: Array<{ id?: unknown; type?: unknown; visible?: unknown }> }).sections
    const albumSection = sections.find((section) =>
      section?.type === 'album' && section.visible === true && typeof section.id === 'string' && section.id.length > 0,
    )
    return albumSection ? `section-${albumSection.id}` : ''
  }
  return 'album'
}
