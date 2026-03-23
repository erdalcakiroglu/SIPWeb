import type { Request, Response, NextFunction } from 'express'

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Merkezi hata middleware'i. Route'lardan next(error) ile gelen hataları
 * tutarlı JSON ve uygun status code ile döndürür.
 */
export function errorHandler(
  err: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
  const statusCode = getStatusCode(err, message)

  if (!isProduction()) {
    console.error('[Error]', err instanceof Error ? err.stack : err)
  }

  response.status(statusCode).json({ message })
}

function getStatusCode(err: unknown, message: string): number {
  if (typeof (err as { statusCode?: number }).statusCode === 'number') {
    return (err as { statusCode: number }).statusCode
  }
  if (message === 'Authentication required.' || message === 'Admin authentication required.') {
    return 401
  }
  if (
    message === 'Customer not found.' ||
    message === 'Account not found.' ||
    message === 'Selected license could not be found.'
  ) {
    return 404
  }
  return 400
}
