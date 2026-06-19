import type { DownloadReleaseRow } from '../types'

export const DEFAULT_DOWNLOAD_RELEASE = {
  version: '1.0.11',
  released: '2026-04-04',
  sha256: '1a94d481aecff42addbeec461571fe7f6b6809f7cf7e3a7b8c428160f328e42d',
}

export async function ensureDownloadReleaseSettings(c: any) {
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS DownloadReleaseSettings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version TEXT NOT NULL,
      released TEXT NOT NULL,
      sha256 TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      updated_by TEXT
    )
  `).run()

  const existing = await c.env.DB
    .prepare('SELECT id FROM DownloadReleaseSettings WHERE id = 1 LIMIT 1')
    .first<{ id: number }>()

  if (existing) {
    return
  }

  const now = new Date().toISOString()

  await c.env.DB
    .prepare(`
      INSERT INTO DownloadReleaseSettings (
        id,
        version,
        released,
        sha256,
        updated_at,
        updated_by
      ) VALUES (1, ?, ?, ?, ?, ?)
    `)
    .bind(
      DEFAULT_DOWNLOAD_RELEASE.version,
      DEFAULT_DOWNLOAD_RELEASE.released,
      DEFAULT_DOWNLOAD_RELEASE.sha256,
      now,
      'system',
    )
    .run()
}

export async function getDownloadReleaseInfo(c: any) {
  await ensureDownloadReleaseSettings(c)

  const row = await c.env.DB
    .prepare(`
      SELECT version, released, sha256, updated_at, updated_by
      FROM DownloadReleaseSettings
      WHERE id = 1
      LIMIT 1
    `)
    .first<DownloadReleaseRow>()

  if (!row) {
    throw new Error('Download release settings not found.')
  }

  return {
    version: row.version,
    released: row.released,
    sha256: row.sha256,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }
}

export async function updateDownloadReleaseInfo(
  c: any,
  input: { version: string; released: string; sha256: string },
  updatedBy: string | null,
) {
  await ensureDownloadReleaseSettings(c)

  const now = new Date().toISOString()

  await c.env.DB
    .prepare(`
      UPDATE DownloadReleaseSettings
      SET
        version = ?,
        released = ?,
        sha256 = ?,
        updated_at = ?,
        updated_by = ?
      WHERE id = 1
    `)
    .bind(input.version, input.released, input.sha256, now, updatedBy)
    .run()

  return getDownloadReleaseInfo(c)
}
