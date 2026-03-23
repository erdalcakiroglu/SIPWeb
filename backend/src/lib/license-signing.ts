import fs from 'node:fs'
import path from 'node:path'
import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { dbPath } from './db'

type SigningKeyPair = {
  privateKeyPem: string
  publicKeyPem: string
}

const keysDir = path.join(path.dirname(dbPath), 'license-keys')
const privateKeyPath = path.join(keysDir, 'ed25519-private.pem')
const publicKeyPath = path.join(keysDir, 'ed25519-public.pem')

let cachedKeyPair: SigningKeyPair | null = null

function loadKeyPair(): SigningKeyPair {
  if (cachedKeyPair) {
    return cachedKeyPair
  }

  fs.mkdirSync(keysDir, { recursive: true })

  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    const generated = generateKeyPairSync('ed25519', {
      privateKeyEncoding: {
        format: 'pem',
        type: 'pkcs8',
      },
      publicKeyEncoding: {
        format: 'pem',
        type: 'spki',
      },
    })

    fs.writeFileSync(privateKeyPath, generated.privateKey, 'utf8')
    fs.writeFileSync(publicKeyPath, generated.publicKey, 'utf8')
  }

  cachedKeyPair = {
    privateKeyPem: fs.readFileSync(privateKeyPath, 'utf8'),
    publicKeyPem: fs.readFileSync(publicKeyPath, 'utf8'),
  }

  return cachedKeyPair
}

export function signLicensePayload(payloadText: string) {
  const keys = loadKeyPair()
  return sign(null, Buffer.from(payloadText, 'utf8'), keys.privateKeyPem).toString('base64url')
}

export function verifyLicensePayloadSignature(payloadText: string, signatureText: string) {
  const keys = loadKeyPair()
  return verify(
    null,
    Buffer.from(payloadText, 'utf8'),
    keys.publicKeyPem,
    Buffer.from(signatureText, 'base64url'),
  )
}

export function getLicenseVerificationKey() {
  return loadKeyPair().publicKeyPem
}
