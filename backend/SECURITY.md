# Security Recommendations & Implementation Guide

## 1. CORS Security

### Issue: CORS Configuration
**Status**: ✅ FIXED  
**Severity**: HIGH

The CORS configuration has been hardened:

```env
# Production (required)
CORS_ORIGIN=https://sqlperformance.ai,https://app.sqlperformance.ai

# Development (optional - defaults to localhost)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

**Changes made**:
- Changed `corsOrigin` → `corsOrigins` (array-based)
- Implemented default origins based on `NODE_ENV`
- Added validation warnings for empty config
- In production, `CORS_ORIGIN` MUST be explicitly set
- Credentials: Enabled (`credentials: true`)
- Methods: Restricted to GET, POST, PATCH, DELETE, OPTIONS
- Max age: 3600 seconds (1 hour)

---

## 2. Disposable Email Validation

### Issue: Limited Blocklist
**Status**: ✅ IMPROVED  
**Severity**: MEDIUM

The disposable email blocklist has been expanded from 9 to 30 domains covering most common services:

- ✅ Includes 10MinuteMail, 1SecMail, TempMail, Guerrilla Mail, YOPMail, etc.
- ✅ Blocks temporary & throwaway email services
- ⚠️ Still not comprehensive (thousands exist)

**For Production**:

Consider integrating an external email validation service:

```typescript
// Option 1: Kickbox API (Recommended)
npm install kickbox

const kickbox = new Kickbox(process.env.KICKBOX_API_KEY)
const result = await kickbox.verify(email)
if (!result.result) throw new Error('Invalid email')

// Option 2: ZeroBounce API
// Option 3: Abstract API Email Validation

// Option 4: Build comprehensive list dynamically
// https://github.com/ivolo/disposable-email-domains
```

---

## 3. CSRF Protection for Admin Routes

### Issue: Missing CSRF Tokens
**Status**: ⚠️ TODO  
**Severity**: HIGH

Admin routes in `routes/admin.ts` lack CSRF protection. Recommended implementation:

```typescript
// Install
npm install csurf cookie-parser

// Middleware
import csrf from 'csurf'
import cookieParser from 'cookie-parser'

app.use(cookieParser())
app.use(csrf({ cookie: true }))

// Admin Routes with CSRF
router.post('/admin/customers', (req, res, next) => {
  if (req.csrfToken() !== req.body._csrf) {
    return res.status(403).json({ error: 'CSRF token invalid' })
  }
  // Process
})
```

**Or use session-based CSRF**:
```typescript
import csrf from 'csurf'

const csrfProtection = csrf({ sessionKey: 'session' })
router.post('/admin/customers', csrfProtection, (req, res) => {
  // Process
})
```

**Frontend**:
```html
<form method="POST" action="/admin/customers">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
  <!-- Form fields -->
</form>
```

---

## 4. Automatic Placeholder Customer Creation

### Issue: Unvalidated Placeholder Records
**Status**: ⚠️ TODO  
**Severity**: MEDIUM

In `lib/customers.ts`, placeholder customers are created without validation:

```typescript
// Current (Risky)
const placeholder = {
  companyName: 'Placeholder Company',
  contactEmail: email,
  verified: false,
}

// Recommended
const placeholder = {
  companyName: sanitize('Placeholder Company'),
  contactEmail: sanitizeEmail(email),
  verified: false,
  createdAt: new Date(),
  source: 'auto-generated-for-license',
}
```

**Add validation**:
- Log placeholder creation events
- Add rate limiting on placeholder generation
- Periodically clean up unverified placeholders older than 30 days
- Add audit trail

```typescript
// Cleanup job (add to server startup)
setInterval(async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await db.customers.deleteMany({
    verified: false,
    createdAt: { $lt: thirtyDaysAgo },
    source: 'auto-generated-for-license',
  })
}, 24 * 60 * 60 * 1000) // Daily
```

---

## 5. Rate Limiting Analysis

### Current Configuration (Recommended)
```env
RATE_LIMIT_GENERAL=100              # 100 req/min (all endpoints)
RATE_LIMIT_AUTH=10                  # 10 req/min (login/register)
RATE_LIMIT_LICENSE_SENSITIVE=20     # 20 req/min (trial/activation)
RATE_LIMIT_ADMIN_LOGIN=5            # 5 req/min (admin panel)
```

### Verification Commands
```bash
# Test rate limiting
for i in {1..15}; do 
  curl -X POST http://localhost:3001/auth/login -d '{}' 
  echo "Request $i"
done

# Should start getting 429 after 10 requests
```

---

## 6. Environment Variable Checklist

### Required for Production
```env
# Security
NODE_ENV=production
SESSION_SECRET=<random-32-char-string>
ADMIN_PASSWORD_HASH=<scrypt-hash>

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Email (if enabled)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=<apikey>

# Rate Limits (adjust per load)
RATE_LIMIT_AUTH=10
RATE_LIMIT_ADMIN_LOGIN=5
```

---

## 7. Testing Checklist

- [ ] CORS blocks unauthorized origins with 403
- [ ] Disposable emails (guerrillamail.com, etc.) are rejected
- [ ] Rate limits are enforced (get 429 after threshold)
- [ ] Admin routes require CSRF tokens (TODO)
- [ ] Session secret is strong (32+ chars)
- [ ] No sensitive data in logs
- [ ] Placeholder customers have audit trail

---

## 8. Deployment Steps

```bash
# 1. Generate secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Hash admin password
npm run hash-password "MySecurePassword123!"

# 3. Set environment variables
export SESSION_SECRET=<generated-secret>
export ADMIN_PASSWORD_HASH=<hashed-password>
export CORS_ORIGIN=https://yourdomain.com
export RATE_LIMIT_AUTH=10

# 4. Deploy
npm run build
npm run start
```

---

## References

- [OWASP CORS Guide](https://owasp.org/www-community/Cross-Origin_Resource_Sharing)
- [Disposable Email Domains](https://github.com/ivolo/disposable-email-domains)
- [OWASP CSRF Prevention](https://owasp.org/www-community/attacks/csrf)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
