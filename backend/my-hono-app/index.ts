import { Hono } from 'hono'
import type { Bindings } from './types'
import { isAdminHost, isPortalHost, fetchAdminAsset, fetchPortalAsset } from './lib/assets'
import { licenseRoutes } from './routes/license'
import { portalRoutes } from './routes/portal'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { contactRoutes } from './routes/contact'
import { stripeRoutes } from './routes/stripe'
import { downloadRoutes } from './routes/download'
import { systemRoutes } from './routes/system'

const app = new Hono<{ Bindings: Bindings }>()
const ALLOWED_ORIGINS = [
  'https://sqlperformance.ai',
  'https://www.sqlperformance.ai',
  'https://admin.sqlperformance.ai',
  'https://portal.sqlperformance.ai',
]

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || ''
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin)

  if (c.req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin) {
      return c.json({ error: 'Origin is not allowed' }, 403)
    }

    if (origin) {
      c.header('Access-Control-Allow-Origin', origin)
      c.header('Vary', 'Origin')
      c.header('Access-Control-Allow-Credentials', 'true')
    }

    c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    return new Response(null, { status: 204 })
  }

  if (origin && !isAllowedOrigin) {
    return c.json({ error: 'Origin is not allowed' }, 403)
  }

  await next()

  if (origin && isAllowedOrigin) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
    c.header('Access-Control-Allow-Credentials', 'true')
  }
})

// Rota modülleri (CORS middleware'inden sonra, asset catch-all'larından önce mount edilir).
app.route('/', licenseRoutes)
app.route('/', portalRoutes)
app.route('/', adminRoutes)
app.route('/', authRoutes)
app.route('/', contactRoutes)
app.route('/', stripeRoutes)
app.route('/', downloadRoutes)
app.route('/', systemRoutes)

app.get('*', async (c, next) => {
  const url = new URL(c.req.url)

  if (!isAdminHost(url) || url.pathname.startsWith('/api/')) {
    await next()
    return
  }

  if (url.pathname === '/') {
    return c.redirect('/admin/login', 302)
  }

  if (url.pathname === '/admin') {
    return c.redirect('/admin/login', 302)
  }

  if (url.pathname === '/login') {
    return fetchAdminAsset(c, '/login')
  }

  return fetchAdminAsset(c)
})

app.get('*', async (c, next) => {
  const url = new URL(c.req.url)

  if (isAdminHost(url) && !url.pathname.startsWith('/api/')) {
    if (url.pathname === '/') {
      return c.redirect('/login', 302)
    }
    return fetchAdminAsset(c)
  }

  if (!isPortalHost(url) || url.pathname.startsWith('/api/')) {
    await next()
    return
  }

  if (url.pathname === '/') {
    return c.redirect('/portal/login', 302)
  }

  if (url.pathname === '/portal') {
    return fetchPortalAsset(c, '/portal')
  }

  if (url.pathname === '/login') {
    return fetchPortalAsset(c, '/login')
  }

  return fetchPortalAsset(c)
})

export default app
