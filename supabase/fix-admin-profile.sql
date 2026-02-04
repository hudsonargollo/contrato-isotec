-- Fix Admin Profile Creation
-- This script creates an admin profile for an existing Supabase Auth user

-- Step 1: First, get the user ID from auth.users
-- Run this query first to get your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Replace 'YOUR_ACTUAL_USER_ID_HERE' with the UUID from Step 1
-- Then run this INSERT statement:

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  mfa_enabled,
  created_at,
  updated_at
) VALUES (
  'YOUR_ACTUAL_USER_ID_HERE'::uuid,  -- Replace with actual UUID from auth.users
  'admin@isotec.com.br',              -- Replace with your admin email
  'Admin ISOTEC',                     -- Replace with admin name
  'super_admin',                      -- Role
  false,                              -- MFA disabled initially
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Alternative: If you don't have a user yet, create one first in Supabase Auth Dashboard
-- Then run the query above with the generated user ID
