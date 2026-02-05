/**
 * Block Tracking System - TypeScript Interfaces
 * 
 * Based on: base/project_kickoff.md (Excel BlokTakip_Data schema)
 * 
 * Structure:
 * - Input fields: User-entered values stored in database
 * - Derived fields: Computed client-side via computeBlockDerived()
 */

// =============================================================================
// ENUMS
// =============================================================================

/** Block status - Excel column AZ */
export type BlockStatus = 'stokta' | 'islemde' | 'satildi' | 'iptal';

/** Stone source type - Excel column A */
export type SourceType = 'ocak' | 'ithalat' | 'fason' | 'diger';

// =============================================================================
// SETTINGS (Global Parameters)
// =============================================================================

/** Global settings from Excel Özet sheet */
export interface Settings {
  /** Density (ton/m³) - Özet!H11, default 2.5 */
  density_ton_per_m3: number;
  
  /** Target net m²/m³ - Özet!H12, optional */
  target_net_m2_per_m3: number | null;
  
  /** Currency for all costs */
  currency: 'USD' | 'EUR' | 'TRY';
}

// =============================================================================
// BLOCK - INPUT FIELDS (Stored in Database)
// =============================================================================

/** Block identity and status - Excel columns A-E, K-L, AY-BA */
export interface BlockMeta {
  /** Kaynak (Source) - Excel A */
  source: string;
  
  /** Geliş Tarih (Arrival date) - Excel B */
  arrival_date: string; // ISO date: YYYY-MM-DD
  
  /** Alınan firma (Supplier) - Excel C */
  supplier: string;
  
  /** Taşın adı (Stone name) - Excel D */
  stone_name: string;
  
  /** Fason yeri kodu (Subcontractor code) - Excel E */
  subcontractor_code: string | null;
  
  /** Not (Note) - Excel AY */
  note: string | null;
  
  /** Durum (Status) - Excel AZ */
  status: BlockStatus;
  
  /** Çıkış Tarih (Exit date) - Excel BA */
  exit_date: string | null; // ISO date: YYYY-MM-DD
}

/** Process information - Excel columns K-L */
export interface BlockProcess {
  /** İşlem (Operation type) - Excel K */
  operation: string | null;
  
  /** İşlem tarih (Operation date) - Excel L */
  operation_date: string | null; // ISO date: YYYY-MM-DD
}

/** Raw block dimensions in cm - Excel columns F-H */
export interface BlockDimensions {
  /** En (Width) - Excel F */
  width_cm: number;
  
  /** Boy (Length) - Excel G */
  length_cm: number;
  
  /** Yük (Height) - Excel H */
  height_cm: number;
}

/** Slab output dimensions - used for both Katrak and Silim */
export interface SlabOutput {
  /** Kalınlık (Thickness) in cm */
  thickness_cm: number;
  
  /** En (Width) in cm */
  width_cm: number;
  
  /** Boy (Length) in cm */
  length_cm: number;
  
  /** Adet (Quantity) - integer */
  qty: number;
}

/** Production outputs - Excel columns M-U, BC, BF */
export interface BlockProduction {
  /** Katrak çıkışı (Gang saw output) - Excel M-P */
  katrak: SlabOutput;
  
  /** Silim çıkışı (Slab output) - Excel R-U */
  silim: SlabOutput;
  
  /** Fire m² (Scrap area) - Excel BC */
  scrap_m2: number;
  
  /** Planlanan m² (Planned area) - Excel BF */
  planned_m2: number;
}

/** Surface treatment costs per m² - Excel columns AJ-AO */
export interface SurfaceCostsPerM2 {
  /** Ham (Raw) - Excel AJ */
  raw: number;
  
  /** Cilalı (Polished) - Excel AK */
  polished: number;
  
  /** Honlu (Honed) - Excel AL */
  honed: number;
  
  /** File (Mesh) - Excel AM */
  mesh: number;
  
  /** Fırçalı (Brushed) - Excel AN */
  brushed: number;
  
  /** Dolgulu (Filled) - Excel AO */
  filled: number;
}

/** Packaging costs - Excel columns AQ-AS */
export interface PackagingCosts {
  /** Bandıl (Bundle) - Excel AQ */
  bundle: number;
  
  /** Kasa (Crate) - Excel AR */
  crate: number;
  
  /** Palet (Pallet) - Excel AS */
  pallet: number;
}

/** All cost inputs - Excel columns X-AS, AU */
export interface BlockCosts {
  // Hammadde (Block price)
  /** Blok fiyat per m³ - Excel X */
  block_price_per_m3: number;
  /** Blok fiyat per ton - Excel Y */
  block_price_per_ton: number;
  
  // Lojistik (Freight)
  /** Nakliye per m³ - Excel AA */
  freight_per_m3: number;
  /** Nakliye per ton - Excel AB */
  freight_per_ton: number;
  
  // Malzeme (Material)
  /** Malzeme per m³ - Excel AD */
  material_per_m3: number;
  /** Malzeme per ton - Excel AE */
  material_per_ton: number;
  
  // Kesim (Cutting)
  /** Kesim per ton - Excel AG */
  cutting_per_ton: number;
  /** Köprü kesim (Bridge saw cost) - Excel AH */
  bridge_cost: number;
  
  // Yüzey (Surface treatments)
  /** Surface costs per m² - Excel AJ-AO */
  surface_per_m2: SurfaceCostsPerM2;
  
