-- Migration: Create audit_logs table with immutable RLS policies
-- Description: Stores immutable signature event records for legal compliance
-- Requirements: 14.4

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL,
  signature_method TEXT NOT NULL,
  
  -- Signature Data
  contract_hash TEXT NOT NULL,
  signer_identifier TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  
  -- Additional metadata for legal compliance
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp (immutable - no updated_at)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (
    event_type IN ('signature_initiated', 'signature_completed', 'signature_failed', 'contract_viewed', 'contract_created')
  ),
  CONSTRAINT valid_signature_method CHECK (
    signature_method IN ('govbr', 'email', 'system')
  ),
  CONSTRAINT valid_hash_format CHECK (
    contract_hash ~ '^[a-f0-9]{64}$' OR contract_hash = ''
  )
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_contract_id ON public.audit_logs(contract_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_signature_method ON public.audit_logs(signature_method);
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs(ip_address);

-- Create GIN index for JSONB metadata field
CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: System can insert audit logs (authenticated users only)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- RLS Policy: Public can insert audit logs for signature events (unauthenticated)
-- This allows contractors to create audit logs when signing
CREATE POLICY "Public can insert signature audit logs"
  ON public.audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    event_type IN ('signature_initiated', 'signature_completed', 'signature_failed', 'contract_viewed')
  );

-- RLS Policy: No updates allowed (immutable)
CREATE POLICY "No updates allowed"
  ON public.audit_logs
  FOR UPDATE
  USING (FALSE);

-- RLS Policy: No deletes allowed (immutable)
CREATE POLICY "No deletes allowed"
  ON public.audit_logs
  FOR DELETE
  USING (FALSE);

-- Function to prevent updates to audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent updates
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Trigger to prevent deletes
CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Function to automatically create audit log when contract is created
CREATE OR REPLACE FUNCTION public.create_contract_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    contract_id,
    event_type,
    signature_method,
    contract_hash,
    signer_identifier,
    ip_address,
    metadata
  ) VALUES (
    NEW.id,
    'contract_created',
    'system',
    '',
    NEW.created_by::text,
    '127.0.0.1'::inet,
    jsonb_build_object(
      'contractor_name', NEW.contractor_name,
      'contractor_cpf', NEW.contractor_cpf,
      'contract_value', NEW.contract_value,
      'project_kwp', NEW.project_kwp
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create audit log when contract is created
CREATE TRIGGER create_audit_log_on_contract_creation
  AFTER INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_contract_audit_log();

-- Function to create audit log when contract is signed
CREATE OR REPLACE FUNCTION public.create_signature_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create audit log if status changed to 'signed'
  IF OLD.status != 'signed' AND NEW.status = 'signed' THEN
    INSERT INTO public.audit_logs (
      contract_id,
      event_type,
      signature_method,
      contract_hash,
      ip_address,
      metadata
    ) VALUES (
      NEW.id,
      'signature_completed',
      'system',
      COALESCE(NEW.contract_hash, ''),
      '127.0.0.1'::inet,
      jsonb_build_object(
        'signed_at', NEW.signed_at,
        'previous_status', OLD.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create audit log when contract is signed
CREATE TRIGGER create_audit_log_on_signature
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_signature_audit_log();

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for contract signature events and legal compliance';
COMMENT ON COLUMN public.audit_logs.event_type IS 'Type of event: signature_initiated, signature_completed, signature_failed, contract_viewed, contract_created';
COMMENT ON COLUMN public.audit_logs.signature_method IS 'Signature method: govbr (GOV.BR OAuth), email (email verification), system (automated)';
COMMENT ON COLUMN public.audit_logs.contract_hash IS 'SHA-256 hash of contract content at time of event';
COMMENT ON COLUMN public.audit_logs.signer_identifier IS 'GOV.BR user ID, email address, or system identifier';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the user performing the action';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional event metadata in JSONB format';
COMMENT ON CONSTRAINT valid_hash_format ON public.audit_logs IS 'Ensures contract_hash is a valid SHA-256 hex string or empty';
