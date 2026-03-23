import { randomBytes, randomInt } from 'node:crypto'
import { db } from './db'
import { hashPassword, verifyPassword } from './password'
import {
  normalizeEmail,
  normalizePhone,
  requirePassword,
  requireText,
  validateEmail,
  validateNonDisposableEmail,
  validatePhone,
} from './validation'

type CustomerRow = {
  id: number
  name: string
  surname: string
  job: string
  email: string
  phone: string
  company_name: string
  password_hash: string
  is_active: number
  verification_code: string | null
  verification_expires_at: string | null
  created_at: string
  updated_at: string
  activated_at: string | null
}

export type PublicCustomer = {
  id: number
  name: string
  surname: string
  job: string
  email: string
  phone: string
  companyName: string
  isActive: boolean
  createdAt: string
  activatedAt: string | null
}

export type RegisterInput = {
  name: unknown
  surname: unknown
  job: unknown
  email: unknown
  phone: unknown
  companyName: unknown
  password: unknown
}

export type CustomerSyncInput = {
  name?: unknown
  surname?: unknown
  job?: unknown
  phone?: unknown
  companyName?: unknown
  email?: unknown
}

function nowIso() {
  return new Date().toISOString()
}

function isoInMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

function toPublicCustomer(customer: CustomerRow): PublicCustomer {
  return {
    id: customer.id,
    name: customer.name,
    surname: customer.surname,
    job: customer.job,
    email: customer.email,
    phone: customer.phone,
    companyName: customer.company_name,
    isActive: customer.is_active === 1,
    createdAt: customer.created_at,
    activatedAt: customer.activated_at,
  }
}

function getCustomerByEmail(email: string) {
  return db
    .prepare('SELECT * FROM Customers WHERE email = ?')
    .get(normalizeEmail(email)) as CustomerRow | undefined
}

function getCustomerById(id: number) {
  return db.prepare('SELECT * FROM Customers WHERE id = ?').get(id) as CustomerRow | undefined
}

function requireCustomerById(id: number) {
  const customer = getCustomerById(id)

  if (!customer) {
    throw new Error('Customer not found.')
  }

  return customer
}

export function registerCustomer(input: RegisterInput) {
  const name = requireText(input.name, 'Name')
  const surname = requireText(input.surname, 'Surname')
  const job = requireText(input.job, 'Job')
  const email = normalizeEmail(requireText(input.email, 'Email address'))
  const phone = normalizePhone(requireText(input.phone, 'Phone'))
  const companyName = requireText(input.companyName, 'Company name')
  const password = requirePassword(input.password)

  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.')
  }

  if (!validatePhone(phone)) {
    throw new Error('Please enter a valid phone number.')
  }

  const passwordHash = hashPassword(password)
  const verificationCode = String(randomInt(100000, 1000000))
  const verificationExpiresAt = isoInMinutes(15)
  const timestamp = nowIso()
  const existing = getCustomerByEmail(email)

  if (existing?.is_active === 1) {
    throw new Error('An active account already exists for this email address.')
  }

  if (existing) {
    db.prepare(`
      UPDATE Customers
      SET
        name = ?,
        surname = ?,
        job = ?,
        phone = ?,
        company_name = ?,
        password_hash = ?,
        verification_code = ?,
        verification_expires_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name,
      surname,
      job,
      phone,
      companyName,
      passwordHash,
      verificationCode,
      verificationExpiresAt,
      timestamp,
      existing.id,
    )
  } else {
    db.prepare(`
      INSERT INTO Customers (
        name,
        surname,
        job,
        email,
        phone,
        company_name,
        password_hash,
        is_active,
        verification_code,
        verification_expires_at,
        created_at,
        updated_at,
        activated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NULL)
    `).run(
      name,
      surname,
      job,
      email,
      phone,
      companyName,
      passwordHash,
      verificationCode,
      verificationExpiresAt,
      timestamp,
      timestamp,
    )
  }

  return {
    email,
    name,
    verificationCode,
    verificationExpiresAt,
  }
}

export function activateCustomer(emailInput: unknown, codeInput: unknown) {
  const email = normalizeEmail(requireText(emailInput, 'Email address'))
  const code = requireText(codeInput, 'Activation code')
  const customer = getCustomerByEmail(email)

  if (!customer) {
    throw new Error('Account not found.')
  }

  if (customer.is_active === 1) {
    throw new Error('This account is already active.')
  }

  if (!customer.verification_code || customer.verification_code !== code) {
    throw new Error('Invalid activation code.')
  }

  if (!customer.verification_expires_at || new Date(customer.verification_expires_at).getTime() < Date.now()) {
    throw new Error('Activation code has expired. Please register again to receive a new code.')
  }

  const activatedAt = nowIso()

  db.prepare(`
    UPDATE Customers
    SET
      is_active = 1,
      verification_code = NULL,
      verification_expires_at = NULL,
      activated_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(activatedAt, activatedAt, customer.id)

  const updatedCustomer = getCustomerById(customer.id)

  if (!updatedCustomer) {
    throw new Error('Account not found after activation.')
  }

  return toPublicCustomer(updatedCustomer)
}

export function loginCustomer(emailInput: unknown, passwordInput: unknown) {
  const email = normalizeEmail(requireText(emailInput, 'Email address'))
  const password = requireText(passwordInput, 'Password')
  const customer = getCustomerByEmail(email)

  if (!customer || !verifyPassword(password, customer.password_hash)) {
    throw new Error('Invalid email address or password.')
  }

  if (customer.is_active !== 1) {
    throw new Error('Please activate your account before logging in.')
  }

  return toPublicCustomer(customer)
}

export function getPublicCustomerById(id: number) {
  const customer = getCustomerById(id)
  return customer ? toPublicCustomer(customer) : null
}

export function getActiveCustomerByEmail(emailInput: unknown) {
  const email = normalizeEmail(requireText(emailInput, 'Email address'))
  const customer = getCustomerByEmail(email)

  if (!customer) {
    throw new Error('Customer account was not found.')
  }

  if (customer.is_active !== 1) {
    throw new Error('Please activate your account before requesting a license.')
  }

  return toPublicCustomer(customer)
}

export function resolveCustomerForLicenseEmail(emailInput: unknown) {
  const email = normalizeEmail(requireText(emailInput, 'Email address'))

  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address.')
  }

  if (!validateNonDisposableEmail(email)) {
    throw new Error('Disposable email addresses are not allowed for licensing.')
  }

  const existing = getCustomerByEmail(email)

  if (existing) {
    return toPublicCustomer(existing)
  }

  const timestamp = nowIso()
  const placeholderPassword = hashPassword(randomBytes(24).toString('hex'))

  const result = db.prepare(`
    INSERT INTO Customers (
      name,
      surname,
      job,
      email,
      phone,
      company_name,
      password_hash,
      is_active,
      verification_code,
      verification_expires_at,
      created_at,
      updated_at,
      activated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?, NULL)
  `).run(
    'License',
    'Contact',
    'Trial User',
    email,
    '+10000000000',
    'Unspecified',
    placeholderPassword,
    timestamp,
    timestamp,
  )

  return toPublicCustomer(requireCustomerById(Number(result.lastInsertRowid)))
}

