-- Migration: Create comprehensive user activity audit system
-- Description: Creates user activity logging, audit trails, and monitoring dashboard for security and compliance
-- Requirements: 8.5, 12.3 - User Management and Security Compliance

-- Create user_activity_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Activity Details
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  resource_name TEXT,
  
  -- Request Context
  ip_address INET NOT NULL,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  
  -- Activity Metadata
  metadata JSONB DEFAULT '{}',
  changes JSONB DEFAULT '{}', -- Before/after values for updates
  
  -- Status and Results
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_action CHECK (
    action IN (
      -- Authentication actions
      'auth.login', 'auth.logout', 'auth.register', 'auth.password_reset',
      'auth.mfa_enable', 'auth.mfa_disable', 'auth.session_refresh',
      
      -- User management actions
      'users.create', 'users.update', 'users.delete', 'users.invite',
      'users.role_change', 'users.permission_change', 'users.activate', 'users.deactivate',
      
      -- CRM actions
      'leads.create', 'leads.update', 'leads.delete', 'leads.assign',
      'leads.stage_change', 'leads.score_update', 'leads.convert',
      'interactions.create', 'interactions.update', 'interactions.delete',
      
      -- Contract actions
      'contracts.create', 'contracts.update', 'contracts.delete', 'contracts.send',
      'contracts.sign', 'contracts.approve', 'contracts.reject',
      
      -- Invoice actions
      'invoices.create', 'invoices.update', 'invoices.delete', 'invoices.send',
      'invoices.approve', 'invoices.pay', 'invoices.cancel',
      
      -- Screening actions
      'screening.create', 'screening.update', 'screening.delete', 'screening.submit',
      'screening.approve', 'screening.reject',
      
      -- Settings actions
      'settings.update', 'branding.update', 'subscription.change',
      
      -- Data export/import actions
      'data.export', 'data.import', 'data.backup', 'data.restore',
      
      -- System actions
      'system.login', 'system.error', 'system.warning'
    )
  ),
  CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'warning', 'pending')),
  CONSTRAINT valid_resource_type CHECK (
    resource_type IS NULL OR resource_type IN (
      'user', 'tenant', 'lead', 'contract', 'invoice', 'screening',
      'interaction', 'template', 'setting', 'role', 'permission'
    )
  )
);

-- Create audit_sessions table for session tracking
CREATE TABLE IF NOT EXISTS public.audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session Details
  session_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  
  -- Session Lifecycle
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  
  -- Session Status
  status TEXT NOT NULL DEFAULT 'active',
  end_reason TEXT,
  
  -- Activity Summary
  actions_count INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT valid_session_status CHECK (status IN ('active', 'expired', 'terminated', 'logged_out')),
  CONSTRAINT valid_end_reason CHECK (
    end_reason IS NULL OR end_reason IN (
      'logout', 'timeout', 'admin_termination', 'security_violation', 'system_shutdown'
    )
  )
);

-- Create security_events table for security-related incidents
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event Details
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  resource_type TEXT,
  resource_id UUID,
  
  -- Event Data
  metadata JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'failed_login', 'suspicious_activity', 'permission_violation',
      'data_breach_attempt', 'unusual_access_pattern', 'account_lockout',
      'mfa_bypass_attempt', 'privilege_escalation', 'unauthorized_access',
      'data_export_anomaly', 'session_hijacking', 'brute_force_attack'
    )
  ),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_security_status CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive'))
);

-- Create audit_reports table for scheduled audit reports
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Details
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  description TEXT,
  
  -- Report Configuration
  filters JSONB DEFAULT '{}',
  date_range JSONB NOT NULL, -- {start_date, end_date}
  
  -- Report Data
  report_data JSONB,
  file_url TEXT,
  file_size_bytes INTEGER,
  
  -- Generation Details
  generated_by UUID REFERENCES auth.users(id) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Constraints
  CONSTRAINT valid_report_type CHECK (
    report_type IN (
      'user_activity', 'security_events', 'login_history', 'permission_changes',
      'data_access', 'system_changes', 'compliance_summary', 'custom'
    )
  ),
  CONSTRAINT valid_report_status CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'expired'))
);

