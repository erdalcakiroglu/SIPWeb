import type Database from 'better-sqlite3'
import type { Migration } from '../lib/migration'

export const migration002AddCreatedViaColumn: Migration = {
  version: 2,
  name: 'add_created_via_column',
  up: (db) => {
    // Check if column exists before adding
    const columns = db
      .prepare(`PRAGMA table_info(Licenses)`)
      .all() as Array<{ name: string }>

    if (!columns.some((col) => col.name === 'created_via')) {
      db.exec(`
        ALTER TABLE Licenses
        ADD COLUMN created_via TEXT NOT NULL DEFAULT 'unknown';
      `)
    }

    // Idempotent: Only update rows that need it
    const portalCount = db
      .prepare(
        `SELECT COUNT(*) as cnt FROM Licenses 
         WHERE notes IN ('Portal-created license record.', 'Auto-provisioned until website purchase flow is implemented.')
         AND created_via = 'unknown'`,
      )
      .get() as { cnt: number }

    if (portalCount.cnt > 0) {
      db.prepare(`
        UPDATE Licenses
        SET created_via = 'customer_portal'
        WHERE notes IN ('Portal-created license record.', 'Auto-provisioned until website purchase flow is implemented.')
        AND created_via = 'unknown'
      `).run()
    }

    // Update rows with imported_file
    const syncCount = db
      .prepare(
        `SELECT COUNT(*) as cnt FROM Licenses 
         WHERE imported_file IS NOT NULL AND created_via = 'unknown'`,
      )
      .get() as { cnt: number }

    if (syncCount.cnt > 0) {
      db.prepare(`
        UPDATE Licenses
        SET created_via = 'app_sync'
        WHERE imported_file IS NOT NULL AND created_via = 'unknown'
      `).run()
    }

    console.log(`✓ Migrated ${portalCount.cnt} portal licenses and ${syncCount.cnt} sync licenses`)
  },

  down: (db) => {
    db.exec(`
      ALTER TABLE Licenses
      DROP COLUMN created_via;
    `)
  },
}
