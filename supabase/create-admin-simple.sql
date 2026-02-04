-- Simple Admin Profile Creation
-- Run this in Supabase SQL Editor after creating a user in Auth

-- First, check if you have any users:
SELECT id, email, created_at FROM auth.users;

-- If you see a user, copy their ID and use it below
-- If not, go to Authentication > Users in Supabase Dashboard and create a user first

-- Example: If your user ID is '123e4567-e89b-12d3-a456-426614174000'
-- Replace the UUID below with your actual user ID:

INSERT INTO public.profiles (id, email, full_name, role, mfa_enabled)
SELECT 
  id,
  email,
  'Admin ISOTEC',
  'super_admin',
  false
FROM auth.users
WHERE email = 'admin@isotec.com.br'  -- Replace with your admin email
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  updated_at = NOW();

-- Verify the profile was created:
SELECT * FROM public.profiles;
