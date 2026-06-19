import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings } from '../types'
import { hashPassword } from '../utils/password'
import { parsePagination, pagedResponse } from '../utils/pagination'
import { parseSort } from '../utils/sort'
import { addLikeSearch, addStatusFilter, buildWhereSql } from '../utils/filters'
import { sha256Hex } from '../lib/crypto'
import { addExactFilter } from '../lib/http'
import { requireAdmin } from '../lib/authGuards'
import { writeAuditLog } from '../lib/audit'
import { getDownloadReleaseInfo, updateDownloadReleaseInfo } from '../lib/downloadRelease'

const VALID_LICENSE_STATUSES = ['active', 'suspended', 'expired', 'revoked']

const adminDownloadReleaseSchema = z.object({
  version: z.string().min(1, 'Version is required.').transform((value) => value.trim()),
  released: z
    .string()
    .min(1, 'Release date is required.')
    .transform((value) => value.trim())
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Release date must use YYYY-MM-DD format.',
    })
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
      message: 'Release date is invalid.',
    }),
  sha256: z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim().toLowerCase())
    .refine((value) => value === '' || /^[a-f0-9]{64}$/.test(value), {
      message: 'SHA-256 must be empty or a 64-character hexadecimal hash.',
    }),
})

export const adminRoutes = new Hono<{ Bindings: Bindings }>()

adminRoutes.get('/api/admin/me', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const admin = await c.env.DB
      .prepare(`
        SELECT id, email, name, role, is_active, last_login_at
        FROM Admins
        WHERE id = ?
        LIMIT 1
      `)
      .bind(adminToken.sub)
      .first<any>()

    if (!admin) {
      return c.json({ message: 'Admin not found.' }, 404)
    }

    if (admin.is_active !== 1) {
      return c.json({ message: 'Admin account is inactive.' }, 403)
    }

    return c.json({
      admin,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/download/release', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    return c.json({
      downloadRelease: await getDownloadReleaseInfo(c),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download release request failed.'
    return c.json({ message }, 400)
  }
})

adminRoutes.patch('/api/admin/download/release', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const body = await c.req.json().catch(() => null)
    const parsed = adminDownloadReleaseSchema.safeParse(body ?? {})

    if (!parsed.success) {
      return c.json({ message: parsed.error.issues[0]?.message || 'Invalid payload.' }, 400)
    }

    const downloadRelease = await updateDownloadReleaseInfo(
      c,
      parsed.data,
      adminToken.email || null,
    )

    await writeAuditLog(c, {
      actorType: 'admin',
      actorId: adminToken.sub,
      actorEmail: adminToken.email || null,
      action: 'download_release_updated',
      entityType: 'download_release_settings',
      entityId: 1,
      metadata: {
        version: downloadRelease.version,
        released: downloadRelease.released,
        sha256_present: Boolean(downloadRelease.sha256),
      },
    })

    return c.json({
      message: 'Download release settings have been updated.',
      downloadRelease,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download release update failed.'
    return c.json({ message }, 400)
  }
})

