import path from 'node:path'
import dotenv from 'dotenv'

// Try to load .env from multiple possible locations
const envPath = path.resolve(__dirname, '..', '..', '.env')
dotenv.config({ path: envPath })

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Uygulama kökü: dist'ten çalışırken __dirname dist'i işaret ettiği için env ile override edilebilir. */
const appRoot = process.env.APP_ROOT || path.resolve(__dirname, '..', '..')
const defaultDataDir = path.join(appRoot, 'data')

/** Default CORS origins based on environment. */
function getDefaultCorsOrigins(): string[] {
  if (process.env.NODE_ENV === 'production') {
    return ['https://sqlperformance.ai', 'https://app.sqlperformance.ai']
  }
  return ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
}

export const env = {
  port: parseNumber(process.env.PORT, 3001),
  sessionSecret: process.env.SESSION_SECRET || 'sqlperformance-local-session-secret',
  /** Veritabanı ve session dosyaları için dizin. */
  dataDir: process.env.DATA_DIR || defaultDataDir,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@sqlperformance.ai',
  /** Düz metin (geriye uyumluluk). ADMIN_PASSWORD_HASH varsa o kullanılır. */
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin12345!',
  /** Scrypt formatı: salt:hash (password.ts ile üretilir). Varsa admin girişi buna göre doğrulanır. */
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpSecure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@example.com',
  /** CORS origins: virgülle ayrılmış liste. Boş ise environment'a göre default'lar kullanılır. PRODUCTION'da mutlaka explicit liste belirt. */
  corsOrigins: (process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean) || getDefaultCorsOrigins()),
  /** Rate limit: genel API (istek/dakika). */
  rateLimitGeneral: parseNumber(process.env.RATE_LIMIT_GENERAL, 100),
  /** Auth (login/register/activate) penceresi başına max istek. 15 dakika içinde 15-30 masuk. */
  rateLimitAuth: parseNumber(process.env.RATE_LIMIT_AUTH, 30),
  /** Lisans hassas uç noktaları (trial/activation-code) penceresi başına max. */
  rateLimitLicenseSensitive: parseNumber(process.env.RATE_LIMIT_LICENSE_SENSITIVE, 20),
  /** Admin login penceresi başına max. */
  rateLimitAdminLogin: parseNumber(process.env.RATE_LIMIT_ADMIN_LOGIN, 5),
}
