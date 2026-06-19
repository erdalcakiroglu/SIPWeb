import { Hono } from 'hono'
import type { Bindings } from '../types'
import { rateLimit } from '../lib/rateLimit'
import { getClientIp } from '../lib/http'
import { randomCode, randomToken } from '../lib/ids'
import { generateOfflineLicenseFile } from '../lib/license'

export const licenseRoutes = new Hono<{ Bindings: Bindings }>()

licenseRoutes.get('/api/license/public-key', (c) => {
  return c.json({
    public_key: c.env.LICENSE_PUBLIC_KEY,
  })
})

licenseRoutes.get('/api/license/public-key/download', (c) => {
  return new Response(c.env.LICENSE_PUBLIC_KEY, {
    headers: {
      'Content-Type': 'application/x-pem-file',
      'Content-Disposition': 'attachment; filename="ed25519-public.pem"',
    },
  })
})

licenseRoutes.get('/api/license/download/:licenseCode', async (c) => {
  try {
    const licenseCode = c.req.param('licenseCode')
    const email = c.req.query('email')
    const deviceId = c.req.query('deviceId') || c.req.query('device_id')
    const serverUrl = c.req.query('serverUrl') || c.req.query('server_url') || null
    const licenseName =
      c.req.query('licenseName') || c.req.query('license_name') || null

    if (!email) {
      return c.json({ message: 'email query parameter is required.' }, 400)
    }

    if (!deviceId) {
      return c.json({ message: 'deviceId query parameter is required.' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, is_active
        FROM Customers
        WHERE email = ?
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (!customer) {
      return c.json({ message: 'Customer not found.' }, 400)
    }

    if (customer.is_active !== 1) {
      return c.json({ message: 'Customer is not active.' }, 400)
    }

    let license = null

    if (licenseCode.startsWith('lic_')) {
      license = await c.env.DB
        .prepare(`
          SELECT *
          FROM Licenses
          WHERE installed_license = ?
            AND customer_id = ?
          LIMIT 1
        `)
        .bind(licenseCode, customer.id)
        .first<any>()
    } else {
      license = await c.env.DB
        .prepare(`
          SELECT *
          FROM Licenses
          WHERE id = ?
            AND customer_id = ?
          LIMIT 1
        `)
        .bind(licenseCode, customer.id)
        .first<any>()
    }

    if (!license) {
      return c.json({ message: 'License not found.' }, 400)
    }

    const licFile = await generateOfflineLicenseFile(c, license, {
      customerId: customer.id,
      deviceId,
      serverUrl,
      licenseName,
      source: 'license-api',
      licenseCode,
    })

    return new Response(licFile.content, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${licFile.fileName}"`,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Offline license export failed.'

    return c.json({ message }, 400)
  }
})

licenseRoutes.post('/api/license/validate', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `license-validate:${ip}`, 60, 60)

    if (!rl.allowed) {
      return c.json(
        {
          valid: false,
          error: 'Too many validation requests. Please try again later.',
          retry_after_seconds: Math.max(0, rl.reset - Math.floor(Date.now() / 1000)),
        },
        429,
      )
    }

    const authHeader = c.req.header('Authorization') || ''

    if (!authHeader.startsWith('Bearer ')) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        400,
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const body = await c.req.json().catch(() => ({}))
    const deviceId = body.deviceId || body.device_id

    if (!deviceId) {
      return c.json({ message: 'deviceId is required.' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT
          l.*,
          c.is_active AS customer_is_active
        FROM Licenses l
        LEFT JOIN Customers c ON c.id = l.customer_id
        WHERE l.installed_license = ?
          AND device_id = ?
        LIMIT 1
      `)
      .bind(token, deviceId)
      .first()

    if (!license) {
      return c.json({ message: 'License not found or device mismatch.' }, 400)
    }

    if (!license.customer_is_active) {
      return c.json(
        {
          valid: false,
          error: 'Customer account is inactive',
        },
        403,
      )
    }

    if (license.status !== 'active') {
      return c.json({ message: 'License is not active.', license }, 400)
    }

    const now = new Date().toISOString()

    if (license.expires_at && String(license.expires_at) < now) {
      return c.json({ message: 'License expired.', license }, 400)
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET last_validated_at = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .bind(now, now, license.id)
      .run()

    await c.env.DB
      .prepare(`
        UPDATE LicenseDevices
        SET last_seen_at = ?,
            updated_at = ?
        WHERE license_id = ?
          AND device_id = ?
      `)
      .bind(now, now, license.id, deviceId)
      .run()

    return c.json({
      message: 'License validated successfully.',
      token,
      status: license.status,
      expires_at: license.expires_at,
      last_validated_at: now,
      refresh_after: license.refresh_after,
      offline_grace_until: license.offline_grace_until,
      allowed_devices: license.allowed_devices,
      license_count: license.license_count,
      license,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'License validation failed.'

    return c.json({ message }, 400)
  }
})

licenseRoutes.post('/api/license/activation-code', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `license-activation-code:${ip}`, 10, 60)

    if (!rl.allowed) {
      return c.json(
        {
          success: false,
          message: 'Too many activation code requests. Please try again later.',
          retry_after_seconds: Math.max(0, rl.reset - Math.floor(Date.now() / 1000)),
        },
        429,
      )
    }

    const body = await c.req.json().catch(() => ({}))

    const email = body.email
    const deviceId = body.deviceId || body.device_id
    const serverUrl = body.serverUrl || body.server_url || null
    const licenseName =
      body.licenseName || body.license_name || 'SQL Performance License'

    if (!email) {
      return c.json({ message: 'email is required.' }, 400)
    }

    if (!deviceId) {
      return c.json({ message: 'deviceId is required.' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, is_active
        FROM Customers
        WHERE email = ?
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (!customer) {
      return c.json({ message: 'Customer not found.' }, 400)
    }

    if (customer.is_active !== 1) {
      return c.json({ message: 'Customer is not active.' }, 400)
    }

    let license = await c.env.DB
      .prepare(`
        SELECT *
        FROM Licenses
        WHERE customer_id = ?
          AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
      `)
      .bind(customer.id)
      .first<any>()

    const now = new Date().toISOString()
    const activationCode = randomCode('act')

    if (!license) {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const result = await c.env.DB
        .prepare(`
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
            server_url,
            license_email,
            activation_code,
            device_id,
            created_at,
            updated_at,
            created_via
          )
          VALUES (?, ?, 'subscription', 'active', ?, ?, ?, ?, NULL, 1, 1, ?, ?, ?, ?, ?, ?, ?, 'api')
        `)
        .bind(
          customer.id,
          licenseName,
          now,
          expiresAt.toISOString(),
          now,
          expiresAt.toISOString(),
          '["all_modules"]',
          serverUrl,
          email,
          activationCode,
          deviceId,
          now,
          now,
        )
        .run()

      license = await c.env.DB
        .prepare(`
          SELECT *
          FROM Licenses
          WHERE id = ?
          LIMIT 1
        `)
        .bind(result.meta?.last_row_id)
        .first<any>()
    } else {
      await c.env.DB
        .prepare(`
          UPDATE Licenses
          SET activation_code = ?,
              device_id = ?,
              server_url = ?,
              license_email = ?,
              updated_at = ?
          WHERE id = ?
        `)
        .bind(activationCode, deviceId, serverUrl, email, now, license.id)
        .run()

      license.activation_code = activationCode
      license.device_id = deviceId
      license.server_url = serverUrl
      license.license_email = email
      license.updated_at = now
    }

    await c.env.DB
      .prepare(`
        INSERT INTO ActivationCodes (
          license_id,
          customer_id,
          code,
          status,
          device_id,
          issued_at,
          expires_at,
          created_via
        )
        VALUES (?, ?, ?, 'issued', ?, ?, ?, 'api')
      `)
      .bind(
        license.id,
        customer.id,
        activationCode,
        deviceId,
        now,
        license.expires_at,
      )
      .run()

    return c.json({
      message: 'Activation code generated for this device.',
      activationCode,
      activation_code: activationCode,
      licenseCode: license.id,
      license_code: license.id,
      status: 'issued',
      issuedAt: now,
      issued_at: now,
      expiresAt: license.expires_at,
      expires_at: license.expires_at,
      license,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Activation code generation failed.'

    return c.json({ message }, 400)
  }
})

licenseRoutes.post('/api/license/activate', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `license-activate:${ip}`, 10, 60)

    if (!rl.allowed) {
      return c.json(
        {
          success: false,
          message: 'Too many activation attempts. Please try again later.',
          retry_after_seconds: Math.max(0, rl.reset - Math.floor(Date.now() / 1000)),
        },
        429,
      )
    }

    const body = await c.req.json().catch(() => ({}))

    const email = body.email
    const activationCode = body.activationCode || body.activation_code
    const deviceId = body.deviceId || body.device_id
    const serverUrl = body.serverUrl || body.server_url || null
    const licenseName = body.licenseName || body.license_name || null

    if (!email) return c.json({ message: 'email is required.' }, 400)
    if (!activationCode) {
      return c.json({ message: 'activationCode is required.' }, 400)
    }
    if (!deviceId) return c.json({ message: 'deviceId is required.' }, 400)

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, is_active
        FROM Customers
        WHERE email = ?
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (!customer) return c.json({ message: 'Customer not found.' }, 400)
    if (customer.is_active !== 1) {
      return c.json(
        {
          valid: false,
          error: 'Customer account is inactive',
        },
        403,
      )
    }

    const activation = await c.env.DB
      .prepare(`
        SELECT *
        FROM ActivationCodes
        WHERE code = ?
          AND customer_id = ?
        LIMIT 1
      `)
      .bind(activationCode, customer.id)
      .first<any>()

    if (!activation) {
      return c.json({ message: 'Activation code not found.' }, 400)
    }

    if (activation.status !== 'issued') {
      return c.json(
        { message: 'Activation code already used or inactive.' },
        400,
      )
    }

    const now = new Date().toISOString()

    if (activation.expires_at && String(activation.expires_at) < now) {
      return c.json({ message: 'Activation code expired.' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT *
        FROM Licenses
        WHERE id = ?
          AND customer_id = ?
        LIMIT 1
      `)
      .bind(activation.license_id, customer.id)
      .first<any>()

    if (!license) {
      return c.json({ message: 'License not found.' }, 400)
    }

    if (license.status !== 'active') {
      return c.json({ message: 'License is not active.' }, 400)
    }

    // Cihaz limiti: yeni bir cihaz ekleniyorsa aktif cihaz sayısı allowed_devices'ı aşamaz.
    // (Aynı cihaz yeniden aktive ediliyorsa yeni slot tüketmez.) Mutasyondan önce kontrol et
    // ki limit aşılırsa aktivasyon kodu boşa harcanmasın.
    const allowedDevices = Math.max(1, Number(license.allowed_devices) || 1)
    const activeDeviceRow = await c.env.DB
      .prepare(`
        SELECT COUNT(*) AS total
        FROM LicenseDevices
        WHERE license_id = ?
          AND status = 'active'
          AND device_id != ?
      `)
      .bind(license.id, deviceId)
      .first<any>()

    if (Number(activeDeviceRow?.total || 0) >= allowedDevices) {
      return c.json(
        {
          message: `Device limit reached. This license allows ${allowedDevices} active device(s). Deactivate another device first.`,
          allowed_devices: allowedDevices,
          active_devices: Number(activeDeviceRow?.total || 0),
        },
        403,
      )
    }

    const installedLicense = randomToken('lic')

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET installed_license = ?,
            device_id = ?,
            server_url = COALESCE(?, server_url),
            license_name = COALESCE(?, license_name),
            last_validated_at = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .bind(
        installedLicense,
        deviceId,
        serverUrl,
        licenseName,
        now,
        now,
        license.id,
      )
      .run()

    await c.env.DB
      .prepare(`
        UPDATE ActivationCodes
        SET status = 'used',
            used_at = ?,
            used_by_device_id = ?
        WHERE id = ?
      `)
      .bind(now, deviceId, activation.id)
      .run()

    const existingDevice = await c.env.DB
      .prepare(`
        SELECT id
        FROM LicenseDevices
        WHERE license_id = ?
          AND device_id = ?
        LIMIT 1
      `)
      .bind(license.id, deviceId)
      .first<any>()

    if (existingDevice) {
      await c.env.DB
        .prepare(`
          UPDATE LicenseDevices
          SET status = 'active',
              last_seen_at = ?,
              last_ip = ?,
              last_platform = ?,
              last_app_version = ?,
              updated_at = ?
          WHERE id = ?
        `)
        .bind(
          now,
          c.req.header('CF-Connecting-IP') || null,
          body.client?.platform || null,
          body.client?.appVersion || body.client?.app_version || null,
          now,
          existingDevice.id,
        )
        .run()
    } else {
      await c.env.DB
        .prepare(`
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
          )
          VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          license.id,
          deviceId,
          now,
          now,
          c.req.header('CF-Connecting-IP') || null,
          body.client?.platform || null,
          body.client?.appVersion || body.client?.app_version || null,
          now,
          now,
        )
        .run()
    }

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT *
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(license.id)
      .first<any>()

    return c.json({
      message: 'License activated.',
      token: installedLicense,
      status: updatedLicense.status,
      expires_at: updatedLicense.expires_at,
      last_validated_at: updatedLicense.last_validated_at,
      refresh_after: updatedLicense.refresh_after,
      offline_grace_until: updatedLicense.offline_grace_until,
      allowed_devices: updatedLicense.allowed_devices,
      license_count: updatedLicense.license_count,
      activationCode: updatedLicense.activation_code,
      activation_code: updatedLicense.activation_code,
      license: updatedLicense,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'License activation failed.'

    return c.json({ message }, 400)
  }
})

licenseRoutes.post('/api/license/deactivate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') || ''

    if (!authHeader.startsWith('Bearer ')) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        400,
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const body = await c.req.json().catch(() => ({}))
    const deviceId = body.deviceId || body.device_id

    if (!deviceId) {
      return c.json({ message: 'deviceId is required.' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT *
        FROM Licenses
        WHERE installed_license = ?
          AND device_id = ?
        LIMIT 1
      `)
      .bind(token, deviceId)
      .first<any>()

    if (!license) {
      return c.json({ message: 'License not found or device mismatch.' }, 400)
    }

    const now = new Date().toISOString()

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET installed_license = NULL,
            device_id = NULL,
            last_validated_at = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .bind(now, now, license.id)
      .run()

    await c.env.DB
      .prepare(`
        UPDATE LicenseDevices
        SET status = 'deactivated',
            last_seen_at = ?,
            updated_at = ?
        WHERE license_id = ?
          AND device_id = ?
      `)
      .bind(now, now, license.id, deviceId)
      .run()

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
        VALUES (?, ?, 'deactivated', ?, ?, ?)
      `)
      .bind(
        license.id,
        license.customer_id,
        deviceId,
        JSON.stringify({
          source: 'license-api',
          token_prefix: token.slice(0, 12),
        }),
        now,
      )
      .run()

    return c.json({
      message: 'License deactivated.',
      license: {
        ...license,
        installed_license: null,
        device_id: null,
        last_validated_at: now,
        updated_at: now,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'License deactivation failed.'

    return c.json({ message }, 400)
  }
})
