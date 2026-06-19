import { getClientIp } from './http'

export async function writeAuditLog(
  c: any,
  input: {
    actorType: string
    actorId?: number | string | null
    actorEmail?: string | null
    action: string
    entityType: string
    entityId?: number | string | null
    metadata?: Record<string, unknown> | null
  },
) {
  try {
    await c.env.DB
      .prepare(`
        INSERT INTO audit_logs (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(
        input.actorType,
        input.actorId ?? null,
        input.actorEmail ?? null,
        input.action,
        input.entityType,
        input.entityId ?? null,
        getClientIp(c),
        c.req.header('User-Agent') || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      )
      .run()
  } catch (error) {
    console.warn('writeAuditLog skipped:', error)
  }
}
