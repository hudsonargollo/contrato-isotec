-- Migration: Fix infinite recursion in profiles RLS policy
-- Description: Remove recursive policy that causes infinite loop
-- Date: 2024-02-04

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add a separate policy for service role (bypasses RLS anyway)
-- This allows the API to query profiles when needed
CREATE POLICY "Service role can view all profiles"
  ON public.profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Comment for documentation
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
  'Users can only view their own profile to prevent infinite recursion';
