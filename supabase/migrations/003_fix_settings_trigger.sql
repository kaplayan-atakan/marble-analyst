-- ============================================================================
-- Marble Analyst - Hotfix: Settings Trigger Fix
-- Fixes: "Database error saving new user" during Google OAuth signup
-- ============================================================================

-- ⚠️ This hotfix addresses two issues:
-- 1. handle_new_user function needs explicit search_path for SECURITY DEFINER
-- 2. Add exception handling to prevent user creation from failing

-- ============================================================================
-- STEP 1: Ensure settings.id has proper default (safety check)
-- ============================================================================

-- This should already exist but we're ensuring it's set
ALTER TABLE settings 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- STEP 2: Update handle_new_user function with proper error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Attempt to create default settings for new user
  -- If this fails, we catch the exception and allow user creation to proceed
  -- The frontend can create settings later if needed
  BEGIN
    INSERT INTO public.settings (user_id, density_ton_per_m3, target_net_m2_per_m3, currency)
    VALUES (NEW.id, 2.5, NULL, 'USD')
    ON CONFLICT DO NOTHING;  -- Prevent duplicate key errors
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'handle_new_user: Failed to create settings for user %. Error: %', 
        NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: Recreate trigger to ensure it uses the updated function
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================

-- Ensure the function can insert into settings table
GRANT INSERT ON public.settings TO authenticated;
GRANT INSERT ON public.settings TO service_role;

-- ============================================================================
-- VERIFICATION QUERY (Run manually to test)
-- ============================================================================
-- 
-- After running this migration, you can verify by:
-- 1. Check function definition:
--    SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
-- 
-- 2. Check trigger exists:
--    SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- 3. Test by creating a new user via Google OAuth
--
-- ============================================================================
