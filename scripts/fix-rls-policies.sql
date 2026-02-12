-- Fix RLS policies to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their tenant memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can manage their tenant memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can view tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage tenant users" ON public.tenant_users;

-- Create simpler, non-recursive policies for tenant_users
CREATE POLICY "Users can view own tenant memberships"
  ON public.tenant_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tenant memberships"
  ON public.tenant_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tenant memberships"
  ON public.tenant_users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow service role to manage all tenant_users (for admin operations)
CREATE POLICY "Service role can manage all tenant users"
  ON public.tenant_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix tenants table policies to be simpler
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Tenant users can view own tenant" ON public.tenants;

CREATE POLICY "Users can view tenants they belong to"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Allow service role to manage all tenants
CREATE POLICY "Service role can manage all tenants"
  ON public.tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);