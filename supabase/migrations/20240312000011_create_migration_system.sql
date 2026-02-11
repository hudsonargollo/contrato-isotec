-- ISOTEC Data Migration System
-- Creates tables and functions for managing data migration from legacy systems
-- Requirements: 11.1, 11.3 - Data migration and validation

-- Migration Jobs Table
CREATE TABLE migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Job configuration
  job_type TEXT NOT NULL CHECK (job_type IN ('full', 'incremental', 'validation')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  source_system TEXT NOT NULL,
  target_tenant TEXT NOT NULL,
  
  -- Progress tracking
  progress JSONB NOT NULL DEFAULT '{
    "total_records": 0,
    "processed_records": 0,
    "successful_records": 0,
    "failed_records": 0,
    "current_phase": "initialization"
  }',
  
  -- Configuration
  configuration JSONB NOT NULL DEFAULT '{
    "batch_size": 100,
    "parallel_workers": 2,
    "validation_enabled": true,
    "dry_run": false
  }',
  
  -- Results
  results JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT migration_jobs_valid_dates CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (completed_at IS NULL OR completed_at >= COALESCE(started_at, created_at))
  )
);

-- Migration Errors Table
CREATE TABLE migration_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_job_id UUID NOT NULL REFERENCES migration_jobs(id) ON DELETE CASCADE,
  
  -- Error details
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('validation', 'transformation', 'database', 'business_rule')),
  error_message TEXT NOT NULL,
  error_code TEXT,
  
  -- Source data
  source_data JSONB,
  
  -- Context
  batch_number INTEGER,
  worker_id TEXT,
  
  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Resolution
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Migration Audit Log Table
CREATE TABLE migration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_job_id UUID NOT NULL REFERENCES migration_jobs(id) ON DELETE CASCADE,
  
  -- Audit details
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data Validation Results Table
CREATE TABLE migration_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_job_id UUID NOT NULL REFERENCES migration_jobs(id) ON DELETE CASCADE,
  
  -- Validation details
  validation_type TEXT NOT NULL CHECK (validation_type IN ('data_integrity', 'reference_integrity', 'business_rules', 'completeness')),
  entity_type TEXT NOT NULL,
  validation_rule TEXT NOT NULL,
  
  -- Results
  total_checked INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  warnings INTEGER NOT NULL DEFAULT 0,
  
  -- Details
  failure_details JSONB,
  warning_details JSONB,
  
  -- Timestamp
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration Mapping Table (for ID mapping between systems)
CREATE TABLE migration_id_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_job_id UUID NOT NULL REFERENCES migration_jobs(id) ON DELETE CASCADE,
  
  -- Mapping details
  entity_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  
  -- Metadata
  mapping_metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(migration_job_id, entity_type, source_id)
);

-- Indexes for performance
CREATE INDEX idx_migration_jobs_tenant ON migration_jobs(tenant_id);
CREATE INDEX idx_migration_jobs_status ON migration_jobs(status);
CREATE INDEX idx_migration_jobs_created_at ON migration_jobs(created_at);
CREATE INDEX idx_migration_jobs_source_system ON migration_jobs(source_system);

CREATE INDEX idx_migration_errors_job ON migration_errors(migration_job_id);
CREATE INDEX idx_migration_errors_entity ON migration_errors(entity_type, entity_id);
CREATE INDEX idx_migration_errors_type ON migration_errors(error_type);
CREATE INDEX idx_migration_errors_resolved ON migration_errors(resolved);

CREATE INDEX idx_migration_audit_job ON migration_audit_log(migration_job_id);
CREATE INDEX idx_migration_audit_entity ON migration_audit_log(entity_type, entity_id);
CREATE INDEX idx_migration_audit_created_at ON migration_audit_log(created_at);

CREATE INDEX idx_migration_validation_job ON migration_validation_results(migration_job_id);
CREATE INDEX idx_migration_validation_type ON migration_validation_results(validation_type);

CREATE INDEX idx_migration_mapping_job ON migration_id_mapping(migration_job_id);
CREATE INDEX idx_migration_mapping_entity ON migration_id_mapping(entity_type);
CREATE INDEX idx_migration_mapping_source ON migration_id_mapping(source_id);

