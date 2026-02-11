-- Migration: Create project screening system
-- Description: Creates screening rules, templates, and results tables for automated project assessment
-- Requirements: 3.2, 3.3 - Project screening and scoring engine

-- Create screening_rules table
CREATE TABLE IF NOT EXISTS public.screening_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  category TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  scoring JSONB NOT NULL DEFAULT '{}',
  thresholds JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('threshold', 'range', 'weighted_sum', 'conditional', 'formula')),
  CONSTRAINT valid_category CHECK (category IN ('technical', 'financial', 'regulatory', 'commercial', 'environmental')),
  CONSTRAINT unique_tenant_screening_rule_name UNIQUE (tenant_id, name)
);

-- Create screening_templates table
CREATE TABLE IF NOT EXISTS public.screening_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  questionnaire_template_id UUID REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  screening_rules JSONB NOT NULL DEFAULT '[]', -- Array of rule IDs
  scoring_config JSONB NOT NULL DEFAULT '{}',
  output_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_version_format CHECK (version ~ '^\\d+\\.\\d+$'),
  CONSTRAINT unique_tenant_template_name UNIQUE (tenant_id, name),
  CONSTRAINT unique_tenant_questionnaire_version UNIQUE (tenant_id, questionnaire_template_id, version)
);

-- Create screening_results table
CREATE TABLE IF NOT EXISTS public.screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  response_id UUID REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.screening_templates(id) ON DELETE CASCADE NOT NULL,
  
  -- Core Scoring
  total_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_possible_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  percentage_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Category Scores
  category_scores JSONB DEFAULT '{}',
  
  -- Assessment Results
  feasibility_rating TEXT NOT NULL,
  qualification_level TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  follow_up_priority TEXT NOT NULL,
  
  -- Detailed Analysis
  recommendations JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  next_steps JSONB DEFAULT '[]',
  
  -- Project Estimates
  project_estimates JSONB DEFAULT '{}',
  
  -- Rule Application Details
  applied_rules JSONB DEFAULT '[]',
  
  -- Metadata
  calculation_metadata JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_feasibility_rating CHECK (feasibility_rating IN ('high', 'medium', 'low', 'not_feasible')),
  CONSTRAINT valid_qualification_level CHECK (qualification_level IN ('qualified', 'partially_qualified', 'not_qualified')),
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_follow_up_priority CHECK (follow_up_priority IN ('high', 'medium', 'low')),
  CONSTRAINT valid_percentage_score CHECK (percentage_score >= 0 AND percentage_score <= 100),
  CONSTRAINT unique_response_result UNIQUE (response_id, template_id)
);

-- Create screening_analytics table for aggregated metrics
CREATE TABLE IF NOT EXISTS public.screening_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.screening_templates(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Volume Metrics
  total_screenings INTEGER DEFAULT 0,
  completed_screenings INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Quality Metrics
  qualification_distribution JSONB DEFAULT '{}',
  feasibility_distribution JSONB DEFAULT '{}',
  
  -- Score Analytics
  score_statistics JSONB DEFAULT '{}',
  category_performance JSONB DEFAULT '{}',
  
  -- Conversion Metrics
  conversion_metrics JSONB DEFAULT '{}',
  
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT unique_tenant_template_period UNIQUE (tenant_id, template_id, period_start)
);

-- Create indexes for performance
CREATE INDEX idx_screening_rules_tenant_id ON public.screening_rules(tenant_id);
CREATE INDEX idx_screening_rules_category ON public.screening_rules(category);
CREATE INDEX idx_screening_rules_active ON public.screening_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_screening_rules_priority ON public.screening_rules(tenant_id, priority);

