import { z } from 'zod'

const email = z.string().min(1, 'Email is required.').email('Invalid email address.')
const passwordMin8 = z.string().min(8, 'Password must be at least 8 characters long.')
const requiredDeviceId = z.string().min(1, 'Device ID is required.')

export const authRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required.').transform((s) => s.trim()),
  surname: z.string().min(1, 'Surname is required.').transform((s) => s.trim()),
  job: z.string().min(1, 'Job is required.').transform((s) => s.trim()),
  email: z.string().min(1, 'Email is required.').transform((s) => s.trim().toLowerCase()),
  phone: z.string().min(1, 'Phone is required.').transform((s) => s.trim()),
  companyName: z.string().min(1, 'Company name is required.').transform((s) => s.trim()),
  password: passwordMin8,
})

export const authLoginSchema = z.object({
  email: z.string().min(1, 'Email is required.').transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required.'),
})

export const authActivateSchema = z.object({
  email: z.string().min(1, 'Email is required.').transform((s) => s.trim().toLowerCase()),
  code: z.string().min(1, 'Activation code is required.'),
})

export const authChangePasswordSchema = z
  .object({
    newPassword: passwordMin8,
    confirmPassword: passwordMin8,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password must match.',
    path: ['confirmPassword'],
  })

const trialStartRaw = z.object({
  email: email,
  device_id: z.string().optional(),
  deviceId: z.string().optional(),
  server_url: z.string().optional(),
  serverUrl: z.string().optional(),
  license_name: z.string().optional(),
  licenseName: z.string().optional(),
})

export const licenseTrialStartSchema = trialStartRaw
  .refine((data) => (data.device_id ?? data.deviceId ?? '').trim().length > 0, {
    message: 'Device ID is required.',
    path: ['deviceId'],
  })
  .transform((data) => ({
    email: data.email,
    deviceId: (data.device_id ?? data.deviceId ?? '').trim(),
    serverUrl: (data.server_url ?? data.serverUrl ?? '').trim() || undefined,
    licenseName: (data.license_name ?? data.licenseName ?? '').trim() || undefined,
  }))

const activationCodeBodyRaw = z.object({
  email: z.string().min(1, 'Email is required.').transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required.'),
  device_id: z.string().optional(),
  deviceId: z.string().optional(),
  server_url: z.string().optional(),
  serverUrl: z.string().optional(),
  license_name: z.string().optional(),
  licenseName: z.string().optional(),
})

export const licenseActivationCodeBodySchema = activationCodeBodyRaw
  .refine((data) => (data.device_id ?? data.deviceId ?? '').trim().length > 0, {
    message: 'Device ID is required.',
    path: ['deviceId'],
  })
  .transform((data) => ({
    email: data.email,
    password: data.password,
    deviceId: (data.device_id ?? data.deviceId ?? '').trim(),
    serverUrl: (data.server_url ?? data.serverUrl ?? '').trim() || undefined,
    licenseName: (data.license_name ?? data.licenseName ?? '').trim() || undefined,
  }))

const licenseActivateRaw = z.object({
  email: email,
  activation_code: z.string().optional(),
  activationCode: z.string().optional(),
  device_id: z.string().optional(),
  deviceId: z.string().optional(),
  server_url: z.string().optional(),
  serverUrl: z.string().optional(),
  license_name: z.string().optional(),
  licenseName: z.string().optional(),
  client: z.record(z.unknown()).optional(),
})

export const licenseActivateSchema = licenseActivateRaw
  .refine(
    (data) => (data.activation_code ?? data.activationCode ?? '').trim().length > 0,
    { message: 'Activation code is required.', path: ['activationCode'] },
  )
  .refine((data) => (data.device_id ?? data.deviceId ?? '').trim().length > 0, {
    message: 'Device ID is required.',
    path: ['deviceId'],
  })
  .transform((data) => ({
    email: data.email,
    activationCode: (data.activation_code ?? data.activationCode ?? '').trim(),
    deviceId: (data.device_id ?? data.deviceId ?? '').trim(),
    serverUrl: (data.server_url ?? data.serverUrl ?? '').trim() || undefined,
    licenseName: (data.license_name ?? data.licenseName ?? '').trim() || undefined,
    client: data.client,
  }))

export const adminLoginSchema = z.object({
  email: z.string().min(1, 'Admin email is required.').transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1, 'Admin password is required.'),
})

export const adminDownloadReleaseSchema = z.object({
  version: z.string().min(1, 'Version is required.').transform((s) => s.trim()),
  released: z
    .string()
    .min(1, 'Release date is required.')
    .transform((s) => s.trim())
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

const contactFormRawSchema = z.object({
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

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const contactFormSchema = contactFormRawSchema
  .transform((data) => ({
    reason: data.reason,
    fullName: (data.full_name ?? data.fullName ?? '').trim(),
    workEmail: (data.work_email ?? data.workEmail ?? '').trim().toLowerCase(),
    company: trimOptional(data.company),
    subject: (data.subject ?? '').trim(),
    message: (data.message ?? '').trim(),
    environment: trimOptional(data.environment),
    website: trimOptional(data.website),
    sourcePage: trimOptional(data.source_page ?? data.sourcePage),
  }))
  .superRefine((data, ctx) => {
    if (!data.fullName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name is required.',
      })
    } else if (data.fullName.length > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullName'],
        message: 'Full name must be 120 characters or fewer.',
      })
    }

    if (!data.workEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workEmail'],
        message: 'Work email is required.',
      })
    } else if (!email.safeParse(data.workEmail).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workEmail'],
        message: 'Please enter a valid work email address.',
      })
    }

    if (data.company && data.company.length > 160) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['company'],
        message: 'Company must be 160 characters or fewer.',
      })
    }

    if (!data.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'Subject is required.',
      })
    } else if (data.subject.length > 160) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subject'],
        message: 'Subject must be 160 characters or fewer.',
      })
    }

    if (!data.message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['message'],
        message: 'Message is required.',
      })
    } else if (data.message.length > 5000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['message'],
        message: 'Message must be 5000 characters or fewer.',
      })
    }

    if (data.environment && data.environment.length > 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['environment'],
        message: 'Environment must be 200 characters or fewer.',
      })
    }

    if (data.sourcePage && data.sourcePage.length > 500) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourcePage'],
        message: 'Source page must be 500 characters or fewer.',
      })
    }
  })
