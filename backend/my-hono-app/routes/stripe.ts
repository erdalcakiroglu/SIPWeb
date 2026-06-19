import { Hono } from 'hono'
import type { Bindings } from '../types'
import { verifyStripeSignature, handleStripeEvent } from '../lib/stripe'
import { writeAuditLog } from '../lib/audit'

export const stripeRoutes = new Hono<{ Bindings: Bindings }>()

stripeRoutes.post('/api/stripe/webhook', async (c) => {
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

