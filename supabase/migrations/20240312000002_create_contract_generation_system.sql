-- Migration: Create contract generation system
-- Description: Contract generation workflows, preview, and validation
-- Requirements: 7.1 - Automated contract generation

-- Create contract generation requests table
CREATE TABLE IF NOT EXISTS public.contract_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Source Information
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Generation Data
  contract_data JSONB NOT NULL DEFAULT '{}',
  variable_values JSONB NOT NULL DEFAULT '{}',
  
  -- Generation Configuration
  generation_options JSONB NOT NULL DEFAULT '{}',
  output_format TEXT NOT NULL DEFAULT 'pdf',
  
  -- Status and Results
  status TEXT NOT NULL DEFAULT 'pending',
  generated_content TEXT,
  generated_file_url TEXT,
  validation_errors JSONB DEFAULT '[]',
  
  -- Workflow Information
  workflow_step INTEGER DEFAULT 1,
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  -- Audit Fields
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_output_format CHECK (output_format IN ('html', 'pdf', 'docx')),
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required'))
);

-- Create generated contracts table
CREATE TABLE IF NOT EXISTS public.generated_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Generation Request Reference
  generation_request_id UUID REFERENCES public.contract_generation_requests(id) ON DELETE CASCADE NOT NULL,
  
  -- Contract Information
  contract_number TEXT NOT NULL,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL NOT NULL,
  template_version TEXT NOT NULL,
  
  -- Customer Information (from CRM)
  customer_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_data JSONB NOT NULL DEFAULT '{}',
  
  -- Contract Content
  contract_content TEXT NOT NULL,
  contract_variables JSONB NOT NULL DEFAULT '{}',
  
  -- File Information
  file_url TEXT,
  file_size INTEGER,
  file_format TEXT NOT NULL DEFAULT 'pdf',
  file_hash TEXT,
  
  -- Status and Lifecycle
  status TEXT NOT NULL DEFAULT 'draft',
  is_final BOOLEAN DEFAULT FALSE,
  
  -- Signature Information
  signature_status TEXT DEFAULT 'pending',
  signature_requests JSONB DEFAULT '[]',
  signed_at TIMESTAMPTZ,
  
  -- Expiration and Renewal
  expires_at TIMESTAMPTZ,
  renewal_date TIMESTAMPTZ,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_contract_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'signed', 'cancelled', 'expired')),
  CONSTRAINT valid_signature_status CHECK (signature_status IN ('pending', 'sent', 'partially_signed', 'fully_signed', 'declined', 'expired')),
  CONSTRAINT valid_file_format CHECK (file_format IN ('html', 'pdf', 'docx')),
  CONSTRAINT unique_tenant_contract_number UNIQUE (tenant_id, contract_number)
);

-- Create contract validation rules table
CREATE TABLE IF NOT EXISTS public.contract_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Rule Information
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  
  -- Rule Configuration
  rule_config JSONB NOT NULL DEFAULT '{}',
  validation_script TEXT,
  
  -- Rule Conditions
  applies_to_templates JSONB DEFAULT '[]', -- Array of template IDs
  applies_to_categories JSONB DEFAULT '[]', -- Array of template categories
  
  -- Rule Settings
  is_active BOOLEAN DEFAULT TRUE,
  is_blocking BOOLEAN DEFAULT FALSE, -- If true, prevents contract generation on failure
  severity TEXT DEFAULT 'warning',
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('required_field', 'field_format', 'business_logic', 'custom_script')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Create contract generation workflows table
CREATE TABLE IF NOT EXISTS public.contract_generation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Workflow Information
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Workflow Configuration
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Template Association
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  applies_to_all_templates BOOLEAN DEFAULT FALSE,
  
  -- Workflow Settings
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  auto_execute BOOLEAN DEFAULT FALSE,
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_workflow_version CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$')
);

-- Create indexes for performance
CREATE INDEX idx_contract_generation_requests_tenant_id ON public.contract_generation_requests(tenant_id);
CREATE INDEX idx_contract_generation_requests_template_id ON public.contract_generation_requests(template_id);
CREATE INDEX idx_contract_generation_requests_lead_id ON public.contract_generation_requests(lead_id);
CREATE INDEX idx_contract_generation_requests_status ON public.contract_generation_requests(status);
CREATE INDEX idx_contract_generation_requests_created_at ON public.contract_generation_requests(created_at DESC);

