import type { Request } from 'express'
import { Router } from 'express'
import { licenseSensitiveLimiter } from '../middleware/rateLimit'
import { validateBody } from '../middleware/validate'
import { getActiveCustomerByEmail, getPublicCustomerById, loginCustomer, resolveCustomerForLicenseEmail } from '../lib/customers'
import {
  activateLicenseForCustomer,
  deactivateInstalledLicense,
  exportOfflineLicenseForCustomer,
  getLicenseVerificationInfo,
  issueActivationCodeForDevice,
  startTrialForCustomer,
  validateInstalledLicense,
} from '../lib/licenses'
import {
  licenseActivationCodeBodySchema,
  licenseActivateSchema,
  licenseTrialStartSchema,
} from '../lib/schemas'

export const licenseRouter = Router()

function getBearerToken(request: Request) {
  const authorization = request.header('Authorization')

  if (!authorization) {
    return null
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  return match ? match[1].trim() : null
}

function bodyValue(request: Request, camelKey: string, snakeKey: string) {
  return request.body?.[camelKey] ?? request.body?.[snakeKey]
}

function queryValue(request: Request, camelKey: string, snakeKey: string) {
  const value = request.query[snakeKey] ?? request.query[camelKey]

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }

  return undefined
}

licenseRouter.get('/license/public-key', (_request, response) => {
  response.json(getLicenseVerificationInfo())
})

licenseRouter.get('/license/activation-code', (_request, response) => {
  response.status(405).json({
    message: 'Use POST /api/license/activation-code or generate the code from the account page.',
  })
})

licenseRouter.post('/trial/start', licenseSensitiveLimiter, validateBody(licenseTrialStartSchema), (request, response) => {
  try {
    const body = request.body as { email: string; deviceId: string; serverUrl?: string; licenseName?: string }
    const customer = resolveCustomerForLicenseEmail(body.email)
    const result = startTrialForCustomer(customer.id, customer.email, {
      deviceId: body.deviceId,
      serverUrl: body.serverUrl,
      licenseName: body.licenseName,
    })

    response.status(201).json({
      message: 'Trial started.',
      token: result.token,
      status: result.license.status,
      trial_expires_at: result.license.expiresAt,
      last_validated_at: result.license.lastValidatedAt,
      refresh_after: result.license.refreshAfter,
      offline_grace_until: result.license.offlineGraceUntil,
      allowed_devices: result.license.allowedDevices,
      license_count: result.license.licenseCount,
      license: result.license,
      public_key: getLicenseVerificationInfo().publicKeyPem,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Trial start failed.'
    response.status(400).json({ message })
  }
})

licenseRouter.post('/license/activation-code', licenseSensitiveLimiter, validateBody(licenseActivationCodeBodySchema), (request, response) => {
  try {
    const body = request.body as { email: string; password: string; deviceId: string; serverUrl?: string; licenseName?: string }
    const customer = loginCustomer(body.email, body.password)
    const result = issueActivationCodeForDevice(customer.id, customer.email, {
      deviceId: body.deviceId,
      serverUrl: body.serverUrl,
      licenseName: body.licenseName,
    })

    response.json({
      message: 'Activation code generated for this device.',
      activationCode: result.activationCode,
      activation_code: result.activation_code,
      licenseCode: result.licenseCode,
      license_code: result.license_code,
      status: result.status,
      issuedAt: result.issuedAt,
      issued_at: result.issued_at,
      expiresAt: result.expiresAt,
      expires_at: result.expires_at,
      license: result.license,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation code generation failed.'
    response.status(400).json({ message })
  }
})

licenseRouter.post('/license/activate', validateBody(licenseActivateSchema), (request, response) => {
  try {
    const body = request.body as {
      email: string
      activationCode: string
      deviceId: string
      serverUrl?: string
      licenseName?: string
      client?: unknown
    }
    const customer = getActiveCustomerByEmail(body.email)
    const result = activateLicenseForCustomer(customer.id, customer.email, {
      activationCode: body.activationCode,
      deviceId: body.deviceId,
      serverUrl: body.serverUrl,
      licenseName: body.licenseName,
      client: body.client,
    })

    response.json({
      message: 'License activated.',
      token: result.token,
      status: result.license.status,
      expires_at: result.license.expiresAt,
      last_validated_at: result.license.lastValidatedAt,
      refresh_after: result.license.refreshAfter,
      offline_grace_until: result.license.offlineGraceUntil,
      allowed_devices: result.license.allowedDevices,
      license_count: result.license.licenseCount,
      activationCode: result.license.activationCode,
      activation_code: result.license.activationCode,
      license: result.license,
      public_key: getLicenseVerificationInfo().publicKeyPem,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'License activation failed.'
    response.status(400).json({ message })
  }
})

licenseRouter.post('/license/validate', (request, response) => {
  try {
    const bearerToken = getBearerToken(request)

    if (!bearerToken) {
      throw new Error('Authorization header with Bearer token is required.')
    }

    const result = validateInstalledLicense({
      token: bearerToken,
      deviceId: bodyValue(request, 'deviceId', 'device_id'),
      client: request.body?.client,
    })

    response.json({
      message: 'License validated successfully.',
      token: result.token,
      status: result.license.status,
      expires_at: result.license.expiresAt,
      last_validated_at: result.license.lastValidatedAt,
      refresh_after: result.license.refreshAfter,
      offline_grace_until: result.license.offlineGraceUntil,
      allowed_devices: result.license.allowedDevices,
      license_count: result.license.licenseCount,
      license: result.license,
      public_key: getLicenseVerificationInfo().publicKeyPem,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'License validation failed.'
    response.status(400).json({ message })
  }
})

licenseRouter.post('/license/deactivate', (request, response) => {
  try {
    const bearerToken = getBearerToken(request)

    if (!bearerToken) {
      throw new Error('Authorization header with Bearer token is required.')
    }

    const license = deactivateInstalledLicense({
      token: bearerToken,
      deviceId: bodyValue(request, 'deviceId', 'device_id'),
      client: request.body?.client,
    })

    response.json({
      message: 'License deactivated.',
      license,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'License deactivation failed.'
    response.status(400).json({ message })
  }
})

licenseRouter.get('/license/download/:licenseCode', (request, response) => {
  try {
    const sessionCustomer = request.session.userId ? getPublicCustomerById(request.session.userId) : null
    const customer = sessionCustomer ?? getActiveCustomerByEmail(queryValue(request, 'email', 'email'))
    const result = exportOfflineLicenseForCustomer(customer.id, customer.email, {
      licenseCode: request.params.licenseCode,
      deviceId: queryValue(request, 'deviceId', 'device_id'),
      serverUrl: queryValue(request, 'serverUrl', 'server_url'),
      licenseName: queryValue(request, 'licenseName', 'license_name'),
    })

    if (request.params.licenseCode.startsWith('lic_') && sessionCustomer) {
      const safeLicenseName = result.license.licenseName.replace(/[^A-Za-z0-9_-]+/g, '-')
      const fileName = `${safeLicenseName}-${request.params.licenseCode}.lic`

      response.setHeader('Content-Type', 'application/json')
      response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      response.send(JSON.stringify(result.envelope, null, 2))
      return
    }

    response.json({
      message: 'Offline license file generated.',
      file: result.envelope,
      license: result.license,
      public_key: getLicenseVerificationInfo().publicKeyPem,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Offline license export failed.'
    response.status(400).json({ message })
  }
})
