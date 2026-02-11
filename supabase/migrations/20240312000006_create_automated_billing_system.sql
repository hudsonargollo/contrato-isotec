-- Migration: Create Automated Billing System
-- Description: Creates tables and functions for automated billing, payments, and Stripe integration
-- Requirements: 9.3, 9.4 - Automated billing and payments

-- Create payment_methods table for storing tenant payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'pix')),
  last_four TEXT,
  brand TEXT,
  exp_month INTEGER CHECK (exp_month >= 1 AND exp_month <= 12),
  exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique Stripe payment method IDs
  CONSTRAINT unique_stripe_payment_method UNIQUE (stripe_payment_method_id),
  
  -- Ensure only one default payment method per tenant
  CONSTRAINT unique_default_payment_method EXCLUDE (tenant_id WITH =) WHERE (is_default = TRUE)
);

-- Create billing_invoices table for internal invoice management
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  billing_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE CASCADE NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_due DECIMAL(12,2) NOT NULL CHECK (amount_due >= 0),
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure amount_paid doesn't exceed amount_due
  CONSTRAINT check_payment_amount CHECK (amount_paid <= amount_due)
);

-- Create payment_transactions table for tracking individual payment attempts
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  payment_method_type TEXT NOT NULL,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_billing table for Stripe subscription management
CREATE TABLE IF NOT EXISTS public.subscription_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one active subscription per tenant
  CONSTRAINT unique_active_subscription EXCLUDE (tenant_id WITH =) WHERE (status IN ('active', 'trialing', 'past_due'))
);

-- Create indexes for performance
CREATE INDEX idx_payment_methods_tenant ON public.payment_methods(tenant_id);
CREATE INDEX idx_payment_methods_stripe_id ON public.payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON public.payment_methods(tenant_id, is_default) WHERE is_default = TRUE;

CREATE INDEX idx_billing_invoices_tenant ON public.billing_invoices(tenant_id);
CREATE INDEX idx_billing_invoices_cycle ON public.billing_invoices(billing_cycle_id);
CREATE INDEX idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX idx_billing_invoices_due_date ON public.billing_invoices(due_date);
CREATE INDEX idx_billing_invoices_retry ON public.billing_invoices(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_billing_invoices_stripe_id ON public.billing_invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

CREATE INDEX idx_payment_transactions_tenant ON public.payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_invoice ON public.payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_stripe_id ON public.payment_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX idx_subscription_billing_tenant ON public.subscription_billing(tenant_id);
CREATE INDEX idx_subscription_billing_stripe_sub ON public.subscription_billing(stripe_subscription_id);
CREATE INDEX idx_subscription_billing_stripe_customer ON public.subscription_billing(stripe_customer_id);
CREATE INDEX idx_subscription_billing_status ON public.subscription_billing(status);
CREATE INDEX idx_subscription_billing_period ON public.subscription_billing(current_period_start, current_period_end);

-- Enable Row Level Security
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_billing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods table
CREATE POLICY "Tenant users can manage own payment methods"
  ON public.payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = payment_methods.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for billing_invoices table
CREATE POLICY "Tenant users can view own billing invoices"
  ON public.billing_invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = billing_invoices.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can manage billing invoices"
  ON public.billing_invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = billing_invoices.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for payment_transactions table
CREATE POLICY "Tenant users can view own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = payment_transactions.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "System can manage payment transactions"
  ON public.payment_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = payment_transactions.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for subscription_billing table
CREATE POLICY "Tenant users can view own subscription billing"
  ON public.subscription_billing
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = subscription_billing.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can manage subscription billing"
  ON public.subscription_billing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = subscription_billing.tenant_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Function to automatically set default payment method
CREATE OR REPLACE FUNCTION public.set_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is being set as default, unset all other defaults for this tenant
  IF NEW.is_default = TRUE THEN
    UPDATE public.payment_methods 
    SET is_default = FALSE, updated_at = NOW()
    WHERE tenant_id = NEW.tenant_id 
      AND id != NEW.id 
      AND is_default = TRUE;
  END IF;
  
  -- If this is the first payment method for the tenant, make it default
  IF NEW.is_default = FALSE THEN
    PERFORM 1 FROM public.payment_methods 
    WHERE tenant_id = NEW.tenant_id 
      AND id != NEW.id;
    
    IF NOT FOUND THEN
      NEW.is_default = TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for default payment method management
CREATE TRIGGER set_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_default_payment_method();

-- Function to update invoice status based on payment transactions
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(12,2);
  invoice_amount DECIMAL(12,2);
BEGIN
  -- Get total paid amount for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payment_transactions
  WHERE invoice_id = NEW.invoice_id 
    AND status = 'succeeded';
  
  -- Get invoice amount
  SELECT amount_due INTO invoice_amount
  FROM public.billing_invoices
  WHERE id = NEW.invoice_id;
  
  -- Update invoice status and amount paid
  UPDATE public.billing_invoices
  SET 
    amount_paid = total_paid,
    status = CASE 
      WHEN total_paid >= invoice_amount THEN 'paid'
      WHEN total_paid > 0 THEN 'open'
      ELSE status
    END,
    paid_at = CASE 
      WHEN total_paid >= invoice_amount AND paid_at IS NULL THEN NOW()
      ELSE paid_at
    END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update invoice status when payment transactions change
CREATE TRIGGER update_invoice_payment_status_trigger
  AFTER INSERT OR UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_payment_status();

-- Function to get overdue invoices for retry
CREATE OR REPLACE FUNCTION public.get_overdue_invoices_for_retry()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  stripe_invoice_id TEXT,
  amount_due DECIMAL(12,2),
  retry_count INTEGER,
  next_retry_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id,
    bi.tenant_id,
    bi.stripe_invoice_id,
    bi.amount_due,
    bi.retry_count,
    bi.next_retry_at
  FROM public.billing_invoices bi
  WHERE bi.status = 'open'
    AND bi.payment_failure_reason IS NOT NULL
    AND bi.next_retry_at IS NOT NULL
    AND bi.next_retry_at <= NOW()
    AND bi.retry_count < 3
  ORDER BY bi.next_retry_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend tenants for non-payment
CREATE OR REPLACE FUNCTION public.suspend_tenants_for_nonpayment()
RETURNS INTEGER AS $$
DECLARE
  suspended_count INTEGER := 0;
  tenant_record RECORD;
BEGIN
  -- Find tenants with uncollectible invoices
  FOR tenant_record IN 
    SELECT DISTINCT bi.tenant_id
    FROM public.billing_invoices bi
    WHERE bi.status = 'uncollectible'
      AND EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.id = bi.tenant_id 
          AND t.status = 'active'
      )
  LOOP
    -- Suspend tenant
    UPDATE public.tenants
    SET 
      status = 'suspended',
      updated_at = NOW()
    WHERE id = tenant_record.tenant_id;
    
    suspended_count := suspended_count + 1;
  END LOOP;
  
  RETURN suspended_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate monthly recurring revenue (MRR)
