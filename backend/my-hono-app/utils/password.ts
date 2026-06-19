function toBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false

  let result = 0

  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }

  return result === 0
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hash = new Uint8Array(derivedBits)

  return `pbkdf2_sha256$100000$${toBase64(salt)}$${toBase64(hash)}`
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split('$')

  if (parts.length === 4) {
    const [algo, iterationsRaw, saltB64, hashB64] = parts

    if (algo !== 'pbkdf2_sha256') return false

    const iterations = Number(iterationsRaw)
    const salt = fromBase64(saltB64)
    const expectedHash = fromBase64(hashB64)
    const encoder = new TextEncoder()

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    )

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      expectedHash.length * 8,
    )

    return timingSafeEqual(new Uint8Array(derivedBits), expectedHash)
  }

  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    return (await sha256Hex(password)) === storedHash.toLowerCase()
  }

  return false
}
