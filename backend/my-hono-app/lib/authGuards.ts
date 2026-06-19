import { verifyJwt } from './crypto'

export async function requireAdmin(c: any) {
  const authHeader = c.req.header('Authorization') || ''

  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const payload = await verifyJwt(token, c.env.ADMIN_JWT_SECRET)

  if (payload.type !== 'admin') {
    throw new Error('Admin token required.')
  }

  return payload
}

export async function portalAuth(c: any, next: any) {
  const auth = c.req.header('Authorization') || ''

  if (!auth.startsWith('Bearer ')) {
    return c.json({ message: 'Authorization header with Bearer token is required.' }, 401)
  }

  const token = auth.slice('Bearer '.length)

  try {
    const payload = await verifyJwt(token, c.env.PORTAL_JWT_SECRET)

    if (payload.type !== 'portal' || payload.role !== 'customer') {
      return c.json({ message: 'Invalid portal token.' }, 401)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, name, surname, is_active, force_password_change
        FROM customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(payload.customer_id)
      .first()

    if (!customer) {
      return c.json({ message: 'Customer not found.' }, 404)
    }

    const isActive =
      typeof customer.status === 'string'
        ? customer.status === 'active'
        : Number(customer.is_active) === 1

    if (!isActive) {
      return c.json({ error: 'Customer account is inactive' }, 403)
    }

    const path = new URL(c.req.url).pathname
    const allowedWhenForceChange = [
      '/api/portal/change-password',
      '/api/portal/logout',
      '/api/portal/me',
    ]

    if (Number(customer.force_password_change) === 1 && !allowedWhenForceChange.includes(path)) {
      return c.json(
        {
          error: 'Password change required',
          code: 'PASSWORD_CHANGE_REQUIRED',
        },
        403,
      )
    }

    c.set('portalUser', { ...payload, ...customer, customer_id: customer.id })
    await next()
  } catch {
    return c.json({ message: 'Invalid or expired token.' }, 401)
  }
}
