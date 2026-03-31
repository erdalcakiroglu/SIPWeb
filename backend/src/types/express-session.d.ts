import 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId?: number
    adminAuthenticated?: boolean
    adminEmail?: string
    _csrfToken?: string
  }
}
