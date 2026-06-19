export function parsePagination(c: any) {
  const page = Math.max(parseInt(c.req.query('page') || '1', 10), 1)
  const pageSize = Math.min(
    Math.max(parseInt(c.req.query('pageSize') || '20', 10), 1),
    100,
  )

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  }
}

export function pagedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
) {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}