CREATE INDEX idx_generated_contracts_tenant_id ON public.generated_contracts(tenant_id);
CREATE INDEX idx_generated_contracts_generation_request_id ON public.generated_contracts(generation_request_id);
CREATE INDEX idx_generated_contracts_customer_id ON public.generated_contracts(customer_id);
CREATE INDEX idx_generated_contracts_status ON public.generated_contracts(status);
CREATE INDEX idx_generated_contracts_signature_status ON public.generated_contracts(signature_status);
CREATE INDEX idx_generated_contracts_contract_number ON public.generated_contracts(contract_number);
CREATE INDEX idx_generated_contracts_expires_at ON public.generated_contracts(expires_at);

CREATE INDEX idx_contract_validation_rules_tenant_id ON public.contract_validation_rules(tenant_id);
CREATE INDEX idx_contract_validation_rules_is_active ON public.contract_validation_rules(is_active);
CREATE INDEX idx_contract_validation_rules_rule_type ON public.contract_validation_rules(rule_type);

CREATE INDEX idx_contract_generation_workflows_tenant_id ON public.contract_generation_workflows(tenant_id);
CREATE INDEX idx_contract_generation_workflows_template_id ON public.contract_generation_workflows(template_id);
CREATE INDEX idx_contract_generation_workflows_is_active ON public.contract_generation_workflows(is_active);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_contract_generation_requests_contract_data ON public.contract_generation_requests USING GIN (contract_data);
CREATE INDEX idx_contract_generation_requests_variable_values ON public.contract_generation_requests USING GIN (variable_values);
CREATE INDEX idx_generated_contracts_customer_data ON public.generated_contracts USING GIN (customer_data);
CREATE INDEX idx_generated_contracts_contract_variables ON public.generated_contracts USING GIN (contract_variables);
CREATE INDEX idx_contract_validation_rules_rule_config ON public.contract_validation_rules USING GIN (rule_config);
CREATE INDEX idx_contract_generation_workflows_workflow_steps ON public.contract_generation_workflows USING GIN (workflow_steps);

