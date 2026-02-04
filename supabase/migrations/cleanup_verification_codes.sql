-- Cleanup script for verification_codes table
-- Run this FIRST if you need to recreate the table

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Public can update own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Public can view own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Public can insert verification codes" ON public.verification_codes;

-- Drop function
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_codes();

-- Drop table (this will also drop indexes and constraints)
DROP TABLE IF EXISTS public.verification_codes CASCADE;