CREATE INDEX idx_screening_templates_tenant_id ON public.screening_templates(tenant_id);
CREATE INDEX idx_screening_templates_questionnaire_id ON public.screening_templates(questionnaire_template_id);
CREATE INDEX idx_screening_templates_active ON public.screening_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_screening_results_tenant_id ON public.screening_results(tenant_id);
CREATE INDEX idx_screening_results_response_id ON public.screening_results(response_id);
CREATE INDEX idx_screening_results_template_id ON public.screening_results(template_id);
CREATE INDEX idx_screening_results_feasibility ON public.screening_results(feasibility_rating);
CREATE INDEX idx_screening_results_qualification ON public.screening_results(qualification_level);
CREATE INDEX idx_screening_results_risk_level ON public.screening_results(risk_level);
CREATE INDEX idx_screening_results_priority ON public.screening_results(follow_up_priority);
CREATE INDEX idx_screening_results_score ON public.screening_results(percentage_score DESC);
CREATE INDEX idx_screening_results_created_at ON public.screening_results(created_at DESC);

CREATE INDEX idx_screening_analytics_tenant_id ON public.screening_analytics(tenant_id);
CREATE INDEX idx_screening_analytics_template_id ON public.screening_analytics(template_id);
CREATE INDEX idx_screening_analytics_period ON public.screening_analytics(period_start, period_end);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_screening_rules_conditions ON public.screening_rules USING GIN (conditions);
CREATE INDEX idx_screening_rules_scoring ON public.screening_rules USING GIN (scoring);
CREATE INDEX idx_screening_rules_recommendations ON public.screening_rules USING GIN (recommendations);

CREATE INDEX idx_screening_templates_rules ON public.screening_templates USING GIN (screening_rules);
CREATE INDEX idx_screening_templates_scoring_config ON public.screening_templates USING GIN (scoring_config);

CREATE INDEX idx_screening_results_category_scores ON public.screening_results USING GIN (category_scores);
CREATE INDEX idx_screening_results_recommendations ON public.screening_results USING GIN (recommendations);
CREATE INDEX idx_screening_results_applied_rules ON public.screening_results USING GIN (applied_rules);
CREATE INDEX idx_screening_results_project_estimates ON public.screening_results USING GIN (project_estimates);

-- Enable Row Level Security
ALTER TABLE public.screening_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_analytics ENABLE ROW LEVEL SECURITY;
-- RLS Policies for screening_rules
CREATE POLICY "Tenant users can view tenant screening rules"
  ON public.screening_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_rules.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage screening rules"
  ON public.screening_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_rules.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_rules.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for screening_templates
CREATE POLICY "Tenant users can view tenant screening templates"
  ON public.screening_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_templates.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage screening templates"
  ON public.screening_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_templates.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_templates.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for screening_results
CREATE POLICY "Tenant users can view tenant screening results"
  ON public.screening_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_results.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can create screening results"
  ON public.screening_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_results.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage screening results"
  ON public.screening_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_results.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_results.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for screening_analytics
CREATE POLICY "Tenant users can view tenant screening analytics"
  ON public.screening_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_analytics.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can manage screening analytics"
  ON public.screening_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_analytics.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_analytics.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_screening_rules_updated_at
  BEFORE UPDATE ON public.screening_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_screening_templates_updated_at
  BEFORE UPDATE ON public.screening_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_screening_results_updated_at
  BEFORE UPDATE ON public.screening_results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to process screening automatically when questionnaire is completed
CREATE OR REPLACE FUNCTION public.process_screening_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  screening_template_id UUID;
  tenant_id_param UUID;
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tenant_id from questionnaire template
    SELECT new_tenant_id INTO tenant_id_param
    FROM public.questionnaire_templates
    WHERE id = NEW.template_id;
    
    -- Skip if no tenant (public template)
    IF tenant_id_param IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Find active screening template for this questionnaire
    SELECT id INTO screening_template_id
    FROM public.screening_templates
    WHERE tenant_id = tenant_id_param
      AND questionnaire_template_id = NEW.template_id
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If screening template exists, trigger processing
    IF screening_template_id IS NOT NULL THEN
      -- Insert a job record or call screening service
      -- For now, we'll just update the response to indicate screening is needed
      UPDATE public.questionnaire_responses
      SET screening_result = jsonb_set(
        COALESCE(screening_result, '{}'),
        '{screening_template_id}',
        to_jsonb(screening_template_id)
      )
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic screening processing
CREATE TRIGGER trigger_process_screening_on_completion
  AFTER UPDATE ON public.questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.process_screening_on_completion();