-- Create indexes for performance
CREATE INDEX idx_user_activity_logs_tenant_id ON public.user_activity_logs(tenant_id);
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action ON public.user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_resource ON public.user_activity_logs(resource_type, resource_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_ip_address ON public.user_activity_logs(ip_address);
CREATE INDEX idx_user_activity_logs_status ON public.user_activity_logs(status);

CREATE INDEX idx_audit_sessions_tenant_id ON public.audit_sessions(tenant_id);
CREATE INDEX idx_audit_sessions_user_id ON public.audit_sessions(user_id);
CREATE INDEX idx_audit_sessions_session_id ON public.audit_sessions(session_id);
CREATE INDEX idx_audit_sessions_status ON public.audit_sessions(status);
CREATE INDEX idx_audit_sessions_started_at ON public.audit_sessions(started_at DESC);
CREATE INDEX idx_audit_sessions_last_activity ON public.audit_sessions(last_activity_at DESC);

CREATE INDEX idx_security_events_tenant_id ON public.security_events(tenant_id);
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_status ON public.security_events(status);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);

CREATE INDEX idx_audit_reports_tenant_id ON public.audit_reports(tenant_id);
CREATE INDEX idx_audit_reports_report_type ON public.audit_reports(report_type);
CREATE INDEX idx_audit_reports_generated_by ON public.audit_reports(generated_by);
CREATE INDEX idx_audit_reports_generated_at ON public.audit_reports(generated_at DESC);
CREATE INDEX idx_audit_reports_status ON public.audit_reports(status);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_user_activity_logs_metadata ON public.user_activity_logs USING GIN (metadata);
CREATE INDEX idx_user_activity_logs_changes ON public.user_activity_logs USING GIN (changes);
CREATE INDEX idx_audit_sessions_device_info ON public.audit_sessions USING GIN (device_info);
CREATE INDEX idx_security_events_metadata ON public.security_events USING GIN (metadata);
CREATE INDEX idx_audit_reports_filters ON public.audit_reports USING GIN (filters);
CREATE INDEX idx_audit_reports_data ON public.audit_reports USING GIN (report_data);

-- Enable Row Level Security
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_logs
CREATE POLICY "Tenant users can view own tenant activity logs"
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = user_activity_logs.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON public.user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for audit_sessions
CREATE POLICY "Users can view own sessions"
  ON public.audit_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can view tenant sessions"
  ON public.audit_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = audit_sessions.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "System can manage sessions"
  ON public.audit_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for security_events
CREATE POLICY "Tenant admins can view security events"
  ON public.security_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = security_events.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "System can manage security events"
  ON public.security_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for audit_reports
CREATE POLICY "Tenant users can view own tenant reports"
  ON public.audit_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = audit_reports.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );

CREATE POLICY "Authorized users can create reports"
  ON public.audit_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = audit_reports.tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager')
        AND status = 'active'
    )
  );

CREATE POLICY "Report creators can update own reports"
  ON public.audit_reports
  FOR UPDATE
  TO authenticated
  USING (generated_by = auth.uid())
  WITH CHECK (generated_by = auth.uid());

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_tenant_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_changes JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.user_activity_logs (
    tenant_id, user_id, action, resource_type, resource_id, resource_name,
    metadata, changes, ip_address, user_agent, session_id, request_id,
    status, error_message, duration_ms
  ) VALUES (
    p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id, p_resource_name,
    p_metadata, p_changes, p_ip_address, p_user_agent, p_session_id, p_request_id,
    p_status, p_error_message, p_duration_ms
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update audit session
CREATE OR REPLACE FUNCTION public.manage_audit_session(
  p_tenant_id UUID,
  p_user_id UUID,
  p_session_id TEXT,
  p_ip_address INET,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}',
  p_action TEXT DEFAULT 'update'
) RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  IF p_action = 'start' THEN
    INSERT INTO public.audit_sessions (
      tenant_id, user_id, session_id, ip_address, user_agent, device_info
    ) VALUES (
      p_tenant_id, p_user_id, p_session_id, p_ip_address, p_user_agent, p_device_info
    ) RETURNING id INTO session_uuid;
  ELSIF p_action = 'update' THEN
    UPDATE public.audit_sessions 
    SET 
      last_activity_at = NOW(),
      actions_count = actions_count + 1
    WHERE session_id = p_session_id AND user_id = p_user_id
    RETURNING id INTO session_uuid;
  ELSIF p_action = 'end' THEN
    UPDATE public.audit_sessions 
    SET 
      ended_at = NOW(),
      status = 'logged_out',
      end_reason = 'logout'
    WHERE session_id = p_session_id AND user_id = p_user_id
    RETURNING id INTO session_uuid;
  END IF;
  
  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security event
