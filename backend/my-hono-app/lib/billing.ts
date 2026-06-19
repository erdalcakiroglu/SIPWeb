export async function getCustomerPlan(c: any, customerId: number) {
  const customer = await c.env.DB
    .prepare(`
      SELECT
        id,
        email,
        name,
        plan_code,
        stripe_customer_id,
        subscription_status,
        current_period_end,
        max_licenses
      FROM Customers
      WHERE id = ?
      LIMIT 1
    `)
    .bind(customerId)
    .first<any>()

  if (!customer) {
    return null
  }

  let plan = null

  if (customer.plan_code) {
    plan = await c.env.DB
      .prepare(`
        SELECT *
        FROM subscription_plans
        WHERE code = ?
        LIMIT 1
      `)
      .bind(customer.plan_code)
      .first<any>()
  }

  if (!plan) {
    plan = await c.env.DB
      .prepare(`
        SELECT *
        FROM subscription_plans
        WHERE is_active = 1
        ORDER BY CASE WHEN code = 'free' THEN 0 ELSE 1 END, id ASC
        LIMIT 1
      `)
      .first<any>()
  }

  return {
    customer,
    plan,
  }
}

export async function getCustomerUsage(c: any, customerId: number) {
  const licenseRow = await c.env.DB
    .prepare(`
      SELECT COUNT(*) AS total
      FROM Licenses
      WHERE customer_id = ?
        AND status != 'deleted'
    `)
    .bind(customerId)
    .first<any>()

  const deviceRow = await c.env.DB
    .prepare(`
      SELECT COUNT(*) AS total
      FROM LicenseDevices ld
      INNER JOIN Licenses l ON l.id = ld.license_id
      WHERE l.customer_id = ?
        AND ld.status = 'active'
    `)
    .bind(customerId)
    .first<any>()

  return {
    licenseCount: Number(licenseRow?.total || 0),
    deviceCount: Number(deviceRow?.total || 0),
  }
}
