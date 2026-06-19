// Rastgele kimlik/kod üreticileri (Web Crypto).

export function randomCode(prefix = 'act') {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const value = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${prefix}_${value}`
}

export function randomToken(prefix = 'lic') {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const value = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${prefix}_${value}`
}

export function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateRefreshToken() {
  return randomToken('rst')
}
