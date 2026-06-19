import { Hono } from 'hono'
import type { Bindings } from '../types'
import { hashPassword, verifyPassword } from '../utils/password'
import { portalAuth } from '../lib/authGuards'
import { getCustomerPlan, getCustomerUsage } from '../lib/billing'
import { stripeFormRequest } from '../lib/stripe'
import { generateOfflineLicenseFile } from '../lib/license'
import { writeAuditLog } from '../lib/audit'

export const portalRoutes = new Hono<{ Bindings: Bindings }>()

portalRoutes.get('/api/portal/me', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any

  const customer = await c.env.DB
    .prepare(`
      SELECT id, email, name, surname, company_name, job, phone, is_active, created_at, activated_at, force_password_change, password_updated_at
      FROM customers
      WHERE id = ?
    `)
    .bind(user.customer_id)
    .first()

  if (!customer) {
    return c.json({ message: 'Customer not found.' }, 404)
  }

  return c.json({
    customer,
  })
})

portalRoutes.post('/api/portal/change-password', portalAuth, async (c) => {
  try {
    const customer = (c as any).get('portalUser') as any
    const body = await c.req.json().catch(() => null)

    if (!body) {
      return c.json({ error: 'Invalid JSON body.' }, 400)
    }

    const currentPassword = String(body.current_password || '')
    const newPassword = String(body.new_password || '')

    if (newPassword.length < 8) {
      return c.json({ error: 'New password must be at least 8 characters' }, 400)
    }

    const dbCustomer = await c.env.DB
      .prepare(`
        SELECT password_hash
        FROM customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(customer.customer_id)
      .first<any>()

    if (!dbCustomer?.password_hash) {
      return c.json({ error: 'Password is not configured' }, 403)
    }

    const currentOk = await verifyPassword(currentPassword, dbCustomer.password_hash)

    if (!currentOk) {
      return c.json({ error: 'Current password is incorrect' }, 401)
    }

    const newHash = await hashPassword(newPassword)

    await c.env.DB
      .prepare(`
        UPDATE customers
        SET password_hash = ?,
            password_updated_at = datetime('now'),
            force_password_change = 0
        WHERE id = ?
      `)
      .bind(newHash, customer.customer_id)
      .run()

    return c.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password could not be changed.'
    return c.json({ error: message }, 400)
  }
})

portalRoutes.get('/api/portal/licenses', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any

  const result = await c.env.DB
    .prepare(`
      SELECT
        id,
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
        activation_code,
        device_id,
        created_at,
        updated_at
      FROM licenses
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `)
    .bind(user.customer_id)
    .all()

  return c.json({
    licenses: result.results ?? [],
  })
})

portalRoutes.get('/api/portal/licenses/:id', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid license id.' }, 400)
  }

  const license = await c.env.DB
    .prepare(`
      SELECT
        id,
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
        activation_code,
        device_id,
        created_at,
        updated_at
      FROM licenses
      WHERE id = ?
        AND customer_id = ?
    `)
    .bind(id, user.customer_id)
    .first()

  if (!license) {
    return c.json({ message: 'License not found.' }, 404)
  }

  const currentActivations = await c.env.DB
    .prepare(`
      SELECT COUNT(*) AS total
      FROM LicenseDevices
      WHERE license_id = ?
        AND status = 'active'
    `)
    .bind(id)
    .first<any>()

  const parsedFeatures = JSON.parse((license as any).features_json || '[]')

  return c.json({
    license: {
      ...license,
      name: (license as any).license_name,
      device_limit: (license as any).allowed_devices,
      current_activations: Number(currentActivations?.total || 0),
      features: parsedFeatures,
    },
  })
})

portalRoutes.get('/api/portal/licenses/:id/download-lic', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid license id.' }, 400)
  }

  const license = await c.env.DB
    .prepare(`
      SELECT *
      FROM licenses
      WHERE id = ?
        AND customer_id = ?
    `)
    .bind(id, user.customer_id)
    .first<any>()

  if (!license) {
    return c.json({ message: 'License not found.' }, 404)
  }

  if (license.status !== 'active') {
    return c.json({ message: 'License is not active.' }, 403)
  }

  const licFile = await generateOfflineLicenseFile(c, license, {
    customerId: user.customer_id,
    deviceId: license.device_id,
    serverUrl: license.server_url,
    licenseName: license.license_name,
    source: 'portal',
    licenseCode: license.installed_license || String(license.id),
  })

  return new Response(licFile.content, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="sqlperformance-license-${license.id}.lic"`,
      'Cache-Control': 'no-store',
    },
  })
})

portalRoutes.get('/api/portal/licenses/:id/download-license', portalAuth, async (c) => {
  return portalRoutes.fetch(
    new Request(new URL(c.req.url).toString().replace('/download-license', '/download-lic'), c.req.raw),
    c.env,
  )
})

