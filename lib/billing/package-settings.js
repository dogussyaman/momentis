import { BILLING_PLANS } from './plans.js'

const settingsCollection = 'admin_package_settings'
const noId = { projection: { _id: 0 } }

function defaultSettings(plan) {
  return {
    package_id: plan.id,
    is_active: true,
    is_public: true,
  }
}

export function resolvePackageSettings(plan, storedSettings) {
  return {
    ...defaultSettings(plan),
    ...(typeof storedSettings?.is_active === 'boolean' ? { is_active: storedSettings.is_active } : {}),
    ...(typeof storedSettings?.is_public === 'boolean' ? { is_public: storedSettings.is_public } : {}),
  }
}

export async function getPackageSettings(db, packageId) {
  const plan = BILLING_PLANS[packageId]
  if (!plan) return null
  const stored = await db.collection(settingsCollection).findOne({ package_id: packageId }, noId)
  return resolvePackageSettings(plan, stored)
}

export async function getPublicBillingPackages(db) {
  const stored = await db.collection(settingsCollection).find({}, noId).toArray()
  const byId = new Map(stored.map((item) => [item.package_id, item]))
  return Object.values(BILLING_PLANS).filter((plan) => {
    const settings = resolvePackageSettings(plan, byId.get(plan.id))
    return settings.is_active && settings.is_public
  })
}

export async function savePackageSettings(db, plan, { is_active, is_public }, actorId) {
  const current = await getPackageSettings(db, plan.id)
  const nextActive = is_active ?? current.is_active
  const nextPublic = nextActive && (is_public ?? current.is_public)
  const now = new Date()
  const next = {
    package_id: plan.id,
    is_active: nextActive,
    is_public: nextPublic,
    updated_at: now,
    updated_by: actorId,
  }

  await db.collection(settingsCollection).updateOne(
    { package_id: plan.id },
    {
      $set: { is_active: next.is_active, is_public: next.is_public, updated_at: now, updated_by: actorId },
      $setOnInsert: { package_id: plan.id, created_at: now },
    },
    { upsert: true },
  )
  return { ...next, plan_id: plan.id }
}