export function changeCustomerPassword(customerId: number, newPasswordInput: unknown, confirmPasswordInput: unknown) {
  const newPassword = requirePassword(newPasswordInput)
  const confirmPassword = requirePassword(confirmPasswordInput)

  if (newPassword !== confirmPassword) {
    throw new Error('New password and confirm password must match.')
  }

  const customer = requireCustomerById(customerId)
  const passwordHash = hashPassword(newPassword)
  const updatedAt = nowIso()

  db.prepare(`
    UPDATE Customers
    SET
      password_hash = ?,
      updated_at = ?
    WHERE id = ?
  `).run(passwordHash, updatedAt, customer.id)

  return toPublicCustomer(requireCustomerById(customer.id))
}

export function syncCustomerFromApp(customerId: number, input: CustomerSyncInput) {
  const customer = requireCustomerById(customerId)

  const nextName = input.name !== undefined ? requireText(input.name, 'Name') : customer.name
  const nextSurname = input.surname !== undefined ? requireText(input.surname, 'Surname') : customer.surname
  const nextJob = input.job !== undefined ? requireText(input.job, 'Job') : customer.job
  const nextCompanyName =
    input.companyName !== undefined ? requireText(input.companyName, 'Company name') : customer.company_name
  const nextPhone = input.phone !== undefined ? normalizePhone(requireText(input.phone, 'Phone')) : customer.phone

  if (input.email !== undefined) {
    const normalizedEmail = normalizeEmail(requireText(input.email, 'Email address'))

    if (!validateEmail(normalizedEmail)) {
      throw new Error('Please enter a valid email address.')
    }

    if (normalizedEmail !== customer.email) {
      throw new Error('Email address sync must match the current account email.')
    }
  }

  if (!validatePhone(nextPhone)) {
    throw new Error('Please enter a valid phone number.')
  }

  const updatedAt = nowIso()

  db.prepare(`
    UPDATE Customers
    SET
      name = ?,
      surname = ?,
      job = ?,
      phone = ?,
      company_name = ?,
      updated_at = ?
    WHERE id = ?
  `).run(nextName, nextSurname, nextJob, nextPhone, nextCompanyName, updatedAt, customer.id)

  return toPublicCustomer(requireCustomerById(customer.id))
}
