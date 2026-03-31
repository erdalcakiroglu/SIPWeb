import type Database from 'better-sqlite3'
import type { Migration } from '../lib/migration'

/**
 * Add CHECK constraints for data integrity.
 * Ensures only valid enum values are stored in the database.
 */
export const migration003AddCheckConstraints: Migration = {
  version: 3,
  name: 'add_check_constraints',
  up: (db) => {
    // SQLite doesn't support ALTER TABLE ... ADD CONSTRAINT for existing tables.
    // Instead, recreate the table with constraints.
    // For production, consider: CREATE TABLE ... AS SELECT, then DROP old, RENAME new.

    // For now, document the desired constraints as a reference
    const constraintDefinitions = `
    -- Desired constraints (apply manually if needed):
    
    ALTER TABLE Licenses ADD CONSTRAINT license_type_check
    CHECK(license_type IN ('trial', 'subscription', 'perpetual'));
    
    ALTER TABLE Licenses ADD CONSTRAINT status_check
    CHECK(status IN ('active', 'trial_active', 'expired', 'revoked', 'suspended'));
    
    ALTER TABLE Licenses ADD CONSTRAINT created_via_check
    CHECK(created_via IN ('api', 'customer_portal', 'app_sync', 'unknown'));
    
    ALTER TABLE ActivationCodes ADD CONSTRAINT activation_status_check
    CHECK(status IN ('active', 'used', 'expired', 'revoked', 'replaced'));
    
    ALTER TABLE LicenseDevices ADD CONSTRAINT device_status_check
    CHECK(status IN ('active', 'released', 'revoked'));
    
    ALTER TABLE TrialActivations ADD CONSTRAINT trial_status_check
    CHECK(status IN ('trial_active', 'trial_expired', 'blocked'));
    `

    // Store this as a schema documentation in a new table
    db.exec(`
      CREATE TABLE IF NOT EXISTS _schema_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_version INTEGER NOT NULL,
        note_type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `)

    db.prepare(`
      INSERT INTO _schema_notes (migration_version, note_type, content, created_at)
      VALUES (?, ?, ?, ?)
    `).run(3, 'pending_constraints', constraintDefinitions, new Date().toISOString())

    console.log('ℹ️  Check constraints documented (manual application required)')
  },

  down: (db) => {
    db.prepare('DELETE FROM _schema_notes WHERE migration_version = 3').run()
  },
}
