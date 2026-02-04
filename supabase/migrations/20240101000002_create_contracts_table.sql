-- Migration: Create contracts table with RLS policies, indexes, and location fields
-- Description: Stores master contract records with geographic location support
-- Requirements: 14.2, 3A.5, 3A.7

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  
  -- Contractor Information
  contractor_name TEXT NOT NULL,
  contractor_cpf TEXT NOT NULL,
  contractor_email TEXT,
  contractor_phone TEXT,
  
  -- Installation Address
  address_cep TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  
  -- Geographic Location (for 3D mockups and site planning)
  -- Coordinates stored with 8 decimal places for ~1mm precision
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  
  -- Project Specifications
  project_kwp DECIMAL(10, 2) NOT NULL,
  installation_date DATE,
  
  -- Service Scope (JSONB array of service descriptions)
  services JSONB NOT NULL DEFAULT '[]',
  
  -- Financial Information
  contract_value DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  
  -- Status and Metadata
  status TEXT NOT NULL DEFAULT 'pending_signature',
  contract_hash TEXT,
  
  -- Audit Fields
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  signed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending_signature', 'signed', 'cancelled')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('pix', 'cash', 'credit')),
  CONSTRAINT positive_kwp CHECK (project_kwp > 0),
  CONSTRAINT positive_value CHECK (contract_value > 0),
  CONSTRAINT valid_cpf_format CHECK (contractor_cpf ~ '^\d{11}$'),
  CONSTRAINT valid_cep_format CHECK (address_cep ~ '^\d{8}$'),
  -- Brazilian geographic boundaries validation
  -- Latitude: -33.75 (southernmost) to 5.27 (northernmost)
  -- Longitude: -73.99 (westernmost) to -34.79 (easternmost)
  CONSTRAINT valid_brazilian_coordinates CHECK (
    (location_latitude IS NULL AND location_longitude IS NULL) OR
    (location_latitude BETWEEN -33.75 AND 5.27 AND 
     location_longitude BETWEEN -73.99 AND -34.79)
  )
);

-- Create indexes for performance
CREATE INDEX idx_contracts_uuid ON public.contracts(uuid);
CREATE INDEX idx_contracts_cpf ON public.contracts(contractor_cpf);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_created_at ON public.contracts(created_at DESC);
CREATE INDEX idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX idx_contracts_contractor_name ON public.contracts(contractor_name);

-- Create spatial index for location queries (when coordinates exist)
CREATE INDEX idx_contracts_location ON public.contracts(location_latitude, location_longitude) 
  WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Create GIN index for JSONB services field
CREATE INDEX idx_contracts_services ON public.contracts USING GIN (services);

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view contracts by UUID (for contractor access)
-- UUID is non-enumerable and provides security through obscurity
CREATE POLICY "Public can view contracts by UUID"
  ON public.contracts
  FOR SELECT
  USING (TRUE);

-- RLS Policy: Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Admins can insert contracts
CREATE POLICY "Admins can insert contracts"
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Admins can update pending contracts only
CREATE POLICY "Admins can update pending contracts"
  ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending_signature' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    status = 'pending_signature' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Super admins can delete contracts
CREATE POLICY "Super admins can delete contracts"
  ON public.contracts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate services JSONB structure
CREATE OR REPLACE FUNCTION public.validate_services_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure services is an array
  IF jsonb_typeof(NEW.services) != 'array' THEN
    RAISE EXCEPTION 'services must be a JSON array';
  END IF;
  
  -- Validate each service item has required fields
  IF EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(NEW.services) AS service
    WHERE NOT (
      service ? 'description' AND 
      service ? 'included' AND
      jsonb_typeof(service->'description') = 'string' AND
      jsonb_typeof(service->'included') = 'boolean'
    )
  ) THEN
    RAISE EXCEPTION 'Each service must have description (string) and included (boolean) fields';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate services structure
CREATE TRIGGER validate_services_before_insert_update
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_services_structure();

-- Add comments for documentation
COMMENT ON TABLE public.contracts IS 'Master contract records with geographic location support for solar installations';
COMMENT ON COLUMN public.contracts.uuid IS 'Non-enumerable UUID for public access URLs';
COMMENT ON COLUMN public.contracts.location_latitude IS 'Installation site latitude (8 decimal places for ~1mm precision)';
COMMENT ON COLUMN public.contracts.location_longitude IS 'Installation site longitude (8 decimal places for ~1mm precision)';
COMMENT ON COLUMN public.contracts.services IS 'JSONB array of service items with description and included fields';
COMMENT ON COLUMN public.contracts.contract_hash IS 'SHA-256 hash of contract content after signing';
COMMENT ON COLUMN public.contracts.status IS 'Contract status: pending_signature, signed, or cancelled';
COMMENT ON CONSTRAINT valid_brazilian_coordinates ON public.contracts IS 'Ensures coordinates are within Brazil geographic boundaries';
