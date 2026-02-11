-- Migration: Integrate screening system with CRM pipeline
-- Description: Connects screening results to lead records and enables automated qualification
-- Requirements: 3.4 - Integrate screening with CRM pipeline

-- Add screening-related fields to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS screening_result_id UUID REFERENCES public.screening_results(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS screening_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS screening_qualification TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS screening_feasibility TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS screening_risk_level TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS screening_completed_at TIMESTAMPTZ;

-- Add constraints for screening fields
ALTER TABLE public.leads ADD CONSTRAINT valid_screening_qualification 
  CHECK (screening_qualification IS NULL OR screening_qualification IN ('qualified', 'partially_qualified', 'not_qualified'));
ALTER TABLE public.leads ADD CONSTRAINT valid_screening_feasibility 
  CHECK (screening_feasibility IS NULL OR screening_feasibility IN ('high', 'medium', 'low', 'not_feasible'));
ALTER TABLE public.leads ADD CONSTRAINT valid_screening_risk_level 
  CHECK (screening_risk_level IS NULL OR screening_risk_level IN ('low', 'medium', 'high', 'critical'));

-- Add lead_id reference to screening_results for direct relationship
ALTER TABLE public.screening_results ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id);

-- Create indexes for performance
CREATE INDEX idx_leads_screening_result_id ON public.leads(screening_result_id);
CREATE INDEX idx_leads_screening_score ON public.leads(screening_score DESC);
CREATE INDEX idx_leads_screening_qualification ON public.leads(screening_qualification);
CREATE INDEX idx_leads_screening_feasibility ON public.leads(screening_feasibility);
CREATE INDEX idx_leads_screening_completed_at ON public.leads(screening_completed_at DESC);
CREATE INDEX idx_screening_results_lead_id ON public.screening_results(lead_id);

-- Create screening_lead_qualification_rules table for automated qualification
CREATE TABLE IF NOT EXISTS public.screening_lead_qualification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Qualification Criteria
  min_screening_score DECIMAL(5,2),
  required_feasibility TEXT[],
  max_risk_level TEXT,
  required_qualification TEXT[],
  
  -- Actions to Take
  auto_assign_stage_id UUID REFERENCES public.pipeline_stages(id),
  auto_assign_status TEXT,
  auto_assign_priority TEXT,
  auto_assign_user_id UUID REFERENCES auth.users(id),
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  rule_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_auto_assign_status CHECK (auto_assign_status IS NULL OR auto_assign_status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  CONSTRAINT valid_auto_assign_priority CHECK (auto_assign_priority IS NULL OR auto_assign_priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT unique_tenant_qualification_rule_name UNIQUE (tenant_id, name)
);
-- Create screening_analytics_reports table for CRM integration analytics
CREATE TABLE IF NOT EXISTS public.screening_analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  
  -- Report Configuration
  date_range JSONB NOT NULL,
  filters JSONB DEFAULT '{}',
  
  -- Report Data
  screening_metrics JSONB DEFAULT '{}',
  crm_metrics JSONB DEFAULT '{}',
  conversion_metrics JSONB DEFAULT '{}',
  
  -- Metadata
  generated_by UUID REFERENCES auth.users(id) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_report_type CHECK (report_type IN ('screening_performance', 'lead_conversion', 'qualification_analysis', 'pipeline_impact')),
  CONSTRAINT unique_tenant_report_name UNIQUE (tenant_id, report_name, generated_at)
);

-- Create indexes for screening analytics reports
CREATE INDEX idx_screening_analytics_reports_tenant_id ON public.screening_analytics_reports(tenant_id);
CREATE INDEX idx_screening_analytics_reports_type ON public.screening_analytics_reports(report_type);
CREATE INDEX idx_screening_analytics_reports_generated_at ON public.screening_analytics_reports(generated_at DESC);

-- Enable RLS for new tables
ALTER TABLE public.screening_lead_qualification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_analytics_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for screening_lead_qualification_rules
CREATE POLICY "Tenant users can view tenant qualification rules"
  ON public.screening_lead_qualification_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_lead_qualification_rules.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage qualification rules"
  ON public.screening_lead_qualification_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_lead_qualification_rules.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_lead_qualification_rules.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for screening_analytics_reports
CREATE POLICY "Tenant users can view tenant screening reports"
  ON public.screening_analytics_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_analytics_reports.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant users can create screening reports"
  ON public.screening_analytics_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = screening_analytics_reports.tenant_id AND user_id = auth.uid() AND status = 'active'
    ) AND
    generated_by = auth.uid()
  );
-- Create triggers for updated_at timestamps
CREATE TRIGGER set_screening_lead_qualification_rules_updated_at
  BEFORE UPDATE ON public.screening_lead_qualification_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically update lead with screening results
CREATE OR REPLACE FUNCTION public.update_lead_with_screening_results()
RETURNS TRIGGER AS $$
DECLARE
  lead_record RECORD;
  qualification_rules RECORD;
