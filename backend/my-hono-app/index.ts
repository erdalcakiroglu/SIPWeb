import { Hono } from 'hono'
import {
  addLikeSearch,
  addStatusFilter,
  buildWhereSql,
} from './utils/filters'
import { hashPassword, verifyPassword } from './utils/password'
import { pagedResponse, parsePagination } from './utils/pagination'
import { parseSort } from './utils/sort'
import { z } from 'zod'
import type { Bindings } from './types'
import { sha256Hex, signJwt, verifyJwt, signPayload } from './lib/crypto'
import { randomCode, randomToken, randomHex, generateRefreshToken } from './lib/ids'
import { trimOptional, normalizeEmail, getClientIp, getCookie, addExactFilter } from './lib/http'
import { writeAuditLog } from './lib/audit'
import { sendPasswordResetEmail } from './lib/email'
import { stripeFormRequest, verifyStripeSignature, handleStripeEvent } from './lib/stripe'
import { generateOfflineLicenseFile } from './lib/license'
import {
  DEFAULT_DOWNLOAD_RELEASE,
  getDownloadReleaseInfo,
  updateDownloadReleaseInfo,
} from './lib/downloadRelease'
import { requireAdmin, portalAuth } from './lib/authGuards'
import { getCustomerPlan, getCustomerUsage } from './lib/billing'
import {
  fetchAdminAsset,
  fetchPortalAsset,
  isAdminHost,
  isPortalHost,
  resolveHostService,
} from './lib/assets'
import { rateLimit } from './lib/rateLimit'
import { licenseRoutes } from './routes/license'

const app = new Hono<{ Bindings: Bindings }>()
const VALID_LICENSE_STATUSES = ['active', 'suspended', 'expired', 'revoked']
const ALLOWED_ORIGINS = [
  'https://sqlperformance.ai',
  'https://www.sqlperformance.ai',
  'https://admin.sqlperformance.ai',
  'https://portal.sqlperformance.ai',
]
const CONTACT_SUCCESS_MESSAGE = 'Your message has been received. We will reply within 1-2 business days.'

const contactFormSchema = z.object({
  reason: z.enum(['sales', 'technical']).default('sales'),
  full_name: z.string().optional(),
  fullName: z.string().optional(),
  work_email: z.string().optional(),
  workEmail: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  environment: z.string().optional(),
  website: z.string().optional(),
  source_page: z.string().optional(),
  sourcePage: z.string().optional(),
})

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

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || ''
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin)

  if (c.req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin) {
      return c.json({ error: 'Origin is not allowed' }, 403)
    }

    if (origin) {
      c.header('Access-Control-Allow-Origin', origin)
      c.header('Vary', 'Origin')
      c.header('Access-Control-Allow-Credentials', 'true')
    }

    c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    return new Response(null, { status: 204 })
  }

  if (origin && !isAllowedOrigin) {
    return c.json({ error: 'Origin is not allowed' }, 403)
  }

  await next()

  if (origin && isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
    c.header('Access-Control-Allow-Credentials', 'true')
  }
})

async function createContactMessage(c: any, input: z.infer<typeof contactFormSchema>) {
  const fullName = (input.full_name ?? input.fullName ?? '').trim()
  const workEmail = normalizeEmail(input.work_email ?? input.workEmail ?? '')
  const subject = (input.subject ?? '').trim()
  const message = (input.message ?? '').trim()
  const company = trimOptional(input.company)
  const environment = trimOptional(input.environment)
  const website = trimOptional(input.website)
  const sourcePage = trimOptional(input.source_page ?? input.sourcePage)

  if (website) {
    return { stored: false, message: CONTACT_SUCCESS_MESSAGE }
  }

  if (!fullName || !workEmail || !subject || !message) {
    return { error: c.json({ message: 'Full name, work email, subject, and message are required.' }, 400) }
  }

  if (!z.string().email().safeParse(workEmail).success) {
    return { error: c.json({ message: 'Please enter a valid work email address.' }, 400) }
  }

  const now = new Date().toISOString()
  const result = await c.env.DB
    .prepare(`
      INSERT INTO ContactMessages (
        reason,
        full_name,
        work_email,
        company,
        subject,
        message,
        environment,
        source_page,
        origin,
        referer,
        user_agent,
        ip_address,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
    `)
    .bind(
      input.reason,
      fullName,
      workEmail,
      company ?? null,
      subject,
      message,
      environment ?? null,
      sourcePage ?? null,
      trimOptional(c.req.header('x-contact-origin') ?? c.req.header('Origin') ?? undefined) ?? null,
      trimOptional(c.req.header('x-contact-referer') ?? c.req.header('Referer') ?? undefined) ?? null,
      trimOptional(c.req.header('x-contact-user-agent') ?? c.req.header('User-Agent') ?? undefined) ?? null,
      trimOptional(c.req.header('x-contact-forwarded-for') ?? getClientIp(c)) ?? null,
      now,
      now,
    )
    .run()

  return {
    stored: true,
    id: Number(result.meta?.last_row_id || 0),
    message: CONTACT_SUCCESS_MESSAGE,
  }
}

