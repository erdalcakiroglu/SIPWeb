export type SortDir = 'asc' | 'desc'

export function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function parsePageSize(value: string | null) {
  const n = Number(value)
  return [10, 20, 50, 100].includes(n) ? n : 20
}

export function parseSortBy(
  value: string | null,
  allowedColumns: string[],
  fallback = 'created_at',
) {
  return value && allowedColumns.includes(value) ? value : fallback
}

export function parseSortDir(value: string | null): SortDir {
  return value === 'asc' ? 'asc' : 'desc'
}

export function buildListSearchParams(args: {
  search: string
  status: string
  page: number
  pageSize: number
  sortBy: string
  sortDir: SortDir
}) {
  const params = new URLSearchParams()

  if (args.search) params.set('search', args.search)
  if (args.status !== 'all') params.set('status', args.status)
  if (args.page !== 1) params.set('page', String(args.page))
  if (args.pageSize !== 20) params.set('pageSize', String(args.pageSize))
  if (args.sortBy !== 'created_at') params.set('sortBy', args.sortBy)
  if (args.sortDir !== 'desc') params.set('sortDir', args.sortDir)

  return params
}

export function buildApiListParams(args: {
  search: string
  status: string
  page: number
  pageSize: number
  sortBy: string
  sortDir: SortDir
  extra?: Record<string, string | number | undefined | null>
}) {
  const params = new URLSearchParams({
    page: String(args.page),
    pageSize: String(args.pageSize),
    search: args.search,
    status: args.status,
    sortBy: args.sortBy,
    sortDir: args.sortDir,
  })

  if (args.extra) {
    Object.entries(args.extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })
  }

  return params
}
