name: enforce-red-lines
description: GitHub Pages deploy kısıtları ve Supabase güvenlik kuralları.

# **Mimari Kırmızı Çizgiler (Red Lines)**

Aşağıdaki kurallar Admin onayı olmadan **DEĞİŞTİRİLEMEZ**:

1. **Dağıtım Kısıtları (GitHub Pages):**
   * Next.js konfigürasyonu **`output: 'export'`** olmak zorundadır.
   * `next/image` bileşeni `unoptimized: true` ayarı olmadan kullanılamaz (imaj optimizasyonu için sunucu yok).
   * `getServerSideProps` veya API Routes (Backend) KULLANILAMAZ. Tüm mantık Client-Side veya Supabase Edge Functions üzerinde olmalıdır.

2. **Supabase Güvenliği:**
   * **ASLA** `service_role` key'i client tarafında (env variables dahil) kullanma. Sadece `anon_key` kullanılabilir.
   * Tüm tablolar için **Row Level Security (RLS)** aktif edilmelidir.

3. **Veri Bütünlüğü:**
   * Excel referansındaki hesaplama mantığı (Örn: $/m² hesabı Brüt alan üzerindendir) değiştirilemez.

Eğer istek bu kuralları ihlal ediyorsa, işlemi DURDUR ve alternatif sun.