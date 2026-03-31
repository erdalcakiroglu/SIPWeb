import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { env } from '../config/env'
import { initMigrationTracker, runPendingMigrations } from './migration'
import { allMigrations } from '../migrations'

const dataDir = env.dataDir
const dbPath = path.join(dataDir, 'SQLPerf.db')

fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(dbPath)

// Initialize migration tracking and run pending migrations
initMigrationTracker(db)
runPendingMigrations(db, allMigrations)

export { db, dbPath }
