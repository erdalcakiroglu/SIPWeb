import { Hono } from 'hono'
import type { Bindings } from '../types'
import { DEFAULT_DOWNLOAD_RELEASE, getDownloadReleaseInfo } from '../lib/downloadRelease'

export const downloadRoutes = new Hono<{ Bindings: Bindings }>()

downloadRoutes.get('/api/download/release', async (c) => {
  try {
    return c.json({
      downloadRelease: await getDownloadReleaseInfo(c),
    })
  } catch (error) {
    console.warn('Download release lookup failed. Falling back to defaults.', error)

    return c.json({
      downloadRelease: {
        ...DEFAULT_DOWNLOAD_RELEASE,
        updatedAt: null,
        updatedBy: null,
      },
    })
  }
})

downloadRoutes.get('/SQL-Performance-Intelligence.msi', async (c) => {
  const object = await c.env.DOWNLOADS_BUCKET?.get('SQL-Performance-Intelligence.msi')

  if (!object?.body) {
    return c.json({ error: 'Installer not found' }, 404)
  }

  const headers = new Headers()
  if (object.writeHttpMetadata) {
    object.writeHttpMetadata(headers)
  }
  headers.set('Content-Type', headers.get('Content-Type') || 'application/x-msi')
  headers.set('Content-Disposition', 'attachment; filename="SQL-Performance-Intelligence.msi"')
  if (object.httpEtag) {
    headers.set('ETag', object.httpEtag)
  }

  return new Response(object.body, { headers })
})

