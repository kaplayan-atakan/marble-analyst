Aşağıdaki teknik spesifikasyon, **`BLOK_TAKIP_TEMPLATE_DASHBOARD_CIKIS_TARIH.xlsx`** dosyasındaki **BlokTakip_Data** sayfasının mantığını birebir web arayüzüne taşıyacak şekilde hazırlanmıştır (Lead time, Fire, Net m², maliyet alt toplamları, Grand Total vb. dahil).

---

## 0) Temel varsayımlar ve terminoloji

* Excel’de “üretim alanı” olarak esas alınan alan **Silim m²**’dir.

  * **Brüt alan (gross_m2)** = `Silim m²`
  * **Net alan (net_m2)** = `Silim m² - Fire m²`
* Excel’de **$/m²** hesabı **brüt alan (Silim m²)** üzerinden yapılır:

  * `usd_per_m2 = total_cost / gross_m2`
    (İsterseniz v2’de ayrıca `net_usd_per_m2 = total_cost / net_m2` eklenebilir; ama Excel referansı için v1’de brüt baz alınmalı.)
* Parametreler:

  * **Yoğunluk (ton/m³)** = Özet!H11 (default 2.5)
  * **Hedef net m²/m³** = Özet!H12 (opsiyonel)

---

## 1) Section Mimaris (Bölümleme)

Aşağıdaki bölümlere ayırmanızı öneririm (SPA’da “Blok Detay” ekranında sekme/accordion olarak çok iyi çalışır):

1. **Blok Kimlik & Durum**

   * (Subtotal: ❌)

2. **Blok Ölçüleri & Türetilenler**

   * (Subtotal: ❌)

3. **Üretim / İşlem Bilgisi**

   * **Katrak Çıkışı**
   * **Silim Çıkışı (Brüt m²)**
   * **Fire & Net Verim**
   * **Plan / Sapma**
   * (Subtotal: ❌) *(burada KPI’lar var, maliyet subtotal değil)*

4. **Maliyetler**

   * **Hammadde (Blok fiyat)** → Subtotal ✅
   * **Lojistik (Nakliye)** → Subtotal ✅
   * **Malzeme** → Subtotal ✅
   * **Kesim** → Subtotal ✅
   * **Yüzey İşlemleri (m² bazlı)** → Subtotal ✅
   * **Paketleme** → Subtotal ✅

5. **Finansal Özet (Birim Maliyetler)**

   * (Subtotal: ❌) *(total_cost zaten maliyetlerin grand total’ı)*

6. **Global Özet / Dashboard Aggregations**

   * (Subtotal: ❌) *(sayfa altı/üstü dashboard hesapları)*

---

## 2) Field ve Veri İlişkileri (Data Schema & Relations)

### 2.1 Önerilen state şekli (frontend için hiyerarşik JSON)

```json
{
  "settings": {
    "density_ton_per_m3": 2.5,
    "target_net_m2_per_m3": null,
    "currency": "USD"
  },
  "blocks": [
    {
      "id": "uuid",
      "meta": {
        "source": "text",
        "arrival_date": "YYYY-MM-DD",
        "supplier": "text",
        "stone_name": "text",
        "subcontractor_code": "text",
        "note": "text",
        "status": "enum: stokta|islemde|satildi|iptal",
        "exit_date": "YYYY-MM-DD|null"
      },
      "dimensions": {
        "width_cm": 0,
        "length_cm": 0,
        "height_cm": 0
      },
      "process": {
        "operation": "text",
        "operation_date": "YYYY-MM-DD|null"
      },
      "production": {
        "katrak": {
          "thickness_cm": 0,
          "width_cm": 0,
          "length_cm": 0,
          "qty": 0
        },
        "silim": {
          "thickness_cm": 0,
          "width_cm": 0,
          "length_cm": 0,
          "qty": 0
        },
        "scrap_m2": 0,
        "planned_m2": 0
      },
      "costs": {
        "block_price_per_m3": 0,
        "block_price_per_ton": 0,
        "freight_per_m3": 0,
        "freight_per_ton": 0,
        "material_per_m3": 0,
        "material_per_ton": 0,
        "cutting_per_ton": 0,
        "bridge_cost": 0,
        "surface_per_m2": {
          "raw": 0,
          "polished": 0,
          "honed": 0,
          "mesh": 0,
          "brushed": 0,
          "filled": 0
        },
        "packaging": {
          "bundle": 0,
          "crate": 0,
          "pallet": 0
        },
        "product": "text"
      }
    }
  ]
}
```