-- Function to calculate screening analytics
CREATE OR REPLACE FUNCTION public.calculate_screening_analytics(
  tenant_id_param UUID,
  template_id_param UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  analytics_result JSONB;
  total_screenings INTEGER;
  completed_screenings INTEGER;
  qualification_dist JSONB;
  feasibility_dist JSONB;
  score_stats JSONB;
BEGIN
  -- Get total screenings count
  SELECT COUNT(*) INTO total_screenings
  FROM public.screening_results sr
  WHERE sr.tenant_id = tenant_id_param
    AND sr.template_id = template_id_param
    AND sr.created_at BETWEEN start_date AND end_date;
  
  -- Get completed screenings (those with results)
  completed_screenings := total_screenings;
  
  -- Calculate qualification distribution
  SELECT jsonb_object_agg(qualification_level, count) INTO qualification_dist
  FROM (
    SELECT qualification_level, COUNT(*) as count
    FROM public.screening_results sr
    WHERE sr.tenant_id = tenant_id_param
      AND sr.template_id = template_id_param
      AND sr.created_at BETWEEN start_date AND end_date
    GROUP BY qualification_level
  ) q;
  
  -- Calculate feasibility distribution
  SELECT jsonb_object_agg(feasibility_rating, count) INTO feasibility_dist
  FROM (
    SELECT feasibility_rating, COUNT(*) as count
    FROM public.screening_results sr
    WHERE sr.tenant_id = tenant_id_param
      AND sr.template_id = template_id_param
      AND sr.created_at BETWEEN start_date AND end_date
    GROUP BY feasibility_rating
  ) f;
  
  -- Calculate score statistics
  SELECT jsonb_build_object(
    'average_score', COALESCE(AVG(percentage_score), 0),
    'median_score', COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage_score), 0),
    'min_score', COALESCE(MIN(percentage_score), 0),
    'max_score', COALESCE(MAX(percentage_score), 0)
  ) INTO score_stats
  FROM public.screening_results sr
  WHERE sr.tenant_id = tenant_id_param
    AND sr.template_id = template_id_param
    AND sr.created_at BETWEEN start_date AND end_date;
  
  -- Build final analytics result
  analytics_result := jsonb_build_object(
    'total_screenings', total_screenings,
    'completed_screenings', completed_screenings,
    'completion_rate', CASE WHEN total_screenings > 0 THEN (completed_screenings::DECIMAL / total_screenings * 100) ELSE 0 END,
    'qualification_distribution', COALESCE(qualification_dist, '{}'),
    'feasibility_distribution', COALESCE(feasibility_dist, '{}'),
    'score_statistics', COALESCE(score_stats, '{}'),
    'period', jsonb_build_object('start_date', start_date, 'end_date', end_date),
    'generated_at', NOW()
  );
  
  RETURN analytics_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default screening rules for ISOTEC tenant
INSERT INTO public.screening_rules (tenant_id, name, description, rule_type, category, conditions, scoring, thresholds, recommendations, risk_factors, priority)
SELECT 
  t.id,
  rule_name,
  rule_desc,
  rule_type,
  category,
  conditions::jsonb,
  scoring::jsonb,
  thresholds::jsonb,
  recommendations::jsonb,
  risk_factors::jsonb,
  priority
