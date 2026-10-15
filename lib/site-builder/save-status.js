/**
 * Save-state presentation rules for the website editor.
 *
 * Two different persistence modes exist and must not be confused by the user:
 *  - server-backed (`onSave` provided, e.g. project editor / VIP draft): changes only survive
 *    after the Save/Update action reaches the server.
 *  - local-only (no `onSave`): the draft lives in this browser's localStorage only.
 */

export function isSiteDirty(site, savedVersion) {
  if (!site || !savedVersion || savedVersion.id !== site.id) return false
  return site.updatedAt !== savedVersion.version
}

export function shouldWarnBeforeUnload({ serverBacked, dirty }) {
  return Boolean(serverBacked && dirty)
}

export function getSaveStatus({ serverBacked, isSaving, saveError, dirty, lastSavedAt }) {
  if (serverBacked) {
    if (isSaving) return { kind: 'saving', label: 'Kaydediliyor…', description: 'Değişiklikler sunucuya gönderiliyor.' }
    if (dirty) return { kind: 'dirty', label: 'Kaydedilmemiş değişiklikler', description: 'Değişiklikler yalnızca Kaydet/Güncelle ile sunucuya kaydedilir.' }
    return { kind: 'saved', label: 'Tüm değişiklikler kaydedildi', description: 'Sunucudaki sürüm güncel.' }
  }
  if (isSaving) return { kind: 'saving', label: 'Cihazda kaydediliyor…', description: 'Taslak bu cihazın tarayıcısına yazılıyor.' }
  if (saveError) return { kind: 'error', label: saveError, description: saveError }
  if (lastSavedAt) return { kind: 'local', label: 'Cihaz taslağı', description: 'Bu taslak yalnızca bu cihazın tarayıcısında saklanır.' }
  return { kind: 'idle', label: '', description: '' }
}
