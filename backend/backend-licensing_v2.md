# Backend Licensing v2

This document defines what the website/backend side must do for the licensing system used by the desktop application.

It is aligned with the current client implementation in:

- `app/services/license_service.py`
- `app/core/config.py`
- `app/ui/views/settings_view.py`
- `docs/license-architecture.md`
- `scripts/license_token_tool.py`

The target model is:

- one canonical signed license token
- two delivery channels:
  - online activation
  - offline `.lic` download
- one source of truth: the backend

## 1. Goal

The backend must support these commercial and technical scenarios:

1. A user signs up on the website.
2. A user starts a trial.
3. A user purchases a paid license.
4. A user binds a `Device ID` to their entitlement.
5. A user can either:
   - download a `.lic` file for offline use
   - activate online from inside the desktop app
6. The desktop app can validate the installed license later.
7. Support can revoke, reset, or move a device when necessary.

Important design rule:

- do not build separate logic for `.lic` and online activation
- both flows must end in the same canonical signed token

## 2. Current Desktop Contract

The client already expects these behaviors.

### 2.1 Trial start

Endpoint:

```text
POST /api/trial/start
```

Request body:

```json
{
  "email": "name@company.com",
  "device_id": "sha256-device-id",
  "client": {
    "platform": "Windows",
    "platform_release": "11"
  }
}
```

### 2.2 Request activation code

Endpoint:

```text
POST /api/license/activation-code
```

Current request body sent by the app:

```json
{
  "email": "ada@example.com",
  "password": "StrongPass123",
  "deviceId": "APP-DEVICE-001",
  "serverUrl": "https://license.yourcompany.com/api",
  "licenseName": "Desktop License"
}
```

Current client behavior:

- this endpoint is used to fetch a short activation code from the backend
- the app accepts any of these response fields:
  - `activationCode`
  - `activation_code`
  - `licenseCode`
  - `license_code`

Recommended response:

```json
{
  "activationCode": "ACT-2026-000123",
  "expiresAt": "2026-03-13T13:00:00Z",
  "message": "Activation code generated"
}
```

### 2.3 Activate paid license

Endpoint:

```text
POST /api/license/activate
```

Current request body sent by the app:

```json
{
  "activation_code": "ACT-2026-000123",
  "activationCode": "ACT-2026-000123",
  "email": "ada@example.com",
  "device_id": "sha256-device-id",
  "deviceId": "sha256-device-id",
  "client": {
    "platform": "Windows",
    "platform_release": "11"
  }
}
```

Recommended response:

```json
{
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "status": "active",
  "expires_at": "2026-09-13T12:00:00Z",
  "refresh_after": "2026-03-20T12:00:00Z",
  "offline_grace_until": "2026-09-20T12:00:00Z",
  "allowed_devices": 1,
  "license_count": 1,
  "message": "License activated"
}
```

### 2.4 Validate installed license

Endpoint:

```text
POST /api/license/validate
```

Headers:

```text
Authorization: Bearer <signed-license-token>
```

Request body:

```json
{
  "device_id": "sha256-device-id",
  "deviceId": "sha256-device-id"
}
```

Recommended response:

```json
{
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "status": "active",
  "expires_at": "2026-09-13T12:00:00Z",
  "refresh_after": "2026-03-20T12:00:00Z",
  "offline_grace_until": "2026-09-20T12:00:00Z",
  "allowed_devices": 1,
  "license_count": 1,
  "message": "License validated"
}
```

### 2.5 Offline `.lic` import

The desktop app now supports a signed `.lic` wrapper format:

```json
{
  "format": "SPAI1-LIC",
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "exported_at": "2026-03-13T12:00:00Z"
}
```

The wrapper is not trusted by itself.

The trust object is always:

```text
token
```

## 3. Recommended Backend Responsibilities

The backend must own these decisions:

