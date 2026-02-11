-- WhatsApp Business Integration System
-- Requirements: 5.1, 5.2, 5.4, 5.5
-- This migration creates the database schema for WhatsApp Business API integration

-- WhatsApp message templates table
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language TEXT NOT NULL DEFAULT 'en_US',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'DISABLED')),
  
  -- Template components
  header JSONB,
  body JSONB NOT NULL,
  footer JSONB,
  buttons JSONB,
  
  -- Meta template information
  meta_template_id TEXT, -- WhatsApp template ID from Meta
  quality_score TEXT,
  rejection_reason TEXT,
  
  -- Approval workflow
  approval_status TEXT DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, name, language)
);

-- WhatsApp messages table
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Message identification
  message_id TEXT, -- WhatsApp message ID from API
  conversation_id TEXT, -- WhatsApp conversation ID
  
  -- Sender/Recipient information
  from_phone_number TEXT NOT NULL,
  to_phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- Message content
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'template', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'interactive')),
  content JSONB NOT NULL,
  
  -- Template information (for template messages)
  template_id UUID REFERENCES whatsapp_templates(id),
  template_name TEXT,
  template_language TEXT,
  
  -- Message status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- CRM integration
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  interaction_id UUID REFERENCES customer_interactions(id),
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp webhook events table
CREATE TABLE whatsapp_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Webhook information
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  
  -- Event payload
  payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Related message
  message_id UUID REFERENCES whatsapp_messages(id),
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp phone numbers table (for multi-number support)
CREATE TABLE whatsapp_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Phone number information
  phone_number TEXT NOT NULL,
  phone_number_id TEXT NOT NULL, -- WhatsApp phone number ID from Meta
  display_name TEXT,
  
  -- Status and verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'unverified', 'restricted')),
  verified_name TEXT,
  
  -- Configuration
  is_primary BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  
  -- Business profile
  business_profile JSONB,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, phone_number),
  UNIQUE(phone_number_id)
);

-- WhatsApp conversations table
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Conversation identification
  conversation_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  -- Conversation metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  
  -- CRM integration
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Conversation context
  context JSONB DEFAULT '{}',
  tags TEXT[],
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, conversation_id)
);

-- WhatsApp campaigns table (for lead nurturing)
CREATE TABLE whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Campaign information
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Campaign configuration
  template_id UUID REFERENCES whatsapp_templates(id) NOT NULL,
  target_audience JSONB NOT NULL, -- Criteria for selecting recipients
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Statistics
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp campaign recipients table
CREATE TABLE whatsapp_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE NOT NULL,
  
  -- Recipient information
  phone_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  
  -- Message status
  message_id UUID REFERENCES whatsapp_messages(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  -- Personalization data
  template_variables JSONB DEFAULT '{}',
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(campaign_id, phone_number)
);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_templates_tenant_id ON whatsapp_templates(tenant_id);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_whatsapp_templates_approval_status ON whatsapp_templates(approval_status);

CREATE INDEX idx_whatsapp_messages_tenant_id ON whatsapp_messages(tenant_id);
CREATE INDEX idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_customer_id ON whatsapp_messages(customer_id);
CREATE INDEX idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

CREATE INDEX idx_whatsapp_webhook_events_tenant_id ON whatsapp_webhook_events(tenant_id);
CREATE INDEX idx_whatsapp_webhook_events_processed ON whatsapp_webhook_events(processed);
CREATE INDEX idx_whatsapp_webhook_events_created_at ON whatsapp_webhook_events(created_at);

CREATE INDEX idx_whatsapp_phone_numbers_tenant_id ON whatsapp_phone_numbers(tenant_id);
CREATE INDEX idx_whatsapp_phone_numbers_status ON whatsapp_phone_numbers(status);

CREATE INDEX idx_whatsapp_conversations_tenant_id ON whatsapp_conversations(tenant_id);
CREATE INDEX idx_whatsapp_conversations_customer_id ON whatsapp_conversations(customer_id);
CREATE INDEX idx_whatsapp_conversations_lead_id ON whatsapp_conversations(lead_id);
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);

CREATE INDEX idx_whatsapp_campaigns_tenant_id ON whatsapp_campaigns(tenant_id);
CREATE INDEX idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_campaigns_scheduled_at ON whatsapp_campaigns(scheduled_at);

CREATE INDEX idx_whatsapp_campaign_recipients_campaign_id ON whatsapp_campaign_recipients(campaign_id);
CREATE INDEX idx_whatsapp_campaign_recipients_status ON whatsapp_campaign_recipients(status);

-- Enable Row Level Security
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_whatsapp_templates ON whatsapp_templates
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_whatsapp_messages ON whatsapp_messages
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_whatsapp_webhook_events ON whatsapp_webhook_events
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_whatsapp_phone_numbers ON whatsapp_phone_numbers
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_whatsapp_conversations ON whatsapp_conversations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_whatsapp_campaigns ON whatsapp_campaigns
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_whatsapp_campaign_recipients ON whatsapp_campaign_recipients
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM whatsapp_campaigns 
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_webhook_events_updated_at
  BEFORE UPDATE ON whatsapp_webhook_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_phone_numbers_updated_at
  BEFORE UPDATE ON whatsapp_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaign_recipients_updated_at
  BEFORE UPDATE ON whatsapp_campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add WhatsApp-related usage metrics to tenant_usage_metrics
-- (The constraint already includes 'whatsapp_messages' from the existing migration)

-- Insert sample WhatsApp interaction type
INSERT INTO interaction_types (name, description, channel, color) VALUES
  ('WhatsApp Business', 'WhatsApp Business API message', 'whatsapp', '#25d366')
ON CONFLICT (name) DO NOTHING;

-- Create function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE whatsapp_conversations 
    SET 
      message_count = message_count + 1,
      last_message_at = NEW.created_at
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE whatsapp_conversations 
    SET message_count = message_count - 1
    WHERE conversation_id = OLD.conversation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_message_count_trigger
  AFTER INSERT OR DELETE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Create function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE whatsapp_campaigns 
    SET 
      messages_sent = (
        SELECT COUNT(*) FROM whatsapp_campaign_recipients 
        WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'delivered', 'read')
      ),
      messages_delivered = (
        SELECT COUNT(*) FROM whatsapp_campaign_recipients 
        WHERE campaign_id = NEW.campaign_id AND status IN ('delivered', 'read')
      ),
      messages_read = (
        SELECT COUNT(*) FROM whatsapp_campaign_recipients 
        WHERE campaign_id = NEW.campaign_id AND status = 'read'
      ),
      messages_failed = (
        SELECT COUNT(*) FROM whatsapp_campaign_recipients 
        WHERE campaign_id = NEW.campaign_id AND status = 'failed'
      )
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_statistics_trigger
  AFTER INSERT OR UPDATE ON whatsapp_campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION update_campaign_statistics();