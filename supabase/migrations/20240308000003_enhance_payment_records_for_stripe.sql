-- Migration: Enhance Payment Records for Stripe Integration
-- Description: Adds Stripe-specific fields and improves payment tracking
-- Requirements: 4.3 - Payment gateway integration and tracking

-- Add new columns to payment_records table for Stripe integration
ALTER TABLE public.payment_records 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS is_refund BOOLEAN DEFAULT false;

-- Create indexes for Stripe-specific fields
CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_payment_intent 
ON public.payment_records(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_charge 
ON public.payment_records(stripe_charge_id) 
WHERE stripe_charge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_customer 
ON public.payment_records(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_records_refunds 
ON public.payment_records(tenant_id, is_refund) 
WHERE is_refund = true;

-- Update payment_records constraints to include new payment methods
ALTER TABLE public.payment_records 
DROP CONSTRAINT IF EXISTS payment_records_valid_method;

ALTER TABLE public.payment_records 
ADD CONSTRAINT payment_records_valid_method 
CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'pix', 'boleto', 'cash', 'check', 'stripe'));

-- Create payment_reconciliation_logs table for tracking reconciliation activities
CREATE TABLE IF NOT EXISTS public.payment_reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Reconciliation Details
  reconciliation_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Results
  processed_payments INTEGER DEFAULT 0,
  failed_reconciliations INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed',
  errors JSONB DEFAULT '[]',
  
  -- Metadata
  gateway TEXT DEFAULT 'stripe',
  initiated_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT reconciliation_logs_valid_status CHECK (status IN ('pending', 'completed', 'failed', 'partial')),
  CONSTRAINT reconciliation_logs_valid_currency CHECK (currency IN ('BRL', 'USD', 'EUR')),
  CONSTRAINT reconciliation_logs_valid_counts CHECK (
    processed_payments >= 0 AND 
    failed_reconciliations >= 0
  )
);

-- Create indexes for reconciliation logs
CREATE INDEX idx_reconciliation_logs_tenant ON public.payment_reconciliation_logs(tenant_id);
CREATE INDEX idx_reconciliation_logs_date ON public.payment_reconciliation_logs(tenant_id, reconciliation_date);
CREATE INDEX idx_reconciliation_logs_status ON public.payment_reconciliation_logs(tenant_id, status);
CREATE INDEX idx_reconciliation_logs_gateway ON public.payment_reconciliation_logs(tenant_id, gateway);

-- Enable RLS for reconciliation logs
ALTER TABLE public.payment_reconciliation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reconciliation logs
CREATE POLICY tenant_isolation_reconciliation_logs ON public.payment_reconciliation_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create payment_gateway_webhooks table for tracking webhook events
CREATE TABLE IF NOT EXISTS public.payment_gateway_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Webhook Details
  gateway TEXT NOT NULL DEFAULT 'stripe',
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Processing Status
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Related Records
  payment_intent_id TEXT,
  invoice_id UUID REFERENCES public.invoices(id),
  payment_record_id UUID REFERENCES public.payment_records(id),
  
  -- Metadata
  signature_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT webhooks_valid_gateway CHECK (gateway IN ('stripe', 'paypal', 'mercadopago')),
  CONSTRAINT webhooks_valid_status CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
  CONSTRAINT webhooks_valid_retry_count CHECK (retry_count >= 0 AND retry_count <= 5)
);

-- Create indexes for webhook tracking
CREATE INDEX idx_webhooks_tenant ON public.payment_gateway_webhooks(tenant_id);
CREATE INDEX idx_webhooks_gateway ON public.payment_gateway_webhooks(gateway);
CREATE INDEX idx_webhooks_webhook_id ON public.payment_gateway_webhooks(webhook_id);
CREATE INDEX idx_webhooks_event_type ON public.payment_gateway_webhooks(event_type);
CREATE INDEX idx_webhooks_status ON public.payment_gateway_webhooks(tenant_id, status);
CREATE INDEX idx_webhooks_payment_intent ON public.payment_gateway_webhooks(payment_intent_id) 
WHERE payment_intent_id IS NOT NULL;
CREATE INDEX idx_webhooks_invoice ON public.payment_gateway_webhooks(invoice_id) 
WHERE invoice_id IS NOT NULL;
CREATE INDEX idx_webhooks_created_at ON public.payment_gateway_webhooks(created_at);

-- Enable RLS for webhooks
ALTER TABLE public.payment_gateway_webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for webhooks (allow system access for webhook processing)
CREATE POLICY tenant_isolation_webhooks ON public.payment_gateway_webhooks
  FOR ALL
  USING (
    tenant_id IS NULL OR 
    tenant_id = current_setting('app.current_tenant_id')::UUID OR
    current_setting('app.current_user_id', true) = 'system'
  );

-- Create trigger for webhook updated_at
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.payment_gateway_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update invoice status based on Stripe payments
CREATE OR REPLACE FUNCTION update_invoice_status_from_stripe()
RETURNS TRIGGER AS $
DECLARE
  invoice_total DECIMAL(12,2);
  paid_amount DECIMAL(12,2);
  refunded_amount DECIMAL(12,2);
  net_paid_amount DECIMAL(12,2);
  invoice_due_date DATE;