> **Computed (türetilen) alanları** store’a yazmak yerine “selector / computed getters” olarak üretmeniz önerilir (React: memoized selectors; Vue: computed; Zustand/Redux: derived selectors).

---

### 2.2 Field tabloları (Excel kolonlarıyla birebir)

Aşağıdaki tablolar: **FieldKey / Label / Tip / Kaynak / Formül-Bağımlılık / Excel Kolon**

#### A) Blok Kimlik & Durum

| FieldKey                | Label           | Tip       | Kaynak    | Formül/Bağımlılık          | Excel |
| ----------------------- | --------------- | --------- | --------- | -------------------------- | ----- |
| meta.source             | Kaynak          | Text/Enum | Kullanıcı | -                          | A     |
| meta.arrival_date       | Geliş Tarih     | Date      | Kullanıcı | -                          | B     |
| meta.supplier           | Alınan firma    | Text      | Kullanıcı | -                          | C     |
| meta.stone_name         | Taşın adı       | Text      | Kullanıcı | -                          | D     |
| meta.subcontractor_code | Fason yeri kodu | Text      | Kullanıcı | -                          | E     |
| process.operation       | İşlem           | Text/Enum | Kullanıcı | -                          | K     |
| process.operation_date  | İşlem tarih     | Date      | Kullanıcı | -                          | L     |
| meta.note               | Not             | Text      | Kullanıcı | -                          | AY    |
| meta.status             | Durum           | Enum      | Kullanıcı | -                          | AZ    |
| meta.exit_date          | Çıkış Tarih     | Date      | Kullanıcı | -                          | BA    |
| derived.lead_time_days  | Lead time (gün) | Number    | Hesap     | `exit_date - arrival_date` | BB    |

#### B) Blok Ölçüleri & Türetilenler

| FieldKey                    | Label             | Tip    | Kaynak          | Formül/Bağımlılık     | Excel    |
| --------------------------- | ----------------- | ------ | --------------- | --------------------- | -------- |
| dimensions.width_cm         | En (cm)           | Number | Kullanıcı       | -                     | F        |
| dimensions.length_cm        | Boy (cm)          | Number | Kullanıcı       | -                     | G        |
| dimensions.height_cm        | Yük (cm)          | Number | Kullanıcı       | -                     | H        |
| derived.volume_m3           | m³                | Number | Hesap           | `(F*G*H)/1_000_000`   | I        |
| settings.density_ton_per_m3 | Yoğunluk (ton/m³) | Number | Sabit/Parametre | Özet!H11              | Özet!H11 |
| derived.weight_ton          | Ton               | Number | Hesap           | `volume_m3 * density` | J        |

#### C) Üretim – Katrak Çıkışı

| FieldKey                       | Label           | Tip          | Kaynak    | Formül/Bağımlılık | Excel |
| ------------------------------ | --------------- | ------------ | --------- | ----------------- | ----- |
| production.katrak.thickness_cm | Katrak kalınlık | Number       | Kullanıcı | -                 | M     |
| production.katrak.width_cm     | Katrak en       | Number       | Kullanıcı | -                 | N     |
| production.katrak.length_cm    | Katrak boy      | Number       | Kullanıcı | -                 | O     |
| production.katrak.qty          | Katrak adet     | Number (int) | Kullanıcı | -                 | P     |
| derived.katrak_m2              | Katrak m²       | Number       | Hesap     | `(N*O*P)/10_000`  | Q     |

#### D) Üretim – Silim Çıkışı (Brüt m²)

| FieldKey                      | Label          | Tip          | Kaynak    | Formül/Bağımlılık      | Excel |
| ----------------------------- | -------------- | ------------ | --------- | ---------------------- | ----- |
| production.silim.thickness_cm | Silim kalınlık | Number       | Kullanıcı | -                      | R     |
| production.silim.width_cm     | Silim en       | Number       | Kullanıcı | -                      | S     |
| production.silim.length_cm    | Silim boy      | Number       | Kullanıcı | -                      | T     |
| production.silim.qty          | Silim adet     | Number (int) | Kullanıcı | -                      | U     |
| derived.gross_m2              | Silim m²       | Number       | Hesap     | `(S*T*U)/10_000`       | V     |
| derived.gross_m2_per_m3       | m²/m³          | Number       | Hesap     | `gross_m2 / volume_m3` | W     |

#### E) Fire & Net Verim & Plan