portalRoutes.get('/api/portal/licenses/:id/download-pem', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid license id.' }, 400)
  }

  const license = await c.env.DB
    .prepare(`
      SELECT id
      FROM licenses
      WHERE id = ?
        AND customer_id = ?
    `)
    .bind(id, user.customer_id)
    .first()

  if (!license) {
    return c.json({ message: 'License not found.' }, 404)
  }

  return new Response(c.env.LICENSE_PUBLIC_KEY, {
    headers: {
      'Content-Type': 'application/x-pem-file',
      'Content-Disposition': 'attachment; filename="sqlperformance-public-key.pem"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})

portalRoutes.get('/api/portal/licenses/:id/download-public-key', portalAuth, async (c) => {
  return portalRoutes.fetch(
    new Request(new URL(c.req.url).toString().replace('/download-public-key', '/download-pem'), c.req.raw),
    c.env,
  )
})

portalRoutes.get('/api/portal/downloads/msi', portalAuth, async (c) => {
  return c.json({
    success: true,
    download_url: 'https://downloads.sqlperformance.ai/SQL-Performance-Intelligence.msi',
    file_type: 'msi',
  })
})

portalRoutes.get('/api/portal/billing/summary', portalAuth, async (c) => {
  try {
    const user = (c as any).get('portalUser') as any
    const billing = await getCustomerPlan(c, Number(user.customer_id))

    if (!billing) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    const plans = await c.env.DB
      .prepare(`
        SELECT id, code, name, license_limit, device_limit, stripe_price_id
        FROM subscription_plans
        WHERE is_active = 1
        ORDER BY id ASC
      `)
      .all<any>()

    const usage = await getCustomerUsage(c, Number(user.customer_id))

    return c.json({
      customer: {
        id: billing.customer.id,
        email: billing.customer.email,
        name: billing.customer.name,
        plan_code: billing.customer.plan_code || billing.plan?.code || null,
        stripe_customer_id: billing.customer.stripe_customer_id || null,
        subscription_status: billing.customer.subscription_status || 'inactive',
        current_period_end: billing.customer.current_period_end || null,
      },
      plan: billing.plan
        ? {
            id: billing.plan.id,
            code: billing.plan.code,
            name: billing.plan.name || billing.plan.code,
            license_limit: Number(billing.plan.license_limit || 0),
            device_limit: Number(billing.plan.device_limit || 0),
          }
        : null,
      plans: (plans.results ?? []).map((plan: any) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name || plan.code,
        license_limit: Number(plan.license_limit || 0),
        device_limit: Number(plan.device_limit || 0),
        stripe_price_id: plan.stripe_price_id || null,
      })),
      usage,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Billing summary failed.'
    return c.json({ error: message }, 400)
  }
})

portalRoutes.post('/api/portal/billing/create-checkout-session', portalAuth, async (c) => {
  try {
    const user = (c as any).get('portalUser') as any
    const body = await c.req.json().catch(() => null)
    const planCode = String(body?.planCode ?? '').trim()

    if (!planCode) {
      return c.json({ error: 'planCode is required.' }, 400)
    }

    const plan = await c.env.DB
      .prepare(`
        SELECT *
        FROM subscription_plans
        WHERE code = ?
          AND is_active = 1
        LIMIT 1
      `)
      .bind(planCode)
      .first<any>()

    if (!plan?.stripe_price_id) {
      return c.json({ error: 'Invalid plan' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(user.customer_id)
      .first<any>()

    if (!customer?.email) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    const form = new URLSearchParams()
    form.set('mode', 'subscription')
    form.set('customer_email', customer.email)
    form.set('line_items[0][price]', plan.stripe_price_id)
    form.set('line_items[0][quantity]', '1')
    form.set('success_url', 'https://portal.sqlperformance.ai/portal/billing?success=1')
    form.set('cancel_url', 'https://portal.sqlperformance.ai/portal/billing?cancel=1')
    form.set('metadata[customer_id]', String(customer.id))
    form.set('metadata[plan_code]', plan.code)

    const session = await stripeFormRequest(c, 'checkout/sessions', form)

    await writeAuditLog(c, {
      actorType: 'customer',
      actorId: Number(user.customer_id),
      actorEmail: customer.email,
      action: 'subscription_checkout_created',
      entityType: 'billing',
      entityId: Number(user.customer_id),
      metadata: {
        plan_code: plan.code,
      },
    })

    return c.json({
      url: session.url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout session failed.'
    return c.json({ error: message }, 400)
  }
})

portalRoutes.post('/api/portal/billing/create-portal-session', portalAuth, async (c) => {
  try {
    const user = (c as any).get('portalUser') as any
    const customer = await c.env.DB
      .prepare(`
        SELECT stripe_customer_id
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(user.customer_id)
      .first<any>()

    if (!customer?.stripe_customer_id) {
      return c.json({ error: 'Stripe customer is not configured' }, 400)
    }

    const form = new URLSearchParams()
    form.set('customer', customer.stripe_customer_id)
    form.set('return_url', 'https://portal.sqlperformance.ai/portal/billing')

    const session = await stripeFormRequest(c, 'billing_portal/sessions', form)
    return c.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Portal session failed.'
    return c.json({ error: message }, 400)
  }
})

portalRoutes.post('/api/portal/tickets', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any
  const body = await c.req.json().catch(() => null)

  if (!body) {
    return c.json({ message: 'Invalid JSON body.' }, 400)
  }

  const subject = String(body.subject ?? '').trim()
  const message = String(body.message ?? '').trim()
  const priority = String(body.priority ?? 'normal').trim()

  if (!subject) {
    return c.json({ message: 'subject is required.' }, 400)
  }

  if (!message) {
    return c.json({ message: 'message is required.' }, 400)
  }

  const result = await c.env.DB
    .prepare(`
      INSERT INTO support_tickets (
        customer_id,
        subject,
        message,
        priority,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
    `)
    .bind(user.customer_id, subject, message, priority)
    .run()

  const ticketId = result.meta?.last_row_id

  const ticket = await c.env.DB
    .prepare(`
      SELECT *
      FROM support_tickets
      WHERE id = ?
        AND customer_id = ?
    `)
    .bind(ticketId, user.customer_id)
    .first()

  return c.json(
    {
      success: true,
      ticket,
    },
    201,
  )
})

portalRoutes.get('/api/portal/tickets', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any

  const result = await c.env.DB
    .prepare(`
      SELECT
        id,
        subject,
        status,
        priority,
        created_at,
        updated_at
      FROM support_tickets
      WHERE customer_id = ?
      ORDER BY updated_at DESC, created_at DESC
    `)
    .bind(user.customer_id)
    .all()

  return c.json({
    tickets: result.results ?? [],
  })
})

portalRoutes.get('/api/portal/tickets/:id', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid ticket id.' }, 400)
  }

  const ticket = await c.env.DB
    .prepare(`
      SELECT *
      FROM support_tickets
      WHERE id = ?
        AND customer_id = ?
    `)
    .bind(id, user.customer_id)
    .first()

  if (!ticket) {
    return c.json({ message: 'Ticket not found.' }, 404)
  }

  const replies = await c.env.DB
    .prepare(`
      SELECT
        id,
        sender_type,
        message,
        created_at
      FROM support_ticket_replies
      WHERE ticket_id = ?
      ORDER BY created_at ASC
    `)
    .bind(id)
    .all()

  return c.json({
    ticket,
    replies: replies.results ?? [],
  })
})

portalRoutes.post('/api/portal/tickets/:id/replies', portalAuth, async (c) => {
  const user = (c as any).get('portalUser') as any
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid ticket id.' }, 400)
  }

  const body = await c.req.json().catch(() => null)
  const message = String(body?.message ?? '').trim()

  if (!message) {
    return c.json({ message: 'message is required.' }, 400)
  }

  const ticket = await c.env.DB
    .prepare(`
      SELECT id, status
      FROM support_tickets
      WHERE id = ?
        AND customer_id = ?
    `)
    .bind(id, user.customer_id)
    .first<any>()

  if (!ticket) {
    return c.json({ message: 'Ticket not found.' }, 404)
  }

  if (ticket.status === 'closed') {
    return c.json({ message: 'Ticket is closed.' }, 403)
  }

  const result = await c.env.DB
    .prepare(`
      INSERT INTO support_ticket_replies (
        ticket_id,
        customer_id,
        sender_type,
        message,
        created_at
      )
      VALUES (?, ?, 'customer', ?, datetime('now'))
    `)
    .bind(id, user.customer_id, message)
    .run()

  await c.env.DB
    .prepare(`
      UPDATE support_tickets
      SET updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(id)
    .run()

  const reply = await c.env.DB
    .prepare(`
      SELECT id, ticket_id, customer_id, sender_type, message, created_at
      FROM support_ticket_replies
      WHERE id = ?
    `)
    .bind(result.meta?.last_row_id)
    .first()

  return c.json(
    {
      success: true,
      reply,
    },
    201,
  )
})

portalRoutes.post('/api/portal/tickets/:id/reply', portalAuth, async (c) => {
  return portalRoutes.fetch(
    new Request(new URL(c.req.url).toString().replace('/reply', '/replies'), c.req.raw),
    c.env,
  )
})
