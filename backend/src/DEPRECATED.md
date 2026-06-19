# ⚠️ DEPRECATED — Express Backend

Bu dizindeki (`backend/src/`) **Express tabanlı backend artık production'da kullanılmıyor.**

## Production'da ne çalışıyor?

Canlı backend: **`backend/my-hono-app/`** (Cloudflare Workers + Hono + D1 + R2).
`wrangler.toml` şu subdomain'leri bu Worker'a yönlendiriyor:

- `admin.sqlperformance.ai`
- `portal.sqlperformance.ai`
- `license.sqlperformance.ai`
- `downloads.sqlperformance.ai`

Frontend (`backend/public/`) da bu Worker tarafından `assets` binding'i ile servis ediliyor
ve `portal.sqlperformance.ai/api/portal/*` JWT API'sini çağırıyor.

## İki backend arasındaki temel farklar

| | Express (`src/`) — DEPRECATED | Hono (`my-hono-app/`) — CANLI |
|---|---|---|
| Auth | Session + cookie | JWT (HS256) Bearer + refresh |
| Şifre | scrypt | PBKDF2-SHA256 100k |
| DB | yerel better-sqlite3 | Cloudflare D1 |
| Kapsam | auth/admin/license/contact/download | + portal, tickets, billing/Stripe, audit, monitoring |

Express; portal, ticket ve billing özelliklerini **içermiyor**. Bu yüzden tek doğru
kaynak (source of truth) Hono backend'idir.

## Yapılması gerekenler

- Bu dizin yalnızca tarihsel/arşiv amaçlı tutulmaktadır. Yeni özellik **eklemeyin**.
- Ortak iş mantığı (lisans state machine, şema, Ed25519 imzalama) ileride paylaşılan
  bir pakete çıkarılacaksa, kaynak olarak Hono implementasyonu esas alınmalıdır.
- Kullanılmayan build çıktıları (`backend/dist-packages/`, `dist/`) artık `.gitignore`
  kapsamındadır; depodan temizlenmelidir.