| FieldKey                      | Label                     | Tip        | Kaynak    | Formül/Bağımlılık                      | Excel    |
| ----------------------------- | ------------------------- | ---------- | --------- | -------------------------------------- | -------- |
| production.scrap_m2           | Fire m²                   | Number     | Kullanıcı | -                                      | BC       |
| derived.net_m2                | Net m²                    | Number     | Hesap     | `gross_m2 - scrap_m2`                  | BD       |
| derived.net_m2_per_m3         | Net m²/m³                 | Number     | Hesap     | `net_m2 / volume_m3`                   | BE       |
| production.planned_m2         | Planlanan m²              | Number     | Kullanıcı | -                                      | BF       |
| derived.variance_m2           | Sapma m²                  | Number     | Hesap     | `net_m2 - planned_m2`                  | BG       |
| derived.scrap_pct             | Fire %                    | Percentage | Hesap     | `scrap_m2 / gross_m2`                  | BH       |
| settings.target_net_m2_per_m3 | Hedef net m²/m³           | Number     | Parametre | Özet!H12                               | Özet!H12 |
| derived.yield_delta_vs_target | Verim sapma (net - hedef) | Number     | Hesap     | `net_m2_per_m3 - target_net_m2_per_m3` | BI       |

---

### 2.3 Maliyetler (Section + Subtotal)

> Excel’de “Toplam maliyet” şu alt toplamları toplar:
> `blok_total + nakliye_total + malzeme_total + kesim_total + yuzey_total + paket_total`

#### F) Hammadde (Blok fiyat) — Subtotal ✅

| FieldKey                  | Label             | Tip      | Kaynak    | Formül/Bağımlılık                            | Excel |
| ------------------------- | ----------------- | -------- | --------- | -------------------------------------------- | ----- |
| costs.block_price_per_m3  | Blok fiyat (m3)   | Currency | Kullanıcı | -                                            | X     |
| costs.block_price_per_ton | Blok fiyat (ton)  | Currency | Kullanıcı | -                                            | Y     |
| derived.block_price_total | Blok fiyat toplam | Currency | Hesap     | `if per_ton then per_ton*ton else per_m3*m3` | Z     |

#### G) Lojistik (Nakliye) — Subtotal ✅

| FieldKey              | Label          | Tip      | Kaynak    | Formül/Bağımlılık                            | Excel |
| --------------------- | -------------- | -------- | --------- | -------------------------------------------- | ----- |
| costs.freight_per_m3  | Nakliye (m3)   | Currency | Kullanıcı | -                                            | AA    |
| costs.freight_per_ton | Nakliye (ton)  | Currency | Kullanıcı | -                                            | AB    |
| derived.freight_total | Nakliye toplam | Currency | Hesap     | `if per_ton then per_ton*ton else per_m3*m3` | AC    |

#### H) Malzeme — Subtotal ✅

| FieldKey               | Label          | Tip      | Kaynak    | Formül/Bağımlılık                            | Excel |
| ---------------------- | -------------- | -------- | --------- | -------------------------------------------- | ----- |
| costs.material_per_m3  | Malzeme (m3)   | Currency | Kullanıcı | -                                            | AD    |
| costs.material_per_ton | Malzeme (ton)  | Currency | Kullanıcı | -                                            | AE    |
| derived.material_total | Malzeme toplam | Currency | Hesap     | `if per_ton then per_ton*ton else per_m3*m3` | AF    |

#### I) Kesim — Subtotal ✅

| FieldKey              | Label        | Tip      | Kaynak    | Formül/Bağımlılık                                           | Excel |
| --------------------- | ------------ | -------- | --------- | ----------------------------------------------------------- | ----- |
| costs.cutting_per_ton | Kesim (ton)  | Currency | Kullanıcı | -                                                           | AG    |
| costs.bridge_cost     | Köprü        | Currency | Kullanıcı | -                                                           | AH    |
| derived.cutting_total | Kesim toplam | Currency | Hesap     | `(cutting_per_ton*ton if exists) + (bridge_cost if exists)` | AI    |

#### J) Yüzey İşlemleri (m² bazlı) — Subtotal ✅

| FieldKey                      | Label        | Tip      | Kaynak    | Formül/Bağımlılık                | Excel |
| ----------------------------- | ------------ | -------- | --------- | -------------------------------- | ----- |
| costs.surface_per_m2.raw      | Ham          | Currency | Kullanıcı | -                                | AJ    |
| costs.surface_per_m2.polished | Cilalı       | Currency | Kullanıcı | -                                | AK    |
| costs.surface_per_m2.honed    | Honlu        | Currency | Kullanıcı | -                                | AL    |
| costs.surface_per_m2.mesh     | File         | Currency | Kullanıcı | -                                | AM    |
| costs.surface_per_m2.brushed  | Fırçalı      | Currency | Kullanıcı | -                                | AN    |
| costs.surface_per_m2.filled   | Dolgulu      | Currency | Kullanıcı | -                                | AO    |
| derived.surface_total         | Yüzey toplam | Currency | Hesap     | `SUM(surface_per_m2) * gross_m2` | AP    |