-- Enable Row Level Security
ALTER TABLE public.contract_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_generation_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "Tenant isolation for contract generation requests"
  ON public.contract_generation_requests
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for generated contracts"
  ON public.generated_contracts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for contract validation rules"
  ON public.contract_validation_rules
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for contract generation workflows"
  ON public.contract_generation_workflows
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_contract_generation_requests_updated_at
  BEFORE UPDATE ON public.contract_generation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_generated_contracts_updated_at
  BEFORE UPDATE ON public.generated_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_contract_validation_rules_updated_at
  BEFORE UPDATE ON public.contract_validation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_contract_generation_workflows_updated_at
  BEFORE UPDATE ON public.contract_generation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate unique contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number(tenant_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  contract_number TEXT;
BEGIN
  -- Get current year suffix (last 2 digits)
  year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
  year_suffix := RIGHT(year_suffix, 2);
  
  -- Get next sequence number for this tenant and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN contract_number ~ ('^CT' || year_suffix || '[0-9]+$')
      THEN SUBSTRING(contract_number FROM LENGTH('CT' || year_suffix) + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM public.generated_contracts
  WHERE tenant_id = tenant_uuid;
  
  -- Format: CT + YY + sequence (padded to 4 digits)
  contract_number := 'CT' || year_suffix || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN contract_number;
END;
$$ LANGUAGE plpgsql;

-- Function to validate contract data against rules
CREATE OR REPLACE FUNCTION public.validate_contract_data(
  tenant_uuid UUID,
  template_uuid UUID,
  contract_data JSONB,
  variable_values JSONB
)
RETURNS JSONB AS $$
DECLARE
  rule RECORD;
  validation_result JSONB := '{"valid": true, "errors": [], "warnings": []}';
  rule_result JSONB;
  error_message TEXT;
BEGIN
  -- Get applicable validation rules
  FOR rule IN 
    SELECT * FROM public.contract_validation_rules
    WHERE tenant_id = tenant_uuid
      AND is_active = TRUE
      AND (
        applies_to_templates @> to_jsonb(template_uuid::TEXT) OR
        applies_to_all_templates = TRUE
      )
    ORDER BY severity DESC, created_at ASC
  LOOP
    BEGIN
      -- Apply validation rule based on type
      CASE rule.rule_type
        WHEN 'required_field' THEN
          -- Check if required field exists and has value
          IF NOT (contract_data ? (rule.rule_config->>'field_name')) OR 
             (contract_data->(rule.rule_config->>'field_name')) IS NULL OR
             (contract_data->>(rule.rule_config->>'field_name')) = '' THEN
            error_message := COALESCE(rule.rule_config->>'error_message', 
                                    'Campo obrigatório não preenchido: ' || (rule.rule_config->>'field_name'));
            
            IF rule.severity IN ('error', 'critical') THEN
              validation_result := jsonb_set(validation_result, '{valid}', 'false');
              validation_result := jsonb_set(validation_result, '{errors}', 
                                           validation_result->'errors' || to_jsonb(error_message));
            ELSE
              validation_result := jsonb_set(validation_result, '{warnings}', 
                                           validation_result->'warnings' || to_jsonb(error_message));
            END IF;
          END IF;
          
        WHEN 'field_format' THEN
          -- Validate field format using regex
          IF (contract_data ? (rule.rule_config->>'field_name')) AND
             (contract_data->>(rule.rule_config->>'field_name')) !~ (rule.rule_config->>'pattern') THEN
            error_message := COALESCE(rule.rule_config->>'error_message', 
                                    'Formato inválido para campo: ' || (rule.rule_config->>'field_name'));
            
            IF rule.severity IN ('error', 'critical') THEN
              validation_result := jsonb_set(validation_result, '{valid}', 'false');
              validation_result := jsonb_set(validation_result, '{errors}', 
                                           validation_result->'errors' || to_jsonb(error_message));
            ELSE
              validation_result := jsonb_set(validation_result, '{warnings}', 
                                           validation_result->'warnings' || to_jsonb(error_message));
            END IF;
          END IF;
          
        WHEN 'business_logic' THEN
          -- Custom business logic validation (simplified)
          -- In a real implementation, this would execute more complex logic
          IF rule.rule_config ? 'min_value' AND rule.rule_config ? 'field_name' THEN
            IF (contract_data->>(rule.rule_config->>'field_name'))::NUMERIC < 
               (rule.rule_config->>'min_value')::NUMERIC THEN
              error_message := COALESCE(rule.rule_config->>'error_message', 
                                      'Valor abaixo do mínimo permitido');
              
              IF rule.severity IN ('error', 'critical') THEN
                validation_result := jsonb_set(validation_result, '{valid}', 'false');
                validation_result := jsonb_set(validation_result, '{errors}', 
                                             validation_result->'errors' || to_jsonb(error_message));
              ELSE
                validation_result := jsonb_set(validation_result, '{warnings}', 
                                             validation_result->'warnings' || to_jsonb(error_message));
              END IF;
            END IF;
          END IF;
          
        ELSE
          -- Unknown rule type, skip
          CONTINUE;
      END CASE;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log validation rule error but continue
      RAISE WARNING 'Error applying validation rule %: %', rule.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
  
  RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure only one default workflow per tenant
CREATE OR REPLACE FUNCTION public.ensure_single_default_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a workflow as default, unset all other defaults for this tenant
  IF NEW.is_default = TRUE THEN
    UPDATE public.contract_generation_workflows 
    SET is_default = FALSE 
    WHERE tenant_id = NEW.tenant_id AND id != NEW.id AND is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply default workflow constraint trigger
CREATE TRIGGER ensure_single_default_workflow_trigger
  BEFORE INSERT OR UPDATE ON public.contract_generation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_workflow();

-- Function to auto-generate contract number on insert
CREATE OR REPLACE FUNCTION public.auto_generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate contract number if not provided
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := public.generate_contract_number(NEW.tenant_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply contract number generation trigger
CREATE TRIGGER auto_generate_contract_number_trigger
  BEFORE INSERT ON public.generated_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_contract_number();

-- Add comments for documentation
COMMENT ON TABLE public.contract_generation_requests IS 'Contract generation requests with workflow and approval tracking';
COMMENT ON COLUMN public.contract_generation_requests.contract_data IS 'Contract data populated from CRM lead information';
COMMENT ON COLUMN public.contract_generation_requests.variable_values IS 'Template variable values for contract population';
COMMENT ON COLUMN public.contract_generation_requests.generation_options IS 'Generation configuration options (format, styling, etc.)';

COMMENT ON TABLE public.generated_contracts IS 'Generated contracts with lifecycle tracking and signature management';
COMMENT ON COLUMN public.generated_contracts.contract_number IS 'Unique contract number (auto-generated if not provided)';
COMMENT ON COLUMN public.generated_contracts.customer_data IS 'Snapshot of customer data at time of generation';
COMMENT ON COLUMN public.generated_contracts.signature_requests IS 'Array of signature request information';

COMMENT ON TABLE public.contract_validation_rules IS 'Configurable validation rules for contract generation';
COMMENT ON COLUMN public.contract_validation_rules.rule_config IS 'Rule-specific configuration parameters';
COMMENT ON COLUMN public.contract_validation_rules.validation_script IS 'Custom validation script (for advanced rules)';

COMMENT ON TABLE public.contract_generation_workflows IS 'Configurable workflows for contract generation process';
COMMENT ON COLUMN public.contract_generation_workflows.workflow_steps IS 'Array of workflow step definitions';
COMMENT ON COLUMN public.contract_generation_workflows.trigger_conditions IS 'Conditions that trigger this workflow';