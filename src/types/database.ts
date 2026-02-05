/**
 * Supabase Database Type Definitions
 * 
 * This file provides type safety for Supabase queries.
 * Update this when the database schema changes.
 */

export interface Database {
  public: {
    Tables: {
      blocks: {
        Row: {
          id: string;
          meta: {
            source: string;
            arrival_date: string;
            supplier: string;
            stone_name: string;
            subcontractor_code: string | null;
            note: string | null;
            status: 'stokta' | 'islemde' | 'satildi' | 'iptal';
            exit_date: string | null;
          };
          process: {
            operation: string | null;
            operation_date: string | null;
          };
          dimensions: {
            width_cm: number;
            length_cm: number;
            height_cm: number;
          };
          production: {
            katrak: {
              thickness_cm: number;
              width_cm: number;
              length_cm: number;
              qty: number;
            };
            silim: {
              thickness_cm: number;
              width_cm: number;
              length_cm: number;
              qty: number;
            };
            scrap_m2: number;
            planned_m2: number;
          };
          costs: {
            block_price_per_m3: number;
            block_price_per_ton: number;
            freight_per_m3: number;
            freight_per_ton: number;
            material_per_m3: number;
            material_per_ton: number;
            cutting_per_ton: number;
            bridge_cost: number;
            surface_per_m2: {
              raw: number;
              polished: number;
              honed: number;
              mesh: number;
              brushed: number;
              filled: number;
            };
            packaging: {
              bundle: number;
              crate: number;
              pallet: number;
            };
            product: string | null;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blocks']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['blocks']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          density_ton_per_m3: number;
          target_net_m2_per_m3: number | null;
          currency: 'USD' | 'EUR' | 'TRY';
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      block_status: 'stokta' | 'islemde' | 'satildi' | 'iptal';
      currency: 'USD' | 'EUR' | 'TRY';
    };
  };
}
