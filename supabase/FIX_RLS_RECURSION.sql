-- ============================================================================
-- FIX: Infinite Recursion in Profiles RLS Policy
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to fix the infinite recursion error
-- Date: 2024-02-04
-- ============================================================================

-- Step 1: Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Step 2: Create a simpler policy that doesn't cause recursion
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Step 3: Add a policy for service role (for API access)
CREATE POLICY "Service role can view all profiles"
  ON public.profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Step 4: Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- Expected Result:
-- You should see 3 policies:
-- 1. "Service role can view all profiles" - FOR SELECT to service_role
-- 2. "Super admins can insert profiles" - FOR INSERT to authenticated
-- 3. "Users can update own profile" - FOR UPDATE to authenticated
-- 4. "Users can view own profile" - FOR SELECT to authenticated
-- ============================================================================
