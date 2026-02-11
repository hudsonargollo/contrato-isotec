-- Migration: Create contract lifecycle tracking system
-- Description: Contract status management, renewal tracking, and lifecycle analytics
-- Requirements: 7.4 - Contract lifecycle tracking

-- Create contract lifecycle events table
CREATE TABLE IF NOT EXISTS public.contract_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Contract Reference
  contract_id UUID REFERENCES public.generated_contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Event Information
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Audit Fields
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'created', 'approved', 'sent_for_signature', 'partially_signed', 
    'fully_signed', 'expired', 'renewed', 'cancelled', 'archived'
  ))
);

-- Create contract renewal alerts table
CREATE TABLE IF NOT EXISTS public.contract_renewal_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Contract Reference
  contract_id UUID REFERENCES public.generated_contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert Information
  alert_type TEXT NOT NULL DEFAULT 'warning',
  days_until_renewal INTEGER NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  
  -- Alert Configuration
  alert_threshold_days INTEGER DEFAULT 30,
  auto_generated BOOLEAN DEFAULT TRUE,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('warning', 'urgent', 'overdue')),
  CONSTRAINT valid_days_until_renewal CHECK (days_until_renewal >= -365 AND days_until_renewal <= 365)
);

-- Create contract expiration alerts table
CREATE TABLE IF NOT EXISTS public.contract_expiration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Contract Reference
  contract_id UUID REFERENCES public.generated_contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert Information
  alert_type TEXT NOT NULL DEFAULT 'warning',
  days_until_expiration INTEGER NOT NULL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  
  -- Alert Configuration
  alert_threshold_days INTEGER DEFAULT 30,
  auto_generated BOOLEAN DEFAULT TRUE,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_expiration_alert_type CHECK (alert_type IN ('warning', 'urgent', 'expired')),
  CONSTRAINT valid_days_until_expiration CHECK (days_until_expiration >= -365 AND days_until_expiration <= 365)
);

-- Create contract lifecycle analytics view
CREATE OR REPLACE VIEW public.contract_lifecycle_analytics AS
SELECT 
  gc.tenant_id,
  gc.id as contract_id,
  gc.contract_number,
  gc.status,
  gc.signature_status,
  gc.created_at,
  gc.signed_at,
  gc.expires_at,
  gc.renewal_date,
  
  -- Calculate lifecycle metrics
  CASE 
    WHEN gc.signed_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (gc.signed_at - gc.created_at)) / 86400.0
    ELSE NULL 
  END as signing_duration_days,
  
  CASE 
    WHEN gc.expires_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (gc.expires_at - NOW())) / 86400.0
    ELSE NULL 
  END as days_until_expiration,
  
  CASE 
    WHEN gc.renewal_date IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (gc.renewal_date - NOW())) / 86400.0
    ELSE NULL 
  END as days_until_renewal,
  
  -- Status flags
  CASE WHEN gc.expires_at < NOW() THEN TRUE ELSE FALSE END as is_expired,
  CASE WHEN gc.renewal_date < NOW() THEN TRUE ELSE FALSE END as is_renewal_overdue,
  CASE WHEN gc.signature_status = 'fully_signed' THEN TRUE ELSE FALSE END as is_fully_signed,
  
  -- Template information
  ct.name as template_name,
  ct.category as template_category,
  
  -- Customer information
  COALESCE(gc.customer_data->>'name', l.contact_info->>'name') as customer_name,
  COALESCE(gc.customer_data->>'email', l.contact_info->>'email') as customer_email

FROM public.generated_contracts gc
LEFT JOIN public.contract_templates ct ON gc.template_id = ct.id
LEFT JOIN public.leads l ON gc.customer_id = l.id;

-- Enable Row Level Security
ALTER TABLE public.contract_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_renewal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_expiration_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contract lifecycle events
CREATE POLICY tenant_isolation_contract_lifecycle_events ON public.contract_lifecycle_events
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for renewal alerts
CREATE POLICY tenant_isolation_contract_renewal_alerts ON public.contract_renewal_alerts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for expiration alerts
CREATE POLICY tenant_isolation_contract_expiration_alerts ON public.contract_expiration_alerts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create indexes for performance
CREATE INDEX idx_contract_lifecycle_events_tenant_id ON public.contract_lifecycle_events(tenant_id);
CREATE INDEX idx_contract_lifecycle_events_contract_id ON public.contract_lifecycle_events(contract_id);
CREATE INDEX idx_contract_lifecycle_events_event_type ON public.contract_lifecycle_events(event_type);
CREATE INDEX idx_contract_lifecycle_events_created_at ON public.contract_lifecycle_events(created_at DESC);

