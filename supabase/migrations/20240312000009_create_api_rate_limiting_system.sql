-- Create API rate limiting and usage tracking system
-- Requirements: 10.4 - API rate limiting and usage tracking

-- Create api_keys table for API key management
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- API Key details
  name TEXT NOT NULL,
  description TEXT,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL, -- First 8 characters for display (e.g., "sk_live_")
  
  -- Permissions and scope
  scopes TEXT[] NOT NULL DEFAULT '{}', -- Array of allowed scopes
  permissions JSONB NOT NULL DEFAULT '{}', -- Detailed permissions
  
  -- Status and limits
  active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_override JSONB, -- Optional custom rate limits
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  total_requests BIGINT NOT NULL DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT api_keys_valid_scopes CHECK (array_length(scopes, 1) > 0),
  CONSTRAINT api_keys_key_prefix_format CHECK (key_prefix ~ '^[a-zA-Z0-9_]{4,12}$')
);

-- Create api_usage_logs table for detailed usage tracking
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  
  -- Performance metrics
  response_time_ms INTEGER NOT NULL,
  request_size_bytes INTEGER DEFAULT 0,
  response_size_bytes INTEGER DEFAULT 0,
  
  -- Client information
  user_agent TEXT,
  ip_address INET,
  referer TEXT,
  
  -- Subscription context
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  
  -- Error details (for failed requests)
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT api_usage_valid_method CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS')),
  CONSTRAINT api_usage_valid_status CHECK (status_code >= 100 AND status_code <= 599),
  CONSTRAINT api_usage_valid_response_time CHECK (response_time_ms >= 0),
  CONSTRAINT api_usage_valid_tier CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise'))
);

-- Create rate_limit_violations table for tracking violations
CREATE TABLE IF NOT EXISTS public.rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  
  -- Violation details
  identifier TEXT NOT NULL, -- tenant_id or api_key_id
  limit_type TEXT NOT NULL, -- 'minute', 'hour', 'day', 'burst'
  limit_value INTEGER NOT NULL,
  attempted_requests INTEGER NOT NULL,
  
  -- Context
  endpoint TEXT,
  method TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  violated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT rate_limit_violations_valid_type CHECK (limit_type IN ('minute', 'hour', 'day', 'burst')),
  CONSTRAINT rate_limit_violations_positive_values CHECK (limit_value > 0 AND attempted_requests > 0)
);

-- Create usage_quotas table for tracking monthly/daily quotas
CREATE TABLE IF NOT EXISTS public.usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Quota period
  period_type TEXT NOT NULL, -- 'daily', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Usage tracking
  requests_used BIGINT NOT NULL DEFAULT 0,
  requests_limit BIGINT NOT NULL,
  
  -- Subscription context
  subscription_tier TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT usage_quotas_valid_period CHECK (period_type IN ('daily', 'monthly')),
  CONSTRAINT usage_quotas_valid_dates CHECK (period_end > period_start),
  CONSTRAINT usage_quotas_positive_values CHECK (requests_used >= 0 AND requests_limit > 0),
  CONSTRAINT usage_quotas_valid_tier CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  
  -- Unique constraint for period
  UNIQUE(tenant_id, period_type, period_start)
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON public.api_keys(tenant_id, active);
CREATE INDEX idx_api_keys_last_used ON public.api_keys(last_used_at);

CREATE INDEX idx_api_usage_tenant ON public.api_usage_logs(tenant_id);
CREATE INDEX idx_api_usage_api_key ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_timestamp ON public.api_usage_logs(timestamp);
CREATE INDEX idx_api_usage_endpoint ON public.api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_status ON public.api_usage_logs(status_code);
CREATE INDEX idx_api_usage_tenant_timestamp ON public.api_usage_logs(tenant_id, timestamp);

CREATE INDEX idx_rate_limit_violations_tenant ON public.rate_limit_violations(tenant_id);
CREATE INDEX idx_rate_limit_violations_timestamp ON public.rate_limit_violations(violated_at);
CREATE INDEX idx_rate_limit_violations_identifier ON public.rate_limit_violations(identifier);

CREATE INDEX idx_usage_quotas_tenant ON public.usage_quotas(tenant_id);
CREATE INDEX idx_usage_quotas_period ON public.usage_quotas(tenant_id, period_type, period_start);