#### K) Paketleme — Subtotal ✅

| FieldKey                | Label        | Tip      | Kaynak    | Formül/Bağımlılık         | Excel |
| ----------------------- | ------------ | -------- | --------- | ------------------------- | ----- |
| costs.packaging.bundle  | Bandıl       | Currency | Kullanıcı | -                         | AQ    |
| costs.packaging.crate   | Kasa         | Currency | Kullanıcı | -                         | AR    |
| costs.packaging.pallet  | Palet        | Currency | Kullanıcı | -                         | AS    |
| derived.packaging_total | Paket toplam | Currency | Hesap     | `bundle + crate + pallet` | AT    |

#### L) Finansal Özet (Grand Total + Birim Maliyetler)

| FieldKey            | Label          | Tip      | Kaynak    | Formül/Bağımlılık                                                                                | Excel |
| ------------------- | -------------- | -------- | --------- | ------------------------------------------------------------------------------------------------ | ----- |
| costs.product       | Ürün           | Text     | Kullanıcı | -                                                                                                | AU    |
| derived.total_cost  | Toplam maliyet | Currency | Hesap     | `block_total + freight_total + material_total + cutting_total + surface_total + packaging_total` | AV    |
| derived.usd_per_m2  | $/m²           | Currency | Hesap     | `total_cost / gross_m2`                                                                          | AW    |
| derived.usd_per_ton | $/ton          | Currency | Hesap     | `total_cost / ton`                                                                               | AX    |

---

## 3) Global Hesaplamalar (Aggregations)

SPA’da 2 seviyede aggregation öneriyorum:

### 3.1 Liste/Dashboard “Genel Toplam Maliyet (Grand Total)”

**Kapsam:** seçili filtre setindeki tüm blokların maliyet toplamı.

* `grand_total_cost = SUM(block.derived.total_cost)`
* Dahil edilen alt toplamlar (Excel birebir):

  * `SUM(derived.block_price_total)`
  * `SUM(derived.freight_total)`
  * `SUM(derived.material_total)`
  * `SUM(derived.cutting_total)`
  * `SUM(derived.surface_total)`
  * `SUM(derived.packaging_total)`

### 3.2 Global KPI’lar (Excel Özet mantığı ile uyumlu)

* `total_m3 = SUM(volume_m3)`
* `total_ton = SUM(ton)`
* `total_gross_m2 = SUM(gross_m2)` *(Excel: Toplam silim m²)*
* `total_fire_m2 = SUM(scrap_m2)`
* `total_net_m2 = SUM(net_m2)`
* `overall_fire_pct = total_fire_m2 / total_gross_m2` *(Excel Özet! Fire %)*
* `avg_usd_per_m2_gross = grand_total_cost / total_gross_m2` *(Excel Özet! Ortalama $/m²)*
* `avg_usd_per_ton = grand_total_cost / total_ton` *(Excel Özet! Ortalama $/ton)*
* `net_usd_per_m2 = grand_total_cost / total_net_m2` *(Excel Özet! Net ortalama $/m²)*
* `overall_net_m2_per_m3 = total_net_m2 / total_m3` *(Excel Özet! Net m²/m³)*
* `avg_lead_time_days = AVERAGE(lead_time_days where > 0)` *(Excel Özet! Ortalama lead time)*

### 3.3 Gruplamalar (Taşa göre özet)

Excel’deki “Taşa göre özet” tablo mantığı:

**GroupBy stone_name:**

* `m3_sum`
* `ton_sum`
* `gross_m2_sum`
* `cost_sum`
* `usd_per_m2 = cost_sum / gross_m2_sum`

---

## Uygulama notları (developer için kısa ama kritik)

* **Boş değer davranışı (Excel ile uyum):**

  * Üçlü çarpan formüllerinde (m³, m²) herhangi biri boşsa sonuç `null/""`
  * `total_cost` için: maliyet alanlarının hepsi boşsa `null` (Excel: COUNTA kontrolü)
* **Validasyon:**

  * Negatif değer yok
  * `scrap_m2 <= gross_m2` (aksi halde net m² negatife gider)
  * Tarihler: exit_date >= arrival_date (lead time negatif olmamalı)
* **State yönetimi:**

  * “inputs” ayrı, “computed” ayrı. Computed alanlar tek bir `computeBlockDerived(block, settings)` fonksiyonundan gelsin.