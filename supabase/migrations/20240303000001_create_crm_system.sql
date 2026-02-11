-- Migration: Create CRM system
-- Description: Creates lead management, pipeline stages, and interaction tracking
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Enhanced CRM Pipeline Management

-- Create lead_sources table for tracking lead origins
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_tenant_source_name UNIQUE (tenant_id, name)
);

-- Create pipeline_stages table for sales pipeline management
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  conversion_probability DECIMAL(5,2) DEFAULT 0.0,
  required_actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_conversion_probability CHECK (conversion_probability >= 0 AND conversion_probability <= 100),
  CONSTRAINT unique_tenant_stage_order UNIQUE (tenant_id, stage_order),
  CONSTRAINT unique_tenant_stage_name UNIQUE (tenant_id, name)
);

-- Create leads table for lead management
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Contact Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Lead Details
  source_id UUID REFERENCES public.lead_sources(id),
  status TEXT NOT NULL DEFAULT 'new',
  stage_id UUID REFERENCES public.pipeline_stages(id),
  score INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  
  -- Assignment and Ownership
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Additional Data
  notes TEXT,
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  
  -- Tracking
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
-- Create interaction_types table for categorizing interactions
CREATE TABLE IF NOT EXISTS public.interaction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#64748b',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_tenant_interaction_type UNIQUE (tenant_id, name)
);

-- Create lead_interactions table for tracking all customer interactions
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  
  -- Interaction Details
  type_id UUID REFERENCES public.interaction_types(id),
  channel TEXT NOT NULL DEFAULT 'manual',
  subject TEXT,
  content TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  
  -- User and Timing
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  interaction_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_channel CHECK (channel IN ('email', 'phone', 'whatsapp', 'sms', 'meeting', 'manual', 'web', 'social')),
  CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound'))
);

-- Create lead_stage_history table for tracking pipeline progression
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  
  -- Stage Transition
  from_stage_id UUID REFERENCES public.pipeline_stages(id),
  to_stage_id UUID REFERENCES public.pipeline_stages(id) NOT NULL,
  
  -- Transition Details
  reason TEXT,
  notes TEXT,
  duration_in_previous_stage INTERVAL,
  
  -- User and Timing
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create lead_scoring_rules table for configurable lead scoring
CREATE TABLE IF NOT EXISTS public.lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Rule Definition
  name TEXT NOT NULL,
  description TEXT,
  field_name TEXT NOT NULL,
  operator TEXT NOT NULL,
  value_criteria JSONB NOT NULL,
  score_points INTEGER NOT NULL,
  
  -- Rule Configuration
  is_active BOOLEAN DEFAULT true,
  rule_order INTEGER DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_operator CHECK (operator IN ('equals', 'contains', 'greater_than', 'less_than', 'in_list', 'not_empty', 'regex')),
  CONSTRAINT unique_tenant_rule_name UNIQUE (tenant_id, name)
);
-- Create indexes for performance
CREATE INDEX idx_lead_sources_tenant_id ON public.lead_sources(tenant_id);
CREATE INDEX idx_lead_sources_active ON public.lead_sources(is_active) WHERE is_active = true;

CREATE INDEX idx_pipeline_stages_tenant_id ON public.pipeline_stages(tenant_id);
CREATE INDEX idx_pipeline_stages_order ON public.pipeline_stages(tenant_id, stage_order);
CREATE INDEX idx_pipeline_stages_active ON public.pipeline_stages(is_active) WHERE is_active = true;

CREATE INDEX idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_created_by ON public.leads(created_by);
CREATE INDEX idx_leads_score ON public.leads(score DESC);
CREATE INDEX idx_leads_priority ON public.leads(priority);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_last_contact ON public.leads(last_contact_at DESC);
CREATE INDEX idx_leads_next_follow_up ON public.leads(next_follow_up_at);
CREATE INDEX idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_phone ON public.leads(phone) WHERE phone IS NOT NULL;

CREATE INDEX idx_interaction_types_tenant_id ON public.interaction_types(tenant_id);
CREATE INDEX idx_interaction_types_active ON public.interaction_types(is_active) WHERE is_active = true;

CREATE INDEX idx_lead_interactions_tenant_id ON public.lead_interactions(tenant_id);
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_type_id ON public.lead_interactions(type_id);
CREATE INDEX idx_lead_interactions_channel ON public.lead_interactions(channel);
CREATE INDEX idx_lead_interactions_date ON public.lead_interactions(interaction_date DESC);
CREATE INDEX idx_lead_interactions_created_by ON public.lead_interactions(created_by);

CREATE INDEX idx_lead_stage_history_tenant_id ON public.lead_stage_history(tenant_id);
CREATE INDEX idx_lead_stage_history_lead_id ON public.lead_stage_history(lead_id);
CREATE INDEX idx_lead_stage_history_changed_at ON public.lead_stage_history(changed_at DESC);