- whether a user is eligible for a trial
- whether a paid license exists
- whether a device may be bound
- whether a license is revoked, suspended, expired, or active
- what `expires_at`, `refresh_after`, and `offline_grace_until` should be
- signing the canonical token
- producing the same token through API and `.lic` export
- recording audit events

The desktop app must not decide commercial entitlement on its own.

## 4. Recommended System Components

Build the backend as these logical parts:

### 4.1 Customer portal

This is the website UI where the customer:

- signs up
- logs in
- sees purchased licenses
- sees allowed seats/devices
- pastes or registers `Device ID`
- downloads `.lic`
- requests a fresh activation code
- releases or renames devices if your policy allows it

### 4.2 Licensing API

This is the API consumed by the desktop app:

- `/trial/start`
- `/license/activation-code`
- `/license/activate`
- `/license/validate`
- optional `/license/deactivate`

### 4.3 Licensing domain service

This layer contains business rules:

- entitlement lookup
- activation code issuance
- device binding rules
- trial eligibility
- token payload creation
- signing
- revocation

### 4.4 Persistence layer

This stores:

- users
- licenses
- activation codes
- device bindings
- trials
- audit events
- signing key metadata

## 5. Canonical Token Model

The canonical token format is:

```text
SPAI1.<payload_b64url>.<signature_b64url>
```

The backend must sign the canonical JSON payload bytes using Ed25519.

Recommended payload fields:

```json
{
  "format_version": "SPAI1",
  "license_id": "lic_000123",
  "license_name": "Desktop License",
  "license_type": "subscription",
  "license_code": "ACT-2026-000123",
  "status": "active",
  "customer_email": "ada@example.com",
  "device_id": "sha256-device-id",
  "issued_at": "2026-03-13T12:00:00Z",
  "expires_at": "2026-09-13T12:00:00Z",
  "refresh_after": "2026-03-20T12:00:00Z",
  "offline_grace_until": "2026-09-20T12:00:00Z",
  "license_count": 1,
  "allowed_devices": 1,
  "features": ["all_modules"]
}
```

Rules:

- do not put secrets inside the payload
- payload must be UTF-8 JSON
- payload must be serialized with sorted keys
- payload must be serialized without extra whitespace
- signature must be computed on canonical payload bytes

Pseudo-code:

```python
payload_bytes = json.dumps(
    payload,
    sort_keys=True,
    separators=(",", ":"),
).encode("utf-8")

signature = ed25519_private_key.sign(payload_bytes)

token = (
    "SPAI1."
    + b64url(payload_bytes)
    + "."
    + b64url(signature)
)
```

## 6. Data Model

A relational database is recommended. CSV is acceptable only for a very small MVP.

### 6.1 `users`

Suggested columns:

| Column | Notes |
| --- | --- |
| `user_id` | Internal PK |
| `email` | Unique login/email |
| `password_hash` | Website auth only |
| `full_name` | Optional |
| `company_name` | Optional |
| `status` | `active`, `disabled` |
| `created_at` | Audit |
| `updated_at` | Audit |

### 6.2 `licenses`

Represents the commercial entitlement.

| Column | Notes |
| --- | --- |
| `license_id` | Internal PK |
| `user_id` | Owner |
| `license_name` | Example: `Desktop License` |
| `license_type` | `trial`, `subscription`, `perpetual` |
| `status` | `active`, `expired`, `revoked`, `suspended` |
| `starts_at` | Optional commercial start |
| `expires_at` | Required for subscriptions/trials |
| `allowed_devices` | Device limit |
| `license_count` | Seats shown in app |
| `features_json` | Feature flags |
| `notes` | Support/admin note |
| `created_at` | Audit |
| `updated_at` | Audit |

### 6.3 `license_devices`

Represents device bindings.