FROM public.tenants t,
(VALUES 
  ('High Energy Consumption', 'Customers with high monthly energy bills are better candidates', 'threshold', 'financial', 
   '[{"questionId": "", "operator": "greater_than", "value": 300, "weight": 1.0}]',
   '{"points": 25, "weight": 2.0}',
   '{"high": 500, "medium": 300, "low": 150}',
   '{"qualified": "Excellent candidate for solar installation with high potential savings", "partially_qualified": "Good candidate with moderate savings potential", "not_qualified": "Low energy consumption may not justify solar investment"}',
   '[]', 1),
   
  ('Roof Condition Assessment', 'Roof condition affects installation feasibility and costs', 'weighted_sum', 'technical',
   '[{"questionId": "", "operator": "equals", "value": "excellent", "weight": 1.0}]',
   '{"points": 20, "weight": 1.5}',
   '{}',
   '{"qualified": "Roof is in excellent condition for solar installation", "partially_qualified": "Roof may need minor repairs before installation", "not_qualified": "Roof requires significant repairs before solar installation"}',
   '["Roof structural integrity", "Weather resistance"]', 2),
   
  ('Solar Orientation Optimization', 'Roof orientation affects solar panel efficiency', 'weighted_sum', 'technical',
   '[{"questionId": "", "operator": "equals", "value": "north", "weight": 1.0}]',
   '{"points": 15, "weight": 1.0}',
   '{"high": 15, "medium": 10, "low": 5}',
   '{"qualified": "Optimal roof orientation for maximum solar efficiency", "partially_qualified": "Good roof orientation with acceptable efficiency", "not_qualified": "Suboptimal orientation may reduce system efficiency"}',
   '[]', 3),
   
  ('Shading Impact Assessment', 'Shading significantly reduces solar panel efficiency', 'conditional', 'technical',
   '[{"questionId": "", "operator": "equals", "value": false, "weight": 1.0}]',
   '{"points": 10, "weight": 1.0}',
   '{}',
   '{"qualified": "Minimal shading allows for optimal solar performance", "not_qualified": "Significant shading may require system redesign or tree removal"}',
   '["Reduced energy production", "Potential hot spots on panels"]', 4),
   
  ('Customer Interest Level', 'Customer interest level affects project success probability', 'threshold', 'commercial',
   '[{"questionId": "", "operator": "greater_than", "value": 7, "weight": 1.0}]',
   '{"points": 10, "weight": 0.5}',
   '{"high": 9, "medium": 7, "low": 5}',
   '{"qualified": "High customer interest indicates strong project potential", "partially_qualified": "Moderate interest requires additional nurturing", "not_qualified": "Low interest may indicate poor timing or fit"}',
   '[]', 5)
) AS rules(rule_name, rule_desc, rule_type, category, conditions, scoring, thresholds, recommendations, risk_factors, priority)
WHERE t.subdomain = 'isotec'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.screening_rules IS 'Configurable rules for automated project screening and scoring';
COMMENT ON TABLE public.screening_templates IS 'Templates that define screening configuration for questionnaires';
COMMENT ON TABLE public.screening_results IS 'Results of automated project screening with detailed analysis';
COMMENT ON TABLE public.screening_analytics IS 'Aggregated analytics for screening performance and trends';

COMMENT ON COLUMN public.screening_rules.rule_type IS 'Type of screening rule: threshold, range, weighted_sum, conditional, formula';
COMMENT ON COLUMN public.screening_rules.category IS 'Category of assessment: technical, financial, regulatory, commercial, environmental';
COMMENT ON COLUMN public.screening_rules.conditions IS 'JSONB array of conditions that must be met for rule to apply';
COMMENT ON COLUMN public.screening_rules.scoring IS 'Scoring configuration including points and weight';
COMMENT ON COLUMN public.screening_templates.screening_rules IS 'Array of screening rule IDs to apply';
COMMENT ON COLUMN public.screening_results.category_scores IS 'Breakdown of scores by assessment category';
COMMENT ON COLUMN public.screening_results.applied_rules IS 'Details of which rules were applied and their results';