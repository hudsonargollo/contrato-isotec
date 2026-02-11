-- Migration: Create Workflow Executions Table
-- Description: Creates workflow execution tracking for invoice approval workflows
-- Requirements: 4.2 - Customer approval workflows

-- Create workflow_executions table for tracking approval workflow progress
CREATE TABLE public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Workflow References
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  workflow_id UUID REFERENCES public.invoice_approval_workflows(id) ON DELETE CASCADE NOT NULL,
  
  -- Execution State
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Step Tracking
  steps JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT workflow_executions_valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT workflow_executions_valid_step CHECK (current_step > 0),
  CONSTRAINT workflow_executions_completed_at_check CHECK (
    (status IN ('approved', 'rejected', 'cancelled') AND completed_at IS NOT NULL) OR
    (status = 'pending' AND completed_at IS NULL)
  )
);

-- Create notifications table for approval notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Recipient Information
  recipient_id TEXT NOT NULL, -- Can be user ID or 'customer'
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Notification Content
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Delivery Configuration
  method TEXT NOT NULL DEFAULT 'email',
  priority TEXT NOT NULL DEFAULT 'normal',
  
  -- Status and Tracking
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Related Resources
  resource_type TEXT, -- 'invoice', 'contract', etc.
  resource_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT notifications_valid_method CHECK (method IN ('email', 'in_app', 'sms', 'whatsapp')),
  CONSTRAINT notifications_valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT notifications_valid_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  CONSTRAINT notifications_valid_email_format CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create notification_logs table for tracking notification activities
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Activity Information
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  
  -- Resource Information
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  
  -- Recipients
  recipients JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_workflow_executions_tenant ON public.workflow_executions(tenant_id);
CREATE INDEX idx_workflow_executions_invoice ON public.workflow_executions(invoice_id);
CREATE INDEX idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(tenant_id, status);
CREATE INDEX idx_workflow_executions_started_at ON public.workflow_executions(tenant_id, started_at);
CREATE INDEX idx_workflow_executions_current_step ON public.workflow_executions(tenant_id, current_step) WHERE status = 'pending';

CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(tenant_id, recipient_id);
CREATE INDEX idx_notifications_status ON public.notifications(tenant_id, status);
CREATE INDEX idx_notifications_scheduled_at ON public.notifications(tenant_id, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_notifications_resource ON public.notifications(tenant_id, resource_type, resource_id);

CREATE INDEX idx_notification_logs_tenant ON public.notification_logs(tenant_id);
CREATE INDEX idx_notification_logs_user ON public.notification_logs(tenant_id, user_id);
CREATE INDEX idx_notification_logs_resource ON public.notification_logs(tenant_id, resource_type, resource_id);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(tenant_id, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_workflow_executions ON public.workflow_executions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_notifications ON public.notifications
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_notification_logs ON public.notification_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_workflow_executions_updated_at
  BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically start approval workflow for invoices
CREATE OR REPLACE FUNCTION auto_start_approval_workflow()
RETURNS TRIGGER AS $
DECLARE
  default_workflow_id UUID;
  workflow_conditions JSONB;
  should_start_workflow BOOLEAN := false;
BEGIN
  -- Only trigger for invoices that need approval
  IF NEW.status = 'pending_approval' AND (OLD.status IS NULL OR OLD.status != 'pending_approval') THEN
    
    -- Get default workflow for tenant
    SELECT id, conditions INTO default_workflow_id, workflow_conditions
    FROM public.invoice_approval_workflows
    WHERE tenant_id = NEW.tenant_id 
      AND is_default = true 
      AND is_active = true
    LIMIT 1;
    
    IF default_workflow_id IS NOT NULL THEN
      -- Check if workflow conditions are met (simplified check)
      should_start_workflow := true;
      
      -- Check auto-approve threshold
      IF EXISTS (
        SELECT 1 FROM public.invoice_approval_workflows
        WHERE id = default_workflow_id 
          AND auto_approve_threshold IS NOT NULL 
          AND NEW.total_amount <= auto_approve_threshold
      ) THEN
        -- Auto-approve
        NEW.status := 'approved';
        NEW.approval_status := 'approved';
        NEW.approved_by := 'system';
        NEW.approved_at := NOW();
        should_start_workflow := false;
      END IF;
      
      -- Create workflow execution if needed
      IF should_start_workflow THEN
        INSERT INTO public.workflow_executions (
          tenant_id,
          invoice_id,
          workflow_id,
          current_step,
          status,
          steps,
          created_by
        ) VALUES (
          NEW.tenant_id,
          NEW.id,
          default_workflow_id,
          1,
          'pending',
          '[{"step_order": 1, "status": "pending", "auto_approved": false}]'::jsonb,
          NEW.created_by
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to auto-start approval workflows
CREATE TRIGGER auto_start_approval_workflow_trigger
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION auto_start_approval_workflow();

-- Create function to process notification queue
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS INTEGER AS $
DECLARE
  notification_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Process pending notifications that are due
  FOR notification_record IN
    SELECT * FROM public.notifications
    WHERE status = 'pending'
      AND scheduled_at <= NOW()
      AND retry_count < max_retries
    ORDER BY priority DESC, scheduled_at ASC
    LIMIT 100
  LOOP
    -- Update status to sent (simplified - actual email sending would happen here)
    UPDATE public.notifications
    SET 
      status = 'sent',
      sent_at = NOW(),
      updated_at = NOW()
    WHERE id = notification_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$ LANGUAGE plpgsql;

-- Create function to mark overdue notifications as failed
CREATE OR REPLACE FUNCTION mark_failed_notifications()
RETURNS INTEGER AS $
DECLARE
  failed_count INTEGER := 0;
BEGIN
  -- Mark notifications as failed if they've exceeded max retries
  UPDATE public.notifications
  SET 
    status = 'failed',
    error_message = 'Maximum retry attempts exceeded',
    updated_at = NOW()
  WHERE status = 'pending'
    AND retry_count >= max_retries
    AND scheduled_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS failed_count = ROW_COUNT;
  RETURN failed_count;
END;
$ LANGUAGE plpgsql;

-- Insert sample workflow executions for existing invoices (if any)
INSERT INTO public.workflow_executions (
  tenant_id,
  invoice_id,
  workflow_id,
  current_step,
  status,
  steps,
  created_by
)
SELECT 
  i.tenant_id,
  i.id,
  w.id,
  CASE 
    WHEN i.status = 'approved' THEN 0
    WHEN i.status = 'pending_approval' THEN 1
    ELSE 1
  END,
  CASE 
    WHEN i.status = 'approved' THEN 'approved'
    WHEN i.status = 'pending_approval' THEN 'pending'
    ELSE 'pending'
  END,
  CASE 
    WHEN i.status = 'approved' THEN '[{"step_order": 0, "status": "approved", "auto_approved": true, "approved_at": "' || COALESCE(i.approved_at, i.created_at)::text || '"}]'::jsonb
    ELSE '[{"step_order": 1, "status": "pending", "auto_approved": false}]'::jsonb
  END,
  i.created_by
FROM public.invoices i
JOIN public.invoice_approval_workflows w ON w.tenant_id = i.tenant_id AND w.is_default = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.workflow_executions we 
  WHERE we.invoice_id = i.id
)
AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);