CREATE INDEX idx_contract_renewal_alerts_tenant_id ON public.contract_renewal_alerts(tenant_id);
CREATE INDEX idx_contract_renewal_alerts_contract_id ON public.contract_renewal_alerts(contract_id);
CREATE INDEX idx_contract_renewal_alerts_alert_type ON public.contract_renewal_alerts(alert_type);
CREATE INDEX idx_contract_renewal_alerts_days_until_renewal ON public.contract_renewal_alerts(days_until_renewal);
CREATE INDEX idx_contract_renewal_alerts_is_acknowledged ON public.contract_renewal_alerts(is_acknowledged);

CREATE INDEX idx_contract_expiration_alerts_tenant_id ON public.contract_expiration_alerts(tenant_id);
CREATE INDEX idx_contract_expiration_alerts_contract_id ON public.contract_expiration_alerts(contract_id);
CREATE INDEX idx_contract_expiration_alerts_alert_type ON public.contract_expiration_alerts(alert_type);
CREATE INDEX idx_contract_expiration_alerts_days_until_expiration ON public.contract_expiration_alerts(days_until_expiration);
CREATE INDEX idx_contract_expiration_alerts_is_acknowledged ON public.contract_expiration_alerts(is_acknowledged);

-- Create updated_at trigger for renewal alerts
CREATE TRIGGER contract_renewal_alerts_updated_at
  BEFORE UPDATE ON public.contract_renewal_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create updated_at trigger for expiration alerts
CREATE TRIGGER contract_expiration_alerts_updated_at
  BEFORE UPDATE ON public.contract_expiration_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create renewal alerts
CREATE OR REPLACE FUNCTION public.create_contract_renewal_alerts()
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  alert_exists BOOLEAN;
  days_until_renewal INTEGER;
  alert_type TEXT;
