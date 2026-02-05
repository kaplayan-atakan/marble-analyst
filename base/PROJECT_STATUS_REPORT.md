# 📊 Marble Analyst - AI-PM Project Status Report

**Rapor Tarihi:** 4 Şubat 2026  
**Proje Adı:** Marble Analyst (Blok Takip Sistemi)  
**Versiyon:** v0.1.0 (MVP Development)  
**Durum:** 🟡 Geliştirme Aşamasında (In Development)

---

## 1. Executive Summary

Marble Analyst projesi, Excel tabanlı mermer/taş blok takip sistemini modern bir SPA (Single Page Application) uygulamasına dönüştürmektedir. Proje **Next.js 14** (static export) ve **Supabase** altyapısı üzerine kurulu olup **GitHub Pages** üzerinde deploy edilecektir.

### Genel İlerleme: **70%** ████████░░

| Kategori | Durum | İlerleme |
|----------|-------|----------|
| Altyapı & Konfigürasyon | ✅ Tamamlandı | 100% |
| TypeScript Interfaces | ✅ Tamamlandı | 100% |
| Hesaplama Motoru | ✅ Tamamlandı | 100% |
| Veritabanı Şeması | ✅ Tamamlandı | 100% |
| UI Bileşenleri | 🟡 Devam Ediyor | 75% |
| Sayfalar & Routing | 🟡 Devam Ediyor | 60% |
| Test & QA | ⬜ Başlanmadı | 0% |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static)                     │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 App Router (Static Export)                      │
│  ├── /app/page.tsx          → Dashboard                     │
│  ├── /app/blocks/page.tsx   → Block List                    │
│  └── /app/blocks/new/       → New Block Form                │
├─────────────────────────────────────────────────────────────┤
│  React Components                                            │
│  ├── Layout (Sidebar, Header)                               │
│  ├── Dashboard (KPIs, Charts)                               │
│  └── Blocks (List, Form)                                    │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                        │
│  ├── costEngine.ts    → computeBlockDerived()               │
│  ├── formatters.ts    → Currency/Number formatting          │
│  └── useSupabase.ts   → Data fetching hooks                 │
├─────────────────────────────────────────────────────────────┤
│                    Supabase (PostgreSQL + RLS)               │
│  ├── blocks table     → JSONB columns for flexibility       │
│  └── settings table   → Singleton configuration             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Completed Deliverables

### 3.1 Infrastructure ✅

| Dosya | Açıklama | Durum |
|-------|----------|-------|
| `next.config.js` | Static export config (RED LINE) | ✅ |
| `tsconfig.json` | TypeScript strict mode, path aliases | ✅ |
| `tailwind.config.ts` | Custom marble color palette | ✅ |
| `package.json` | Dependencies (Next.js 14, Supabase) | ✅ |
| `.env.local.example` | Environment template | ✅ |

### 3.2 Type System ✅

| Dosya | İçerik |
|-------|--------|
| `src/types/block.ts` | Block, BlockMeta, BlockDimensions, BlockProduction, BlockCosts, BlockDerived, Settings, DashboardKPIs |
| `src/types/database.ts` | Supabase table types |

**Excel Kolon Eşleşmesi:** A-BB kolonları TypeScript interface'lerine birebir map edildi.

### 3.3 Business Logic ✅

| Dosya | Fonksiyon | Açıklama |
|-------|-----------|----------|
| `src/utils/costEngine.ts` | `computeBlockDerived()` | Tüm türetilen değerleri hesaplar |
| `src/utils/formatters.ts` | `formatCurrency()`, `formatNumber()`, `formatDate()` | UI formatting |

**Kritik Formüller (Excel-exact):**
```typescript
// Volume: (width * length * height) / 1_000_000
// Gross m²: (silim.width * silim.length * silim.qty) / 10_000
// Net m²: gross_m2 - scrap_m2
// $/m²: total_cost / gross_m2  ⚠️ ALWAYS uses gross (RED LINE)
```

### 3.4 Database Schema ✅

| Tablo | Açıklama | RLS |
|-------|----------|-----|
| `blocks` | Ana blok verileri (JSONB kolonlar) | ✅ Enabled |
| `settings` | Global parametreler (singleton) | ✅ Enabled |

**Migration:** `supabase/migrations/001_initial_schema.sql` ✅ Applied

### 3.5 UI Components ✅

| Bileşen | Dosya | Durum |
|---------|-------|-------|
| Sidebar | `src/components/layout/Sidebar.tsx` | ✅ |
| Header | `src/components/layout/Header.tsx` | ✅ |
| DashboardKPIs | `src/components/dashboard/DashboardKPIs.tsx` | ✅ |
| BlockList | `src/components/blocks/BlockList.tsx` | ✅ |

### 3.6 Data Hooks ✅

| Hook | Fonksiyonlar |
|------|--------------|
| `useSettings()` | Fetch settings, loading state |
| `useBlocks(settings)` | Fetch blocks with derived values, CRUD |
| `useDashboardKPIs(blocks)` | Aggregate calculations |

---

## 4. In Progress Items

### 4.1 Pages (60%)

| Sayfa | Route | Durum |
|-------|-------|-------|
| Dashboard | `/` | ✅ Tamamlandı |
| Block List | `/blocks` | ✅ Tamamlandı |
| New Block | `/blocks/new` | ✅ Temel form hazır |
| Edit Block | `/blocks/[id]` | ⬜ Başlanmadı |
| Settings | `/settings` | ⬜ Başlanmadı |

### 4.2 Block Form Component (50%)

