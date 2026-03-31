# Backend API Documentation - Security Features

## Authentication & Authorization

### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@sqlperformance.ai",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200)**:
```json
{
  "message": "Admin login successful.",
  "admin": {
    "email": "admin@sqlperformance.ai"
  },
  "csrfToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Response (Failure - 400)**:
```json
{
  "message": "Invalid credentials or user not found."
}
```

### Admin Status
```http
GET /api/admin/me
```

**Response**:
```json
{
  "authenticated": true,
  "admin": {
    "email": "admin@sqlperformance.ai"
  },
  "csrfToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

### Admin Logout
```http
POST /api/admin/logout
```

---

## CSRF Protection

### Overview
All state-changing operations (POST, PATCH, DELETE) require a valid CSRF token.

### How to Use

**Step 1: Get CSRF Token (from any admin endpoint)**
```http
GET /api/admin/me
```

Response includes:
```json
{
  "csrfToken": "token_value_here"
}
```

**Step 2: Include Token in Request**

Option A - Form body:
```http
PATCH /api/admin/customers/123
Content-Type: application/json

{
  "_csrf": "token_value_here",
  "companyName": "New Company Name"
}
```

Option B - Header:
```http
PATCH /api/admin/customers/123
Content-Type: application/json
X-CSRF-Token: token_value_here

{
  "companyName": "New Company Name"
}
```

### Error Responses

**Missing Token (403)**:
```json
{
  "error": "CSRF token missing",
  "message": "No CSRF token provided in request"
}
```

**Invalid Token (403)**:
```json
{
  "error": "CSRF token invalid",
  "message": "CSRF token validation failed"
}
```

---

## Admin Dashboard

### Get Dashboard Data
```http
GET /api/admin/dashboard
```

**Response**:
```json
{
  "summary": {
    "totalCustomers": 42,
    "activeCustomers": 38,
    "totalLicenses": 120,
    "activeLicenses": 115,
    "activeActivationCodes": 8,
    "activeDevices": 45
  },
  "customers": [
    {
      "id": 1,
      "email": "john@company.com",
      "companyName": "Company Inc",
      "licenseCount": 3,
      "activeLicenseCount": 2,
      "maxLicenses": 5
    }
  ],
  "csrfToken": "token_here"
}
```

---

## Customer Management

### Get Customer Details
```http
GET /api/admin/customers/:customerId
```

**Response**:
```json
{
  "customer": {
    "id": 123,
    "name": "John",
    "surname": "Doe",
    "email": "john@company.com",
    "companyName": "Company Inc"
  },
  "csrfToken": "token_here",
  "maxLicenses": 5
}
```

### Update Customer
```http
PATCH /api/admin/customers/123
Content-Type: application/json

{
  "_csrf": "token_here",
  "companyName": "Updated Company",
  "maxLicenses": 5
}
```

**Response**:
```json
{
  "message": "Customer john@company.com has been updated.",
  "detail": {
    "customer": {
      "id": 123,
      "email": "john@company.com"
    }
  }
}
```

### Delete Customer
```http
DELETE /api/admin/customers/123
Content-Type: application/json

{
  "_csrf": "token_here"
}
```

**Response**:
```json
{
  "message": "Customer john@company.com has been deleted.",
  "deletedCustomerId": 123,
  "deletedCustomerEmail": "john@company.com"
}
```

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 req | 1 minute |
| Auth (login/register) | 10 req | 1 minute |
| License sensitive (trial/activation) | 20 req | 1 minute |
| Admin login | 5 req | 1 minute |

### Rate Limit Response (429)
```json
{
  "message": "Too many requests, please try again later."
}
```

---

## Email Validation

### Requirements
- Valid email format (RFC 5322)
- Not a disposable/temporary email domain
- Examples of blocked domains:
  - guerrillamail.com
  - tempmail.com
  - 10minutemail.com
  - mailinator.com
  - Many others...

### Error Response
```json
{
  "error": "Disposable email addresses are not allowed for licensing."
}
```

---

## CORS Configuration

### Production Setup
```env
CORS_ORIGIN=https://sqlperformance.ai,https://app.sqlperformance.ai
```

### Allowed Methods
- GET
- POST
- PATCH
- DELETE
- OPTIONS

### Credentials
Enabled (cookies will be sent/received)

### Max Age
3600 seconds (1 hour)

### Error Response (403)
```json
{
  "message": "Cross-Origin Request Blocked"
}
```

---

## Error Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (CSRF token invalid, CORS blocked) |
| 404 | Not found |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

---

## Testing with cURL

### Get CSRF Token
```bash
curl -X GET http://localhost:3001/api/admin/me \
  -H "Content-Type: application/json"
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sqlperformance.ai",
    "password": "Admin12345!"
  }' \
  -c cookies.txt
```

### Get Admin Session & CSRF Token
```bash
curl -X GET http://localhost:3001/api/admin/me \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### Update Customer (with CSRF)
```bash
TOKEN="your_csrf_token_here"

curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -b cookies.txt \
  -d '{
    "companyName": "New Company Name"
  }'
```

---

## Testing with Postman

1. **Create Collection**: "SQL Performance Admin API"
2. **Add Variable**: `base_url = http://localhost:3001`
3. **Add Variable**: `csrf_token = {{csrfToken}}`

### Request 1: Login
```
POST {{base_url}}/api/admin/login
Body: {
  "email": "admin@sqlperformance.ai",
  "password": "Admin12345!"
}
Tests Tab:
pm.collectionVariables.set("csrf_token", pm.response.json().csrfToken)
```

### Request 2: Get Dashboard
```
GET {{base_url}}/api/admin/dashboard
Tests Tab:
pm.collectionVariables.set("csrf_token", pm.response.json().csrfToken)
```

### Request 3: Update Customer
```
PATCH {{base_url}}/api/admin/customers/1
Headers: {
  "X-CSRF-Token": "{{csrf_token}}"
}
Body: {
  "companyName": "Updated Name"
}
```

---

## Frontend Integration

### React/TypeScript Example

```typescript
// 1. Login
async function adminLogin(email: string, password: string) {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  localStorage.setItem('csrfToken', data.csrfToken)
  return data
}

// 2. Update Customer
async function updateCustomer(id: number, updates: Record<string, unknown>) {
  const csrfToken = localStorage.getItem('csrfToken')
  
  const response = await fetch(`/api/admin/customers/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken || '',
    },
    body: JSON.stringify(updates),
  })
  
  if (response.status === 403) {
    // Token expired, refresh
    const me = await fetch('/api/admin/me')
    const data = await me.json()
    localStorage.setItem('csrfToken', data.csrfToken)
    return updateCustomer(id, updates) // Retry
  }
  
  return response.json()
}
```

