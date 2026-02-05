name: safe-config-update
description: Supabase ve Next.js konfigürasyon yönetimi.

# **Güvenli Konfigürasyon Güncelleme Protokolü**

1. **Environment Değişkenleri:**
   * Supabase URL ve Key'leri `.env.local` dosyasına ekle.
   * Değişkenler `NEXT_PUBLIC_` öneki ile başlamalıdır (Client-side erişim için).
   * *Örnek:* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Next.js Config:**
   * `next.config.js` dosyasında `output: 'export'` ayarını her güncellemede koru.