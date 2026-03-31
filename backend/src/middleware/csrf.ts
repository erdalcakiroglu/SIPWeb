import { randomBytes } from 'crypto'
import type { Request, Response, NextFunction } from 'express'

/**
 * CSRF Token Middleware using session storage.
 * Generates a token on first request (GET) and validates on subsequent requests (POST/PATCH/DELETE).
 */

const CSRF_TOKEN_SESSION_KEY = '_csrfToken'

/**
 * Middleware to attach/validate CSRF tokens.
 * For GET requests: Generate and attach token to session.
 * For state-changing requests (POST/PATCH/DELETE): Validate token.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Generate token on GET requests or if not present
  if (!req.session[CSRF_TOKEN_SESSION_KEY]) {
    req.session[CSRF_TOKEN_SESSION_KEY] = randomBytes(32).toString('hex')
  }

  // Attach token to response (can be used in responses or templates)
  res.locals.csrfToken = req.session[CSRF_TOKEN_SESSION_KEY]

  // For state-changing methods, validate token
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
    const tokenFromRequest = req.body?._csrf || req.headers['x-csrf-token']

    if (!tokenFromRequest) {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'No CSRF token provided in request',
      })
    }

    if (tokenFromRequest !== req.session[CSRF_TOKEN_SESSION_KEY]) {
      return res.status(403).json({
        error: 'CSRF token invalid',
        message: 'CSRF token validation failed',
      })
    }
  }

  next()
}

/**
 * Generate a new CSRF token for the current session.
 * Useful for token refresh operations.
 */
export function generateCsrfToken(req: Request): string {
  const token = randomBytes(32).toString('hex')
  req.session[CSRF_TOKEN_SESSION_KEY] = token
  return token
}

/**
 * Get current CSRF token (or generate if not present).
 */
export function getCsrfToken(req: Request): string {
  if (!req.session[CSRF_TOKEN_SESSION_KEY]) {
    return generateCsrfToken(req)
  }
  return req.session[CSRF_TOKEN_SESSION_KEY]
}
