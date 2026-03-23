# First-Time User License Flow

Bu doküman, uygulamayı ilk kez indiren bir kullanıcının lisanslama sürecindeki adımları açıklar.

---

## Adım 1 — Uygulama ilk kez başlatılır

`main.py` çalışmaya başlar ve lisanslama ile ilgili üç kontrolü sırayla tetikler:

1. `LicenseService().reconcile_local_state()` — mevcut yerel trial durumunu normalize eder.
2. `LicenseService().refresh_runtime_state(force_remote=False)` — önbelleğe alınmış lisans durumunu yeniler.
3. `LicenseDialog` gösterilir — yasal anlaşma onayı beklenir.

---

## Adım 2 — Yasal anlaşma dialogu

`LicenseDialog` ekrana gelir. İki sonuç mümkündür:

- **Reddedilirse:** Uygulama kapanır.
- **Kabul edilirse:** `license_accepted` flag'i yerel config'e yazılır ve akış devam eder.

> Bu dialog, lisans doğrulamasından tamamen ayrı bir katmandır. Ürün lisansı henüz devreye girmemiştir.

---

## Adım 3 — `device_id` oluşturulur

`LicenseService`, makine bilgilerinden (hostname, disk, MAC adresi vb.) SHA-256 özeti alarak `device_id` üretir ve yerel config'e kaydeder. Bu fingerprint, backend'e gönderilecek olan cihaz bağlayıcı kimlik bilgisidir.

---

## Adım 4 — Saklı lisans bulunamaz

`reconcile_local_state()` ve `refresh_runtime_state()` çalıştıktan sonra saklanmış bir token veya `.lic` dosyası tespit edilemez. Efektif lisans durumu `unlicensed` olarak değerlendirilir.

---

## Adım 5 — Settings-only mode (tüm modüller kilitli)

`main_window.py`, lisans durumunu `unlicensed` olarak uygular:

- Navigasyon yalnızca **Settings > License** tab'ına kilitlenir.
- "License Required" mesajı gösterilir.
- Tüm analiz modülleri erişime kapalıdır.

---

## Adım 6 — Kullanıcı bir lisans yöntemi seçer

Kullanıcının önünde üç yol açılır.

---

### Yol A — Free trial başlatma

1. Kullanıcı **Settings > License** ekranında e-posta adresini girer ve **Start Trial** butonuna tıklar.
2. Uygulama `device_id` ile birlikte `POST /trial/start` isteği gönderir.
3. Backend şu kontrolleri yapar:
   - E-posta geçerli ve tek kullanımlık değil.
   - Bu e-posta veya cihaz daha önce trial almamış.
4. Backend dönen yanıt şu alanları içerir:

```json
{
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "status": "trial_active",
  "trial_expires_at": "2026-04-11T00:00:00Z",
  "refresh_after": "2026-03-13T00:00:00Z",
  "offline_grace_until": "2026-04-11T00:00:00Z",
  "allowed_devices": 1,
  "license_count": 1
}
```

5. Uygulama `token`, `status`, `trial_expires_at`, `allowed_devices` ve `last_validated_at` alanlarını yerel config'e yazar.

> Sunucuya ulaşılamazsa uygulama 30 günlük offline local trial moduna geçer.

---

### Yol B — `.lic` dosyası import etme

Bu yol, air-gapped veya internet erişimi kısıtlı ortamlardaki kullanıcılar içindir.

1. Backend tarafından dışa aktarılmış `.lic` dosyası **Import .lic** arayüzünden yüklenir.
2. Uygulama dosyanın yapısını parse eder:

```json
{
  "format": "SPAI1-LIC",
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "exported_at": "2026-03-12T12:00:00Z"
}
```

3. Güven kaynağı dış JSON wrapper değil, içindeki `token` alanıdır.
4. Token başarıyla doğrulanırsa payload yerel config'e kaydedilir.

> Kriptografik imza doğrulaması planlı bir geliştirme olup henüz tam olarak uygulanmamıştır.

---

### Yol C — Ücretli lisans aktivasyonu

1. Kullanıcı **Settings > License** ekranında activation code ve e-posta adresini girer, ardından **Activate License** butonuna tıklar.
2. Uygulama `POST /license/activate` isteği gönderir.
3. Backend şu kontrolleri yapar:
   - Activation code CSV'de mevcut.
   - Lisans iptal edilmemiş veya süresi dolmamış.
   - E-posta, kayıtlı müşteriyle eşleşiyor.
   - Cihaz limiti aşılmamış.
4. Backend, cihaza bağlı imzalı bir token üretir ve döndürür:

```json
{
  "token": "SPAI1.<payload_b64url>.<signature_b64url>",
  "status": "active",
  "expires_at": "2027-03-12T00:00:00Z",
  "refresh_after": "2026-03-13T00:00:00Z",
  "offline_grace_until": "2026-03-20T00:00:00Z",
  "allowed_devices": 1,
  "license_count": 1
}
```

5. Uygulama token ve durum bilgisini yerel config'e yazar.

---

## Adım 7 — Tüm modüller açılır

Efektif lisans durumu `trial_active` veya `active` olduğunda `main_window.py` tüm navigasyonu aktif hale getirir. Kullanıcı analiz modüllerine tam erişim kazanır.

---

## Özet

| Adım | Bileşen | Açıklama |
|---|---|---|
| 1 | `main.py` | Uygulama başlar, lisans kontrolleri tetiklenir |
| 2 | `LicenseDialog` | Yasal anlaşma onayı alınır |
| 3 | `LicenseService` | `device_id` fingerprint oluşturulur |
| 4 | `LicenseService` | Saklı lisans araması yapılır, bulunamaz |
| 5 | `main_window.py` | Settings-only mode devreye girer |
| 6A | `LicenseService` | Trial başlatılır, `POST /trial/start` çağrılır |
| 6B | `LicenseService` | `.lic` dosyası import edilir, token doğrulanır |
| 6C | `LicenseService` | Lisans aktive edilir, `POST /license/activate` çağrılır |
| 7 | `main_window.py` | Tüm modüller `trial_active` veya `active` durumuyla açılır |