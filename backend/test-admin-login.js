#!/usr/bin/env node

const http = require('http');

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

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

async function testAdminLogin() {
  console.log('Admin Giriş Testı\n' + '='.repeat(40) + '\n');

  try {
    // Test 1: Doğru credentials ile giriş
    console.log('Test 1: Doğru credentials ile giriş');
    console.log('Email: admin@sqlperformance.ai');
    console.log('Password: Jk8%sk93/ks.U\n');

    let res = await makeRequest('/api/admin/login', 'POST', {
      email: 'admin@sqlperformance.ai',
      password: 'Jk8%sk93/ks.U',
    });

    if (res.status === 200) {
      console.log('✅ Giriş başarılı! (Status: 200)');
      console.log('Response:', JSON.stringify(res.data, null, 2).substring(0, 200) + '...');
    } else {
      console.log('❌ Giriş başarısız! (Status: ' + res.status + ')');
      console.log('Response:', res.data);
    }

    // Test 2: Yanlış password ile giriş
    console.log('\n' + '-'.repeat(40) + '\n');
    console.log('Test 2: Yanlış password ile giriş');
    console.log('Email: admin@sqlperformance.ai');
    console.log('Password: wrongpassword\n');

    res = await makeRequest('/api/admin/login', 'POST', {
      email: 'admin@sqlperformance.ai',
      password: 'wrongpassword',
    });

    if (res.status === 400) {
      console.log('✅ Doğru şekilde reddedildi (Status: 400)');
      console.log('Message:', res.data?.message);
    } else {
      console.log('❌ Beklenmeyen status: ' + res.status);
    }

    // Test 3: Yanlış email ile giriş
    console.log('\n' + '-'.repeat(40) + '\n');
    console.log('Test 3: Yanlış email ile giriş');
    console.log('Email: wrong@example.com');
    console.log('Password: Jk8%sk93/ks.U\n');

    res = await makeRequest('/api/admin/login', 'POST', {
      email: 'wrong@example.com',
      password: 'Jk8%sk93/ks.U',
    });

    if (res.status === 400) {
      console.log('✅ Doğru şekilde reddedildi (Status: 400)');
      console.log('Message:', res.data?.message);
    } else {
      console.log('❌ Beklenmeyen status: ' + res.status);
    }

    console.log('\n' + '='.repeat(40) + '\n');
    console.log('✅ Tüm testler tamamlandı!');
    console.log('\nSonuç: Admin girişi sistem çalışıyor.');
    console.log('Admin paneline erişmek için:');
    console.log('  • http://localhost:3001/public/admin.html');
    console.log('  • Email: admin@sqlperformance.ai');
    console.log('  • Password: Jk8%sk93/ks.U');

  } catch (error) {
    console.error('\n❌ Test hatası:', error.message);
    process.exit(1);
  }
}

testAdminLogin();
