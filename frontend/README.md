# SQL Performance Intelligence - Frontend

Next.js App Router ile geliştirilen pazarlama ve dokümantasyon web arayüzü.

## Gereksinimler

- Node.js `>= 20.9.0`
- npm `>= 10`

## Hızlı Başlangıç

```bash
# Proje klasörüne gir
cd C:\Users\erdal.cakiroglu\PycharmProjects\SPStudioProWeb-v2.2\frontend

# Bağımlılıkları yükle
npm install

# Development server
npm run dev
```

Tarayıcı: `http://localhost:3000`

## NPM Scriptleri

```bash
npm run dev       # Local development
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint kontrolü
npm run lint:fix  # ESLint otomatik düzeltme
```

## Deploy Script (IIS/Node)

`scripts/deploy.ps1` production paketi hazirlar:

- `npm ci` + `npm run build`
- `.next/standalone` icine `public` ve `.next/static` dosyalarini ekler
- `dist-packages/<release-name>` klasorunu olusturur
- opsiyonel `.zip` dosyasi uretir
- opsiyonel hedef klasore kopyalar ve Windows service restart eder

Ornekler:

```powershell
# Sadece paket olustur (build dahil)
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1

# Hedef klasore deploy et ve servisi restart et
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 `
  -DeployPath C:\apps\spstudio `
  -RestartService `
  -ServiceName SPStudioWeb

# Build almadan mevcut ciktiyi paketle
powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 `
  -SkipInstall -SkipBuild
```

## Mevcut Sayfalar

- `/` ana landing page
- `/download` indirme sayfası
- `/docs` dokümantasyon ana sayfası
- `/docs/[slug]` getting started içerikleri
- `/docs/modules/[slug]` modül bazlı dokümantasyon
- `/security` güvenlik sayfası
- `/contact` iletişim sayfası

## Klasör Yapısı (Özet)

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── download/
│   ├── docs/
│   ├── security/
│   └── contact/
├── components/
├── public/
├── eslint.config.mjs
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Teknolojiler

- Next.js `16.1.x` (App Router)
- React `18`
- Tailwind CSS `3`
- TypeScript `5`
- ESLint `9` + `eslint-config-next`

## İndirilebilir EXE ve SHA-256

Download sayfasındaki **version**, **released** ve **sha256** değerleri `app/download/release.json` dosyasından gelir.

1. Kurulum dosyasını `public/downloads/` içine koyun (dosya adı: `SQL Performance Intelligence.exe`).
2. Hash (ve isteğe bağlı sürüm) güncelle:
   - `npm run download:hash` — sadece SHA-256 güncellenir; version/released mevcut değerlerde kalır.
   - `npm run download:hash -- --version 2.4.3 --released 2026-03-15` — hash + version + released birlikte güncellenir.
3. Projeyi yeniden build edin.

Version veya released’i script ile vermezseniz, `release.json` içindeki mevcut değerler korunur; isterseniz bu dosyayı elle de düzenleyebilirsiniz.

## Notlar

- `next.config.js` içinde `output: 'standalone'` ayarı açıktır.
- Tema renkleri ve font ayarları `tailwind.config.ts` dosyasındadır.
