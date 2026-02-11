-- Migration: Create e-signature system
-- Description: E-signature integration with DocuSign and HelloSign
-- Requirements: 7.3 - E-signature integration

-- Create signature requests table
CREATE TABLE IF NOT EXISTS public.signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES public.generated_contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider Information
  provider TEXT NOT NULL DEFAULT 'docusign',
  provider_envelope_id TEXT,
  provider_document_id TEXT,
  
  -- Document Information
  document_name TEXT NOT NULL,
  document_url TEXT,
  document_content TEXT,
  
  -- Request Configuration
  subject TEXT NOT NULL,
  message TEXT,
  expires_at TIMESTAMPTZ,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_delay_days INTEGER DEFAULT 3,
  
  -- Status and Tracking
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_provider CHECK (provider IN ('docusign', 'hellosign')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'completed', 'declined', 'cancelled', 'expired')),
  CONSTRAINT valid_reminder_delay CHECK (reminder_delay_days >= 1 AND reminder_delay_days <= 30)
);

-- Create signature request signers table
CREATE TABLE IF NOT EXISTS public.signature_request_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID REFERENCES public.signature_requests(id) ON DELETE CASCADE NOT NULL,
  
  -- Signer Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  
  -- Signing Configuration
  signing_order INTEGER DEFAULT 1,
  auth_method TEXT DEFAULT 'email',
  require_id_verification BOOLEAN DEFAULT FALSE,
  
  -- Provider-specific IDs
  provider_signer_id TEXT,
  provider_recipient_id TEXT,
  
  -- Status and Tracking
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  
  -- Signature Information
  signature_url TEXT,
  embedded_signing_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_auth_method CHECK (auth_method IN ('email', 'sms', 'phone', 'knowledge_based', 'id_verification')),
  CONSTRAINT valid_signer_status CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'declined', 'expired', 'cancelled')),
  CONSTRAINT valid_signing_order CHECK (signing_order >= 1),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create signature fields table
CREATE TABLE IF NOT EXISTS public.signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signer_id UUID REFERENCES public.signature_request_signers(id) ON DELETE CASCADE NOT NULL,
  
  -- Field Configuration
  field_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  
  -- Position and Size (for PDF documents)
  page_number INTEGER DEFAULT 1,
  x_position NUMERIC,
  y_position NUMERIC,
  width NUMERIC,
  height NUMERIC,
  
  -- Field Properties
  font_size INTEGER DEFAULT 12,
  font_color TEXT DEFAULT '#000000',
  background_color TEXT,
  
  -- Validation
  validation_pattern TEXT,
  validation_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_field_type CHECK (field_type IN ('signature', 'initial', 'date', 'text', 'checkbox')),
  CONSTRAINT valid_page_number CHECK (page_number >= 1),
  CONSTRAINT valid_font_size CHECK (font_size >= 8 AND font_size <= 72),
  CONSTRAINT valid_positions CHECK (
    (x_position IS NULL AND y_position IS NULL) OR 
    (x_position IS NOT NULL AND y_position IS NOT NULL AND x_position >= 0 AND y_position >= 0)
  ),
  CONSTRAINT valid_dimensions CHECK (
    (width IS NULL AND height IS NULL) OR 
    (width IS NOT NULL AND height IS NOT NULL AND width > 0 AND height > 0)
  )
);

-- Create provider configurations table
CREATE TABLE IF NOT EXISTS public.esignature_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider Information
  provider TEXT NOT NULL,
  
  -- API Configuration
  api_key TEXT NOT NULL,
  api_secret TEXT,
  base_url TEXT,
  environment TEXT DEFAULT 'sandbox',
  
  -- Default Settings
  default_subject TEXT DEFAULT 'Documento para assinatura',
  default_message TEXT DEFAULT 'Por favor, assine o documento anexo.',
  default_expiration_days INTEGER DEFAULT 30,
  
  -- Webhook Configuration
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Branding
  brand_id TEXT,
  custom_branding JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_provider_config CHECK (provider IN ('docusign', 'hellosign')),
  CONSTRAINT valid_environment CHECK (environment IN ('sandbox', 'production')),
  CONSTRAINT valid_expiration_days CHECK (default_expiration_days >= 1 AND default_expiration_days <= 365),
  CONSTRAINT unique_tenant_provider UNIQUE (tenant_id, provider)
);

