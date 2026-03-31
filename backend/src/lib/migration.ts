import type Database from 'better-sqlite3'
import path from 'node:path'

export interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
  down: (db: Database.Database) => void
}

export function initMigrationTracker(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `)
}

export function getMigrationsHistory(db: Database.Database): Migration[] {
  const rows = db
    .prepare('SELECT version FROM _migrations ORDER BY version ASC')
    .all() as Array<{ version: number }>

  return rows.map((row) => ({
    version: row.version,
    name: '',
    up: () => {},
    down: () => {},
  }))
}

export function getAppliedVersion(db: Database.Database): number {
  const row = db
    .prepare('SELECT MAX(version) as max_version FROM _migrations')
    .get() as { max_version: number | null }

  return row.max_version ?? 0
}

export function runMigration(
  db: Database.Database,
  migration: Migration,
  direction: 'up' | 'down',
): void {
  try {
    if (direction === 'up') {
      migration.up(db)
      db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        migration.version,
        migration.name,
        new Date().toISOString(),
      )
      console.log(`✅ Migration ${migration.version} (${migration.name}) applied`)
    } else {
      migration.down(db)
      db.prepare('DELETE FROM _migrations WHERE version = ?').run(migration.version)
      console.log(`⬅️  Migration ${migration.version} (${migration.name}) rolled back`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Migration ${migration.version} (${migration.name}) failed: ${message}`)
    throw error
  }
}

export function runPendingMigrations(db: Database.Database, migrations: Migration[]): void {
  const applied = getAppliedVersion(db)
  const pending = migrations.filter((m) => m.version > applied)

  if (pending.length === 0) {
    console.log('✅ All migrations are up to date')
    return
  }

  console.log(`Running ${pending.length} pending migration(s)...`)

  pending.forEach((migration) => {
    runMigration(db, migration, 'up')
  })

  console.log(`✅ Successfully applied ${pending.length} migration(s)`)
}
