import { MongoClient } from 'mongodb'
import dns from 'node:dns'

// Some local networks (common on Windows) refuse the SRV lookups that `mongodb+srv://` needs
// (`querySrv ECONNREFUSED`). Set MONGO_DNS_SERVERS="8.8.8.8,1.1.1.1" to use public resolvers instead.
function applyDnsServers() {
  const raw = process.env.MONGO_DNS_SERVERS
  if (!raw) return
  const servers = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (!servers.length) return
  try {
    dns.setServers(servers)
    dns.promises?.setServers?.(servers)
  } catch (e) {
    console.error('[db] MONGO_DNS_SERVERS uygulanamadı:', e.message)
  }
}

// Reuse a single Mongo client across hot reloads in development.
const globalForMongo = globalThis

export async function getDb() {
  if (!globalForMongo.__momentisDb) {
    if (!process.env.MONGO_URL) throw new Error('MONGO_URL tanımlı değil (.env.local dosyasını kontrol edin)')
    applyDnsServers()
    const client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 15000 })
    await client.connect()
    globalForMongo.__momentisClient = client
    globalForMongo.__momentisDb = client.db(process.env.DB_NAME)
  }
  return globalForMongo.__momentisDb
}
