export function parseSort(
  c: any,
  allowedSort: string[],
  defaultSortBy = 'created_at',
  defaultSortDir: 'asc' | 'desc' = 'desc',
) {
  const sortByRaw = c.req.query('sortBy') || defaultSortBy
  const sortDirRaw = c.req.query('sortDir') || defaultSortDir

  const sortBy = allowedSort.includes(sortByRaw) ? sortByRaw : defaultSortBy
  const sortDir = String(sortDirRaw).toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  return { sortBy, sortDir }
}
