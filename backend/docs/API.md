# Admin API Documentation

## Admin Routes

All admin routes require CSRF token and admin authentication (except login).

### Authentication

#### Admin Login
**Endpoint:** `POST /api/admin/login`

**Rate Limit:** 30 attempts per 15 minutes

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

**Response (200 OK):**
```json
{
  "message": "Admin login successful.",
  "admin": {
    "email": "admin@example.com"
  },
  "csrfToken": "token-string"
}
```

**Errors:**
- `400 Bad Request` - Invalid credentials or validation failed

---

#### Check Admin Session
**Endpoint:** `GET /api/admin/me`

**Response (200 OK - Authenticated):**
```json
{
  "authenticated": true,
  "admin": {
    "email": "admin@example.com"
  },
  "csrfToken": "token-string"
}
```

**Response (200 OK - Not Authenticated):**
```json
{
  "authenticated": false,
  "admin": null,
  "csrfToken": "token-string"
}
```

---

#### Admin Logout
**Endpoint:** `POST /api/admin/logout`

**Headers:**
```
X-CSRF-Token: <csrf-token>
```

**Response (200 OK):**
```json
{
  "message": "Admin session closed."
}
```

---

### Dashboard

#### Get Dashboard Summary
**Endpoint:** `GET /api/admin/dashboard`

**Headers:**
```
X-CSRF-Token: <csrf-token>
```

**Response (200 OK):**
```json
{
  "summary": {
    "totalCustomers": 125,
    "activeCustomers": 98,
    "totalLicenses": 345,
    "activeLicenses": 287,
    "activeActivationCodes": 45,
    "activeDevices": 129
  },
  "customers": [
    {
      "id": 1,
      "name": "John",
      "surname": "Doe",
      "fullName": "John Doe",
      "job": "DBA",
      "email": "john@example.com",
      "phone": "+1234567890",
      "companyName": "ACME Corp",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "activatedAt": "2024-01-20T14:22:00Z",
      "licenseCount": 3,
      "activeLicenseCount": 2,
      "latestLicenseActivity": "2024-02-01T16:45:00Z",
      "maxLicenses": 5
    }
  ],
  "csrfToken": "token-string"
}
```

---

### Customer Management

#### Get Customer Details
**Endpoint:** `GET /api/admin/customers/:customerId`

**Headers:**
```
X-CSRF-Token: <csrf-token>
```

**URL Parameters:**
- `customerId` (integer) - Customer ID

**Response (200 OK):**
```json
{
  "customer": {
    "id": 1,
    "publicId": "cust_000001",
    "name": "John",
    "surname": "Doe",
    "job": "DBA",
    "email": "john@example.com",
    "phone": "+1234567890",
    "companyName": "ACME Corp",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "activatedAt": "2024-01-20T14:22:00Z"
  },
  "licenses": [...],
  "activationCodes": [...],
  "events": [...],
  "csrfToken": "token-string"
}
```

**Errors:**
- `404 Not Found` - Customer not found
- `401 Unauthorized` - Admin not authenticated

---

#### Update Customer
**Endpoint:** `PATCH /api/admin/customers/:customerId`

**Headers:**
```
X-CSRF-Token: <csrf-token>
Content-Type: application/json
```

**URL Parameters:**
- `customerId` (integer) - Customer ID

**Request Body:**
```json
{
  "name": "John",
  "surname": "Doe",
  "job": "Senior DBA",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "companyName": "ACME Corp",
  "maxLicenses": 10
}
```

**Response (200 OK):**
```json
{
  "message": "Customer john.doe@example.com has been updated.",
  "detail": {
    "customer": {...},
    "licenses": [...],
    "activationCodes": [...],
    "events": [...]
  }
}
```

**Errors:**
- `400 Bad Request` - Validation failed (invalid email, phone, etc.)
- `404 Not Found` - Customer not found
- `401 Unauthorized` - Admin not authenticated

**Notes:**
- `maxLicenses` must be between 1 and 9999
- Email must be unique across all customers
- Phone must be valid format

---

#### Delete Customer
**Endpoint:** `DELETE /api/admin/customers/:customerId`

**Headers:**
```
X-CSRF-Token: <csrf-token>
```

**URL Parameters:**
- `customerId` (integer) - Customer ID

**Response (200 OK):**
```json
{
  "message": "Customer john@example.com has been deleted.",
  "deletedCustomerId": 1,
  "deletedCustomerEmail": "john@example.com"
}
```

**Errors:**
- `404 Not Found` - Customer not found
- `401 Unauthorized` - Admin not authenticated

**Notes:**
- Deletion cascades to all related records (licenses, activation codes, events)

---

### License Management

#### Create License
**Endpoint:** `POST /api/admin/customers/:customerId/licenses`

**Headers:**
```
X-CSRF-Token: <csrf-token>
Content-Type: application/json
```

**URL Parameters:**
- `customerId` (integer) - Customer ID

