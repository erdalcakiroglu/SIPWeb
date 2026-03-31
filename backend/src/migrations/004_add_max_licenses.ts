import type Database from 'better-sqlite3'
import type { Migration } from '../lib/migration'

/**
 * Add max_licenses column to Customers table.
 * This allows admins to limit the number of licenses per customer.
 * Default: 1 license per customer (unless increased by admin)
 */
export const migration004AddMaxLicenses: Migration = {
  version: 4,
  name: 'add_max_licenses',
  up: (db) => {
    // Check if column already exists (for idempotency)
    const tableInfo = db.prepare("PRAGMA table_info(Customers)").all() as Array<{ name: string }>
    const hasMaxLicenses = tableInfo.some((col) => col.name === 'max_licenses')

    if (!hasMaxLicenses) {
      db.exec(`
        ALTER TABLE Customers ADD COLUMN max_licenses INTEGER NOT NULL DEFAULT 1;
      `)
      console.log('✅ Added max_licenses column to Customers')
    } else {
      console.log('ℹ️  max_licenses column already exists')
    }
  },

  down: (db) => {
    // SQLite doesn't support DROP COLUMN easily
    // For production, you'd need to recreate the table or keep the column
    console.log('ℹ️  Skipping down migration (SQLite limitation)')
  },
}
