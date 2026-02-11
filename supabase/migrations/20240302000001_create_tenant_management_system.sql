-- Migration: Create tenant management system
-- Description: Creates core tenant tables with Row Level Security for multi-tenant architecture
-- Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  branding JSONB NOT NULL DEFAULT '{
    "logo_url": "",
    "primary_color": "#2563eb",
    "secondary_color": "#64748b",
    "custom_css": "",
    "white_label": false
  }',
  subscription JSONB NOT NULL DEFAULT '{
    "plan": "starter",
    "status": "active",
    "limits": {
      "users": 5,
      "leads": 1000,
      "contracts": 100,
      "storage_gb": 10
    },
    "features": ["crm", "screening", "invoices"]
  }',
  settings JSONB NOT NULL DEFAULT '{
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "language": "pt-BR",
    "date_format": "DD/MM/YYYY",
    "notifications": {
      "email": true,
      "whatsapp": false,
      "sms": false
    }
  }',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  CONSTRAINT valid_domain_format CHECK (domain ~ '^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$'),
  CONSTRAINT valid_subdomain_format CHECK (subdomain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$')
);

-- Create tenant_users table for user-tenant relationships
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  permissions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'manager', 'user', 'viewer')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  CONSTRAINT unique_user_tenant UNIQUE (tenant_id, user_id)
);

-- Create tenant_usage table for tracking usage metrics
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_metric_name CHECK (metric_name IN (
    'users_count', 'leads_count', 'contracts_count', 'invoices_count',
    'storage_used_mb', 'api_calls', 'whatsapp_messages', 'email_sent'
  )),
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT unique_tenant_metric_period UNIQUE (tenant_id, metric_name, period_start)
);

-- Create indexes for performance
CREATE INDEX idx_tenants_domain ON public.tenants(domain);
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_created_at ON public.tenants(created_at DESC);

CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON public.tenant_users(role);
CREATE INDEX idx_tenant_users_status ON public.tenant_users(status);
CREATE INDEX idx_tenant_users_last_active ON public.tenant_users(last_active_at DESC);

CREATE INDEX idx_tenant_usage_tenant_id ON public.tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_metric_name ON public.tenant_usage(metric_name);
CREATE INDEX idx_tenant_usage_period ON public.tenant_usage(period_start, period_end);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_tenants_branding ON public.tenants USING GIN (branding);
CREATE INDEX idx_tenants_subscription ON public.tenants USING GIN (subscription);
CREATE INDEX idx_tenants_settings ON public.tenants USING GIN (settings);
CREATE INDEX idx_tenant_users_permissions ON public.tenant_users USING GIN (permissions);
CREATE INDEX idx_tenant_usage_metadata ON public.tenant_usage USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
-- Super admins can view all tenants
CREATE POLICY "Super admins can view all tenants"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Tenant users can view their own tenant
CREATE POLICY "Tenant users can view own tenant"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = tenants.id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- Only super admins can create tenants
CREATE POLICY "Super admins can create tenants"
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Tenant owners and super admins can update tenants
CREATE POLICY "Tenant owners can update own tenant"
  ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = tenants.id AND user_id = auth.uid() 
        AND role IN ('owner', 'admin') AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = tenants.id AND user_id = auth.uid() 
        AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- RLS Policies for tenant_users table
-- Users can view their own tenant memberships
CREATE POLICY "Users can view own tenant memberships"
  ON public.tenant_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Tenant admins can view all users in their tenant
CREATE POLICY "Tenant admins can view tenant users"
  ON public.tenant_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin') 
        AND tu.status = 'active'
    )
  );

-- Super admins can view all tenant users
CREATE POLICY "Super admins can view all tenant users"
  ON public.tenant_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Tenant owners/admins can manage users in their tenant
CREATE POLICY "Tenant admins can manage tenant users"
  ON public.tenant_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin') 
        AND tu.status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin') 
        AND tu.status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for tenant_usage table
-- Tenant users can view their own tenant's usage
CREATE POLICY "Tenant users can view own tenant usage"
  ON public.tenant_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = tenant_usage.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- Super admins can view all usage data
CREATE POLICY "Super admins can view all tenant usage"
  ON public.tenant_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- System can insert usage data (for background jobs)
CREATE POLICY "System can insert usage data"
  ON public.tenant_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers to update updated_at timestamps
CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Try to get tenant_id from app settings first (set by middleware)
  BEGIN
    tenant_id := current_setting('app.current_tenant_id')::UUID;
    RETURN tenant_id;
  EXCEPTION WHEN OTHERS THEN
    -- Fall back to getting tenant from user's primary tenant
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() 
      AND tu.status = 'active'
    ORDER BY 
      CASE WHEN tu.role = 'owner' THEN 1
           WHEN tu.role = 'admin' THEN 2
           ELSE 3 END,
      tu.joined_at ASC
    LIMIT 1;
    
    RETURN tenant_id;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission in tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_permission(
  tenant_id_param UUID,
  permission_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_permissions JSONB;
BEGIN
  -- Get user's role and permissions in the tenant
  SELECT role, permissions INTO user_role, user_permissions
  FROM public.tenant_users
  WHERE tenant_id = tenant_id_param 
    AND user_id = auth.uid() 
    AND status = 'active';
  
  -- If user not found in tenant, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Owner and admin have all permissions
  IF user_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  RETURN user_permissions ? permission_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tenant usage metrics
CREATE OR REPLACE FUNCTION public.update_tenant_usage(
  tenant_id_param UUID,
  metric_name_param TEXT,
  increment_value INTEGER DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  current_period_start TIMESTAMPTZ;
  current_period_end TIMESTAMPTZ;
BEGIN
  -- Calculate current period (monthly)
  current_period_start := date_trunc('month', NOW());
  current_period_end := current_period_start + INTERVAL '1 month';
  
  -- Insert or update usage record
  INSERT INTO public.tenant_usage (
    tenant_id, 
    metric_name, 
    metric_value, 
    period_start, 
    period_end
  )
  VALUES (
    tenant_id_param,
    metric_name_param,
    increment_value,
    current_period_start,
    current_period_end
  )
  ON CONFLICT (tenant_id, metric_name, period_start)
  DO UPDATE SET 
    metric_value = tenant_usage.metric_value + increment_value,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate tenant subscription limits
CREATE OR REPLACE FUNCTION public.check_tenant_limit(
  tenant_id_param UUID,
  limit_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  tenant_limits JSONB;
  current_usage INTEGER;
  limit_value INTEGER;
BEGIN
  -- Get tenant subscription limits
  SELECT subscription->'limits' INTO tenant_limits
  FROM public.tenants
  WHERE id = tenant_id_param;
  
  IF tenant_limits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get limit value
  limit_value := (tenant_limits->>limit_type)::INTEGER;
  
  IF limit_value IS NULL THEN
    RETURN TRUE; -- No limit set
  END IF;
  
  -- Get current usage for this month
  SELECT COALESCE(metric_value, 0) INTO current_usage
  FROM public.tenant_usage
  WHERE tenant_id = tenant_id_param
    AND metric_name = limit_type || '_count'
    AND period_start = date_trunc('month', NOW());
  
  RETURN current_usage < limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing questionnaire_templates table to use proper tenant reference
-- First, add the new tenant_id column
ALTER TABLE public.questionnaire_templates 
ADD COLUMN IF NOT EXISTS new_tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_questionnaire_templates_new_tenant_id 
ON public.questionnaire_templates(new_tenant_id);

-- Update RLS policies for questionnaire_templates to use new tenant system
DROP POLICY IF EXISTS "Authenticated users can view tenant templates" ON public.questionnaire_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.questionnaire_templates;

-- New RLS policies using tenant system
CREATE POLICY "Tenant users can view tenant templates"
  ON public.questionnaire_templates
  FOR SELECT
  TO authenticated
  USING (
    new_tenant_id IS NULL OR -- Public templates
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = new_tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can manage templates"
  ON public.questionnaire_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = new_tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = new_tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations using the SolarCRM Pro platform';
COMMENT ON TABLE public.tenant_users IS 'User memberships and roles within tenants';
COMMENT ON TABLE public.tenant_usage IS 'Usage metrics tracking for billing and limits enforcement';

COMMENT ON COLUMN public.tenants.branding IS 'Tenant-specific branding configuration including colors, logos, and custom CSS';
COMMENT ON COLUMN public.tenants.subscription IS 'Subscription plan details, limits, and feature flags';
COMMENT ON COLUMN public.tenants.settings IS 'Tenant-specific settings like timezone, currency, and notification preferences';
COMMENT ON COLUMN public.tenant_users.permissions IS 'JSONB array of specific permissions for granular access control';
COMMENT ON COLUMN public.tenant_usage.metric_name IS 'Type of usage metric being tracked for billing and limits';

-- Create default ISOTEC tenant (first premium tenant)
INSERT INTO public.tenants (
  id,
  name,
  domain,
  subdomain,
  branding,
  subscription,
  settings,
  status
) VALUES (
  gen_random_uuid(),
  'ISOTEC Photovoltaic Systems',
  'isotec.solarcrm.clubemkt.digital',
  'isotec',
  '{
    "logo_url": "/isotec-logo.webp",
    "primary_color": "#1e40af",
    "secondary_color": "#64748b",
    "custom_css": "",
    "white_label": false
  }',
  '{
    "plan": "enterprise",
    "status": "active",
    "limits": {
      "users": 50,
      "leads": 10000,
      "contracts": 1000,
      "storage_gb": 100
    },
    "features": ["crm", "screening", "invoices", "whatsapp", "analytics", "contracts", "api"]
  }',
  '{
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "language": "pt-BR",
    "date_format": "DD/MM/YYYY",
    "notifications": {
      "email": true,
      "whatsapp": true,
      "sms": false
    }
  }',
  'active'
) ON CONFLICT (domain) DO NOTHING;