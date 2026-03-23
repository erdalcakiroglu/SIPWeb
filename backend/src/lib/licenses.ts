import { randomInt } from 'node:crypto'
import { db } from './db'
import { getLicenseVerificationKey, signLicensePayload, verifyLicensePayloadSignature } from './license-signing'
import { requireText } from './validation'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

type LicenseRow = {
  id: number
  customer_id: number
  license_name: string
  license_type: string
  status: string
  starts_at: string | null
  expires_at: string | null
  refresh_after: string | null
  offline_grace_until: string | null
  last_validated_at: string | null
  license_count: number
  allowed_devices: number
  features_json: string
  notes: string | null
  server_url: string | null
  license_email: string
  activation_code: string | null
  installed_license: string | null
  device_id: string | null
  imported_file: string | null
  created_at: string
  updated_at: string
  created_via: string
}

type ActivationCodeRow = {
  id: number
  license_id: number
  customer_id: number
  code: string
  status: string
  device_id: string | null
  issued_at: string
  expires_at: string
  used_at: string | null
  used_by_device_id: string | null
  created_via: string
}

type LicenseDeviceRow = {
  id: number
  license_id: number
  device_id: string
  status: string
  first_seen_at: string
  last_seen_at: string
  last_ip: string | null
  last_platform: string | null
  last_app_version: string | null
  created_at: string
  updated_at: string
}

type TrialActivationRow = {
  id: number
  customer_id: number | null
  email: string
  device_id: string
  status: string
  issued_at: string
  expires_at: string
  created_at: string
}

type ClientInfo = {
  platform: string | null
  platformRelease: string | null
  appVersion: string | null
}

export type PublicLicenseDevice = {
  id: number
  deviceId: string
  status: string
  firstSeenAt: string
  lastSeenAt: string
  lastIp: string | null
  lastPlatform: string | null
  lastAppVersion: string | null
  createdAt: string
  updatedAt: string
}

export type PublicLicense = {
  id: number
  publicId: string
  customerManaged: boolean
  licenseName: string
  licenseType: string
  status: string
  startsAt: string | null
  expiresAt: string | null
  refreshAfter: string | null
  offlineGraceUntil: string | null
  lastValidatedAt: string | null
  licenseCount: number
  allowedDevices: number
  features: string[]
  notes: string | null
  serverUrl: string | null
  email: string
  activationCode: string | null
  activationCodeStatus: string | null
  activationCodeIssuedAt: string | null
  activationCodeExpiresAt: string | null
  activationCodeUsedAt: string | null
  installedLicense: string | null
  deviceId: string | null
  importedFile: string | null
  devices: PublicLicenseDevice[]
  createdAt: string
  updatedAt: string
}

export type LicenseSyncInput = {
  licenseName?: unknown
  licenseType?: unknown
  status?: unknown
  startsAt?: unknown
  expiresAt?: unknown
  refreshAfter?: unknown
  offlineGraceUntil?: unknown
  lastValidatedAt?: unknown
  licenseCount?: unknown
  allowedDevices?: unknown
  features?: unknown
  serverUrl?: unknown
  email?: unknown
  activationCode?: unknown
  installedLicense?: unknown
  deviceId?: unknown
  importedFile?: unknown
  notes?: unknown
}

type ActivationCodeIssueInput = {
  deviceId: unknown
  serverUrl?: unknown
  licenseName?: unknown
  publicLicenseId?: unknown
  createNewLicense?: unknown
}

type TrialStartInput = {
  deviceId: unknown
  serverUrl?: unknown
  licenseName?: unknown
  client?: unknown
}

type LicenseActivateInput = {
  activationCode: unknown
  deviceId: unknown
  serverUrl?: unknown
  licenseName?: unknown
  client?: unknown
}

type LicenseRefreshInput = {
  deviceId: unknown
  token: string
  client?: unknown
}

type LicenseDownloadInput = {
  licenseCode: string
  deviceId: unknown
  serverUrl?: unknown
  licenseName?: unknown
  client?: unknown
}

type LicenseTokenPayload = {
  format_version: 'SPAI1'
  license_id: string
  license_name: string
  license_type?: string
  license_code: string | null
  status: string
  customer_email: string
  device_id: string
  issued_at: string
  expires_at: string | null
  refresh_after: string | null
  offline_grace_until: string | null
  license_count: number
  allowed_devices: number
  features?: string[]
}

export type ActivationCodeIssueResult = {
  activationCode: string
  activation_code: string
  licenseCode: string
  license_code: string
  status: string
  issuedAt: string
  issued_at: string
  expiresAt: string
  expires_at: string
  license: PublicLicense
}

type SignedLicenseResult = {
  license: PublicLicense
  token: string
  payload: LicenseTokenPayload
}

type LicenseDownloadEnvelope = {
  format: 'SPAI1-LIC'
  token: string
  exported_at: string
}

const defaultFeatureSet = ['all_modules']
const activationCodeTtlMinutes = 15
const portalCreatedLicenseNote = 'Portal-created license record.'
const autoProvisionedPortalLicenseNote = 'Auto-provisioned until website purchase flow is implemented.'
const customerPortalLicenseSource = 'customer_portal'

function isCustomerManagedLicense(license: Pick<LicenseRow, 'created_via'>) {
  return license.created_via === customerPortalLicenseSource
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeOptionalInteger(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed)
    }
  }

  return fallback
}

