name: integrate-logic
description: Excel mantığının kod tarafına (Hook/Utility) aktarılması.

# **Mantık Entegrasyon Standardı**

Yeni bir hesaplama mantığı eklerken:

1. **Separation of Concerns:**
   * Hesaplama mantığını UI bileşenlerine gömme. `hooks/useBlockCalculations.ts` veya `utils/costEngine.ts` gibi izole modüller kullan.
   
2. **Type Safety:**
   * `project-context` içinde belirtilen veri tiplerine (Currency, Enum, Date) uygun TypeScript interface'leri oluştur.

3. **Graceful Degradation:**
   * Eksik veri (örn: henüz girilmemiş nakliye maliyeti) durumunda uygulama çökmemeli, ilgili alt toplam 0 veya null dönmelidir.

## **Örnek Hesaplama Bloğu**
```typescript
// const grossM2 = calculateGrossM2(width, length, qty);
// if (!grossM2) return 0;