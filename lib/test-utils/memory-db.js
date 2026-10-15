// Test-only in-memory MongoDB double. Each collection method body is synchronous, so a single
// operation is atomic like a single-document Mongo operation, while `await` boundaries between
// operations interleave under Promise.all exactly like concurrent requests would.

const clone = (value) => {
  if (value instanceof Date) return new Date(value.getTime())
  if (Array.isArray(value)) return value.map(clone)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]))
  return value
}

const getPath = (doc, path) => path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), doc)

function setPath(doc, path, value) {
  const keys = path.split('.')
  let target = doc
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null || typeof target[key] !== 'object') target[key] = {}
    target = target[key]
  }
  target[keys.at(-1)] = value
}

function unsetPath(doc, path) {
  const keys = path.split('.')
  let target = doc
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null) return
    target = target[key]
  }
  delete target[keys.at(-1)]
}

function equal(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (b === null) return a === null || a === undefined
  if (a && b && typeof a === 'object' && typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b)
  return a === b
}

const eqOrContains = (actual, expected) =>
  Array.isArray(actual) ? actual.some((item) => equal(item, expected)) || equal(actual, expected) : equal(actual, expected)

const isOperatorObject = (value) =>
  value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) &&
  Object.keys(value).some((key) => key.startsWith('$'))

function typeMatches(value, type) {
  if (type === 'string') return typeof value === 'string'
  if (type === 'number') return typeof value === 'number'
  if (type === 'date') return value instanceof Date
  return false
}

function matchField(actual, condition) {
  if (!isOperatorObject(condition)) return eqOrContains(actual, condition)
  return Object.entries(condition).every(([op, expected]) => {
    switch (op) {
      case '$in': return expected.some((item) => eqOrContains(actual, item))
      case '$nin': return !expected.some((item) => eqOrContains(actual, item))
      case '$ne': return !eqOrContains(actual, expected)
      case '$gt': return actual != null && actual > expected
      case '$gte': return actual != null && actual >= expected
      case '$lt': return actual != null && actual < expected
      case '$lte': return actual != null && actual <= expected
      case '$exists': return (actual !== undefined) === expected
      case '$type': return typeMatches(actual, expected)
      default: throw new Error(`memory-db: unsupported operator ${op}`)
    }
  })
}

export function matches(doc, query = {}) {
  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or') return condition.some((item) => matches(doc, item))
    if (key === '$and') return condition.every((item) => matches(doc, item))
    return matchField(getPath(doc, key), condition)
  })
}

function applyProjection(doc, projection) {
  const copy = clone(doc)
  if (projection && projection._id === 0) delete copy._id
  return copy
}

function duplicateKeyError() {
  const error = new Error('E11000 duplicate key error')
  error.code = 11000
  return error
}

function applyUpdate(doc, update, { inserting = false } = {}) {
  for (const [path, value] of Object.entries(update.$set || {})) setPath(doc, path, clone(value))
  if (inserting) for (const [path, value] of Object.entries(update.$setOnInsert || {})) setPath(doc, path, clone(value))
  for (const path of Object.keys(update.$unset || {})) unsetPath(doc, path)
  for (const [path, amount] of Object.entries(update.$inc || {})) setPath(doc, path, (getPath(doc, path) || 0) + amount)
  for (const [path, value] of Object.entries(update.$max || {})) {
    const current = getPath(doc, path)
    if (current === undefined || value > current) setPath(doc, path, value)
  }
  for (const [path, value] of Object.entries(update.$addToSet || {})) {
    const list = getPath(doc, path) || []
    if (!list.some((item) => equal(item, value))) list.push(clone(value))
    setPath(doc, path, list)
  }
  for (const [path, value] of Object.entries(update.$push || {})) {
    const list = getPath(doc, path) || []
    list.push(clone(value))
    setPath(doc, path, list)
  }
  for (const [path, value] of Object.entries(update.$pull || {})) {
    setPath(doc, path, (getPath(doc, path) || []).filter((item) => !equal(item, value)))
  }
}

function sortRows(rows, spec) {
  const entries = Object.entries(spec || {})
  if (!entries.length) return rows
  return [...rows].sort((a, b) => {
    for (const [field, direction] of entries) {
      const av = getPath(a, field)
      const bv = getPath(b, field)
      if (av === bv) continue
      if (av === undefined) return -1 * direction
      if (bv === undefined) return 1 * direction
      return (av > bv ? 1 : -1) * direction
    }
    return 0
  })
}

function runAggregate(rows, pipeline) {
  let result = rows
  for (const stage of pipeline) {
    if (stage.$match) result = result.filter((row) => matches(row, stage.$match))
    else if (stage.$group) {
      const groups = new Map()
      for (const row of result) {
        const key = stage.$group._id === null ? 'all' : JSON.stringify(getPath(row, String(stage.$group._id).slice(1)))
        const bucket = groups.get(key) || { _id: stage.$group._id === null ? null : getPath(row, String(stage.$group._id).slice(1)) }
        for (const [field, spec] of Object.entries(stage.$group)) {
          if (field === '_id' || !spec.$sum) continue
          const amount = spec.$sum === 1 ? 1 : Number(getPath(row, String(spec.$sum).slice(1)) || 0)
          bucket[field] = (bucket[field] || 0) + amount
        }
        groups.set(key, bucket)
      }
      result = [...groups.values()]
    } else throw new Error('memory-db: unsupported aggregate stage')
  }
  return { toArray: async () => result.map(clone) }
}