-- Create webhook events table
CREATE TABLE IF NOT EXISTS public.signature_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  
  -- Event Information
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  provider_event_id TEXT,
  
  -- Related Objects
  signature_request_id UUID REFERENCES public.signature_requests(id) ON DELETE SET NULL,
  signer_id UUID REFERENCES public.signature_request_signers(id) ON DELETE SET NULL,
  
  -- Processing Status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_webhook_provider CHECK (provider IN ('docusign', 'hellosign'))
);

-- Create indexes for performance
CREATE INDEX idx_signature_requests_tenant_id ON public.signature_requests(tenant_id);
CREATE INDEX idx_signature_requests_contract_id ON public.signature_requests(contract_id);
CREATE INDEX idx_signature_requests_provider ON public.signature_requests(provider);
CREATE INDEX idx_signature_requests_status ON public.signature_requests(status);
CREATE INDEX idx_signature_requests_provider_envelope_id ON public.signature_requests(provider_envelope_id);
CREATE INDEX idx_signature_requests_created_at ON public.signature_requests(created_at DESC);
CREATE INDEX idx_signature_requests_expires_at ON public.signature_requests(expires_at);

CREATE INDEX idx_signature_request_signers_request_id ON public.signature_request_signers(signature_request_id);
CREATE INDEX idx_signature_request_signers_email ON public.signature_request_signers(email);
CREATE INDEX idx_signature_request_signers_status ON public.signature_request_signers(status);
CREATE INDEX idx_signature_request_signers_signing_order ON public.signature_request_signers(signing_order);
CREATE INDEX idx_signature_request_signers_provider_signer_id ON public.signature_request_signers(provider_signer_id);

CREATE INDEX idx_signature_fields_signer_id ON public.signature_fields(signer_id);
CREATE INDEX idx_signature_fields_field_type ON public.signature_fields(field_type);
CREATE INDEX idx_signature_fields_page_number ON public.signature_fields(page_number);

CREATE INDEX idx_esignature_provider_configs_tenant_id ON public.esignature_provider_configs(tenant_id);
CREATE INDEX idx_esignature_provider_configs_provider ON public.esignature_provider_configs(provider);

CREATE INDEX idx_signature_webhook_events_tenant_id ON public.signature_webhook_events(tenant_id);
CREATE INDEX idx_signature_webhook_events_provider ON public.signature_webhook_events(provider);
CREATE INDEX idx_signature_webhook_events_processed ON public.signature_webhook_events(processed);
CREATE INDEX idx_signature_webhook_events_signature_request_id ON public.signature_webhook_events(signature_request_id);
CREATE INDEX idx_signature_webhook_events_created_at ON public.signature_webhook_events(created_at DESC);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_esignature_provider_configs_custom_branding ON public.esignature_provider_configs USING GIN (custom_branding);
CREATE INDEX idx_signature_webhook_events_event_data ON public.signature_webhook_events USING GIN (event_data);

