-- Migration: Create contract templates system with multi-tenant support
-- Description: Contract template management with version control and customization
-- Requirements: 7.2 - Contract template management

-- Create contract templates table
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Template Information
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Template Content
  template_content TEXT NOT NULL,
  template_variables JSONB NOT NULL DEFAULT '[]',
  
  -- Template Configuration
  category TEXT NOT NULL DEFAULT 'standard',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Signature Configuration
  signature_fields JSONB NOT NULL DEFAULT '[]',
  approval_workflow JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_version CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  CONSTRAINT valid_category CHECK (category IN ('standard', 'residential', 'commercial', 'industrial', 'custom')),
  CONSTRAINT unique_tenant_default_template UNIQUE (tenant_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Create contract template versions table for version control
CREATE TABLE IF NOT EXISTS public.contract_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE CASCADE NOT NULL,
  
  -- Version Information
  version TEXT NOT NULL,
  version_notes TEXT,
  
  -- Template Content Snapshot
  template_content TEXT NOT NULL,
  template_variables JSONB NOT NULL DEFAULT '[]',
  signature_fields JSONB NOT NULL DEFAULT '[]',
  approval_workflow JSONB NOT NULL DEFAULT '[]',
  
  -- Version Metadata
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_version_format CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  CONSTRAINT unique_template_version UNIQUE (template_id, version)
);

-- Create template customizations table for tenant-specific customizations
CREATE TABLE IF NOT EXISTS public.contract_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE CASCADE NOT NULL,
  
  -- Customization Data
  custom_variables JSONB NOT NULL DEFAULT '{}',
  custom_styling JSONB NOT NULL DEFAULT '{}',
  custom_content_overrides JSONB NOT NULL DEFAULT '{}',
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_tenant_template_customization UNIQUE (tenant_id, template_id)
);

-- Create indexes for performance
CREATE INDEX idx_contract_templates_tenant_id ON public.contract_templates(tenant_id);
CREATE INDEX idx_contract_templates_category ON public.contract_templates(category);
CREATE INDEX idx_contract_templates_is_active ON public.contract_templates(is_active);
CREATE INDEX idx_contract_templates_is_default ON public.contract_templates(is_default);
CREATE INDEX idx_contract_templates_created_at ON public.contract_templates(created_at DESC);

CREATE INDEX idx_contract_template_versions_template_id ON public.contract_template_versions(template_id);
CREATE INDEX idx_contract_template_versions_version ON public.contract_template_versions(template_id, version);
CREATE INDEX idx_contract_template_versions_published ON public.contract_template_versions(is_published);

CREATE INDEX idx_contract_template_customizations_tenant_id ON public.contract_template_customizations(tenant_id);
CREATE INDEX idx_contract_template_customizations_template_id ON public.contract_template_customizations(template_id);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_contract_templates_variables ON public.contract_templates USING GIN (template_variables);
CREATE INDEX idx_contract_templates_signature_fields ON public.contract_templates USING GIN (signature_fields);
CREATE INDEX idx_contract_templates_tags ON public.contract_templates USING GIN (tags);
CREATE INDEX idx_contract_templates_metadata ON public.contract_templates USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_template_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_templates
CREATE POLICY "Tenant isolation for contract templates"
  ON public.contract_templates
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- RLS Policies for contract_template_versions
CREATE POLICY "Tenant isolation for template versions"
  ON public.contract_template_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contract_templates ct
      WHERE ct.id = template_id AND ct.tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

-- RLS Policies for contract_template_customizations
CREATE POLICY "Tenant isolation for template customizations"
  ON public.contract_template_customizations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_contract_template_customizations_updated_at
  BEFORE UPDATE ON public.contract_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate template variables structure
