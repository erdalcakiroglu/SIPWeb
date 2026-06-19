export type D1Result<T = unknown> = {
  results?: T[]
  meta?: {
    last_row_id?: number
  }
}

export type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement
  first: <T = Record<string, unknown>>() => Promise<T | null>
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>
  run: () => Promise<D1Result>
}

export type D1Database = {
  prepare: (query: string) => D1PreparedStatement
}

export type AssetFetcher = {
  fetch: (request: Request) => Promise<Response>
}

export type R2ObjectLike = {
  body?: ReadableStream | null
  httpEtag?: string
  writeHttpMetadata?: (headers: Headers) => void
}

export type R2BucketLike = {
  get: (key: string) => Promise<R2ObjectLike | null>
}

export type Bindings = {
  DB: D1Database
  LICENSE_PUBLIC_KEY: string
  LICENSE_PRIVATE_KEY: string
  ADMIN_JWT_SECRET: string
  PORTAL_JWT_SECRET: string
  ASSETS: AssetFetcher
  DOWNLOADS_BUCKET?: R2BucketLike
  RESEND_API_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

export type DownloadReleaseRow = {
  version: string
  released: string
  sha256: string
  updated_at: string
  updated_by: string | null
}
