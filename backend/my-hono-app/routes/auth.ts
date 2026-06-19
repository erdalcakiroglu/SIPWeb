import { Hono } from 'hono'
import type { Bindings } from '../types'
import { hashPassword, verifyPassword } from '../utils/password'
import { rateLimit } from '../lib/rateLimit'
import { getClientIp } from '../lib/http'
import { generateRefreshToken } from '../lib/ids'
import { sha256Hex, signJwt } from '../lib/crypto'
import { sendPasswordResetEmail } from '../lib/email'
import { writeAuditLog } from '../lib/audit'

export const authRoutes = new Hono<{ Bindings: Bindings }>()

authRoutes.post('/api/admin/login', async (c) => {
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

authRoutes.post('/api/admin/auth/login', async (c) => {
  return authRoutes.fetch(
    new Request(new URL(c.req.url).toString().replace('/api/admin/auth/login', '/api/admin/login'), c.req.raw),
    c.env,
  )
})

authRoutes.post('/api/auth/register', async (c) => {
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

authRoutes.post('/api/auth/activate', async (c) => {
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

authRoutes.post('/api/portal/login', async (c) => {
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

authRoutes.post('/api/portal/auth/login', async (c) => {
  return authRoutes.fetch(
    new Request(new URL(c.req.url).toString().replace('/api/portal/auth/login', '/api/portal/login'), c.req.raw),
    c.env,
  )
})

authRoutes.post('/api/admin/auth/logout', async (c) => {
  return c.json({ success: true })
})

authRoutes.post('/api/portal/auth/logout', async (c) => {
  return c.json({ success: true })
})

authRoutes.post('/api/admin/auth/forgot-password', async (c) => {
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

authRoutes.post('/api/admin/auth/reset-password', async (c) => {
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

authRoutes.post('/api/portal/auth/forgot-password', async (c) => {
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

authRoutes.post('/api/portal/auth/reset-password', async (c) => {
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

