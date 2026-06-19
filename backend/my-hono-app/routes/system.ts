import { Hono } from 'hono'
import type { Bindings } from '../types'
import { resolveHostService } from '../lib/assets'

export const systemRoutes = new Hono<{ Bindings: Bindings }>()

systemRoutes.get('/', (c) => {
  const host = new URL(c.req.url).hostname

  if (host === 'www.sqlperformance.ai') {
    return Response.redirect('https://sqlperformance.ai', 301)
  }

  if (host === 'admin.sqlperformance.ai') {
    return c.redirect('/admin/login', 302)
  }

  if (host === 'portal.sqlperformance.ai') {
    return c.redirect('/portal/login', 302)
  }

  return c.json({
    ok: true,
    service: resolveHostService(host),
    host,
  })
})

systemRoutes.get('/health', (c) => {
  const host = new URL(c.req.url).hostname

  return c.json({
    ok: true,
    service: resolveHostService(host),
    host,
  })
})

systemRoutes.get('/api/health', (c) => {
  const host = new URL(c.req.url).hostname

  return c.json({
    ok: true,
    service: resolveHostService(host),
    host,
    timestamp: new Date().toISOString(),
  })
})


systemRoutes.get('/db-test', async (c) => {
  const result = await c.env.DB
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type='table'
       ORDER BY name`,
    )
    .all()

  return c.json(result)
})

