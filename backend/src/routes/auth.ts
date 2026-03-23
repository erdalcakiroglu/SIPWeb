import type { Request } from 'express'
import { Router } from 'express'
import { validateBody } from '../middleware/validate'
import {
  activateCustomer,
  changeCustomerPassword,
  getPublicCustomerById,
  loginCustomer,
  registerCustomer,
  syncCustomerFromApp,
} from '../lib/customers'
import {
  deleteCustomerManagedLicense,
  issueActivationCodeForDevice,
  listLicensesByCustomerId,
  syncLicenseSnapshot,
} from '../lib/licenses'
import { sendActivationEmail } from '../lib/mailer'
import {
  authActivateSchema,
  authChangePasswordSchema,
  authLoginSchema,
  authRegisterSchema,
} from '../lib/schemas'

export const authRouter = Router()

function getAuthenticatedCustomer(request: Request) {
  const userId = request.session.userId

  if (!userId) {
    throw new Error('Authentication required.')
  }

  const customer = getPublicCustomerById(userId)

  if (!customer) {
    request.session.destroy(() => undefined)
    throw new Error('Customer not found.')
  }

  return customer
}

authRouter.get('/me', (request, response) => {
  const userId = request.session.userId

  if (!userId) {
    response.json({ authenticated: false, customer: null })
    return
  }

  const customer = getPublicCustomerById(userId)

  if (!customer) {
    request.session.destroy(() => undefined)
    response.json({ authenticated: false, customer: null })
    return
  }

  response.json({ authenticated: true, customer, licenses: listLicensesByCustomerId(customer.id) })
})

authRouter.post('/register', validateBody(authRegisterSchema), async (request, response) => {
  try {
    const result = registerCustomer(request.body)
    const delivery = await sendActivationEmail(result.email, result.name, result.verificationCode)

    response.status(201).json({
      message:
        delivery === 'smtp'
          ? 'Registration completed. We sent an activation code to your email address.'
          : 'Registration completed. SMTP is not configured, so the activation code was written to data/mail-outbox.log.',
      delivery,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.'
    response.status(400).json({ message })
  }
})

authRouter.post('/activate', validateBody(authActivateSchema), (request, response) => {
  try {
    const customer = activateCustomer(request.body.email, request.body.code)

    response.json({
      message: 'Your account has been activated. You can now log in.',
      customer,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation failed.'
    response.status(400).json({ message })
  }
})

authRouter.post('/login', validateBody(authLoginSchema), (request, response) => {
  try {
    const customer = loginCustomer(request.body.email, request.body.password)
    request.session.userId = customer.id

    response.json({
      message: 'Login successful.',
      customer,
      licenses: listLicensesByCustomerId(customer.id),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.'
    response.status(400).json({ message })
  }
})

authRouter.post('/logout', (request, response) => {
  request.session.destroy(() => {
    response.json({ message: 'You have been logged out.' })
  })
})

authRouter.post('/change-password', validateBody(authChangePasswordSchema), (request, response) => {
  try {
    const customer = getAuthenticatedCustomer(request)
    const updatedCustomer = changeCustomerPassword(
      customer.id,
      request.body.newPassword,
      request.body.confirmPassword,
    )

    response.json({
      message: 'Your password has been updated.',
      customer: updatedCustomer,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password update failed.'
    response.status(message === 'Authentication required.' ? 401 : 400).json({ message })
  }
})

authRouter.post('/license/activation-code', (request, response) => {
  try {
    const customer = getAuthenticatedCustomer(request)
    const result = issueActivationCodeForDevice(customer.id, customer.email, {
      deviceId: request.body?.deviceId ?? request.body?.device_id,
      serverUrl: request.body?.serverUrl ?? request.body?.server_url,
      licenseName: request.body?.licenseName ?? request.body?.license_name,
      publicLicenseId: request.body?.licenseId ?? request.body?.license_id,
      createNewLicense: request.body?.createNewLicense ?? request.body?.create_new_license,
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
    response.status(message === 'Authentication required.' ? 401 : 400).json({ message })
  }
})

authRouter.delete('/licenses/:licenseId', (request, response) => {
  try {
    const customer = getAuthenticatedCustomer(request)
    const result = deleteCustomerManagedLicense(customer.id, request.params.licenseId)

    response.json({
      message: 'License deleted.',
      deletedLicenseId: result.deletedLicenseId,
      licenses: result.licenses,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'License deletion failed.'
    response.status(message === 'Authentication required.' ? 401 : 400).json({ message })
  }
})

authRouter.post('/sync', (request, response) => {
  try {
    const customer = getAuthenticatedCustomer(request)
    const syncedCustomer = request.body?.customer
      ? syncCustomerFromApp(customer.id, request.body.customer)
      : customer
    const syncedLicenses = request.body?.license
      ? syncLicenseSnapshot(customer.id, syncedCustomer.email, request.body.license)
      : listLicensesByCustomerId(customer.id)

    response.json({
      message: 'Application snapshot synced to SQLite.',
      customer: syncedCustomer,
      licenses: syncedLicenses,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed.'
    response.status(message === 'Authentication required.' ? 401 : 400).json({ message })
  }
})
