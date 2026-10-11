import nextEnv from '@next/env'
import { randomUUID } from 'node:crypto'
import { getDb } from '../lib/db.js'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

async function bootstrap() {
  const email = normalizeEmail(process.env.MOMENTIS_INITIAL_SUPER_ADMIN_EMAIL)
  const confirmation = normalizeEmail(process.env.MOMENTIS_INITIAL_SUPER_ADMIN_CONFIRM)

  if (!email || email !== confirmation) {
    throw new Error('MOMENTIS_INITIAL_SUPER_ADMIN_EMAIL ile MOMENTIS_INITIAL_SUPER_ADMIN_CONFIRM aynı e-posta olmalıdır')
  }

  const db = await getDb()
  const client = globalThis.__momentisClient
  try {
    const existingSuperAdmin = await db.collection('users').findOne({ role: 'super_admin' }, { projection: { id: 1 } })
    if (existingSuperAdmin) {
      throw new Error('Bir super_admin zaten tanımlı; bootstrap ikinci kez çalıştırılamaz')
    }

    const account = await db.collection('users').findOne({ email }, { projection: { id: 1, role: 1 } })
    if (!account) {
      throw new Error('Bu e-posta ile kayıtlı kullanıcı bulunamadı; önce bu hesapla kayıt olun')
    }

    const bootstrapState = db.collection('admin_bootstrap_state')
    try {
      await bootstrapState.insertOne({
        _id: 'initial-super-admin',
        user_id: account.id,
        created_at: new Date(),
      })
    } catch (error) {
      if (error?.code === 11000) throw new Error('İlk super_admin bootstrap işlemi daha önce kullanılmış')
      throw error
    }

    try {
      const update = await db.collection('users').updateOne(
        { id: account.id, role: { $ne: 'super_admin' } },
        { $set: { role: 'super_admin', updated_at: new Date() } },
      )
      if (!update.modifiedCount) throw new Error('Kullanıcı rolü güncellenemedi')

      await db.collection('admin_audit_logs').insertOne({
        id: randomUUID(),
        actor_user_id: null,
        action: 'admin.bootstrap.completed',
        target_type: 'user',
        target_id: account.id,
        outcome: 'success',
        created_at: new Date(),
      })
      console.log('İlk super_admin başarıyla tanımlandı.')
    } catch (error) {
      await db.collection('users').updateOne(
        { id: account.id, role: 'super_admin' },
        { $set: { role: account.role || 'user', updated_at: new Date() } },
      )
      await bootstrapState.deleteOne({ _id: 'initial-super-admin', user_id: account.id })
      throw error
    }
  } finally {
    if (client) await client.close()
  }
}

await bootstrap()
