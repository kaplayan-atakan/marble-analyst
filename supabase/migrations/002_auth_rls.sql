-- ============================================================================
-- Marble Analyst - Multi-Tenant Authentication Migration
-- Adds user_id columns and proper RLS policies for data isolation
-- ============================================================================

-- ⚠️ WARNING: Run this migration AFTER enabling Google OAuth in Supabase Dashboard
-- ⚠️ This migration will restrict all data to authenticated users

-- ============================================================================
-- STEP 1: Add user_id columns
-- ============================================================================

-- Add user_id to blocks table
ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set default value for new rows (auth.uid() returns current user's ID)
ALTER TABLE blocks 
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE settings 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============================================================================
-- STEP 2: Create index for user_id queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- ============================================================================
-- STEP 3: Drop existing permissive policies
-- ============================================================================

-- Drop blocks policies
DROP POLICY IF EXISTS "Allow read access for all users" ON blocks;
DROP POLICY IF EXISTS "Allow insert for all users" ON blocks;
DROP POLICY IF EXISTS "Allow update for all users" ON blocks;
DROP POLICY IF EXISTS "Allow delete for all users" ON blocks;

-- Drop settings policies
DROP POLICY IF EXISTS "Allow read access for settings" ON settings;
DROP POLICY IF EXISTS "Allow update for settings" ON settings;
DROP POLICY IF EXISTS "Allow insert for settings" ON settings;

-- ============================================================================
-- STEP 4: Create new user-scoped RLS policies
-- ============================================================================

-- BLOCKS TABLE POLICIES
-- ----------------------

-- Users can only SELECT their own blocks
CREATE POLICY "Users can view own blocks" 
ON blocks FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can INSERT blocks (user_id is auto-set via default)
CREATE POLICY "Users can create own blocks" 
ON blocks FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE only their own blocks
CREATE POLICY "Users can update own blocks" 
ON blocks FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can DELETE only their own blocks
CREATE POLICY "Users can delete own blocks" 
ON blocks FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);


-- SETTINGS TABLE POLICIES
-- -----------------------

-- Users can only SELECT their own settings
CREATE POLICY "Users can view own settings" 
ON settings FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can INSERT their own settings
CREATE POLICY "Users can create own settings" 
ON settings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE only their own settings
CREATE POLICY "Users can update own settings" 
ON settings FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Create function to auto-create settings for new users
-- ============================================================================

-- This function creates default settings when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id, density_ton_per_m3, target_net_m2_per_m3, currency)
  VALUES (NEW.id, 2.5, NULL, 'USD');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MANUAL STEPS REQUIRED (Supabase Dashboard)
-- ============================================================================
-- 
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Enable "Google" provider
-- 3. Add your Google OAuth credentials:
--    - Client ID: (from Google Cloud Console)
--    - Client Secret: (from Google Cloud Console)
-- 4. In Google Cloud Console:
--    - Create OAuth 2.0 Client ID
--    - Add authorized redirect URI: https://<your-project>.supabase.co/auth/v1/callback
-- 5. Test the login flow
--
-- ============================================================================
