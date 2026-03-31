#!/bin/bash
# Quick Start Guide for Security-Enhanced Backend

## Development Setup

### 1. Install Dependencies
npm ci

### 2. Start Development Server
npm run dev

### 3. Test Basic Functionality
curl http://localhost:3001/api/admin/me

## Production Deployment

### 1. Generate Secrets
```bash
# Generate session secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "SESSION_SECRET=$SESSION_SECRET"

# Generate admin password hash
npm run build  # If not already built
node -e "
const {hashPassword} = require('./dist/lib/password');
const hash = hashPassword('YourSecurePassword123!');
console.log('ADMIN_PASSWORD_HASH=' + hash);
"
```

### 2. Set Environment Variables
```bash
export NODE_ENV=production
export SESSION_SECRET=<from-step-1>
export ADMIN_PASSWORD_HASH=<from-step-1>
export CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
export RATE_LIMIT_AUTH=10
export RATE_LIMIT_ADMIN_LOGIN=5
```

### 3. Build & Deploy
```bash
npm ci
npm run build
npm run start
```

## Key Security Features

✅ **CSRF Protection** - All state-changing operations require tokens
✅ **CORS Security** - Explicit domain whitelisting
✅ **Email Validation** - 30+ disposable domain blocklist
✅ **Rate Limiting** - Prevents brute force attacks
✅ **Audit Logging** - Track sensitive operations
✅ **Rate Limiting** - Configurable limits per endpoint

## Important Notes

⚠️  Never commit `.env` files
⚠️  Always use HTTPS in production
⚠️  Set CORS_ORIGIN explicitly in production
⚠️  Use strong SESSION_SECRET (32+ characters)
⚠️  Never use plaintext passwords (use ADMIN_PASSWORD_HASH)

## Documentation

- **API Guide**: [API.md](API.md) - Complete API reference with examples
- **Security Guide**: [SECURITY.md](SECURITY.md) - Security configuration & best practices
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md) - Production setup & monitoring
- **Testing Guide**: [TESTING.md](TESTING.md) - Security testing procedures
- **Summary**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What was implemented

## Quick Testing

### Test CSRF Protection
```bash
# Should fail without token
curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test"}'

# Should succeed with valid token
TOKEN=$(curl -s http://localhost:3001/api/admin/me | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"companyName":"Test"}'
```

### Test Rate Limiting
```bash
# Try 7 admin logins in quick succession
for i in {1..7}; do
  curl -s -X POST http://localhost:3001/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"wrong"}' | grep -o '"message":"[^"]*'
done
# Should see "Too many requests" after 5 attempts
```

### Test Email Validation
```bash
# Should be rejected (disposable email)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tempmail.com","password":"Pass123!"}'

# Should be accepted (valid email)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company.com","password":"Pass123!"}'
```

## Support

For detailed information on any security feature, refer to the documentation files listed above.