-- Enable Row Level Security
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_request_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esignature_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "Tenant isolation for signature requests"
  ON public.signature_requests
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for signature request signers"
  ON public.signature_request_signers
  FOR ALL
  USING (
    signature_request_id IN (
      SELECT id FROM public.signature_requests 
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY "Tenant isolation for signature fields"
  ON public.signature_fields
  FOR ALL
  USING (
    signer_id IN (
      SELECT srs.id FROM public.signature_request_signers srs
      JOIN public.signature_requests sr ON srs.signature_request_id = sr.id
      WHERE sr.tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY "Tenant isolation for esignature provider configs"
  ON public.esignature_provider_configs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for signature webhook events"
  ON public.signature_webhook_events
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_signature_requests_updated_at
  BEFORE UPDATE ON public.signature_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_signature_request_signers_updated_at
  BEFORE UPDATE ON public.signature_request_signers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_signature_fields_updated_at
  BEFORE UPDATE ON public.signature_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_esignature_provider_configs_updated_at
  BEFORE UPDATE ON public.esignature_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically update contract signature status
CREATE OR REPLACE FUNCTION public.update_contract_signature_status()
RETURNS TRIGGER AS $
DECLARE
  contract_id UUID;
  total_signers INTEGER;
  signed_count INTEGER;
  declined_count INTEGER;
  new_signature_status TEXT;
BEGIN
  -- Get the contract ID from the signature request
  SELECT sr.contract_id INTO contract_id
  FROM public.signature_requests sr
  WHERE sr.id = NEW.signature_request_id;
  
  IF contract_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count signers by status
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN srs.status = 'signed' THEN 1 END) as signed,
    COUNT(CASE WHEN srs.status = 'declined' THEN 1 END) as declined
  INTO total_signers, signed_count, declined_count
  FROM public.signature_request_signers srs
  JOIN public.signature_requests sr ON srs.signature_request_id = sr.id
  WHERE sr.contract_id = contract_id;
  
  -- Determine new signature status
  IF declined_count > 0 THEN
    new_signature_status := 'declined';
  ELSIF signed_count = total_signers THEN
    new_signature_status := 'fully_signed';
  ELSIF signed_count > 0 THEN
    new_signature_status := 'partially_signed';
  ELSE
    new_signature_status := 'pending';
  END IF;
  
  -- Update contract signature status
  UPDATE public.generated_contracts
  SET 
    signature_status = new_signature_status,
    signed_at = CASE 
      WHEN new_signature_status = 'fully_signed' THEN NOW()
      ELSE signed_at
    END,
    updated_at = NOW()
  WHERE id = contract_id;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Apply contract signature status update trigger
CREATE TRIGGER update_contract_signature_status_trigger
  AFTER UPDATE OF status ON public.signature_request_signers
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_contract_signature_status();

-- Function to check signature request expiration
CREATE OR REPLACE FUNCTION public.check_signature_request_expiration()
RETURNS void AS $
BEGIN
  -- Update expired signature requests
  UPDATE public.signature_requests
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('draft', 'sent')
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  -- Update expired signers
  UPDATE public.signature_request_signers
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'sent', 'viewed')
    AND signature_request_id IN (
      SELECT id FROM public.signature_requests
      WHERE status = 'expired'
    );
END;
$ LANGUAGE plpgsql;

-- Function to get signature request progress
CREATE OR REPLACE FUNCTION public.get_signature_request_progress(request_id UUID)
RETURNS JSONB AS $
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_signers', COUNT(*),
    'pending_count', COUNT(CASE WHEN status = 'pending' THEN 1 END),
    'sent_count', COUNT(CASE WHEN status IN ('sent', 'viewed') THEN 1 END),
    'signed_count', COUNT(CASE WHEN status = 'signed' THEN 1 END),
    'declined_count', COUNT(CASE WHEN status = 'declined' THEN 1 END),
    'completion_percentage', 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN status = 'signed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100)
      END
  ) INTO result
  FROM public.signature_request_signers
  WHERE signature_request_id = request_id;
  
  RETURN result;
END;
$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.signature_requests IS 'E-signature requests for contract signing';
COMMENT ON COLUMN public.signature_requests.provider_envelope_id IS 'Provider-specific envelope/request ID';
COMMENT ON COLUMN public.signature_requests.document_content IS 'Base64 encoded document content (alternative to document_url)';

COMMENT ON TABLE public.signature_request_signers IS 'Signers for e-signature requests';
COMMENT ON COLUMN public.signature_request_signers.signing_order IS 'Order in which signers should sign (1 = first)';
COMMENT ON COLUMN public.signature_request_signers.auth_method IS 'Authentication method required for signing';

COMMENT ON TABLE public.signature_fields IS 'Signature fields positioned on documents';
COMMENT ON COLUMN public.signature_fields.x_position IS 'X coordinate for field placement (PDF units)';
COMMENT ON COLUMN public.signature_fields.y_position IS 'Y coordinate for field placement (PDF units)';

COMMENT ON TABLE public.esignature_provider_configs IS 'E-signature provider configurations per tenant';
COMMENT ON COLUMN public.esignature_provider_configs.custom_branding IS 'Custom branding settings for signature requests';

COMMENT ON TABLE public.signature_webhook_events IS 'Webhook events received from e-signature providers';
COMMENT ON COLUMN public.signature_webhook_events.event_data IS 'Raw webhook event data from provider';