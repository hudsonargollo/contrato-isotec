/**
 * Analytics System Migration
 * Requirements: 6.1 - Analytics data collection system
 * Creates comprehensive analytics infrastructure for multi-tenant SaaS platform
 */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analytics Events Table
-- Stores all trackable events across the platform
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event identification
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL, -- 'crm', 'whatsapp', 'invoice', 'contract', 'user', 'system'
  event_action VARCHAR(50) NOT NULL,   -- 'create', 'update', 'delete', 'view', 'send', 'receive'
  
  -- Event context
  entity_type VARCHAR(50),             -- 'lead', 'message', 'invoice', 'contract', 'campaign'
  entity_id UUID,                      -- ID of the entity being tracked
  
  -- Event properties
  properties JSONB DEFAULT '{}',       -- Custom event properties
  metadata JSONB DEFAULT '{}',         -- Additional metadata
  
  -- Session and device info
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT analytics_events_tenant_check CHECK (tenant_id IS NOT NULL)
);

-- Analytics Metrics Table
-- Stores aggregated metrics for faster querying
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Metric identification
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,    -- 'counter', 'gauge', 'histogram', 'rate'
  metric_category VARCHAR(50) NOT NULL,
  
  -- Metric value
  value DECIMAL(15,4) NOT NULL,
  
  -- Dimensions for filtering/grouping
  dimensions JSONB DEFAULT '{}',
  
  -- Time period
  period_type VARCHAR(20) NOT NULL,    -- 'hour', 'day', 'week', 'month'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for metric aggregation
  UNIQUE(tenant_id, metric_name, metric_category, period_type, period_start, dimensions)
);

-- Analytics Dashboards Table
-- Stores custom dashboard configurations
CREATE TABLE analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dashboard info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Dashboard configuration
  config JSONB NOT NULL DEFAULT '{}',  -- Widget configurations, layout, filters
  
  -- Sharing and permissions
  is_public BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',     -- Array of user IDs
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Funnels Table
-- Tracks conversion funnels and user journeys
CREATE TABLE analytics_funnels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Funnel definition
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Funnel steps
  steps JSONB NOT NULL,               -- Array of step definitions
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Funnel Events Table
-- Tracks user progress through funnels
CREATE TABLE analytics_funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  funnel_id UUID NOT NULL REFERENCES analytics_funnels(id) ON DELETE CASCADE,
  
  -- User journey
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  
  -- Funnel progress
  step_index INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  
  -- Event data
  event_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Cohorts Table
-- Defines user cohorts for analysis
CREATE TABLE analytics_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Cohort definition
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Cohort criteria
  criteria JSONB NOT NULL,            -- Conditions for cohort membership
  
  -- Cohort type
  cohort_type VARCHAR(50) NOT NULL,   -- 'static', 'dynamic'
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Reports Table
-- Stores generated reports and their configurations
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Report info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,   -- 'standard', 'custom', 'scheduled'
  
  -- Report configuration
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Report data (for cached reports)
  data JSONB,
  
  -- Scheduling
  schedule_config JSONB,              -- Cron-like scheduling configuration
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'error'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_tenant_category ON analytics_events(tenant_id, event_category);
CREATE INDEX idx_analytics_events_tenant_created ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX idx_analytics_events_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

CREATE INDEX idx_analytics_metrics_tenant_category ON analytics_metrics(tenant_id, metric_category);
CREATE INDEX idx_analytics_metrics_period ON analytics_metrics(period_type, period_start, period_end);
CREATE INDEX idx_analytics_metrics_name ON analytics_metrics(metric_name);

CREATE INDEX idx_analytics_dashboards_tenant ON analytics_dashboards(tenant_id);
CREATE INDEX idx_analytics_dashboards_user ON analytics_dashboards(user_id);

CREATE INDEX idx_analytics_funnels_tenant ON analytics_funnels(tenant_id, is_active);

CREATE INDEX idx_analytics_funnel_events_funnel ON analytics_funnel_events(funnel_id, created_at);
CREATE INDEX idx_analytics_funnel_events_user ON analytics_funnel_events(user_id, created_at);

CREATE INDEX idx_analytics_cohorts_tenant ON analytics_cohorts(tenant_id, is_active);

