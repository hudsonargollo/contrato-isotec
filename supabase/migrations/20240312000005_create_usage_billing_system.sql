-- Migration: Create Usage-Based Billing System
-- Description: Creates tables and functions for comprehensive usage tracking and billing
-- Requirements: 9.2 - Usage-based billing tracking

-- Create usage_events table for detailed event tracking
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'api_call',
    'whatsapp_message_sent',
    'whatsapp_message_received',
    'email_sent',
    'sms_sent',
    'contract_generated',
    'invoice_created',
    'lead_created',
    'storage_used',
    'user_session',
    'report_generated',
    'webhook_delivered'
  )),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_rates table for configurable pricing
CREATE TABLE IF NOT EXISTS public.billing_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- null for global rates
  event_type TEXT NOT NULL,
  rate_per_unit DECIMAL(10,6) NOT NULL CHECK (rate_per_unit >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  tier_start INTEGER NOT NULL DEFAULT 0 CHECK (tier_start >= 0),
  tier_end INTEGER CHECK (tier_end IS NULL OR tier_end > tier_start),
  subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no overlapping tiers for same tenant/event_type/plan
  CONSTRAINT unique_billing_rate_tier UNIQUE (
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID),
    event_type,
    COALESCE(subscription_plan, ''),
    tier_start
  )
);

-- Create usage_summaries table for aggregated billing data
CREATE TABLE IF NOT EXISTS public.usage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  billable_quantity INTEGER NOT NULL DEFAULT 0 CHECK (billable_quantity >= 0),
  rate_per_unit DECIMAL(10,6) NOT NULL DEFAULT 0 CHECK (rate_per_unit >= 0),
  total_charge DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_charge >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  tier_breakdown JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique summary per tenant/period/event_type
  CONSTRAINT unique_usage_summary UNIQUE (tenant_id, billing_period_start, billing_period_end, event_type)
);

-- Create billing_cycles table for managing billing periods
CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  cycle_start TIMESTAMPTZ NOT NULL,
  cycle_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'completed', 'failed')),
  total_usage_charges DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_usage_charges >= 0),
  subscription_charges DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subscription_charges >= 0),
  total_charges DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_charges >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  invoice_id UUID, -- Reference to generated invoice
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no overlapping active cycles for same tenant
  CONSTRAINT check_cycle_dates CHECK (cycle_end > cycle_start)
);

-- Create indexes for performance
CREATE INDEX idx_usage_events_tenant_timestamp ON public.usage_events(tenant_id, timestamp DESC);
CREATE INDEX idx_usage_events_event_type ON public.usage_events(event_type);
CREATE INDEX idx_usage_events_timestamp ON public.usage_events(timestamp DESC);

CREATE INDEX idx_billing_rates_tenant_event ON public.billing_rates(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID), event_type);
CREATE INDEX idx_billing_rates_effective_dates ON public.billing_rates(effective_from, effective_until);

CREATE INDEX idx_usage_summaries_tenant_period ON public.usage_summaries(tenant_id, billing_period_start, billing_period_end);
CREATE INDEX idx_usage_summaries_event_type ON public.usage_summaries(event_type);

CREATE INDEX idx_billing_cycles_tenant_dates ON public.billing_cycles(tenant_id, cycle_start, cycle_end);
CREATE INDEX idx_billing_cycles_status ON public.billing_cycles(status);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_usage_events_metadata ON public.usage_events USING GIN (metadata);
CREATE INDEX idx_usage_summaries_tier_breakdown ON public.usage_summaries USING GIN (tier_breakdown);

-- Enable Row Level Security
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_events table
CREATE POLICY "Tenant users can view own tenant usage events"
  ON public.usage_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = usage_events.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can insert usage events"
  ON public.usage_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = usage_events.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for billing_rates table
