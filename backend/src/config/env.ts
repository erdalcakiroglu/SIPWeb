import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Uygulama kökü: dist'ten çalışırken __dirname dist'i işaret ettiği için env ile override edilebilir. */
const appRoot = process.env.APP_ROOT || path.resolve(__dirname, '..', '..')
const defaultDataDir = path.join(appRoot, 'data')

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
  /** CORS: virgülle ayrılmış origin listesi. Boş ise same-origin / geliştirme için tümü kabul edilebilir. */
  corsOrigin: process.env.CORS_ORIGIN || '',
  /** Rate limit: genel API (istek/dakika). */
  rateLimitGeneral: parseNumber(process.env.RATE_LIMIT_GENERAL, 100),
  /** Auth (login/register/activate) penceresi başına max istek. */
  rateLimitAuth: parseNumber(process.env.RATE_LIMIT_AUTH, 10),
  /** Lisans hassas uç noktaları (trial/activation-code) penceresi başına max. */
  rateLimitLicenseSensitive: parseNumber(process.env.RATE_LIMIT_LICENSE_SENSITIVE, 20),
  /** Admin login penceresi başına max. */
  rateLimitAdminLogin: parseNumber(process.env.RATE_LIMIT_ADMIN_LOGIN, 5),
}
