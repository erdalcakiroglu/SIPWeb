// İstek/string yardımcıları.

export function trimOptional(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function getClientIp(c: any) {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
}

export function getCookie(c: any, name: string) {
  const cookie = c.req.header('Cookie') ?? ''

  return cookie
    .split(';')
    .map((part: string) => part.trim())
    .find((part: string) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

export function addExactFilter(
  where: string[],
  params: unknown[],
  column: string,
  value: string,
) {
  if (!value) return
  where.push(`${column} = ?`)
  params.push(value)
}
