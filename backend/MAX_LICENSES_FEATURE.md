# Max Licenses Feature - Admin Control

## Genel Bakış

Admin panelinden müşteri başına **maksimum lisans sayısı** ayarlayabilmesi için eklenen özellik.

- ✅ **Default**: Müşteri başına 1 lisans
- ✅ **Ayarlanabilir**: Admin tarafından istenildiğinde güncellenebilir
- ✅ **Kontrol edilen**: 1-9999 arasında sınırlı

---

## Kullanımı

### 1. Dashboard'da Müşteri Görüntüleme

Admin dashboard'unda müşterilerin listesinde `maxLicenses` alanı görünür:

```json
{
  "id": 1,
  "email": "customer@company.com",
  "licenseCount": 3,
  "maxLicenses": 5
}
```

### 2. Müşteri Detaylarında Güncelleme

Admin panel'den müşteri detaylarına girilip `maxLicenses` güncellenebilir:

**API Call**:
```bash
PATCH /api/admin/customers/{customerId}
Content-Type: application/json
X-CSRF-Token: token_here

{
  "maxLicenses": 10
}
```

**Response**:
```json
{
  "message": "Customer updated successfully",
  "detail": {
    "customer": { ... },
    "maxLicenses": 10
  }
}
```

### 3. Doğrulama

- ✅ **Boş/null değer**: 1'e varsayılan olur
- ✅ **Negatif/0**: Hata ("Max licenses must be a positive integer")
- ✅ **Çok büyük**: 9999'a kapatılır
- ✅ **Ondalık**: `5.5` → Hata

---

## Database

### Migration 4: add_max_licenses

Yeni migration `Customers` tablosuna `max_licenses` column'u ekler:

```sql
ALTER TABLE Customers ADD COLUMN max_licenses INTEGER NOT NULL DEFAULT 1;
```

- **Type**: INTEGER
- **Default**: 1
- **Nullable**: FALSE

---

## API Endpoints Etkilenen

### Dashboard - İyileştirildi ✅
```bash
GET /api/admin/dashboard
```
Response şimdi içerir:
- `customers[].maxLicenses`
- `customers[].licenseCount`
- `customers[].activeLicenseCount`

### Get Customer Detail - İyileştirildi ✅
```bash
GET /api/admin/customers/{customerId}
```
Response şimdi içerir:
- `customersummary.maxLicenses`

### Update Customer - İyileştirildi ✅
```bash
PATCH /api/admin/customers/{customerId}
```
Body şimdi kabul eder:
- `maxLicenses`: Integer (1-9999)

---

## Database Deziyni

### Customers Table

```sql
CREATE TABLE Customers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  surname TEXT,
  email TEXT UNIQUE,
  company_name TEXT,
  max_licenses INTEGER NOT NULL DEFAULT 1,  -- YENİ
  ...other columns...
)
```

---

## Gelecek Adımlar (İsteğe Bağlı)

Aşağıdaki özellikleri daha sonra eklenebilir:

1. **Lisans Oluşturma Sırasında Kontrol**
   - Müşteri `maxLicenses` limitini aştıysa, yeni lisans oluşturma reddedilir

2. **Alert/Notification**
   - Müşteri limite yaklaşınca warning göster

3. **Bulk Update**
   - Birden çok müşterinin `maxLicenses`'ını aynı anda güncelle

4. **Reporting**
   - Dashboard'da "Max Licenses Usage" raporu:
     ```
     Customer: John Doe
     Licenses: 3 / 5 (60%)
     ```

5. **History/Audit**
   - `maxLicenses` değişikliklerini audit trail'e kaydet

---

## Test Adımları

### 1. Migration Çalıştır
```bash
npm run build
npm run dev
# Çıktı: ✅ Migration 4 (add_max_licenses) applied
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sqlperformance.ai","password":"Admin12345!"}'
```

### 3. Dashboard Kontrol
```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  --cookie "session=xxx" | jq '.customers[].maxLicenses'
```

### 4. Müşteri Güncelle
```bash
curl -X PATCH http://localhost:3001/api/admin/customers/1 \
  -H "X-CSRF-Token: token_here" \
  -d '{"maxLicenses": 10}'
```

### 5. Güncellemeyi Doğrula
```bash
curl -X GET http://localhost:3001/api/admin/customers/1 \
  --cookie "session=xxx" | jq '.maxLicenses'
# Çıktı: 10
```

---

## Dosyalar Değiştirilen

### Backend
- ✅ `src/migrations/004_add_max_licenses.ts` (YENİ)
- ✅ `src/migrations/index.ts` (Migration 4 imported)
- ✅ `src/lib/admin.ts` (Types + functions updated)
- ✅ `API.md` (Documentation updated)

### Type Changes
```typescript
// AdminCustomerRow'a eklendi
max_licenses: number

// AdminCustomerSummary'ye eklendi
maxLicenses: number

// AdminCustomerUpdateInput'a eklendi
maxLicenses: unknown
```

---

## Produksyon Deployment

1. **Build**: `npm run build` ✅
2. **Backup DB**: Veritabanını yedekle (migration sonrası geri dönemezsin)
3. **Migration**: Sunucuyu başlat - migration 4 otomatik çalışacak
4. **Test**: Admin panelinden müşteri güncelle ve `maxLicenses` kontrol et
5. **Monitor**: Herhangi bir hata logu kontrol et

---

## Compatibility

- ✅ Var olan veriler korunur (default 1 atanır)
- ✅ Backward compatible (eski API calls hala çalışır)
- ✅ Frontend isteğe bağlı (UI güncellemesi yapabilir, zorlanmaz)

