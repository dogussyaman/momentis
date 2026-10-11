const settingsCollection = 'admin_template_tier_settings'

export async function getTemplateTier(db, type, templateKey, fallbackTier = 'free') {
  const settings = await db.collection(settingsCollection).findOne(
    { type, template_key: templateKey },
    { projection: { _id: 0, tier: 1 } },
  )
  return settings?.tier || fallbackTier
}

export async function getTemplateAvailability(db, type, templateKey) {
  const settings = await db.collection(settingsCollection).findOne(
    { type, template_key: templateKey },
    { projection: { _id: 0, active: 1 } },
  )
  return settings?.active !== false
}

export async function getTemplateTierOverrides(db) {
  return db.collection(settingsCollection).find({}, { projection: { _id: 0 } }).toArray()
}

export async function saveTemplateTier(db, { type, templateKey, tier, actorId }) {
  const now = new Date()
  await db.collection(settingsCollection).updateOne(
    { type, template_key: templateKey },
    {
      $set: { tier, updated_at: now, updated_by: actorId },
      $setOnInsert: { type, template_key: templateKey, created_at: now },
    },
    { upsert: true },
  )
  return { type, template_key: templateKey, tier, updated_at: now, updated_by: actorId }
}

export async function saveTemplateAvailability(db, { type, templateKey, active, actorId }) {
  const now = new Date()
  await db.collection(settingsCollection).updateOne(
    { type, template_key: templateKey },
    {
      $set: { active, updated_at: now, updated_by: actorId },
      $setOnInsert: { type, template_key: templateKey, created_at: now },
    },
    { upsert: true },
  )
  return { type, template_key: templateKey, active, updated_at: now, updated_by: actorId }
}
