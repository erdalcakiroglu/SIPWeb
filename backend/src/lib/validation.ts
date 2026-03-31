export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

/**
 * Disposable email domain blocklist.
 * This is a partial list. For comprehensive protection in production,
 * consider using an external service like Kickbox or ZeroBounce.
 * Ref: https://github.com/ivolo/disposable-email-domains
 */
const disposableDomains = new Set([
  '10minutemail.com',
  '10minutemail.de',
  '1secmail.com',
  '1secmail.net',
  '1secmail.org',
  'abusemail.de',
  'burnermail.io',
  'correspondence.top',
  'cursedmail.com',
  'disposablemail.com',
  'fakeinbox.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.org',
  'mailinator.com',
  'mailnesia.com',
  'nada.email',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.cc',
  'tempmail.com',
  'tempmail.email',
  'tempmail.one',
  'temporarymail.com',
  'throwawaymail.com',
  'throwaway.email',
  'trashmail.com',
  'yopmail.com',
])

export function validateEmail(value: string) {
  const email = normalizeEmail(value)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateNonDisposableEmail(value: string) {
  const email = normalizeEmail(value)
  const atIndex = email.lastIndexOf('@')

  if (atIndex < 0) {
    return false
  }

  const domain = email.slice(atIndex + 1)
  return !disposableDomains.has(domain)
}

export function normalizePhone(value: string) {
  const trimmed = value.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

export function validatePhone(value: string) {
  const normalized = normalizePhone(value)
  return /^\+?\d{10,15}$/.test(normalized)
}

export function requireText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required.`)
  }

  return value.trim()
}

export function requirePassword(value: unknown) {
  if (typeof value !== 'string' || value.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }

  return value
}
