-- Migration: Create Invoice Management System v2
-- Description: Creates invoice, payment, and template management tables (fixed version)
-- Requirements: 4.1, 4.2, 4.3, 4.4 - Invoice Management System

-- Drop existing objects if they exist to start fresh
DROP TABLE IF EXISTS public.invoice_delivery_logs CASCADE;
DROP TABLE IF EXISTS public.invoice_approval_workflows CASCADE;
DROP TABLE IF EXISTS public.payment_records CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.invoice_templates CASCADE;

-- Create invoice_templates table for customizable invoice templates
CREATE TABLE public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Template Information
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  
  -- Template Content
  template_html TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]',
  
  -- Styling and Branding
  header_logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#64748b',
  font_family TEXT DEFAULT 'Inter, sans-serif',
  custom_css TEXT,
  
  -- Layout Configuration
  show_company_info BOOLEAN DEFAULT true,
  show_customer_address BOOLEAN DEFAULT true,
  show_payment_terms BOOLEAN DEFAULT true,
  show_notes BOOLEAN DEFAULT true,
  show_footer BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  CONSTRAINT invoice_templates_unique_tenant_name UNIQUE (tenant_id, name)
);

-- Create partial unique constraint for default templates
CREATE UNIQUE INDEX invoice_templates_unique_default 
ON public.invoice_templates (tenant_id) 
WHERE is_default = true;

-- Create invoices table for invoice management
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Invoice Identification
  invoice_number TEXT NOT NULL,
  reference_number TEXT,
  
  -- Customer Information
  customer_id UUID REFERENCES public.leads(id), -- Can reference leads as customers
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address JSONB,
  
  -- Related Records
  contract_id UUID, -- Will reference contracts table when implemented
  lead_id UUID REFERENCES public.leads(id),
  
  -- Invoice Details
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'BRL',
  
  -- Payment Terms
  payment_terms TEXT DEFAULT '30 days',
  due_date DATE NOT NULL,
  payment_instructions TEXT,
  
  -- Status and Workflow
  status TEXT NOT NULL DEFAULT 'draft',
  approval_status TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Delivery Information
  sent_at TIMESTAMPTZ,
  sent_to JSONB DEFAULT '[]',
  delivery_method TEXT,
  
  -- Template and Branding
  template_id UUID REFERENCES public.invoice_templates(id),
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  footer_text TEXT,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT invoices_valid_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT invoices_valid_approval_status CHECK (approval_status IS NULL OR approval_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT invoices_valid_delivery_method CHECK (delivery_method IS NULL OR delivery_method IN ('email', 'portal', 'manual')),
  CONSTRAINT invoices_valid_currency CHECK (currency IN ('BRL', 'USD', 'EUR')),
  CONSTRAINT invoices_valid_amounts CHECK (
    subtotal >= 0 AND 
    discount_amount >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0
  ),
  CONSTRAINT invoices_valid_email_format CHECK (customer_email IS NULL OR customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT invoices_unique_tenant_number UNIQUE (tenant_id, invoice_number)
);

-- Create payment_records table for tracking payments
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Details
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  
  -- Transaction Information
  transaction_id TEXT,
  gateway_reference TEXT,
  gateway_response JSONB,
  
  -- Status and Processing
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT payment_records_valid_method CHECK (payment_method IN ('credit_card', 'bank_transfer', 'pix', 'boleto', 'cash', 'check')),
  CONSTRAINT payment_records_valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  CONSTRAINT payment_records_valid_currency CHECK (currency IN ('BRL', 'USD', 'EUR')),
  CONSTRAINT payment_records_valid_amount CHECK (amount > 0)
);

-- Create invoice_approval_workflows table for approval processes
CREATE TABLE public.invoice_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Workflow Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Workflow Configuration
  approval_steps JSONB NOT NULL DEFAULT '[]',
  auto_approve_threshold DECIMAL(12,2),
  require_approval_above DECIMAL(12,2),
  
  -- Conditions
  conditions JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  CONSTRAINT workflows_unique_tenant_name UNIQUE (tenant_id, name)
);

-- Create partial unique constraint for default workflows
CREATE UNIQUE INDEX workflows_unique_default 
ON public.invoice_approval_workflows (tenant_id) 
WHERE is_default = true;