function normalizeOptionalIso(value: unknown) {
  const text = normalizeOptionalText(value)

  if (!text) {
    return null
  }

  const timestamp = new Date(text).getTime()
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

function nowIso() {
  return new Date().toISOString()
}

function isoInMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

function isoInDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function isoInHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function normalizeActivationCode(value: unknown) {
  return requireText(value, 'Activation Code').trim().toUpperCase()
}

function normalizeClientInfo(input: unknown): ClientInfo {
  const client = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}

  return {
    platform: normalizeOptionalText(client.platform) || null,
    platformRelease: normalizeOptionalText(client.platform_release ?? client.platformRelease) || null,
    appVersion: normalizeOptionalText(client.app_version ?? client.appVersion) || null,
  }
}

function normalizeFeatures(value: unknown) {
  if (Array.isArray(value)) {
    const features = value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)

    return features.length ? features : [...defaultFeatureSet]
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return normalizeFeatures(parsed)
    } catch {
      return [...defaultFeatureSet]
    }
  }

  return [...defaultFeatureSet]
}

function parseFeaturesJson(text: string | null | undefined) {
  return normalizeFeatures(text || JSON.stringify(defaultFeatureSet))
}

function clampOfflineGrace(expiresAt: string | null, fallbackDays: number) {
  if (!expiresAt) {
    return isoInDays(fallbackDays)
  }

  const expiryTime = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiryTime)) {
    return isoInDays(fallbackDays)
  }

  const fallbackTime = Date.now() + fallbackDays * 24 * 60 * 60 * 1000
  return new Date(Math.min(expiryTime, fallbackTime)).toISOString()
}

function toPublicLicenseId(id: number) {
  return `lic_${String(id).padStart(6, '0')}`
}

function parsePublicLicenseId(value: string) {
  const match = /^lic_(\d+)$/.exec(value)

  if (!match) {
    throw new Error('License identifier format is invalid.')
  }

  return Number(match[1])
}

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJson)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        const typedValue = value as { [key: string]: JsonValue }
        accumulator[key] = sortJson(typedValue[key])
        return accumulator
      }, {} as { [key: string]: JsonValue })
  }

  return value
}

function canonicalizeJson(value: JsonValue) {
  return JSON.stringify(sortJson(value))
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
  }

  return false
}

function generateUniqueActivationCode() {
  const year = new Date().getUTCFullYear()

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const candidate = `ACT-${year}-${suffix}`
    const existing = db.prepare('SELECT id FROM ActivationCodes WHERE code = ? LIMIT 1').get(candidate) as
      | { id: number }
      | undefined

    if (!existing) {
      return candidate
    }
  }

  throw new Error('A unique activation code could not be generated.')
}

function getLicenseDevicesByLicenseId(licenseId: number) {
  return db
    .prepare('SELECT * FROM LicenseDevices WHERE license_id = ? ORDER BY created_at DESC, id DESC')
    .all(licenseId) as LicenseDeviceRow[]
}

function getActiveLicenseDevice(licenseId: number, deviceId: string) {
  return db
    .prepare('SELECT * FROM LicenseDevices WHERE license_id = ? AND device_id = ? AND status = ? LIMIT 1')
    .get(licenseId, deviceId, 'active') as LicenseDeviceRow | undefined
}

function getActiveDeviceCount(licenseId: number) {
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM LicenseDevices WHERE license_id = ? AND status = ?')
    .get(licenseId, 'active') as { count: number }

  return row.count
}

function getLicenseById(id: number) {
  return db.prepare('SELECT * FROM Licenses WHERE id = ?').get(id) as LicenseRow | undefined
}

function getLicenseByPublicId(customerId: number, publicLicenseId: string) {
  const licenseId = parsePublicLicenseId(publicLicenseId)
  return db
    .prepare('SELECT * FROM Licenses WHERE id = ? AND customer_id = ? LIMIT 1')
    .get(licenseId, customerId) as LicenseRow | undefined
}

function getActiveActivationCodeByLicenseAndDevice(licenseId: number, deviceId: string) {
  return db
    .prepare(`
      SELECT * FROM ActivationCodes
      WHERE license_id = ? AND device_id = ? AND status = 'active' AND expires_at >= ?
      ORDER BY issued_at DESC, id DESC
      LIMIT 1
    `)
    .get(licenseId, deviceId, nowIso()) as ActivationCodeRow | undefined
}

function getLatestActivationCodeByLicenseId(licenseId: number) {
  return db
    .prepare('SELECT * FROM ActivationCodes WHERE license_id = ? ORDER BY issued_at DESC, id DESC LIMIT 1')
    .get(licenseId) as ActivationCodeRow | undefined
}

function getActivationCodeRow(code: string) {
  return db.prepare('SELECT * FROM ActivationCodes WHERE code = ? LIMIT 1').get(code) as ActivationCodeRow | undefined
}

function getLatestTrialByEmailOrDevice(email: string, deviceId: string) {
  return db
    .prepare(`
      SELECT * FROM TrialActivations
      WHERE email = ? OR device_id = ?
      ORDER BY issued_at DESC, id DESC
      LIMIT 1
    `)
    .get(email, deviceId) as TrialActivationRow | undefined
}