| Column | Notes |
| --- | --- |
| `license_device_id` | Internal PK |
| `license_id` | Parent license |
| `device_id` | Desktop-generated fingerprint |
| `status` | `active`, `released`, `revoked` |
| `first_seen_at` | First activation |
| `last_seen_at` | Last validation |
| `last_ip` | Optional |
| `last_platform` | Optional |
| `last_app_version` | Optional |
| `created_at` | Audit |
| `updated_at` | Audit |

Recommended unique rule:

- only one active row per `license_id + device_id`

### 6.4 `activation_codes`

This table is important if you want short-lived codes.

| Column | Notes |
| --- | --- |
| `activation_code_id` | Internal PK |
| `license_id` | Parent license |
| `user_id` | Requesting user |
| `code` | Human-entered code |
| `status` | `active`, `used`, `expired`, `revoked` |
| `device_id` | Optional pre-bound device |
| `issued_at` | When created |
| `expires_at` | Keep short, for example 10-30 minutes |
| `used_at` | When consumed |
| `used_by_device_id` | Device that consumed it |
| `created_via` | `website`, `api`, `support` |

Recommended rule:

- activation codes should be short-lived and single-use

### 6.5 `trial_activations`

| Column | Notes |
| --- | --- |
| `trial_id` | Internal PK |
| `email` | Trial email |
| `device_id` | Trial device |
| `status` | `trial_active`, `trial_expired`, `blocked` |
| `issued_at` | Start time |
| `expires_at` | Trial end |
| `created_at` | Audit |

Recommended unique policy:

- one trial per device
- optionally one trial per email

### 6.6 `license_events`

Audit everything important.

| Column | Notes |
| --- | --- |
| `event_id` | Internal PK |
| `license_id` | Related license |
| `user_id` | Actor if known |
| `event_type` | `trial_started`, `activation_code_issued`, `license_activated`, `license_validated`, `license_downloaded`, `device_released`, `license_revoked` |
| `device_id` | Optional |
| `payload_json` | Context snapshot |
| `created_at` | Timestamp |

### 6.7 `signing_keys`

If you plan rotation, track keys explicitly.

| Column | Notes |
| --- | --- |
| `key_id` | Internal PK |
| `algorithm` | `ed25519` |
| `public_key_pem` | Stored for audit/reference |
| `private_key_reference` | KMS/secret-store reference only |
| `status` | `active`, `retired` |
| `created_at` | Audit |
| `retired_at` | Optional |

Recommended rule:

- private key material should live in KMS, HSM, or a locked secret store

## 7. Main Flows

### 7.1 Trial flow

1. User opens the app and enters email.
2. App generates `Device ID`.
3. App calls `POST /api/trial/start`.
4. Backend checks eligibility.
5. Backend creates or updates a trial record.
6. Backend issues a signed token with:
   - `status=trial_active`
   - `device_id`
   - `expires_at`
   - `refresh_after`
   - `offline_grace_until`
7. Backend returns token plus convenience fields.
8. App persists token locally.

### 7.2 Website purchase flow

1. User signs up or logs in on the website.
2. User purchases a license.
3. Backend creates a `licenses` row.
4. Backend exposes license details in the customer portal.
5. User sees:
   - license name
   - plan
   - expiry
   - device limit

### 7.3 Offline `.lic` flow

1. User opens the app.
2. User copies `Device ID`.
3. User logs in to the website.
4. User opens the purchased license page.
5. User pastes `Device ID`.
6. Backend checks that the license can bind that device.
7. Backend creates or reuses the `license_devices` binding.
8. Backend issues the canonical signed token.
9. Backend wraps it in:

```json
{
  "format": "SPAI1-LIC",
  "token": "SPAI1.<payload>.<signature>",
  "exported_at": "2026-03-13T12:00:00Z"
}
```

10. Website lets the user download the file.
11. User imports the file in the desktop app.

Important rule:

- the `.lic` file must be device-bound if offline usage is intended to stay locked to one machine

### 7.4 Online activation flow

Recommended current v2 flow, aligned with the app:

