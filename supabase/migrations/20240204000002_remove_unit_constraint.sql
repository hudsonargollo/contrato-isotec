-- Migration: Remove unit constraint to allow manufacturer names
-- Description: Allow "unit" field to store manufacturer names instead of measurement units
-- Date: 2024-02-04

-- Drop the constraint that limits unit values
ALTER TABLE public.contract_items DROP CONSTRAINT IF EXISTS valid_unit;

-- Update the comment to reflect the new purpose
COMMENT ON COLUMN public.contract_items.unit IS 'Manufacturer name or brand (formerly unit of measurement)';

-- Update table comment
COMMENT ON TABLE public.contract_items IS 'Dynamic equipment lists for solar installation contracts with manufacturer information';