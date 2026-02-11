-- API Versioning System Migration
-- Creates tables and functions for comprehensive API version management
-- Requirements: 10.5 - API versioning and backward compatibility

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API Version Usage Tracking Table
CREATE TABLE api_version_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version TEXT NOT NULL CHECK (version IN ('1.0', '1.1', '2.0')),
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  client_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite unique constraint for upsert operations
  UNIQUE(tenant_id, version, endpoint)
);

-- API Version Migration History Table
CREATE TABLE api_version_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  migration_status TEXT NOT NULL CHECK (migration_status IN ('planned', 'in_progress', 'completed', 'failed', 'rolled_back')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  migration_plan JSONB NOT NULL DEFAULT '{}',
  migration_results JSONB DEFAULT '{}',
  rollback_plan JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Version Deprecation Notices Table
CREATE TABLE api_version_deprecations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL UNIQUE,
  deprecation_date TIMESTAMPTZ NOT NULL,
  sunset_date TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  migration_guide_url TEXT,
  replacement_version TEXT NOT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (sunset_date > deprecation_date)
);

-- API Compatibility Test Results Table
CREATE TABLE api_compatibility_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL,
  test_suite TEXT NOT NULL,
  test_data JSONB NOT NULL,
  test_results JSONB NOT NULL,
  compatibility_score DECIMAL(5,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  issues_found JSONB DEFAULT '[]',
  test_status TEXT NOT NULL CHECK (test_status IN ('passed', 'failed', 'warning')),
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_version_usage_tenant_version ON api_version_usage(tenant_id, version);
CREATE INDEX idx_api_version_usage_endpoint ON api_version_usage(endpoint);
CREATE INDEX idx_api_version_usage_last_used ON api_version_usage(last_used);
CREATE INDEX idx_api_version_migrations_tenant ON api_version_migrations(tenant_id);
CREATE INDEX idx_api_version_migrations_status ON api_version_migrations(migration_status);
CREATE INDEX idx_api_version_deprecations_version ON api_version_deprecations(version);
CREATE INDEX idx_api_compatibility_tests_version ON api_compatibility_tests(version);

-- Row Level Security (RLS) Policies
ALTER TABLE api_version_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_version_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_version_deprecations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_compatibility_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_version_usage
CREATE POLICY "Tenants can view their own API usage" ON api_version_usage
  FOR SELECT USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY "System can insert API usage" ON api_version_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update API usage" ON api_version_usage
  FOR UPDATE USING (true);

-- RLS Policies for api_version_migrations
CREATE POLICY "Tenants can view their own migrations" ON api_version_migrations
  FOR SELECT USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY "Tenants can manage their own migrations" ON api_version_migrations
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

-- RLS Policies for api_version_deprecations (read-only for tenants)
CREATE POLICY "Anyone can view deprecation notices" ON api_version_deprecations
  FOR SELECT USING (true);

-- RLS Policies for api_compatibility_tests (read-only for tenants)
CREATE POLICY "Anyone can view compatibility test results" ON api_compatibility_tests
  FOR SELECT USING (true);

-- Function to increment API usage count
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_tenant_id UUID,
  p_version TEXT,
  p_endpoint TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE api_version_usage 
  SET 
    request_count = request_count + 1,
    last_used = NOW(),
    updated_at = NOW()
  WHERE 
    tenant_id = p_tenant_id 
    AND version = p_version 
    AND endpoint = p_endpoint;
    
  -- If no rows were updated, the upsert in the application will handle the insert
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get version usage analytics
CREATE OR REPLACE FUNCTION get_version_usage_analytics(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  version TEXT,
  endpoint TEXT,
  request_count BIGINT,
  last_used TIMESTAMPTZ,
  usage_percentage DECIMAL
) AS $$
DECLARE
  total_requests BIGINT;
BEGIN
  -- Get total requests for percentage calculation
  SELECT COALESCE(SUM(request_count), 0) INTO total_requests
  FROM api_version_usage
  WHERE tenant_id = p_tenant_id
    AND (p_start_date IS NULL OR last_used >= p_start_date)
    AND (p_end_date IS NULL OR last_used <= p_end_date);
  
  -- Return usage data with percentages
  RETURN QUERY
  SELECT 
    u.version,
    u.endpoint,
    u.request_count::BIGINT,
    u.last_used,
    CASE 
      WHEN total_requests > 0 THEN ROUND((u.request_count::DECIMAL / total_requests) * 100, 2)
      ELSE 0::DECIMAL
    END as usage_percentage
  FROM api_version_usage u
  WHERE u.tenant_id = p_tenant_id
    AND (p_start_date IS NULL OR u.last_used >= p_start_date)
    AND (p_end_date IS NULL OR u.last_used <= p_end_date)
  ORDER BY u.request_count DESC, u.version, u.endpoint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for deprecated version usage
CREATE OR REPLACE FUNCTION check_deprecated_version_usage(
  p_tenant_id UUID
) RETURNS TABLE (
  version TEXT,
  total_requests BIGINT,
  endpoints_affected TEXT[],
  sunset_date TIMESTAMPTZ,
  urgency_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.version,
    SUM(u.request_count)::BIGINT as total_requests,
    ARRAY_AGG(DISTINCT u.endpoint) as endpoints_affected,
    d.sunset_date,
    CASE 
      WHEN d.sunset_date <= NOW() + INTERVAL '30 days' THEN 'critical'
      WHEN d.sunset_date <= NOW() + INTERVAL '90 days' THEN 'high'
      WHEN d.sunset_date <= NOW() + INTERVAL '180 days' THEN 'medium'
      ELSE 'low'
    END as urgency_level
  FROM api_version_usage u
  JOIN api_version_deprecations d ON u.version = d.version
  WHERE u.tenant_id = p_tenant_id
    AND u.request_count > 0
  GROUP BY u.version, d.sunset_date
  ORDER BY d.sunset_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate migration recommendations
CREATE OR REPLACE FUNCTION get_migration_recommendations(
  p_tenant_id UUID
) RETURNS TABLE (
  from_version TEXT,
  to_version TEXT,
  priority TEXT,
  affected_requests BIGINT,
  estimated_effort TEXT,
  breaking_changes BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH version_usage AS (
    SELECT 
      version,
      SUM(request_count) as total_requests
    FROM api_version_usage
    WHERE tenant_id = p_tenant_id
    GROUP BY version
  ),
  deprecated_usage AS (
    SELECT 
      vu.version,
      vu.total_requests,
      d.sunset_date
    FROM version_usage vu
    JOIN api_version_deprecations d ON vu.version = d.version
    WHERE vu.total_requests > 0
  )
  SELECT 
    du.version as from_version,
    '2.0'::TEXT as to_version, -- Recommend latest version
    CASE 
      WHEN du.sunset_date <= NOW() + INTERVAL '30 days' THEN 'critical'
      WHEN du.sunset_date <= NOW() + INTERVAL '90 days' THEN 'high'
      WHEN du.total_requests > 1000 THEN 'high'
      WHEN du.total_requests > 100 THEN 'medium'
      ELSE 'low'
    END as priority,
    du.total_requests as affected_requests,
    CASE 
      WHEN du.total_requests > 1000 THEN 'high'
      WHEN du.total_requests > 100 THEN 'medium'
      ELSE 'low'
    END as estimated_effort,
    CASE 
      WHEN du.version = '1.0' THEN true -- v1.0 to v2.0 has breaking changes
      ELSE false
    END as breaking_changes
  FROM deprecated_usage du
  ORDER BY 
    CASE 
      WHEN du.sunset_date <= NOW() + INTERVAL '30 days' THEN 1
      WHEN du.sunset_date <= NOW() + INTERVAL '90 days' THEN 2
      ELSE 3
    END,
    du.total_requests DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_api_version_usage_updated_at
  BEFORE UPDATE ON api_version_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_version_migrations_updated_at
  BEFORE UPDATE ON api_version_migrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_version_deprecations_updated_at
  BEFORE UPDATE ON api_version_deprecations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial deprecation notices
INSERT INTO api_version_deprecations (version, deprecation_date, sunset_date, reason, migration_guide_url, replacement_version) VALUES
('1.0', '2024-01-01', '2025-12-31', 'Legacy version with limited features and security updates', 'https://docs.solarcrm.com/api/migration/v1.0-to-v2.0', '2.0');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api_version_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_version_migrations TO authenticated;
GRANT SELECT ON api_version_deprecations TO authenticated;
GRANT SELECT ON api_compatibility_tests TO authenticated;
GRANT EXECUTE ON FUNCTION increment_api_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_version_usage_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION check_deprecated_version_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_migration_recommendations TO authenticated;

-- Comments for documentation
COMMENT ON TABLE api_version_usage IS 'Tracks API version usage by tenant and endpoint';
COMMENT ON TABLE api_version_migrations IS 'Records API version migration history and status';
COMMENT ON TABLE api_version_deprecations IS 'Manages API version deprecation notices and timelines';
COMMENT ON TABLE api_compatibility_tests IS 'Stores API compatibility test results';
COMMENT ON FUNCTION increment_api_usage IS 'Increments API usage count for version tracking';
COMMENT ON FUNCTION get_version_usage_analytics IS 'Returns detailed version usage analytics for a tenant';
COMMENT ON FUNCTION check_deprecated_version_usage IS 'Identifies deprecated version usage with urgency levels';
COMMENT ON FUNCTION get_migration_recommendations IS 'Generates migration recommendations based on usage patterns';