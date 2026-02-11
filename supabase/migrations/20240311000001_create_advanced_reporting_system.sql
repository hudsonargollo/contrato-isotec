-- Advanced Reporting and Forecasting System
-- Requirements: 6.3, 6.4, 6.5 - Advanced reporting and forecasting

-- Report Templates Table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('financial', 'performance', 'user_engagement', 'operational', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_template_name_per_tenant UNIQUE (tenant_id, name)
);

-- Forecasting Results Table
CREATE TABLE IF NOT EXISTS forecasting_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('financial', 'performance', 'custom')),
  current_value NUMERIC NOT NULL DEFAULT 0,
  predicted_values JSONB NOT NULL DEFAULT '[]',
  confidence_interval JSONB NOT NULL DEFAULT '{}',
  trend TEXT NOT NULL CHECK (trend IN ('increasing', 'decreasing', 'stable')),
  accuracy_score NUMERIC CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  model_type TEXT NOT NULL DEFAULT 'linear',
  forecast_period INTEGER NOT NULL DEFAULT 30,
  confidence_level NUMERIC NOT NULL DEFAULT 0.95,
  parameters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Report Insights Table
CREATE TABLE IF NOT EXISTS report_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES analytics_reports(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('insight', 'recommendation', 'alert', 'trend')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metadata JSONB NOT NULL DEFAULT '{}',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Exports Table
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  report_id UUID REFERENCES analytics_reports(id) ON DELETE CASCADE NOT NULL,
  export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'csv', 'excel', 'json')),
  file_path TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Report Executions Table
CREATE TABLE IF NOT EXISTS scheduled_report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  scheduled_report_id UUID REFERENCES analytics_reports(id) ON DELETE CASCADE NOT NULL,
  execution_status TEXT DEFAULT 'pending' CHECK (execution_status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  generated_report_id UUID REFERENCES analytics_reports(id) ON DELETE SET NULL,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecasting Models Table
CREATE TABLE IF NOT EXISTS forecasting_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL CHECK (model_type IN ('linear', 'exponential', 'seasonal', 'arima', 'neural')),
  target_metric TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  hyperparameters JSONB NOT NULL DEFAULT '{}',
  training_data_period INTEGER DEFAULT 90, -- days
  accuracy_metrics JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_trained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_model_name_per_tenant UNIQUE (tenant_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_forecasting_results_tenant_id ON forecasting_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forecasting_results_metric ON forecasting_results(metric_name);
CREATE INDEX IF NOT EXISTS idx_forecasting_results_type ON forecasting_results(forecast_type);
CREATE INDEX IF NOT EXISTS idx_forecasting_results_created ON forecasting_results(created_at);
CREATE INDEX IF NOT EXISTS idx_forecasting_results_expires ON forecasting_results(expires_at);

CREATE INDEX IF NOT EXISTS idx_report_insights_tenant_id ON report_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_insights_report_id ON report_insights(report_id);
CREATE INDEX IF NOT EXISTS idx_report_insights_type ON report_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_report_insights_severity ON report_insights(severity);

CREATE INDEX IF NOT EXISTS idx_report_exports_tenant_id ON report_exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_user_id ON report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_status ON report_exports(status);
CREATE INDEX IF NOT EXISTS idx_report_exports_expires ON report_exports(expires_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_executions_tenant_id ON scheduled_report_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_executions_report_id ON scheduled_report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_executions_status ON scheduled_report_executions(execution_status);

CREATE INDEX IF NOT EXISTS idx_forecasting_models_tenant_id ON forecasting_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forecasting_models_metric ON forecasting_models(target_metric);
CREATE INDEX IF NOT EXISTS idx_forecasting_models_active ON forecasting_models(is_active);

-- Enable Row Level Security
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasting_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_report_templates ON report_templates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_forecasting_results ON forecasting_results
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_report_insights ON report_insights
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_report_exports ON report_exports
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_scheduled_executions ON scheduled_report_executions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_forecasting_models ON forecasting_models
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create functions for automated cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_forecasts()
RETURNS void AS $$
BEGIN
  DELETE FROM forecasting_results 
  WHERE expires_at < NOW();
  
  DELETE FROM report_exports 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forecasting_models_updated_at
  BEFORE UPDATE ON forecasting_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_exports_updated_at
  BEFORE UPDATE ON report_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default report templates
INSERT INTO report_templates (tenant_id, name, description, report_type, config, template_data) VALUES
-- Use a placeholder tenant_id that will be replaced by actual tenant setup
('00000000-0000-0000-0000-000000000000', 'Financial Performance Report', 'Comprehensive financial metrics and revenue analysis', 'financial', 
 '{"metrics": ["revenue", "subscription_revenue", "churn_rate"], "time_range": {"type": "relative", "relative": {"amount": 30, "unit": "days"}}}',
 '{"sections": [
   {"id": "summary", "type": "summary", "title": "Executive Summary", "config": {}, "order": 1},
   {"id": "revenue_chart", "type": "chart", "title": "Revenue Trends", "config": {"chart_type": "line", "metric": "revenue"}, "order": 2},
   {"id": "kpis", "type": "kpi", "title": "Key Performance Indicators", "config": {"metrics": ["revenue", "churn_rate"]}, "order": 3}
 ], "styling": {"theme": "corporate", "colors": {"primary": "#3b82f6", "secondary": "#64748b", "accent": "#10b981"}}}'),

('00000000-0000-0000-0000-000000000000', 'User Engagement Report', 'User activity and engagement metrics analysis', 'user_engagement',
 '{"metrics": ["daily_active_users", "session_duration", "engagement_score"], "time_range": {"type": "relative", "relative": {"amount": 7, "unit": "days"}}}',
 '{"sections": [
   {"id": "user_summary", "type": "summary", "title": "User Activity Summary", "config": {}, "order": 1},
   {"id": "engagement_chart", "type": "chart", "title": "Engagement Trends", "config": {"chart_type": "area", "metric": "daily_active_users"}, "order": 2},
   {"id": "user_table", "type": "table", "title": "Top Active Users", "config": {"limit": 10}, "order": 3}
 ], "styling": {"theme": "light", "colors": {"primary": "#8b5cf6", "secondary": "#64748b", "accent": "#f59e0b"}}}'),

('00000000-0000-0000-0000-000000000000', 'System Performance Report', 'Technical performance and operational metrics', 'operational',
 '{"metrics": ["api_response_time", "error_rate", "system_health"], "time_range": {"type": "relative", "relative": {"amount": 24, "unit": "hours"}}}',
 '{"sections": [
   {"id": "system_summary", "type": "summary", "title": "System Health Overview", "config": {}, "order": 1},
   {"id": "performance_chart", "type": "chart", "title": "Response Time Trends", "config": {"chart_type": "line", "metric": "api_response_time"}, "order": 2},
   {"id": "error_analysis", "type": "chart", "title": "Error Rate Analysis", "config": {"chart_type": "bar", "metric": "error_rate"}, "order": 3}
 ], "styling": {"theme": "dark", "colors": {"primary": "#ef4444", "secondary": "#64748b", "accent": "#22c55e"}}}');

-- Create a scheduled job to clean up expired data (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-expired-forecasts', '0 2 * * *', 'SELECT cleanup_expired_forecasts();');