CREATE INDEX idx_lead_scoring_rules_tenant_id ON public.lead_scoring_rules(tenant_id);
CREATE INDEX idx_lead_scoring_rules_active ON public.lead_scoring_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_lead_scoring_rules_order ON public.lead_scoring_rules(tenant_id, rule_order);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_leads_tags ON public.leads USING GIN (tags);
CREATE INDEX idx_leads_custom_fields ON public.leads USING GIN (custom_fields);
CREATE INDEX idx_lead_interactions_metadata ON public.lead_interactions USING GIN (metadata);
CREATE INDEX idx_lead_interactions_attachments ON public.lead_interactions USING GIN (attachments);
CREATE INDEX idx_lead_scoring_rules_criteria ON public.lead_scoring_rules USING GIN (value_criteria);

-- Enable Row Level Security
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
-- RLS Policies for lead_sources
CREATE POLICY "Tenant users can view tenant lead sources"
  ON public.lead_sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_sources.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage lead sources"
  ON public.lead_sources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_sources.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_sources.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for pipeline_stages
CREATE POLICY "Tenant users can view tenant pipeline stages"
  ON public.pipeline_stages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = pipeline_stages.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage pipeline stages"
  ON public.pipeline_stages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = pipeline_stages.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = pipeline_stages.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for leads
CREATE POLICY "Tenant users can view tenant leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = leads.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant users can create leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = leads.tenant_id AND user_id = auth.uid() AND status = 'active'
    ) AND
    created_by = auth.uid()
  );

CREATE POLICY "Lead owners and managers can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = leads.tenant_id AND user_id = auth.uid() AND status = 'active'
    ) AND (
      assigned_to = auth.uid() OR 
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = leads.tenant_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'manager') 
          AND status = 'active'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = leads.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );
-- RLS Policies for interaction_types
CREATE POLICY "Tenant users can view tenant interaction types"
  ON public.interaction_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = interaction_types.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage interaction types"
  ON public.interaction_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = interaction_types.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = interaction_types.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- RLS Policies for lead_interactions
CREATE POLICY "Tenant users can view tenant lead interactions"
  ON public.lead_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_interactions.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant users can create lead interactions"
  ON public.lead_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_interactions.tenant_id AND user_id = auth.uid() AND status = 'active'
    ) AND
    created_by = auth.uid()
  );

CREATE POLICY "Interaction creators and managers can update interactions"
  ON public.lead_interactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_interactions.tenant_id AND user_id = auth.uid() AND status = 'active'
    ) AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = lead_interactions.tenant_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'manager') 
          AND status = 'active'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_interactions.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for lead_stage_history
CREATE POLICY "Tenant users can view tenant lead stage history"
  ON public.lead_stage_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_stage_history.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can insert stage history"
  ON public.lead_stage_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_stage_history.tenant_id AND user_id = auth.uid() AND status = 'active'
    ) AND
    changed_by = auth.uid()
  );
-- RLS Policies for lead_scoring_rules
CREATE POLICY "Tenant users can view tenant scoring rules"
  ON public.lead_scoring_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_scoring_rules.tenant_id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant managers can manage scoring rules"
  ON public.lead_scoring_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_scoring_rules.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = lead_scoring_rules.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager') 
        AND status = 'active'
    )
  );

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lead_scoring_rules_updated_at
  BEFORE UPDATE ON public.lead_scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate lead score based on scoring rules
