/**
 * Supabase Client Configuration
 * 
 * ⚠️ RED LINE: This client uses ONLY the publishable/anon key (public).
 * NEVER use service_role key in client-side code.
 * All data access is protected by Row Level Security (RLS) on Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Lazy initialization to avoid build-time errors in CI/CD
// Environment variables are only required at runtime (client-side)
let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // During build time, return a placeholder that will be replaced at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // In browser, this is a real error
    if (typeof window !== 'undefined') {
      console.error(
        'Missing Supabase environment variables. ' +
        'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }
    // During SSG/build, create a dummy client that won't be used
    // The actual client will be created at runtime in the browser
    return createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key',
      { auth: { persistSession: false } }
    );
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

// Export a getter that lazily initializes the client
export const supabase = getSupabaseClient();
