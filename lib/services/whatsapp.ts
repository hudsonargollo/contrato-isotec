/**
 * WhatsApp Business API Service
 * Requirements: 5.1, 5.2, 5.4, 5.5
 * Handles WhatsApp Business API integration for messaging and webhook processing
 */

import { Client as WhatsApp } from '@great-detail/whatsapp';
import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';
import {
  WhatsAppMessage,
  WhatsAppTemplate,
  WhatsAppConversation,
  WhatsAppWebhookEvent,
  WhatsAppPhoneNumber,
  SendMessageRequest,
  SendMessageResponse,
  WhatsAppWebhookPayload,
  WhatsAppMessageDeliveryResult,
  WhatsAppConfig,
  WhatsAppError,
  WhatsAppWebhookError,
  WhatsAppMessageType,
  WhatsAppMessageStatus,
  WhatsAppMessageDirection
} from '@/lib/types/whatsapp';

export class WhatsAppService {
  private client: WhatsApp;
  private supabase = createClient();
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.client = new WhatsApp({
      request: {
        headers: {
          Authorization: `Bearer ${config.accessToken}`
        }
      }
    });
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(
    request: SendMessageRequest,
    context: TenantContext
  ): Promise<WhatsAppMessageDeliveryResult> {
    try {
      // Validate phone number format
      const cleanPhoneNumber = this.cleanPhoneNumber(request.to);
      if (!cleanPhoneNumber) {
        throw new WhatsAppError('Invalid phone number format', 'INVALID_PHONE_NUMBER');
      }

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        this.config.phoneNumberId,
        cleanPhoneNumber,
        context
      );

      // Send message via WhatsApp API
      const response = await this.client.message.createMessage({
        phoneNumberID: this.config.phoneNumberId,
        to: cleanPhoneNumber,
        type: request.type,
        ...this.mapRequestToSDKFormat(request)
      });

      if (!response.messages || response.messages.length === 0) {
        throw new WhatsAppError('No message ID returned from WhatsApp API', 'NO_MESSAGE_ID');
      }

      const messageId = response.messages[0].id;

      // Store message in database
      const message = await this.storeOutboundMessage({
        tenant_id: context.tenant_id,
        message_id: messageId,
        conversation_id: conversation.conversation_id,
        from_phone_number: this.config.phoneNumberId,
        to_phone_number: cleanPhoneNumber,
        direction: 'outbound',
        message_type: request.type,
        content: this.extractMessageContent(request),
        template_name: request.template?.name,
        template_language: request.template?.language.code,
        status: 'sent',
        sent_at: new Date(),
        created_by: context.user_id
      });

      // Update conversation
      await this.updateConversation(conversation.id, {
        last_message_at: new Date(),
        message_count: conversation.message_count + 1
      });

      // Create CRM interaction if customer/lead is linked
      if (conversation.customer_id || conversation.lead_id) {
        await this.createCRMInteraction(message, conversation, context);
      }

      // Sync message to CRM if integration service is available
      try {
        const { whatsappCRMIntegration } = await import('@/lib/services/whatsapp-crm-integration');
        await whatsappCRMIntegration.syncMessageToCRM(message, context);
      } catch (error) {
        console.error('Failed to sync message to CRM:', error);
      }

      // Track usage metrics
      await this.trackUsageMetrics(context.tenant_id, 'whatsapp_messages', 1);

      return {
        success: true,
        messageId: messageId
      };

    } catch (error) {
      console.error('WhatsApp message send failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof WhatsAppError ? error.code : undefined
      };
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    components: any[],
    context: TenantContext
  ): Promise<WhatsAppMessageDeliveryResult> {
    return await this.sendMessage({
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    }, context);
  }

  /**
   * Send text message
   */
  async sendTextMessage(
    to: string,
    text: string,
    context: TenantContext
  ): Promise<WhatsAppMessageDeliveryResult> {
    return await this.sendMessage({
      to,
      type: 'text',
      text: { body: text }
    }, context);
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(
    payload: WhatsAppWebhookPayload,
    context: TenantContext
  ): Promise<void> {
    try {
      // Store webhook event
      const webhookEvent = await this.storeWebhookEvent(payload, context);

      // Process each entry in the webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await this.processMessageChanges(change.value, webhookEvent.id, context);
          }
        }
      }

