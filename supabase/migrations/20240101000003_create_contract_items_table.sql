-- Migration: Create contract_items table with RLS policies
-- Description: Stores dynamic equipment lists for contracts
-- Requirements: 14.3

-- Create contract_items table
CREATE TABLE IF NOT EXISTS public.contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Item Details
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT valid_unit CHECK (unit IN ('un', 'kg', 'm', 'm²', 'm³', 'l', 'kWp', 'kW', 'kWh', 'A', 'V', 'W'))
);

-- Create indexes for performance
CREATE INDEX idx_contract_items_contract_id ON public.contract_items(contract_id);
CREATE INDEX idx_contract_items_sort_order ON public.contract_items(contract_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.contract_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view items for any contract (follows contract access)
CREATE POLICY "Public can view items for public contracts"
  ON public.contract_items
  FOR SELECT
  USING (TRUE);

-- RLS Policy: Admins can view all items
CREATE POLICY "Admins can view all items"
  ON public.contract_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Admins can insert items
CREATE POLICY "Admins can insert items"
  ON public.contract_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Admins can update items for pending contracts only
CREATE POLICY "Admins can update items for pending contracts"
  ON public.contract_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = contract_id 
        AND c.status = 'pending_signature'
        AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = contract_id 
        AND c.status = 'pending_signature'
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policy: Admins can delete items for pending contracts only
CREATE POLICY "Admins can delete items for pending contracts"
  ON public.contract_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = contract_id 
        AND c.status = 'pending_signature'
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_contract_items_updated_at
  BEFORE UPDATE ON public.contract_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update contract updated_at when items change
CREATE OR REPLACE FUNCTION public.update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contracts
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update parent contract timestamp when items change
CREATE TRIGGER update_contract_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contract_timestamp();

-- Add comments for documentation
COMMENT ON TABLE public.contract_items IS 'Dynamic equipment lists for solar installation contracts';
COMMENT ON COLUMN public.contract_items.item_name IS 'Name/description of the equipment item';
COMMENT ON COLUMN public.contract_items.quantity IS 'Quantity of items (must be positive)';
COMMENT ON COLUMN public.contract_items.unit IS 'Unit of measurement (un, kg, m, m², kWp, etc.)';
COMMENT ON COLUMN public.contract_items.sort_order IS 'Display order for items in the contract';