**Tamamlanan Bölümler:**
- ✅ Blok Kimlik (meta fields)
- ✅ Blok Ölçüleri (dimensions)
- ✅ Silim Çıkışı (production.silim)
- ✅ Temel Maliyetler (block_price, freight, cutting)

**Eksik Bölümler:**
- ⬜ Katrak Çıkışı (production.katrak)
- ⬜ Fire & Net Verim (scrap_m2, planned_m2)
- ⬜ Yüzey İşlemleri (surface_per_m2.*)
- ⬜ Paketleme (packaging.*)
- ⬜ Computed values preview

---

## 5. Pending Items

### 5.1 Priority 1 (MVP)

| # | Öğe | Tahmini Süre |
|---|-----|--------------|
| 1 | Edit Block Page (`/blocks/[id]`) | 2 saat |
| 2 | Complete Block Form (all sections) | 3 saat |
| 3 | Form Validation (negative values, scrap <= gross) | 1 saat |
| 4 | Error Handling & Toast notifications | 1 saat |

### 5.2 Priority 2 (Post-MVP)

| # | Öğe | Tahmini Süre |
|---|-----|--------------|
| 5 | Settings Page | 2 saat |
| 6 | Stone Group Summary Report | 3 saat |
| 7 | Export to Excel/CSV | 2 saat |
| 8 | Filtering & Sorting on BlockList | 2 saat |

### 5.3 Priority 3 (Future)

| # | Öğe |
|---|-----|
| 9 | Dark mode support |
| 10 | Multi-language (TR/EN) |
| 11 | Offline support (PWA) |
| 12 | Charts & Visualizations |

---

## 6. Red Lines (Kırmızı Çizgiler) 🚫

Bu kurallar **admin onayı olmadan değiştirilemez:**

### 6.1 Deployment Constraints
```javascript
// next.config.js - DEĞIŞTIRILEMEZ
module.exports = {
  output: 'export',           // GitHub Pages için zorunlu
  images: { unoptimized: true }
}
```

### 6.2 Security Rules
- ❌ `service_role` key client-side'da KULLANILMAZ
- ❌ `getServerSideProps` veya API Routes YOK
- ✅ Sadece `anon_key` kullanılır
- ✅ Tüm tablolarda RLS aktif

### 6.3 Calculation Rules
- $/m² hesabı **HER ZAMAN** `gross_m2` (brüt) üzerinden yapılır
- Net m² = gross_m2 - scrap_m2 (fire negatif olamaz)
- Computed değerler state'e yazılmaz, selector'lardan gelir

---

## 7. Technical Debt

| # | Açıklama | Öncelik |
|---|----------|---------|
| 1 | `(supabase as any)` type cast in hooks - proper typing needed | Medium |
| 2 | No loading skeletons - add Suspense boundaries | Low |
| 3 | No error boundaries for component failures | Medium |
| 4 | Missing unit tests for costEngine | High |

---

## 8. Environment Setup

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
# OR (new naming convention)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build static export
npm run lint         # Run ESLint
```

---

## 9. File Structure

```
marble-analyst/
├── .github/
│   ├── agents/
│   │   └── architect.agent.md
│   ├── skills/
│   │   ├── project-context/
│   │   ├── enforce-red-lines/
│   │   ├── safe-config-update/
│   │   └── integrate-logic/
│   └── copilot-instructions.md
├── base/
│   ├── project_kickoff.md          # Excel field mappings
│   ├── AI-PM Agentic Kickoff Protocol.md
│   └── PROJECT_STATUS_REPORT.md    # This file
├── src/
│   ├── app/
│   │   ├── page.tsx                # Dashboard
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Tailwind imports
│   │   └── blocks/
│   │       ├── page.tsx            # Block list
│   │       └── new/page.tsx        # New block form
│   ├── components/
│   │   ├── layout/                 # Sidebar, Header
│   │   ├── dashboard/              # DashboardKPIs
│   │   └── blocks/                 # BlockList
│   ├── hooks/
│   │   └── useSupabase.ts          # Data fetching
│   ├── lib/
│   │   └── supabase.ts             # Supabase client
│   ├── types/
│   │   ├── block.ts                # Domain types
│   │   └── database.ts             # DB types
│   └── utils/
│       ├── costEngine.ts           # Calculations
│       └── formatters.ts           # Formatting
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. Next Steps (Recommended)

### Immediate (This Sprint)
1. ✅ ~Create main pages~ → DONE
2. 🔄 Complete Block Form with all cost sections
3. 🔄 Create Edit Block page (`/blocks/[id]`)
4. Add form validation rules

### Short-term (Next Sprint)
5. Add filtering/sorting to BlockList
6. Create Settings page
7. Implement Stone Group Summary report
8. Add unit tests for costEngine

### Medium-term
9. GitHub Actions for CI/CD to GitHub Pages
10. Add export functionality (Excel/CSV)

---

## 11. Risk Assessment

| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Supabase RLS misconfiguration | Medium | High | Review policies before production |
| Static export limitations | Low | Medium | Already documented in Red Lines |
| JSONB query performance | Low | Low | Add indexes if needed |
| Browser compatibility | Low | Low | Using standard React/Next.js |

---

## 12. Contact & References

- **Project Kickoff Doc:** [base/project_kickoff.md](./project_kickoff.md)
- **AI Agent Instructions:** [.github/copilot-instructions.md](../.github/copilot-instructions.md)
- **Red Lines Skill:** [.github/skills/enforce-red-lines/](../.github/skills/enforce-red-lines/)

---

*Bu rapor AI-PM tarafından otomatik olarak güncellenebilir. Son güncelleme: 4 Şubat 2026*
