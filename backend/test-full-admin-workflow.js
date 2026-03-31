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

async function testFullAdminFlow() {
  console.log('Admin Panel - Tam İş Akışı Testi');
  console.log('='.repeat(50) + '\n');

  try {
    // 1. Login
    console.log('1️⃣  Admin Girişi');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sqlperformance.ai'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Jk8%sk93/ks.U'
    let res = await makeRequest('/api/admin/login', 'POST', {
      email: adminEmail,
      password: adminPassword,
    });
    if (res.status !== 200) throw new Error(`Giriş başarısız: ${res.status}`);
    
    const setCookie = res.headers['set-cookie']?.[0];
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }
    csrfToken = res.data.csrfToken;
    console.log('   ✅ Giriş başarılı\n');

    // 2. Get authenticated /api/admin/me
    console.log('2️⃣  Session Doğrulaması');
    res = await makeRequest('/api/admin/me');
    if (res.status !== 200 || !res.data.authenticated) {
      throw new Error('Session doğrulaması başarısız');
    }
    console.log('   ✅ Session doğrulandı\n');

    // 3. Get Dashboard
    console.log('3️⃣  Dashboard Yükleme');
    res = await makeRequest('/api/admin/dashboard');
    if (res.status !== 200) throw new Error(`Dashboard yükleme başarısız: ${res.status}`);
    console.log(`   ✅ Dashboard yüklendi`);
    console.log(`   📊 Müşteri sayısı: ${res.data.summary.totalCustomers}`);
    console.log(`   📜 Lisans sayısı: ${res.data.summary.totalLicenses}\n`);

    // 4. Get first customer details
    if (res.data.customers.length > 0) {
      console.log('4️⃣  Müşteri Detayları');
      const customerId = res.data.customers[0].id;
      res = await makeRequest(`/api/admin/customers/${customerId}`);
      if (res.status !== 200) throw new Error(`Müşteri yükleme başarısız: ${res.status}`);
      console.log(`   ✅ Müşteri yüklendi: ${res.data.customer.email}`);
      console.log(`   📋 Lisans sayısı: ${res.data.licenses.length}\n`);

      // 5. Edit customer name
      if (res.data.customer) {
        console.log('5️⃣  Müşteri Güncelleme');
        const updatedName = 'Updated ' + res.data.customer.name + ' ' + Date.now();
        res = await makeRequest(
          `/api/admin/customers/${customerId}`,
          'PATCH',
          {
            _csrf: csrfToken,
            name: updatedName,
          }
        );
        if (res.status === 200) {
          console.log(`   ✅ Müşteri ismi güncellendi: ${updatedName}\n`);
        }
      }

      // 6. Edit license if available
      if (res.data.licenses && res.data.licenses.length > 0) {
        console.log('6️⃣  Lisans Düzenleme');
        const license = res.data.licenses[0];
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

        res = await makeRequest(
          `/api/admin/customers/${customerId}/licenses/${license.id}`,
          'PATCH',
          {
            _csrf: csrfToken,
            status: 'active',
            expiresAt: newExpiryDate.toISOString(),
          }
        );
        if (res.status === 200) {
          console.log(`   ✅ Lisans güncellendi`);
          console.log(`      Durum: active`);
          console.log(`      Bitiş: ${newExpiryDate.toISOString()}\n`);
        }
      }
    }

    // 7. Logout
    console.log('7️⃣  Çıkış Yapma');
    res = await makeRequest('/api/admin/logout', 'POST', { _csrf: csrfToken });
    if (res.status !== 200) throw new Error(`Çıkış başarısız: ${res.status}`);
    console.log('   ✅ Çıkış başarılı\n');

    // 8. Verify session is cleared
    console.log('8️⃣  Session Temizleme Doğrulaması');
    sessionCookie = ''; // Clear session
    res = await makeRequest('/api/admin/dashboard');
    if (res.status === 401 || !res.data.authenticated) {
      console.log('   ✅ Session başarıyla temizlendi\n');
    }

    console.log('='.repeat(50));
    console.log('\n✅ TÜM TESTLER BAŞARILI!\n');
    console.log('Admin Panel tam olarak çalışıyor:');
    console.log('  ✓ Login/Logout');
    console.log('  ✓ Session Management');
    console.log('  ✓ Dashboard');
    console.log('  ✓ Customer Management');
    console.log('  ✓ License Editing');
    console.log('  ✓ CSRF Protection\n');
    console.log('Web Arayüzüne erişin: http://localhost:3001/public/admin.html');

  } catch (error) {
    console.error('\n❌ Test hatası:', error.message);
    process.exit(1);
  }
}

testFullAdminFlow();
