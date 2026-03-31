#!/usr/bin/env node

const http = require('http');

// Get admin session first
function login() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'admin@sqlperformance.ai',
      password: 'Jk8%sk93/ks.U'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        const sessionCookie = cookies.find(c => c.includes('connect.sid'));
        resolve({
          sessionCookie: sessionCookie ? sessionCookie.split(';')[0] : '',
          response: JSON.parse(data),
          status: res.statusCode
        });
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

// Get CSRF token
function getCsrfToken(sessionCookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/me',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        resolve({
          csrfToken: response.csrfToken,
          status: res.statusCode
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get customer and license IDs from dashboard
function getCustomers(sessionCookie, csrfToken) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'x-csrf-token': csrfToken
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        // Convert dashboard summary format to customer detail format
        const customers = (response.customers || []).map(cust => ({
          id: cust.id,
          email: cust.email,
          name: cust.name,
          licenses: [] // Will be fetched individually
        }));
        resolve({
          customers,
          status: res.statusCode
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get full customer detail with licenses
function getCustomerDetail(sessionCookie, csrfToken, customerId) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/admin/customers/${customerId}`,
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'x-csrf-token': csrfToken
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        resolve({
          customer: response.customer,
          licenses: response.licenses || [],
          status: res.statusCode
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Update license
function updateLicense(sessionCookie, csrfToken, customerId, licenseId, updates) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      _csrf: csrfToken,
      ...updates
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/admin/customers/${customerId}/licenses/${licenseId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': sessionCookie,
        'x-csrf-token': csrfToken
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          response: data ? JSON.parse(data) : null,
          status: res.statusCode
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  try {
    console.log('1. Logging in...');
    const loginResult = await login();
    const { sessionCookie } = loginResult;
    console.log('   Session:', sessionCookie.substring(0, 30) + '...');

    console.log('\n2. Getting CSRF token...');
    const csrfResult = await getCsrfToken(sessionCookie);
    console.log('   CSRF Status:', csrfResult.status);
    console.log('   CSRF Token:', csrfResult.csrfToken.substring(0, 30) + '...');

    console.log('\n3. Fetching dashboard...');
    const customersResult = await getCustomers(sessionCookie, csrfResult.csrfToken);
    console.log('   Found customers:', customersResult.customers.length);
    console.log('   Status:', customersResult.status);

    if (customersResult.customers.length === 0) {
      console.log('   ❌ No customers found');
      return;
    }

    // Get full details for first customer
    console.log('\n4. Fetching first customer details...');
    const customerId = customersResult.customers[0].id;
    const detailResult = await getCustomerDetail(sessionCookie, csrfResult.csrfToken, customerId);
    console.log('   Customer:', detailResult.customer.email);
    console.log('   Licenses:', detailResult.licenses.length);
    console.log('   Status:', detailResult.status);

    if (detailResult.licenses.length === 0) {
      console.log('   ❌ No licenses found for this customer');
      return;
    }

    const license = detailResult.licenses[0];
    const licenseId = license.id;

    console.log(`\n5. Found license: ${license.licenseName} (ID: ${licenseId})`);
    console.log(`   Current status: ${license.status}`);
    console.log(`   Current expires: ${license.expiresAt}`);

    // Test updating license expires_at
    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

    console.log(`\n6. Updating license expiry to: ${newExpiryDate.toISOString()}`);
    const updateResult = await updateLicense(
      sessionCookie,
      csrfResult.csrfToken,
      customerId,
      licenseId,
      {
        expiresAt: newExpiryDate.toISOString(),
        status: 'active'
      }
    );

    console.log('   Status:', updateResult.status);
    if (updateResult.status === 200 || updateResult.status === 204) {
      console.log('   ✅ License update successful!');
      if (updateResult.response) {
        console.log('   Response:', JSON.stringify(updateResult.response, null, 2));
      }
    } else {
      console.log('   ❌ License update failed');
      console.log('   Response:', updateResult.response);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
