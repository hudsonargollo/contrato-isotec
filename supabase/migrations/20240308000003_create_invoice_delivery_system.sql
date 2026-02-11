-- Migration: Create Invoice Delivery System
-- Description: Creates tables for automated invoice delivery, email logs, and payment tokens
-- Requirements: 4.4 - Automated invoice delivery system

-- Create email_logs table for tracking email deliveries
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Email Details
  message_id TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]',
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'resend',
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT email_logs_valid_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained'))
);

-- Create pdf_generation_logs table for tracking PDF generation
CREATE TABLE public.pdf_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Resource Information
  resource_type TEXT NOT NULL DEFAULT 'invoice',
  resource_id UUID NOT NULL,
  
  -- File Details
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  
  -- Generation Status
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Timing
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT pdf_logs_valid_status CHECK (status IN ('pending', 'success', 'failed')),
  CONSTRAINT pdf_logs_valid_resource_type CHECK (resource_type IN ('invoice', 'contract', 'report'))
);

-- Create invoice_payment_tokens table for secure public access
CREATE TABLE public.invoice_payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Token Details
  token TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT payment_tokens_valid_email CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create scheduled_deliveries table for scheduled invoice deliveries
CREATE TABLE public.scheduled_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Delivery Configuration
  delivery_options JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurring_config JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT scheduled_deliveries_valid_status CHECK (status IN ('scheduled', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create tenant_settings table for delivery preferences
CREATE TABLE public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Delivery Preferences
  delivery_preferences JSONB DEFAULT '{}',
  
  -- Email Settings
  email_settings JSONB DEFAULT '{}',
  
  -- Payment Settings
  payment_settings JSONB DEFAULT '{}',
  
  -- Notification Settings
  notification_settings JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create notification_logs table for tracking notifications
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Notification Details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT notification_logs_valid_resource_type CHECK (resource_type IN ('invoice', 'contract', 'lead', 'payment'))
);

-- Create indexes for performance
CREATE INDEX idx_email_logs_tenant ON public.email_logs(tenant_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(tenant_id, status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(tenant_id, created_at);
CREATE INDEX idx_email_logs_message_id ON public.email_logs(message_id);

CREATE INDEX idx_pdf_logs_tenant ON public.pdf_generation_logs(tenant_id);
CREATE INDEX idx_pdf_logs_resource ON public.pdf_generation_logs(tenant_id, resource_type, resource_id);
CREATE INDEX idx_pdf_logs_status ON public.pdf_generation_logs(tenant_id, status);

CREATE INDEX idx_payment_tokens_token ON public.invoice_payment_tokens(token);
CREATE INDEX idx_payment_tokens_invoice ON public.invoice_payment_tokens(invoice_id);
CREATE INDEX idx_payment_tokens_expires ON public.invoice_payment_tokens(expires_at);

CREATE INDEX idx_scheduled_deliveries_tenant ON public.scheduled_deliveries(tenant_id);
CREATE INDEX idx_scheduled_deliveries_invoice ON public.scheduled_deliveries(invoice_id);
CREATE INDEX idx_scheduled_deliveries_scheduled_at ON public.scheduled_deliveries(scheduled_at);
CREATE INDEX idx_scheduled_deliveries_status ON public.scheduled_deliveries(tenant_id, status);

CREATE INDEX idx_tenant_settings_tenant ON public.tenant_settings(tenant_id);

CREATE INDEX idx_notification_logs_tenant ON public.notification_logs(tenant_id);
CREATE INDEX idx_notification_logs_resource ON public.notification_logs(tenant_id, resource_type, resource_id);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(tenant_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_email_logs ON public.email_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_pdf_logs ON public.pdf_generation_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_payment_tokens ON public.invoice_payment_tokens
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_scheduled_deliveries ON public.scheduled_deliveries
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_tenant_settings ON public.tenant_settings
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_notification_logs ON public.notification_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired payment tokens
CREATE OR REPLACE FUNCTION cleanup_expired_payment_tokens()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.invoice_payment_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Create function to process scheduled deliveries
CREATE OR REPLACE FUNCTION get_due_scheduled_deliveries()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  invoice_id UUID,
  delivery_options JSONB,
  created_by UUID
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    sd.id,
    sd.tenant_id,
    sd.invoice_id,
    sd.delivery_options,
    sd.created_by
  FROM public.scheduled_deliveries sd
  WHERE sd.status = 'scheduled'
    AND sd.scheduled_at <= NOW()
  ORDER BY sd.scheduled_at ASC;
END;
$ LANGUAGE plpgsql;

-- Create function to generate payment token
CREATE OR REPLACE FUNCTION generate_payment_token(
  p_invoice_id UUID,
  p_customer_email TEXT,
  p_expires_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $
DECLARE
  token TEXT;
  tenant_uuid UUID;
BEGIN
  -- Get tenant_id from invoice
  SELECT tenant_id INTO tenant_uuid
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  -- Generate secure token
  token := encode(gen_random_bytes(32), 'base64');
  token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
  
  -- Insert token
  INSERT INTO public.invoice_payment_tokens (
    tenant_id,
    invoice_id,
    token,
    customer_email,
    expires_at
  ) VALUES (
    tenant_uuid,
    p_invoice_id,
    token,
    p_customer_email,
    NOW() + (p_expires_hours || ' hours')::INTERVAL
  );
  
  RETURN token;
END;
$ LANGUAGE plpgsql;

-- Create function to validate payment token
CREATE OR REPLACE FUNCTION validate_payment_token(
  p_token TEXT,
  p_invoice_id UUID
)
RETURNS BOOLEAN AS $
DECLARE
  token_valid BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.invoice_payment_tokens
    WHERE token = p_token
      AND invoice_id = p_invoice_id
      AND expires_at > NOW()
      AND used_at IS NULL
  ) INTO token_valid;
  
  RETURN token_valid;
END;
$ LANGUAGE plpgsql;

-- Create function to mark token as used
CREATE OR REPLACE FUNCTION use_payment_token(
  p_token TEXT,
  p_invoice_id UUID
)
RETURNS BOOLEAN AS $
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.invoice_payment_tokens
  SET used_at = NOW()
  WHERE token = p_token
    AND invoice_id = p_invoice_id
    AND expires_at > NOW()
    AND used_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$ LANGUAGE plpgsql;

-- Insert default tenant settings for existing tenants
INSERT INTO public.tenant_settings (tenant_id, delivery_preferences, email_settings, payment_settings, notification_settings)
SELECT 
  t.id as tenant_id,
  '{
    "auto_send_new_invoices": false,
    "send_payment_reminders": true,
    "reminder_days_before_due": [7, 3, 1],
    "send_overdue_notices": true,
    "overdue_notice_frequency": 7,
    "include_pdf_attachment": true,
    "include_payment_link": true
  }'::jsonb as delivery_preferences,
  '{
    "from_name": "' || t.name || '",
    "reply_to": null,
    "custom_templates": {}
  }'::jsonb as email_settings,
  '{
    "enabled_methods": ["credit_card", "bank_transfer"],
    "default_currency": "BRL",
    "payment_terms": "30 days"
  }'::jsonb as payment_settings,
  '{
    "email_notifications": true,
    "in_app_notifications": true,
    "webhook_notifications": false
  }'::jsonb as notification_settings
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_settings ts 
  WHERE ts.tenant_id = t.id
);

