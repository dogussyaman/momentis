export function isAlbumEnabledForProject(project, entitlements) {
  if (!project || project.album_enabled === false) return false

  // Preserve the pre-entitlement behavior for existing legacy projects that
  // explicitly enabled the album before creation_request_id was introduced.
  const legacyAlbum = !project.creation_request_id && project.album_enabled === true
  return Boolean(entitlements?.album || legacyAlbum)
}