CREATE INDEX idx_analytics_reports_tenant ON analytics_reports(tenant_id, status);
CREATE INDEX idx_analytics_reports_schedule ON analytics_reports(next_generation_at) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY analytics_events_tenant_isolation ON analytics_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY analytics_metrics_tenant_isolation ON analytics_metrics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY analytics_dashboards_tenant_isolation ON analytics_dashboards
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY analytics_funnels_tenant_isolation ON analytics_funnels
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY analytics_funnel_events_tenant_isolation ON analytics_funnel_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY analytics_cohorts_tenant_isolation ON analytics_cohorts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY analytics_reports_tenant_isolation ON analytics_reports
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION aggregate_analytics_metrics()
RETURNS void AS $$
DECLARE
  current_hour TIMESTAMPTZ;
  current_day TIMESTAMPTZ;
BEGIN
  current_hour := date_trunc('hour', NOW());
  current_day := date_trunc('day', NOW());
  
  -- Aggregate hourly metrics
  INSERT INTO analytics_metrics (
    tenant_id, metric_name, metric_type, metric_category,
    value, dimensions, period_type, period_start, period_end
  )
  SELECT 
    tenant_id,
    'event_count' as metric_name,
    'counter' as metric_type,
    event_category as metric_category,
    COUNT(*) as value,
    jsonb_build_object('event_name', event_name, 'event_action', event_action) as dimensions,
    'hour' as period_type,
    current_hour as period_start,
    current_hour + INTERVAL '1 hour' as period_end
  FROM analytics_events
  WHERE created_at >= current_hour 
    AND created_at < current_hour + INTERVAL '1 hour'
  GROUP BY tenant_id, event_category, event_name, event_action
  ON CONFLICT (tenant_id, metric_name, metric_category, period_type, period_start, dimensions)
  DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();
    
  -- Aggregate daily metrics
  INSERT INTO analytics_metrics (
    tenant_id, metric_name, metric_type, metric_category,
    value, dimensions, period_type, period_start, period_end
  )
  SELECT 
    tenant_id,
    'daily_active_users' as metric_name,
    'gauge' as metric_type,
    'user' as metric_category,
    COUNT(DISTINCT user_id) as value,
    '{}' as dimensions,
    'day' as period_type,
    current_day as period_start,
    current_day + INTERVAL '1 day' as period_end
  FROM analytics_events
  WHERE created_at >= current_day 
    AND created_at < current_day + INTERVAL '1 day'
    AND user_id IS NOT NULL
  GROUP BY tenant_id
  ON CONFLICT (tenant_id, metric_name, metric_category, period_type, period_start, dimensions)
  DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to track events
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_event_name VARCHAR(100),
  p_event_category VARCHAR(50),
  p_event_action VARCHAR(50),
  p_entity_type VARCHAR(50) DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_properties JSONB DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}',
  p_session_id VARCHAR(100) DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    tenant_id, user_id, event_name, event_category, event_action,
    entity_type, entity_id, properties, metadata,
    session_id, ip_address, user_agent
  ) VALUES (
    p_tenant_id, p_user_id, p_event_name, p_event_category, p_event_action,
    p_entity_type, p_entity_id, p_properties, p_metadata,
    p_session_id, p_ip_address, p_user_agent
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Create default analytics funnels
INSERT INTO analytics_funnels (tenant_id, name, description, steps) VALUES
  (
    '00000000-0000-0000-0000-000000000000', -- Will be updated per tenant
    'Lead Conversion Funnel',
    'Track lead progression from creation to conversion',
    '[
      {"name": "Lead Created", "event": "lead_created"},
      {"name": "Lead Contacted", "event": "lead_contacted"},
      {"name": "Lead Qualified", "event": "lead_qualified"},
      {"name": "Proposal Sent", "event": "proposal_sent"},
      {"name": "Contract Signed", "event": "contract_signed"}
    ]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'WhatsApp Engagement Funnel',
    'Track WhatsApp conversation engagement',
    '[
      {"name": "Message Received", "event": "whatsapp_message_received"},
      {"name": "Message Read", "event": "whatsapp_message_read"},
      {"name": "Response Sent", "event": "whatsapp_response_sent"},
      {"name": "Lead Captured", "event": "whatsapp_lead_captured"}
    ]'::jsonb
  );

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores all trackable events across the platform for analytics';
COMMENT ON TABLE analytics_metrics IS 'Aggregated metrics for faster querying and reporting';
COMMENT ON TABLE analytics_dashboards IS 'Custom dashboard configurations for tenants';
COMMENT ON TABLE analytics_funnels IS 'Conversion funnel definitions';
COMMENT ON TABLE analytics_funnel_events IS 'User progress through conversion funnels';
COMMENT ON TABLE analytics_cohorts IS 'User cohort definitions for analysis';
COMMENT ON TABLE analytics_reports IS 'Generated reports and their configurations';