# Security Testing & QA Guide

## Manual Security Testing

### 1. CSRF Protection Tests

#### Test 1.1: Missing CSRF Token
**Expected**: 403 error

```bash
curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "Content-Type: application/json" \
  --cookie "session=test" \
  -d '{"companyName": "Test"}'

# Should return:
# {"error": "CSRF token missing"}
```

#### Test 1.2: Invalid CSRF Token
**Expected**: 403 error

```bash
curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid_token" \
  -d '{"companyName": "Test"}'

# Should return:
# {"error": "CSRF token invalid"}
```

#### Test 1.3: Valid CSRF Token
**Expected**: Success or 404 (customer not found is OK)

```bash
# 1. Login and extract token
LOGIN=$(curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@sqlperformance.ai","password":"Admin12345!"}')

TOKEN=$(echo $LOGIN | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

# 2. Use token in request
curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -b cookies.txt \
  -d '{"companyName":"Test Company"}'

# Should work
```

### 2. CORS Protection Tests

#### Test 2.1: Unauthorized Origin
**Expected**: CORS error or blocked request

```bash
# From localhost, try accessing api.production.com
curl -X GET http://api.sqlperformance.ai:3001/api/admin/me \
  -H "Origin: http://attacker.com" \
  -H "Access-Control-Request-Method: GET"

# Check response headers - should NOT include:
# Access-Control-Allow-Origin: *
```

#### Test 2.2: Authorized Origin
**Expected**: 200 with CORS headers

```bash
curl -X GET http://localhost:3001/api/admin/me \
  -H "Origin: http://localhost:3000" \
  -v

# Should include:
# < Access-Control-Allow-Origin: http://localhost:3000
```

### 3. Rate Limiting Tests

#### Test 3.1: Admin Login Rate Limit (5 req/min)
**Expected**: 429 after 5 attempts

```bash
for i in {1..7}; do
  echo "Attempt $i:"
  curl -s -X POST http://localhost:3001/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"wrong"}' | grep -o 'message":"[^"]*'
  sleep 1
done

# Attempts 1-5: 400 (wrong password)
# Attempts 6-7: 429 (rate limited)
```

#### Test 3.2: Auth Endpoint Rate Limit (10 req/min)
```bash
for i in {1..12}; do
  curl -s -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"Pass123!","name":"Test"}'
  sleep 0.5
done
```

### 4. Email Validation Tests

#### Test 4.1: Disposable Email Rejection
**Expected**: Error message

```bash
# Test various disposable domains
for domain in guerrillamail.com tempmail.com 10minutemail.com; do
  curl -s -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user@$domain\",\"password\":\"Pass123!\"}"
done

# All should return:
# "Disposable email addresses are not allowed"
```

#### Test 4.2: Valid Email Acceptance
**Expected**: Success (or validation passes)

```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","password":"Pass123!"}'

# Should not have "Disposable email" error
```

### 5. Session Management Tests

#### Test 5.1: Session Persistence
**Expected**: Same session across requests

```bash
# Login
curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@sqlperformance.ai","password":"Admin12345!"}'

# Check session persists
curl -s -X GET http://localhost:3001/api/admin/me \
  -b cookies.txt | grep "authenticated"

# Should show: true
```

#### Test 5.2: Session Timeout
**Expected**: Logout after inactivity (check env.ts for duration)

```bash
# Login
curl -s -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{...}'

# Wait for session timeout period
sleep 1800  # Default: 30 minutes

# Try to use session
curl -s -X GET http://localhost:3001/api/admin/me \
  -b cookies.txt | grep "authenticated"

# Should show: false
```

---

## Automated Testing Guide

### Setup Jest/Supertest

```bash
npm install --save-dev jest @types/jest supertest ts-jest
```

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
}
```

### Test Suite: CSRF Protection

```typescript
// __tests__/csrf.test.ts
import request from 'supertest'
import { app } from '../src/app'

describe('CSRF Protection', () => {
  test('PATCH without CSRF token returns 403', async () => {
    const res = await request(app)
      .patch('/api/admin/customers/1')
      .send({ companyName: 'Test' })
    
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('CSRF token missing')
  })

  test('PATCH with invalid CSRF token returns 403', async () => {
    const res = await request(app)
      .patch('/api/admin/customers/1')
      .set('X-CSRF-Token', 'invalid_token')
      .send({ companyName: 'Test' })
    
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('CSRF token invalid')
  })

  test('Admin can update customer with valid CSRF token', async () => {
    // 1. Get CSRF token
    const meRes = await request(app)
      .get('/api/admin/me')
    
    const csrfToken = meRes.body.csrfToken
    
    // 2. Login (if required)
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@sqlperformance.ai',
        password: 'Admin12345!'
      })
    
    const newToken = loginRes.body.csrfToken
    
    // 3. Update with token
    const updateRes = await request(app)
      .patch('/api/admin/customers/1')
      .set('X-CSRF-Token', newToken)
      .send({ companyName: 'Updated' })
    
    // Should succeed or 404 (if customer doesn't exist)
    expect(updateRes.status).not.toBe(403)
  })
})
```

### Test Suite: Email Validation

```typescript
// __tests__/email-validation.test.ts
import { validateNonDisposableEmail } from '../src/lib/validation'