-- Create invoice_delivery_logs table for tracking invoice deliveries
CREATE TABLE public.invoice_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Delivery Details
  delivery_method TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]',
  subject TEXT,
  message TEXT,
  
  -- Delivery Status
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  failed_recipients JSONB DEFAULT '[]',
  
  -- Tracking
  tracking_urls JSONB DEFAULT '[]',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT delivery_logs_valid_method CHECK (delivery_method IN ('email', 'portal', 'download')),
  CONSTRAINT delivery_logs_valid_status CHECK (status IN ('pending', 'sent', 'failed', 'scheduled'))
);

-- Create indexes for performance
CREATE INDEX idx_invoice_templates_tenant ON public.invoice_templates(tenant_id);
CREATE INDEX idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_invoices_lead ON public.invoices(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_invoices_contract ON public.invoices(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_invoices_status ON public.invoices(tenant_id, status);
CREATE INDEX idx_invoices_due_date ON public.invoices(tenant_id, due_date);
CREATE INDEX idx_invoices_created_at ON public.invoices(tenant_id, created_at);
CREATE INDEX idx_invoices_number ON public.invoices(tenant_id, invoice_number);
CREATE INDEX idx_payment_records_tenant ON public.payment_records(tenant_id);
CREATE INDEX idx_payment_records_invoice ON public.payment_records(invoice_id);
CREATE INDEX idx_payment_records_status ON public.payment_records(tenant_id, status);
CREATE INDEX idx_payment_records_date ON public.payment_records(tenant_id, payment_date);
CREATE INDEX idx_workflows_tenant ON public.invoice_approval_workflows(tenant_id);
CREATE INDEX idx_delivery_logs_tenant ON public.invoice_delivery_logs(tenant_id);
CREATE INDEX idx_delivery_logs_invoice ON public.invoice_delivery_logs(invoice_id);
CREATE INDEX idx_delivery_logs_status ON public.invoice_delivery_logs(tenant_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_invoice_templates ON public.invoice_templates
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_invoices ON public.invoices
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_payment_records ON public.payment_records
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_workflows ON public.invoice_approval_workflows
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_delivery_logs ON public.invoice_delivery_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON public.invoice_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.invoice_approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  current_month TEXT;
  sequence_num INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get current year and month
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  
  -- Get the next sequence number for this tenant, year, and month
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || current_year || current_month || '-\d+$')
      THEN SUBSTRING(invoice_number FROM LENGTH('INV-' || current_year || current_month || '-') + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE tenant_id = tenant_uuid;
  
  -- Format the invoice number: INV-YYYYMM-NNNN
  invoice_number := 'INV-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate invoice number if not provided
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice numbers
CREATE TRIGGER auto_generate_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION auto_generate_invoice_number();

-- Create function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(12,2);
  paid_amount DECIMAL(12,2);
  invoice_due_date DATE;
BEGIN
  -- Get invoice details
  SELECT total_amount, due_date INTO invoice_total, invoice_due_date
  FROM public.invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Calculate total paid amount
  SELECT COALESCE(SUM(amount), 0) INTO paid_amount
  FROM public.payment_records
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    AND status = 'completed';
  
  -- Update invoice status based on payment
  IF paid_amount >= invoice_total THEN
    UPDATE public.invoices
    SET status = 'paid'
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  ELSIF paid_amount > 0 THEN
    UPDATE public.invoices
    SET status = 'sent' -- Partially paid, keep as sent
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  ELSIF invoice_due_date < CURRENT_DATE THEN
    UPDATE public.invoices
    SET status = 'overdue'
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      AND status NOT IN ('paid', 'cancelled');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update invoice status when payments change
CREATE TRIGGER update_invoice_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- Insert default invoice template for each tenant
INSERT INTO public.invoice_templates (tenant_id, name, description, is_default, template_html, template_variables, created_by)
SELECT 
  t.id as tenant_id,
  'Default Invoice Template' as name,
  'Standard invoice template with company branding' as description,
  true as is_default,
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice {{invoice_number}}</title>
  <style>
    body { font-family: {{font_family}}; color: #333; }
    .header { background: {{primary_color}}; color: white; padding: 20px; }
    .invoice-details { margin: 20px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .items-table th { background: {{secondary_color}}; color: white; }
    .totals { text-align: right; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    {{#if header_logo_url}}<img src="{{header_logo_url}}" alt="Logo" style="height: 50px;">{{/if}}
    <h1>INVOICE</h1>
  </div>
  
  <div class="invoice-details">
    <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
    <p><strong>Date:</strong> {{created_at}}</p>
    <p><strong>Due Date:</strong> {{due_date}}</p>
  </div>
  
  {{#if show_customer_address}}
  <div class="customer-info">
    <h3>Bill To:</h3>
    <p>{{customer_name}}</p>
    {{#if customer_address}}
    <p>{{customer_address.street}}</p>
    <p>{{customer_address.city}}, {{customer_address.state}} {{customer_address.zip_code}}</p>
    {{/if}}
  </div>
  {{/if}}
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>{{description}}</td>
        <td>{{quantity}}</td>
        <td>{{currency}} {{unit_price}}</td>
        <td>{{currency}} {{total_amount}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div class="totals">
    <p><strong>Subtotal:</strong> {{currency}} {{subtotal}}</p>
    {{#if discount_amount}}<p><strong>Discount:</strong> -{{currency}} {{discount_amount}}</p>{{/if}}
    {{#if tax_amount}}<p><strong>Tax:</strong> {{currency}} {{tax_amount}}</p>{{/if}}
    <p><strong>Total:</strong> {{currency}} {{total_amount}}</p>
  </div>
  
  {{#if show_payment_terms}}
  <div class="payment-terms">
    <h3>Payment Terms</h3>
    <p>{{payment_terms}}</p>
    {{#if payment_instructions}}<p>{{payment_instructions}}</p>{{/if}}
  </div>
  {{/if}}
  
  {{#if show_notes}}
  {{#if notes}}
  <div class="notes">
    <h3>Notes</h3>
    <p>{{notes}}</p>
  </div>
  {{/if}}
  {{/if}}
  
  {{#if show_footer}}
  <div class="footer">
    {{#if footer_text}}<p>{{footer_text}}</p>{{/if}}
    <p>Thank you for your business!</p>
  </div>
  {{/if}}
</body>
</html>' as template_html,
  '[
    {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": true},
    {"name": "created_at", "label": "Invoice Date", "type": "date", "required": true},
    {"name": "due_date", "label": "Due Date", "type": "date", "required": true},
    {"name": "customer_name", "label": "Customer Name", "type": "text", "required": true},
    {"name": "customer_address", "label": "Customer Address", "type": "address", "required": false},
    {"name": "items", "label": "Invoice Items", "type": "array", "required": true},
    {"name": "subtotal", "label": "Subtotal", "type": "currency", "required": true},
    {"name": "discount_amount", "label": "Discount", "type": "currency", "required": false},
    {"name": "tax_amount", "label": "Tax", "type": "currency", "required": false},
    {"name": "total_amount", "label": "Total Amount", "type": "currency", "required": true},
    {"name": "currency", "label": "Currency", "type": "text", "required": true},
    {"name": "payment_terms", "label": "Payment Terms", "type": "text", "required": false},
    {"name": "payment_instructions", "label": "Payment Instructions", "type": "text", "required": false},
    {"name": "notes", "label": "Notes", "type": "text", "required": false},
    {"name": "footer_text", "label": "Footer Text", "type": "text", "required": false}
  ]'::jsonb as template_variables,
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'admin@isotec.com.br' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
  ) as created_by
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.invoice_templates it 
  WHERE it.tenant_id = t.id AND it.is_default = true
) AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Create default approval workflow for each tenant
INSERT INTO public.invoice_approval_workflows (tenant_id, name, description, approval_steps, auto_approve_threshold, is_default, created_by)
SELECT 
  t.id as tenant_id,
  'Default Approval Workflow' as name,
  'Standard approval process for invoices' as description,
  '[
    {"step_order": 1, "approver_role": "manager", "required": true, "auto_approve_conditions": {"amount_less_than": 1000}},
    {"step_order": 2, "approver_role": "admin", "required": true, "auto_approve_conditions": {"amount_less_than": 5000}}
  ]'::jsonb as approval_steps,
  500.00 as auto_approve_threshold,
  true as is_default,
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'admin@isotec.com.br' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
  ) as created_by
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.invoice_approval_workflows iaw 
  WHERE iaw.tenant_id = t.id AND iaw.is_default = true
) AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);