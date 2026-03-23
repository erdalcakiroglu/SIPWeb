# Kullanıcı Arayüzü Analizi — SQLPerf Backend Portal

Bu dokümanda mevcut arayüzün görsel ve etkileşim açısından analizi, iyileştirme önerileri ve eklenebilecek yeni özellikler listelenmiştir.

---

## 1. Mevcut Durum Özeti

- **Teknik:** Statik HTML + tek `styles.css` (~870 satır), vanilla JS (`app.js`, `admin.js`). Sayfa bazlı navigasyon (SPA değil).
- **Sayfalar:** Ana giriş, hesap oluşturma, aktivasyon, müşteri hesabı (overview, profil, şifre, aktivasyon kodu), admin giriş, admin paneli.
- **Tasarım:** Açık tema, teal/cyan ağırlıklı renk paleti, Plus Jakarta Sans (CSS’te tanımlı ancak HTML’de font linki yok), kart tabanlı düzen, basit formlar.

---

## 2. Görsel ve Etkileşim Sorunları

### 2.1 Marka ve Kimlik
- **Logo / favicon yok:** Sadece “SQLPerf” metni; görsel kimlik zayıf.
- **Font:** `styles.css` içinde `Plus Jakarta Sans` kullanılıyor ancak HTML’de Google Fonts (veya başka) linki yok; font yüklenmezse sistem fontuna düşüyor.
- **Tutarlılık:** Auth sayfaları (login, create-account, activate) tek kart + form; hesap sayfaları hero + sidebar ile daha “dolu”. İki farklı his veriyor.

### 2.2 Yükleme ve Geri Bildirim
- **Form gönderimi:** Çoğu formda submit sırasında buton devre dışı / spinner yok; kullanıcı tekrar tıklayabilir veya “çalışıyor mu?” diye düşünebilir.
- **Sayfa geçişleri:** Hesap verisi yüklenirken skeleton veya global loading yok; boş “-” değerler kısa süre görünebiliyor.
- **Sadece bir yerde:** “Downloading...” metni var; diğer submit’lerde benzer geri bildirim yok.

### 2.3 Form Deneyimi
- **Hata gösterimi:** Hatalar sadece sayfa üstündeki tek bir `#message` kutusunda; hangi alanın hatalı olduğu net değil.
- **Şifre:** Güç göstergesi (strength indicator) yok; “en az 8 karakter” dışında yönlendirme az.
- **Alan doğrulama:** HTML5 `required` ve `minlength` var; sunucudan dönen alan bazlı hata (örn. “Geçersiz e-posta”) input’un yanında gösterilmiyor.
- **Placeholder / yardım:** Bazı alanlarda placeholder var (örn. Device ID); diğerlerinde rehber metin az.

### 2.4 Boş Durumlar (Empty States)
- “No active license is available”, “No license has been assigned”, “No customers found.” gibi metinler sade; ikon veya illüstrasyon yok, net bir “şimdi ne yapmalıyım?” aksiyonu yok.

### 2.5 Görsel Derinlik ve Hareket
- **Renk:** Tek bir açık tema; gradient ve gölgeler var ama genel his “kurumsal şablon” gibi kalabiliyor.
- **Animasyon:** Hover’da kısa transition’lar var; sayfa açılışı, modal, mesaj kutusu için anlamlı animasyon yok.
- **Vurgular:** Önemli aksiyonlar (örn. “Generate Activation Code”, “Delete”) görsel olarak yeterince öne çıkmıyor veya birbirine çok benziyor.

### 2.6 Responsive ve Mobil
- 980px ve 640px breakpoint’ler mevcut; grid’ler tek sütuna dönüyor.
- Hesap sayfalarında sidebar üstte toplanıyor; mobilde “License Overview / Activation Code / Profile / Password” için tab bar veya bottom nav yok, link listesi kalıyor.
- Tablolar yatay scroll ile çözülmüş; admin tarafında kart görünümü veya özet satır gibi alternatif sunulmuyor.

### 2.7 Erişilebilirlik
- `aria-live`, `aria-label`, `role="dialog"` gibi kullanımlar var (iyi).
- Odak (focus) stilleri: `outline` ve `border-color` ile verilmiş; kontrast ve “focus ring” belirginliği artırılabilir.
- “Reduce motion” tercihi kontrol edilmiyor; animasyonlar her zaman açık.

