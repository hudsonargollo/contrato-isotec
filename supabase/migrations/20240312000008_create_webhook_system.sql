-- Create webhook system tables
-- Requirements: 10.2 - Webhook system and third-party integrations

-- Create webhook_endpoints table
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Endpoint configuration
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  name TEXT,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT webhook_endpoints_valid_url CHECK (url ~ '^https?://'),
  CONSTRAINT webhook_endpoints_events_not_empty CHECK (array_length(events, 1) > 0)
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending',
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Retry logic
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT webhook_deliveries_valid_status CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  CONSTRAINT webhook_deliveries_valid_retry_count CHECK (retry_count >= 0 AND retry_count <= 10),
  CONSTRAINT webhook_deliveries_response_status_range CHECK (response_status IS NULL OR (response_status >= 100 AND response_status <= 599))
);

-- Create third_party_integrations table for managing external service connections
CREATE TABLE IF NOT EXISTS public.third_party_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Integration details
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted credentials
  
  -- Status and settings
  active BOOLEAN NOT NULL DEFAULT true,
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 60,
  
  -- Error tracking
  last_error TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT integrations_valid_service_type CHECK (service_type IN ('crm', 'email', 'sms', 'analytics', 'storage', 'payment', 'other')),
  CONSTRAINT integrations_valid_sync_frequency CHECK (sync_frequency_minutes IS NULL OR sync_frequency_minutes > 0),
  CONSTRAINT integrations_valid_error_count CHECK (error_count >= 0)
);

-- Create sync_operations table for tracking data synchronization
CREATE TABLE IF NOT EXISTS public.sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES public.third_party_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Operation details
  operation_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Sync data
  source_data JSONB,
  target_data JSONB,
  mapping_rules JSONB,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT sync_operations_valid_operation_type CHECK (operation_type IN ('create', 'update', 'delete', 'sync')),
  CONSTRAINT sync_operations_valid_direction CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  CONSTRAINT sync_operations_valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  CONSTRAINT sync_operations_valid_retry_count CHECK (retry_count >= 0 AND retry_count <= 5)
);

-- Create indexes for webhook_endpoints
CREATE INDEX idx_webhook_endpoints_tenant ON public.webhook_endpoints(tenant_id);
CREATE INDEX idx_webhook_endpoints_active ON public.webhook_endpoints(tenant_id, active);
CREATE INDEX idx_webhook_endpoints_events ON public.webhook_endpoints USING GIN(events);

-- Create indexes for webhook_deliveries
CREATE INDEX idx_webhook_deliveries_tenant ON public.webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(tenant_id, status);
CREATE INDEX idx_webhook_deliveries_event_type ON public.webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_retry ON public.webhook_deliveries(status, next_retry_at) 
  WHERE status = 'retrying';
CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries(created_at);

-- Create indexes for third_party_integrations
CREATE INDEX idx_integrations_tenant ON public.third_party_integrations(tenant_id);
CREATE INDEX idx_integrations_service ON public.third_party_integrations(tenant_id, service_name);
CREATE INDEX idx_integrations_active ON public.third_party_integrations(tenant_id, active);
CREATE INDEX idx_integrations_sync_enabled ON public.third_party_integrations(tenant_id, sync_enabled);
CREATE INDEX idx_integrations_last_sync ON public.third_party_integrations(last_sync_at);

-- Create indexes for sync_operations
CREATE INDEX idx_sync_operations_tenant ON public.sync_operations(tenant_id);
CREATE INDEX idx_sync_operations_integration ON public.sync_operations(integration_id);
CREATE INDEX idx_sync_operations_status ON public.sync_operations(tenant_id, status);
CREATE INDEX idx_sync_operations_entity ON public.sync_operations(entity_type, entity_id);
CREATE INDEX idx_sync_operations_created_at ON public.sync_operations(created_at);

-- Enable RLS for all webhook tables
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook_endpoints
CREATE POLICY tenant_isolation_webhook_endpoints ON public.webhook_endpoints
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create RLS policies for webhook_deliveries
CREATE POLICY tenant_isolation_webhook_deliveries ON public.webhook_deliveries
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create RLS policies for third_party_integrations
CREATE POLICY tenant_isolation_integrations ON public.third_party_integrations
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create RLS policies for sync_operations
CREATE POLICY tenant_isolation_sync_operations ON public.sync_operations
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    OR current_setting('app.bypass_rls', true)::boolean = true
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_deliveries_updated_at
  BEFORE UPDATE ON public.webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.third_party_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_operations_updated_at
  BEFORE UPDATE ON public.sync_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old webhook deliveries
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS void AS $$
BEGIN
  -- Delete webhook deliveries older than 30 days
  DELETE FROM public.webhook_deliveries
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('delivered', 'failed');
    
  -- Delete failed deliveries older than 7 days (keep recent failures for debugging)
  DELETE FROM public.webhook_deliveries
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND status = 'failed';
END;
$$ LANGUAGE plpgsql;

-- Create function to get webhook delivery statistics
CREATE OR REPLACE FUNCTION get_webhook_delivery_stats(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  pending_deliveries BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_deliveries,
    COUNT(*) FILTER (WHERE status = 'delivered') as successful_deliveries,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_deliveries,
    COUNT(*) FILTER (WHERE status IN ('pending', 'retrying')) as pending_deliveries,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as success_rate
  FROM public.webhook_deliveries
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create function to retry failed webhook deliveries
CREATE OR REPLACE FUNCTION retry_failed_webhook_deliveries(
  p_tenant_id UUID DEFAULT NULL,
  p_max_retries INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
DECLARE
  retry_count INTEGER := 0;
BEGIN
  -- Update failed deliveries to retrying status if they haven't exceeded max retries
  UPDATE public.webhook_deliveries
  SET 
    status = 'retrying',
    next_retry_at = NOW() + (POWER(2, retry_count) * INTERVAL '1 minute'),
    updated_at = NOW()
  WHERE status = 'failed'
    AND retry_count < p_max_retries
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id);
    
  GET DIAGNOSTICS retry_count = ROW_COUNT;
  
  RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to encrypt integration credentials
CREATE OR REPLACE FUNCTION encrypt_integration_credentials()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for credential encryption
  -- In production, you would use pgcrypto or external encryption service
  -- For now, we'll just store as-is with a warning comment
  
  -- TODO: Implement proper encryption for credentials
  -- NEW.credentials = pgp_sym_encrypt(NEW.credentials::text, current_setting('app.encryption_key'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for credential encryption
CREATE TRIGGER encrypt_credentials_trigger
  BEFORE INSERT OR UPDATE ON public.third_party_integrations
  FOR EACH ROW EXECUTE FUNCTION encrypt_integration_credentials();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.third_party_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_operations TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;