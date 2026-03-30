import { env } from '../config/env'
import { db } from './db'
import { getPublicCustomerById, type PublicCustomer } from './customers'
import { listLicensesByCustomerId, type PublicLicense } from './licenses'
import { verifyPassword } from './password'
import { normalizeEmail, normalizePhone, requireText, validateEmail, validatePhone } from './validation'

type AdminDashboardSummaryRow = {
  total_customers: number
  active_customers: number
  total_licenses: number
  active_licenses: number
  active_activation_codes: number
  active_devices: number
}

type AdminCustomerRow = {
  id: number
  name: string
  surname: string
  job: string
  email: string
  phone: string
  company_name: string
  is_active: number
  created_at: string
  activated_at: string | null
  license_count: number
  active_license_count: number
  latest_license_activity: string | null
}

type AdminActivationCodeRow = {
  id: number
  code: string
  status: string
  device_id: string | null
  issued_at: string
  expires_at: string
  used_at: string | null
  used_by_device_id: string | null
  created_via: string
  license_name: string
  license_public_id: number
}

type AdminLicenseEventRow = {
  id: number
  event_type: string
  device_id: string | null
  payload_json: string | null
  created_at: string
  license_name: string | null
  license_public_id: number | null
}

export type AdminIdentity = {
  email: string
}

export type AdminDashboardSummary = {
  totalCustomers: number
  activeCustomers: number
  totalLicenses: number
  activeLicenses: number
  activeActivationCodes: number
  activeDevices: number
}

export type AdminCustomerSummary = {
  id: number
  name: string
  surname: string
  fullName: string
  job: string
  email: string
  phone: string
  companyName: string
  isActive: boolean
  createdAt: string
  activatedAt: string | null
  licenseCount: number
  activeLicenseCount: number
  latestLicenseActivity: string | null
}

export type AdminActivationCodeRecord = {
  id: number
  code: string
  status: string
  deviceId: string | null
  issuedAt: string
  expiresAt: string
  usedAt: string | null
  usedByDeviceId: string | null
  createdVia: string
  licenseName: string
  licensePublicId: string
}

export type AdminLicenseEventRecord = {
  id: number
  eventType: string
  deviceId: string | null
  payload: unknown
  createdAt: string
  licenseName: string | null
  licensePublicId: string | null
}

export type AdminCustomerDetail = {
  customer: PublicCustomer
  licenses: PublicLicense[]
  activationCodes: AdminActivationCodeRecord[]
  events: AdminLicenseEventRecord[]
}

export type AdminDashboardData = {
  summary: AdminDashboardSummary
  customers: AdminCustomerSummary[]
}

export type AdminCustomerUpdateInput = {
  name: unknown
  surname: unknown
  job: unknown
  email: unknown
  phone: unknown
  companyName: unknown
}

type CustomerExistsRow = {
  id: number
  email: string
}

function toPublicLicenseId(id: number) {
  return `lic_${String(id).padStart(6, '0')}`
}

function parseJson(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function toAdminCustomerSummary(row: AdminCustomerRow): AdminCustomerSummary {
  return {
    id: row.id,
    name: row.name,
    surname: row.surname,
    fullName: `${row.name} ${row.surname}`.trim(),
    job: row.job,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    activatedAt: row.activated_at,
    licenseCount: Number(row.license_count) || 0,
    activeLicenseCount: Number(row.active_license_count) || 0,
    latestLicenseActivity: row.latest_license_activity,
  }
}

function requireCustomerId(customerId: number) {
  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw new Error('Customer not found.')
  }

  return customerId
}

function requireCustomerRecord(customerId: number) {
  const safeCustomerId = requireCustomerId(customerId)
  const customer = db
    .prepare('SELECT id, email FROM Customers WHERE id = ?')
    .get(safeCustomerId) as CustomerExistsRow | undefined

  if (!customer) {
    throw new Error('Customer not found.')
  }

  return customer
}

export function authenticateAdmin(emailInput: unknown, passwordInput: unknown): AdminIdentity {
  const email = normalizeEmail(requireText(emailInput, 'Admin email'))
  const password = requireText(passwordInput, 'Admin password')
  const expectedEmail = normalizeEmail(env.adminEmail)

  if (!validateEmail(email)) {
    throw new Error('Please enter a valid admin email address.')
  }

  if (email !== expectedEmail) {
    throw new Error('Invalid admin credentials.')
  }

  if (env.adminPasswordHash) {
    if (!verifyPassword(password, env.adminPasswordHash)) {
      throw new Error('Invalid admin credentials.')
    }
  } else if (password !== env.adminPassword) {
    throw new Error('Invalid admin credentials.')
  }

  return { email: expectedEmail }
}