function findLicenseForSync(
  customerId: number,
  input: {
    deviceId: string | null
    activationCode: string | null
    installedLicense: string | null
    licenseName: string
  },
) {
  if (input.deviceId) {
    const row = db
      .prepare('SELECT * FROM Licenses WHERE customer_id = ? AND device_id = ? ORDER BY id DESC LIMIT 1')
      .get(customerId, input.deviceId) as LicenseRow | undefined

    if (row) {
      return row
    }
  }

  if (input.activationCode) {
    const row = db
      .prepare('SELECT * FROM Licenses WHERE customer_id = ? AND activation_code = ? ORDER BY id DESC LIMIT 1')
      .get(customerId, input.activationCode) as LicenseRow | undefined

    if (row) {
      return row
    }
  }

  if (input.installedLicense) {
    const row = db
      .prepare('SELECT * FROM Licenses WHERE customer_id = ? AND installed_license = ? ORDER BY id DESC LIMIT 1')
      .get(customerId, input.installedLicense) as LicenseRow | undefined

    if (row) {
      return row
    }
  }

  return db
    .prepare('SELECT * FROM Licenses WHERE customer_id = ? AND license_name = ? ORDER BY id DESC LIMIT 1')
    .get(customerId, input.licenseName) as LicenseRow | undefined
}

function getOrCreatePortalLicense(customerId: number, customerEmail: string, licenseName: string) {
  const existing = db
    .prepare(`
      SELECT * FROM Licenses
      WHERE customer_id = ? AND license_name = ?
      ORDER BY
        CASE
          WHEN status IN ('active', 'trial_active') THEN 0
          WHEN status = 'activation_code_issued' THEN 1
          ELSE 2
        END,
        created_at DESC,
        id DESC
      LIMIT 1
    `)
    .get(customerId, licenseName) as LicenseRow | undefined

  if (existing) {
    return existing
  }

  const timestamp = nowIso()
  const result = db.prepare(`
    INSERT INTO Licenses (
      customer_id,
      license_name,
      license_type,
      status,
      starts_at,
      expires_at,
      refresh_after,
      offline_grace_until,
      last_validated_at,
      license_count,
      allowed_devices,
      features_json,
      notes,
      created_via,
      server_url,
      license_email,
      activation_code,
      installed_license,
      device_id,
      imported_file,
      created_at,
      updated_at
    ) VALUES (?, ?, 'subscription', 'active', ?, ?, NULL, NULL, NULL, 1, 1, ?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, ?, ?)
  `).run(
    customerId,
    licenseName,
    timestamp,
    isoInDays(180),
    canonicalizeJson(defaultFeatureSet),
    autoProvisionedPortalLicenseNote,
    customerPortalLicenseSource,
    customerEmail,
    timestamp,
    timestamp,
  )

  const license = getLicenseById(Number(result.lastInsertRowid))

  if (!license) {
    throw new Error('License could not be provisioned.')
  }

  return license
}

function createPortalLicense(customerId: number, customerEmail: string, licenseName: string, serverUrl: string | null) {
  const timestamp = nowIso()
  const result = db.prepare(`
    INSERT INTO Licenses (
      customer_id,
      license_name,
      license_type,
      status,
      starts_at,
      expires_at,
      refresh_after,
      offline_grace_until,
      last_validated_at,
      license_count,
      allowed_devices,
      features_json,
      notes,
      created_via,
      server_url,
      license_email,
      activation_code,
      installed_license,
      device_id,
      imported_file,
      created_at,
      updated_at
    ) VALUES (?, ?, 'subscription', 'active', ?, ?, NULL, NULL, NULL, 1, 1, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)
  `).run(
    customerId,
    licenseName,
    timestamp,
    isoInDays(180),
    canonicalizeJson(defaultFeatureSet),
    portalCreatedLicenseNote,
    customerPortalLicenseSource,
    serverUrl,
    customerEmail,
    timestamp,
    timestamp,
  )

  const license = getLicenseById(Number(result.lastInsertRowid))

  if (!license) {
    throw new Error('License could not be created.')
  }

  return license
}

function resolveLicenseForActivationCode(customerId: number, customerEmail: string, input: ActivationCodeIssueInput) {
  const licenseName = normalizeOptionalText(input.licenseName) || 'Desktop License'
  const serverUrl = normalizeOptionalText(input.serverUrl)
  const publicLicenseId = normalizeOptionalText(input.publicLicenseId)
  const createNewLicense = parseBoolean(input.createNewLicense)

  if (publicLicenseId) {
    const selected = getLicenseByPublicId(customerId, publicLicenseId)

    if (!selected) {
      throw new Error('Selected license could not be found.')
    }

    return {
      license: selected,
      licenseName,
      serverUrl,
    }
  }

  if (createNewLicense) {
    const created = createPortalLicense(customerId, customerEmail, licenseName, serverUrl)
    return {
      license: created,
      licenseName,
      serverUrl,
    }
  }

  return {
    license: getOrCreatePortalLicense(customerId, customerEmail, licenseName),
    licenseName,
    serverUrl,
  }
}

function validateLicenseCommercialState(license: LicenseRow) {
  if (license.status === 'revoked' || license.status === 'suspended') {
    throw new Error('This license is not eligible for activation.')
  }

  if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
    throw new Error('This license has expired.')
  }
}

function ensureSeatAvailability(license: LicenseRow, deviceId: string) {
  const existingDevice = getActiveLicenseDevice(license.id, deviceId)

  if (existingDevice) {
    return
  }

  if (getActiveDeviceCount(license.id) >= Math.max(license.allowed_devices, 1)) {
    throw new Error('No device seat is currently available for this license.')
  }
}

