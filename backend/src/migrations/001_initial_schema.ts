import type Database from 'better-sqlite3'
import type { Migration } from '../lib/migration'

export const migration001InitialSchema: Migration = {
  version: 1,
  name: 'initial_schema',
  up: (db) => {
    // Customers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS Customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        job TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        company_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        verification_code TEXT,
        verification_expires_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        activated_at TEXT
      );
    `)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON Customers(email);
    `)

    // Licenses table
    db.exec(`
      CREATE TABLE IF NOT EXISTS Licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        license_name TEXT NOT NULL,
        license_type TEXT NOT NULL DEFAULT 'subscription',
        status TEXT NOT NULL,
        starts_at TEXT,
        expires_at TEXT,
        refresh_after TEXT,
        offline_grace_until TEXT,
        last_validated_at TEXT,
        license_count INTEGER NOT NULL DEFAULT 1,
        allowed_devices INTEGER NOT NULL DEFAULT 1,
        features_json TEXT NOT NULL DEFAULT '["all_modules"]',
        notes TEXT,
        server_url TEXT,
        license_email TEXT NOT NULL,
        activation_code TEXT,
        installed_license TEXT,
        device_id TEXT,
        imported_file TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
      );
    `)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_licenses_customer_id ON Licenses(customer_id);
      CREATE INDEX IF NOT EXISTS idx_licenses_activation_code ON Licenses(activation_code);
      CREATE INDEX IF NOT EXISTS idx_licenses_installed_license ON Licenses(installed_license);
      CREATE INDEX IF NOT EXISTS idx_licenses_device_id ON Licenses(device_id);
    `)

    // LicenseDevices table
    db.exec(`
      CREATE TABLE IF NOT EXISTS LicenseDevices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        last_ip TEXT,
        last_platform TEXT,
        last_app_version TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (license_id) REFERENCES Licenses(id) ON DELETE CASCADE
      );
    `)

    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_license_devices_license_device
      ON LicenseDevices(license_id, device_id);
      CREATE INDEX IF NOT EXISTS idx_license_devices_status
      ON LicenseDevices(status);
    `)

    // ActivationCodes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ActivationCodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        device_id TEXT,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        used_by_device_id TEXT,
        created_via TEXT NOT NULL DEFAULT 'api',
        FOREIGN KEY (license_id) REFERENCES Licenses(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
      );
    `)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activation_codes_license_id
      ON ActivationCodes(license_id);
      CREATE INDEX IF NOT EXISTS idx_activation_codes_status
      ON ActivationCodes(status);
    `)

    // TrialActivations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS TrialActivations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        email TEXT NOT NULL,
        device_id TEXT NOT NULL,
        status TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE SET NULL
      );
    `)

    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_activations_email_device
      ON TrialActivations(email, device_id);
    `)

    // LicenseEvents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS LicenseEvents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_id INTEGER,
        customer_id INTEGER,
        event_type TEXT NOT NULL,
        device_id TEXT,
        payload_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (license_id) REFERENCES Licenses(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE SET NULL
      );
    `)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_license_events_license_id
      ON LicenseEvents(license_id);
    `)
  },

  down: (db) => {
    db.exec(`
      DROP TABLE IF EXISTS LicenseEvents;
      DROP TABLE IF EXISTS LicenseDevices;
      DROP TABLE IF EXISTS TrialActivations;
      DROP TABLE IF EXISTS ActivationCodes;
      DROP TABLE IF EXISTS Licenses;
      DROP TABLE IF EXISTS Customers;
    `)
  },
}
