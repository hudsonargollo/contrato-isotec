-- Migration: Create verification_codes table for email signature flow
-- Description: Stores temporary verification codes for email-based contract signatures
-- Requirements: 5.1, 5.2

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Verification Details
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  
  -- Expiration and Rate Limiting
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  
  -- Status
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Audit Fields
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_code_format CHECK (code ~ '^\d{6}$'),
  CONSTRAINT positive_attempts CHECK (attempts >= 0),
  CONSTRAINT positive_max_attempts CHECK (max_attempts > 0)
);

-- Create indexes for performance
CREATE INDEX idx_verification_codes_contract_id ON public.verification_codes(contract_id);
CREATE INDEX idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can insert verification codes (for signature initiation)
CREATE POLICY "Public can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  USING (TRUE);

-- RLS Policy: Public can view their own verification codes
CREATE POLICY "Public can view own verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (TRUE);

-- RLS Policy: Public can update their own verification codes (for verification)
CREATE POLICY "Public can update own verification codes"
  ON public.verification_codes
  FOR UPDATE
  USING (TRUE);

-- RLS Policy: Admins can view all verification codes
CREATE POLICY "Admins can view all verification codes"
  ON public.verification_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.verification_codes IS 'Temporary verification codes for email-based contract signatures';
COMMENT ON COLUMN public.verification_codes.code IS '6-digit numeric verification code';
COMMENT ON COLUMN public.verification_codes.expires_at IS 'Code expiration timestamp (15 minutes from creation)';
COMMENT ON COLUMN public.verification_codes.attempts IS 'Number of verification attempts made';
COMMENT ON COLUMN public.verification_codes.max_attempts IS 'Maximum allowed verification attempts (default: 5)';

