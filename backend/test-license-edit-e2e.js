#!/usr/bin/env node

const http = require('http');

let sessionCookie = '';
let csrfToken = '';

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      ...headers,
    };

    if (csrfToken && method !== 'GET') {
      defaultHeaders['x-csrf-token'] = csrfToken;
    }

    if (data) {
      defaultHeaders['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: defaultHeaders,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('=== End-to-End License Update Test ===\n');

  try {
    // 1. Login
    console.log('1️⃣  Admin login...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sqlperformance.ai'
    const adminPassword = process.env.ADMIN_PASSWORD_HASH ? '' : (process.env.ADMIN_PASSWORD || 'test')
    let res = await makeRequest('/api/admin/login', 'POST', {
      email: adminEmail,
      password: adminPassword,
    });
    if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
    
    const setCookie = res.headers['set-cookie']?.[0];
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }
    csrfToken = res.data.csrfToken;
    console.log('   ✅ Admin authenticated\n');

    // 2. Get dashboard to find customers
    console.log('2️⃣  Fetching dashboard...');
    res = await makeRequest('/api/admin/dashboard');
    if (res.status !== 200) throw new Error(`Dashboard fetch failed: ${res.status}`);
    
    if (res.data.customers.length === 0) throw new Error('No customers found in dashboard');
    
    const customer = res.data.customers[0];
    console.log(`   ✅ Found customer: ${customer.email} (ID: ${customer.id})\n`);

    // 3. Get customer details
    console.log('3️⃣  Fetching customer details...');
    res = await makeRequest(`/api/admin/customers/${customer.id}`);
    if (res.status !== 200) throw new Error(`Customer fetch failed: ${res.status}`);
    
    if (!res.data.licenses || res.data.licenses.length === 0) {
      throw new Error('No licenses found for customer');
    }

    const license = res.data.licenses[0];
    console.log(`   ✅ Found license: ${license.licenseName} (ID: ${license.id})`);
    console.log(`   Current status: ${license.status}`);
    console.log(`   Current expires: ${license.expiresAt}\n`);

    // 4. Update license
    console.log('4️⃣  Updating license...');
    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 2);
    const newStatus = license.status === 'active' ? 'trial_active' : 'active';

    res = await makeRequest(
      `/api/admin/customers/${customer.id}/licenses/${license.id}`,
      'PATCH',
      {
        _csrf: csrfToken,
        status: newStatus,
        expiresAt: newExpiryDate.toISOString(),
      }
    );

    if (res.status !== 200) {
      throw new Error(`License update failed: ${res.status} - ${JSON.stringify(res.data)}`);
    }

    console.log(`   ✅ License updated successfully`);
    console.log(`   New status: ${newStatus}`);
    console.log(`   New expires: ${newExpiryDate.toISOString()}\n`);

    // 5. Verify changes
    console.log('5️⃣  Verifying changes...');
    res = await makeRequest(`/api/admin/customers/${customer.id}`);
    if (res.status !== 200) throw new Error(`Verification fetch failed: ${res.status}`);

    const updatedLicense = res.data.licenses.find(l => l.id === license.id);
    if (!updatedLicense) throw new Error('Updated license not found');

    const statusMatch = updatedLicense.status === newStatus;
    const expiryMatch = new Date(updatedLicense.expiresAt).getFullYear() === newExpiryDate.getFullYear();

    if (!statusMatch || !expiryMatch) {
      throw new Error(`Verification failed: status=${updatedLicense.status}, expires=${updatedLicense.expiresAt}`);
    }

    console.log(`   ✅ Changes verified`);
    console.log(`   Verified status: ${updatedLicense.status}`);
    console.log(`   Verified expires: ${updatedLicense.expiresAt}\n`);

    console.log('=== ✅ All Tests Passed ===\n');
    console.log('License editing functionality is working correctly!');
    console.log('Users can now:');
    console.log('  • Edit license status');
    console.log('  • Edit license expiration date');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