1. User opens `Settings > License`.
2. User enters website email and password.
3. App calls `POST /api/license/activation-code`.
4. Backend authenticates the website user.
5. Backend looks up the purchased license matching:
   - user
   - `licenseName`
   - optional device availability
6. Backend issues a short-lived activation code.
7. App receives the activation code.
8. App calls `POST /api/license/activate`.
9. Backend consumes the activation code.
10. Backend binds the device if allowed.
11. Backend issues the canonical signed token.
12. App stores the token locally.

Important rule:

- the activation code is not the license
- the activation code is only a one-time claim ticket for the signed token

### 7.5 Validation flow

1. App sends `Authorization: Bearer <token>`.
2. Backend parses the token.
3. Backend verifies:
   - format
   - signature
   - referenced license record
   - current license status
   - device status
4. Backend updates `last_seen_at`.
5. Backend issues a refreshed token if needed.
6. Backend returns the refreshed state.

Recommended behavior:

- re-issue a fresh token on validation when dates or status changed
- otherwise you may return the same token plus refreshed convenience fields

### 7.6 Device release flow

Recommended endpoint:

```text
POST /api/license/deactivate
```

Use this when:

- user changes computer
- machine is rebuilt
- support resets the seat

Recommended request:

```json
{
  "license_id": "lic_000123",
  "device_id": "sha256-device-id"
}
```

## 8. Endpoint Definitions

### 8.1 `POST /api/license/activation-code`

Purpose:

- authenticate the customer and issue a short-lived activation code

Input:

```json
{
  "email": "ada@example.com",
  "password": "StrongPass123",
  "deviceId": "sha256-device-id",
  "serverUrl": "https://license.yourcompany.com/api",
  "licenseName": "Desktop License"
}
```

Backend checks:

- user exists
- password is valid
- `licenseName` belongs to this customer or is otherwise resolvable
- license is active and purchasable
- device can be assigned or at least considered for assignment

Output:

```json
{
  "activationCode": "ACT-2026-000123",
  "expiresAt": "2026-03-13T13:00:00Z",
  "message": "Activation code generated"
}
```

Recommended implementation notes:

- do not return the full signed license token from this endpoint
- keep this code short-lived
- rate-limit it
- mark it `used` when activation succeeds

### 8.2 `POST /api/license/activate`

Purpose:

- consume activation code and return a signed license token

Input:

```json
{
  "activation_code": "ACT-2026-000123",
  "activationCode": "ACT-2026-000123",
  "email": "ada@example.com",
  "device_id": "sha256-device-id",
  "deviceId": "sha256-device-id",
  "client": {
    "platform": "Windows",
    "platform_release": "11",
    "app_version": "1.0.7"
  }
}
```

Backend algorithm:

1. Resolve `activation_code` from snake or camel case.
2. Resolve `device_id` from snake or camel case.
3. Validate that code exists, is active, and is not expired.
4. Validate customer and entitlement.
5. Validate device-limit rules.
6. Upsert `license_devices`.
7. Create payload.
8. Sign payload.
9. Return token and convenience fields.

Recommended response:

```json
{
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "status": "active",
  "expires_at": "2026-09-13T12:00:00Z",
  "refresh_after": "2026-03-20T12:00:00Z",
  "offline_grace_until": "2026-09-20T12:00:00Z",
  "allowed_devices": 1,
  "license_count": 1,
  "activationCode": "ACT-2026-000123",
  "message": "License activated"
}
```

### 8.3 `POST /api/license/validate`

Purpose:

- confirm the currently installed license is still valid

Input:

- bearer token in `Authorization`
- `device_id` or `deviceId` in body

Backend algorithm:

1. Parse token.
2. Verify signature.
3. Read payload.
4. Load the current license from the database.
5. Check revocation/expiry/suspension.
6. Check that the device is still allowed.
7. Refresh `last_seen_at`.
8. Re-issue token if needed.

Recommended response:

```json
{
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "status": "active",
  "expires_at": "2026-09-13T12:00:00Z",
  "refresh_after": "2026-03-20T12:00:00Z",
  "offline_grace_until": "2026-09-20T12:00:00Z",
  "allowed_devices": 1,
  "license_count": 1,
  "message": "License validated"
}
```

### 8.4 `GET /api/license/download/{license_id}`

Purpose:

- allow logged-in customers to download an offline `.lic`

Recommended query:

```text
GET /api/license/download/lic_000123?deviceId=sha256-device-id
```

Backend algorithm:

1. Authenticate website session.
2. Verify the customer owns the license.
3. Verify or create device binding.
4. Issue canonical token.
5. Wrap token in `SPAI1-LIC`.
6. Return downloadable JSON file.

Response headers:

```text
Content-Type: application/json
Content-Disposition: attachment; filename="Desktop-License-lic_000123.lic"
```

## 9. Business Rules

### 9.1 Trial vs paid

Paid license must always win over trial state.

If the user activates a paid license:

- app should become `active`
- trial should no longer be the effective state

### 9.2 Device binding

Recommended default policy:

- one paid desktop license binds to one device
- if `allowed_devices > 1`, each active device needs a row in `license_devices`
- same device may revalidate without consuming a new seat
- a new device consumes a seat only when it is not already active

### 9.3 Offline grace

Recommended meaning:

- the app may continue to use the cached signed token until `offline_grace_until`
- after that, the user must validate online again unless they install a newer `.lic`

### 9.4 Revocation

If support revokes a license:

- backend status changes to `revoked`
- next validation returns `revoked`
- any newly issued token must reflect `status=revoked`

### 9.5 Perpetual licenses

If you plan perpetual licenses, do not overload subscription rules.

Use:

- `license_type=perpetual`
- optional `support_expires_at` if needed

## 10. Security Requirements

### 10.1 Signing keys

- use Ed25519
- keep the private key outside the repo
- store private key in KMS, HSM, or secure secret storage
- ship only the public key to the desktop app

### 10.2 Transport security

- use HTTPS only in production
- never expose activation code or token endpoints over plain HTTP

### 10.3 Authentication

Current v2 app flow sends website `email + password` to `/license/activation-code`.

This is acceptable only if:

- TLS is enforced
- rate limits exist
- brute-force protections exist
- password handling follows website auth standards

Recommended future improvement:

- website login creates a short-lived claim code
- desktop app enters only that claim code
- desktop app no longer sends website password directly

### 10.4 Abuse protection

- rate-limit `trial/start`
- rate-limit `license/activation-code`
- rate-limit `license/activate`
- log repeated failed attempts
- detect repeated activation code replays

## 11. Operational Checklist

Before production, confirm:

- signed token issuance is implemented
- public key distribution to the app is finalized
- device reset workflow exists
- support tooling exists for revoke/reset/reissue
- audit events are recorded
- trial abuse policy is defined
- backup and restore strategy exists for license data
- clock synchronization is reliable on backend servers

## 12. Recommended MVP Delivery Order

### Phase 1

- implement database tables
- implement Ed25519 signing
- implement `POST /api/trial/start`
- implement `POST /api/license/activate`
- implement `POST /api/license/validate`
- implement `GET /api/license/download/{license_id}`

### Phase 2

- implement `POST /api/license/activation-code`
- add website screen for device registration
- add customer download page for `.lic`
- add audit event screens for support

### Phase 3

- implement `POST /api/license/deactivate`
- implement key rotation
- replace password-based activation-code flow with session-based claim flow

## 13. Final Recommendation

The backend should be built around one rule:

- the signed token is the license

Everything else is only transport or workflow:

- activation code = short-lived claim ticket
- `.lic` file = offline wrapper
- validate endpoint = refresh and enforcement channel
- website portal = customer self-service layer

If this rule is preserved, the system stays consistent, testable, and supportable.