CREATE POLICY "Tenant admins can manage billing rates"
  ON public.billing_rates
  FOR ALL
  TO authenticated
  USING (
    tenant_id IS NULL OR -- Global rates visible to all
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = billing_rates.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for usage_summaries table
CREATE POLICY "Tenant users can view own tenant usage summaries"
  ON public.usage_summaries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = usage_summaries.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can manage usage summaries"
  ON public.usage_summaries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = usage_summaries.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for billing_cycles table
CREATE POLICY "Tenant users can view own tenant billing cycles"
  ON public.billing_cycles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = billing_cycles.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can manage billing cycles"
  ON public.billing_cycles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = billing_cycles.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Function to upsert usage summary (for real-time aggregation)
CREATE OR REPLACE FUNCTION public.upsert_usage_summary(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_quantity_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_summaries (
    tenant_id,
    billing_period_start,
    billing_period_end,
    event_type,
    total_quantity,
    billable_quantity,
    rate_per_unit,
    total_charge,
    currency
  )
  VALUES (
    p_tenant_id,
    p_period_start,
    p_period_end,
    p_event_type,
    p_quantity_increment,
    0, -- Will be calculated during billing processing
    0, -- Will be calculated during billing processing
    0, -- Will be calculated during billing processing
    'BRL'
  )
  ON CONFLICT (tenant_id, billing_period_start, billing_period_end, event_type)
  DO UPDATE SET 
    total_quantity = usage_summaries.total_quantity + p_quantity_increment,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current billing cycle for a tenant
CREATE OR REPLACE FUNCTION public.get_current_billing_cycle(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  cycle_start TIMESTAMPTZ,
  cycle_end TIMESTAMPTZ,
  status TEXT,
  total_usage_charges DECIMAL(12,2),
  subscription_charges DECIMAL(12,2),
  total_charges DECIMAL(12,2),
  currency CHAR(3),
  invoice_id UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.tenant_id,
    bc.cycle_start,
    bc.cycle_end,
    bc.status,
    bc.total_usage_charges,
    bc.subscription_charges,
    bc.total_charges,
    bc.currency,
    bc.invoice_id,
    bc.processed_at,
    bc.created_at,
    bc.updated_at
  FROM public.billing_cycles bc
  WHERE bc.tenant_id = p_tenant_id
    AND bc.cycle_start <= NOW()
    AND bc.cycle_end >= NOW()
    AND bc.status = 'active'
  ORDER BY bc.cycle_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create monthly billing cycles for all active tenants
CREATE OR REPLACE FUNCTION public.create_monthly_billing_cycles()
RETURNS INTEGER AS $$
DECLARE
  tenant_record RECORD;
  cycle_start TIMESTAMPTZ;
  cycle_end TIMESTAMPTZ;
  cycles_created INTEGER := 0;
BEGIN
  -- Calculate next month's cycle dates
  cycle_start := date_trunc('month', NOW() + INTERVAL '1 month');
  cycle_end := cycle_start + INTERVAL '1 month' - INTERVAL '1 second';
  
  -- Create billing cycles for all active tenants that don't have one for next month
  FOR tenant_record IN 
    SELECT t.id, t.name
    FROM public.tenants t
    WHERE t.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM public.billing_cycles bc
        WHERE bc.tenant_id = t.id
          AND bc.cycle_start = cycle_start
      )
  LOOP
    INSERT INTO public.billing_cycles (
      tenant_id,
      cycle_start,
      cycle_end,
      status,
      currency
    )
    VALUES (
      tenant_record.id,
      cycle_start,
      cycle_end,
      'active',
      'BRL'
    );
    
    cycles_created := cycles_created + 1;
  END LOOP;
  
  RETURN cycles_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate usage charges for a billing period
CREATE OR REPLACE FUNCTION public.calculate_usage_charges(
  p_tenant_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  event_type TEXT,
  total_quantity INTEGER,
  billable_quantity INTEGER,
  rate_per_unit DECIMAL(10,6),
  total_charge DECIMAL(12,2)
) AS $$
DECLARE
  tenant_subscription JSONB;
  subscription_plan TEXT;
  free_allowances JSONB;
  billing_rates JSONB;
BEGIN
  -- Get tenant subscription info
  SELECT t.subscription INTO tenant_subscription
  FROM public.tenants t
  WHERE t.id = p_tenant_id;
  
  subscription_plan := tenant_subscription->>'plan';
  
  -- Define free allowances by plan
  free_allowances := jsonb_build_object(
    'starter', jsonb_build_object(
      'api_call', 1000,
      'whatsapp_message_sent', 100,
      'whatsapp_message_received', 500,
      'email_sent', 1000,
      'sms_sent', 50,
      'contract_generated', 50,
      'invoice_created', 100,
      'storage_used', 10,
      'report_generated', 25,
      'webhook_delivered', 1000
    ),
    'professional', jsonb_build_object(
      'api_call', 5000,
      'whatsapp_message_sent', 500,
      'whatsapp_message_received', 2500,
      'email_sent', 5000,
      'sms_sent', 250,
      'contract_generated', 250,
      'invoice_created', 500,
      'storage_used', 50,
      'report_generated', 125,
      'webhook_delivered', 5000
    ),
    'enterprise', jsonb_build_object(
      'api_call', 25000,
      'whatsapp_message_sent', 2500,
      'whatsapp_message_received', 12500,
      'email_sent', 25000,
      'sms_sent', 1250,
      'contract_generated', 1250,
      'invoice_created', 2500,
      'storage_used', 200,
      'report_generated', 625,
      'webhook_delivered', 25000
    )
  );
  
  -- Define billing rates by plan
  billing_rates := jsonb_build_object(
    'starter', jsonb_build_object(
      'api_call', 0.001,
      'whatsapp_message_sent', 0.05,
      'whatsapp_message_received', 0.02,
      'email_sent', 0.01,
      'sms_sent', 0.08,
      'contract_generated', 0.50,
      'invoice_created', 0.25,
      'storage_used', 0.10,
      'report_generated', 0.15,
      'webhook_delivered', 0.002
    ),
    'professional', jsonb_build_object(
      'api_call', 0.0008,
      'whatsapp_message_sent', 0.04,
      'whatsapp_message_received', 0.015,
      'email_sent', 0.008,
      'sms_sent', 0.06,
      'contract_generated', 0.40,
      'invoice_created', 0.20,
      'storage_used', 0.08,
      'report_generated', 0.12,
      'webhook_delivered', 0.0015
    ),
    'enterprise', jsonb_build_object(
      'api_call', 0.0005,
      'whatsapp_message_sent', 0.03,
      'whatsapp_message_received', 0.01,
      'email_sent', 0.005,
      'sms_sent', 0.04,
      'contract_generated', 0.30,
      'invoice_created', 0.15,
      'storage_used', 0.05,
      'report_generated', 0.08,
      'webhook_delivered', 0.001
    )
  );
  
  -- Calculate charges for each event type with usage
  RETURN QUERY
  WITH usage_aggregated AS (
    SELECT 
      ue.event_type,
      SUM(ue.quantity) as total_qty
    FROM public.usage_events ue
    WHERE ue.tenant_id = p_tenant_id
      AND ue.timestamp >= p_period_start
      AND ue.timestamp <= p_period_end
    GROUP BY ue.event_type
  )
  SELECT 
    ua.event_type,
    ua.total_qty::INTEGER as total_quantity,
    GREATEST(0, ua.total_qty - COALESCE((free_allowances->subscription_plan->>ua.event_type)::INTEGER, 0))::INTEGER as billable_quantity,
    COALESCE((billing_rates->subscription_plan->>ua.event_type)::DECIMAL(10,6), 0) as rate_per_unit,
    (GREATEST(0, ua.total_qty - COALESCE((free_allowances->subscription_plan->>ua.event_type)::INTEGER, 0)) * 
     COALESCE((billing_rates->subscription_plan->>ua.event_type)::DECIMAL(10,6), 0))::DECIMAL(12,2) as total_charge
  FROM usage_aggregated ua
  ORDER BY ua.event_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_rates_updated_at
  BEFORE UPDATE ON public.billing_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_summaries_updated_at
  BEFORE UPDATE ON public.usage_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_cycles_updated_at
  BEFORE UPDATE ON public.billing_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default billing rates for all plans
INSERT INTO public.billing_rates (event_type, rate_per_unit, currency, subscription_plan, tier_start, tier_end) VALUES
-- Starter plan rates
('api_call', 0.001, 'BRL', 'starter', 1000, NULL),
('whatsapp_message_sent', 0.05, 'BRL', 'starter', 100, NULL),
('whatsapp_message_received', 0.02, 'BRL', 'starter', 500, NULL),
('email_sent', 0.01, 'BRL', 'starter', 1000, NULL),
('sms_sent', 0.08, 'BRL', 'starter', 50, NULL),
('contract_generated', 0.50, 'BRL', 'starter', 50, NULL),
('invoice_created', 0.25, 'BRL', 'starter', 100, NULL),
('storage_used', 0.10, 'BRL', 'starter', 10, NULL),
('report_generated', 0.15, 'BRL', 'starter', 25, NULL),
('webhook_delivered', 0.002, 'BRL', 'starter', 1000, NULL),

-- Professional plan rates
('api_call', 0.0008, 'BRL', 'professional', 5000, NULL),
('whatsapp_message_sent', 0.04, 'BRL', 'professional', 500, NULL),
('whatsapp_message_received', 0.015, 'BRL', 'professional', 2500, NULL),
('email_sent', 0.008, 'BRL', 'professional', 5000, NULL),
('sms_sent', 0.06, 'BRL', 'professional', 250, NULL),
('contract_generated', 0.40, 'BRL', 'professional', 250, NULL),
('invoice_created', 0.20, 'BRL', 'professional', 500, NULL),
('storage_used', 0.08, 'BRL', 'professional', 50, NULL),
('report_generated', 0.12, 'BRL', 'professional', 125, NULL),
('webhook_delivered', 0.0015, 'BRL', 'professional', 5000, NULL),

-- Enterprise plan rates
('api_call', 0.0005, 'BRL', 'enterprise', 25000, NULL),
('whatsapp_message_sent', 0.03, 'BRL', 'enterprise', 2500, NULL),
('whatsapp_message_received', 0.01, 'BRL', 'enterprise', 12500, NULL),
('email_sent', 0.005, 'BRL', 'enterprise', 25000, NULL),
('sms_sent', 0.04, 'BRL', 'enterprise', 1250, NULL),
('contract_generated', 0.30, 'BRL', 'enterprise', 1250, NULL),
('invoice_created', 0.15, 'BRL', 'enterprise', 2500, NULL),
('storage_used', 0.05, 'BRL', 'enterprise', 200, NULL),
('report_generated', 0.08, 'BRL', 'enterprise', 625, NULL),
('webhook_delivered', 0.001, 'BRL', 'enterprise', 25000, NULL);

-- Add comments for documentation
COMMENT ON TABLE public.usage_events IS 'Detailed tracking of all billable usage events across the platform';
COMMENT ON TABLE public.billing_rates IS 'Configurable pricing rates for different usage event types and subscription tiers';
COMMENT ON TABLE public.usage_summaries IS 'Aggregated usage data for billing periods with calculated charges';
COMMENT ON TABLE public.billing_cycles IS 'Monthly billing cycles tracking subscription and usage charges';

COMMENT ON COLUMN public.usage_events.event_type IS 'Type of billable event that occurred';
COMMENT ON COLUMN public.usage_events.quantity IS 'Number of units consumed for this event';
COMMENT ON COLUMN public.usage_events.metadata IS 'Additional context about the usage event';

COMMENT ON COLUMN public.billing_rates.tier_start IS 'Starting quantity for this pricing tier (inclusive)';
COMMENT ON COLUMN public.billing_rates.tier_end IS 'Ending quantity for this pricing tier (exclusive), NULL for unlimited';
COMMENT ON COLUMN public.billing_rates.rate_per_unit IS 'Price per unit in the specified currency';

COMMENT ON COLUMN public.usage_summaries.billable_quantity IS 'Quantity subject to charges after free tier allowances';
COMMENT ON COLUMN public.usage_summaries.tier_breakdown IS 'JSON array showing charges across different pricing tiers';

COMMENT ON COLUMN public.billing_cycles.total_usage_charges IS 'Total charges from usage-based billing';
COMMENT ON COLUMN public.billing_cycles.subscription_charges IS 'Base subscription plan charges';
COMMENT ON COLUMN public.billing_cycles.total_charges IS 'Combined subscription and usage charges';