export function applySiteEntitlements(site, entitlements) {
  if (!site || typeof site !== 'object' || !Array.isArray(site.sections)) return site

  return {
    ...site,
    sections: site.sections.map((section) => {
      if (!section || typeof section !== 'object') return section
      const props = { ...(section.props || {}) }
      if (section.type === 'rsvp' && !entitlements.advancedRsvp) props.askMenu = false
      if (section.type === 'footer' && !entitlements.removeBranding) props.showCredit = true
      return { ...section, props }
    }),
  }
}