export function getAdminDashboardData(): AdminDashboardData {
  const summaryRow = db
    .prepare(`
      SELECT
        (SELECT COUNT(*) FROM Customers) AS total_customers,
        (SELECT COUNT(*) FROM Customers WHERE is_active = 1) AS active_customers,
        (SELECT COUNT(*) FROM Licenses) AS total_licenses,
        (SELECT COUNT(*) FROM Licenses WHERE status IN ('active', 'trial_active')) AS active_licenses,
        (SELECT COUNT(*) FROM ActivationCodes WHERE status = 'active') AS active_activation_codes,
        (SELECT COUNT(*) FROM LicenseDevices WHERE status = 'active') AS active_devices
    `)
    .get() as AdminDashboardSummaryRow

  const customerRows = db
    .prepare(`
      SELECT
        c.id,
        c.name,
        c.surname,
        c.job,
        c.email,
        c.phone,
        c.company_name,
        c.is_active,
        c.created_at,
        c.activated_at,
        COUNT(DISTINCT l.id) AS license_count,
        SUM(CASE WHEN l.status IN ('active', 'trial_active') THEN 1 ELSE 0 END) AS active_license_count,
        MAX(COALESCE(l.updated_at, c.updated_at)) AS latest_license_activity
      FROM Customers c
      LEFT JOIN Licenses l ON l.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)
    .all() as AdminCustomerRow[]

  return {
    summary: {
      totalCustomers: Number(summaryRow.total_customers) || 0,
      activeCustomers: Number(summaryRow.active_customers) || 0,
      totalLicenses: Number(summaryRow.total_licenses) || 0,
      activeLicenses: Number(summaryRow.active_licenses) || 0,
      activeActivationCodes: Number(summaryRow.active_activation_codes) || 0,
      activeDevices: Number(summaryRow.active_devices) || 0,
    },
    customers: customerRows.map(toAdminCustomerSummary),
  }
}

export function getAdminCustomerDetail(customerId: number): AdminCustomerDetail {
  const safeCustomerId = requireCustomerId(customerId)
  const customer = getPublicCustomerById(safeCustomerId)

  if (!customer) {
    throw new Error('Customer not found.')
  }

  const activationCodeRows = db
    .prepare(`
      SELECT
        ac.id,
        ac.code,
        ac.status,
        ac.device_id,
        ac.issued_at,
        ac.expires_at,
        ac.used_at,
        ac.used_by_device_id,
        ac.created_via,
        l.license_name,
        l.id AS license_public_id
      FROM ActivationCodes ac
      INNER JOIN Licenses l ON l.id = ac.license_id
      WHERE ac.customer_id = ?
      ORDER BY ac.issued_at DESC
      LIMIT 12
    `)
    .all(safeCustomerId) as AdminActivationCodeRow[]

  const eventRows = db
    .prepare(`
      SELECT
        e.id,
        e.event_type,
        e.device_id,
        e.payload_json,
        e.created_at,
        l.license_name,
        l.id AS license_public_id
      FROM LicenseEvents e
      LEFT JOIN Licenses l ON l.id = e.license_id
      WHERE e.customer_id = ?
      ORDER BY e.created_at DESC
      LIMIT 12
    `)
    .all(safeCustomerId) as AdminLicenseEventRow[]

  return {
    customer,
    licenses: listLicensesByCustomerId(safeCustomerId),
    activationCodes: activationCodeRows.map((row) => ({
      id: row.id,
      code: row.code,
      status: row.status,
      deviceId: row.device_id,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      usedByDeviceId: row.used_by_device_id,
      createdVia: row.created_via,
      licenseName: row.license_name,
      licensePublicId: toPublicLicenseId(row.license_public_id),
    })),
    events: eventRows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      deviceId: row.device_id,
      payload: parseJson(row.payload_json),
      createdAt: row.created_at,
      licenseName: row.license_name,
      licensePublicId: row.license_public_id ? toPublicLicenseId(row.license_public_id) : null,
    })),
  }
}

export function deleteAdminCustomer(customerId: number) {
  const customer = requireCustomerRecord(customerId)

  db.exec('BEGIN')

  try {
    db.prepare('DELETE FROM LicenseDevices WHERE license_id IN (SELECT id FROM Licenses WHERE customer_id = ?)').run(customer.id)
    db.prepare('DELETE FROM ActivationCodes WHERE customer_id = ?').run(customer.id)
    db.prepare('DELETE FROM LicenseEvents WHERE customer_id = ?').run(customer.id)
    db.prepare('DELETE FROM TrialActivations WHERE customer_id = ? OR email = ?').run(customer.id, customer.email)
    db.prepare('DELETE FROM Licenses WHERE customer_id = ?').run(customer.id)
    db.prepare('DELETE FROM Customers WHERE id = ?').run(customer.id)

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return {
    deletedCustomerId: customer.id,
    deletedCustomerEmail: customer.email,
  }
}

export function updateAdminCustomer(customerId: number, input: AdminCustomerUpdateInput) {
  const customer = requireCustomerRecord(customerId)
  const name = requireText(input.name, 'Name')
  const surname = requireText(input.surname, 'Surname')
  const job = requireText(input.job, 'Job')
  const companyName = requireText(input.companyName, 'Company name')
  const email = normalizeEmail(requireText(input.email, 'Email address'))
  const phone = normalizePhone(requireText(input.phone, 'Phone'))

  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.')
  }

  if (!validatePhone(phone)) {
    throw new Error('Please enter a valid phone number.')
  }

  const duplicateCustomer = db
    .prepare('SELECT id FROM Customers WHERE email = ? AND id <> ? LIMIT 1')
    .get(email, customer.id) as { id: number } | undefined

  if (duplicateCustomer) {
    throw new Error('Another customer already uses this email address.')
  }

  const updatedAt = new Date().toISOString()

  db.exec('BEGIN')

  try {
    db.prepare(`
      UPDATE Customers
      SET
        name = ?,
        surname = ?,
        job = ?,
        email = ?,
        phone = ?,
        company_name = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, surname, job, email, phone, companyName, updatedAt, customer.id)

    if (email !== customer.email) {
      db.prepare(`
        UPDATE Licenses
        SET
          license_email = ?,
          updated_at = ?
        WHERE customer_id = ?
      `).run(email, updatedAt, customer.id)

      db.prepare(`
        UPDATE TrialActivations
        SET email = ?
        WHERE customer_id = ? OR email = ?
      `).run(email, customer.id, customer.email)
    }

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getAdminCustomerDetail(customer.id)
}