export function createMemoryDb(seed = {}) {
  const store = new Map()
  const indexes = new Map()
  let idCounter = 0

  const rowsOf = (name) => {
    if (!store.has(name)) store.set(name, [])
    return store.get(name)
  }

  const violatesUnique = (name, doc, ignore) =>
    (doc._id !== undefined && rowsOf(name).some((row) => row !== ignore && row._id === doc._id)) ||
    (indexes.get(name) || []).some(({ keys, partial }) => {
      if (partial && !matches(doc, partial)) return false
      const keyOf = (row) => JSON.stringify(keys.map((field) => getPath(row, field) ?? null))
      const target = keyOf(doc)
      return rowsOf(name).some((row) => row !== ignore && (!partial || matches(row, partial)) && keyOf(row) === target)
    })

  for (const [name, docs] of Object.entries(seed)) store.set(name, docs.map(clone))

  const db = {
    read: (name) => rowsOf(name).map(clone),
    collection(name) {
      const rows = rowsOf(name)
      return {
        createIndex: async (spec, options = {}) => {
          if (options.unique) {
            const list = indexes.get(name) || []
            list.push({ keys: Object.keys(spec), partial: options.partialFilterExpression || null })
            indexes.set(name, list)
          }
          return 'ok'
        },
        findOne: async (query = {}, options = {}) => {
          const row = rows.find((item) => matches(item, query))
          return row ? applyProjection(row, options.projection) : null
        },
        find(query = {}, options = {}) {
          let result = rows.filter((row) => matches(row, query))
          const cursor = {
            sort(spec) { result = sortRows(result, spec); return cursor },
            skip(count) { result = result.slice(count); return cursor },
            limit(count) { result = result.slice(0, count); return cursor },
            toArray: async () => result.map((row) => applyProjection(row, options.projection)),
          }
          return cursor
        },
        insertOne: async (doc) => {
          const next = clone(doc)
          if (next._id === undefined) next._id = `mem-${++idCounter}`
          if (violatesUnique(name, next)) throw duplicateKeyError()
          rows.push(next)
          return { insertedId: next._id }
        },
        updateOne: async (query, update, options = {}) => {
          let row = rows.find((item) => matches(item, query))
          if (!row && options.upsert) {
            row = {}
            for (const [key, value] of Object.entries(query)) {
              if (!key.startsWith('$') && !isOperatorObject(value)) setPath(row, key, clone(value))
            }
            applyUpdate(row, update, { inserting: true })
            if (row._id === undefined) row._id = `mem-${++idCounter}`
            if (violatesUnique(name, row)) throw duplicateKeyError()
            rows.push(row)
            return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }
          }
          if (!row) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
          const draft = clone(row)
          applyUpdate(draft, update)
          if (violatesUnique(name, draft, row)) throw duplicateKeyError()
          const modified = JSON.stringify(draft) !== JSON.stringify(row)
          Object.keys(row).forEach((key) => delete row[key])
          Object.assign(row, draft)
          return { matchedCount: 1, modifiedCount: modified ? 1 : 0, upsertedCount: 0 }
        },
        updateMany: async (query, update) => {
          let modifiedCount = 0
          for (const row of rows.filter((item) => matches(item, query))) {
            applyUpdate(row, update)
            modifiedCount += 1
          }
          return { matchedCount: modifiedCount, modifiedCount }
        },
        findOneAndUpdate: async (query, update, options = {}) => {
          const candidates = sortRows(rows.filter((item) => matches(item, query)), options.sort)
          const row = candidates[0]
          if (!row) return null
          const before = clone(row)
          const draft = clone(row)
          applyUpdate(draft, update)
          if (violatesUnique(name, draft, row)) throw duplicateKeyError()
          Object.keys(row).forEach((key) => delete row[key])
          Object.assign(row, draft)
          return applyProjection(options.returnDocument === 'after' ? row : before, options.projection)
        },
        deleteOne: async (query) => {
          const index = rows.findIndex((item) => matches(item, query))
          if (index < 0) return { deletedCount: 0 }
          rows.splice(index, 1)
          return { deletedCount: 1 }
        },
        deleteMany: async (query = {}) => {
          let deletedCount = 0
          for (let i = rows.length - 1; i >= 0; i -= 1) {
            if (matches(rows[i], query)) { rows.splice(i, 1); deletedCount += 1 }
          }
          return { deletedCount }
        },
        bulkWrite: async (operations = []) => {
          let upsertedCount = 0
          let modifiedCount = 0
          for (const op of operations) {
            if (op.updateOne) {
              const res = await db.collection(name).updateOne(op.updateOne.filter, op.updateOne.update, { upsert: op.updateOne.upsert })
              if (res.upsertedCount) upsertedCount += res.upsertedCount
              if (res.modifiedCount) modifiedCount += res.modifiedCount
            } else if (op.insertOne) {
              await db.collection(name).insertOne(op.insertOne.document)
              upsertedCount += 1
            }
          }
          return { upsertedCount, modifiedCount }
        },
        countDocuments: async (query = {}) => rows.filter((row) => matches(row, query)).length,
        aggregate: (pipeline) => runAggregate(rows, pipeline),
      }
    },
    client: {
      startSession() {
        return {
          withTransaction: async (operation) => {
            const snapshot = new Map([...store].map(([name, list]) => [name, list.map(clone)]))
            try {
              return await operation({})
            } catch (error) {
              store.clear()
              for (const [name, list] of snapshot) store.set(name, list)
              throw error
            }
          },
          endSession: async () => {},
        }
      },
    },
  }
  return db
}
