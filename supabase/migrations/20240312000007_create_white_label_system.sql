-- Migration: Create White-Label System
-- Description: Creates tables and functions for enterprise white-label features
-- Requirements: 9.5 - Enterprise white-label features

-- Create white_label_configs table for advanced customization
CREATE TABLE IF NOT EXISTS public.white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  custom_domain TEXT,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ssl_certificate_id TEXT,
  favicon_url TEXT,
  login_logo_url TEXT,
  email_logo_url TEXT,
  custom_css TEXT NOT NULL DEFAULT '',
  custom_js TEXT NOT NULL DEFAULT '',
  hide_branding BOOLEAN NOT NULL DEFAULT FALSE,
  custom_email_templates JSONB NOT NULL DEFAULT '{}',
  custom_notification_settings JSONB NOT NULL DEFAULT '{}',
  api_subdomain TEXT,
  webhook_endpoints JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure custom domain is unique across all tenants
  CONSTRAINT unique_custom_domain UNIQUE (custom_domain) DEFERRABLE INITIALLY DEFERRED
);

-- Create api_access_configs table for API management
CREATE TABLE IF NOT EXISTS public.api_access_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 25000 CHECK (rate_limit_per_hour >= 0),
  rate_limit_per_day INTEGER NOT NULL DEFAULT 500000 CHECK (rate_limit_per_day >= 0),
  allowed_endpoints JSONB NOT NULL DEFAULT '["*"]',
  webhook_secret TEXT NOT NULL,
  ip_whitelist JSONB NOT NULL DEFAULT '[]',
  cors_origins JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enterprise_features table for feature toggles
CREATE TABLE IF NOT EXISTS public.enterprise_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  configuration JSONB NOT NULL DEFAULT '{}',
  usage_limits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique feature per tenant
  CONSTRAINT unique_tenant_feature UNIQUE (tenant_id, feature_key)
);

-- Create domain_verifications table for custom domain verification
CREATE TABLE IF NOT EXISTS public.domain_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  verification_token TEXT NOT NULL,
  dns_records JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique domain verification per tenant
  CONSTRAINT unique_tenant_domain_verification UNIQUE (tenant_id, domain)
);

-- Create api_usage_logs table for API usage tracking
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_deliveries table for webhook tracking
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  http_status_code INTEGER,
  response_body TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_white_label_configs_tenant ON public.white_label_configs(tenant_id);
CREATE INDEX idx_white_label_configs_domain ON public.white_label_configs(custom_domain) WHERE custom_domain IS NOT NULL;

CREATE INDEX idx_api_access_configs_tenant ON public.api_access_configs(tenant_id);
CREATE INDEX idx_api_access_configs_api_key ON public.api_access_configs(api_key);
CREATE INDEX idx_api_access_configs_active ON public.api_access_configs(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_enterprise_features_tenant ON public.enterprise_features(tenant_id);
CREATE INDEX idx_enterprise_features_key ON public.enterprise_features(feature_key);
CREATE INDEX idx_enterprise_features_enabled ON public.enterprise_features(tenant_id, is_enabled) WHERE is_enabled = TRUE;

CREATE INDEX idx_domain_verifications_tenant ON public.domain_verifications(tenant_id);
CREATE INDEX idx_domain_verifications_domain ON public.domain_verifications(domain);
CREATE INDEX idx_domain_verifications_status ON public.domain_verifications(status);

CREATE INDEX idx_api_usage_logs_tenant_created ON public.api_usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_api_key ON public.api_usage_logs(api_key);
CREATE INDEX idx_api_usage_logs_endpoint ON public.api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);

CREATE INDEX idx_webhook_deliveries_tenant ON public.webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_white_label_configs_email_templates ON public.white_label_configs USING GIN (custom_email_templates);
CREATE INDEX idx_white_label_configs_notification_settings ON public.white_label_configs USING GIN (custom_notification_settings);
CREATE INDEX idx_white_label_configs_webhook_endpoints ON public.white_label_configs USING GIN (webhook_endpoints);

CREATE INDEX idx_api_access_configs_allowed_endpoints ON public.api_access_configs USING GIN (allowed_endpoints);
CREATE INDEX idx_api_access_configs_ip_whitelist ON public.api_access_configs USING GIN (ip_whitelist);
CREATE INDEX idx_api_access_configs_cors_origins ON public.api_access_configs USING GIN (cors_origins);

CREATE INDEX idx_enterprise_features_configuration ON public.enterprise_features USING GIN (configuration);
CREATE INDEX idx_enterprise_features_usage_limits ON public.enterprise_features USING GIN (usage_limits);

CREATE INDEX idx_domain_verifications_dns_records ON public.domain_verifications USING GIN (dns_records);
CREATE INDEX idx_webhook_deliveries_payload ON public.webhook_deliveries USING GIN (payload);

-- Enable Row Level Security
ALTER TABLE public.white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_access_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for white_label_configs table
CREATE POLICY "Tenant admins can manage white-label configs"
  ON public.white_label_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = white_label_configs.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for api_access_configs table
CREATE POLICY "Tenant owners can manage API access configs"
  ON public.api_access_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = api_access_configs.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role = 'owner'
    )
  );

