/**
 * WhatsApp-CRM Integration Service
 * Requirements: 5.5 - WhatsApp Business Integration with CRM
 * Handles integration between WhatsApp conversations and CRM lead records
 */

import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';
import { crmService } from '@/lib/services/crm';
import type {
  WhatsAppMessage,
  WhatsAppConversation,
  WhatsAppWebhookPayload
} from '@/lib/types/whatsapp';
import type {
  Lead,
  CreateLeadRequest,
  CreateInteractionRequest
} from '@/lib/types/crm';

export interface WhatsAppLeadCaptureData {
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  source_message?: string;
  conversation_context?: Record<string, any>;
}

export interface ConversationLinkResult {
  success: boolean;
  lead_id?: string;
  conversation_id?: string;
  error?: string;
}

export interface LeadCaptureResult {
  success: boolean;
  lead_id?: string;
  conversation_id?: string;
  is_new_lead: boolean;
  error?: string;
}

export class WhatsAppCRMIntegrationService {
  private supabase = createClient();

  /**
   * Link a WhatsApp conversation to an existing CRM lead
   */
  async linkConversationToLead(
    conversationId: string,
    leadId: string,
    context: TenantContext
  ): Promise<ConversationLinkResult> {
    try {
      // Verify lead exists and belongs to tenant
      const lead = await crmService.getLead(leadId);
      if (!lead || lead.tenant_id !== context.tenant_id) {
        return {
          success: false,
          error: 'Lead not found or access denied'
        };
      }

      // Update conversation with lead link
      const { error: updateError } = await this.supabase
        .from('whatsapp_conversations')
        .update({
          lead_id: leadId,
          updated_at: new Date()
        })
        .eq('id', conversationId)
        .eq('tenant_id', context.tenant_id);

      if (updateError) {
        throw updateError;
      }

      // Update all messages in the conversation with lead link
      const { error: messagesError } = await this.supabase
        .from('whatsapp_messages')
        .update({
          lead_id: leadId,
          updated_at: new Date()
        })
        .eq('conversation_id', conversationId)
        .eq('tenant_id', context.tenant_id);

      if (messagesError) {
        throw messagesError;
      }

      // Create CRM interaction for the linking action
      await crmService.createInteraction(context.tenant_id, {
        lead_id: leadId,
        channel: 'whatsapp',
        subject: 'WhatsApp conversation linked',
        content: `WhatsApp conversation ${conversationId} has been linked to this lead`,
        direction: 'outbound',
        metadata: {
          conversation_id: conversationId,
          action: 'conversation_linked'
        }
      });

      return {
        success: true,
        lead_id: leadId,
        conversation_id: conversationId
      };

    } catch (error) {
      console.error('Failed to link conversation to lead:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Capture a new lead from WhatsApp conversation
   */
  async captureLeadFromWhatsApp(
    captureData: WhatsAppLeadCaptureData,
    context: TenantContext
  ): Promise<LeadCaptureResult> {
    try {
      // Check if lead already exists with this phone number
      const existingLead = await this.findLeadByPhone(captureData.phone_number, context.tenant_id);
      
      if (existingLead) {
        // Link existing lead to conversation
        const conversation = await this.findConversationByPhone(
          captureData.phone_number, 
          context.tenant_id
        );
        
        if (conversation) {
          const linkResult = await this.linkConversationToLead(
            conversation.id,
            existingLead.id,
            context
          );
          
          return {
            success: linkResult.success,
            lead_id: existingLead.id,
            conversation_id: conversation.id,
            is_new_lead: false,
            error: linkResult.error
          };
        }
      }

      // Create new lead
      const leadData: CreateLeadRequest = {
        first_name: captureData.first_name || 'WhatsApp',
        last_name: captureData.last_name || 'Lead',
        phone: captureData.phone_number,
        email: captureData.email,
        company: captureData.company,
        source_id: await this.getWhatsAppSourceId(context.tenant_id),
        status: 'new',
        priority: 'medium',
        notes: captureData.source_message ? `Initial WhatsApp message: ${captureData.source_message}` : undefined,
        tags: ['whatsapp'],
        custom_fields: {
          whatsapp_phone: captureData.phone_number,
          conversation_context: captureData.conversation_context || {}
        }
      };

      const newLead = await crmService.createLead(context.tenant_id, leadData);

      // Find and link conversation
      const conversation = await this.findConversationByPhone(
        captureData.phone_number,
        context.tenant_id
      );

      if (conversation) {
        await this.linkConversationToLead(conversation.id, newLead.id, context);
      }

      // Create initial interaction
      await crmService.createInteraction(context.tenant_id, {
        lead_id: newLead.id,
        channel: 'whatsapp',
        subject: 'Lead captured from WhatsApp',
        content: captureData.source_message || 'Lead captured from WhatsApp conversation',
        direction: 'inbound',
        metadata: {
          phone_number: captureData.phone_number,
          conversation_id: conversation?.id,
          capture_source: 'whatsapp_conversation'
        }
      });

      return {
        success: true,
        lead_id: newLead.id,
        conversation_id: conversation?.id,
        is_new_lead: true
      };

    } catch (error) {
      console.error('Failed to capture lead from WhatsApp:', error);
      return {
        success: false,
        is_new_lead: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync WhatsApp message to CRM interaction
   */
  async syncMessageToCRM(
    message: WhatsAppMessage,
    context: TenantContext
  ): Promise<void> {
    try {
      // Skip if message is not linked to a lead
      if (!message.lead_id) {
        return;
      }

      // Check if interaction already exists
      const { data: existingInteraction } = await this.supabase
        .from('lead_interactions')
        .select('id')
        .eq('tenant_id', context.tenant_id)
        .eq('lead_id', message.lead_id)
        .eq('metadata->whatsapp_message_id', message.message_id)
        .single();

      if (existingInteraction) {
        return; // Already synced
      }

      // Create CRM interaction
      const interactionData: CreateInteractionRequest = {
        lead_id: message.lead_id,
        channel: 'whatsapp',
        subject: this.generateInteractionSubject(message),
        content: this.extractMessageContent(message),
        direction: message.direction,
        metadata: {
          whatsapp_message_id: message.message_id,
          conversation_id: message.conversation_id,
          message_type: message.message_type,
          template_name: message.template_name,
          message_status: message.status
        }
      };

      await crmService.createInteraction(context.tenant_id, interactionData);

    } catch (error) {
      console.error('Failed to sync WhatsApp message to CRM:', error);
    }
  }

  /**
   * Get conversation history with CRM context
   */
  async getConversationWithCRMContext(
    conversationId: string,
    context: TenantContext
  ): Promise<{
    conversation: WhatsAppConversation | null;
    lead: Lead | null;
    messages: WhatsAppMessage[];
    crm_interactions: any[];
  }> {
    try {
      // Get conversation
      const { data: conversation, error: convError } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('tenant_id', context.tenant_id)
        .single();

      if (convError || !conversation) {
        return {
          conversation: null,
          lead: null,
          messages: [],
          crm_interactions: []
        };
      }

      // Get linked lead
      let lead: Lead | null = null;
      if (conversation.lead_id) {
        lead = await crmService.getLead(conversation.lead_id);
      }

      // Get WhatsApp messages
      const { data: messages } = await this.supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversation.conversation_id)
        .eq('tenant_id', context.tenant_id)
        .order('created_at', { ascending: true });

      // Get CRM interactions if lead is linked
      let crm_interactions: any[] = [];
      if (lead) {
        crm_interactions = await crmService.getLeadInteractions(lead.id);
      }

      return {
        conversation,
        lead,
        messages: messages || [],
        crm_interactions
      };

    } catch (error) {
      console.error('Failed to get conversation with CRM context:', error);
      return {
        conversation: null,
        lead: null,
        messages: [],
        crm_interactions: []
      };
    }
  }

  /**
   * Auto-link conversations based on phone number matching
   */
  async autoLinkConversations(context: TenantContext): Promise<{
    linked_count: number;
    errors: string[];
  }> {
    try {
      const results = {
        linked_count: 0,
        errors: [] as string[]
      };

      // Get unlinked conversations
      const { data: conversations } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .is('lead_id', null)
        .eq('status', 'active');

      if (!conversations) {
        return results;
      }

      for (const conversation of conversations) {
        try {
          // Find matching lead by phone
          const lead = await this.findLeadByPhone(conversation.customer_phone, context.tenant_id);
          
          if (lead) {
            const linkResult = await this.linkConversationToLead(
              conversation.id,
              lead.id,
              context
            );
            
            if (linkResult.success) {
              results.linked_count++;
            } else {
              results.errors.push(`Failed to link conversation ${conversation.id}: ${linkResult.error}`);
            }
          }
        } catch (error) {
          results.errors.push(`Error processing conversation ${conversation.id}: ${error}`);
        }
      }

      return results;

    } catch (error) {
      console.error('Failed to auto-link conversations:', error);
      return {
        linked_count: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get WhatsApp analytics with CRM insights
   */
  async getWhatsAppCRMAnalytics(
    context: TenantContext,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    total_conversations: number;
    linked_conversations: number;
    leads_generated: number;
    conversion_rate: number;
    message_volume: {
      inbound: number;
      outbound: number;
      total: number;
    };
    lead_sources: Array<{
      source: string;
      count: number;
      conversion_rate: number;
    }>;
  }> {
    try {
      let dateFilter = '';
      if (dateRange) {
        dateFilter = `AND created_at >= '${dateRange.start.toISOString()}' AND created_at <= '${dateRange.end.toISOString()}'`;
      }

      // Get conversation stats
      const { count: totalConversations } = await this.supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', context.tenant_id);

      const { count: linkedConversations } = await this.supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', context.tenant_id)
        .not('lead_id', 'is', null);

      // Get message volume
      const { data: messageStats } = await this.supabase
        .from('whatsapp_messages')
        .select('direction')
        .eq('tenant_id', context.tenant_id);

      const messageVolume = messageStats?.reduce(
        (acc, msg) => {
          acc[msg.direction as 'inbound' | 'outbound']++;
          acc.total++;
          return acc;
        },
        { inbound: 0, outbound: 0, total: 0 }
      ) || { inbound: 0, outbound: 0, total: 0 };

      // Get leads generated from WhatsApp
      const whatsappSourceId = await this.getWhatsAppSourceId(context.tenant_id);
      const { count: leadsGenerated } = await this.supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', context.tenant_id)
        .eq('source_id', whatsappSourceId);

      const conversionRate = totalConversations ? 
        ((leadsGenerated || 0) / totalConversations) * 100 : 0;

      return {
        total_conversations: totalConversations || 0,
        linked_conversations: linkedConversations || 0,
        leads_generated: leadsGenerated || 0,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        message_volume: messageVolume,
        lead_sources: [] // TODO: Implement detailed source analysis
      };

    } catch (error) {
      console.error('Failed to get WhatsApp CRM analytics:', error);
      return {
        total_conversations: 0,
        linked_conversations: 0,
        leads_generated: 0,
        conversion_rate: 0,
        message_volume: { inbound: 0, outbound: 0, total: 0 },
        lead_sources: []
      };
    }
  }

  /**
   * Private helper methods
   */

  private async findLeadByPhone(phoneNumber: string, tenantId: string): Promise<Lead | null> {
    try {
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      if (!cleanPhone) return null;

      const { data: leads } = await this.supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`phone.eq.${cleanPhone},phone.eq.${phoneNumber}`);

      return leads && leads.length > 0 ? leads[0] : null;
    } catch (error) {
      console.error('Failed to find lead by phone:', error);
      return null;
    }
  }

  private async findConversationByPhone(
    phoneNumber: string, 
    tenantId: string
  ): Promise<WhatsAppConversation | null> {
    try {
      const { data: conversation } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_phone', phoneNumber)
        .eq('status', 'active')
        .single();

      return conversation;
    } catch (error) {
      return null;
    }
  }

  private async getWhatsAppSourceId(tenantId: string): Promise<string | undefined> {
    try {
      const { data: source } = await this.supabase
        .from('lead_sources')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', 'WhatsApp')
        .single();

      if (!source) {
        // Create WhatsApp source if it doesn't exist
        const { data: newSource } = await this.supabase
          .from('lead_sources')
          .insert({
            tenant_id: tenantId,
            name: 'WhatsApp',
            description: 'Leads captured from WhatsApp Business conversations',
            is_active: true
          })
          .select('id')
          .single();

        return newSource?.id;
      }

      return source.id;
    } catch (error) {
      console.error('Failed to get WhatsApp source ID:', error);
      return undefined;
    }
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

  private generateInteractionSubject(message: WhatsAppMessage): string {
    const direction = message.direction === 'inbound' ? 'received' : 'sent';
    const type = message.message_type === 'text' ? 'message' : `${message.message_type} message`;
    
    return `WhatsApp ${type} ${direction}`;
  }

  private extractMessageContent(message: WhatsAppMessage): string {
    if (message.content) {
      if (typeof message.content === 'string') {
        return message.content;
      }
      
      if (message.content.body) {
        return message.content.body;
      }
      
      if (message.content.text?.body) {
        return message.content.text.body;
      }
      
      if (message.content.caption) {
        return message.content.caption;
      }
      
      if (message.content.name) {
        return `Template: ${message.content.name}`;
      }
    }
    
    return `WhatsApp ${message.message_type} message`;
  }
}

// Export singleton instance
export const whatsappCRMIntegration = new WhatsAppCRMIntegrationService();