// Rota modülleri (CORS middleware'inden sonra, catch-all'lardan önce mount edilir).
app.route('/', licenseRoutes)

app.get('/', (c) => {
  const host = new URL(c.req.url).hostname

  if (host === 'www.sqlperformance.ai') {
    return Response.redirect('https://sqlperformance.ai', 301)
  }

  if (host === 'admin.sqlperformance.ai') {
    return c.redirect('/admin/login', 302)
  }

  if (host === 'portal.sqlperformance.ai') {
    return c.redirect('/portal/login', 302)
  }

  return c.json({
    ok: true,
    service: resolveHostService(host),
    host,
  })
})

app.get('/health', (c) => {
  const host = new URL(c.req.url).hostname

  return c.json({
    ok: true,
    service: resolveHostService(host),
    host,
  })
})

app.get('/api/health', (c) => {
  const host = new URL(c.req.url).hostname

  return c.json({
    ok: true,
    service: resolveHostService(host),
    host,
    timestamp: new Date().toISOString(),
  })
})

app.post('/api/contact', async (c) => {
  const rate = await rateLimit(c, `contact:${getClientIp(c)}`, 10, 60)

  if (!rate.allowed) {
    return c.json({ message: 'Too many contact requests. Please try again shortly.' }, 429)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = contactFormSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ message: 'Invalid request.', details: parsed.error.flatten() }, 400)
  }

  const result = await createContactMessage(c, parsed.data)
  if ('error' in result) {
    return result.error
  }

  return c.json(
    {
      message: result.message,
      stored: result.stored,
      id: result.stored ? result.id : undefined,
    },
    result.stored ? 201 : 200,
  )
})