BEGIN
  -- Process contracts with renewal dates
  FOR contract_record IN 
    SELECT 
      id, 
      tenant_id, 
      contract_number, 
      renewal_date,
      status
    FROM public.generated_contracts 
    WHERE renewal_date IS NOT NULL 
      AND status IN ('signed', 'approved')
      AND renewal_date >= CURRENT_DATE - INTERVAL '30 days'
      AND renewal_date <= CURRENT_DATE + INTERVAL '90 days'
  LOOP
    -- Calculate days until renewal
    days_until_renewal := EXTRACT(EPOCH FROM (contract_record.renewal_date - CURRENT_DATE)) / 86400;
    
    -- Determine alert type
    IF days_until_renewal <= 0 THEN
      alert_type := 'overdue';
    ELSIF days_until_renewal <= 7 THEN
      alert_type := 'urgent';
    ELSE
      alert_type := 'warning';
    END IF;
    
    -- Check if alert already exists for this contract
    SELECT EXISTS(
      SELECT 1 FROM public.contract_renewal_alerts 
      WHERE contract_id = contract_record.id 
        AND is_acknowledged = FALSE
    ) INTO alert_exists;
    
    -- Create alert if it doesn't exist
    IF NOT alert_exists THEN
      INSERT INTO public.contract_renewal_alerts (
        tenant_id,
        contract_id,
        alert_type,
        days_until_renewal,
        alert_threshold_days,
        auto_generated
      ) VALUES (
        contract_record.tenant_id,
        contract_record.id,
        alert_type,
        days_until_renewal,
        30,
        TRUE
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create expiration alerts
CREATE OR REPLACE FUNCTION public.create_contract_expiration_alerts()
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  alert_exists BOOLEAN;
  days_until_expiration INTEGER;
  alert_type TEXT;
BEGIN
  -- Process contracts with expiration dates
  FOR contract_record IN 
    SELECT 
      id, 
      tenant_id, 
      contract_number, 
      expires_at,
      status
    FROM public.generated_contracts 
    WHERE expires_at IS NOT NULL 
      AND status NOT IN ('expired', 'cancelled')
      AND expires_at >= CURRENT_DATE - INTERVAL '30 days'
      AND expires_at <= CURRENT_DATE + INTERVAL '90 days'
  LOOP
    -- Calculate days until expiration
    days_until_expiration := EXTRACT(EPOCH FROM (contract_record.expires_at - CURRENT_DATE)) / 86400;
    
    -- Determine alert type
    IF days_until_expiration <= 0 THEN
      alert_type := 'expired';
    ELSIF days_until_expiration <= 7 THEN
      alert_type := 'urgent';
    ELSE
      alert_type := 'warning';
    END IF;
    
    -- Check if alert already exists for this contract
    SELECT EXISTS(
      SELECT 1 FROM public.contract_expiration_alerts 
      WHERE contract_id = contract_record.id 
        AND is_acknowledged = FALSE
    ) INTO alert_exists;
    
    -- Create alert if it doesn't exist
    IF NOT alert_exists THEN
      INSERT INTO public.contract_expiration_alerts (
        tenant_id,
        contract_id,
        alert_type,
        days_until_expiration,
        alert_threshold_days,
        auto_generated
      ) VALUES (
        contract_record.tenant_id,
        contract_record.id,
        alert_type,
        days_until_expiration,
        30,
        TRUE
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update contract status based on expiration
CREATE OR REPLACE FUNCTION public.auto_expire_contracts()
RETURNS void AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Update contracts that have passed their expiration date
  UPDATE public.generated_contracts 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE expires_at < NOW() 
    AND status NOT IN ('expired', 'cancelled', 'signed')
    AND expires_at IS NOT NULL;
    
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the expiration events
  INSERT INTO public.contract_lifecycle_events (
    tenant_id,
    contract_id,
    event_type,
    previous_status,
    new_status,
    event_data,
    triggered_by
  )
  SELECT 
    gc.tenant_id,
    gc.id,
    'expired',
    'approved', -- Most likely previous status
    'expired',
    jsonb_build_object(
      'auto_expired', true,
      'expired_at', NOW(),
      'original_expiration', gc.expires_at
    ),
    '00000000-0000-0000-0000-000000000000'::UUID -- System user
  FROM public.generated_contracts gc
  WHERE gc.expires_at < NOW() 
    AND gc.status = 'expired'
    AND gc.updated_at >= NOW() - INTERVAL '1 minute'; -- Recently updated
    
  RAISE NOTICE 'Auto-expired % contracts', expired_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.contract_lifecycle_events IS 'Tracks all contract lifecycle events and status changes';
COMMENT ON COLUMN public.contract_lifecycle_events.event_type IS 'Type of lifecycle event (created, approved, signed, etc.)';
COMMENT ON COLUMN public.contract_lifecycle_events.event_data IS 'Additional data related to the lifecycle event';

COMMENT ON TABLE public.contract_renewal_alerts IS 'Alerts for contracts approaching renewal dates';
COMMENT ON COLUMN public.contract_renewal_alerts.alert_type IS 'Urgency level of the renewal alert';
COMMENT ON COLUMN public.contract_renewal_alerts.days_until_renewal IS 'Number of days until contract renewal (negative if overdue)';

COMMENT ON TABLE public.contract_expiration_alerts IS 'Alerts for contracts approaching expiration dates';
COMMENT ON COLUMN public.contract_expiration_alerts.alert_type IS 'Urgency level of the expiration alert';
COMMENT ON COLUMN public.contract_expiration_alerts.days_until_expiration IS 'Number of days until contract expiration (negative if expired)';

COMMENT ON VIEW public.contract_lifecycle_analytics IS 'Analytics view for contract lifecycle metrics and KPIs';

COMMENT ON FUNCTION public.create_contract_renewal_alerts() IS 'Automatically creates renewal alerts for contracts approaching renewal dates';
COMMENT ON FUNCTION public.create_contract_expiration_alerts() IS 'Automatically creates expiration alerts for contracts approaching expiration dates';
COMMENT ON FUNCTION public.auto_expire_contracts() IS 'Automatically updates contract status to expired when expiration date is reached';