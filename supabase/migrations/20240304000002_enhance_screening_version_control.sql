-- Migration: Enhance screening template version control
-- Description: Adds comprehensive version control features for screening templates
-- Requirements: 3.5 - Template version control and historical assessment consistency

-- Create screening_template_versions table for version history
CREATE TABLE IF NOT EXISTS public.screening_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.screening_templates(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  
  -- Template snapshot at this version
  name TEXT NOT NULL,
  description TEXT,
  questionnaire_template_id UUID NOT NULL,
  screening_rules JSONB NOT NULL DEFAULT '[]',
  scoring_config JSONB NOT NULL DEFAULT '{}',
  output_config JSONB DEFAULT '{}',
  
  -- Version metadata
  version_notes TEXT,
  change_summary JSONB DEFAULT '{}', -- Summary of what changed
  created_by UUID REFERENCES auth.users(id),
  is_current BOOLEAN DEFAULT false,
  
  -- Compatibility tracking
  backward_compatible BOOLEAN DEFAULT true,
  breaking_changes JSONB DEFAULT '[]',
  migration_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_version_format CHECK (version ~ '^\\d+\\.\\d+$'),
  CONSTRAINT unique_template_version UNIQUE (template_id, version),
  CONSTRAINT unique_template_version_number UNIQUE (template_id, version_number)
);

-- Create screening_template_changes table for detailed change tracking
CREATE TABLE IF NOT EXISTS public.screening_template_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.screening_templates(id) ON DELETE CASCADE NOT NULL,
  version_id UUID REFERENCES public.screening_template_versions(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Change details
  change_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'rule_add', 'rule_remove', 'config_change'
  field_path TEXT, -- JSON path of changed field (e.g., 'scoring_config.max_score')
  old_value JSONB,
  new_value JSONB,
  change_description TEXT,
  
  -- Change metadata
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  impact_assessment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_change_type CHECK (change_type IN ('create', 'update', 'delete', 'rule_add', 'rule_remove', 'config_change', 'activation', 'deactivation'))
);

-- Create screening_assessment_consistency table for historical consistency tracking
CREATE TABLE IF NOT EXISTS public.screening_assessment_consistency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.screening_templates(id) ON DELETE CASCADE NOT NULL,
  version_id UUID REFERENCES public.screening_template_versions(id) ON DELETE CASCADE NOT NULL,
  
  -- Assessment period
  assessment_period_start TIMESTAMPTZ NOT NULL,
  assessment_period_end TIMESTAMPTZ NOT NULL,
  
  -- Consistency metrics
  total_assessments INTEGER DEFAULT 0,
  consistent_assessments INTEGER DEFAULT 0,
  inconsistent_assessments INTEGER DEFAULT 0,
  consistency_percentage DECIMAL(5,2) DEFAULT 100.0,
  
  -- Inconsistency details
  inconsistency_reasons JSONB DEFAULT '[]',
  affected_results JSONB DEFAULT '[]',
  
  -- Resolution tracking
  resolution_status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'accepted'
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (assessment_period_end > assessment_period_start),
  CONSTRAINT valid_consistency_percentage CHECK (consistency_percentage >= 0 AND consistency_percentage <= 100),
  CONSTRAINT valid_resolution_status CHECK (resolution_status IN ('pending', 'resolved', 'accepted'))
);

-- Add version tracking columns to existing screening_templates table
ALTER TABLE public.screening_templates 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES public.screening_template_versions(id),
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deprecation_reason TEXT;

-- Add version tracking to screening_results for historical consistency
ALTER TABLE public.screening_results
ADD COLUMN IF NOT EXISTS template_version TEXT,
ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES public.screening_template_versions(id),
ADD COLUMN IF NOT EXISTS consistency_check_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS consistency_check_notes TEXT;

-- Create indexes for performance
CREATE INDEX idx_screening_template_versions_template_id ON public.screening_template_versions(template_id);
CREATE INDEX idx_screening_template_versions_tenant_id ON public.screening_template_versions(tenant_id);
CREATE INDEX idx_screening_template_versions_version ON public.screening_template_versions(template_id, version);
CREATE INDEX idx_screening_template_versions_current ON public.screening_template_versions(template_id, is_current) WHERE is_current = true;
CREATE INDEX idx_screening_template_versions_created_at ON public.screening_template_versions(created_at DESC);

CREATE INDEX idx_screening_template_changes_template_id ON public.screening_template_changes(template_id);
CREATE INDEX idx_screening_template_changes_version_id ON public.screening_template_changes(version_id);
CREATE INDEX idx_screening_template_changes_type ON public.screening_template_changes(change_type);
CREATE INDEX idx_screening_template_changes_created_at ON public.screening_template_changes(created_at DESC);

CREATE INDEX idx_screening_assessment_consistency_template_id ON public.screening_assessment_consistency(template_id);
CREATE INDEX idx_screening_assessment_consistency_version_id ON public.screening_assessment_consistency(version_id);
CREATE INDEX idx_screening_assessment_consistency_period ON public.screening_assessment_consistency(assessment_period_start, assessment_period_end);
CREATE INDEX idx_screening_assessment_consistency_status ON public.screening_assessment_consistency(resolution_status);