BEGIN
  -- Get the lead associated with this screening result
  IF NEW.lead_id IS NOT NULL THEN
    SELECT * INTO lead_record FROM public.leads WHERE id = NEW.lead_id;
    
    IF FOUND THEN
      -- Update lead with screening data
      UPDATE public.leads SET
        screening_result_id = NEW.id,
        screening_score = NEW.percentage_score,
        screening_qualification = NEW.qualification_level,
        screening_feasibility = NEW.feasibility_rating,
        screening_risk_level = NEW.risk_level,
        screening_completed_at = NEW.created_at,
        updated_at = NOW()
      WHERE id = NEW.lead_id;
      
      -- Apply automatic qualification rules
      FOR qualification_rules IN 
        SELECT * FROM public.screening_lead_qualification_rules 
        WHERE tenant_id = NEW.tenant_id 
          AND is_active = true
        ORDER BY rule_order
      LOOP
        -- Check if screening result meets rule criteria
        IF (qualification_rules.min_screening_score IS NULL OR NEW.percentage_score >= qualification_rules.min_screening_score)
          AND (qualification_rules.required_feasibility IS NULL OR NEW.feasibility_rating = ANY(qualification_rules.required_feasibility))
          AND (qualification_rules.max_risk_level IS NULL OR 
               CASE NEW.risk_level
                 WHEN 'low' THEN 1
                 WHEN 'medium' THEN 2
                 WHEN 'high' THEN 3
                 WHEN 'critical' THEN 4
               END <= 
               CASE qualification_rules.max_risk_level
                 WHEN 'low' THEN 1
                 WHEN 'medium' THEN 2
                 WHEN 'high' THEN 3
                 WHEN 'critical' THEN 4
               END)
          AND (qualification_rules.required_qualification IS NULL OR NEW.qualification_level = ANY(qualification_rules.required_qualification))
        THEN
          -- Apply the rule actions
          UPDATE public.leads SET
            stage_id = COALESCE(qualification_rules.auto_assign_stage_id, stage_id),
            status = COALESCE(qualification_rules.auto_assign_status, status),
            priority = COALESCE(qualification_rules.auto_assign_priority, priority),
            assigned_to = COALESCE(qualification_rules.auto_assign_user_id, assigned_to),
            updated_at = NOW()
          WHERE id = NEW.lead_id;
          
          -- Create interaction record for automatic qualification
          INSERT INTO public.lead_interactions (
            tenant_id,
            lead_id,
            channel,
            content,
            direction,
            metadata,
            created_by
          ) VALUES (
            NEW.tenant_id,
            NEW.lead_id,
            'manual',
            'Lead automatically qualified based on screening results: ' || qualification_rules.name,
            'outbound',
            jsonb_build_object(
              'screening_result_id', NEW.id,
              'qualification_rule_id', qualification_rules.id,
              'screening_score', NEW.percentage_score,
              'qualification_level', NEW.qualification_level,
              'feasibility_rating', NEW.feasibility_rating,
              'risk_level', NEW.risk_level
            ),
            COALESCE(qualification_rules.auto_assign_user_id, lead_record.created_by)
          );
          
          -- Exit after first matching rule
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic lead updates
CREATE TRIGGER trigger_update_lead_with_screening_results
  AFTER INSERT OR UPDATE ON public.screening_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_with_screening_results();
-- Function to generate screening-CRM analytics report
CREATE OR REPLACE FUNCTION public.generate_screening_crm_analytics(
  tenant_id_param UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  report_type TEXT DEFAULT 'screening_performance'
) RETURNS JSONB AS $$
DECLARE
  screening_metrics JSONB;
  crm_metrics JSONB;
  conversion_metrics JSONB;
  final_report JSONB;