CREATE OR REPLACE FUNCTION public.validate_template_variables()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure template_variables is an array
  IF jsonb_typeof(NEW.template_variables) != 'array' THEN
    RAISE EXCEPTION 'template_variables must be a JSON array';
  END IF;
  
  -- Validate each variable has required fields
  IF EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(NEW.template_variables) AS variable
    WHERE NOT (
      variable ? 'name' AND 
      variable ? 'type' AND
      variable ? 'required' AND
      jsonb_typeof(variable->'name') = 'string' AND
      jsonb_typeof(variable->'type') = 'string' AND
      jsonb_typeof(variable->'required') = 'boolean'
    )
  ) THEN
    RAISE EXCEPTION 'Each template variable must have name (string), type (string), and required (boolean) fields';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate signature fields structure
CREATE OR REPLACE FUNCTION public.validate_signature_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure signature_fields is an array
  IF jsonb_typeof(NEW.signature_fields) != 'array' THEN
    RAISE EXCEPTION 'signature_fields must be a JSON array';
  END IF;
  
  -- Validate each signature field has required fields
  IF EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(NEW.signature_fields) AS field
    WHERE NOT (
      field ? 'name' AND 
      field ? 'type' AND
      field ? 'required' AND
      jsonb_typeof(field->'name') = 'string' AND
      jsonb_typeof(field->'type') = 'string' AND
      jsonb_typeof(field->'required') = 'boolean'
    )
  ) THEN
    RAISE EXCEPTION 'Each signature field must have name (string), type (string), and required (boolean) fields';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create template version on template update
CREATE OR REPLACE FUNCTION public.create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content has changed
  IF OLD.template_content != NEW.template_content OR 
     OLD.template_variables != NEW.template_variables OR
     OLD.signature_fields != NEW.signature_fields OR
     OLD.approval_workflow != NEW.approval_workflow THEN
    
    INSERT INTO public.contract_template_versions (
      template_id,
      version,
      version_notes,
      template_content,
      template_variables,
      signature_fields,
      approval_workflow,
      is_published,
      published_at,
      created_by
    ) VALUES (
      NEW.id,
      NEW.version,
      'Auto-generated version from template update',
      NEW.template_content,
      NEW.template_variables,
      NEW.signature_fields,
      NEW.approval_workflow,
      TRUE,
      NOW(),
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
CREATE TRIGGER validate_template_variables_trigger
  BEFORE INSERT OR UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_template_variables();

CREATE TRIGGER validate_signature_fields_trigger
  BEFORE INSERT OR UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_signature_fields();

CREATE TRIGGER validate_template_versions_variables_trigger
  BEFORE INSERT OR UPDATE ON public.contract_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_template_variables();

CREATE TRIGGER validate_template_versions_signature_fields_trigger
  BEFORE INSERT OR UPDATE ON public.contract_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_signature_fields();

-- Apply version creation trigger
CREATE TRIGGER create_template_version_trigger
  AFTER UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.create_template_version();

-- Function to ensure only one default template per tenant
CREATE OR REPLACE FUNCTION public.ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a template as default, unset all other defaults for this tenant
  IF NEW.is_default = TRUE THEN
    UPDATE public.contract_templates 
    SET is_default = FALSE 
    WHERE tenant_id = NEW.tenant_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply default template constraint trigger
CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_template();

-- Add comments for documentation
COMMENT ON TABLE public.contract_templates IS 'Contract templates with multi-tenant support and version control';
COMMENT ON COLUMN public.contract_templates.template_content IS 'HTML/text content of the contract template with variable placeholders';
COMMENT ON COLUMN public.contract_templates.template_variables IS 'JSON array of variable definitions for template population';
COMMENT ON COLUMN public.contract_templates.signature_fields IS 'JSON array of signature field definitions';
COMMENT ON COLUMN public.contract_templates.approval_workflow IS 'JSON array defining approval steps required before contract generation';

COMMENT ON TABLE public.contract_template_versions IS 'Version history for contract templates';
COMMENT ON COLUMN public.contract_template_versions.template_content IS 'Snapshot of template content at this version';

COMMENT ON TABLE public.contract_template_customizations IS 'Tenant-specific customizations for contract templates';
COMMENT ON COLUMN public.contract_template_customizations.custom_variables IS 'Tenant-specific variable overrides and additions';
COMMENT ON COLUMN public.contract_template_customizations.custom_styling IS 'Tenant-specific styling overrides';