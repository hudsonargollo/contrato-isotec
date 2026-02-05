-- Migration: Allow public contract signing via email verification
-- Description: Add RLS policy to allow updating contract status during email verification
-- Date: 2024-02-04

-- Add policy to allow public updates for contract signing
CREATE POLICY "Public can sign contracts via email verification"
  ON public.contracts
  FOR UPDATE
  TO anon, authenticated
  USING (
    status = 'pending_signature'
  )
  WITH CHECK (
    status IN ('signed') AND
    contract_hash IS NOT NULL AND
    signed_at IS NOT NULL
  );

-- Comment for documentation
COMMENT ON POLICY "Public can sign contracts via email verification" ON public.contracts IS 
  'Allows public email verification to update contract status from pending_signature to signed';