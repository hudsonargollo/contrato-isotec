-- Migration: Create questionnaire system tables
-- Description: Creates tables for dynamic questionnaire templates, questions, and responses
-- Requirements: 3.1 - Project Planning and Screening System

-- Create questionnaire templates table
CREATE TABLE IF NOT EXISTS public.questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE, -- For public marketing funnels
  scoring_rules JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_version_format CHECK (version ~ '^\d+\.\d+$')
);

-- Create questionnaire questions table
CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE NOT NULL,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_options JSONB DEFAULT '[]', -- For multiple choice, checkboxes, etc.
  weight DECIMAL(5,2) DEFAULT 1.0,
  is_required BOOLEAN DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  conditional_logic JSONB DEFAULT '{}', -- For showing/hiding questions based on other answers
  validation_rules JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_question_type CHECK (question_type IN (
    'text', 'textarea', 'number', 'email', 'phone', 'url',
    'single_choice', 'multiple_choice', 'boolean', 'scale',
    'date', 'time', 'datetime', 'file_upload'
  )),
  CONSTRAINT positive_weight CHECK (weight >= 0),
  CONSTRAINT valid_sort_order CHECK (sort_order >= 0)
);

-- Create questionnaire responses table
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.questionnaire_templates(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL, -- For anonymous responses
  respondent_email TEXT, -- Optional for lead capture
  respondent_name TEXT, -- Optional for lead capture
  respondent_phone TEXT, -- Optional for lead capture
  responses JSONB NOT NULL DEFAULT '{}', -- Question ID -> Answer mapping
  calculated_score DECIMAL(10,2) DEFAULT 0,
  screening_result JSONB DEFAULT '{}', -- Feasibility rating, recommendations, etc.
  status TEXT DEFAULT 'in_progress',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  CONSTRAINT valid_email_format CHECK (respondent_email IS NULL OR respondent_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT completed_responses_have_completion_date CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed')
  )
);

-- Create indexes for performance
CREATE INDEX idx_questionnaire_templates_tenant_id ON public.questionnaire_templates(tenant_id);
CREATE INDEX idx_questionnaire_templates_active ON public.questionnaire_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_questionnaire_templates_public ON public.questionnaire_templates(is_public) WHERE is_public = TRUE;

CREATE INDEX idx_questionnaire_questions_template_id ON public.questionnaire_questions(template_id);
CREATE INDEX idx_questionnaire_questions_sort_order ON public.questionnaire_questions(template_id, sort_order);
CREATE INDEX idx_questionnaire_questions_type ON public.questionnaire_questions(question_type);

CREATE INDEX idx_questionnaire_responses_template_id ON public.questionnaire_responses(template_id);
CREATE INDEX idx_questionnaire_responses_session_id ON public.questionnaire_responses(session_id);
CREATE INDEX idx_questionnaire_responses_email ON public.questionnaire_responses(respondent_email) WHERE respondent_email IS NOT NULL;
CREATE INDEX idx_questionnaire_responses_status ON public.questionnaire_responses(status);
CREATE INDEX idx_questionnaire_responses_created_at ON public.questionnaire_responses(created_at DESC);
CREATE INDEX idx_questionnaire_responses_utm ON public.questionnaire_responses(utm_source, utm_medium, utm_campaign) WHERE utm_source IS NOT NULL;

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_questionnaire_templates_scoring_rules ON public.questionnaire_templates USING GIN (scoring_rules);
CREATE INDEX idx_questionnaire_questions_options ON public.questionnaire_questions USING GIN (question_options);
CREATE INDEX idx_questionnaire_questions_conditional_logic ON public.questionnaire_questions USING GIN (conditional_logic);
CREATE INDEX idx_questionnaire_responses_responses ON public.questionnaire_responses USING GIN (responses);
CREATE INDEX idx_questionnaire_responses_screening_result ON public.questionnaire_responses USING GIN (screening_result);

-- Enable Row Level Security
ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questionnaire_templates
-- Public can view active public templates (for marketing funnels)
CREATE POLICY "Public can view active public templates"
  ON public.questionnaire_templates
  FOR SELECT
  USING (is_active = TRUE AND is_public = TRUE);

-- Authenticated users can view all templates for their tenant
CREATE POLICY "Authenticated users can view tenant templates"
  ON public.questionnaire_templates
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.questionnaire_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for questionnaire_questions
-- Public can view questions for active public templates
CREATE POLICY "Public can view questions for public templates"
  ON public.questionnaire_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates 
      WHERE id = template_id AND is_active = TRUE AND is_public = TRUE
    )
  );

-- Authenticated users can view questions for their tenant's templates
CREATE POLICY "Authenticated users can view tenant questions"
  ON public.questionnaire_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates 
      WHERE id = template_id AND (
        tenant_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      )
    )
  );

-- Admins can manage questions
CREATE POLICY "Admins can manage questions"
  ON public.questionnaire_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = template_id AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = template_id AND p.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for questionnaire_responses
-- Public can insert responses for public templates (anonymous responses)
CREATE POLICY "Public can create responses for public templates"
  ON public.questionnaire_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates 
      WHERE id = template_id AND is_active = TRUE AND is_public = TRUE
    )
  );

-- Public can update their own responses by session_id
CREATE POLICY "Public can update own responses by session"
  ON public.questionnaire_responses
  FOR UPDATE
  USING (session_id = current_setting('app.session_id', true));

-- Authenticated users can view responses for their tenant's templates
CREATE POLICY "Authenticated users can view tenant responses"
  ON public.questionnaire_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = template_id AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all responses for their tenant
CREATE POLICY "Admins can manage tenant responses"
  ON public.questionnaire_responses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = template_id AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaire_templates t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = template_id AND p.role IN ('admin', 'super_admin')
    )
  );

