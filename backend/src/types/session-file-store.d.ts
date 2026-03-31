declare module 'better-sqlite3-session-store' {
  import type { Session, SessionOptions, Store } from 'express-session'
  import type Database from 'better-sqlite3'

  interface SqliteStoreOptions {
    client: Database.Database
    expired?: {
      clear?: boolean
      intervalMs?: number
    }
  }

  function SqliteStore(session: typeof import('express-session')): {
    new (options: SqliteStoreOptions): Store
  }

  export default SqliteStore
}

declare module 'session-file-store' {
  import type { Session } from 'express-session'

  interface FileStoreOptions {
    path?: string
    ttl?: number
  }

  function FileStore(session: typeof import('express-session')): new (options?: FileStoreOptions) => Session.Store

  export = FileStore
}