app.get('/db-test', async (c) => {
  const result = await c.env.DB
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type='table'
       ORDER BY name`,
    )
    .all()

  return c.json(result)
})

app.post('/api/admin/login', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `admin-login:${ip}`, 5, 60)

    if (!rl.allowed) {
      return c.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retry_after_seconds: Math.max(0, rl.reset - Math.floor(Date.now() / 1000)),
        },
        429,
      )
    }

    const body = await c.req.json().catch(() => ({}))
    const email = body.email
    const password = body.password

    if (!email) return c.json({ message: 'email is required.' }, 400)
    if (!password) return c.json({ message: 'password is required.' }, 400)

    const admin = await c.env.DB
      .prepare(`
        SELECT id, email, password_hash, name, role, is_active
        FROM Admins
        WHERE email = ?
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (!admin) return c.json({ message: 'Invalid email or password.' }, 401)
    if (admin.is_active !== 1) {
      return c.json({ message: 'Admin account is inactive.' }, 403)
    }

    const passwordOk = await verifyPassword(password, admin.password_hash)

    if (!passwordOk) {
      return c.json({ message: 'Invalid email or password.' }, 401)
    }

    const now = new Date().toISOString()

    // Şeffaf yükseltme: eski tuzsuz SHA-256 hash'leri başarılı login'de PBKDF2'ye taşı.
    const isLegacyHash = /^[a-f0-9]{64}$/i.test(String(admin.password_hash))
    const upgradedHash = isLegacyHash ? await hashPassword(password) : null

    await c.env.DB
      .prepare(`
        UPDATE Admins
        SET last_login_at = ?,
            updated_at = ?,
            password_hash = COALESCE(?, password_hash)
        WHERE id = ?
      `)
      .bind(now, now, upgradedHash, admin.id)
      .run()

    const token = await signJwt(
      {
        sub: String(admin.id),
        email: admin.email,
        role: admin.role,
        type: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
      c.env.ADMIN_JWT_SECRET,
    )

    return c.json({
      message: 'Admin login successful.',
      accessToken: token,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin login failed.'
    return c.json({ message }, 400)
  }
})

app.post('/api/admin/auth/login', async (c) => {
  return app.fetch(
    new Request(new URL(c.req.url).toString().replace('/api/admin/auth/login', '/api/admin/login'), c.req.raw),
    c.env,
  )
})

app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json().catch(() => null)

    if (!body) {
      return c.json({ message: 'Invalid JSON body.' }, 400)
    }

    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(body.password ?? '')
    const name = String(body.name ?? '').trim()
    const surname = String(body.surname ?? '').trim()
    const job = String(body.job ?? 'Customer').trim()
    const phone = String(body.phone ?? '').trim() || '+10000000000'
    const companyName = String(body.companyName ?? body.company_name ?? '').trim() || '-'

    if (!email || !email.includes('@')) {
      return c.json({ message: 'A valid email address is required.' }, 400)
    }

    if (password.length < 8) {
      return c.json({ message: 'Password must be at least 8 characters.' }, 400)
    }

    if (!name || !surname) {
      return c.json({ message: 'Name and surname are required.' }, 400)
    }

    const existing = await c.env.DB
      .prepare(`
        SELECT id
        FROM Customers
        WHERE lower(email) = lower(?)
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (existing) {
      return c.json({ message: 'An account with this email already exists.' }, 409)
    }

    const passwordHash = await hashPassword(password)

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
          activated_at,
          password_updated_at,
          force_password_change
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL, NULL, datetime('now'), datetime('now'), datetime('now'), datetime('now'), 0)
      `)
      .bind(email, name, surname, job, phone, companyName, passwordHash)
      .run()

    const customerId = result.meta?.last_row_id ?? null

    await writeAuditLog(c, {
      actorType: 'customer',
      actorId: customerId,
      actorEmail: email,
      action: 'customer_self_registered',
      entityType: 'customer',
      entityId: customerId,
      metadata: {
        source: 'public_create_account',
      },
    })

    return c.json({
      success: true,
      message: 'Account created successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('POST /api/auth/register error:', error)
    return c.json({ message: 'Account could not be created.' }, 500)
  }
})

app.post('/api/auth/activate', async (c) => {
  try {
    const body = await c.req.json().catch(() => null)
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()
    const code = String(body?.code ?? '').trim()

    if (!email) {
      return c.json({ message: 'Email is required.' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, is_active, verification_code, verification_expires_at
        FROM Customers
        WHERE lower(email) = lower(?)
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (!customer) {
      return c.json({ message: 'Invalid email or activation code.' }, 400)
    }

    if (Number(customer.is_active) === 1) {
      return c.json({
        success: true,
        message: 'Account is already active. You can sign in.',
      })
    }

    if (!code || code !== String(customer.verification_code ?? '')) {
      return c.json({ message: 'Invalid email or activation code.' }, 400)
    }

    if (customer.verification_expires_at) {
      const expiresAt = new Date(String(customer.verification_expires_at)).getTime()

      if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
        return c.json({ message: 'Activation code has expired.' }, 400)
      }
    }

    await c.env.DB
      .prepare(`
        UPDATE Customers
        SET is_active = 1,
            verification_code = NULL,
            verification_expires_at = NULL,
            activated_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(customer.id)
      .run()

    await writeAuditLog(c, {
      actorType: 'customer',
      actorId: customer.id,
      actorEmail: customer.email,
      action: 'customer_account_activated',
      entityType: 'customer',
      entityId: customer.id,
    })

    return c.json({
      success: true,
      message: 'Account activated successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('POST /api/auth/activate error:', error)
    return c.json({ message: 'Account could not be activated.' }, 500)
  }
})

app.post('/api/portal/login', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `portal-login:${ip}`, 5, 60)

    if (!rl.allowed) {
      return c.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retry_after_seconds: Math.max(0, rl.reset - Math.floor(Date.now() / 1000)),
        },
        429,
      )
    }

    const body = await c.req.json().catch(() => null)

    if (!body) {
      return c.json({ error: 'Invalid JSON body.' }, 400)
    }

    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT *
        FROM customers
        WHERE lower(email) = lower(?)
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (!customer) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const isActive =
      typeof customer.status === 'string'
        ? customer.status === 'active'
        : Number(customer.is_active) === 1

    if (!isActive) {
      return c.json({ error: 'Customer account is inactive' }, 403)
    }

    if (!customer.password_hash) {
      return c.json({ error: 'Password is not configured' }, 403)
    }

    const ok = await verifyPassword(password, customer.password_hash)

    if (!ok) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const { password_hash, ...publicCustomer } = customer

    const token = await signJwt(
      {
        sub: String(customer.id),
        type: 'portal',
        customer_id: customer.id,
        email: customer.email,
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
      },
      c.env.PORTAL_JWT_SECRET,
    )

    return c.json({
      success: true,
      accessToken: token,
      token,
      customer: publicCustomer,
    })
  } catch (err) {
    console.error('POST /api/portal/login error:', err)
    return c.json({ error: 'Internal server error.' }, 500)
  }
})

app.post('/api/portal/auth/login', async (c) => {
  return app.fetch(
    new Request(new URL(c.req.url).toString().replace('/api/portal/auth/login', '/api/portal/login'), c.req.raw),
    c.env,
  )
})

app.post('/api/admin/auth/logout', async (c) => {
  return c.json({ success: true })
})

app.post('/api/portal/auth/logout', async (c) => {
  return c.json({ success: true })
})

app.post('/api/admin/auth/forgot-password', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `admin-forgot-password:${ip}`, 5, 300)

    if (!rl.allowed) {
      return c.json({ error: 'Too many password reset attempts. Please try again later.' }, 429)
    }

    const body = await c.req.json().catch(() => null)
    const email = String(body?.email ?? '').trim().toLowerCase()

    if (!email) {
      return c.json({ error: 'Email is required.' }, 400)
    }

    const admin = await c.env.DB
      .prepare(`
        SELECT id, email, is_active
        FROM Admins
        WHERE lower(email) = lower(?)
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (admin && Number(admin.is_active) === 1) {
      const token = generateRefreshToken()
      const tokenHash = await sha256Hex(token)

      try {
        await c.env.DB
          .prepare(`
            INSERT INTO email_tokens (
              token_hash,
              token_type,
              user_type,
              user_id,
              expires_at
            ) VALUES (?, ?, ?, ?, datetime('now', '+1 hour'))
          `)
          .bind(tokenHash, 'admin_password_reset', 'admin', admin.id)
          .run()
      } catch (error) {
        console.warn('email_tokens insert skipped:', error)
      }

      const resetUrl = `https://admin.sqlperformance.ai/admin/reset-password?token=${encodeURIComponent(token)}`

      try {
        await sendPasswordResetEmail(c, {
          to: admin.email,
          subject: 'Reset your SQL Performance AI admin password',
          html: `<p>Hello,</p><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
          text: `Reset your password: ${resetUrl}`,
        })
      } catch (error) {
        console.warn('Admin reset email send failed:', error)
      }

      await writeAuditLog(c, {
        actorType: 'admin',
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'password_reset_requested',
        entityType: 'auth',
        entityId: admin.id,
        metadata: { user_type: 'admin' },
      })
    }

    return c.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forgot password failed.'
    return c.json({ error: message }, 400)
  }
})

app.post('/api/admin/auth/reset-password', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `admin-reset-password:${ip}`, 5, 300)

    if (!rl.allowed) {
      return c.json({ error: 'Too many password reset attempts. Please try again later.' }, 429)
    }

    const body = await c.req.json().catch(() => null)
    const token = String(body?.token ?? '')
    const newPassword = String(body?.newPassword ?? '')

    if (!token || newPassword.length < 8) {
      return c.json({ error: 'Invalid or expired reset link.' }, 400)
    }

    const tokenHash = await sha256Hex(token)
    const row = await c.env.DB
      .prepare(`
        SELECT *
        FROM email_tokens
        WHERE token_hash = ?
          AND token_type = ?
          AND user_type = ?
          AND used_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `)
      .bind(tokenHash, 'admin_password_reset', 'admin')
      .first<any>()

    if (!row) {
      return c.json({ error: 'Invalid or expired reset link.' }, 400)
    }

    const passwordHash = await hashPassword(newPassword)

    await c.env.DB
      .prepare(`
        UPDATE Admins
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(passwordHash, row.user_id)
      .run()

    await c.env.DB
      .prepare(`
        UPDATE email_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(row.id)
      .run()

    await writeAuditLog(c, {
      actorType: 'system',
      action: 'admin_password_reset_completed',
      entityType: 'auth',
      entityId: row.user_id,
    })

    return c.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset password failed.'
    return c.json({ error: message }, 400)
  }
})

app.post('/api/portal/auth/forgot-password', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `portal-forgot-password:${ip}`, 5, 300)

    if (!rl.allowed) {
      return c.json({ error: 'Too many password reset attempts. Please try again later.' }, 429)
    }

    const body = await c.req.json().catch(() => null)
    const email = String(body?.email ?? '').trim().toLowerCase()

    if (!email) {
      return c.json({ error: 'Email is required.' }, 400)
    }

    const customer = await c.env.DB
      .prepare(`
        SELECT id, email, is_active
        FROM customers
        WHERE lower(email) = lower(?)
        LIMIT 1
      `)
      .bind(email)
      .first<any>()

    if (customer && Number(customer.is_active) === 1) {
      const token = generateRefreshToken()
      const tokenHash = await sha256Hex(token)

      try {
        await c.env.DB
          .prepare(`
            INSERT INTO email_tokens (
              token_hash,
              token_type,
              user_type,
              user_id,
              expires_at
            ) VALUES (?, ?, ?, ?, datetime('now', '+1 hour'))
          `)
          .bind(tokenHash, 'portal_password_reset', 'portal', customer.id)
          .run()
      } catch (error) {
        console.warn('email_tokens insert skipped:', error)
      }

      const resetUrl = `https://portal.sqlperformance.ai/portal/reset-password?token=${encodeURIComponent(token)}`

      try {
        await sendPasswordResetEmail(c, {
          to: customer.email,
          subject: 'Reset your SQL Performance AI portal password',
          html: `<p>Hello,</p><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
          text: `Reset your password: ${resetUrl}`,
        })
      } catch (error) {
        console.warn('Portal reset email send failed:', error)
      }

      await writeAuditLog(c, {
        actorType: 'customer',
        actorId: customer.id,
        actorEmail: customer.email,
        action: 'password_reset_requested',
        entityType: 'auth',
        entityId: customer.id,
        metadata: { user_type: 'portal' },
      })
    }

    return c.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forgot password failed.'
    return c.json({ error: message }, 400)
  }
})

app.post('/api/portal/auth/reset-password', async (c) => {
  try {
    const ip = getClientIp(c)
    const rl = await rateLimit(c, `portal-reset-password:${ip}`, 5, 300)

    if (!rl.allowed) {
      return c.json({ error: 'Too many password reset attempts. Please try again later.' }, 429)
    }

    const body = await c.req.json().catch(() => null)
    const token = String(body?.token ?? '')
    const newPassword = String(body?.newPassword ?? '')

    if (!token || newPassword.length < 8) {
      return c.json({ error: 'Invalid or expired reset link.' }, 400)
    }

    const tokenHash = await sha256Hex(token)
    const row = await c.env.DB
      .prepare(`
        SELECT *
        FROM email_tokens
        WHERE token_hash = ?
          AND token_type = ?
          AND user_type = ?
          AND used_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `)
      .bind(tokenHash, 'portal_password_reset', 'portal')
      .first<any>()

    if (!row) {
      return c.json({ error: 'Invalid or expired reset link.' }, 400)
    }

    const passwordHash = await hashPassword(newPassword)

    await c.env.DB
      .prepare(`
        UPDATE customers
        SET password_hash = ?, password_updated_at = CURRENT_TIMESTAMP, force_password_change = 0
        WHERE id = ?
      `)
      .bind(passwordHash, row.user_id)
      .run()

    await c.env.DB
      .prepare(`
        UPDATE email_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(row.id)
      .run()

    await writeAuditLog(c, {
      actorType: 'system',
      action: 'portal_password_reset_completed',
      entityType: 'auth',
      entityId: row.user_id,
    })

    return c.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset password failed.'
    return c.json({ error: message }, 400)
  }
})

app.get('/api/portal/me', portalAuth, async (c) => {
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

app.post('/api/portal/change-password', portalAuth, async (c) => {
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

app.get('/api/portal/licenses', portalAuth, async (c) => {
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

app.get('/api/portal/licenses/:id', portalAuth, async (c) => {
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

app.get('/api/portal/licenses/:id/download-lic', portalAuth, async (c) => {
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

app.get('/api/portal/licenses/:id/download-license', portalAuth, async (c) => {
  return app.fetch(
    new Request(new URL(c.req.url).toString().replace('/download-license', '/download-lic'), c.req.raw),
    c.env,
  )
})

app.get('/api/portal/licenses/:id/download-pem', portalAuth, async (c) => {
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

app.get('/api/portal/licenses/:id/download-public-key', portalAuth, async (c) => {
  return app.fetch(
    new Request(new URL(c.req.url).toString().replace('/download-public-key', '/download-pem'), c.req.raw),
    c.env,
  )
})

app.get('/api/portal/downloads/msi', portalAuth, async (c) => {
  return c.json({
    success: true,
    download_url: 'https://downloads.sqlperformance.ai/SQL-Performance-Intelligence.msi',
    file_type: 'msi',
  })
})

app.get('/api/portal/billing/summary', portalAuth, async (c) => {
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

app.post('/api/portal/billing/create-checkout-session', portalAuth, async (c) => {
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

app.post('/api/portal/billing/create-portal-session', portalAuth, async (c) => {
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

app.post('/api/portal/tickets', portalAuth, async (c) => {
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

app.get('/api/portal/tickets', portalAuth, async (c) => {
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

app.get('/api/portal/tickets/:id', portalAuth, async (c) => {
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

app.post('/api/portal/tickets/:id/replies', portalAuth, async (c) => {
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

app.post('/api/portal/tickets/:id/reply', portalAuth, async (c) => {
  return app.fetch(
    new Request(new URL(c.req.url).toString().replace('/reply', '/replies'), c.req.raw),
    c.env,
  )
})

app.get('/api/admin/me', async (c) => {
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

app.get('/api/admin/download/release', async (c) => {
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

app.patch('/api/admin/download/release', async (c) => {
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

app.get('/api/admin/audit-logs', async (c) => {
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

app.get('/api/admin/monitoring/summary', async (c) => {
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

app.get('/api/admin/customers', async (c) => {
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

app.get('/api/admin/customers/:id', async (c) => {
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

app.delete('/api/admin/customers/:id', async (c) => {
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

app.post('/api/admin/customers/:id/password', async (c) => {
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

app.patch('/api/admin/customers/:id/status', async (c) => {
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

app.patch('/api/admin/customers/:id', async (c) => {
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

app.post('/api/admin/customers', async (c) => {
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

app.get('/api/admin/licenses', async (c) => {
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

app.get('/api/admin/licenses/:id', async (c) => {
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

app.get('/api/admin/tickets', async (c) => {
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

app.get('/api/admin/tickets/:id', async (c) => {
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

app.post('/api/admin/tickets/:id/replies', async (c) => {
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

app.post('/api/admin/tickets/:id/reply', async (c) => {
  const url = new URL(c.req.raw.url)
  url.pathname = url.pathname.replace(/\/reply$/, '/replies')

  const request = new Request(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    duplex: 'half' as any,
  })

  return app.fetch(request, c.env, c.executionCtx)
})

app.patch('/api/admin/tickets/:id/status', async (c) => {
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

app.post('/api/admin/tickets/:id/status', async (c) => {
  const request = new Request(c.req.raw.url, {
    method: 'PATCH',
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    duplex: 'half' as any,
  })

  return app.fetch(request, c.env, c.executionCtx)
})

app.get('/api/admin/events', async (c) => {
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

app.patch('/api/admin/licenses/:id/status', async (c) => {
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

app.patch('/api/admin/licenses/:id/notes', async (c) => {
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

app.patch('/api/admin/licenses/:id/limits', async (c) => {
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

app.patch('/api/admin/licenses/:id/features', async (c) => {
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

app.post('/api/admin/licenses', async (c) => {
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

app.post('/api/admin/licenses/:id/revoke', async (c) => {
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

app.post('/api/admin/licenses/:id/reactivate', async (c) => {
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

app.post('/api/stripe/webhook', async (c) => {
  const payload = await c.req.text()
  const signature = c.req.header('stripe-signature')

  if (!signature) {
    return c.json({ error: 'Missing Stripe signature' }, 400)
  }

  if (!c.env.STRIPE_WEBHOOK_SECRET || !c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: 'Stripe webhook is not configured' }, 503)
  }

  const valid = await verifyStripeSignature(payload, signature, c.env.STRIPE_WEBHOOK_SECRET)

  if (!valid) {
    await writeAuditLog(c, {
      actorType: 'system',
      action: 'stripe_webhook_signature_invalid',
      entityType: 'subscription',
      metadata: { payload_size: payload.length },
    })
    return c.json({ error: 'Invalid signature' }, 400)
  }

  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return c.json({ error: 'Invalid payload' }, 400)
  }

  try {
    await handleStripeEvent(c, event)
  } catch (error) {
    console.error('Stripe event handling failed:', error)
    // 500 döndür ki Stripe event'i yeniden denesin (idempotent handler güvenli).
    return c.json({ error: 'Event handling failed' }, 500)
  }

  await writeAuditLog(c, {
    actorType: 'system',
    action: 'stripe_webhook_received',
    entityType: 'subscription',
    entityId: event?.data?.object?.id ?? null,
    metadata: {
      event_type: event?.type ?? 'unknown',
      payload_size: payload.length,
    },
  })

  return c.json({ received: true })
})

app.get('/api/download/release', async (c) => {
  try {
    return c.json({
      downloadRelease: await getDownloadReleaseInfo(c),
    })
  } catch (error) {
    console.warn('Download release lookup failed. Falling back to defaults.', error)

    return c.json({
      downloadRelease: {
        ...DEFAULT_DOWNLOAD_RELEASE,
        updatedAt: null,
        updatedBy: null,
      },
    })
  }
})

app.get('/SQL-Performance-Intelligence.msi', async (c) => {
  const object = await c.env.DOWNLOADS_BUCKET?.get('SQL-Performance-Intelligence.msi')

  if (!object?.body) {
    return c.json({ error: 'Installer not found' }, 404)
  }

  const headers = new Headers()
  if (object.writeHttpMetadata) {
    object.writeHttpMetadata(headers)
  }
  headers.set('Content-Type', headers.get('Content-Type') || 'application/x-msi')
  headers.set('Content-Disposition', 'attachment; filename="SQL-Performance-Intelligence.msi"')
  if (object.httpEtag) {
    headers.set('ETag', object.httpEtag)
  }

  return new Response(object.body, { headers })
})

app.get('*', async (c, next) => {
  const url = new URL(c.req.url)

  if (!isAdminHost(url) || url.pathname.startsWith('/api/')) {
    await next()
    return
  }

  if (url.pathname === '/') {
    return c.redirect('/admin/login', 302)
  }

  if (url.pathname === '/admin') {
    return c.redirect('/admin/login', 302)
  }

  if (url.pathname === '/login') {
    return fetchAdminAsset(c, '/login')
  }

  return fetchAdminAsset(c)
})

app.get('*', async (c, next) => {
  const url = new URL(c.req.url)

  if (isAdminHost(url) && !url.pathname.startsWith('/api/')) {
    if (url.pathname === '/') {
      return c.redirect('/login', 302)
    }
    return fetchAdminAsset(c)
  }

  if (!isPortalHost(url) || url.pathname.startsWith('/api/')) {
    await next()
    return
  }

  if (url.pathname === '/') {
    return c.redirect('/portal/login', 302)
  }

  if (url.pathname === '/portal') {
    return fetchPortalAsset(c, '/portal')
  }

  if (url.pathname === '/login') {
    return fetchPortalAsset(c, '/login')
  }

  return fetchPortalAsset(c)
})

export default app