-- Triggers to update updated_at timestamps
CREATE TRIGGER set_questionnaire_templates_updated_at
  BEFORE UPDATE ON public.questionnaire_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_questionnaire_responses_updated_at
  BEFORE UPDATE ON public.questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate question options structure
CREATE OR REPLACE FUNCTION public.validate_question_options()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if question_options is not empty
  IF jsonb_array_length(NEW.question_options) > 0 THEN
    -- For single_choice and multiple_choice, ensure options are strings or objects with value/label
    IF NEW.question_type IN ('single_choice', 'multiple_choice') THEN
      IF NOT (
        SELECT bool_and(
          jsonb_typeof(option) = 'string' OR 
          (jsonb_typeof(option) = 'object' AND option ? 'value' AND option ? 'label')
        )
        FROM jsonb_array_elements(NEW.question_options) AS option
      ) THEN
        RAISE EXCEPTION 'Choice question options must be strings or objects with value and label fields';
      END IF;
    END IF;
    
    -- For scale questions, ensure min/max values are provided
    IF NEW.question_type = 'scale' THEN
      IF NOT (NEW.question_options ? 'min' AND NEW.question_options ? 'max') THEN
        RAISE EXCEPTION 'Scale questions must have min and max values in options';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate question options
CREATE TRIGGER validate_question_options_before_insert_update
  BEFORE INSERT OR UPDATE ON public.questionnaire_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_question_options();

-- Function to calculate questionnaire score
CREATE OR REPLACE FUNCTION public.calculate_questionnaire_score(
  template_id_param UUID,
  responses_param JSONB
) RETURNS DECIMAL AS $$
DECLARE
  total_score DECIMAL := 0;
  question_record RECORD;
  answer_value TEXT;
  numeric_answer DECIMAL;
BEGIN
  -- Loop through all questions for the template
  FOR question_record IN 
    SELECT id, question_type, weight, question_options
    FROM public.questionnaire_questions 
    WHERE template_id = template_id_param
    ORDER BY sort_order
  LOOP
    -- Get the answer for this question
    answer_value := responses_param ->> question_record.id::TEXT;
    
    IF answer_value IS NOT NULL THEN
      CASE question_record.question_type
        WHEN 'boolean' THEN
          -- Boolean: true = full weight, false = 0
          IF answer_value::BOOLEAN THEN
            total_score := total_score + question_record.weight;
          END IF;
          
        WHEN 'scale' THEN
          -- Scale: normalize to 0-1 range based on min/max, then multiply by weight
          numeric_answer := answer_value::DECIMAL;
          IF question_record.question_options ? 'min' AND question_record.question_options ? 'max' THEN
            total_score := total_score + (
              (numeric_answer - (question_record.question_options->>'min')::DECIMAL) /
              ((question_record.question_options->>'max')::DECIMAL - (question_record.question_options->>'min')::DECIMAL)
            ) * question_record.weight;
          END IF;
          
        WHEN 'single_choice', 'multiple_choice' THEN
          -- Choice questions: check if answer matches high-value options
          -- This is a simplified scoring - real implementation would use scoring_rules
          total_score := total_score + (question_record.weight * 0.5); -- Placeholder scoring
          
        ELSE
          -- Text fields and others: give partial credit for having an answer
          total_score := total_score + (question_record.weight * 0.3);
      END CASE;
    END IF;
  END LOOP;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update response score automatically
CREATE OR REPLACE FUNCTION public.update_response_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update the score when responses change
  NEW.calculated_score := public.calculate_questionnaire_score(NEW.template_id, NEW.responses);
  
  -- Update completion status if all required questions are answered
  IF NEW.status = 'in_progress' THEN
    -- Check if all required questions have answers
    IF NOT EXISTS (
      SELECT 1 
      FROM public.questionnaire_questions q
      WHERE q.template_id = NEW.template_id 
        AND q.is_required = TRUE 
        AND NOT (NEW.responses ? q.id::TEXT)
    ) THEN
      NEW.status := 'completed';
      NEW.completed_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update score automatically
CREATE TRIGGER update_response_score_before_update
  BEFORE UPDATE ON public.questionnaire_responses
  FOR EACH ROW
  WHEN (OLD.responses IS DISTINCT FROM NEW.responses)
  EXECUTE FUNCTION public.update_response_score();

-- Trigger to calculate initial score on insert
CREATE TRIGGER calculate_initial_response_score
  BEFORE INSERT ON public.questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_response_score();

-- Add comments for documentation
COMMENT ON TABLE public.questionnaire_templates IS 'Dynamic questionnaire templates for project screening and lead qualification';
COMMENT ON TABLE public.questionnaire_questions IS 'Individual questions within questionnaire templates with conditional logic support';
COMMENT ON TABLE public.questionnaire_responses IS 'Anonymous and identified responses to questionnaires with automatic scoring';

COMMENT ON COLUMN public.questionnaire_templates.is_public IS 'Whether template is accessible for public marketing funnels without authentication';
COMMENT ON COLUMN public.questionnaire_templates.scoring_rules IS 'JSONB array of scoring rules for automated qualification';
COMMENT ON COLUMN public.questionnaire_questions.conditional_logic IS 'JSONB object defining when this question should be shown based on other answers';
COMMENT ON COLUMN public.questionnaire_questions.question_options IS 'JSONB array of options for choice questions or configuration for other types';
COMMENT ON COLUMN public.questionnaire_responses.session_id IS 'Anonymous session identifier for public responses';
COMMENT ON COLUMN public.questionnaire_responses.responses IS 'JSONB object mapping question IDs to answers';
COMMENT ON COLUMN public.questionnaire_responses.screening_result IS 'JSONB object with calculated feasibility rating and recommendations';