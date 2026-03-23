# SQL Performance Intelligence - Kullanici Yardim Kilavuzu

Bu dokuman, uygulamadaki tum modullerin ne yaptigini ve temel kullanim adimlarini aciklar.

## 1) Baslamadan Once

1. `Settings > Database` altindan en az bir SQL Server baglantisi ekleyin.
2. Baglanti satirindaki `Connect` ile baglaniyi aktif edin.
3. Alt bilgi cubugundan (Info Bar) aktif `Server`, `Database` ve gerekirse `AI Model` secin.

## 2) Dashboard

### Ne yapar?
- Sunucu sagligi, bellek, is yukleri, IO ve TempDB metriklerini tek ekranda izletir.
- Otomatik yenileme ile anlik trend takibi yapar.

### Nasil kullanilir?
1. `Dashboard` moduline girin.
2. Sag ustten yenileme araligini secin (`5s`, `15s`, `30s`, `60s`).
3. `Start` ile otomatik yenilemeyi baslatin, `Stop` ile durdurun.
4. Renkli metrikleri (normal/uyari/kritik) izleyip sorunlu alani tespit edin.

## 3) Object Explorer

### Ne yapar?
- Veritabani nesnelerini (SP, View, Trigger, Function vb.) listeler.
- Secilen nesnenin kaynak kodunu, istatistiklerini ve iliski baglantilarini gosterir.
- `AI Tune` ile nesne bazli analiz/iyilestirme akisini calistirir.

### Nasil kullanilir?
1. `Object Explorer` ekranina gidin.
2. Ustten veritabani ve nesne tipi secin, arama kutusuyla filtreleyin.
3. Listeden nesne secip sag panelde `Source Code`, `Statistics`, `Relations` sekmelerini inceleyin.
4. `Prepare AI Tune` veya `AI Tune` aksiyonuyla AI analizini baslatin.

## 4) Query Statistics

### Ne yapar?
- En maliyetli sorgulari Query Store (veya fallback DMV) uzerinden analiz eder.
- Etki skoru, trend, risk ve plan stabilitesi gibi gostergeler sunar.
- Sorgu detayinda kaynak kodu, plan ve AI analizi verir.

### Nasil kullanilir?
1. `Query Statistics` moduline gecin.
2. Zaman araligi, siralama, satir limiti ve arama filtrelerini ayarlayin.
3. Listeden bir sorguya cift tiklayip detay penceresini acin.
4. Detayda `Source Code`, `Execution Plan`, `AI Analysis` sekmelerini kullanin.
5. Gerekirse `Batch Operations` ile toplu AI/export islemleri yapin.

## 5) Index Advisor

### Ne yapar?
- Indeksleri deterministik olarak siniflandirir ve onceliklendirir.
- Eksik/kullanilmayan/parcalanma gibi durumlar icin aksiyon onerileri uretir.
- Bakim scripti ve analiz raporu olusturur.

### Nasil kullanilir?
1. `Index Advisor` ekraninda `Refresh` ile indeks analizini yukleyin.
2. Tablo satirindan bir indeks secin.
3. Oneri detaylarini ve skorlarini inceleyin.
4. `Generate Maintenance Script` ile script olusturun.
5. `Export Analysis Report` ile raporu disari alin.
6. `AI Analysis` sekmesinde `Analyze` ile AI yorumunu alin.

## 6) Blocking Analysis

### Ne yapar?
- Bloklama zincirini ve oturumlar arasi kilit etkisini gorsellestirir.
- Kritik blocker oturumlarini hizli tespit etmeyi saglar.
- Snapshot ve audit ciktilari uretebilir.

### Nasil kullanilir?
1. `Blocking Analysis` moduline girin.
2. `Refresh Now` veya `Auto-Refresh` ile veriyi guncelleyin.
3. Filtreleri (`Critical Only`, `Production DB`, `Head Blockers`) ihtiyaca gore ac/kapatin.
4. Ust blocker icin `Investigate`, gerekiyorsa `Kill Top Blocker` kullanin.
5. Ihtiyaca gore `Export CSV`, `Audit CSV`, `History CSV`, `Export PNG` alin.

## 7) Security Audit

### Ne yapar?
- SQL Server guvenlik durusunu read-only sekilde denetler.
- Bulgulari seviye bazli listeler, kontrol/eslestirme alanlari ile raporlar.
- HTML denetim raporu disari aktarir.