**Request Body (Optional):**
```json
{
  "licenseName": "Development License",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

Fields are optional:
- `licenseName` (string) - Display name for the license. If not provided, generates default name with customer email and counter
- `expiresAt` (string, ISO 8601) - License expiration date. If not provided, no expiration is set

**Response (200 OK):**
```json
{
  "message": "New license has been created for customer 1.",
  "detail": {
    "customer": {...},
    "licenses": [
      {
        "id": 12346,
        "publicId": "lic_012346",
        "licenseName": "Development License",
        "email": "john@example.com",
        "status": "active",
        "createdAt": "2024-02-01T16:45:00Z",
        "expiresAt": "2026-12-31T23:59:59Z",
        "updatedAt": "2024-02-01T16:45:00Z"
      }
    ],
    "activationCodes": [...],
    "events": [...]
  },
  "csrfToken": "token-string"
}
```

**Errors:**
- `400 Bad Request` - Validation failed (invalid date format, empty license name, etc.)
- `400 Bad Request` - Customer has reached maximum licenses limit
- `404 Not Found` - Customer not found
- `401 Unauthorized` - Admin not authenticated

**Validation Rules:**
- Customer cannot exceed their `maxLicenses` limit (set by admin in customer settings)
- License name cannot be empty
- `expiresAt` must be valid ISO 8601 format if provided

**Examples:**

Create license with default name and no expiration:
```bash
curl -X POST http://localhost:3000/api/admin/customers/1/licenses \
  -H "X-CSRF-Token: token-string" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Create license with custom name and expiration:
```bash
curl -X POST http://localhost:3000/api/admin/customers/1/licenses \
  -H "X-CSRF-Token: token-string" \
  -H "Content-Type: application/json" \
  -d '{
    "licenseName": "Production License",
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

Create license with only expiration:
```bash
curl -X POST http://localhost:3000/api/admin/customers/1/licenses \
  -H "X-CSRF-Token: token-string" \
  -H "Content-Type: application/json" \
  -d '{"expiresAt": "2025-12-31T23:59:59Z"}'
```

---

#### Update License
**Endpoint:** `PATCH /api/admin/customers/:customerId/licenses/:licenseId`

**Headers:**
```
X-CSRF-Token: <csrf-token>
Content-Type: application/json
```

**URL Parameters:**
- `customerId` (integer) - Customer ID (for context in response)
- `licenseId` (integer) - License ID to update

**Request Body:**
```json
{
  "expiresAt": "2025-12-31T23:59:59Z",
  "status": "active"
}
```

Both fields are optional; provide only what you want to update:

- `expiresAt` (string, ISO 8601) - New expiration date
  - Format: `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DD`
  - Example: `2025-12-31T23:59:59Z`

- `status` (string) - New license status
  - Allowed values: `active`, `trial_active`, `expired`, `revoked`, `suspended`

**Response (200 OK):**
```json
{
  "message": "License 12345 has been updated.",
  "detail": {
    "customer": {...},
    "licenses": [
      {
        "id": 12345,
        "publicId": "lic_012345",
        "name": "SQL Performance Intelligence",
        "email": "john@example.com",
        "activationMethod": "code-based",
        "status": "active",
        "createdAt": "2024-01-20T14:22:00Z",
        "expiresAt": "2025-12-31T23:59:59Z",
        "updatedAt": "2024-02-01T16:45:00Z"
      }
    ],
    "activationCodes": [...],
    "events": [...]
  },
  "csrfToken": "token-string"
}
```

**Errors:**
- `400 Bad Request` - Validation failed (invalid date format, invalid status, no fields to update)
- `404 Not Found` - License not found
- `401 Unauthorized` - Admin not authenticated

**Examples:**

Extend license expiration:
```bash
curl -X PATCH http://localhost:3000/api/admin/licenses/12345 \
  -H "X-CSRF-Token: token-string" \
  -H "Content-Type: application/json" \
  -d '{"expiresAt": "2026-12-31T23:59:59Z"}'
```

Change license status:
```bash
curl -X PATCH http://localhost:3000/api/admin/licenses/12345 \
  -H "X-CSRF-Token: token-string" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended"}'
```

Update both expiration and status:
```bash
curl -X PATCH http://localhost:3000/api/admin/licenses/12345 \
  -H "X-CSRF-Token: token-string" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresAt": "2025-06-30T23:59:59Z",
    "status": "active"
  }'
```

---

## Common Patterns

### CSRF Token Management

1. **Get CSRF Token:**
   - Call `GET /api/admin/me` to retrieve current CSRF token
   - Token is included in response regardless of authentication state

2. **Include in Requests:**
   - Add `X-CSRF-Token` header to all state-changing requests (POST, PATCH, DELETE)
   - GET requests do not require CSRF token

3. **Refresh Token:**
   - Every response includes a new CSRF token
   - Use the latest token in subsequent requests

### Error Handling

All errors return JSON with `message` field:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `400 Bad Request` - Validation or input error
- `401 Unauthorized` - Admin authentication required or token expired
- `404 Not Found` - Resource not found

### Rate Limiting

- **Admin Login:** 30 attempts per 15 minutes per IP
- **Other endpoints:** No specific rate limit (general server rate limit applies)

If rate limit exceeded:
```json
{
  "message": "Too many attempts. Please try again in 15 minutes."
}
```

---

## Security Notes

- All admin endpoints require active session (`adminAuthenticated` flag)
- CSRF tokens are session-specific and rotate after each request
- Passwords are hashed with scrypt algorithm
- Email addresses are normalized in database
- All sensitive operations are logged with timestamps