-- Enable RLS for all tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_keys
CREATE POLICY tenant_isolation_api_keys ON public.api_keys
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create RLS policies for api_usage_logs
CREATE POLICY tenant_isolation_api_usage_logs ON public.api_usage_logs
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create RLS policies for rate_limit_violations
CREATE POLICY tenant_isolation_rate_limit_violations ON public.rate_limit_violations
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create RLS policies for usage_quotas
CREATE POLICY tenant_isolation_usage_quotas ON public.usage_quotas
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_quotas_updated_at
  BEFORE UPDATE ON public.usage_quotas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update API key last_used_at
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.api_keys
  SET 
    last_used_at = NEW.timestamp,
    total_requests = total_requests + 1,
    updated_at = NOW()
  WHERE id = NEW.api_key_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update API key usage
CREATE TRIGGER update_api_key_usage_trigger
  AFTER INSERT ON public.api_usage_logs
  FOR EACH ROW
  WHEN (NEW.api_key_id IS NOT NULL)
  EXECUTE FUNCTION update_api_key_last_used();

-- Create function to get usage statistics
CREATE OR REPLACE FUNCTION get_api_usage_stats(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  avg_response_time NUMERIC,
  requests_per_day NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code < 400) as successful_requests,
    COUNT(*) FILTER (WHERE status_code >= 400) as failed_requests,
    ROUND(AVG(response_time_ms), 2) as avg_response_time,
    ROUND(COUNT(*)::NUMERIC / EXTRACT(DAYS FROM p_end_date - p_start_date), 2) as requests_per_day
  FROM public.api_usage_logs
  WHERE tenant_id = p_tenant_id
    AND timestamp >= p_start_date
    AND timestamp <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top endpoints
CREATE OR REPLACE FUNCTION get_top_endpoints(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  endpoint TEXT,
  method TEXT,
  request_count BIGINT,
  avg_response_time NUMERIC,
  error_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.endpoint,
    l.method,
    COUNT(*) as request_count,
    ROUND(AVG(l.response_time_ms), 2) as avg_response_time,
    ROUND((COUNT(*) FILTER (WHERE l.status_code >= 400)::NUMERIC / COUNT(*)) * 100, 2) as error_rate
  FROM public.api_usage_logs l
  WHERE l.tenant_id = p_tenant_id
    AND l.timestamp >= p_start_date
    AND l.timestamp <= p_end_date
  GROUP BY l.endpoint, l.method
  ORDER BY request_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to record rate limit violation
CREATE OR REPLACE FUNCTION record_rate_limit_violation(
  p_tenant_id UUID,
  p_api_key_id UUID,
  p_identifier TEXT,
  p_limit_type TEXT,
  p_limit_value INTEGER,
  p_attempted_requests INTEGER,
  p_endpoint TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  violation_id UUID;
BEGIN
  INSERT INTO public.rate_limit_violations (
    tenant_id,
    api_key_id,
    identifier,
    limit_type,
    limit_value,
    attempted_requests,
    endpoint,
    method,
    ip_address,
    user_agent
  ) VALUES (
    p_tenant_id,
    p_api_key_id,
    p_identifier,
    p_limit_type,
    p_limit_value,
    p_attempted_requests,
    p_endpoint,
    p_method,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO violation_id;
  
  RETURN violation_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old usage logs
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_usage_logs
  WHERE timestamp < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also cleanup old rate limit violations
  DELETE FROM public.rate_limit_violations
  WHERE violated_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update usage quotas
CREATE OR REPLACE FUNCTION update_usage_quota(
  p_tenant_id UUID,
  p_period_type TEXT,
  p_requests_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_period_start DATE;
  current_period_end DATE;
  quota_limit BIGINT;
  tier TEXT;
BEGIN
  -- Get tenant subscription tier
  SELECT subscription->>'tier' INTO tier
  FROM public.tenants
  WHERE id = p_tenant_id;
  
  -- Set quota limits based on tier
  quota_limit := CASE 
    WHEN tier = 'enterprise' THEN 1000000
    WHEN tier = 'professional' THEN 100000
    WHEN tier = 'starter' THEN 10000
    ELSE 1000 -- free tier
  END;
  
  -- Calculate period dates
  IF p_period_type = 'daily' THEN
    current_period_start := CURRENT_DATE;
    current_period_end := CURRENT_DATE + INTERVAL '1 day';
  ELSE -- monthly
    current_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
  END IF;
  
  -- Insert or update quota
  INSERT INTO public.usage_quotas (
    tenant_id,
    period_type,
    period_start,
    period_end,
    requests_used,
    requests_limit,
    subscription_tier
  ) VALUES (
    p_tenant_id,
    p_period_type,
    current_period_start,
    current_period_end,
    p_requests_increment,
    quota_limit,
    COALESCE(tier, 'free')
  )
  ON CONFLICT (tenant_id, period_type, period_start)
  DO UPDATE SET
    requests_used = usage_quotas.requests_used + p_requests_increment,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_usage_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_violations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_quotas TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;