function recordLicenseEvent(
  licenseId: number | null,
  customerId: number | null,
  eventType: string,
  payload: Record<string, JsonValue>,
  deviceId?: string | null,
) {
  db.prepare(`
    INSERT INTO LicenseEvents (
      license_id,
      customer_id,
      event_type,
      device_id,
      payload_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    licenseId,
    customerId,
    eventType,
    deviceId ?? null,
    canonicalizeJson(payload),
    nowIso(),
  )
}

function toPublicLicenseDevice(device: LicenseDeviceRow): PublicLicenseDevice {
  return {
    id: device.id,
    deviceId: device.device_id,
    status: device.status,
    firstSeenAt: device.first_seen_at,
    lastSeenAt: device.last_seen_at,
    lastIp: device.last_ip,
    lastPlatform: device.last_platform,
    lastAppVersion: device.last_app_version,
    createdAt: device.created_at,
    updatedAt: device.updated_at,
  }
}

function toPublicLicense(license: LicenseRow): PublicLicense {
  const latestActivationCode = getLatestActivationCodeByLicenseId(license.id)

  return {
    id: license.id,
    publicId: toPublicLicenseId(license.id),
    customerManaged: isCustomerManagedLicense(license),
    licenseName: license.license_name,
    licenseType: license.license_type,
    status: license.status,
    startsAt: license.starts_at,
    expiresAt: license.expires_at,
    refreshAfter: license.refresh_after,
    offlineGraceUntil: license.offline_grace_until,
    lastValidatedAt: license.last_validated_at,
    licenseCount: license.license_count,
    allowedDevices: license.allowed_devices,
    features: parseFeaturesJson(license.features_json),
    notes: license.notes,
    serverUrl: license.server_url,
    email: license.license_email,
    activationCode: latestActivationCode
      ? latestActivationCode.status === 'active'
        ? latestActivationCode.code
        : null
      : license.activation_code,
    activationCodeStatus: latestActivationCode?.status ?? null,
    activationCodeIssuedAt: latestActivationCode?.issued_at ?? null,
    activationCodeExpiresAt: latestActivationCode?.expires_at ?? null,
    activationCodeUsedAt: latestActivationCode?.used_at ?? null,
    installedLicense: license.installed_license,
    deviceId: license.device_id,
    importedFile: license.imported_file,
    devices: getLicenseDevicesByLicenseId(license.id).map(toPublicLicenseDevice),
    createdAt: license.created_at,
    updatedAt: license.updated_at,
  }
}

function setLicenseState(
  licenseId: number,
  input: {
    licenseName: string
    licenseType: string
    status: string
    startsAt: string | null
    expiresAt: string | null
    refreshAfter: string | null
    offlineGraceUntil: string | null
    lastValidatedAt: string | null
    features: string[]
    notes: string | null
    serverUrl: string | null
    email: string
    activationCode: string | null
    installedLicense: string | null
    deviceId: string | null
    importedFile: string | null
    updatedAt: string
  },
) {
  db.prepare(`
    UPDATE Licenses
    SET
      license_name = ?,
      license_type = ?,
      status = ?,
      starts_at = ?,
      expires_at = ?,
      refresh_after = ?,
      offline_grace_until = ?,
      last_validated_at = ?,
      features_json = ?,
      notes = ?,
      server_url = ?,
      license_email = ?,
      activation_code = ?,
      installed_license = ?,
      device_id = ?,
      imported_file = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    input.licenseName,
    input.licenseType,
    input.status,
    input.startsAt,
    input.expiresAt,
    input.refreshAfter,
    input.offlineGraceUntil,
    input.lastValidatedAt,
    canonicalizeJson(input.features),
    input.notes,
    input.serverUrl,
    input.email,
    input.activationCode,
    input.installedLicense,
    input.deviceId,
    input.importedFile,
    input.updatedAt,
    licenseId,
  )
}

function upsertLicenseDevice(
  license: LicenseRow,
  deviceId: string,
  client: ClientInfo,
  status: 'active' | 'released' | 'revoked' = 'active',
) {
  const timestamp = nowIso()
  const lastPlatform = [client.platform, client.platformRelease].filter(Boolean).join(' ') || client.platform || null
  const existing = db
    .prepare('SELECT * FROM LicenseDevices WHERE license_id = ? AND device_id = ? LIMIT 1')
    .get(license.id, deviceId) as LicenseDeviceRow | undefined

  if (existing) {
    db.prepare(`
      UPDATE LicenseDevices
      SET
        status = ?,
        last_seen_at = ?,
        last_platform = COALESCE(?, last_platform),
        last_app_version = COALESCE(?, last_app_version),
        updated_at = ?
      WHERE id = ?
    `).run(status, timestamp, lastPlatform, client.appVersion, timestamp, existing.id)

    return
  }

  db.prepare(`
    INSERT INTO LicenseDevices (
      license_id,
      device_id,
      status,
      first_seen_at,
      last_seen_at,
      last_ip,
      last_platform,
      last_app_version,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
  `).run(
    license.id,
    deviceId,
    status,
    timestamp,
    timestamp,
    lastPlatform,
    client.appVersion,
    timestamp,
    timestamp,
  )
}

function createCanonicalPayload(license: LicenseRow, options: { issuedAt: string; status: string; deviceId: string }) {
  return {
    format_version: 'SPAI1',
    license_id: toPublicLicenseId(license.id),
    license_name: license.license_name,
    license_type: license.license_type,
    license_code: license.activation_code,
    status: options.status,
    customer_email: license.license_email,
    device_id: options.deviceId,
    issued_at: options.issuedAt,
    expires_at: license.expires_at,
    refresh_after: license.refresh_after,
    offline_grace_until: license.offline_grace_until,
    license_count: license.license_count,
    allowed_devices: license.allowed_devices,
    features: parseFeaturesJson(license.features_json),
  } satisfies LicenseTokenPayload
}

