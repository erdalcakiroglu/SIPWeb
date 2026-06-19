// Web Crypto tabanlı yardımcılar (Cloudflare Workers ortamı).
// `crypto`, `btoa`, `atob`, `TextEncoder/Decoder` ortam global'leridir.

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function base64UrlEncode(obj: unknown): string {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlToUint8Array(input: string): Uint8Array {
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input += '='.repeat(4 - pad)

  const binary = atob(input)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export function base64UrlToArrayBuffer(input: string): ArrayBuffer {
  return base64UrlToUint8Array(input).buffer as ArrayBuffer
}

export function base64UrlToText(input: string): string {
  return new TextDecoder().decode(base64UrlToUint8Array(input))
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(header)
  const encodedPayload = base64UrlEncode(payload)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  )

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${encodedHeader}.${encodedPayload}.${signatureBase64}`
}

export async function verifyJwt(token: string, secret: string): Promise<any> {
  const [header, payload, signature] = token.split('.')

  if (!header || !payload || !signature) {
    throw new Error('Invalid token.')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToArrayBuffer(signature),
    new TextEncoder().encode(`${header}.${payload}`),
  )

  if (!ok) throw new Error('Invalid token signature.')

  const payloadJson = base64UrlToText(payload)
  const decoded = JSON.parse(payloadJson)

  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired.')
  }

  return decoded
}

export function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s/g, '')

  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

export async function signPayload(
  payloadText: string,
  privateKeyPem: string,
): Promise<string> {
  const keyData = pemToArrayBuffer(privateKeyPem)

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'Ed25519',
    },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    new TextEncoder().encode(payloadText),
  )

  return arrayBufferToBase64(signature)
}