-- RLS Policies for enterprise_features table
CREATE POLICY "Tenant admins can manage enterprise features"
  ON public.enterprise_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = enterprise_features.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for domain_verifications table
CREATE POLICY "Tenant admins can manage domain verifications"
  ON public.domain_verifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = domain_verifications.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for api_usage_logs table
CREATE POLICY "Tenant users can view own API usage logs"
  ON public.api_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = api_usage_logs.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

-- RLS Policies for webhook_deliveries table
CREATE POLICY "Tenant users can view own webhook deliveries"
  ON public.webhook_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = webhook_deliveries.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "System can manage webhook deliveries"
  ON public.webhook_deliveries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = webhook_deliveries.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Function to initialize white-label features for enterprise tenants
CREATE OR REPLACE FUNCTION public.initialize_white_label_features(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  tenant_subscription JSONB;
  has_white_label BOOLEAN := FALSE;
BEGIN
  -- Check if tenant has enterprise plan with white-label features
  SELECT subscription INTO tenant_subscription
  FROM public.tenants
  WHERE id = p_tenant_id;
  
  -- Check if white_label feature is available
  SELECT 'white_label' = ANY(
    SELECT jsonb_array_elements_text(tenant_subscription->'features')
  ) INTO has_white_label;
  
  IF NOT has_white_label THEN
    RAISE EXCEPTION 'White-label features not available for this subscription plan';
  END IF;
  
  -- Create white-label configuration if not exists
  INSERT INTO public.white_label_configs (tenant_id)
  VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;
  
  -- Create API access configuration if not exists
  INSERT INTO public.api_access_configs (
    tenant_id,
    api_key,
    api_secret,
    webhook_secret
  )
  VALUES (
    p_tenant_id,
    'sk_' || encode(gen_random_bytes(16), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    'whsec_' || encode(gen_random_bytes(16), 'hex')
  )
  ON CONFLICT (tenant_id) DO NOTHING;
  
  -- Create default enterprise features
  INSERT INTO public.enterprise_features (tenant_id, feature_key, feature_name, configuration)
  VALUES 
    (p_tenant_id, 'custom_domain', 'Custom Domain', '{"max_domains": 3}'),
    (p_tenant_id, 'api_access', 'API Access', '{"rate_limit": 25000, "webhook_limit": 10}'),
    (p_tenant_id, 'webhook_integration', 'Webhook Integration', '{"max_webhooks": 10, "retry_attempts": 3}'),
    (p_tenant_id, 'custom_branding', 'Custom Branding', '{"hide_platform_branding": true}'),
    (p_tenant_id, 'advanced_analytics', 'Advanced Analytics', '{"data_retention_days": 365, "custom_reports": true}'),
    (p_tenant_id, 'bulk_operations', 'Bulk Operations', '{"max_batch_size": 10000}'),
    (p_tenant_id, 'custom_fields', 'Custom Fields', '{"max_custom_fields": 50}'),
    (p_tenant_id, 'advanced_permissions', 'Advanced Permissions', '{"custom_roles": true, "field_level_permissions": true}'),
    (p_tenant_id, 'sso_integration', 'SSO Integration', '{"saml": true, "oauth": true, "ldap": true}'),
    (p_tenant_id, 'audit_logs', 'Audit Logs', '{"retention_days": 365, "real_time_alerts": true}'),
    (p_tenant_id, 'data_export', 'Data Export', '{"formats": ["csv", "json", "xml"], "scheduled_exports": true}'),
    (p_tenant_id, 'priority_support', 'Priority Support', '{"sla_hours": 4, "dedicated_manager": true}')
  ON CONFLICT (tenant_id, feature_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API usage
CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_tenant_id UUID,
  p_api_key TEXT,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_size_bytes INTEGER DEFAULT NULL,
  p_response_size_bytes INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.api_usage_logs (
    tenant_id,
    api_key,
    endpoint,
    method,
    status_code,
    response_time_ms,
    ip_address,
    user_agent,
    request_size_bytes,
    response_size_bytes
  )
  VALUES (
    p_tenant_id,
    p_api_key,
    p_endpoint,
    p_method,
    p_status_code,
    p_response_time_ms,
    p_ip_address,
    p_user_agent,
    p_request_size_bytes,
    p_response_size_bytes
  );
  
  -- Update last_used_at for API access config
  UPDATE public.api_access_configs
  SET last_used_at = NOW()
  WHERE tenant_id = p_tenant_id AND api_key = p_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API usage statistics
CREATE OR REPLACE FUNCTION public.get_api_usage_stats(
  p_tenant_id UUID,
  p_period_start TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_period_end TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_requests INTEGER,
  successful_requests INTEGER,
  failed_requests INTEGER,
  avg_response_time_ms NUMERIC,
  total_data_transferred_bytes BIGINT,
  top_endpoints JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH usage_stats AS (
    SELECT 
      COUNT(*) as total_reqs,
      COUNT(*) FILTER (WHERE status_code < 400) as success_reqs,
      COUNT(*) FILTER (WHERE status_code >= 400) as failed_reqs,
      AVG(response_time_ms) as avg_response_time,
      SUM(COALESCE(request_size_bytes, 0) + COALESCE(response_size_bytes, 0)) as total_bytes
    FROM public.api_usage_logs
    WHERE tenant_id = p_tenant_id
      AND created_at >= p_period_start
      AND created_at <= p_period_end
  ),
  top_endpoints_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'endpoint', endpoint,
        'requests', request_count,
        'avg_response_time', avg_response_time
      )
      ORDER BY request_count DESC
    ) as endpoints
    FROM (
      SELECT 
        endpoint,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time
      FROM public.api_usage_logs
      WHERE tenant_id = p_tenant_id
        AND created_at >= p_period_start
        AND created_at <= p_period_end
      GROUP BY endpoint
      ORDER BY request_count DESC
      LIMIT 10
    ) t
  )
  SELECT 
    us.total_reqs::INTEGER,
    us.success_reqs::INTEGER,
    us.failed_reqs::INTEGER,
    us.avg_response_time::NUMERIC,
    us.total_bytes::BIGINT,
    COALESCE(te.endpoints, '[]'::jsonb)
  FROM usage_stats us
  CROSS JOIN top_endpoints_data te;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue webhook delivery
CREATE OR REPLACE FUNCTION public.queue_webhook_delivery(
  p_tenant_id UUID,
  p_webhook_url TEXT,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS UUID AS $$
DECLARE
  delivery_id UUID;
BEGIN
  INSERT INTO public.webhook_deliveries (
    tenant_id,
    webhook_url,
    event_type,
    payload,
    status,
    attempt_count,
    next_retry_at
  )
  VALUES (
    p_tenant_id,
    p_webhook_url,
    p_event_type,
    p_payload,
    'pending',
    0,
    NOW() + INTERVAL '1 minute'
  )
  RETURNING id INTO delivery_id;
  
  RETURN delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retry failed webhook deliveries
CREATE OR REPLACE FUNCTION public.retry_failed_webhooks()
RETURNS INTEGER AS $$
DECLARE
  retry_count INTEGER := 0;
  webhook_record RECORD;
  next_retry_delay INTERVAL;
BEGIN
  -- Get webhooks ready for retry
  FOR webhook_record IN 
    SELECT *
    FROM public.webhook_deliveries
    WHERE status IN ('failed', 'retrying')
      AND next_retry_at <= NOW()
      AND attempt_count < 5
    ORDER BY next_retry_at
    LIMIT 100
  LOOP
    -- Calculate next retry delay (exponential backoff)
    next_retry_delay := INTERVAL '1 minute' * POWER(2, webhook_record.attempt_count);
    
    -- Update webhook for retry
    UPDATE public.webhook_deliveries
    SET 
      status = 'retrying',
      attempt_count = attempt_count + 1,
      next_retry_at = NOW() + next_retry_delay,
      updated_at = NOW()
    WHERE id = webhook_record.id;
    
    retry_count := retry_count + 1;
  END LOOP;
  
  RETURN retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_white_label_configs_updated_at
  BEFORE UPDATE ON public.white_label_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_access_configs_updated_at
  BEFORE UPDATE ON public.api_access_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_features_updated_at
  BEFORE UPDATE ON public.enterprise_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_verifications_updated_at
  BEFORE UPDATE ON public.domain_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_deliveries_updated_at
  BEFORE UPDATE ON public.webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.white_label_configs IS 'Advanced white-label customization configurations for enterprise tenants';
COMMENT ON TABLE public.api_access_configs IS 'API access management and rate limiting for enterprise tenants';
COMMENT ON TABLE public.enterprise_features IS 'Feature toggles and configurations for enterprise functionality';
COMMENT ON TABLE public.domain_verifications IS 'Custom domain verification and DNS management';
COMMENT ON TABLE public.api_usage_logs IS 'API usage tracking and analytics for rate limiting and billing';
COMMENT ON TABLE public.webhook_deliveries IS 'Webhook delivery queue and retry management';

COMMENT ON COLUMN public.white_label_configs.hide_branding IS 'Whether to hide platform branding completely';
COMMENT ON COLUMN public.white_label_configs.custom_email_templates IS 'Custom email templates for tenant communications';
COMMENT ON COLUMN public.white_label_configs.webhook_endpoints IS 'Configured webhook endpoints for event notifications';

COMMENT ON COLUMN public.api_access_configs.rate_limit_per_hour IS 'Maximum API requests allowed per hour';
COMMENT ON COLUMN public.api_access_configs.allowed_endpoints IS 'List of allowed API endpoints or * for all';
COMMENT ON COLUMN public.api_access_configs.ip_whitelist IS 'List of allowed IP addresses for API access';

COMMENT ON COLUMN public.enterprise_features.configuration IS 'Feature-specific configuration parameters';
COMMENT ON COLUMN public.enterprise_features.usage_limits IS 'Usage limits and quotas for the feature';

COMMENT ON COLUMN public.webhook_deliveries.attempt_count IS 'Number of delivery attempts made';
COMMENT ON COLUMN public.webhook_deliveries.next_retry_at IS 'Scheduled time for next retry attempt';