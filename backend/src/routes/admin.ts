import type { Request } from 'express'
import { Router } from 'express'
import { adminLoginLimiter } from '../middleware/rateLimit'
import { validateBody } from '../middleware/validate'
import {
  authenticateAdmin,
  deleteAdminCustomer,
  getAdminCustomerDetail,
  getAdminDashboardData,
  updateAdminCustomer,
} from '../lib/admin'
import { adminLoginSchema } from '../lib/schemas'

export const adminRouter = Router()

function requireAdminSession(request: Request) {
  if (!request.session.adminAuthenticated) {
    throw new Error('Admin authentication required.')
  }
}

adminRouter.get('/me', (request, response) => {
  if (!request.session.adminAuthenticated) {
    response.json({ authenticated: false, admin: null })
    return
  }

  response.json({
    authenticated: true,
    admin: {
      email: request.session.adminEmail ?? null,
    },
  })
})

adminRouter.post('/login', adminLoginLimiter, validateBody(adminLoginSchema), (request, response) => {
  try {
    const admin = authenticateAdmin(request.body.email, request.body.password)

    request.session.adminAuthenticated = true
    request.session.adminEmail = admin.email

    response.json({
      message: 'Admin login successful.',
      admin,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin login failed.'
    response.status(400).json({ message })
  }
})

adminRouter.post('/logout', (request, response) => {
  request.session.adminAuthenticated = undefined
  request.session.adminEmail = undefined

  response.json({ message: 'Admin session closed.' })
})

adminRouter.get('/dashboard', (request, response) => {
  try {
    requireAdminSession(request)
    response.json(getAdminDashboardData())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dashboard request failed.'
    response.status(401).json({ message })
  }
})

adminRouter.get('/customers/:customerId', (request, response) => {
  try {
    requireAdminSession(request)
    const customerId = Number.parseInt(request.params.customerId, 10)
    response.json(getAdminCustomerDetail(customerId))
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
