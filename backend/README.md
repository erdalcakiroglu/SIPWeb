# SQL Performance Intelligence™ Backend

Authentication and license server backend for the [SQL Performance Intelligence™](https://sqlperformance.ai) desktop application.

## Features

- Login, registration, email activation, and account page
- SQLite storage in `data/SQLPerf.db`
- Trial license API
- Short-lived activation-code API
- Device-bound commercial activation API
- Token refresh and deactivation API
- `.lic` export API for offline delivery
- Ed25519-signed `SPAI1` license tokens

## Setup

```powershell
cd C:\Users\erdal.cakiroglu\PycharmProjects\SPStudioProWeb-v2.2\backend
copy .env.example .env
npm install
npm run dev
```

Open:

- `http://localhost:3001`

## Environment

See `.env.example`. Notable options:

- **DATA_DIR** — Veritabanı ve session dosyaları (varsayılan: `data/`). Production’da mutlak path önerilir.
- **CORS_ORIGIN** — Virgülle ayrılmış izin verilen origin listesi (boş = hepsi).
- **ADMIN_PASSWORD_HASH** — Üretim için admin şifresini scrypt hash ile saklayın; yoksa `ADMIN_PASSWORD` düz metin kullanılır.
- **RATE_LIMIT_***** — Genel, auth, lisans ve admin login için istek limitleri.

## Production

```powershell
npm run build
npm run serve
```

Session’lar `DATA_DIR/sessions` altında dosya olarak saklanır. CORS ve `SESSION_SECRET` mutlaka ayarlayın.

## License Server API

Routes:

- `POST /api/trial/start`
- `POST /api/license/activation-code`
- `POST /api/license/activate`
- `POST /api/license/validate`
- `POST /api/license/deactivate`
- `GET /api/license/download/:licenseCode`
- `GET /api/license/public-key`

### Start trial

```json
POST /api/trial/start
{
  "email": "ada@example.com",
  "device_id": "APP-DEVICE-001",
  "server_url": "https://license.yourcompany.com"
}
```

### Generate activation code

```json
POST /api/license/activation-code
{
  "email": "ada@example.com",
  "password": "StrongPass123",
  "deviceId": "APP-DEVICE-001",
  "serverUrl": "https://license.yourcompany.com",
  "licenseName": "Desktop License"
}
```

Recommended response fields:

```json
{
  "activationCode": "ACT-2026-000123",
  "activation_code": "ACT-2026-000123",
  "licenseCode": "ACT-2026-000123",
  "license_code": "ACT-2026-000123",
  "expiresAt": "2026-03-13T13:00:00Z",
  "expires_at": "2026-03-13T13:00:00Z"
}
```

### Activate commercial license

```json
POST /api/license/activate
{
  "email": "ada@example.com",
  "activation_code": "ACT-2026-000123",
  "device_id": "APP-DEVICE-001",
  "client": {
    "platform": "Windows",
    "platform_release": "11",
    "app_version": "1.0.7"
  }
}
```

### Validate installed license

```text
POST /api/license/validate
Authorization: Bearer SPAI1.<payload_b64url>.<signature_b64url>
```

```json
{
  "device_id": "APP-DEVICE-001"
}
```

### Deactivate installed license

```text
POST /api/license/deactivate
Authorization: Bearer SPAI1.<payload_b64url>.<signature_b64url>
```

```json
{
  "device_id": "APP-DEVICE-001"
}
```

### Download `.lic`

```text
GET /api/license/download/lic_000123?deviceId=APP-DEVICE-001
```

## Notes

- If SMTP settings are not configured, activation emails are written to `data/mail-outbox.log`.
- Customer profile data is stored in the `Customers` table.
- License records are stored in `Licenses`, `LicenseDevices`, `ActivationCodes`, `TrialActivations`, and `LicenseEvents`.
- On first startup, the backend generates Ed25519 keys under `data/license-keys/`.

## Admin Panel

- Admin login URL: `http://localhost:3001/admin/login`
- Admin panel URL: `http://localhost:3001/admin`
- Default development credentials:
  - Email: `admin@sqlperformance.ai`
  - Password: `Admin12345!`


 - Normal User :
    erdalcakiroglu@gmail.com
    olcaycakiroglu@gmail.com
    kazma123
- Override them with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.