CREATE OR REPLACE FUNCTION public.calculate_mrr()
RETURNS TABLE (
  plan TEXT,
  active_subscriptions INTEGER,
  mrr DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH subscription_plans AS (
    SELECT 
      t.subscription->>'plan' as plan,
      COUNT(*) as active_count,
      CASE 
        WHEN t.subscription->>'plan' = 'starter' THEN 99.00
        WHEN t.subscription->>'plan' = 'professional' THEN 299.00
        WHEN t.subscription->>'plan' = 'enterprise' THEN 999.00
        ELSE 0
      END as monthly_price
    FROM public.tenants t
    JOIN public.subscription_billing sb ON t.id = sb.tenant_id
    WHERE t.status = 'active'
      AND sb.status IN ('active', 'trialing')
    GROUP BY t.subscription->>'plan'
  )
  SELECT 
    sp.plan,
    sp.active_count::INTEGER,
    (sp.active_count * sp.monthly_price)::DECIMAL(12,2)
  FROM subscription_plans sp
  ORDER BY sp.monthly_price DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_billing_updated_at
  BEFORE UPDATE ON public.subscription_billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.payment_methods IS 'Tenant payment methods stored securely with Stripe integration';
COMMENT ON TABLE public.billing_invoices IS 'Internal invoice management with Stripe invoice integration';
COMMENT ON TABLE public.payment_transactions IS 'Individual payment transaction tracking and status';
COMMENT ON TABLE public.subscription_billing IS 'Stripe subscription management and billing cycles';

COMMENT ON COLUMN public.payment_methods.stripe_payment_method_id IS 'Stripe payment method ID for secure payment processing';
COMMENT ON COLUMN public.payment_methods.is_default IS 'Whether this is the default payment method for the tenant';

COMMENT ON COLUMN public.billing_invoices.stripe_invoice_id IS 'Stripe invoice ID for external payment processing';
COMMENT ON COLUMN public.billing_invoices.retry_count IS 'Number of payment retry attempts for failed payments';
COMMENT ON COLUMN public.billing_invoices.next_retry_at IS 'Scheduled time for next payment retry attempt';

COMMENT ON COLUMN public.payment_transactions.stripe_payment_intent_id IS 'Stripe payment intent ID for transaction tracking';
COMMENT ON COLUMN public.payment_transactions.failure_reason IS 'Reason for payment failure if transaction failed';

COMMENT ON COLUMN public.subscription_billing.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';
COMMENT ON COLUMN public.subscription_billing.trial_end IS 'End date of trial period if applicable';