adminRoutes.get('/api/admin/audit-logs', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const { page, pageSize, offset } = parsePagination(c)
    const search = String(c.req.query('search') || '').trim().toLowerCase()
    const actorTypeRaw = String(c.req.query('actorType') || '').trim()
    const actionRaw = String(c.req.query('action') || '').trim()
    const entityTypeRaw = String(c.req.query('entityType') || '').trim()
    const entityIdRaw = String(c.req.query('entityId') || '').trim()
    const { sortBy: sortKey, sortDir } = parseSort(
      c,
      ['id', 'actor_type', 'action', 'entity_type', 'entity_id', 'created_at'],
      'created_at',
      'desc',
    )
    const whereClauses: string[] = []
    const params: unknown[] = []
    const sortColumns: Record<string, string> = {
      id: 'id',
      actor_type: 'actor_type',
      action: 'action',
      entity_type: 'entity_type',
      entity_id: 'entity_id',
      created_at: 'created_at',
    }

    addLikeSearch(whereClauses, params, search, [
      "lower(coalesce(actor_email, ''))",
      "lower(coalesce(action, ''))",
      "lower(coalesce(entity_type, ''))",
      "lower(coalesce(ip_address, ''))",
      "lower(coalesce(user_agent, ''))",
      "lower(coalesce(metadata_json, ''))",
    ])
    addExactFilter(whereClauses, params, 'actor_type', actorTypeRaw)
    addExactFilter(whereClauses, params, 'entity_type', entityTypeRaw)

    if (actionRaw) {
      whereClauses.push("lower(coalesce(action, '')) LIKE ?")
      params.push(`%${actionRaw.toLowerCase()}%`)
    }

    const entityId = Number.parseInt(entityIdRaw, 10)
    if (entityIdRaw && Number.isInteger(entityId) && entityId > 0) {
      whereClauses.push('entity_id = ?')
      params.push(entityId)
    }

    const whereSql = buildWhereSql(whereClauses)
    const totalRow = await c.env.DB
      .prepare(`
        SELECT COUNT(*) AS total
        FROM audit_logs
        ${whereSql}
      `)
      .bind(...params)
      .first<{ total: number }>()

    const rows = await c.env.DB
      .prepare(`
        SELECT
          id,
          actor_type,
          actor_id,
          actor_email,
          action,
          entity_type,
          entity_id,
          ip_address,
          user_agent,
          metadata_json,
          created_at
        FROM audit_logs
        ${whereSql}
        ORDER BY ${sortColumns[sortKey] || sortColumns.created_at} ${sortDir}
        LIMIT ?
        OFFSET ?
      `)
      .bind(...params, pageSize, offset)
      .all()

    const total = Number(totalRow?.total || 0)
    return c.json(pagedResponse(rows.results ?? [], page, pageSize, total))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/monitoring/summary', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const [
      customersRow,
      activeLicensesRow,
      activeDevicesRow,
      activationsTodayRow,
      failedActivationsTodayRow,
      openTicketsRow,
      emailsSentTodayRow,
      recentAudit,
    ] = await Promise.all([
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM Customers
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM Licenses
          WHERE status IN ('active', 'trial_active')
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM LicenseDevices
          WHERE status = 'active'
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM LicenseEvents
          WHERE event_type = 'license_activated'
            AND created_at >= datetime('now', 'start of day')
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM audit_logs
          WHERE action = 'activation_failed'
            AND created_at >= datetime('now', 'start of day')
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM support_tickets
          WHERE status = 'open'
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT COUNT(*) AS total
          FROM audit_logs
          WHERE action = 'email_sent'
            AND created_at >= datetime('now', 'start of day')
        `)
        .first<{ total: number }>(),
      c.env.DB
        .prepare(`
          SELECT
            id,
            actor_type,
            actor_email,
            action,
            entity_type,
            entity_id,
            created_at
          FROM audit_logs
          ORDER BY created_at DESC
          LIMIT 10
        `)
        .all(),
    ])

    return c.json({
      customersTotal: Number(customersRow?.total || 0),
      activeLicenses: Number(activeLicensesRow?.total || 0),
      activeDevices: Number(activeDevicesRow?.total || 0),
      activationsToday: Number(activationsTodayRow?.total || 0),
      failedActivationsToday: Number(failedActivationsTodayRow?.total || 0),
      openTickets: Number(openTicketsRow?.total || 0),
      emailsSentToday: Number(emailsSentTodayRow?.total || 0),
      recentAudit: recentAudit.results ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/customers', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const { page, pageSize, offset } = parsePagination(c)
    const search = String(c.req.query('search') || '').trim()
    const status = String(c.req.query('status') || '').trim().toLowerCase()
    const { sortBy: sortKey, sortDir } = parseSort(
      c,
      ['id', 'email', 'name', 'surname', 'status', 'created_at', 'updated_at'],
      'created_at',
      'desc',
    )

    const sortColumns: Record<string, string> = {
      id: 'c.id',
      status: 'c.is_active',
      created_at: 'c.created_at',
      updated_at: 'c.updated_at',
      email: 'c.email',
      name: 'c.name',
      surname: 'c.surname',
    }

    const sortBy = sortColumns[sortKey] || sortColumns.created_at

    const whereClauses: string[] = []
    const params: unknown[] = []

    addLikeSearch(whereClauses, params, search.toLowerCase(), [
      'lower(c.email)',
      'lower(c.name)',
      'lower(c.surname)',
      'lower(c.company_name)',
    ])

    const mappedStatus =
      status === 'active' ? 1 : status === 'inactive' ? 0 : ''
    addStatusFilter(whereClauses, params, mappedStatus as any, 'c.is_active')

    const whereSql = buildWhereSql(whereClauses)

    const totalRow = await c.env.DB
      .prepare(`
        SELECT COUNT(*) AS total
        FROM Customers c
        ${whereSql}
      `)
      .bind(...params)
      .first<any>()

    const total = Number(totalRow?.total || 0)
    const result = await c.env.DB
      .prepare(`
        SELECT
          c.id,
          c.email,
          c.name,
          c.surname,
          c.company_name AS company,
          CASE WHEN c.is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
          c.force_password_change,
          c.password_updated_at,
          c.created_at,
          c.updated_at,
          c.company_name,
          c.is_active,
          c.max_licenses,
          c.activated_at,
          0 AS license_total,
          c.job,
          c.phone
        FROM Customers c
        ${whereSql}
        ORDER BY ${sortBy} ${sortDir}
        LIMIT ?
        OFFSET ?
      `)
      .bind(...params, pageSize, offset)
      .all()

    const items = (result.results ?? []).map((customer: any) => ({
      ...customer,
      license_total: Number(customer.license_total ?? 0),
    }))

    const response = pagedResponse(items, page, pageSize, total)
    return c.json({
      ...response,
      customers: response.items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/customers/:id', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid customer id' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT
          id,
          c.company_name,
          name,
          surname,
          job,
          email,
          phone,
          is_active,
          c.created_at,
          updated_at,
          c.activated_at,
          max_licenses
        FROM Customers c
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>()

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    const licenses = await c.env.DB
      .prepare(`
        SELECT
          id,
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
          activation_code,
          installed_license,
          device_id,
          created_at,
          updated_at
        FROM Licenses
        WHERE customer_id = ?
        ORDER BY created_at DESC
      `)
      .bind(id)
      .all<Record<string, unknown>>()

    const tickets = await c.env.DB
      .prepare(`
        SELECT
          id,
          customer_id,
          subject,
          message,
          status,
          priority,
          created_at,
          updated_at
        FROM support_tickets
        WHERE customer_id = ?
        ORDER BY updated_at DESC, created_at DESC
      `)
      .bind(id)
      .all<Record<string, unknown>>()

    const events = await c.env.DB
      .prepare(`
        SELECT
          e.id,
          e.license_id,
          e.customer_id,
          l.license_name,
          e.event_type,
          e.device_id,
          e.payload_json,
          e.created_at
        FROM LicenseEvents e
        LEFT JOIN Licenses l ON l.id = e.license_id
        WHERE e.customer_id = ?
        ORDER BY e.created_at DESC
        LIMIT 100
      `)
      .bind(id)
      .all<Record<string, unknown>>()

    return c.json({
      customer,
      licenses: licenses.results ?? [],
      tickets: tickets.results ?? [],
      events: events.results ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.delete('/api/admin/customers/:id', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ message: 'Invalid customer id.' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<{ id: number; email: string }>()

    if (!customer) {
      return c.json({ message: 'Customer not found.' }, 404)
    }

    const customerLicenseIdsResult = await c.env.DB
      .prepare(`
        SELECT id
        FROM Licenses
        WHERE customer_id = ?
      `)
      .bind(id)
      .all<{ id: number }>()

    const customerLicenseIds = (customerLicenseIdsResult.results ?? []).map((row) =>
      Number(row.id),
    )

    const customerTicketIdsResult = await c.env.DB
      .prepare(`
        SELECT id
        FROM support_tickets
        WHERE customer_id = ?
      `)
      .bind(id)
      .all<{ id: number }>()

    const customerTicketIds = (customerTicketIdsResult.results ?? []).map((row) =>
      Number(row.id),
    )

    for (const ticketId of customerTicketIds) {
      await c.env.DB
        .prepare(`
          DELETE FROM support_ticket_replies
          WHERE ticket_id = ?
        `)
        .bind(ticketId)
        .run()
    }

    await c.env.DB
      .prepare(`
        DELETE FROM support_ticket_replies
        WHERE customer_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM support_tickets
        WHERE customer_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM auth_sessions
        WHERE user_type = 'customer'
          AND user_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM email_tokens
        WHERE user_type = 'customer'
          AND user_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM audit_logs
        WHERE (entity_type = 'customer' AND entity_id = ?)
           OR (actor_type = 'customer' AND actor_id = ?)
      `)
      .bind(id, id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM LicenseDevices
        WHERE license_id IN (
          SELECT id
          FROM Licenses
          WHERE customer_id = ?
        )
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM ActivationCodes
        WHERE customer_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM LicenseEvents
        WHERE customer_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM TrialActivations
        WHERE customer_id = ?
           OR email = ?
      `)
      .bind(id, customer.email)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM Licenses
        WHERE customer_id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        DELETE FROM Customers
        WHERE id = ?
      `)
      .bind(id)
      .run()

    await writeAuditLog(c, {
      actorType: 'admin',
      actorId: adminToken.sub,
      actorEmail: adminToken.email ?? null,
      action: 'admin_customer_deleted',
      entityType: 'customer',
      entityId: customer.id,
      metadata: {
        email: customer.email,
        deleted_license_ids: customerLicenseIds,
        deleted_ticket_ids: customerTicketIds,
        source: 'admin-api',
      },
    })

    return c.json({
      success: true,
      deletedCustomerId: customer.id,
      deletedCustomerEmail: customer.email,
      message: `Customer ${customer.email} has been deleted.`,
    })
  } catch (error) {
    console.error('DELETE /api/admin/customers/:id error:', error)
    const message = error instanceof Error ? error.message : 'Customer deletion failed.'
    return c.json({ message }, 500)
  }
})

adminRoutes.post('/api/admin/customers/:id/password', async (c) => {
  try {
    const admin = await requireAdmin(c)

    if (!admin) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = Number.parseInt(c.req.param('id'), 10)

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid customer id.' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    const password = String(body?.password || '')
    const forcePasswordChange = body?.force_password_change ? 1 : 0

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!customer) {
      return c.json({ error: 'Customer not found.' }, 404)
    }

    const passwordHash = await hashPassword(password)
    const columns = await c.env.DB.prepare(`PRAGMA table_info(Customers)`).all<any>()
    const columnNames = new Set((columns.results || []).map((column: any) => String(column.name)))

    if (columnNames.has('password_updated_at') && columnNames.has('force_password_change')) {
      await c.env.DB
        .prepare(`
          UPDATE Customers
          SET password_hash = ?,
              password_updated_at = datetime('now'),
              force_password_change = ?
          WHERE id = ?
        `)
        .bind(passwordHash, forcePasswordChange, id)
        .run()
    } else {
      await c.env.DB
        .prepare(`
          UPDATE Customers
          SET password_hash = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(passwordHash, id)
        .run()
    }

    return c.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer password update failed.'
    return c.json({ error: message }, 400)
  }
})