### 2.8 Admin Paneli
- Metrik kartları yan yana 6 sütun; dar ekranda sıkışıyor.
- Müşteri listesi tek tablo; sayfalama (pagination) yok, arama client-side.
- Müşteri detayı açıldığında sayfa içi panel; modal veya ayrı sayfa seçeneği yok.

---

## 3. İyileştirme Önerileri (Öncelik Sırasıyla)

### Yüksek Öncelik
1. **Logo ve favicon**  
   - Favicon (örn. `.ico` / `.svg`) ekleyin.  
   - Header’da küçük logo (veya logotype) kullanın; auth ve hesap sayfalarında ortak olsun.

2. **Font yükleme**  
   - `index.html` (veya layout) içinde Plus Jakarta Sans için `<link>` ekleyin (Google Fonts veya self-host).  
   - İsteğe bağlı: `font-display: swap` ile FOIT/FOUT davranışını netleştirin.

3. **Form gönderiminde loading**  
   - Tüm submit butonlarında: tıklanınca butonu `disabled` yapın, metni “Gönderiliyor…” / “Kaydediliyor…” yapın veya spinner ikon ekleyin.  
   - İsteğe bağlı: Form container’a `aria-busy="true"` verin.

4. **Hata mesajlarını alanlara bağlama**  
   - Sunucudan gelen 400 cevabında alan adı (örn. `email`, `password`) varsa ilgili input’un altında veya yanında kırmızı metin gösterin.  
   - Genel hata için üstteki mevcut message kutusu kalsın; alan bazlı hatalar ayrı gösterilsin.

5. **Şifre güç göstergesi**  
   - Kayıt ve “şifre değiştir” formlarında çubuk veya etiket (Zayıf / Orta / Güçlü) ekleyin; kurallar (en az 8 karakter, büyük/küçük harf, rakam vb.) kısa listede yazılsın.

### Orta Öncelik
6. **Boş durumları zenginleştirme**  
   - Lisans yok, müşteri yok vb. için basit bir ikon (SVG) veya illüstrasyon.  
   - Altında kısa açıklama + CTA (örn. “Hesap oluştur”, “İlk lisansı ekle”).

7. **Skeleton / ilk yükleme**  
   - Hesap sayfasında `/api/auth/me` dönene kadar hero ve lisans listesi yerine skeleton bloklar gösterin; “-” ile dolu anlık görüntüyü azaltın.

8. **Dark mode**  
   - `prefers-color-scheme: dark` ile veya kullanıcı seçimi ile koyu tema.  
   - CSS değişkenleri zaten var; dark için `--background`, `--surface`, `--text` vb. override edin.

9. **Hafif animasyonlar**  
   - Mesaj kutusu: fade-in / slide-down.  
   - Modal: backdrop + kart için kısa scale/fade.  
   - Liste öğeleri: stagger (sırayla) görünüm (isteğe bağlı).

10. **Auth sayfalarını “hesap” ile uyumlu hale getirme**  
    - Login / Create / Activate’te de ortak bir header (logo + “SQLPerf”) ve aynı kart gölgesi / radius kullanımı; böylece tek bir portal hissi oluşur.

### Düşük Öncelik
11. **Focus stilleri**  
    - `:focus-visible` ile klavye odağında belirgin ring (örn. 2px outline + offset).  
    - Buton ve linklerde tutarlı focus rengi.

12. **Reduce motion**  
    - `@media (prefers-reduced-motion: reduce)` ile transition/animation sürelerini kısaltın veya kapatın.

13. **Admin: tablo alternatifi**  
    - Mobilde müşteri listesini kart listesi olarak gösterme; “View” ile detaya geçiş.

14. **Admin: sayfalama**  
    - Müşteri sayısı artınca client-side veya server-side pagination (örn. 25’er kayıt).

---

## 4. Eklenecek Yeni Özellikler

### Kimlik Doğrulama ve Hesap
- **Beni hatırla:** İsteğe bağlı “Remember me”; cookie süresi uzatılsın.
- **Şifremi unuttum:** E-posta ile sıfırlama linki (backend’de token + SMTP gerekir).
- **Çoklu oturum / cihaz listesi:** Hesap sayfasında “Aktif oturumlar” ve “Diğer cihazlardan çıkış yap”.

