#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Match the path resolution in src/lib/db.ts
const appRoot = process.env.APP_ROOT || path.resolve(__dirname);
const dataDir = process.env.DATA_DIR || path.join(appRoot, 'data');
const dbPath = path.join(dataDir, 'SQLPerf.db');

console.log('App Root:', appRoot);
console.log('Data Dir:', dataDir);
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n--- Customers ---');
  const customers = db.prepare('SELECT * FROM Customers').all();
  console.log(`Total customers: ${customers.length}`);
  customers.slice(0, 3).forEach(c => {
    console.log(`  - ${c.email} (ID: ${c.id})`);
  });

  console.log('\n--- Licenses ---');
  const licenses = db.prepare('SELECT * FROM Licenses LIMIT 5').all();
  const licenseCount = db.prepare('SELECT COUNT(*) as count FROM Licenses').get();
  console.log(`Total licenses: ${licenseCount.count}`);
  licenses.forEach(l => {
    console.log(`  - ${l.license_name} (ID: ${l.id}, Customer: ${l.customer_id}, Status: ${l.status})`);
  });

  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
