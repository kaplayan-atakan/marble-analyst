# Copilot Instructions – Marble Analyst (Blok Takip)

## Project Overview
This project converts an Excel-based marble/stone block tracking system into a modern SPA using **Next.js** (static export) and **Supabase**. Deployed on **GitHub Pages**.

## Critical Constraints (Red Lines)
These rules are non-negotiable without explicit admin approval:

### GitHub Pages Deployment
- `next.config.js` MUST have `output: 'export'` – no SSR/ISR
- `next/image` requires `unoptimized: true`
- NO `getServerSideProps` or API Routes – all logic is client-side or Supabase Edge Functions

### Supabase Security
- **NEVER** use `service_role` key client-side – only `anon_key`
- All tables MUST have Row Level Security (RLS) enabled

## Architecture Patterns

### Data Flow
1. User inputs block dimensions and costs → 2. Client-side calculations (hooks/utils) → 3. Supabase persistence → 4. Dashboard aggregations

### State & Computed Values
- **Inputs** and **computed/derived values** are separate concerns
- Use a single `computeBlockDerived(block, settings)` function for all calculations
- Never store computed values in state – use memoized selectors/computed getters

### Key Calculations (Excel-exact)
```typescript
// Volume: (width * length * height) / 1_000_000
// Gross m²: (silim.width * silim.length * silim.qty) / 10_000
// Net m²: gross_m2 - scrap_m2
// Total Cost: block + freight + material + cutting + surface + packaging
// $/m²: total_cost / gross_m2  (ALWAYS uses gross, not net)
```

## Code Organization

### Calculation Logic Placement
- **DO:** Place in `hooks/useBlockCalculations.ts` or `utils/costEngine.ts`
- **DON'T:** Embed calculations in UI components

### TypeScript Interfaces
Follow the data schema in [base/project_kickoff.md](../base/project_kickoff.md):
- `meta.*` – block identity fields
- `dimensions.*` – raw measurements
- `production.katrak/silim.*` – production outputs
- `costs.*` – cost inputs by category
- `derived.*` – computed values (not stored)

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
All client-accessible vars must use `NEXT_PUBLIC_` prefix.

## Cost Categories & Subtotals
The system tracks 6 cost categories, each with a subtotal:
1. **Hammadde (Block)** – `block_price_total`
2. **Lojistik (Freight)** – `freight_total`
3. **Malzeme (Material)** – `material_total`
4. **Kesim (Cutting)** – `cutting_total`
5. **Yüzey (Surface)** – `surface_total`
6. **Paketleme (Packaging)** – `packaging_total`

Grand Total = sum of all subtotals.

## Validation Rules
- No negative values
- `scrap_m2 <= gross_m2` (prevents negative net m²)
- `exit_date >= arrival_date` (valid lead time)
- If any multiplicand is empty, result should be `null`, not 0

## Agent Workflow
Before making changes:
1. **Analyze** – Match request to `project-context` skill
2. **Check** – Verify against `enforce-red-lines` constraints
3. **Plan** – Use `integrate-logic` or `safe-config-update` templates
4. **Implement** – Write code following these patterns

## Reference Documents
- [base/project_kickoff.md](../base/project_kickoff.md) – Complete field mappings, Excel column references, and formulas
- [.github/skills/](./skills/) – Agent skills for context, rules, and integration patterns
