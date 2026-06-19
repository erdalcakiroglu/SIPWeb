import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings } from '../types'
import { rateLimit } from '../lib/rateLimit'
import { getClientIp, normalizeEmail, trimOptional } from '../lib/http'

export const contactRoutes = new Hono<{ Bindings: Bindings }>()

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

contactRoutes.post('/api/contact', async (c) => {
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

