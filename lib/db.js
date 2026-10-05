import { MongoClient } from 'mongodb'

// Reuse a single Mongo client across hot reloads in development.
const globalForMongo = globalThis

export async function getDb() {
  if (!globalForMongo.__momentisDb) {
    const client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    globalForMongo.__momentisClient = client
    globalForMongo.__momentisDb = client.db(process.env.DB_NAME)
  }
  return globalForMongo.__momentisDb
}