-- Row Level Security
ALTER TABLE migration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_id_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can manage their own migration jobs" ON migration_jobs
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY "Tenants can view their migration errors" ON migration_errors
  FOR SELECT USING (
    migration_job_id IN (
      SELECT id FROM migration_jobs 
      WHERE tenant_id = (current_setting('app.current_tenant_id', true))::UUID
    )
  );

CREATE POLICY "Tenants can view their migration audit logs" ON migration_audit_log
  FOR SELECT USING (
    migration_job_id IN (
      SELECT id FROM migration_jobs 
      WHERE tenant_id = (current_setting('app.current_tenant_id', true))::UUID
    )
  );

CREATE POLICY "Tenants can view their validation results" ON migration_validation_results
  FOR SELECT USING (
    migration_job_id IN (
      SELECT id FROM migration_jobs 
      WHERE tenant_id = (current_setting('app.current_tenant_id', true))::UUID
    )
  );

CREATE POLICY "Tenants can view their ID mappings" ON migration_id_mapping
  FOR SELECT USING (
    migration_job_id IN (
      SELECT id FROM migration_jobs 
      WHERE tenant_id = (current_setting('app.current_tenant_id', true))::UUID
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_migration_jobs_updated_at
  BEFORE UPDATE ON migration_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get migration job statistics
CREATE OR REPLACE FUNCTION get_migration_job_stats(p_job_id UUID)
RETURNS TABLE (
  total_errors BIGINT,
  error_breakdown JSONB,
  validation_summary JSONB,
  progress_percentage DECIMAL
) AS $
DECLARE
  job_record migration_jobs%ROWTYPE;
BEGIN
  -- Get job record
  SELECT * INTO job_record FROM migration_jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Migration job not found';
  END IF;
  
  -- Get error statistics
  SELECT COUNT(*) INTO total_errors
  FROM migration_errors
  WHERE migration_job_id = p_job_id;
  
  -- Get error breakdown by type
  SELECT jsonb_object_agg(error_type, error_count) INTO error_breakdown
  FROM (
    SELECT error_type, COUNT(*) as error_count
    FROM migration_errors
    WHERE migration_job_id = p_job_id
    GROUP BY error_type
  ) error_stats;
  
  -- Get validation summary
  SELECT jsonb_object_agg(validation_type, validation_stats) INTO validation_summary
  FROM (
    SELECT 
      validation_type,
      jsonb_build_object(
        'total_checked', SUM(total_checked),
        'passed', SUM(passed),
        'failed', SUM(failed),
        'warnings', SUM(warnings)
      ) as validation_stats
    FROM migration_validation_results
    WHERE migration_job_id = p_job_id
    GROUP BY validation_type
  ) validation_data;
  
  -- Calculate progress percentage
  progress_percentage := CASE 
    WHEN (job_record.progress->>'total_records')::INTEGER > 0 THEN
      ROUND(
        ((job_record.progress->>'processed_records')::DECIMAL / 
         (job_record.progress->>'total_records')::DECIMAL) * 100, 
        2
      )
    ELSE 0
  END;
  
  RETURN QUERY SELECT 
    get_migration_job_stats.total_errors,
    COALESCE(get_migration_job_stats.error_breakdown, '{}'::jsonb),
    COALESCE(get_migration_job_stats.validation_summary, '{}'::jsonb),
    get_migration_job_stats.progress_percentage;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update migration progress
CREATE OR REPLACE FUNCTION update_migration_progress(
  p_job_id UUID,
  p_processed_increment INTEGER DEFAULT 1,
  p_successful_increment INTEGER DEFAULT 0,
  p_failed_increment INTEGER DEFAULT 0,
  p_current_phase TEXT DEFAULT NULL
) RETURNS VOID AS $
DECLARE
  current_progress JSONB;
BEGIN
  -- Get current progress
  SELECT progress INTO current_progress
  FROM migration_jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Migration job not found';
  END IF;
  
  -- Update progress
  UPDATE migration_jobs
  SET 
    progress = jsonb_build_object(
      'total_records', (current_progress->>'total_records')::INTEGER,
      'processed_records', (current_progress->>'processed_records')::INTEGER + p_processed_increment,
      'successful_records', (current_progress->>'successful_records')::INTEGER + p_successful_increment,
      'failed_records', (current_progress->>'failed_records')::INTEGER + p_failed_increment,
      'current_phase', COALESCE(p_current_phase, current_progress->>'current_phase')
    ),
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log migration error
CREATE OR REPLACE FUNCTION log_migration_error(
  p_job_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_error_type TEXT,
  p_error_message TEXT,
  p_source_data JSONB DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL
) RETURNS UUID AS $
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO migration_errors (
    migration_job_id,
    entity_type,
    entity_id,
    error_type,
    error_message,
    error_code,
    source_data
  ) VALUES (
    p_job_id,
    p_entity_type,
    p_entity_id,
    p_error_type,
    p_error_message,
    p_error_code,
    p_source_data
  ) RETURNING id INTO error_id;
  
  RETURN error_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create ID mapping
CREATE OR REPLACE FUNCTION create_id_mapping(
  p_job_id UUID,
  p_entity_type TEXT,
  p_source_id TEXT,
  p_target_id TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $
DECLARE
  mapping_id UUID;
BEGIN
  INSERT INTO migration_id_mapping (
    migration_job_id,
    entity_type,
    source_id,
    target_id,
    mapping_metadata
  ) VALUES (
    p_job_id,
    p_entity_type,
    p_source_id,
    p_target_id,
    p_metadata
  ) RETURNING id INTO mapping_id;
  
  RETURN mapping_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mapped ID
CREATE OR REPLACE FUNCTION get_mapped_id(
  p_job_id UUID,
  p_entity_type TEXT,
  p_source_id TEXT
) RETURNS TEXT AS $
DECLARE
  target_id TEXT;
BEGIN
  SELECT migration_id_mapping.target_id INTO target_id
  FROM migration_id_mapping
  WHERE migration_job_id = p_job_id
    AND entity_type = p_entity_type
    AND source_id = p_source_id;
  
  RETURN target_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate migration completeness
CREATE OR REPLACE FUNCTION validate_migration_completeness(p_job_id UUID)
RETURNS TABLE (
  entity_type TEXT,
  source_count BIGINT,
  migrated_count BIGINT,
  missing_count BIGINT,
  completeness_percentage DECIMAL
) AS $
BEGIN
  RETURN QUERY
  WITH source_counts AS (
    SELECT 
      mapping.entity_type,
      COUNT(*) as source_count
    FROM migration_id_mapping mapping
    WHERE mapping.migration_job_id = p_job_id
    GROUP BY mapping.entity_type
  ),
  migrated_counts AS (
    SELECT 
      mapping.entity_type,
      COUNT(*) as migrated_count
    FROM migration_id_mapping mapping
    WHERE mapping.migration_job_id = p_job_id
      AND mapping.target_id IS NOT NULL
    GROUP BY mapping.entity_type
  )
  SELECT 
    sc.entity_type,
    sc.source_count,
    COALESCE(mc.migrated_count, 0) as migrated_count,
    sc.source_count - COALESCE(mc.migrated_count, 0) as missing_count,
    ROUND(
      (COALESCE(mc.migrated_count, 0)::DECIMAL / sc.source_count::DECIMAL) * 100,
      2
    ) as completeness_percentage
  FROM source_counts sc
  LEFT JOIN migrated_counts mc ON sc.entity_type = mc.entity_type
  ORDER BY sc.entity_type;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON migration_jobs TO authenticated;
GRANT SELECT ON migration_errors TO authenticated;
GRANT SELECT ON migration_audit_log TO authenticated;
GRANT SELECT ON migration_validation_results TO authenticated;
GRANT SELECT ON migration_id_mapping TO authenticated;

GRANT EXECUTE ON FUNCTION get_migration_job_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_migration_progress TO authenticated;
GRANT EXECUTE ON FUNCTION log_migration_error TO authenticated;
GRANT EXECUTE ON FUNCTION create_id_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION get_mapped_id TO authenticated;
GRANT EXECUTE ON FUNCTION validate_migration_completeness TO authenticated;

-- Comments
COMMENT ON TABLE migration_jobs IS 'Tracks data migration jobs from legacy systems';
COMMENT ON TABLE migration_errors IS 'Records errors encountered during migration';
COMMENT ON TABLE migration_audit_log IS 'Audit trail for migration operations';
COMMENT ON TABLE migration_validation_results IS 'Results of data validation during migration';
COMMENT ON TABLE migration_id_mapping IS 'Maps IDs between source and target systems';