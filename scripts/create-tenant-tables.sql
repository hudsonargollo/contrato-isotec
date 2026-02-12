-- Create tenant management tables for SolarCRM Pro
-- This script creates the essential tables needed for multi-tenant functionality

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
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
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'))
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON public.tenant_users(status);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for tenants table
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;
CREATE POLICY "Users can view their tenant"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = tenants.id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- Basic RLS Policies for tenant_users table
DROP POLICY IF EXISTS "Users can view their tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can view their tenant memberships"
  ON public.tenant_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can manage their tenant memberships"
  ON public.tenant_users
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin') 
        AND tu.status = 'active'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin') 
        AND tu.status = 'active'
    )
  );

-- Create default ISOTEC tenant
INSERT INTO public.tenants (
  name,
  domain,
  subdomain,
  branding,
  subscription,
  settings,
  status
) VALUES (
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
) ON CONFLICT (subdomain) DO NOTHING;