function createSignedToken(payload: LicenseTokenPayload) {
  const payloadText = canonicalizeJson(payload)
  const signature = signLicensePayload(payloadText)
  return `SPAI1.${toBase64Url(payloadText)}.${signature}`
}

function issueTokenForLicense(
  license: LicenseRow,
  input: {
    status: string
    deviceId: string
    serverUrl?: string | null
  },
) {
  const issuedAt = nowIso()
  const payload = createCanonicalPayload(license, {
    issuedAt,
    status: input.status,
    deviceId: input.deviceId,
  })
  const token = createSignedToken(payload)

  setLicenseState(license.id, {
    licenseName: license.license_name,
    licenseType: license.license_type,
    status: input.status,
    startsAt: license.starts_at,
    expiresAt: license.expires_at,
    refreshAfter: license.refresh_after,
    offlineGraceUntil: license.offline_grace_until,
    lastValidatedAt: issuedAt,
    features: parseFeaturesJson(license.features_json),
    notes: license.notes,
    serverUrl: input.serverUrl ?? license.server_url,
    email: license.license_email,
    activationCode: license.activation_code,
    installedLicense: token,
    deviceId: input.deviceId,
    importedFile: license.imported_file,
    updatedAt: issuedAt,
  })

  const updated = getLicenseById(license.id)

  if (!updated) {
    throw new Error('The updated license could not be loaded.')
  }

  return {
    license: toPublicLicense(updated),
    token,
    payload,
  } satisfies SignedLicenseResult
}

export function parseAndVerifyLicenseToken(token: string) {
  const trimmed = token.trim()
  const parts = trimmed.split('.')

  if (parts.length !== 3) {
    throw new Error('License token format is invalid.')
  }

  if (parts[0] !== 'SPAI1') {
    throw new Error('License token prefix is invalid.')
  }

  const payloadText = fromBase64Url(parts[1])

  if (!verifyLicensePayloadSignature(payloadText, parts[2])) {
    throw new Error('License token signature is invalid.')
  }

  const payload = JSON.parse(payloadText) as LicenseTokenPayload

  if (payload.format_version !== 'SPAI1') {
    throw new Error('License token payload version is invalid.')
  }

  return payload
}

export function getLicenseVerificationInfo() {
  return {
    formatVersion: 'SPAI1',
    algorithm: 'Ed25519',
    publicKeyPem: getLicenseVerificationKey(),
  }
}

export function listLicensesByCustomerId(customerId: number) {
  const rows = db
    .prepare('SELECT * FROM Licenses WHERE customer_id = ? ORDER BY created_at DESC, id DESC')
    .all(customerId) as LicenseRow[]

  return rows.map(toPublicLicense)
}

