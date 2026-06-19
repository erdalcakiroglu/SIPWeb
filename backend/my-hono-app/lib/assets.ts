export function isAdminHost(url: URL): boolean {
  return url.hostname === 'admin.sqlperformance.ai'
}

export function isPortalHost(url: URL): boolean {
  return url.hostname === 'portal.sqlperformance.ai'
}

export function resolveAdminAssetPath(pathname: string): string {
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname

  if (normalizedPath === '/login') return '/admin-login'
  if (normalizedPath === '/admin/login') return '/admin-login'
  if (normalizedPath === '/admin/forgot-password') return '/admin-forgot-password'
  if (normalizedPath === '/admin/reset-password') return '/admin-reset-password'
  if (normalizedPath === '/admin/licenses') return '/admin-licenses'
  if (/^\/admin\/licenses\/\d+$/.test(normalizedPath)) return '/admin-license-detail'
  if (normalizedPath === '/admin/devices') return '/admin-devices'
  if (/^\/admin\/devices\/\d+$/.test(normalizedPath)) return '/admin-device-detail'
  if (normalizedPath === '/admin/customers') return '/admin-customers-v2'
  if (/^\/admin\/customers\/\d+$/.test(normalizedPath)) return '/admin-customer-detail'
  if (normalizedPath === '/admin/contact-messages') return '/admin-contact-messages'
  if (normalizedPath === '/admin/download-release') return '/admin-download-release'
  if (normalizedPath === '/admin/tickets') return '/admin-tickets'
  if (/^\/admin\/tickets\/\d+$/.test(normalizedPath)) return '/admin-ticket-detail'
  if (normalizedPath === '/admin/events') return '/admin-events'
  if (normalizedPath === '/admin/audit-logs') return '/admin-audit-logs'
  if (normalizedPath === '/admin/monitoring') return '/admin-monitoring'
  if (normalizedPath === '/logo.svg') return '/logo.png'

  return normalizedPath
}

export function resolvePortalAssetPath(pathname: string): string {
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname

  if (normalizedPath === '/login') return '/portal-login'
  if (normalizedPath === '/portal') return '/portal-dashboard'
  if (normalizedPath === '/portal/login') return '/portal-login'
  if (normalizedPath === '/portal/forgot-password') return '/portal-forgot-password'
  if (normalizedPath === '/portal/reset-password') return '/portal-reset-password'
  if (normalizedPath === '/portal/change-password') return '/portal-change-password'
  if (normalizedPath === '/portal/licenses') return '/portal-licenses'
  if (/^\/portal\/licenses\/\d+$/.test(normalizedPath)) return '/portal-license-detail'
  if (normalizedPath === '/portal/tickets') return '/portal-tickets'
  if (/^\/portal\/tickets\/\d+$/.test(normalizedPath)) return '/portal-ticket-detail'
  if (normalizedPath === '/portal/downloads') return '/portal-downloads'
  if (normalizedPath === '/portal/billing') return '/portal-billing'

  return normalizedPath
}

export async function fetchAdminAsset(c: any, pathname?: string): Promise<Response> {
  const requestUrl = new URL(c.req.url)
  const assetUrl = new URL(requestUrl.toString())
  assetUrl.pathname = resolveAdminAssetPath(pathname || requestUrl.pathname)
  assetUrl.search = ''
  return c.env.ASSETS.fetch(new Request(assetUrl.toString(), c.req.raw))
}

export async function fetchPortalAsset(c: any, pathname?: string): Promise<Response> {
  const requestUrl = new URL(c.req.url)
  const assetUrl = new URL(requestUrl.toString())
  assetUrl.pathname = resolvePortalAssetPath(pathname || requestUrl.pathname)
  assetUrl.search = ''
  return c.env.ASSETS.fetch(new Request(assetUrl.toString(), c.req.raw))
}

export function resolveHostService(host: string) {
  if (host === 'admin.sqlperformance.ai') return 'sqlperformance-admin-api'
  if (host === 'portal.sqlperformance.ai') return 'sqlperformance-portal-api'
  if (host === 'license.sqlperformance.ai') return 'sqlperformance-license-api'
  if (host === 'downloads.sqlperformance.ai') return 'sqlperformance-downloads'
  return 'sqlperformance-api'
}