-- Create view for invoice delivery status
CREATE VIEW public.invoice_delivery_status AS
SELECT 
  i.id as invoice_id,
  i.tenant_id,
  i.invoice_number,
  i.status as invoice_status,
  i.sent_at,
  i.sent_to,
  i.delivery_method,
  
  -- Latest delivery log
  ldl.id as latest_delivery_id,
  ldl.status as latest_delivery_status,
  ldl.delivered_at as latest_delivered_at,
  ldl.failed_recipients as latest_failed_recipients,
  
  -- Delivery counts
  (SELECT COUNT(*) FROM public.invoice_delivery_logs dl WHERE dl.invoice_id = i.id) as total_deliveries,
  (SELECT COUNT(*) FROM public.invoice_delivery_logs dl WHERE dl.invoice_id = i.id AND dl.status = 'sent') as successful_deliveries,
  (SELECT COUNT(*) FROM public.invoice_delivery_logs dl WHERE dl.invoice_id = i.id AND dl.status = 'failed') as failed_deliveries,
  
  -- Payment token status
  (SELECT COUNT(*) FROM public.invoice_payment_tokens pt WHERE pt.invoice_id = i.id AND pt.expires_at > NOW()) as active_payment_tokens

FROM public.invoices i
LEFT JOIN LATERAL (
  SELECT * FROM public.invoice_delivery_logs dl
  WHERE dl.invoice_id = i.id
  ORDER BY dl.created_at DESC
  LIMIT 1
) ldl ON true;

-- Grant necessary permissions
GRANT SELECT ON public.invoice_delivery_status TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_payment_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_scheduled_deliveries() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_payment_token(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_payment_token(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_payment_token(TEXT, UUID) TO authenticated;