### Nasil kullanilir?
1. `Security Audit` moduline girin.
2. `Run Audit` ile taramayi baslatin.
3. Sonuclarda ozet kartlar, bulgu listesi ve detay panelini inceleyin.
4. `Save HTML` ile denetim raporunu kaydedin.

## 8) Scheduled Jobs

### Ne yapar?
- SQL Server Agent job durumlarini izler.
- Calisan, basarisiz ve genel job ozetini tek ekranda gosterir.

### Nasil kullanilir?
1. `Scheduled Jobs` moduline gecin.
2. `Refresh` ile anlik durumu guncelleyin.
3. Calisan ve basarisiz job listelerini inceleyin.
4. Ekran acik oldugu surece periyodik yenilemeyi takip edin.

## 9) Wait Statistics

### Ne yapar?
- Wait tiplerini kategorize ederek performans darbogazini ortaya cikarir.
- Baseline, karsilastirma ve otomasyon ayarlari sunar.
- CSV/JSON/Markdown formatlarinda disa aktarim yapar.

### Nasil kullanilir?
1. `Wait Statistics` moduline girin ve `Refresh` ile veriyi cekin.
2. `Set Baseline` ile referans anlik goruntuyu alin.
3. Filtreleri ayarlayip `Apply Filter` ile sonucu daraltin.
4. `Save Before` / `Save After` ve `Compare` ile degisim analizi yapin.
5. `Export` ile raporu disari alin.
6. Gerekirse esik, planli toplama ve hedef sunucu ayarlarini kaydedin.

## 10) Settings

### Ne yapar?
- Uygulamanin tum ana ayarlarini yonetir.
- Veritabani baglantilari, AI saglayicilari, lisans ve gorunum tercihlerini tek yerde toplar.

### Nasil kullanilir?
1. `Settings` ekranina girin.
2. `General` sekmesinde acilis ve menu gorunurluk tercihlerini yonetin.
3. `AI / LLM` sekmesinde model saglayicisi ekleyin, test edin, varsayilan secin.
4. `Database` sekmesinde baglanti ekleyin/duzenleyin/silin ve cache ayarlarini yapin.
5. `License` sekmesinde trial/lisans dogrulama ve local app lock ayarlarini yapin.
6. `Appearance` sekmesinde tema ve font boyutlarini degistirin.
7. Degisikliklerden sonra `Save Settings` ile kaydedin.

## 11) Chat (Gelistirme Asamasi)

### Ne yapar?
- Dogal dilde SQL performans sorulari sormaya yarar.
- Hizli aksiyon butonlari ve ornek sorgu kaliplari sunar.

### Nasil kullanilir?
- Bu modul kodda mevcut olsa da varsayilan olarak menude kilitlidir ve son kullaniciya acik degildir.
- Aktif oldugunda metin kutusuna soru yazip `Send` ile AI yaniti alinabilir.

## 12) Info Bar (Alt Bilgi Cubugu)

### Ne yapar?
- Baglanti durumu, aktif sunucu/veritabani, SQL surumu, lisans durumu ve AI modelini gosterir.

### Nasil kullanilir?
1. `Server` acilir listesinden profil secerek baglanti degistirin.
2. `Database` listesinden aktif veritabanini degistirin.
3. `AI Model` listesinden aktif saglayiciyi degistirin.
4. Durum metinlerinden baglanti ve lisans sagligini hizli kontrol edin.

---

## Modul - Kisa Ozet Tablosu

| Modul | Ana Amac |
|---|---|
| Dashboard | Sunucu sagligini anlik izleme |
| Object Explorer | DB nesnelerini inceleme ve AI Tune |
| Query Statistics | En maliyetli sorgulari analiz etme |
| Index Advisor | Indeks iyilestirme onerileri uretme |
| Blocking Analysis | Bloklama zinciri ve blocker tespiti |
| Security Audit | Guvenlik denetimi ve HTML raporlama |
| Scheduled Jobs | SQL Agent job sagligi izleme |
| Wait Statistics | Wait darbogazi ve trend analizi |
| Settings | Tum uygulama ayarlarini yonetme |
| Chat | AI sohbet modulu (su an kapali) |
| Info Bar | Hizli baglanti/model/lisans kontrolu |