CREATE OR REPLACE FUNCTION public.calculate_lead_score(lead_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  lead_record RECORD;
  rule_record RECORD;
  total_score INTEGER := 0;
  field_value TEXT;
  criteria_met BOOLEAN;
BEGIN
  -- Get the lead record
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Process each active scoring rule for the tenant
  FOR rule_record IN 
    SELECT * FROM public.lead_scoring_rules 
    WHERE tenant_id = lead_record.tenant_id AND is_active = true
    ORDER BY rule_order
  LOOP
    criteria_met := false;
    
    -- Get field value based on field_name
    CASE rule_record.field_name
      WHEN 'email' THEN field_value := lead_record.email;
      WHEN 'phone' THEN field_value := lead_record.phone;
      WHEN 'company' THEN field_value := lead_record.company;
      WHEN 'source_id' THEN field_value := lead_record.source_id::TEXT;
      WHEN 'status' THEN field_value := lead_record.status;
      WHEN 'priority' THEN field_value := lead_record.priority;
      ELSE 
        -- Check custom fields
        field_value := lead_record.custom_fields->>rule_record.field_name;
    END CASE;
    
    -- Evaluate criteria based on operator
    CASE rule_record.operator
      WHEN 'equals' THEN
        criteria_met := field_value = (rule_record.value_criteria->>'value');
      WHEN 'contains' THEN
        criteria_met := field_value ILIKE '%' || (rule_record.value_criteria->>'value') || '%';
      WHEN 'not_empty' THEN
        criteria_met := field_value IS NOT NULL AND field_value != '';
      WHEN 'in_list' THEN
        criteria_met := field_value = ANY(ARRAY(SELECT jsonb_array_elements_text(rule_record.value_criteria->'values')));
      ELSE
        criteria_met := false;
    END CASE;
    
    -- Add points if criteria met
    IF criteria_met THEN
      total_score := total_score + rule_record.score_points;
    END IF;
  END LOOP;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to update lead stage and create history record
CREATE OR REPLACE FUNCTION public.update_lead_stage(
  lead_id_param UUID,
  new_stage_id_param UUID,
  reason_param TEXT DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  lead_record RECORD;
  old_stage_id UUID;
  stage_duration INTERVAL;
BEGIN
  -- Get current lead data
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  
  old_stage_id := lead_record.stage_id;
  
  -- Calculate duration in previous stage
  IF old_stage_id IS NOT NULL THEN
    SELECT NOW() - updated_at INTO stage_duration FROM public.leads WHERE id = lead_id_param;
  END IF;
  
  -- Update lead stage
  UPDATE public.leads 
  SET 
    stage_id = new_stage_id_param,
    updated_at = NOW()
  WHERE id = lead_id_param;
  
  -- Create stage history record
  INSERT INTO public.lead_stage_history (
    tenant_id,
    lead_id,
    from_stage_id,
    to_stage_id,
    reason,
    notes,
    duration_in_previous_stage,
    changed_by
  ) VALUES (
    lead_record.tenant_id,
    lead_id_param,
    old_stage_id,
    new_stage_id_param,
    reason_param,
    notes_param,
    stage_duration,
    auth.uid()
  );
  
  -- Update tenant usage metrics
  PERFORM public.update_tenant_usage(lead_record.tenant_id, 'leads_count');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create lead interaction and update last contact
CREATE OR REPLACE FUNCTION public.create_lead_interaction(
  lead_id_param UUID,
  type_id_param UUID,
  channel_param TEXT,
  subject_param TEXT,
  content_param TEXT,
  direction_param TEXT DEFAULT 'outbound',
  metadata_param JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  lead_record RECORD;
  interaction_id UUID;
BEGIN
  -- Get lead data
  SELECT * INTO lead_record FROM public.leads WHERE id = lead_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  
  -- Create interaction record
  INSERT INTO public.lead_interactions (
    tenant_id,
    lead_id,
    type_id,
    channel,
    subject,
    content,
    direction,
    metadata,
    created_by
  ) VALUES (
    lead_record.tenant_id,
    lead_id_param,
    type_id_param,
    channel_param,
    subject_param,
    content_param,
    direction_param,
    metadata_param,
    auth.uid()
  ) RETURNING id INTO interaction_id;
  
  -- Update lead's last contact timestamp
  UPDATE public.leads 
  SET 
    last_contact_at = NOW(),
    updated_at = NOW()
  WHERE id = lead_id_param;
  
  RETURN interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to automatically calculate lead score on insert/update
CREATE OR REPLACE FUNCTION public.trigger_calculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := public.calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_lead_score_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_lead_score();

-- Insert default lead sources for ISOTEC tenant
INSERT INTO public.lead_sources (tenant_id, name, description) 
SELECT 
  t.id,
  source_name,
  source_desc
FROM public.tenants t,
(VALUES 
  ('Website', 'Leads from company website contact forms'),
  ('Referral', 'Customer referrals and word-of-mouth'),
  ('Social Media', 'Leads from social media platforms'),
  ('Cold Outreach', 'Cold calls and emails'),
  ('Trade Show', 'Leads from industry events and trade shows'),
  ('Partner', 'Leads from business partners'),
  ('Advertisement', 'Leads from paid advertising campaigns')
) AS sources(source_name, source_desc)
WHERE t.subdomain = 'isotec'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insert default pipeline stages for ISOTEC tenant
INSERT INTO public.pipeline_stages (tenant_id, name, description, stage_order, conversion_probability, required_actions)
SELECT 
  t.id,
  stage_name,
  stage_desc,
  stage_ord,
  conv_prob,
  req_actions::jsonb
FROM public.tenants t,
(VALUES 
  ('New Lead', 'Newly captured leads requiring initial qualification', 1, 10.0, '["Initial contact", "Qualify interest"]'),
  ('Contacted', 'Leads that have been contacted and showed interest', 2, 25.0, '["Needs assessment", "Schedule consultation"]'),
  ('Qualified', 'Qualified leads with confirmed interest and budget', 3, 50.0, '["Site assessment", "Prepare proposal"]'),
  ('Proposal Sent', 'Proposal has been sent to the customer', 4, 70.0, '["Follow up on proposal", "Address questions"]'),
  ('Negotiation', 'In active negotiation with the customer', 5, 85.0, '["Finalize terms", "Prepare contract"]'),
  ('Closed Won', 'Successfully closed deal', 6, 100.0, '["Contract signed", "Project handoff"]'),
  ('Closed Lost', 'Deal was lost or customer declined', 7, 0.0, '["Document reason", "Add to nurture campaign"]')
) AS stages(stage_name, stage_desc, stage_ord, conv_prob, req_actions)
WHERE t.subdomain = 'isotec'
ON CONFLICT (tenant_id, stage_order) DO NOTHING;

-- Insert default interaction types for ISOTEC tenant
INSERT INTO public.interaction_types (tenant_id, name, description, icon, color)
SELECT 
  t.id,
  type_name,
  type_desc,
  type_icon,
  type_color
FROM public.tenants t,
(VALUES 
  ('Phone Call', 'Phone conversation with lead/customer', 'phone', '#10b981'),
  ('Email', 'Email communication', 'mail', '#3b82f6'),
  ('WhatsApp', 'WhatsApp message or call', 'message-circle', '#25d366'),
  ('Meeting', 'In-person or video meeting', 'users', '#8b5cf6'),
  ('Site Visit', 'On-site consultation or assessment', 'map-pin', '#f59e0b'),
  ('Proposal', 'Proposal sent or presented', 'file-text', '#ef4444'),
  ('Follow-up', 'General follow-up activity', 'clock', '#64748b'),
  ('Note', 'Internal note or observation', 'edit-3', '#6b7280')
) AS types(type_name, type_desc, type_icon, type_color)
WHERE t.subdomain = 'isotec'
ON CONFLICT (tenant_id, name) DO NOTHING;
-- Insert default lead scoring rules for ISOTEC tenant
INSERT INTO public.lead_scoring_rules (tenant_id, name, description, field_name, operator, value_criteria, score_points, rule_order)
SELECT 
  t.id,
  rule_name,
  rule_desc,
  field_name,
  operator,
  criteria::jsonb,
  points,
  rule_ord
FROM public.tenants t,
(VALUES 
  ('Has Email', 'Lead provided email address', 'email', 'not_empty', '{}', 10, 1),
  ('Has Phone', 'Lead provided phone number', 'phone', 'not_empty', '{}', 15, 2),
  ('Has Company', 'Lead represents a company', 'company', 'not_empty', '{}', 20, 3),
  ('Website Source', 'Lead came from website', 'source_id', 'equals', '{"source_name": "Website"}', 25, 4),
  ('Referral Source', 'Lead came from referral', 'source_id', 'equals', '{"source_name": "Referral"}', 30, 5),
  ('High Priority', 'Lead marked as high priority', 'priority', 'equals', '{"value": "high"}', 40, 6),
  ('Urgent Priority', 'Lead marked as urgent', 'priority', 'equals', '{"value": "urgent"}', 50, 7)
) AS rules(rule_name, rule_desc, field_name, operator, criteria, points, rule_ord)
WHERE t.subdomain = 'isotec'
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.lead_sources IS 'Lead source tracking for marketing attribution and ROI analysis';
COMMENT ON TABLE public.pipeline_stages IS 'Configurable sales pipeline stages with conversion probabilities';
COMMENT ON TABLE public.leads IS 'Core lead/customer records with contact information and sales tracking';
COMMENT ON TABLE public.interaction_types IS 'Categorization of different types of customer interactions';
COMMENT ON TABLE public.lead_interactions IS 'Complete history of all customer interactions across channels';
COMMENT ON TABLE public.lead_stage_history IS 'Audit trail of lead progression through sales pipeline';
COMMENT ON TABLE public.lead_scoring_rules IS 'Configurable rules for automated lead scoring and qualification';

COMMENT ON COLUMN public.leads.score IS 'Automatically calculated lead score based on scoring rules';
COMMENT ON COLUMN public.leads.custom_fields IS 'Tenant-specific custom fields for additional lead data';
COMMENT ON COLUMN public.leads.tags IS 'Flexible tagging system for lead categorization';
COMMENT ON COLUMN public.pipeline_stages.conversion_probability IS 'Expected conversion rate for leads in this stage (0-100%)';
COMMENT ON COLUMN public.lead_interactions.metadata IS 'Channel-specific metadata (email headers, call duration, etc.)';
COMMENT ON COLUMN public.lead_scoring_rules.value_criteria IS 'JSON criteria for rule evaluation (values, thresholds, etc.)';