name: project-context
description: Blok Takip Sistemi'nin iş mantığı, hesaplama formülleri ve veri modeli.

# **Proje Bağlamı**

## **Proje Tanımı**
Mermer/Blok takibi için kullanılan Excel dosyasının; Next.js (Frontend) ve Supabase (Backend/DB) kullanılarak SPA'ya dönüştürülmesidir. POC, GitHub Pages üzerinde yayınlanacaktır.

## **Temel Akış**
1. **Veri Girişi:** Kullanıcı blok ölçülerini, durumunu ve işlem bilgilerini girer.
2. **Hesaplama (Client-Side):** Hacim (m³), Tonaj, Fire, Net m² ve Maliyetler anlık hesaplanır.
3. **Kayıt:** Veriler Supabase veritabanına işlenir.
4. **Dashboard:** Global maliyetler ve KPI'lar raporlanır.

## **Veri Bölümlemesi (Sections)**
Uygulama arayüzü şu mantıksal bölümlerden oluşmalıdır:
1. **Blok Kimlik:** (Kaynak, Tarih, Tedarikçi)
2. **Ölçüler:** (En, Boy, Yükseklik -> Hacim m³ hesaplanır)
3. **Üretim:** (Katrak ve Silim çıkışları -> Brüt/Net m² hesaplanır)
4. **Maliyetler:** (Hammadde, Lojistik, Kesim, Yüzey İşlemleri, Paketleme) -> *Burada Alt Toplamlar kritiktir.*
5. **Finansal Özet:** ($/m² ve Toplam Maliyet)

## **Kritik Hesaplamalar (Excel Referanslı)**
* **Hacim (m³):** (En * Boy * Yük) / 1,000,000
* **Net m²:** Brüt Silim m² - Fire m²
* **Toplam Maliyet:** Blok + Nakliye + Malzeme + Kesim + Yüzey + Paketleme
* **Birim Maliyet ($/m²):** Toplam Maliyet / Brüt Silim m²

*Detaylı formül ve field mapping için `project_kickoff.md` referans alınacaktır.*