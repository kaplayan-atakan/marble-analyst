-- ============================================================================
-- Marble Analyst - Supabase Database Schema
-- Based on: base/project_kickoff.md (Excel BlokTakip_Data)
-- ============================================================================

-- ⚠️ RED LINE: All tables MUST have RLS enabled

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE block_status AS ENUM ('stokta', 'islemde', 'satildi', 'iptal');
CREATE TYPE currency_type AS ENUM ('USD', 'EUR', 'TRY');

-- ============================================================================
-- SETTINGS TABLE (Global Parameters)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  density_ton_per_m3 DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  target_net_m2_per_m3 DECIMAL(6,2),
  currency currency_type NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one settings row (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS settings_singleton ON settings ((true));

-- ============================================================================
-- BLOCKS TABLE (Main Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Meta (Block Identity) - Excel A-E, AY-BA
  meta JSONB NOT NULL DEFAULT '{
    "source": "",
    "arrival_date": null,
    "supplier": "",
    "stone_name": "",
    "subcontractor_code": null,
    "note": null,
    "status": "stokta",
    "exit_date": null
  }'::jsonb,
  
  -- Process - Excel K-L
  process JSONB NOT NULL DEFAULT '{
    "operation": null,
    "operation_date": null
  }'::jsonb,
  
  -- Dimensions - Excel F-H
  dimensions JSONB NOT NULL DEFAULT '{
    "width_cm": 0,
    "length_cm": 0,
    "height_cm": 0
  }'::jsonb,
  
  -- Production - Excel M-U, BC, BF
  production JSONB NOT NULL DEFAULT '{
    "katrak": {"thickness_cm": 0, "width_cm": 0, "length_cm": 0, "qty": 0},
    "silim": {"thickness_cm": 0, "width_cm": 0, "length_cm": 0, "qty": 0},
    "scrap_m2": 0,
    "planned_m2": 0
  }'::jsonb,
  
  -- Costs - Excel X-AS, AU
  costs JSONB NOT NULL DEFAULT '{
    "block_price_per_m3": 0,
    "block_price_per_ton": 0,
    "freight_per_m3": 0,
    "freight_per_ton": 0,
    "material_per_m3": 0,
    "material_per_ton": 0,
    "cutting_per_ton": 0,
    "bridge_cost": 0,
    "surface_per_m2": {"raw": 0, "polished": 0, "honed": 0, "mesh": 0, "brushed": 0, "filled": 0},
    "packaging": {"bundle": 0, "crate": 0, "pallet": 0},
    "product": null
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for common queries
-- ============================================================================

-- Search by stone name (GroupBy aggregations)
CREATE INDEX IF NOT EXISTS idx_blocks_stone_name 
  ON blocks ((meta->>'stone_name'));

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_blocks_status 
  ON blocks ((meta->>'status'));

-- Filter by arrival date range
CREATE INDEX IF NOT EXISTS idx_blocks_arrival_date 
  ON blocks ((meta->>'arrival_date'));

-- Filter by supplier
CREATE INDEX IF NOT EXISTS idx_blocks_supplier 
  ON blocks ((meta->>'supplier'));

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ⚠️ RED LINE: RLS MUST be enabled on all tables
-- ============================================================================

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- For POC: Allow all operations with anon key
-- TODO: Add proper user-based policies for production

-- Blocks policies
CREATE POLICY "Allow read access for all users" ON blocks
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all users" ON blocks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all users" ON blocks
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for all users" ON blocks
  FOR DELETE USING (true);

-- Settings policies
CREATE POLICY "Allow read access for settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Allow update for settings" ON settings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert for settings" ON settings
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default settings if not exists
INSERT INTO settings (density_ton_per_m3, target_net_m2_per_m3, currency)
SELECT 2.5, NULL, 'USD'
WHERE NOT EXISTS (SELECT 1 FROM settings);