### Müşteri Portalı
- **Özet dashboard:** Girişte “Son aktiviteler”, “Aktif lisansların özeti”, hızlı aksiyonlar (tek tıkla aktivasyon kodu sayfasına git).
- **Bildirim / toast:** Başarı/hata mesajları sayfa üstü kutusu yanında, sağ üstte kısa süreli toast (örn. “Kod kopyalandı”).
- **Veri dışa aktarma:** “Tüm lisanslarımı indir” (JSON/CSV); sadece kendi kayıtları.
- **Dil seçimi:** Basit i18n (TR/EN); metinler JSON’dan, dil seçici header’da.

### Lisans ve Aktivasyon
- **Aktivasyon kodu kopyalama:** Üretilen kodu “Kopyala” butonu ile clipboard’a; kopyalandığına dair kısa geri bildirim.
- **Lisans süresi uyarısı:** Süresi yaklaşan lisanslar için hesap ana sayfasında uyarı bandı veya badge.
- **.lic indirme geçmişi:** Son indirilen .lic’lerin listesi (localStorage veya backend’de son N kayıt).

### Admin Paneli
- **Filtreler:** Müşteri listesinde durum (aktif/pasif), tarih aralığı, şirket adı.
- **Dışa aktarma:** Müşteri listesi veya lisans listesi CSV/Excel.
- **Toplu işlem:** Seçili müşterilere e-posta, seçili lisansları dışa aktarma.
- **Basit istatistikler:** Grafik (aktif lisans sayısı zaman içinde, trial vs commercial dağılımı); basit çubuk/pasta ile.
- **Aktivasyon kodu toplu üretim:** CSV ile e-posta listesi yükleyip toplu kod üretme (backend API gerekir).

### Genel
- **Klavye kısayolları:** Örn. `Esc` ile modal kapatma, `?` ile kısayol listesi.
- **İlk kullanım turu:** İlk girişte “Profil burada”, “Lisanslar burada” gibi 2–3 adımlık tooltip turu (isteğe bağlı).
- **Profil avatarı:** Gravatar (e-posta hash) veya yüklenen foto; şimdilik sadece baş harf yerine kullanılabilir.

---

## 5. Teknik Öneriler

- **CSS:** BEM veya basit prefix (örn. `.sqlp-card`) ile sınıf isimlerini modüler tutun; ileride component-based yapıya geçerseniz taşıması kolay olur.
- **JS:** Form submit, fetch ve mesaj gösterme için ortak yardımcılar (örn. `submitWithLoading(form, handler)`, `showFieldError(input, message)`) çıkarın; tekrarları azaltır.
- **Performans:** Kritik CSS’i inline veya ilk ekranda inline’a yakın verin; font’u `preload` ile erken yükleyin.
- **Test:** Kritik akışlar (kayıt → aktivasyon → giriş → aktivasyon kodu) için basit E2E (Playwright/Cypress) eklenebilir; UI değişikliklerinde regresyonu önler.

---

## 6. Özet Tablo

| Alan              | Mevcut durum        | Öneri (kısa)                                      |
|-------------------|---------------------|---------------------------------------------------|
| Marka             | Logo/favicon yok    | Favicon + header logo                             |
| Font              | Tanımlı, link yok   | Google Fonts (veya self-host) link                |
| Form feedback     | Sadece üst mesaj    | Loading + alan bazlı hata                        |
| Şifre             | Sadece min 8        | Güç göstergesi + kural listesi                    |
| Boş durumlar      | Sadece metin        | İkon + CTA                                        |
| Tema              | Sadece light        | Dark mode seçeneği                                |
| Animasyon         | Minimal             | Mesaj/modal/liste için hafif geçişler            |
| Mobil             | Breakpoint var      | Bottom nav, tablo alternatifi                    |
| Erişilebilirlik   | Temel ARIA          | Focus-visible, reduce-motion                      |
| Yeni özellikler   | -                   | Şifremi unuttum, dashboard, toast, export, i18n  |

Bu liste, arayüzü daha tutarlı, anlaşılır ve görsel olarak daha rafine hale getirmek için kullanılabilir. İstersen bir sonraki adımda önce “yüksek öncelik” maddelerinden biri için somut HTML/CSS/JS patch’leri yazabilirim (örn. sadece loading state veya sadece alan bazlı hata).
