/**
 * Supabase Client Configuration
 * 
 * ⚠️ RED LINE: This client uses ONLY the publishable/anon key (public).
 * NEVER use service_role key in client-side code.
 * All data access is protected by Row Level Security (RLS) on Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both old (ANON_KEY) and new (PUBLISHABLE_DEFAULT_KEY) naming
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) in .env.local'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
