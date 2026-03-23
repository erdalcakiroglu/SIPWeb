import type { Request, Response, NextFunction } from 'express'
import type { z, ZodSchema } from 'zod'

/**
 * req.body'yi verilen Zod şemasına göre doğrular. Başarılıysa req.body'yi
 * parse edilmiş değerle değiştirir; hata varsa 400 ve mesaj döner.
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body ?? {})

    if (result.success) {
      request.body = result.data as z.infer<T>
      next()
      return
    }

    const first = result.error.errors[0]
    const message = first ? `${first.path.join('.')}: ${first.message}` : 'Validation failed.'
    response.status(400).json({ message })
  }
}
