// Cloudflare edge cache tabanlı basit rate limiter (PoP-yerel sayım).
declare const caches: {
  default: {
    match: (request: Request) => Promise<Response | undefined>
    put: (request: Request, response: Response) => Promise<void>
  }
}

export async function rateLimit(
  c: any,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const cache = caches.default
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % windowSeconds)

  const rateKey = `https://rate-limit.local/${key}/${windowStart}`
  const req = new Request(rateKey)

  const cached = await cache.match(req)
  let count = 0

  if (cached) {
    count = Number(await cached.text()) || 0
  }

  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reset: windowStart + windowSeconds,
    }
  }

  count++

  await cache.put(
    req,
    new Response(String(count), {
      headers: {
        'Cache-Control': `public, max-age=${windowSeconds}`,
      },
    }),
  )

  return {
    allowed: true,
    remaining: limit - count,
    reset: windowStart + windowSeconds,
  }
}
