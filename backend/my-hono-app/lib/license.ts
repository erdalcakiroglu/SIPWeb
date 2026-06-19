import { signPayload } from './crypto'

export async function generateOfflineLicenseFile(
  c: any,
  license: any,
  options?: {
    customerId?: number | string | null
    deviceId?: string | null
    serverUrl?: string | null
    licenseName?: string | null
    source?: string
    licenseCode?: string
  },
) {
  const now = new Date().toISOString()
  const deviceId = options?.deviceId ?? license.device_id ?? null
  const serverUrl = options?.serverUrl ?? license.server_url ?? null
  const licenseName = options?.licenseName ?? license.license_name ?? null
  const licenseCode = options?.licenseCode ?? license.installed_license ?? String(license.id)
  const customerId = options?.customerId ?? license.customer_id

  const envelope = {
    version: 1,
    type: 'sqlperformance-offline-license',
    issued_at: now,
    license: {
      id: license.id,
      customer_id: license.customer_id,
      license_name: licenseName,
      license_type: license.license_type,
      status: license.status,
      starts_at: license.starts_at,
      expires_at: license.expires_at,
      refresh_after: license.refresh_after,
      offline_grace_until: license.offline_grace_until,
      allowed_devices: license.allowed_devices,
      license_count: license.license_count,
      features: JSON.parse(license.features_json || '[]'),
      server_url: serverUrl,
      license_email: license.license_email,
      activation_code: license.activation_code,
      installed_license: license.installed_license,
      device_id: deviceId,
    },
  }

  await c.env.DB
    .prepare(`
      INSERT INTO LicenseEvents (
        license_id,
        customer_id,
        event_type,
        device_id,
        payload_json,
        created_at
      )
      VALUES (?, ?, 'offline_license_downloaded', ?, ?, ?)
    `)
    .bind(
      license.id,
      customerId,
      deviceId,
      JSON.stringify({
        source: options?.source || 'license-api',
        license_code: licenseCode,
      }),
      now,
    )
    .run()

  const safeLicenseName = String(envelope.license.license_name || 'license').replace(
    /[^A-Za-z0-9_-]+/g,
    '-',
  )
  const fileName = `${safeLicenseName}-${licenseCode}.lic`
  const payloadText = JSON.stringify(envelope)
  const signature = await signPayload(payloadText, c.env.LICENSE_PRIVATE_KEY)

  const signedEnvelope = {
    payload: envelope,
    signature,
    algorithm: 'Ed25519',
    public_key: c.env.LICENSE_PUBLIC_KEY,
  }

  return {
    fileName,
    content: JSON.stringify(signedEnvelope, null, 2),
  }
}