BEGIN
  -- Only process if this is a Stripe payment with an invoice_id
  IF NEW.stripe_payment_intent_id IS NOT NULL AND NEW.invoice_id IS NOT NULL THEN
    -- Get invoice details
    SELECT total_amount, due_date INTO invoice_total, invoice_due_date
    FROM public.invoices
    WHERE id = NEW.invoice_id;
    
    -- Calculate total paid amount (excluding refunds)
    SELECT COALESCE(SUM(amount), 0) INTO paid_amount
    FROM public.payment_records
    WHERE invoice_id = NEW.invoice_id
      AND status = 'completed'
      AND is_refund = false;
    
    -- Calculate total refunded amount
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO refunded_amount
    FROM public.payment_records
    WHERE invoice_id = NEW.invoice_id
      AND status = 'completed'
      AND is_refund = true;
    
    -- Calculate net paid amount
    net_paid_amount := paid_amount - refunded_amount;
    
    -- Update invoice status based on payment
    IF net_paid_amount >= invoice_total THEN
      UPDATE public.invoices
      SET status = 'paid'
      WHERE id = NEW.invoice_id;
    ELSIF net_paid_amount > 0 THEN
      UPDATE public.invoices
      SET status = 'sent' -- Partially paid
      WHERE id = NEW.invoice_id;
    ELSIF invoice_due_date < CURRENT_DATE THEN
      UPDATE public.invoices
      SET status = 'overdue'
      WHERE id = NEW.invoice_id
        AND status NOT IN ('paid', 'cancelled');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to update invoice status when Stripe payments are added
CREATE TRIGGER update_invoice_status_stripe_trigger
  AFTER INSERT OR UPDATE ON public.payment_records
  FOR EACH ROW 
  WHEN (NEW.stripe_payment_intent_id IS NOT NULL)
  EXECUTE FUNCTION update_invoice_status_from_stripe();

-- Create function to log webhook events
CREATE OR REPLACE FUNCTION log_webhook_event(
  p_tenant_id UUID,
  p_gateway TEXT,
  p_webhook_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB,
  p_payment_intent_id TEXT DEFAULT NULL,
  p_invoice_id UUID DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
  webhook_log_id UUID;
BEGIN
  INSERT INTO public.payment_gateway_webhooks (
    tenant_id,
    gateway,
    webhook_id,
    event_type,
    event_data,
    payment_intent_id,
    invoice_id,
    signature_verified,
    status
  ) VALUES (
    p_tenant_id,
    p_gateway,
    p_webhook_id,
    p_event_type,
    p_event_data,
    p_payment_intent_id,
    p_invoice_id,
    true, -- Assume signature is verified when calling this function
    'pending'
  ) RETURNING id INTO webhook_log_id;
  
  RETURN webhook_log_id;
END;
$ LANGUAGE plpgsql;

-- Create function to mark webhook as processed
CREATE OR REPLACE FUNCTION mark_webhook_processed(
  p_webhook_log_id UUID,
  p_payment_record_id UUID DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $
BEGIN
  UPDATE public.payment_gateway_webhooks
  SET 
    status = CASE WHEN p_error_message IS NULL THEN 'processed' ELSE 'failed' END,
    processed_at = NOW(),
    payment_record_id = p_payment_record_id,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_webhook_log_id;
END;
$ LANGUAGE plpgsql;

-- Insert sample reconciliation log for existing tenants (if any payments exist)
INSERT INTO public.payment_reconciliation_logs (
  tenant_id,
  reconciliation_date,
  processed_payments,
  failed_reconciliations,
  total_amount,
  status,
  gateway,
  initiated_by,
  metadata
)
SELECT 
  t.id as tenant_id,
  NOW() as reconciliation_date,
  0 as processed_payments,
  0 as failed_reconciliations,
  0.00 as total_amount,
  'completed' as status,
  'stripe' as gateway,
  (SELECT id FROM auth.users LIMIT 1) as initiated_by,
  '{"initial_setup": true, "note": "Initial reconciliation log created during Stripe integration setup"}'::jsonb as metadata
FROM public.tenants t
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_reconciliation_logs prl 
    WHERE prl.tenant_id = t.id
  );

-- Add helpful comments
COMMENT ON TABLE public.payment_reconciliation_logs IS 'Tracks payment reconciliation activities between Stripe and local database';
COMMENT ON TABLE public.payment_gateway_webhooks IS 'Logs webhook events from payment gateways for audit and debugging';
COMMENT ON COLUMN public.payment_records.stripe_payment_intent_id IS 'Stripe Payment Intent ID for tracking';
COMMENT ON COLUMN public.payment_records.stripe_charge_id IS 'Stripe Charge ID for the actual charge';
COMMENT ON COLUMN public.payment_records.stripe_customer_id IS 'Stripe Customer ID if customer exists';
COMMENT ON COLUMN public.payment_records.is_refund IS 'Indicates if this record represents a refund (negative amount)';
COMMENT ON FUNCTION log_webhook_event IS 'Logs incoming webhook events from payment gateways';
COMMENT ON FUNCTION mark_webhook_processed IS 'Marks a webhook event as processed or failed';