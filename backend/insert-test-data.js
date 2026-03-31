#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const appRoot = path.resolve(__dirname);
const dataDir = path.join(appRoot, 'data');
const dbPath = path.join(dataDir, 'SQLPerf.db');

console.log('Inserting test data into database...\n');

try {
  const db = new Database(dbPath);

  // Insert test customer with a simple password hash (for testing only)
  const customerStmt = db.prepare(`
    INSERT INTO Customers (name, surname, job, email, phone, company_name, password_hash, is_active, created_at, activated_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  // Simple hash for testing (in production use proper hashing)
  const passwordHash = '$2b$10$dummy.hash.for.testing.only.customer.account.password';

  const customerId = customerStmt.run(
    'Test', 
    'Customer', 
    'Admin', 
    'test@example.com', 
    '1234567890', 
    'Test Company',
    passwordHash,
    1, 
    now, 
    now, 
    now
  ).lastInsertRowid;

  console.log(`✅ Created test customer: ID=${customerId}, email=test@example.com`);

  // Insert test license
  const licenseStmt = db.prepare(`
    INSERT INTO Licenses (
      customer_id, 
      license_name, 
      license_type, 
      allowed_devices, 
      status, 
      expires_at, 
      created_at, 
      updated_at, 
      server_url, 
      activation_code, 
      device_id,
      license_email
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const licenseId = licenseStmt.run(
    customerId,
    'Test License',
    'standard',
    10,
    'active',
    expiryDate.toISOString(),
    now,
    now,
    'https://test.sqlperformance.ai',
    'ACT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    'test@example.com'
  ).lastInsertRowid;

  console.log(`✅ Created test license: ID=${licenseId}, name=Test License`);

  // Verify data
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM Customers').get().count;
  const licenseCount = db.prepare('SELECT COUNT(*) as count FROM Licenses').get().count;

  console.log(`\n📊 Database summary:`);
  console.log(`   Total customers: ${customerCount}`);
  console.log(`   Total licenses: ${licenseCount}`);

  db.close();
  console.log('\n✅ Test data inserted successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