CREATE INDEX idx_screening_results_template_version ON public.screening_results(template_version_id);
CREATE INDEX idx_screening_results_consistency_status ON public.screening_results(consistency_check_status);

-- Enable Row Level Security
ALTER TABLE public.screening_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_template_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_assessment_consistency ENABLE ROW LEVEL SECURITY;

-- RLS Policies for screening_template_versions
CREATE POLICY "Tenant users can view tenant template versions"
  ON public.screening_template_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_template_versions.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage template versions"
  ON public.screening_template_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_template_versions.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_template_versions.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for screening_template_changes
CREATE POLICY "Tenant users can view tenant template changes"
  ON public.screening_template_changes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_template_changes.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can create template changes"
  ON public.screening_template_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_template_changes.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for screening_assessment_consistency
CREATE POLICY "Tenant users can view tenant assessment consistency"
  ON public.screening_assessment_consistency
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_assessment_consistency.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage assessment consistency"
  ON public.screening_assessment_consistency
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_assessment_consistency.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_assessment_consistency.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_screening_template_versions_updated_at
  BEFORE UPDATE ON public.screening_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_screening_assessment_consistency_updated_at
  BEFORE UPDATE ON public.screening_assessment_consistency
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create a new template version
CREATE OR REPLACE FUNCTION public.create_screening_template_version(
  template_id_param UUID,
  tenant_id_param UUID,
  version_notes_param TEXT DEFAULT NULL,
  auto_increment BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
  current_template RECORD;
  new_version TEXT;
  new_version_number INTEGER;
  version_id UUID;
  user_id UUID;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  -- Get current template data
  SELECT * INTO current_template
  FROM public.screening_templates
  WHERE id = template_id_param AND tenant_id = tenant_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Calculate new version
  IF auto_increment THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO new_version_number
    FROM public.screening_template_versions
    WHERE template_id = template_id_param;
    
    new_version := SPLIT_PART(current_template.version, '.', 1) || '.' || new_version_number::TEXT;
  ELSE
    new_version := current_template.version;
    new_version_number := current_template.version_number;
  END IF;
  
  -- Mark previous version as not current
  UPDATE public.screening_template_versions
  SET is_current = false
  WHERE template_id = template_id_param;
  
  -- Create new version record
  INSERT INTO public.screening_template_versions (
    template_id,
    tenant_id,
    version,
    version_number,
    name,
    description,
    questionnaire_template_id,
    screening_rules,
    scoring_config,
    output_config,
    version_notes,
    created_by,
    is_current
  ) VALUES (
    template_id_param,
    tenant_id_param,
    new_version,
    new_version_number,
    current_template.name,
    current_template.description,
    current_template.questionnaire_template_id,
    current_template.screening_rules,
    current_template.scoring_config,
    current_template.output_config,
    version_notes_param,
    user_id,
    true
  ) RETURNING id INTO version_id;
  
  -- Update template with new version info
  UPDATE public.screening_templates
  SET 
    version = new_version,
    version_number = new_version_number,
    parent_version_id = version_id,
    published_at = NOW()
  WHERE id = template_id_param;
  
  -- Log the version creation
  INSERT INTO public.screening_template_changes (
    template_id,
    version_id,
    tenant_id,
    change_type,
    change_description,
    changed_by,
    change_reason
  ) VALUES (
    template_id_param,
    version_id,
    tenant_id_param,
    'create',
    'Created new template version ' || new_version,
    user_id,
    version_notes_param
  );
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track template changes
CREATE OR REPLACE FUNCTION public.track_screening_template_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  version_id UUID;
  change_summary JSONB := '{}';
BEGIN
  user_id := auth.uid();
  
  -- Get current version ID
  SELECT parent_version_id INTO version_id
  FROM public.screening_templates
  WHERE id = NEW.id;
  
  -- Track specific field changes
  IF OLD.name != NEW.name THEN
    INSERT INTO public.screening_template_changes (
      template_id, version_id, tenant_id, change_type, field_path,
      old_value, new_value, change_description, changed_by
    ) VALUES (
      NEW.id, version_id, NEW.tenant_id, 'update', 'name',
      to_jsonb(OLD.name), to_jsonb(NEW.name),
      'Template name changed from "' || OLD.name || '" to "' || NEW.name || '"',
      user_id
    );
  END IF;
  
  IF OLD.description != NEW.description THEN
    INSERT INTO public.screening_template_changes (
      template_id, version_id, tenant_id, change_type, field_path,
      old_value, new_value, change_description, changed_by
    ) VALUES (
      NEW.id, version_id, NEW.tenant_id, 'update', 'description',
      to_jsonb(OLD.description), to_jsonb(NEW.description),
      'Template description updated',
      user_id
    );
  END IF;
  
  IF OLD.screening_rules != NEW.screening_rules THEN
    INSERT INTO public.screening_template_changes (
      template_id, version_id, tenant_id, change_type, field_path,
      old_value, new_value, change_description, changed_by
    ) VALUES (
      NEW.id, version_id, NEW.tenant_id, 'update', 'screening_rules',
      OLD.screening_rules, NEW.screening_rules,
      'Screening rules configuration updated',
      user_id
    );
  END IF;
  
  IF OLD.scoring_config != NEW.scoring_config THEN
    INSERT INTO public.screening_template_changes (
      template_id, version_id, tenant_id, change_type, field_path,
      old_value, new_value, change_description, changed_by
    ) VALUES (
      NEW.id, version_id, NEW.tenant_id, 'config_change', 'scoring_config',
      OLD.scoring_config, NEW.scoring_config,
      'Scoring configuration updated',
      user_id
    );
  END IF;
  
  IF OLD.is_active != NEW.is_active THEN
    INSERT INTO public.screening_template_changes (
      template_id, version_id, tenant_id, change_type,
      old_value, new_value, change_description, changed_by
    ) VALUES (
      NEW.id, version_id, NEW.tenant_id, 
      CASE WHEN NEW.is_active THEN 'activation' ELSE 'deactivation' END,
      to_jsonb(OLD.is_active), to_jsonb(NEW.is_active),
      CASE WHEN NEW.is_active THEN 'Template activated' ELSE 'Template deactivated' END,
      user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for change tracking
CREATE TRIGGER trigger_track_screening_template_changes
  AFTER UPDATE ON public.screening_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.track_screening_template_changes();

-- Function to check assessment consistency
CREATE OR REPLACE FUNCTION public.check_screening_assessment_consistency(
  template_id_param UUID,
  tenant_id_param UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  consistency_record RECORD;
  total_assessments INTEGER := 0;
  consistent_assessments INTEGER := 0;
  inconsistent_assessments INTEGER := 0;
  consistency_percentage DECIMAL(5,2);
  inconsistency_reasons JSONB := '[]';
  result JSONB;
BEGIN
  -- Count total assessments in period
  SELECT COUNT(*) INTO total_assessments
  FROM public.screening_results sr
  WHERE sr.template_id = template_id_param
    AND sr.tenant_id = tenant_id_param
    AND sr.created_at BETWEEN start_date AND end_date;
  
  -- Check for consistency issues
  -- This is a simplified check - in practice, you'd implement more sophisticated consistency rules
  SELECT 
    COUNT(*) FILTER (WHERE consistency_check_status = 'consistent') as consistent_count,
    COUNT(*) FILTER (WHERE consistency_check_status = 'inconsistent') as inconsistent_count
  INTO consistent_assessments, inconsistent_assessments
  FROM public.screening_results sr
  WHERE sr.template_id = template_id_param
    AND sr.tenant_id = tenant_id_param
    AND sr.created_at BETWEEN start_date AND end_date;
  
  -- Calculate consistency percentage
  consistency_percentage := CASE 
    WHEN total_assessments > 0 THEN (consistent_assessments::DECIMAL / total_assessments * 100)
    ELSE 100.0
  END;
  
  -- Build result
  result := jsonb_build_object(
    'total_assessments', total_assessments,
    'consistent_assessments', consistent_assessments,
    'inconsistent_assessments', inconsistent_assessments,
    'consistency_percentage', consistency_percentage,
    'period_start', start_date,
    'period_end', end_date,
    'checked_at', NOW()
  );
  
  -- Insert or update consistency record
  INSERT INTO public.screening_assessment_consistency (
    tenant_id,
    template_id,
    assessment_period_start,
    assessment_period_end,
    total_assessments,
    consistent_assessments,
    inconsistent_assessments,
    consistency_percentage,
    inconsistency_reasons
  ) VALUES (
    tenant_id_param,
    template_id_param,
    start_date,
    end_date,
    total_assessments,
    consistent_assessments,
    inconsistent_assessments,
    consistency_percentage,
    inconsistency_reasons
  )
  ON CONFLICT (tenant_id, template_id, assessment_period_start)
  DO UPDATE SET
    assessment_period_end = end_date,
    total_assessments = EXCLUDED.total_assessments,
    consistent_assessments = EXCLUDED.consistent_assessments,
    inconsistent_assessments = EXCLUDED.inconsistent_assessments,
    consistency_percentage = EXCLUDED.consistency_percentage,
    updated_at = NOW();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.screening_template_versions IS 'Version history for screening templates with complete snapshots';
COMMENT ON TABLE public.screening_template_changes IS 'Detailed change tracking for screening template modifications';
COMMENT ON TABLE public.screening_assessment_consistency IS 'Historical assessment consistency tracking and validation';

COMMENT ON COLUMN public.screening_template_versions.change_summary IS 'Summary of changes made in this version';
COMMENT ON COLUMN public.screening_template_versions.backward_compatible IS 'Whether this version is backward compatible with previous versions';
COMMENT ON COLUMN public.screening_template_versions.breaking_changes IS 'List of breaking changes that may affect existing assessments';
COMMENT ON COLUMN public.screening_template_changes.field_path IS 'JSON path of the changed field for precise change tracking';
COMMENT ON COLUMN public.screening_assessment_consistency.consistency_percentage IS 'Percentage of assessments that remain consistent with template changes';