describe('Email Validation', () => {
  test('rejects disposable emails', () => {
    const disposableDomains = [
      'user@guerrillamail.com',
      'user@tempmail.com',
      'user@10minutemail.com',
      'user@mailinator.com',
    ]
    
    disposableDomains.forEach(email => {
      expect(validateNonDisposableEmail(email)).toBe(false)
    })
  })

  test('accepts valid corporate emails', () => {
    const validEmails = [
      'user@microsoft.com',
      'user@google.com',
      'user@company.local',
    ]
    
    validEmails.forEach(email => {
      expect(validateNonDisposableEmail(email)).toBe(true)
    })
  })
})
```

### Test Suite: Rate Limiting

```typescript
// __tests__/rate-limit.test.ts
import request from 'supertest'
import { app } from '../src/app'

describe('Rate Limiting', () => {
  test('admin login limited to 5 requests per minute', async () => {
    const attempts = []
    
    for (let i = 0; i < 7; i++) {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@sqlperformance.ai',
          password: 'WrongPassword',
        })
      
      attempts.push(res.status)
    }
    
    // First 5 attempts: 400 (auth error)
    // Next 2 attempts: 429 (rate limited)
    expect(attempts[0]).toBe(400)
    expect(attempts[4]).toBe(400)
    expect(attempts[5]).toBe(429)
    expect(attempts[6]).toBe(429)
  })
})
```

### Run Tests

```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch        # Watch mode
```

---

## Security Scanning

### 1. Dependency Vulnerability Scan

```bash
# Check for known vulnerabilities
npm audit

# Fix automatically (where possible)
npm audit fix

# In CI/CD, fail if vulnerabilities found
npm audit --audit-level=moderate
```

### 2. Code Security Scanning

```bash
# Install Snyk
npm install -g snyk

# Scan project
snyk test

# Continuous scanning
snyk monitor
```

### 3. OWASP ZAP Scanning

```bash
# Docker-based scanning
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3001

# Check for:
# - Weak security headers
# - SQL injection
# - XSS vulnerabilities
# - CSRF issues
```

---

## Load Testing

### Setup Apache Bench

```bash
# macOS
brew install httpd

# Linux
apt-get install apache2-utils

# Windows
# Download from Apache website
```

### Basic Load Test

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3001/api/admin/me

# With auth
ab -n 100 -c 10 \
  -H "Cookie: session=xxx" \
  http://localhost:3001/api/admin/dashboard
```

### Stress Test (Rate Limiting)

```bash
# Push beyond rate limits to verify limits work
ab -n 1000 -c 50 http://localhost:3001/api/admin/login

# Expected: 429 responses after threshold
```

### Using Artillery

```bash
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << 'EOF'
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"

scenarios:
  - name: "Admin Dashboard Load"
    flow:
      - post:
          url: "/api/admin/login"
          json:
            email: "admin@sqlperformance.ai"
            password: "Admin12345!"
      - get:
          url: "/api/admin/dashboard"
EOF

artillery run load-test.yml
```

---

## Performance Benchmarking

### Response Time Targets

| Endpoint | Target (ms) | Alert (ms) |
|----------|-------------|-----------|
| Login | < 200 | > 500 |
| Dashboard | < 100 | > 300 |
| Get Customer | < 50 | > 150 |
| Update Customer | < 100 | > 300 |
| Delete Customer | < 100 | > 300 |

### Monitoring Script

```bash
#!/bin/bash
# monitor-performance.sh

while true; do
  echo "=== Performance Check ==="
  
  # Dashboard endpoint
  TIME=$(time -p curl -s http://localhost:3001/api/admin/dashboard \
    -H "Cookie: session=xxx" 2>&1 | grep real | awk '{print $2}')
  
  echo "Dashboard response time: $TIME"
  
  sleep 5
done
```

---

## Deployment Verification Checklist

After deploying to production:

- [ ] CORS_ORIGIN correctly configured
- [ ] SESSION_SECRET is strong (32+ chars)
- [ ] ADMIN_PASSWORD_HASH not plaintext
- [ ] Database backups working
- [ ] Health checks passing
- [ ] HTTPS/SSL certificate valid
- [ ] Security headers present
- [ ] Rate limits monitored
- [ ] Logs being collected
- [ ] Monitoring alerts configured

---

## Incident Response

### CSRF Token Leakage
```bash
# 1. Check audit logs
cat audit.log | grep CSRF

# 2. Invalidate all sessions
# (Restart backend to clear in-memory sessions)
pm2 restart sqlperf-backend

# 3. Force users to re-login
```

### Brute Force Attack
```bash
# 1. Identify attacker IP
tail -f /var/log/nginx/access.log | grep "admin/login" | grep "429"

# 2. Block IP
ufw insert 1 deny from attacker.ip.address

# 3. Increase rate limits temporarily
RATE_LIMIT_ADMIN_LOGIN=2 npm run start
```

### Database Corruption
```bash
# 1. Restore from backup
tar -xzf /backups/sqlperf-20240101.tar.gz -C /

# 2. Verify integrity
sqlite3 sqlperf.db "PRAGMA integrity_check;"

# 3. Restart
pm2 restart sqlperf-backend
```