  // Paketleme (Packaging)
  /** Packaging costs - Excel AQ-AS */
  packaging: PackagingCosts;
  
  /** Ürün (Product name) - Excel AU */
  product: string | null;
}

// =============================================================================
// BLOCK - COMPLETE INPUT STRUCTURE
// =============================================================================

/** Complete block data as stored in database (inputs only) */
export interface Block {
  /** UUID primary key */
  id: string;
  
  /** Block identity and status */
  meta: BlockMeta;
  
  /** Process information */
  process: BlockProcess;
  
  /** Raw block dimensions */
  dimensions: BlockDimensions;
  
  /** Production outputs */
  production: BlockProduction;
  
  /** Cost inputs */
  costs: BlockCosts;
  
  /** Record timestamps */
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// DERIVED (COMPUTED) VALUES - Never stored, always calculated
// =============================================================================

/** 
 * All computed/derived values for a block
 * Generated by computeBlockDerived(block, settings) function
 */
export interface BlockDerived {
  // From dimensions
  /** m³ = (width * length * height) / 1_000_000 - Excel I */
  volume_m3: number | null;
  /** Ton = volume_m3 * density - Excel J */
  weight_ton: number | null;
  
  // From production - Katrak
  /** Katrak m² = (width * length * qty) / 10_000 - Excel Q */
  katrak_m2: number | null;
  
  // From production - Silim (Gross)
  /** Silim m² (Brüt) = (width * length * qty) / 10_000 - Excel V */
  gross_m2: number | null;
  /** m²/m³ = gross_m2 / volume_m3 - Excel W */
  gross_m2_per_m3: number | null;
  
  // Fire & Net yield
  /** Net m² = gross_m2 - scrap_m2 - Excel BD */
  net_m2: number | null;
  /** Net m²/m³ = net_m2 / volume_m3 - Excel BE */
  net_m2_per_m3: number | null;
  /** Sapma m² = net_m2 - planned_m2 - Excel BG */
  variance_m2: number | null;
  /** Fire % = scrap_m2 / gross_m2 - Excel BH */
  scrap_pct: number | null;
  /** Yield delta vs target - Excel BI */
  yield_delta_vs_target: number | null;
  
  // Lead time
  /** Lead time (days) = exit_date - arrival_date - Excel BB */
  lead_time_days: number | null;
  
  // Cost subtotals (6 categories)
  /** Blok fiyat toplam - Excel Z */
  block_price_total: number | null;
  /** Nakliye toplam - Excel AC */
  freight_total: number | null;
  /** Malzeme toplam - Excel AF */
  material_total: number | null;
  /** Kesim toplam - Excel AI */
  cutting_total: number | null;
  /** Yüzey toplam = SUM(surface_per_m2) * gross_m2 - Excel AP */
  surface_total: number | null;
  /** Paket toplam = bundle + crate + pallet - Excel AT */
  packaging_total: number | null;
  
  // Grand total and unit costs
  /** Toplam maliyet = sum of all subtotals - Excel AV */
  total_cost: number | null;
  /** $/m² = total_cost / gross_m2 (ALWAYS gross, not net) - Excel AW */
  usd_per_m2: number | null;
  /** $/ton = total_cost / ton - Excel AX */
  usd_per_ton: number | null;
}

// =============================================================================
// COMBINED BLOCK WITH DERIVED VALUES (for UI display)
// =============================================================================

/** Block with computed derived values for UI rendering */
export interface BlockWithDerived extends Block {
  derived: BlockDerived;
}

// =============================================================================
// DASHBOARD AGGREGATIONS
// =============================================================================

/** Global KPIs aggregated across all blocks */
export interface DashboardKPIs {
  /** SUM(volume_m3) */
  total_m3: number;
  /** SUM(weight_ton) */
  total_ton: number;
  /** SUM(gross_m2) - Total silim m² */
  total_gross_m2: number;
  /** SUM(scrap_m2) */
  total_scrap_m2: number;
  /** SUM(net_m2) */
  total_net_m2: number;
  
  /** total_scrap_m2 / total_gross_m2 */
  overall_scrap_pct: number | null;
  /** total_net_m2 / total_m3 */
  overall_net_m2_per_m3: number | null;
  
  /** SUM(total_cost) */
  grand_total_cost: number;
  /** grand_total_cost / total_gross_m2 */
  avg_usd_per_m2_gross: number | null;
  /** grand_total_cost / total_ton */
  avg_usd_per_ton: number | null;
  /** grand_total_cost / total_net_m2 */
  net_usd_per_m2: number | null;
  
  /** AVERAGE(lead_time_days where > 0) */
  avg_lead_time_days: number | null;
  
  // Cost breakdown totals
  total_block_price: number;
  total_freight: number;
  total_material: number;
  total_cutting: number;
  total_surface: number;
  total_packaging: number;
}

/** Stone-grouped summary (Taşa göre özet) */
export interface StoneGroupSummary {
  stone_name: string;
  m3_sum: number;
  ton_sum: number;
  gross_m2_sum: number;
  cost_sum: number;
  /** cost_sum / gross_m2_sum */
  usd_per_m2: number | null;
  block_count: number;
}

// =============================================================================
// APPLICATION STATE
// =============================================================================

/** Root application state shape */
export interface AppState {
  settings: Settings;
  blocks: Block[];
}
