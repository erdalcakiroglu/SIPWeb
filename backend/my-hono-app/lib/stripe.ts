export async function stripeFormRequest(
  c: any,
  path: string,
  body: URLSearchParams,
): Promise<any> {
  if (!c.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured.')
  }

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const text = await res.text()
  let data: any = null

  try {
    data = JSON.parse(text)
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error?.message || text || 'Stripe request failed')
  }

  return data
}

export async function verifyStripeSignature(
  payload: string,
  sigHeader: string | undefined,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!sigHeader) return false

  let timestamp: string | null = null
  const v1Signatures: string[] = []

  for (const part of sigHeader.split(',')) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    else if (key === 'v1' && value) v1Signatures.push(value)
  }

  if (!timestamp || v1Signatures.length === 0) return false

  // Replay koruması: zaman damgası tolerans penceresi içinde olmalı.
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > toleranceSeconds) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  )
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Stripe anahtar rotasyonunda birden çok v1 imzası gönderebilir; herhangi biri eşleşmeli.
  return v1Signatures.some((candidate) => {
    if (candidate.length !== expected.length) return false
    let mismatch = 0
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ candidate.charCodeAt(i)
    }
    return mismatch === 0
  })
}

async function planCodeForStripePrice(c: any, priceId: string | null): Promise<string | null> {
  if (!priceId) return null
  const plan = await c.env.DB
    .prepare(`SELECT code FROM subscription_plans WHERE stripe_price_id = ? LIMIT 1`)
    .bind(priceId)
    .first<any>()
  return plan?.code ?? null
}

export async function handleStripeEvent(c: any, event: any): Promise<void> {
  const type = event?.type
  const obj = event?.data?.object ?? {}
  const stripeCustomerId =
    typeof obj.customer === 'string' ? obj.customer : obj.customer?.id ?? null

  if (type === 'checkout.session.completed') {
    const customerId = Number(obj.metadata?.customer_id)
    if (!customerId) return

    await c.env.DB
      .prepare(`
        UPDATE Customers
        SET stripe_customer_id = COALESCE(?, stripe_customer_id),
            plan_code = COALESCE(?, plan_code),
            subscription_status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(stripeCustomerId, obj.metadata?.plan_code ?? null, customerId)
      .run()
    return
  }

  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
    if (!stripeCustomerId) return

    const priceId = obj.items?.data?.[0]?.price?.id ?? null
    const planCode = await planCodeForStripePrice(c, priceId)
    const periodEnd = obj.current_period_end
      ? new Date(Number(obj.current_period_end) * 1000).toISOString()
      : null

    await c.env.DB
      .prepare(`
        UPDATE Customers
        SET subscription_status = COALESCE(?, subscription_status),
            current_period_end = COALESCE(?, current_period_end),
            plan_code = COALESCE(?, plan_code),
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_customer_id = ?
      `)
      .bind(obj.status ?? null, periodEnd, planCode, stripeCustomerId)
      .run()
    return
  }

  if (type === 'customer.subscription.deleted') {
    if (!stripeCustomerId) return

    await c.env.DB
      .prepare(`
        UPDATE Customers
        SET subscription_status = 'canceled',
            plan_code = 'free',
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_customer_id = ?
      `)
      .bind(stripeCustomerId)
      .run()
    return
  }

  // Diğer event türleri: işlem yok (received:true döner, Stripe retry etmez).
}
