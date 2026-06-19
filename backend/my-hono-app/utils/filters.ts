export function addLikeSearch(
  where: string[],
  params: unknown[],
  search: string,
  columns: string[],
) {
  if (!search) return

  const likeSql = columns.map((col) => `${col} LIKE ?`).join(' OR ')
  where.push(`(${likeSql})`)

  const q = `%${search}%`
  columns.forEach(() => params.push(q))
}

export function addStatusFilter(
  where: string[],
  params: unknown[],
  status: string,
  column = 'status',
) {
  if (!status || status === 'all') return

  where.push(`${column} = ?`)
  params.push(status)
}

export function buildWhereSql(where: string[]) {
  return where.length ? `WHERE ${where.join(' AND ')}` : ''
}