/**
 * Update license details (expires_at, status, etc).
 * Admin can extend license expiration or modify status.
 */
export function updateAdminLicense(
  licenseId: number,
  input: {
    expiresAt?: unknown
    status?: unknown
  },
) {
  if (!Number.isInteger(licenseId) || licenseId <= 0) {
    throw new Error('License not found.')
  }

  // Fetch license
  const license = db.prepare('SELECT id, customer_id FROM Licenses WHERE id = ?').get(licenseId) as any

  if (!license) {
    throw new Error('License not found.')
  }

  const updates: string[] = []
  const values: any[] = []

  // Optional: new expires_at (ISO date string)
  if (input.expiresAt !== undefined) {
    const expiresAt = String(input.expiresAt).trim()
    if (!expiresAt) {
      throw new Error('Expires at cannot be empty.')
    }

    // Validate ISO format (basic check)
    const date = new Date(expiresAt)
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date format. Use ISO format (YYYY-MM-DD or ISO 8601).')
    }

    updates.push('expires_at = ?')
    values.push(expiresAt)
  }

  // Optional: new status
  const allowedStatuses = ['active', 'trial_active', 'expired', 'revoked', 'suspended']
  if (input.status !== undefined) {
    const status = String(input.status).trim().toLowerCase()
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${allowedStatuses.join(', ')}`)
    }

    updates.push('status = ?')
    values.push(status)
  }

  if (updates.length === 0) {
    throw new Error('No fields to update. Provide expiresAt and/or status.')
  }

  // Track update timestamp
  const updatedAt = new Date().toISOString()
  updates.push('updated_at = ?')
  values.push(updatedAt)
  values.push(license.id)

  const sql = `UPDATE Licenses SET ${updates.join(', ')} WHERE id = ?`

  db.prepare(sql).run(...values)

  // Return updated license
  return getAdminCustomerDetail(license.customer_id)
}
