/**
 * Audit logging for security-sensitive operations
 */

export interface AuditLogEntry {
  timestamp: string
  action: string
  entity: string
  entityId?: number | string
  status: 'success' | 'failure'
  details?: Record<string, unknown>
  error?: string
}

const auditLogs: AuditLogEntry[] = []

/**
 * Log a security-sensitive operation
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>) {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  auditLogs.push(logEntry)

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUDIT] ${logEntry.timestamp} - ${logEntry.action}:`, entry)
  }

  // Keep only last 1000 entries in memory
  if (auditLogs.length > 1000) {
    auditLogs.shift()
  }
}

/**
 * Get audit logs for a specific entity
 */
export function getAuditLogsForEntity(entity: string, entityId?: number | string): AuditLogEntry[] {
  return auditLogs.filter((log) => log.entity === entity && (!entityId || log.entityId === entityId))
}

/**
 * Get all audit logs
 */
export function getAllAuditLogs(): AuditLogEntry[] {
  return [...auditLogs]
}

/**
 * Clear old audit logs (older than the given number of milliseconds)
 */
export function clearOldAuditLogs(olderThanMs: number) {
  const cutoff = new Date(Date.now() - olderThanMs).toISOString()
  const before = auditLogs.length

  auditLogs.splice(
    0,
    auditLogs.findIndex((log) => log.timestamp > cutoff),
  )

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUDIT] Cleared ${before - auditLogs.length} old entries`)
  }
}
