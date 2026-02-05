'use client';

/**
 * Supabase Data Hooks
 * Custom hooks for fetching and mutating block data.
 * All data is scoped to the authenticated user via RLS policies.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts';
import type { Block, Settings, BlockWithDerived } from '@/types/block';
import { computeBlockDerived } from '@/utils/costEngine';

const DEFAULT_SETTINGS: Settings = {
  density_ton_per_m3: 2.5,
  target_net_m2_per_m3: null,
  currency: 'USD',
};

// =============================================================================
// useSettings Hook
// =============================================================================

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      
      if (data) {
        setSettings({
          density_ton_per_m3: data.density_ton_per_m3,
          target_net_m2_per_m3: data.target_net_m2_per_m3,
          currency: data.currency,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: settingsRow } = await (supabase as any)
        .from('settings')
        .select('id')
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('settings')
        .update(updates)
        .eq('id', settingsRow?.id);

      if (updateError) throw updateError;
      
      setSettings(prev => ({ ...prev, ...updates }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
}

// =============================================================================
// useBlocks Hook
// =============================================================================

export function useBlocks(settings: Settings) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('blocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setBlocks((data as Block[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBlock = useCallback(async (block: Omit<Block, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase as any)
        .from('blocks')
        .insert(block)
        .select()
        .single();

      if (insertError) throw insertError;
      
      setBlocks(prev => [data as Block, ...prev]);
      return data as Block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create block');
      throw err;
    }
  }, []);

  const updateBlock = useCallback(async (id: string, updates: Partial<Block>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: updateError } = await (supabase as any)
        .from('blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setBlocks(prev => prev.map(b => b.id === id ? (data as Block) : b));
      return data as Block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block');
      throw err;
    }
  }, []);

  const deleteBlock = useCallback(async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('blocks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete block');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Compute derived values for all blocks
  const blocksWithDerived: BlockWithDerived[] = blocks.map(block => ({
    ...block,
    derived: computeBlockDerived(block, settings),
  }));

  return {
    blocks: blocksWithDerived,
    rawBlocks: blocks,
    loading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    refetch: fetchBlocks,
  };
}

// =============================================================================
// useDashboardKPIs Hook
// =============================================================================

export function useDashboardKPIs(blocks: BlockWithDerived[]) {
  const kpis = {
    total_m3: blocks.reduce((sum, b) => sum + (b.derived.volume_m3 || 0), 0),
    total_ton: blocks.reduce((sum, b) => sum + (b.derived.weight_ton || 0), 0),
    total_gross_m2: blocks.reduce((sum, b) => sum + (b.derived.gross_m2 || 0), 0),
    total_scrap_m2: blocks.reduce((sum, b) => sum + (b.production.scrap_m2 || 0), 0),
    total_net_m2: blocks.reduce((sum, b) => sum + (b.derived.net_m2 || 0), 0),
    grand_total_cost: blocks.reduce((sum, b) => sum + (b.derived.total_cost || 0), 0),
    total_block_price: blocks.reduce((sum, b) => sum + (b.derived.block_price_total || 0), 0),
    total_freight: blocks.reduce((sum, b) => sum + (b.derived.freight_total || 0), 0),
    total_material: blocks.reduce((sum, b) => sum + (b.derived.material_total || 0), 0),
    total_cutting: blocks.reduce((sum, b) => sum + (b.derived.cutting_total || 0), 0),
    total_surface: blocks.reduce((sum, b) => sum + (b.derived.surface_total || 0), 0),
    total_packaging: blocks.reduce((sum, b) => sum + (b.derived.packaging_total || 0), 0),
    block_count: blocks.length,
  };

  const computed = {
    overall_scrap_pct: kpis.total_gross_m2 > 0 ? kpis.total_scrap_m2 / kpis.total_gross_m2 : null,
    overall_net_m2_per_m3: kpis.total_m3 > 0 ? kpis.total_net_m2 / kpis.total_m3 : null,
    avg_usd_per_m2_gross: kpis.total_gross_m2 > 0 ? kpis.grand_total_cost / kpis.total_gross_m2 : null,
    avg_usd_per_ton: kpis.total_ton > 0 ? kpis.grand_total_cost / kpis.total_ton : null,
    net_usd_per_m2: kpis.total_net_m2 > 0 ? kpis.grand_total_cost / kpis.total_net_m2 : null,
  };

  const leadTimes = blocks
    .map(b => b.derived.lead_time_days)
    .filter((d): d is number => d !== null && d > 0);
  
  const avg_lead_time_days = leadTimes.length > 0
    ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
    : null;

  return { ...kpis, ...computed, avg_lead_time_days };
}