CREATE OR REPLACE FUNCTION public.create_security_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    tenant_id, user_id, event_type, severity, description,
    ip_address, user_agent, resource_type, resource_id, metadata
  ) VALUES (
    p_tenant_id, p_user_id, p_event_type, p_severity, p_description,
    p_ip_address, p_user_agent, p_resource_type, p_resource_id, p_metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit data (for data retention)
CREATE OR REPLACE FUNCTION public.cleanup_audit_data(
  retention_days INTEGER DEFAULT 365
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
  
  -- Clean up old activity logs
  DELETE FROM public.user_activity_logs 
  WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up old sessions
  DELETE FROM public.audit_sessions 
  WHERE started_at < cutoff_date;
  
  -- Clean up resolved security events older than retention period
  DELETE FROM public.security_events 
  WHERE created_at < cutoff_date AND status = 'resolved';
  
  -- Clean up expired reports
  DELETE FROM public.audit_reports 
  WHERE expires_at < NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  action_type TEXT,
  action_count BIGINT,
  success_count BIGINT,
  failure_count BIGINT,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.action,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE ual.status = 'success') as success_count,
    COUNT(*) FILTER (WHERE ual.status = 'failure') as failure_count,
    MAX(ual.created_at) as last_activity
  FROM public.user_activity_logs ual
  WHERE ual.tenant_id = p_tenant_id
    AND (p_user_id IS NULL OR ual.user_id = p_user_id)
    AND (p_start_date IS NULL OR ual.created_at >= p_start_date)
    AND (p_end_date IS NULL OR ual.created_at <= p_end_date)
  GROUP BY ual.action
  ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically expire old sessions
CREATE OR REPLACE FUNCTION public.expire_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.audit_sessions 
  SET 
    status = 'expired',
    ended_at = NOW(),
    end_reason = 'timeout'
  WHERE status = 'active' 
    AND last_activity_at < NOW() - INTERVAL '24 hours';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run session expiry check
CREATE TRIGGER expire_sessions_trigger
  AFTER INSERT ON public.audit_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.expire_old_sessions();

-- Add comments for documentation
COMMENT ON TABLE public.user_activity_logs IS 'Comprehensive audit trail for all user actions across the platform';
COMMENT ON TABLE public.audit_sessions IS 'User session tracking for security monitoring and analytics';
COMMENT ON TABLE public.security_events IS 'Security incidents and suspicious activity tracking';
COMMENT ON TABLE public.audit_reports IS 'Generated audit reports for compliance and analysis';

COMMENT ON COLUMN public.user_activity_logs.action IS 'Specific action performed by the user (e.g., leads.create, users.update)';
COMMENT ON COLUMN public.user_activity_logs.changes IS 'Before/after values for update operations in JSONB format';
COMMENT ON COLUMN public.user_activity_logs.metadata IS 'Additional context and details about the action';
COMMENT ON COLUMN public.security_events.severity IS 'Security event severity: low, medium, high, critical';
COMMENT ON COLUMN public.audit_reports.date_range IS 'Report date range in JSONB format: {start_date, end_date}';