BEGIN
  -- Calculate screening metrics
  SELECT jsonb_build_object(
    'total_screenings', COUNT(*),
    'avg_screening_score', ROUND(AVG(percentage_score), 2),
    'qualification_distribution', jsonb_object_agg(qualification_level, qualification_count),
    'feasibility_distribution', jsonb_object_agg(feasibility_rating, feasibility_count),
    'risk_distribution', jsonb_object_agg(risk_level, risk_count)
  ) INTO screening_metrics
  FROM (
    SELECT 
      sr.percentage_score,
      sr.qualification_level,
      sr.feasibility_rating,
      sr.risk_level,
      COUNT(*) OVER (PARTITION BY sr.qualification_level) as qualification_count,
      COUNT(*) OVER (PARTITION BY sr.feasibility_rating) as feasibility_count,
      COUNT(*) OVER (PARTITION BY sr.risk_level) as risk_count
    FROM public.screening_results sr
    WHERE sr.tenant_id = tenant_id_param
      AND sr.created_at BETWEEN start_date AND end_date
  ) screening_data;
  
  -- Calculate CRM metrics for screened leads
  SELECT jsonb_build_object(
    'screened_leads_count', COUNT(*),
    'avg_lead_score', ROUND(AVG(l.score), 2),
    'status_distribution', jsonb_object_agg(l.status, status_count),
    'stage_distribution', jsonb_object_agg(ps.name, stage_count),
    'avg_screening_to_qualification_days', ROUND(AVG(EXTRACT(EPOCH FROM (l.updated_at - l.screening_completed_at)) / 86400), 2)
  ) INTO crm_metrics
  FROM (
    SELECT 
      l.*,
      COUNT(*) OVER (PARTITION BY l.status) as status_count,
      COUNT(*) OVER (PARTITION BY l.stage_id) as stage_count
    FROM public.leads l
    WHERE l.tenant_id = tenant_id_param
      AND l.screening_completed_at IS NOT NULL
      AND l.screening_completed_at BETWEEN start_date AND end_date
  ) l
  LEFT JOIN public.pipeline_stages ps ON l.stage_id = ps.id;
  
  -- Calculate conversion metrics
  SELECT jsonb_build_object(
    'screening_to_qualified_rate', 
    ROUND(
      (COUNT(*) FILTER (WHERE l.screening_qualification = 'qualified')::DECIMAL / 
       NULLIF(COUNT(*), 0) * 100), 2
    ),
    'screening_to_closed_won_rate',
    ROUND(
      (COUNT(*) FILTER (WHERE l.status = 'closed_won')::DECIMAL / 
       NULLIF(COUNT(*), 0) * 100), 2
    ),
    'high_feasibility_conversion_rate',
    ROUND(
      (COUNT(*) FILTER (WHERE l.screening_feasibility = 'high' AND l.status = 'closed_won')::DECIMAL / 
       NULLIF(COUNT(*) FILTER (WHERE l.screening_feasibility = 'high'), 0) * 100), 2
    ),
    'qualified_leads_by_score_range', jsonb_build_object(
      'high_score_80_plus', COUNT(*) FILTER (WHERE l.screening_score >= 80 AND l.screening_qualification = 'qualified'),
      'medium_score_60_79', COUNT(*) FILTER (WHERE l.screening_score >= 60 AND l.screening_score < 80 AND l.screening_qualification = 'qualified'),
      'low_score_below_60', COUNT(*) FILTER (WHERE l.screening_score < 60 AND l.screening_qualification = 'qualified')
    )
  ) INTO conversion_metrics
  FROM public.leads l
  WHERE l.tenant_id = tenant_id_param
    AND l.screening_completed_at IS NOT NULL
    AND l.screening_completed_at BETWEEN start_date AND end_date;
  
  -- Build final report
  final_report := jsonb_build_object(
    'report_type', report_type,
    'period', jsonb_build_object('start_date', start_date, 'end_date', end_date),
    'screening_metrics', COALESCE(screening_metrics, '{}'),
    'crm_metrics', COALESCE(crm_metrics, '{}'),
    'conversion_metrics', COALESCE(conversion_metrics, '{}'),
    'generated_at', NOW()
  );
  
  RETURN final_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default qualification rules for ISOTEC tenant
INSERT INTO public.screening_lead_qualification_rules (
  tenant_id, 
  name, 
  description, 
  min_screening_score, 
  required_feasibility, 
  max_risk_level, 
  required_qualification,
  auto_assign_status,
  auto_assign_priority,
  rule_order
)
SELECT 
  t.id,
  rules.rule_name,
  rules.rule_desc,
  rules.min_score,
  rules.feasibility_array,
  rules.max_risk,
  rules.qualification_array,
  rules.status,
  rules.priority,
  rules.rule_ord
FROM public.tenants t,
(VALUES 
  ('High Quality Qualified Leads', 'Automatically qualify high-scoring leads with excellent feasibility', 80.0, ARRAY['high'], 'medium', ARRAY['qualified'], 'qualified', 'high', 1),
  ('Medium Quality Leads', 'Partially qualified leads requiring follow-up', 60.0, ARRAY['high', 'medium'], 'high', ARRAY['qualified', 'partially_qualified'], 'contacted', 'medium', 2),
  ('Low Risk Qualified Leads', 'Qualified leads with low risk regardless of score', 40.0, ARRAY['high', 'medium'], 'low', ARRAY['qualified'], 'qualified', 'medium', 3)
) AS rules(rule_name, rule_desc, min_score, feasibility_array, max_risk, qualification_array, status, priority, rule_ord)
WHERE t.subdomain = 'isotec'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.screening_result_id IS 'Reference to the screening result that assessed this lead';
COMMENT ON COLUMN public.leads.screening_score IS 'Percentage score from project screening assessment';
COMMENT ON COLUMN public.leads.screening_qualification IS 'Qualification level determined by screening';
COMMENT ON COLUMN public.leads.screening_feasibility IS 'Project feasibility rating from screening';
COMMENT ON COLUMN public.leads.screening_risk_level IS 'Risk level identified during screening';
COMMENT ON COLUMN public.leads.screening_completed_at IS 'Timestamp when screening was completed';

COMMENT ON TABLE public.screening_lead_qualification_rules IS 'Rules for automatically qualifying leads based on screening results';
COMMENT ON TABLE public.screening_analytics_reports IS 'Generated reports combining screening and CRM analytics';

COMMENT ON COLUMN public.screening_results.lead_id IS 'Direct reference to the lead this screening result belongs to';