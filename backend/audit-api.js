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

async function test(name, fn) {
  try {
    console.log(`\n▶ ${name}`);
    await fn();
    console.log(`  ✅ Passed`);
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
  }
}

async function main() {
  console.log('=== Backend Admin API Audit ===\n');

  // 1. Test unauthenticated GET /api/admin/me
  await test('GET /api/admin/me (unauthenticated)', async () => {
    const res = await makeRequest('/api/admin/me');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.authenticated === false) throw new Error('Should be unauthenticated');
  });

  // 2. Test invalid login
  await test('POST /api/admin/login (invalid credentials)', async () => {
    const res = await makeRequest('/api/admin/login', 'POST', {
      email: 'invalid@test.com',
      password: 'wrongpass',
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 3. Test valid login
  await test('POST /api/admin/login (valid credentials)', async () => {
    const res = await makeRequest('/api/admin/login', 'POST', {
      email: 'admin@sqlperformance.ai',
      password: 'Jk8%sk93/ks.U',
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.admin) throw new Error('No admin in response');
    
    // Store session and CSRF
    const setCookie = res.headers['set-cookie']?.[0];
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }
    csrfToken = res.data.csrfToken;
  });

  // 4. Test authenticated GET /api/admin/me  
  await test('GET /api/admin/me (authenticated)', async () => {
    const res = await makeRequest('/api/admin/me');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.authenticated !== true) throw new Error('Should be authenticated');
    if (!res.data.csrfToken) throw new Error('No CSRF token in response');
  });

  // 5. Test GET /api/admin/dashboard
  await test('GET /api/admin/dashboard', async () => {
    const res = await makeRequest('/api/admin/dashboard');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.summary) throw new Error('No summary in response');
    if (!Array.isArray(res.data.customers)) throw new Error('customers should be an array');
  });

  // 6. Test POST /api/admin/logout
  await test('POST /api/admin/logout', async () => {
    const res = await makeRequest('/api/admin/logout', 'POST', { _csrf: csrfToken });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 7. Test accessing protected endpoint after logout
  await test('GET /admin/dashboard (should fail after logout)', async () => {
    const res = await makeRequest('/api/admin/dashboard');
    // Should either be 401 or return unauthenticated
    if (res.status === 401 || (res.data && res.data.message && res.data.message.includes('authentication'))) {
      return;
    }
    throw new Error(`Expected 401 or auth error, got ${res.status}`);
  });

  // 8. Re-login for further tests
  let res = await makeRequest('/api/admin/login', 'POST', {
    email: 'admin@sqlperformance.ai',
    password: 'Jk8%sk93/ks.U',
  });
  
  const setCookie = res.headers['set-cookie']?.[0];
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  csrfToken = res.data.csrfToken;

  // 9. Test GET on non-existent customer
  await test('GET /api/admin/customers/9999 (non-existent)', async () => {
    const res = await makeRequest('/api/admin/customers/9999');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 10. Test CSRF protection - POST without token
  await test('POST /api/admin/logout (no CSRF token - should fail)', async () => {
    // Make request without CSRF token
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'Content-Length': 0,
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 403) {
          console.log('  ✅ CSRF protection working (got 403)');
        } else {
          console.log(`  ❌ Expected 403 for missing CSRF token, got ${res.statusCode}`);
        }
      });
    });
    req.on('error', (e) => console.error('  ❌ Request error:', e.message));
    req.end();
  });

  console.log('\n=== Backend API Audit Complete ===');
}

main().catch(console.error);
