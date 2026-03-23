declare module 'session-file-store' {
  import type { Session } from 'express-session'

  interface FileStoreOptions {
    path?: string
    ttl?: number
  }

  function FileStore(session: typeof import('express-session')): new (options?: FileStoreOptions) => Session.Store

  export = FileStore
}