adminRoutes.patch('/api/admin/customers/:id/status', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid customer id' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const is_active = body.is_active

    if (is_active !== 0 && is_active !== 1) {
      return c.json({ error: 'is_active must be 0 or 1' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, is_active
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>()

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    if (Number(customer.is_active) === is_active) {
      return c.json({
        success: true,
        unchanged: true,
        message: 'Customer status is already set to requested value',
        customer,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Customers
        SET is_active = ?,
            updated_at = datetime('now'),
            activated_at = CASE
              WHEN ? = 1 AND activated_at IS NULL THEN datetime('now')
              WHEN ? = 0 THEN NULL
              ELSE activated_at
            END
        WHERE id = ?
      `)
      .bind(is_active, is_active, is_active, id)
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (NULL, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        'admin_customer_status_changed',
        JSON.stringify({
          old_is_active: Number(customer.is_active),
          new_is_active: is_active,
          source: 'admin-api',
        }),
      )
      .run()

    const updatedCustomer = await c.env.DB
      .prepare(`
        SELECT id, email, name, surname, company_name, is_active, activated_at, updated_at
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>()

    return c.json({
      success: true,
      customer: updatedCustomer,
    })
  } catch (error) {
    console.error('PATCH /api/admin/customers/:id/status error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.patch('/api/admin/customers/:id', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid customer id' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    // Get current customer data
    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, name, surname, job, phone, company_name, max_licenses, is_active
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>()

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    // Validate input data
    const name = String(body.name ?? '').trim()
    const surname = String(body.surname ?? '').trim()
    const job = String(body.job ?? '').trim()
    const companyName = String(body.companyName ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = String(body.phone ?? '').trim()
    const maxLicenses = Number(body.maxLicenses)

    if (!name) {
      return c.json({ error: 'Name is required' }, 400)
    }

    if (!surname) {
      return c.json({ error: 'Surname is required' }, 400)
    }

    if (!email || !email.includes('@')) {
      return c.json({ error: 'Valid email is required' }, 400)
    }

    if (!phone) {
      return c.json({ error: 'Phone is required' }, 400)
    }

    if (!Number.isInteger(maxLicenses) || maxLicenses < 1) {
      return c.json({ error: 'Max licenses must be a positive integer' }, 400)
    }

    // Check if email is already taken by another customer
    const existingEmail = await c.env.DB
      .prepare(`
        SELECT id
        FROM Customers
        WHERE lower(email) = lower(?) AND id != ?
        LIMIT 1
      `)
      .bind(email, id)
      .first<any>()

    if (existingEmail) {
      return c.json({ error: 'Email address is already in use by another customer' }, 409)
    }

    // Update customer
    await c.env.DB
      .prepare(`
        UPDATE Customers
        SET name = ?,
            surname = ?,
            job = ?,
            company_name = ?,
            email = ?,
            phone = ?,
            max_licenses = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(name, surname, job, companyName, email, phone, maxLicenses, id)
      .run()

    // Log the update event
    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (NULL, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        'admin_customer_updated',
        JSON.stringify({
          old_data: {
            name: customer.name,
            surname: customer.surname,
            job: customer.job,
            company_name: customer.company_name,
            email: customer.email,
            phone: customer.phone,
            max_licenses: customer.max_licenses,
          },
          new_data: {
            name,
            surname,
            job,
            companyName,
            email,
            phone,
            max_licenses: maxLicenses,
          },
          source: 'admin-api',
        }),
      )
      .run()

    // Get updated customer data with full details
    const updatedCustomer = await c.env.DB
      .prepare(`
        SELECT
          c.*,
          COUNT(l.id) as license_total
        FROM Customers c
        LEFT JOIN Licenses l ON l.customer_id = c.id
        WHERE c.id = ?
        GROUP BY c.id
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>()

    // Get customer licenses
    const licenses = await c.env.DB
      .prepare(`
        SELECT
          l.*,
          COUNT(d.id) as device_count
        FROM Licenses l
        LEFT JOIN LicenseDevices d ON d.license_id = l.id
        WHERE l.customer_id = ?
        GROUP BY l.id
        ORDER BY l.created_at DESC
      `)
      .bind(id)
      .all()

    // Get activation codes
    const activationCodes = await c.env.DB
      .prepare(`
        SELECT ac.*, l.license_name, l.public_id as license_public_id
        FROM ActivationCodes ac
        JOIN Licenses l ON l.id = ac.license_id
        WHERE l.customer_id = ?
        ORDER BY ac.created_at DESC
        LIMIT 50
      `)
      .bind(id)
      .all()

    // Get recent events
    const events = await c.env.DB
      .prepare(`
        SELECT e.*, l.license_name, l.public_id as license_public_id
        FROM LicenseEvents e
        LEFT JOIN Licenses l ON l.id = e.license_id
        WHERE e.customer_id = ?
        ORDER BY e.created_at DESC
        LIMIT 20
      `)
      .bind(id)
      .all()

    return c.json({
      success: true,
      message: 'Customer updated successfully',
      detail: {
        customer: updatedCustomer,
        licenses: licenses.results || [],
        activationCodes: activationCodes.results || [],
        events: events.results || [],
      },
    })
  } catch (error) {
    console.error('PATCH /api/admin/customers/:id error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.post('/api/admin/customers', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const body = await c.req.json().catch(() => null)

    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const email = String(body.email ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim()
    const surname = String(body.surname ?? '').trim()
    const job = String(body.job ?? 'Customer').trim()
    const phone = String(body.phone ?? '').trim() || '+10000000000'
    const company_name = body.company_name
      ? String(body.company_name).trim()
      : '-'

    if (!email || !email.includes('@')) {
      return c.json({ error: 'Valid email is required' }, 400)
    }

    if (!name) {
      return c.json({ error: 'name is required' }, 400)
    }

    if (!surname) {
      return c.json({ error: 'surname is required' }, 400)
    }

    const existing = await c.env.DB
      .prepare(`
        SELECT id, email
        FROM Customers
        WHERE lower(email) = lower(?)
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (existing) {
      return c.json({ error: 'Customer already exists', customer: existing }, 409)
    }

    const password_hash = await sha256Hex(randomHex(32))

    const result = await c.env.DB
      .prepare(`
        INSERT INTO Customers (
          email,
          name,
          surname,
          job,
          phone,
          company_name,
          password_hash,
          is_active,
          verification_code,
          verification_expires_at,
          created_at,
          updated_at,
          activated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, datetime('now'), datetime('now'), NULL)
      `)
      .bind(email, name, surname, job, phone, company_name, password_hash)
      .run()

    const customerId = result.meta?.last_row_id
    if (!customerId) {
      throw new Error('Customer creation failed.')
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT *
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(customerId)
      .first<any>()

    return c.json(
      {
        success: true,
        customer,
      },
      201,
    )
  } catch (error) {
    console.error('POST /api/admin/customers error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.get('/api/admin/licenses', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const { page, pageSize, offset } = parsePagination(c)
    const search = String(c.req.query('search') || '').trim()
    const status = String(c.req.query('status') || '').trim().toLowerCase()
    const customerIdRaw = String(c.req.query('customerId') || '').trim()
    const { sortBy: sortKey, sortDir } = parseSort(
      c,
      [
        'id',
        'license_key',
        'license_name',
        'status',
        'created_at',
        'updated_at',
        'expires_at',
      ],
      'created_at',
      'desc',
    )

    const sortColumns: Record<string, string> = {
      id: 'l.id',
      license_key: 'l.activation_code',
      license_name: 'l.license_name',
      status: 'l.status',
      created_at: 'l.created_at',
      updated_at: 'l.updated_at',
      expires_at: 'l.expires_at',
    }

    const sortBy = sortColumns[sortKey] || sortColumns.created_at

    const whereClauses: string[] = []
    const params: unknown[] = []

    addLikeSearch(whereClauses, params, search.toLowerCase(), [
      'lower(l.activation_code)',
      'lower(l.license_name)',
      'lower(c.email)',
      'lower(c.name)',
      'lower(c.surname)',
    ])

    addStatusFilter(whereClauses, params, status, 'lower(l.status)')

    const customerId = Number.parseInt(customerIdRaw, 10)
    if (customerIdRaw && Number.isInteger(customerId) && customerId > 0) {
      whereClauses.push('l.customer_id = ?')
      params.push(customerId)
    }

    const whereSql = buildWhereSql(whereClauses)

    const totalRow = await c.env.DB
      .prepare(`
        SELECT COUNT(*) AS total
        FROM Licenses l
        LEFT JOIN Customers c ON c.id = l.customer_id
        ${whereSql}
      `)
      .bind(...params)
      .first<any>()

    const total = Number(totalRow?.total || 0)
    const result = await c.env.DB
      .prepare(`
        SELECT
          l.id,
          l.customer_id,
          l.activation_code AS license_key,
          l.license_name,
          l.status,
          l.allowed_devices AS max_devices,
          l.expires_at,
          l.created_at,
          l.updated_at,
          c.email AS customer_email,
          c.name AS customer_name,
          c.surname AS customer_surname,
          c.company_name AS customer_company,
          c.company_name,
          l.license_type,
          l.allowed_devices,
          l.starts_at,
          l.last_validated_at,
          l.license_count,
          l.activation_code,
          l.installed_license,
          l.device_id
        FROM Licenses l
        LEFT JOIN Customers c ON c.id = l.customer_id
        ${whereSql}
        ORDER BY ${sortBy} ${sortDir}
        LIMIT ?
        OFFSET ?
      `)
      .bind(...params, pageSize, offset)
      .all()

    const items = result.results ?? []

    const response = pagedResponse(items, page, pageSize, total)
    return c.json({
      ...response,
      licenses: response.items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/licenses/:id', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT
          l.*,
          c.id AS customer_id_ref,
          c.email AS customer_email,
          c.name AS customer_name,
          c.surname AS customer_surname,
          c.company_name,
          c.is_active AS customer_is_active
        FROM Licenses l
        LEFT JOIN Customers c ON c.id = l.customer_id
        WHERE l.id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
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

    const events = await c.env.DB
      .prepare(`
        SELECT *
        FROM LicenseEvents
        WHERE license_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .bind(id)
      .all()

    const parsedFeatures = JSON.parse(license.features_json || '[]')
    const customer =
      license.customer_id_ref == null
        ? null
        : {
            id: license.customer_id_ref,
            name: license.customer_name,
            surname: license.customer_surname,
            email: license.customer_email,
            company_name: license.company_name,
            status: Number(license.customer_is_active) === 1 ? 'active' : 'inactive',
          }

    return c.json({
      license: {
        ...license,
        name: license.license_name,
        device_limit: license.allowed_devices,
        current_activations: Number(currentActivations?.total || 0),
        features: parsedFeatures,
      },
      customer,
      events: events.results ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/tickets', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const result = await c.env.DB
      .prepare(`
        SELECT
          t.id,
          t.customer_id,
          c.email AS customer_email,
          c.name AS customer_name,
          c.surname AS customer_surname,
          c.company_name,
          t.subject,
          t.status,
          t.priority,
          t.created_at,
          t.updated_at
        FROM support_tickets t
        LEFT JOIN customers c ON c.id = t.customer_id
        ORDER BY t.updated_at DESC, t.created_at DESC
      `)
      .all()

    return c.json({
      tickets: result.results ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.get('/api/admin/tickets/:id', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ message: 'Invalid ticket id.' }, 400)
    }

    const ticket = await c.env.DB
      .prepare(`
        SELECT
          t.*,
          c.email AS customer_email,
          c.name AS customer_name,
          c.surname AS customer_surname,
          c.company_name
        FROM support_tickets t
        LEFT JOIN customers c ON c.id = t.customer_id
        WHERE t.id = ?
      `)
      .bind(id)
      .first()

    if (!ticket) {
      return c.json({ message: 'Ticket not found.' }, 404)
    }

    const replies = await c.env.DB
      .prepare(`
        SELECT
          id,
          ticket_id,
          customer_id,
          admin_id,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.post('/api/admin/tickets/:id/replies', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

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
      `)
      .bind(id)
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
          admin_id,
          sender_type,
          message,
          created_at
        )
        VALUES (?, ?, 'admin', ?, datetime('now'))
      `)
      .bind(id, adminToken.sub ?? null, message)
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
        SELECT id, ticket_id, admin_id, sender_type, message, created_at
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.post('/api/admin/tickets/:id/reply', async (c) => {
  const url = new URL(c.req.raw.url)
  url.pathname = url.pathname.replace(/\/reply$/, '/replies')

  const request = new Request(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    duplex: 'half' as any,
  })

  return adminRoutes.fetch(request, c.env, c.executionCtx)
})

adminRoutes.patch('/api/admin/tickets/:id/status', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ message: 'Invalid ticket id.' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    const status = String(body?.status ?? '').trim()
    const allowedStatuses = ['open', 'pending', 'closed']

    if (!allowedStatuses.includes(status)) {
      return c.json(
        {
          message: 'Invalid status.',
          allowed: allowedStatuses,
        },
        400,
      )
    }

    const ticket = await c.env.DB
      .prepare(`
        SELECT id, status
        FROM support_tickets
        WHERE id = ?
      `)
      .bind(id)
      .first<any>()

    if (!ticket) {
      return c.json({ message: 'Ticket not found.' }, 404)
    }

    if (ticket.status === status) {
      return c.json({
        success: true,
        unchanged: true,
        message: 'Ticket status is already set to requested value.',
        ticket,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE support_tickets
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(status, id)
      .run()

    const updatedTicket = await c.env.DB
      .prepare(`
        SELECT *
        FROM support_tickets
        WHERE id = ?
      `)
      .bind(id)
      .first()

    return c.json({
      success: true,
      ticket: updatedTicket,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.post('/api/admin/tickets/:id/status', async (c) => {
  const request = new Request(c.req.raw.url, {
    method: 'PATCH',
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    duplex: 'half' as any,
  })

  return adminRoutes.fetch(request, c.env, c.executionCtx)
})

adminRoutes.get('/api/admin/events', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const result = await c.env.DB
      .prepare(`
        SELECT
          e.id,
          e.license_id,
          e.customer_id,
          c.email AS customer_email,
          c.name AS customer_name,
          c.surname AS customer_surname,
          l.license_name,
          e.event_type,
          e.device_id,
          e.payload_json,
          e.created_at
        FROM LicenseEvents e
        LEFT JOIN Customers c ON c.id = e.customer_id
        LEFT JOIN Licenses l ON l.id = e.license_id
        ORDER BY e.created_at DESC
        LIMIT 200
      `)
      .all()

    return c.json({
      events: result.results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized.'
    return c.json({ message }, 401)
  }
})

adminRoutes.patch('/api/admin/licenses/:id/status', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))
    const status = body?.status

    if (!VALID_LICENSE_STATUSES.includes(status)) {
      return c.json(
        {
          error: 'Invalid license status',
          allowed: VALID_LICENSE_STATUSES,
        },
        400,
      )
    }

    const license = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    if (license.status === status) {
      return c.json({
        success: true,
        unchanged: true,
        message: 'License status is already set to requested value',
        license,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET status = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(status, id)
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        license.customer_id,
        'admin_license_status_changed',
        JSON.stringify({
          old_status: license.status,
          new_status: status,
          source: 'admin-api',
        }),
      )
      .run()

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT *
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    return c.json({
      success: true,
      license: updatedLicense,
    })
  } catch (error) {
    console.error('PATCH /api/admin/licenses/:id/status error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.patch('/api/admin/licenses/:id/notes', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    const notes = body?.notes ?? null

    if (notes !== null && typeof notes !== 'string') {
      return c.json({ error: 'notes must be a string or null' }, 400)
    }

    if (typeof notes === 'string' && notes.length > 2000) {
      return c.json({ error: 'notes is too long. Max 2000 characters.' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT id, customer_id, notes
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    if ((license.notes ?? null) === notes) {
      return c.json({
        success: true,
        unchanged: true,
        message: 'License notes are already set to requested value',
        license,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET notes = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(notes, id)
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        license.customer_id,
        'admin_license_notes_changed',
        JSON.stringify({
          old_notes: license.notes,
          new_notes: notes,
          source: 'admin-api',
        }),
      )
      .run()

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status, notes, updated_at
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    return c.json({
      success: true,
      license: updatedLicense,
    })
  } catch (error) {
    console.error('PATCH /api/admin/licenses/:id/notes error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.patch('/api/admin/licenses/:id/limits', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const license_count = body.license_count
    const allowed_devices = body.allowed_devices
    const expires_at = body.expires_at ?? null
    const refresh_after = body.refresh_after ?? null
    const offline_grace_until = body.offline_grace_until ?? null

    if (!Number.isInteger(license_count) || license_count < 1) {
      return c.json({ error: 'license_count must be an integer >= 1' }, 400)
    }

    if (!Number.isInteger(allowed_devices) || allowed_devices < 1) {
      return c.json({ error: 'allowed_devices must be an integer >= 1' }, 400)
    }

    for (const [field, value] of Object.entries({
      expires_at,
      refresh_after,
      offline_grace_until,
    })) {
      if (value !== null && typeof value !== 'string') {
        return c.json(
          { error: `${field} must be an ISO date string or null` },
          400,
        )
      }
    }

    const license = await c.env.DB
      .prepare(`
        SELECT
          id,
          customer_id,
          license_count,
          allowed_devices,
          expires_at,
          refresh_after,
          offline_grace_until
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    const unchanged =
      license.license_count === license_count &&
      license.allowed_devices === allowed_devices &&
      (license.expires_at ?? null) === expires_at &&
      (license.refresh_after ?? null) === refresh_after &&
      (license.offline_grace_until ?? null) === offline_grace_until

    if (unchanged) {
      return c.json({
        success: true,
        unchanged: true,
        message: 'License limits are already set to requested values',
        license,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET
          license_count = ?,
          allowed_devices = ?,
          expires_at = ?,
          refresh_after = ?,
          offline_grace_until = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(
        license_count,
        allowed_devices,
        expires_at,
        refresh_after,
        offline_grace_until,
        id,
      )
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        license.customer_id,
        'admin_license_limits_changed',
        JSON.stringify({
          old_values: {
            license_count: license.license_count,
            allowed_devices: license.allowed_devices,
            expires_at: license.expires_at,
            refresh_after: license.refresh_after,
            offline_grace_until: license.offline_grace_until,
          },
          new_values: {
            license_count,
            allowed_devices,
            expires_at,
            refresh_after,
            offline_grace_until,
          },
          source: 'admin-api',
        }),
      )
      .run()

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT
          id,
          customer_id,
          status,
          license_count,
          allowed_devices,
          expires_at,
          refresh_after,
          offline_grace_until,
          updated_at
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    return c.json({
      success: true,
      license: updatedLicense,
    })
  } catch (error) {
    console.error('PATCH /api/admin/licenses/:id/limits error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.patch('/api/admin/licenses/:id/features', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const body = await c.req.json().catch(() => null)
    const features = body?.features

    if (!Array.isArray(features)) {
      return c.json({ error: 'features must be an array' }, 400)
    }

    if (features.length === 0) {
      return c.json({ error: 'features cannot be empty' }, 400)
    }

    if (!features.every((x) => typeof x === 'string' && x.trim().length > 0)) {
      return c.json(
        { error: 'features must contain only non-empty strings' },
        400,
      )
    }

    const normalizedFeatures = [...new Set(features.map((x) => x.trim()))]

    const license = await c.env.DB
      .prepare(`
        SELECT id, customer_id, features_json
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    const oldFeaturesJson = license.features_json ?? '[]'
    const newFeaturesJson = JSON.stringify(normalizedFeatures)

    if (oldFeaturesJson === newFeaturesJson) {
      return c.json({
        success: true,
        unchanged: true,
        message: 'License features are already set to requested values',
        license: {
          id: license.id,
          customer_id: license.customer_id,
          features: normalizedFeatures,
        },
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET features_json = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(newFeaturesJson, id)
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        license.customer_id,
        'admin_license_features_changed',
        JSON.stringify({
          old_features: JSON.parse(oldFeaturesJson),
          new_features: normalizedFeatures,
          source: 'admin-api',
        }),
      )
      .run()

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status, features_json, updated_at
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    return c.json({
      success: true,
      license: {
        ...updatedLicense,
        features: normalizedFeatures,
      },
    })
  } catch (error) {
    console.error('PATCH /api/admin/licenses/:id/features error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.post('/api/admin/licenses', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const body = await c.req.json().catch(() => null)
    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    const customer_id = Number(body.customer_id)
    const license_name = body.license_name ?? 'SQL Performance License'
    const license_type = body.license_type ?? 'subscription'
    const status = body.status ?? 'active'
    const license_count = body.license_count ?? 1
    const allowed_devices = body.allowed_devices ?? 1
    const features = body.features ?? ['all_modules']
    const notes = body.notes ?? null

    const starts_at = body.starts_at ?? new Date().toISOString()
    const expires_at = body.expires_at
    const refresh_after = body.refresh_after ?? starts_at
    const offline_grace_until = body.offline_grace_until ?? expires_at

    if (!Number.isInteger(customer_id) || customer_id <= 0) {
      return c.json({ error: 'customer_id is required' }, 400)
    }

    if (!VALID_LICENSE_STATUSES.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    if (!Number.isInteger(license_count) || license_count < 1) {
      return c.json({ error: 'license_count must be >= 1' }, 400)
    }

    if (!Number.isInteger(allowed_devices) || allowed_devices < 1) {
      return c.json({ error: 'allowed_devices must be >= 1' }, 400)
    }

    if (!expires_at || typeof expires_at !== 'string') {
      return c.json({ error: 'expires_at is required' }, 400)
    }

    if (!Array.isArray(features) || features.length === 0) {
      return c.json({ error: 'features must be a non-empty array' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email
        FROM Customers
        WHERE id = ?
        LIMIT 1
      `)
      .bind(customer_id)
      .first<any>()

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    const activation_code = `act_${randomHex(16)}`
    const features_json = JSON.stringify([...new Set(features)])

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
          license_count,
          allowed_devices,
          features_json,
          notes,
          license_email,
          activation_code,
          created_at,
          updated_at,
          created_via
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `)
      .bind(
        customer_id,
        license_name,
        license_type,
        status,
        starts_at,
        expires_at,
        refresh_after,
        offline_grace_until,
        license_count,
        allowed_devices,
        features_json,
        notes,
        customer.email,
        activation_code,
        'admin-api',
      )
      .run()

    const licenseId = result.meta?.last_row_id
    if (!licenseId) {
      throw new Error('License creation failed.')
    }

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        licenseId,
        customer_id,
        'admin_license_created',
        JSON.stringify({
          source: 'admin-api',
          activation_code,
          status,
          license_type,
        }),
      )
      .run()

    const license = await c.env.DB
      .prepare(`
        SELECT *
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(licenseId)
      .first<any>()

    return c.json(
      {
        success: true,
        license,
      },
      201,
    )
  } catch (error) {
    console.error('POST /api/admin/licenses error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.post('/api/admin/licenses/:id/revoke', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))
    const reason = body?.reason ?? null

    if (reason !== null && typeof reason !== 'string') {
      return c.json({ error: 'reason must be a string or null' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    if (license.status === 'revoked') {
      return c.json({
        success: true,
        unchanged: true,
        message: 'License is already revoked',
        license,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET status = 'revoked',
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        license.customer_id,
        'admin_license_revoked',
        JSON.stringify({
          old_status: license.status,
          new_status: 'revoked',
          reason,
          source: 'admin-api',
        }),
      )
      .run()

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status, updated_at
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    return c.json({
      success: true,
      license: updatedLicense,
    })
  } catch (error) {
    console.error('POST /api/admin/licenses/:id/revoke error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

adminRoutes.post('/api/admin/licenses/:id/reactivate', async (c) => {
  try {
    const adminToken = await requireAdmin(c)

    if (!adminToken) {
      return c.json(
        { message: 'Authorization header with Bearer token is required.' },
        401,
      )
    }

    const id = Number(c.req.param('id'))

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'Invalid license id' }, 400)
    }

    const body = await c.req.json().catch(() => ({}))
    const reason = body?.reason ?? null

    if (reason !== null && typeof reason !== 'string') {
      return c.json({ error: 'reason must be a string or null' }, 400)
    }

    const license = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    if (!license) {
      return c.json({ error: 'License not found' }, 404)
    }

    if (license.status === 'active') {
      return c.json({
        success: true,
        unchanged: true,
        message: 'License is already active',
        license,
      })
    }

    await c.env.DB
      .prepare(`
        UPDATE Licenses
        SET status = 'active',
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(id)
      .run()

    await c.env.DB
      .prepare(`
        INSERT INTO LicenseEvents (
          license_id,
          customer_id,
          event_type,
          payload_json,
          created_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        id,
        license.customer_id,
        'admin_license_reactivated',
        JSON.stringify({
          old_status: license.status,
          new_status: 'active',
          reason,
          source: 'admin-api',
        }),
      )
      .run()

    const updatedLicense = await c.env.DB
      .prepare(`
        SELECT id, customer_id, status, updated_at
        FROM Licenses
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<any>()

    return c.json({
      success: true,
      license: updatedLicense,
    })
  } catch (error) {
    console.error('POST /api/admin/licenses/:id/reactivate error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
