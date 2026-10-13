export async function getPublishedVipSite(db, slug) {
  const request = await db.collection('vip_design_requests').findOne({
    'site_draft.slug': slug,
    'site_draft.status': 'published',
  }, { projection: { _id: 0 } })
  if (!request?.site_draft?.site_data) return null
  const site = { ...request.site_draft.site_data }
  delete site.userId
  return site
}
