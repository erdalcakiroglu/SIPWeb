import type { Request } from 'express'
import { Router } from 'express'
import { adminLoginLimiter } from '../middleware/rateLimit'
import { validateBody } from '../middleware/validate'
import { csrfProtection, getCsrfToken } from '../middleware/csrf'
import {
  authenticateAdmin,
  createAdminLicense,
  deleteAdminCustomer,
  getAdminCustomerDetail,
  getAdminDashboardData,
  updateAdminCustomer,
  updateAdminLicense,
} from '../lib/admin'
import { adminLoginSchema } from '../lib/schemas'

export const adminRouter = Router()

adminRouter.get('/me', (request, response) => {
  if (!request.session.adminAuthenticated) {
    response.json({ 
      authenticated: false, 
      admin: null,
      csrfToken: getCsrfToken(request),
    })
    return
  }

  response.json({
    authenticated: true,
    admin: {
      email: request.session.adminEmail ?? null,
    },
    csrfToken: getCsrfToken(request),
  })
})

// Login endpoint - NO CSRF required (admin not authenticated yet)
adminRouter.post('/login', adminLoginLimiter, validateBody(adminLoginSchema), (request, response) => {
  try {
    const admin = authenticateAdmin(request.body.email, request.body.password)

    request.session.adminAuthenticated = true
    request.session.adminEmail = admin.email

    response.json({
      message: 'Admin login successful.',
      admin,
      csrfToken: getCsrfToken(request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin login failed.'
    response.status(400).json({ message })
  }
})

// Apply CSRF protection to all other admin routes (except login)
adminRouter.use(csrfProtection)

function requireAdminSession(request: Request) {
  if (!request.session.adminAuthenticated) {
    throw new Error('Admin authentication required.')
  }
}

adminRouter.post('/logout', (request, response) => {
  request.session.adminAuthenticated = undefined
  request.session.adminEmail = undefined

  response.json({ message: 'Admin session closed.' })
})

adminRouter.get('/dashboard', (request, response) => {
  try {
    requireAdminSession(request)
    response.json({
      ...getAdminDashboardData(),
      csrfToken: getCsrfToken(request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dashboard request failed.'
    response.status(401).json({ message })
  }
})

adminRouter.get('/customers/:customerId', (request, response) => {
  try {
    requireAdminSession(request)
    const customerId = Number.parseInt(request.params.customerId, 10)
    response.json({
      ...getAdminCustomerDetail(customerId),
      csrfToken: getCsrfToken(request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer lookup failed.'
    const statusCode = message === 'Customer not found.' ? 404 : 401
    response.status(statusCode).json({ message })
  }
})

adminRouter.patch('/customers/:customerId', (request, response) => {
  try {
    requireAdminSession(request)
    const customerId = Number.parseInt(request.params.customerId, 10)
    const detail = updateAdminCustomer(customerId, request.body ?? {})

    response.json({
      message: `Customer ${detail.customer.email} has been updated.`,
      detail,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer update failed.'
    const statusCode = message === 'Customer not found.' ? 404 : message === 'Admin authentication required.' ? 401 : 400
    response.status(statusCode).json({ message })
  }
})

adminRouter.delete('/customers/:customerId', (request, response) => {
  try {
    requireAdminSession(request)
    const customerId = Number.parseInt(request.params.customerId, 10)
    const result = deleteAdminCustomer(customerId)

    response.json({
      message: `Customer ${result.deletedCustomerEmail} has been deleted.`,
      deletedCustomerId: result.deletedCustomerId,
      deletedCustomerEmail: result.deletedCustomerEmail,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer deletion failed.'
    const statusCode = message === 'Customer not found.' ? 404 : 401
    response.status(statusCode).json({ message })
  }
})

adminRouter.patch('/customers/:customerId/licenses/:licenseId', (request, response) => {
  try {
    requireAdminSession(request)
    const licenseId = Number.parseInt(request.params.licenseId, 10)
    const detail = updateAdminLicense(licenseId, request.body ?? {})

    response.json({
      message: `License ${licenseId} has been updated.`,
      detail,
      csrfToken: getCsrfToken(request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'License update failed.'
    const statusCode = message.includes('not found') ? 404 : message === 'Admin authentication required.' ? 401 : 400
    response.status(statusCode).json({ message })
  }
})

adminRouter.post('/customers/:customerId/licenses', (request, response) => {
  try {
    requireAdminSession(request)
    const customerId = Number.parseInt(request.params.customerId, 10)
    const detail = createAdminLicense(customerId, request.body ?? {})

    response.json({
      message: `New license has been created for customer ${customerId}.`,
      detail,
      csrfToken: getCsrfToken(request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'License creation failed.'
    const statusCode = message.includes('not found') ? 404 : message === 'Admin authentication required.' ? 401 : 400
    response.status(statusCode).json({ message })
  }
})