export function deleteCustomerManagedLicense(customerId: number, publicLicenseId: string) {
  const license = getLicenseByPublicId(customerId, publicLicenseId)

  if (!license) {
    throw new Error('Selected license could not be found.')
  }

  if (!isCustomerManagedLicense(license)) {
    throw new Error('Only licenses created from the customer portal can be deleted.')
  }

  db.exec('BEGIN')

  try {
    db.prepare('DELETE FROM LicenseDevices WHERE license_id = ?').run(license.id)
    db.prepare('DELETE FROM ActivationCodes WHERE license_id = ?').run(license.id)
    db.prepare('DELETE FROM LicenseEvents WHERE license_id = ?').run(license.id)
    db.prepare('DELETE FROM Licenses WHERE id = ? AND customer_id = ?').run(license.id, customerId)

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return {
    deletedLicenseId: publicLicenseId,
    licenses: listLicensesByCustomerId(customerId),
  }
}

export function syncLicenseSnapshot(customerId: number, customerEmail: string, input: LicenseSyncInput) {
  const licenseName = normalizeOptionalText(input.licenseName) || 'Current License'
  const licenseType = normalizeOptionalText(input.licenseType) || 'subscription'
  const status = normalizeOptionalText(input.status) || 'unknown'
  const startsAt = normalizeOptionalIso(input.startsAt)
  const expiresAt = normalizeOptionalIso(input.expiresAt)
  const refreshAfter = normalizeOptionalIso(input.refreshAfter)
  const offlineGraceUntil = normalizeOptionalIso(input.offlineGraceUntil)
  const lastValidatedAt = normalizeOptionalIso(input.lastValidatedAt)
  const licenseCount = normalizeOptionalInteger(input.licenseCount, 1)
  const allowedDevices = normalizeOptionalInteger(input.allowedDevices, 1)
  const serverUrl = normalizeOptionalText(input.serverUrl)
  const email = normalizeOptionalText(input.email) || customerEmail
  const activationCode = normalizeOptionalText(input.activationCode)?.toUpperCase() || null
  const installedLicense = normalizeOptionalText(input.installedLicense)
  const deviceId = normalizeOptionalText(input.deviceId)
  const importedFile = normalizeOptionalText(input.importedFile)
  const notes = normalizeOptionalText(input.notes)
  const features = normalizeFeatures(input.features)
  const timestamp = nowIso()

  const existing = findLicenseForSync(customerId, {
    deviceId,
    activationCode,
    installedLicense,
    licenseName,
  })

  if (existing) {
    db.prepare(`
      UPDATE Licenses
      SET
        license_name = ?,
        license_type = ?,
        status = ?,
        starts_at = ?,
        expires_at = ?,
        refresh_after = ?,
        offline_grace_until = ?,
        last_validated_at = ?,
        license_count = ?,
        allowed_devices = ?,
        features_json = ?,
        notes = ?,
        server_url = ?,
        license_email = ?,
        activation_code = ?,
        installed_license = ?,
        device_id = ?,
        imported_file = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      licenseName,
      licenseType,
      status,
      startsAt,
      expiresAt,
      refreshAfter,
      offlineGraceUntil,
      lastValidatedAt,
      licenseCount,
      allowedDevices,
      canonicalizeJson(features),
      notes,
      serverUrl,
      email,
      activationCode,
      installedLicense,
      deviceId,
      importedFile,
      timestamp,
      existing.id,
    )

    return listLicensesByCustomerId(customerId)
  }

  db.prepare(`
    INSERT INTO Licenses (
      customer_id,
      license_name,
      license_type,
      status,
      starts_at,
      expires_at,
      refresh_after,
      offline_grace_until,
      last_validated_at,
      license_count,
      allowed_devices,
      features_json,
      notes,
      created_via,
      server_url,
      license_email,
      activation_code,
      installed_license,
      device_id,
      imported_file,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customerId,
    licenseName,
    licenseType,
    status,
    startsAt,
    expiresAt,
    refreshAfter,
    offlineGraceUntil,
    lastValidatedAt,
    licenseCount,
    allowedDevices,
    canonicalizeJson(features),
    notes,
    'app_sync',
    serverUrl,
    email,
    activationCode,
    installedLicense,
    deviceId,
    importedFile,
    timestamp,
    timestamp,
  )

  return listLicensesByCustomerId(customerId)
}

export function issueActivationCodeForDevice(
  customerId: number,
  customerEmail: string,
  input: ActivationCodeIssueInput,
): ActivationCodeIssueResult {
  const deviceId = requireText(input.deviceId, 'Device ID')
  const resolved = resolveLicenseForActivationCode(customerId, customerEmail, input)
  const serverUrl = resolved.serverUrl
  const licenseName = resolved.licenseName
  const license = resolved.license

  validateLicenseCommercialState(license)
  ensureSeatAvailability(license, deviceId)

  const code = generateUniqueActivationCode()
  const issuedAt = nowIso()
  const expiresAt = isoInMinutes(activationCodeTtlMinutes)

  db.prepare(`
    UPDATE ActivationCodes
    SET status = 'replaced'
    WHERE license_id = ? AND device_id = ? AND status = 'active'
  `).run(license.id, deviceId)

  db.prepare(`
    INSERT INTO ActivationCodes (
      license_id,
      customer_id,
      code,
      status,
      device_id,
      issued_at,
      expires_at,
      used_at,
      used_by_device_id,
      created_via
    ) VALUES (?, ?, ?, 'active', ?, ?, ?, NULL, NULL, 'api')
  `).run(license.id, customerId, code, deviceId, issuedAt, expiresAt)

  setLicenseState(license.id, {
    licenseName: license.license_name,
    licenseType: license.license_type,
    status: license.status,
    startsAt: license.starts_at,
    expiresAt: license.expires_at,
    refreshAfter: license.refresh_after,
    offlineGraceUntil: license.offline_grace_until,
    lastValidatedAt: license.last_validated_at,
    features: parseFeaturesJson(license.features_json),
    notes: license.notes,
    serverUrl: serverUrl ?? license.server_url,
    email: customerEmail,
    activationCode: code,
    installedLicense: license.installed_license,
    deviceId: license.device_id,
    importedFile: license.imported_file,
    updatedAt: issuedAt,
  })

  recordLicenseEvent(
    license.id,
    customerId,
    'activation_code_issued',
    {
      activation_code: code,
      expires_at: expiresAt,
      license_name: licenseName,
    },
    deviceId,
  )

  const updatedLicense = getLicenseById(license.id)

  if (!updatedLicense) {
    throw new Error('Issued activation code could not be reloaded.')
  }

  return {
    activationCode: code,
    activation_code: code,
    licenseCode: code,
    license_code: code,
    status: 'active',
    issuedAt,
    issued_at: issuedAt,
    expiresAt,
    expires_at: expiresAt,
    license: toPublicLicense(updatedLicense),
  }
}

export function startTrialForCustomer(customerId: number, customerEmail: string, input: TrialStartInput) {
  const deviceId = requireText(input.deviceId, 'Device ID')
  const serverUrl = normalizeOptionalText(input.serverUrl)
  const licenseName = normalizeOptionalText(input.licenseName) || 'Trial License'
  const client = normalizeClientInfo(input.client)
  const existingTrial = getLatestTrialByEmailOrDevice(customerEmail, deviceId)

  if (existingTrial) {
    if (existingTrial.status === 'trial_active' && new Date(existingTrial.expires_at).getTime() >= Date.now()) {
      const existingLicense = db
        .prepare(`
          SELECT * FROM Licenses
          WHERE customer_id = ? AND license_type = 'trial'
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        `)
        .get(customerId) as LicenseRow | undefined

      if (!existingLicense || !existingLicense.installed_license) {
        throw new Error('Existing trial state could not be recovered.')
      }

      return validateInstalledLicense({
        token: existingLicense.installed_license,
        deviceId,
        client,
      })
    }

    throw new Error('A trial has already been used for this email or device.')
  }

  const issuedAt = nowIso()
  const expiresAt = isoInDays(30)
  const refreshAfter = isoInHours(24)
  const offlineGraceUntil = expiresAt

  const licenseInsert = db.prepare(`
    INSERT INTO Licenses (
      customer_id,
      license_name,
      license_type,
      status,
      starts_at,
      expires_at,
      refresh_after,
      offline_grace_until,
      last_validated_at,
      license_count,
      allowed_devices,
      features_json,
      notes,
      created_via,
      server_url,
      license_email,
      activation_code,
      installed_license,
      device_id,
      imported_file,
      created_at,
      updated_at
    ) VALUES (?, ?, 'trial', 'trial_active', ?, ?, ?, ?, ?, 1, 1, ?, NULL, ?, ?, ?, NULL, NULL, ?, NULL, ?, ?)
  `).run(
    customerId,
    licenseName,
    issuedAt,
    expiresAt,
    refreshAfter,
    offlineGraceUntil,
    issuedAt,
    canonicalizeJson(defaultFeatureSet),
    'trial',
    serverUrl,
    customerEmail,
    deviceId,
    issuedAt,
    issuedAt,
  )

  const license = getLicenseById(Number(licenseInsert.lastInsertRowid))

  if (!license) {
    throw new Error('Trial license could not be created.')
  }

  db.prepare(`
    INSERT INTO TrialActivations (
      customer_id,
      email,
      device_id,
      status,
      issued_at,
      expires_at,
      created_at
    ) VALUES (?, ?, ?, 'trial_active', ?, ?, ?)
  `).run(customerId, customerEmail, deviceId, issuedAt, expiresAt, issuedAt)

  upsertLicenseDevice(license, deviceId, client, 'active')

  const result = issueTokenForLicense(license, {
    status: 'trial_active',
    deviceId,
    serverUrl,
  })

  recordLicenseEvent(
    license.id,
    customerId,
    'trial_started',
    {
      expires_at: expiresAt,
      license_name: licenseName,
    },
    deviceId,
  )

  return result
}

export function activateLicenseForCustomer(customerId: number, customerEmail: string, input: LicenseActivateInput) {
  const activationCode = normalizeActivationCode(input.activationCode)
  const deviceId = requireText(input.deviceId, 'Device ID')
  const serverUrl = normalizeOptionalText(input.serverUrl)
  const licenseName = normalizeOptionalText(input.licenseName)
  const client = normalizeClientInfo(input.client)
  const activation = getActivationCodeRow(activationCode)

  if (!activation) {
    throw new Error('Activation code was not found.')
  }

  if (activation.customer_id !== customerId) {
    throw new Error('Activation code does not belong to this customer.')
  }

  if (activation.status !== 'active') {
    throw new Error('Activation code is no longer active.')
  }

  if (new Date(activation.expires_at).getTime() < Date.now()) {
    db.prepare('UPDATE ActivationCodes SET status = ? WHERE id = ?').run('expired', activation.id)
    throw new Error('Activation code has expired.')
  }

  if (activation.device_id && activation.device_id !== deviceId) {
    throw new Error('Activation code was issued for a different device.')
  }

  const license = getLicenseById(activation.license_id)

  if (!license) {
    throw new Error('The activation code is not linked to a valid license.')
  }

  if (license.license_email !== customerEmail) {
    throw new Error('Activation code does not match this email address.')
  }

  validateLicenseCommercialState(license)
  ensureSeatAvailability(license, deviceId)

  const activatedAt = nowIso()
  const expiresAt = license.expires_at || isoInDays(180)
  const refreshAfter = isoInHours(24 * 7)
  const offlineGraceUntil = clampOfflineGrace(expiresAt, 7)

  upsertLicenseDevice(license, deviceId, client, 'active')

  db.prepare(`
    UPDATE ActivationCodes
    SET
      status = 'used',
      used_at = ?,
      used_by_device_id = ?
    WHERE id = ?
  `).run(activatedAt, deviceId, activation.id)

  setLicenseState(license.id, {
    licenseName: licenseName || license.license_name,
    licenseType: license.license_type,
    status: 'active',
    startsAt: license.starts_at || activatedAt,
    expiresAt,
    refreshAfter,
    offlineGraceUntil,
    lastValidatedAt: activatedAt,
    features: parseFeaturesJson(license.features_json),
    notes: license.notes,
    serverUrl: serverUrl ?? license.server_url,
    email: customerEmail,
    activationCode: activation.code,
    installedLicense: license.installed_license,
    deviceId,
    importedFile: license.imported_file,
    updatedAt: activatedAt,
  })

  const prepared = getLicenseById(license.id)

  if (!prepared) {
    throw new Error('Activated license could not be loaded.')
  }

  const result = issueTokenForLicense(prepared, {
    status: 'active',
    deviceId,
    serverUrl,
  })

  recordLicenseEvent(
    license.id,
    customerId,
    'license_activated',
    {
      activation_code: activation.code,
      expires_at: expiresAt,
    },
    deviceId,
  )

  return result
}

export function validateInstalledLicense(input: LicenseRefreshInput) {
  const deviceId = requireText(input.deviceId, 'Device ID')
  const client = normalizeClientInfo(input.client)
  const payload = parseAndVerifyLicenseToken(input.token)
  const license = getLicenseById(parsePublicLicenseId(payload.license_id))

  if (!license) {
    throw new Error('License token does not map to an active backend record.')
  }

  if (license.installed_license && license.installed_license !== input.token) {
    throw new Error('A newer license token has already been issued.')
  }

  if (payload.device_id !== deviceId) {
    throw new Error('The device ID does not match the license token.')
  }

  const device = getActiveLicenseDevice(license.id, deviceId)

  if (!device) {
    throw new Error('This device is not currently bound to the license.')
  }

  if (license.status !== 'active' && license.status !== 'trial_active') {
    throw new Error('This license is not active.')
  }

  if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
    const updatedAt = nowIso()
    db.prepare('UPDATE Licenses SET status = ?, updated_at = ? WHERE id = ?').run('expired', updatedAt, license.id)

    if (license.license_type === 'trial') {
      db.prepare(`
        UPDATE TrialActivations
        SET status = 'trial_expired'
        WHERE email = ? AND device_id = ? AND status = 'trial_active'
      `).run(license.license_email, deviceId)
    }

    throw new Error('This license has expired.')
  }

  upsertLicenseDevice(license, deviceId, client, 'active')

  const refreshedAt = nowIso()
  const refreshAfter = license.license_type === 'trial' ? isoInHours(24) : isoInHours(24 * 7)
  const offlineGraceUntil = license.license_type === 'trial' ? license.expires_at : clampOfflineGrace(license.expires_at, 7)

  setLicenseState(license.id, {
    licenseName: license.license_name,
    licenseType: license.license_type,
    status: license.status,
    startsAt: license.starts_at,
    expiresAt: license.expires_at,
    refreshAfter,
    offlineGraceUntil,
    lastValidatedAt: refreshedAt,
    features: parseFeaturesJson(license.features_json),
    notes: license.notes,
    serverUrl: license.server_url,
    email: license.license_email,
    activationCode: license.activation_code,
    installedLicense: license.installed_license,
    deviceId,
    importedFile: license.imported_file,
    updatedAt: refreshedAt,
  })

  const refreshed = getLicenseById(license.id)

  if (!refreshed) {
    throw new Error('Refreshed license could not be loaded.')
  }

  const result = issueTokenForLicense(refreshed, {
    status: refreshed.license_type === 'trial' ? 'trial_active' : 'active',
    deviceId,
    serverUrl: refreshed.server_url,
  })

  recordLicenseEvent(
    license.id,
    license.customer_id,
    'license_validated',
    {
      status: result.license.status,
      expires_at: result.license.expiresAt,
    },
    deviceId,
  )

  return result
}

export function deactivateInstalledLicense(input: LicenseRefreshInput) {
  const deviceId = requireText(input.deviceId, 'Device ID')
  const client = normalizeClientInfo(input.client)
  const payload = parseAndVerifyLicenseToken(input.token)
  const license = getLicenseById(parsePublicLicenseId(payload.license_id))

  if (!license) {
    throw new Error('License token does not map to an active backend record.')
  }

  if (payload.device_id !== deviceId) {
    throw new Error('The device ID does not match the license token.')
  }

  const device = getActiveLicenseDevice(license.id, deviceId)

  if (!device) {
    throw new Error('The requested device does not match the installed license.')
  }

  upsertLicenseDevice(license, deviceId, client, 'released')

  const updatedAt = nowIso()
  db.prepare(`
    UPDATE Licenses
    SET
      installed_license = CASE WHEN device_id = ? THEN NULL ELSE installed_license END,
      device_id = CASE WHEN device_id = ? THEN NULL ELSE device_id END,
      refresh_after = NULL,
      offline_grace_until = NULL,
      updated_at = ?
    WHERE id = ?
  `).run(deviceId, deviceId, updatedAt, license.id)

  if (license.license_type === 'trial') {
    db.prepare(`
      UPDATE TrialActivations
      SET status = 'blocked'
      WHERE email = ? AND device_id = ? AND status = 'trial_active'
    `).run(license.license_email, deviceId)

    db.prepare('UPDATE Licenses SET status = ? WHERE id = ?').run('trial_deactivated', license.id)
  }

  recordLicenseEvent(
    license.id,
    license.customer_id,
    'device_released',
    {
      status: 'released',
    },
    deviceId,
  )

  const updated = getLicenseById(license.id)

  if (!updated) {
    throw new Error('Released device state could not be loaded.')
  }

  return toPublicLicense(updated)
}

export function exportOfflineLicenseForCustomer(customerId: number, customerEmail: string, input: LicenseDownloadInput) {
  const deviceId = requireText(input.deviceId, 'Device ID')
  const serverUrl = normalizeOptionalText(input.serverUrl)
  const client = normalizeClientInfo(input.client)
  const identifier = input.licenseCode

  let license: LicenseRow | undefined

  if (identifier.startsWith('lic_')) {
    license = getLicenseByPublicId(customerId, identifier)
  } else {
    const activation = getActivationCodeRow(identifier.toUpperCase())
    if (activation && activation.customer_id === customerId) {
      license = getLicenseById(activation.license_id)
    }
  }

  if (!license) {
    throw new Error('Requested license could not be found for this customer.')
  }

  if (license.license_email !== customerEmail) {
    throw new Error('This license does not belong to the current customer.')
  }

  validateLicenseCommercialState(license)
  ensureSeatAvailability(license, deviceId)
  upsertLicenseDevice(license, deviceId, client, 'active')

  const prepared = getLicenseById(license.id)

  if (!prepared) {
    throw new Error('Offline license could not be loaded.')
  }

  const result = issueTokenForLicense(prepared, {
    status: prepared.license_type === 'trial' ? 'trial_active' : 'active',
    deviceId,
    serverUrl,
  })

  recordLicenseEvent(
    license.id,
    customerId,
    'license_downloaded',
    {
      public_license_id: toPublicLicenseId(license.id),
    },
    deviceId,
  )

  return {
    envelope: {
      format: 'SPAI1-LIC',
      token: result.token,
      exported_at: nowIso(),
    } satisfies LicenseDownloadEnvelope,
    license: result.license,
    token: result.token,
  }
}
