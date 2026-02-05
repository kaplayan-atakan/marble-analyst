/**
 * Block Derived Values Calculator
 * 
 * This is the SINGLE SOURCE OF TRUTH for all computed values.
 * All formulas match Excel BlokTakip_Data exactly.
 * 
 * ⚠️ RED LINE: $/m² calculation ALWAYS uses gross_m2, not net_m2
 */

import type { Block, BlockDerived, Settings } from '@/types/block';

/**
 * Safely calculate a value, returning null if any input is null/undefined/0
 * Matches Excel behavior where empty cells produce empty results
 */
function safeCalc(
  inputs: (number | null | undefined)[],
  calc: () => number
): number | null {
  if (inputs.some(v => v === null || v === undefined || v === 0)) {
    return null;
  }
  const result = calc();
  return isFinite(result) ? result : null;
}

/**
 * Calculate days between two ISO date strings
 */
function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null; // Invalid if negative
}

/**
 * Compute cost subtotal with per_ton priority over per_m3
 * Excel logic: if per_ton exists, use it; else use per_m3
 */
function computeCostSubtotal(
  perTon: number,
  perM3: number,
  ton: number | null,
  m3: number | null
): number | null {
  if (perTon > 0 && ton) {
    return perTon * ton;
  }
  if (perM3 > 0 && m3) {
    return perM3 * m3;
  }
  return null;
}

/**
 * Compute all derived values for a block
 * This function is pure - no side effects, always returns the same output for same input
 */
export function computeBlockDerived(block: Block, settings: Settings): BlockDerived {
  const { dimensions, production, costs, meta } = block;
  const { density_ton_per_m3, target_net_m2_per_m3 } = settings;
  
  // =========================================================================
  // Volume & Weight (Excel I, J)
  // =========================================================================
  
  // Volume: (width * length * height) / 1_000_000
  const volume_m3 = safeCalc(
    [dimensions.width_cm, dimensions.length_cm, dimensions.height_cm],
    () => (dimensions.width_cm * dimensions.length_cm * dimensions.height_cm) / 1_000_000
  );
  
  // Weight: volume_m3 * density
  const weight_ton = safeCalc(
    [volume_m3, density_ton_per_m3],
    () => volume_m3! * density_ton_per_m3
  );
  
  // =========================================================================
  // Production - Katrak (Excel Q)
  // =========================================================================
  
  const { katrak, silim } = production;
  
  // Katrak m²: (width * length * qty) / 10_000
  const katrak_m2 = safeCalc(
    [katrak.width_cm, katrak.length_cm, katrak.qty],
    () => (katrak.width_cm * katrak.length_cm * katrak.qty) / 10_000
  );
  
  // =========================================================================
  // Production - Silim / Gross (Excel V, W)
  // =========================================================================
  
  // Gross m² (Silim m²): (width * length * qty) / 10_000
  const gross_m2 = safeCalc(
    [silim.width_cm, silim.length_cm, silim.qty],
    () => (silim.width_cm * silim.length_cm * silim.qty) / 10_000
  );
  
  // m²/m³: gross_m2 / volume_m3
  const gross_m2_per_m3 = safeCalc(
    [gross_m2, volume_m3],
    () => gross_m2! / volume_m3!
  );
  
  // =========================================================================
  // Fire & Net Yield (Excel BD-BI)
  // =========================================================================
  
  // Net m²: gross_m2 - scrap_m2
  const net_m2 = gross_m2 !== null 
    ? gross_m2 - (production.scrap_m2 || 0)
    : null;
  
  // Net m²/m³
  const net_m2_per_m3 = safeCalc(
    [net_m2, volume_m3],
    () => net_m2! / volume_m3!
  );
  
  // Variance: net_m2 - planned_m2
  const variance_m2 = net_m2 !== null && production.planned_m2 > 0
    ? net_m2 - production.planned_m2
    : null;
  
  // Scrap %: scrap_m2 / gross_m2
  const scrap_pct = safeCalc(
    [production.scrap_m2, gross_m2],
    () => production.scrap_m2 / gross_m2!
  );
  
  // Yield delta vs target
  const yield_delta_vs_target = net_m2_per_m3 !== null && target_net_m2_per_m3 !== null
    ? net_m2_per_m3 - target_net_m2_per_m3
    : null;
  
  // =========================================================================
  // Lead Time (Excel BB)
  // =========================================================================
  
  const lead_time_days = daysBetween(meta.arrival_date, meta.exit_date);
  
  // =========================================================================
  // Cost Subtotals (Excel Z, AC, AF, AI, AP, AT)
  // =========================================================================
  
  // Block price total
  const block_price_total = computeCostSubtotal(
    costs.block_price_per_ton,
    costs.block_price_per_m3,
    weight_ton,
    volume_m3
  );
  
  // Freight total
  const freight_total = computeCostSubtotal(
    costs.freight_per_ton,
    costs.freight_per_m3,
    weight_ton,
    volume_m3
  );
  
  // Material total
  const material_total = computeCostSubtotal(
    costs.material_per_ton,
    costs.material_per_m3,
    weight_ton,
    volume_m3
  );
  
  // Cutting total: (per_ton * ton) + bridge_cost
  const cutting_base = costs.cutting_per_ton > 0 && weight_ton
    ? costs.cutting_per_ton * weight_ton
    : 0;
  const cutting_total = cutting_base > 0 || costs.bridge_cost > 0
    ? cutting_base + (costs.bridge_cost || 0)
    : null;
  
  // Surface total: SUM(surface_per_m2) * gross_m2
  const surfaceSum = Object.values(costs.surface_per_m2).reduce((a, b) => a + (b || 0), 0);
  const surface_total = surfaceSum > 0 && gross_m2
    ? surfaceSum * gross_m2
    : null;
  
  // Packaging total: bundle + crate + pallet
  const packagingSum = 
    (costs.packaging.bundle || 0) + 
    (costs.packaging.crate || 0) + 
    (costs.packaging.pallet || 0);
  const packaging_total = packagingSum > 0 ? packagingSum : null;
  
  // =========================================================================
  // Grand Total & Unit Costs (Excel AV, AW, AX)
  // =========================================================================
  
  // Total cost: sum of all subtotals
  const subtotals = [
    block_price_total,
    freight_total,
    material_total,
    cutting_total,
    surface_total,
    packaging_total
  ];
  
  const hasAnyCost = subtotals.some(v => v !== null && v > 0);
  const total_cost = hasAnyCost
    ? subtotals.reduce<number>((sum, v) => sum + (v || 0), 0)
    : null;
  
  // ⚠️ RED LINE: $/m² uses GROSS m², not net m²
  const usd_per_m2 = safeCalc(
    [total_cost, gross_m2],
    () => total_cost! / gross_m2!
  );
  
  // $/ton
  const usd_per_ton = safeCalc(
    [total_cost, weight_ton],
    () => total_cost! / weight_ton!
  );
  
  // =========================================================================
  // Return all derived values
  // =========================================================================
  
  return {
    volume_m3,
    weight_ton,
    katrak_m2,
    gross_m2,
    gross_m2_per_m3,
    net_m2,
    net_m2_per_m3,
    variance_m2,
    scrap_pct,
    yield_delta_vs_target,
    lead_time_days,
    block_price_total,
    freight_total,
    material_total,
    cutting_total,
    surface_total,
    packaging_total,
    total_cost,
    usd_per_m2,
    usd_per_ton,
  };
}
