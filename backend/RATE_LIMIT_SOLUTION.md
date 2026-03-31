# Rate Limiting Sorun Çözümü

## Sorununuz

Login ekranında bu hatayı alıyorsunuz:
```
Too many attempts. Please try again in 15 minutes.
```

## Neden Olmuş?

Backend rate limiting kurall vardır:
- **Auth endpoints** (login, register): 15 dakika içinde maksimum 10 deneme
- **Admin login**: 15 dakika içinde maksimum 5 deneme

Çok sayıda test yaptığınız için bu limiti aştınız.

---

## ÇÖZÜM 1: Rate Limit Penceresini Bekleyin

Hata alınıyorsa, saçıkla **15 dakika bekleyin**. Sistem otomatik olarak sıfırlanacaktır.

---

## ÇÖZÜM 2: Rate Limit Ayarlarını Artırın (Geliştirme Ortamında)

**.env dosyasına ekleyin:**

```bash
# Geliştirme ortamında limite daha da artırılabilir
RATE_LIMIT_AUTH=50              # 15 dakika içinde 50 deneme (varsayılan: 30)
RATE_LIMIT_ADMIN_LOGIN=10       # 15 dakika içinde 10 deneme (varsayılan: 5)
```

**Veya kontrol etmek için:**
```bash
# Mevcut limitler
grep "RATE_LIMIT" .env
```

---

## ÇÖZÜM 3: Session/Browser Verisini Temizleyin

Bazı durumlarda browser cache soruna neden olabilir:

### Chrome/Edge
1. DevTools aç: `F12`
2. **Application** → **Cookies** → `localhost:3001` sil
3. **Application** → **Storage** → LocalStorage sil

### Firefox
1. DevTools aç: `F12`
2. **Storage** → **Cookies** sil
3. **Storage** → **Local Storage** sil

Sonra sayfayı yenile: `Ctrl+Shift+Del`

---

## ÇÖZÜM 4: IP/Cihaz Değişikliği

Rate limiter IP adresine göre çalışır. Aşağıdakilerden biri yapabilirsiniz:

### VPN Kullanın
```bash
# VPN bağlayın, sonra tekrar deneyin
```

### Localhost IP'sini Değiştirin (Geliştirme)
```bash
# 127.0.0.1 yerine localhost kullanın
http://localhost:3001     # ✓ Farklı IP
http://127.0.0.1:3001   # ✗ Aynı IP
```

---

## ÇÖZÜM 5: Geliştirme Ortamında Rate Limitli Devre Dışı Bırakın

**src/app.ts** dosyasını açın ve env kontrol edin:

```typescript
// GELIŞTIRME ORTAMINDA (test amaçlı)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/auth', authRouter)  // Rate limit YOKSAY
} else {
  app.use('/api/auth', authLimiter, authRouter)  // Rate limit UYGULA
}
```

---

## ÇÖZÜM 6: Rate Limit Resetini Otomatikleştirin

**Backend yeniden başlatın** - bu bellekteki rate limit sayaçlarını sıfırlar:

```bash
# Eğer npm run dev kullanıyorsanız
# Terminal'i kapatın ve yeniden başlatın

# Terminal'de:
npm run dev

# Veya:
npm run build
npm run start
```

---

## Yapılan İyileştirmeler

✅ **Var sayılan Auth Rate Limit**: 10 → **30** (15 dakika içinde)
✅ **Var sayılan Admin Rate Limit**: 5 → **10** (15 dakika içinde) 
✅ **GET istekleri** rate limit'e sayılmıyor (okuma işlemleri serbest)

---

## Environment Değişkenleri Referansı

```bash
# Tüm rate limit ayarları değiştirilebilir

RATE_LIMIT_GENERAL=100              # Genel API (1 dakika)
RATE_LIMIT_AUTH=30                  # Login/Register/Activate (15 dakika) [ARTTIRILDI]
RATE_LIMIT_LICENSE_SENSITIVE=20     # Trial/Activation (15 dakika)
RATE_LIMIT_ADMIN_LOGIN=10           # Admin Login (15 dakika) [ARTTIRILDI]
```

---

## Üretim Ortamı için Öneriler

**Production'da kesinlikle:**
- ✅ Rate limiting AÇIK tutun (güvenlik için)
- ✅ Limitler **uygun şekilde ayarlayın**:
  - Çok düşük: Kullanıcılar bloklansın
  - Çok yüksek: Brute-force saldırılarına açık
- ✅ Tipik üretim ayarları:
  ```bash
  RATE_LIMIT_AUTH=20                 # 15 dakika
  RATE_LIMIT_ADMIN_LOGIN=5           # 15 dakika
  ```

---

## Ekstra Bilgi

### Rate Limit Headers
Başarılı bir isteğin response'u şu header'ları içerir:
```
RateLimit-Limit: 30
RateLimit-Remaining: 29
RateLimit-Reset: 1711877400
```

### X-Forwarded-For (Proxy Arkasında)
Eğer reverse proxy (Nginx/Apache) kullanıyorsanız, IP doğru algılanması için:

```typescript
app.set('trust proxy', 1)  // app.ts'de ekleyin
```

---

## Kısa Özet

| Sorun | Çözüm | Zaman |
|-------|-------|-------|
| "Too many attempts" hatası | 15 dakika bekle | 15 min |
| Çok sık test etme ihtiyacı | `.env` ile `RATE_LIMIT_AUTH=50` ayarla | Anında |
| Hemen başlamak istiyor | Browser cache temizle | 2 min |
| Tam olarak devre dışı bırakmak | NODE_ENV=development yap | 5 min |

---

## Sorun Devam Ederse

1. `npm run build` çalıştırın (derlemeler başarılı mı?)
2. Backend'i yeniden başlatın: `npm run dev`
3. Browser cache'i tamamen temizleyin
4. `.env` dosyasında `RATE_LIMIT_AUTH=100` ayarlayın
5. `localhost` (127.0.0.1 yerine) kullanın