      // Mark webhook as processed
      await this.markWebhookProcessed(webhookEvent.id);

    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw new WhatsAppWebhookError(
        'Failed to process webhook',
        payload,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implementation would depend on Meta's webhook signature verification
    // For now, return true - in production, implement proper signature verification
    return true;
  }

  /**
   * Handle webhook verification challenge
   */
  handleWebhookVerification(
    mode: string,
    token: string,
    challenge: string
  ): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<WhatsAppMessageStatus> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select('status')
        .eq('message_id', messageId)
        .single();

      if (error || !data) {
        return 'pending';
      }

      return data.status as WhatsAppMessageStatus;
    } catch (error) {
      console.error('Failed to get message status:', error);
      return 'pending';
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get conversation history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Get active conversations
   */
  async getActiveConversations(
    context: TenantContext,
    limit: number = 20
  ): Promise<WhatsAppConversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          customers(name, email),
          leads(name, email)
        `)
        .eq('tenant_id', context.tenant_id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get active conversations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get active conversations:', error);
      return [];
    }
  }

  /**
   * Create or update template
   */
  async createTemplate(
    template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>,
    context: TenantContext
  ): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_templates')
        .insert({
          ...template,
          tenant_id: context.tenant_id,
          created_by: context.user_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Get templates
   */
  async getTemplates(
    context: TenantContext,
    status?: string
  ): Promise<WhatsAppTemplate[]> {
    try {
      let query = this.supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Update template approval status
   */
  async updateTemplateApproval(
    templateId: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
    context: TenantContext,
    rejectionReason?: string,
    approvalComment?: string
  ): Promise<WhatsAppTemplate> {
    try {
      const updateData: any = {
        approval_status: approvalStatus,
        updated_at: new Date()
      };

      if (approvalStatus === 'APPROVED') {
        updateData.approved_by = context.user_id;
        updateData.approved_at = new Date();
        updateData.rejection_reason = null;
        updateData.status = 'APPROVED'; // Also update the main status
        if (approvalComment) {
          updateData.approval_comment = approvalComment;
        }
      } else if (approvalStatus === 'REJECTED') {
        updateData.rejection_reason = rejectionReason;
        updateData.approved_by = null;
        updateData.approved_at = null;
        updateData.status = 'REJECTED'; // Also update the main status
      }

      const { data, error } = await this.supabase
        .from('whatsapp_templates')
        .update(updateData)
        .eq('id', templateId)
        .eq('tenant_id', context.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update template approval: ${error.message}`);
      }

      // Log approval action for audit trail
      await this.logTemplateApprovalAction(templateId, approvalStatus, context, rejectionReason);

      return data;
    } catch (error) {
      console.error('Failed to update template approval:', error);
      throw error;
    }
  }

  /**
   * Get templates pending approval
   */
  async getTemplatesPendingApproval(
    context: TenantContext
  ): Promise<WhatsAppTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_templates')
        .select(`
          *,
          created_by_user:auth.users!created_by(email)
        `)
        .eq('tenant_id', context.tenant_id)
        .eq('approval_status', 'PENDING')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get pending templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get pending templates:', error);
      return [];
    }
  }

  /**
   * Submit template for approval
   */
  async submitTemplateForApproval(
    templateId: string,
    context: TenantContext
  ): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_templates')
        .update({
          approval_status: 'PENDING',
          status: 'PENDING',
          updated_at: new Date()
        })
        .eq('id', templateId)
        .eq('tenant_id', context.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit template for approval: ${error.message}`);
      }

      // Notify approvers (in a real implementation, this would send notifications)
      await this.notifyApprovers(templateId, context);

      return data;
    } catch (error) {
      console.error('Failed to submit template for approval:', error);
      throw error;
    }
  }

  /**
   * Get template compliance status
   */
  async getTemplateComplianceStatus(
    templateId: string,
    context: TenantContext
  ): Promise<{
    overallScore: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      recommendation?: string;
    }>;
  }> {
    try {
      const { data: template, error } = await this.supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('id', templateId)
        .eq('tenant_id', context.tenant_id)
        .single();

      if (error || !template) {
        throw new Error('Template not found');
      }

      // Perform compliance analysis
      const issues = [];
      let score = 100;

      // Check naming convention
      if (!/^[a-z0-9_]+$/.test(template.name)) {
        issues.push({
          type: 'error' as const,
          message: 'Template name must contain only lowercase letters, numbers, and underscores',
          recommendation: 'Update template name to follow naming conventions'
        });
        score -= 20;
      }

      // Check body text
      if (!template.body?.text?.trim()) {
        issues.push({
          type: 'error' as const,
          message: 'Template must have body text',
          recommendation: 'Add body text to the template'
        });
        score -= 30;
      }

      // Check button count
      if (template.buttons && template.buttons.length > 3) {
        issues.push({
          type: 'error' as const,
          message: 'Template cannot have more than 3 buttons',
          recommendation: 'Remove excess buttons'
        });
        score -= 15;
      }

      // Check for spam indicators
      const bodyText = template.body?.text?.toLowerCase() || '';
      if (/[A-Z]{5,}/.test(template.body?.text || '')) {
        issues.push({
          type: 'warning' as const,
          message: 'Excessive capitalization detected',
          recommendation: 'Reduce use of capital letters'
        });
        score -= 10;
      }

      return {
        overallScore: Math.max(0, score),
        issues
      };
    } catch (error) {
      console.error('Failed to get compliance status:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private mapRequestToSDKFormat(request: SendMessageRequest): any {
    const mapped: any = {};
    
    switch (request.type) {
      case 'text':
        mapped.text = request.text;
        break;
      case 'template':
        mapped.template = request.template;
        break;
      case 'image':
        mapped.image = request.image;
        break;
      case 'document':
        mapped.document = request.document;
        break;
      case 'audio':
        mapped.audio = request.audio;
        break;
      case 'video':
        mapped.video = request.video;
        break;
      case 'location':
        mapped.location = request.location;
        break;
      case 'contacts':
        mapped.contacts = request.contacts;
        break;
      case 'interactive':
        mapped.interactive = request.interactive;
        break;
    }
    
    return mapped;
  }

  private cleanPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Validate phone number (basic validation)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null;
    }

    // Add country code if missing (assuming Brazil +55 for this implementation)
    if (cleaned.length === 11 && cleaned.startsWith('55')) {
      return cleaned;
    } else if (cleaned.length === 11) {
      return '55' + cleaned;
    } else if (cleaned.length === 10) {
      return '55' + cleaned;
    }

    return cleaned;
  }

  private async getOrCreateConversation(
    phoneNumber: string,
    customerPhone: string,
    context: TenantContext
  ): Promise<WhatsAppConversation> {
    try {
      // Try to find existing conversation
      const { data: existing, error: findError } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .eq('phone_number', phoneNumber)
        .eq('customer_phone', customerPhone)
        .eq('status', 'active')
        .single();

      if (!findError && existing) {
        return existing;
      }

      // Create new conversation
      const conversationId = `${phoneNumber}_${customerPhone}_${Date.now()}`;
      
      const { data, error } = await this.supabase
        .from('whatsapp_conversations')
        .insert({
          tenant_id: context.tenant_id,
          conversation_id: conversationId,
          phone_number: phoneNumber,
          customer_phone: customerPhone,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to get or create conversation:', error);
      throw error;
    }
  }

  private async storeOutboundMessage(messageData: any): Promise<WhatsAppMessage> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store message: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to store outbound message:', error);
      throw error;
    }
  }

  private async storeWebhookEvent(
    payload: WhatsAppWebhookPayload,
    context: TenantContext
  ): Promise<WhatsAppWebhookEvent> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_webhook_events')
        .insert({
          tenant_id: context.tenant_id,
          webhook_id: payload.entry[0]?.id || 'unknown',
          event_type: payload.entry[0]?.changes[0]?.field || 'unknown',
          payload: payload,
          processed: false
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store webhook event: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to store webhook event:', error);
      throw error;
    }
  }

  private async processMessageChanges(
    value: any,
    webhookEventId: string,
    context: TenantContext
  ): Promise<void> {
    // Process incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.processIncomingMessage(message, value.metadata, webhookEventId, context);
      }
    }

    // Process message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.processMessageStatus(status, webhookEventId, context);
      }
    }
  }

  private async processIncomingMessage(
    message: any,
    metadata: any,
    webhookEventId: string,
    context: TenantContext
  ): Promise<void> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        metadata.phone_number_id,
        message.from,
        context
      );

      // Store incoming message
      const storedMessage = await this.supabase
        .from('whatsapp_messages')
        .insert({
          tenant_id: context.tenant_id,
          message_id: message.id,
          conversation_id: conversation.conversation_id,
          from_phone_number: message.from,
          to_phone_number: metadata.phone_number_id,
          direction: 'inbound',
          message_type: message.type,
          content: this.extractIncomingMessageContent(message),
          status: 'delivered',
          delivered_at: new Date(parseInt(message.timestamp) * 1000),
          customer_id: conversation.customer_id,
          lead_id: conversation.lead_id
        })
        .select()
        .single();

      if (storedMessage.error) {
        throw new Error(`Failed to store incoming message: ${storedMessage.error.message}`);
      }

      // Update conversation
      await this.updateConversation(conversation.id, {
        last_message_at: new Date(parseInt(message.timestamp) * 1000),
        message_count: conversation.message_count + 1
      });

      // Create CRM interaction
      if (conversation.customer_id || conversation.lead_id) {
        await this.createCRMInteraction(storedMessage.data, conversation, context);
      }

      // Sync message to CRM if integration service is available
      try {
        const { whatsappCRMIntegration } = await import('@/lib/services/whatsapp-crm-integration');
        await whatsappCRMIntegration.syncMessageToCRM(storedMessage.data, context);
      } catch (error) {
        console.error('Failed to sync incoming message to CRM:', error);
      }

      // Link webhook event to message
      await this.supabase
        .from('whatsapp_webhook_events')
        .update({ message_id: storedMessage.data.id })
        .eq('id', webhookEventId);

    } catch (error) {
      console.error('Failed to process incoming message:', error);
    }
  }

  private async processMessageStatus(
    status: any,
    webhookEventId: string,
    context: TenantContext
  ): Promise<void> {
    try {
      const statusMap: Record<string, WhatsAppMessageStatus> = {
        'sent': 'sent',
        'delivered': 'delivered',
        'read': 'read',
        'failed': 'failed'
      };

      const mappedStatus = statusMap[status.status] || 'pending';
      const timestamp = new Date(parseInt(status.timestamp) * 1000);

      // Update message status
      const updateData: any = { status: mappedStatus };
      
      if (mappedStatus === 'sent') updateData.sent_at = timestamp;
      if (mappedStatus === 'delivered') updateData.delivered_at = timestamp;
      if (mappedStatus === 'read') updateData.read_at = timestamp;
      
      if (status.errors && status.errors.length > 0) {
        updateData.error_code = status.errors[0].code?.toString();
        updateData.error_message = status.errors[0].title;
      }

      await this.supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('message_id', status.id)
        .eq('tenant_id', context.tenant_id);

    } catch (error) {
      console.error('Failed to process message status:', error);
    }
  }

  private async updateConversation(
    conversationId: string,
    updates: Partial<WhatsAppConversation>
  ): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_conversations')
        .update(updates)
        .eq('id', conversationId);
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  }

  private async createCRMInteraction(
    message: WhatsAppMessage,
    conversation: WhatsAppConversation,
    context: TenantContext
  ): Promise<void> {
    try {
      // Only create CRM interaction if conversation is linked to a lead
      if (!conversation.lead_id) {
        return;
      }

      // Import CRM service dynamically to avoid circular dependencies
      const { crmService } = await import('@/lib/services/crm');
      
      const interactionData = {
        lead_id: conversation.lead_id,
        channel: 'whatsapp' as const,
        subject: `WhatsApp ${message.direction === 'inbound' ? 'message received' : 'message sent'}`,
        content: this.getMessageContentSummary(message.content),
        direction: message.direction,
        metadata: {
          whatsapp_message_id: message.message_id,
          conversation_id: conversation.conversation_id,
          message_type: message.message_type,
          template_name: message.template_name,
          message_status: message.status
        }
      };

      await crmService.createInteraction(context.tenant_id, interactionData);

    } catch (error) {
      console.error('Failed to create CRM interaction:', error);
    }
  }

  private async markWebhookProcessed(webhookEventId: string): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_webhook_events')
        .update({
          processed: true,
          processed_at: new Date()
        })
        .eq('id', webhookEventId);
    } catch (error) {
      console.error('Failed to mark webhook as processed:', error);
    }
  }

  private async trackUsageMetrics(
    tenantId: string,
    metricName: string,
    value: number
  ): Promise<void> {
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await this.supabase
        .from('tenant_usage_metrics')
        .upsert({
          tenant_id: tenantId,
          metric_name: metricName,
          metric_value: value,
          period_start: periodStart,
          period_end: periodEnd
        }, {
          onConflict: 'tenant_id,metric_name,period_start',
          ignoreDuplicates: false
        });
    } catch (error) {
      console.error('Failed to track usage metrics:', error);
    }
  }

  private extractMessageContent(request: SendMessageRequest): any {
    switch (request.type) {
      case 'text':
        return request.text;
      case 'template':
        return request.template;
      case 'image':
        return request.image;
      case 'document':
        return request.document;
      case 'audio':
        return request.audio;
      case 'video':
        return request.video;
      case 'location':
        return request.location;
      case 'contacts':
        return request.contacts;
      case 'interactive':
        return request.interactive;
      default:
        return {};
    }
  }

  private extractIncomingMessageContent(message: any): any {
    const contentMap: Record<string, string> = {
      'text': 'text',
      'image': 'image',
      'document': 'document',
      'audio': 'audio',
      'video': 'video',
      'location': 'location',
      'contacts': 'contacts',
      'interactive': 'interactive'
    };

    const contentKey = contentMap[message.type];
    return contentKey ? message[contentKey] : {};
  }

  private getMessageContentSummary(content: any): string {
    if (content.body) {
      return content.body;
    }
    if (content.text?.body) {
      return content.text.body;
    }
    if (content.caption) {
      return content.caption;
    }
    if (content.name) {
      return `Template: ${content.name}`;
    }
    return 'WhatsApp message';
  }

  /**
   * Log template approval action for audit trail
   */
  private async logTemplateApprovalAction(
    templateId: string,
    action: 'APPROVED' | 'REJECTED',
    context: TenantContext,
    reason?: string
  ): Promise<void> {
    try {
      // Import CRM service dynamically to avoid circular dependencies
      const { crmService } = await import('@/lib/services/crm');
      
      // Create a system interaction for template approval
      // Note: This creates a general interaction not tied to a specific lead
      // In a real implementation, you might want to create a separate audit log table
      console.log(`Template ${templateId} was ${action.toLowerCase()}${reason ? `: ${reason}` : ''} by user ${context.user_id}`);
      
      // For now, we'll just log to console since template approvals aren't lead-specific
      // In the future, consider creating a separate audit_logs table for system actions
    } catch (error) {
      console.error('Failed to log approval action:', error);
    }
  }

  /**
   * Notify approvers about pending template
   */
  private async notifyApprovers(
    templateId: string,
    context: TenantContext
  ): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Get list of users with approval permissions
      // 2. Send email/WhatsApp notifications
      // 3. Create in-app notifications
      
      console.log(`Template ${templateId} submitted for approval in tenant ${context.tenant_id}`);
      
      // For now, just log the action since template submissions aren't lead-specific
      // In the future, consider creating a separate notifications system
    } catch (error) {
      console.error('Failed to notify approvers:', error);
    }
  }
}

// Factory function to create WhatsApp service instance
export function createWhatsAppService(tenantId: string): WhatsAppService {
  // In a real implementation, you would fetch tenant-specific WhatsApp configuration
  // For now, use environment variables
  const config: WhatsAppConfig = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    apiVersion: 'v23.0'
  };

  return new WhatsAppService(config);
}