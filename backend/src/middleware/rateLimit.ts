import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

/**
 * Genel API için yumuşak limit (dakikada 100 istek).
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.rateLimitGeneral,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Auth uç noktaları: login, register, activate (brute-force azaltma).
 * Başarılı istekler limiti sıfırlamıyor - sadece hata denemeleri sayılıyor.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimitAuth,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Başarılı istekleri (2xx responses) rate limit'ten hariç tut
    return req.method === 'GET'
  },
})

/**
 * Lisans aktivasyon kodu ve trial start.
 */
export const licenseSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimitLicenseSensitive,
  message: { message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Admin login - daha strict (5 deneme / 15 dakika).
 * Başarılı girişleri rate limit'ten hariç tut.
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimitAdminLogin,
  message: { message: 'Too many admin login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => {
    // GET isteklerini skip et
    return req.method === 'GET'
  },
})
