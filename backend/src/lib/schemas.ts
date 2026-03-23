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
