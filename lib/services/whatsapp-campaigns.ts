/**
 * WhatsApp Campaign Service
 * Requirements: 5.3 - Automated lead nurturing campaigns
 * Handles campaign scheduling, automation, and customer journey-based messaging
 */

import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';
import { crmService } from '@/lib/services/crm';
import { WhatsAppService } from '@/lib/services/whatsapp';
import {
  WhatsAppCampaign,
  WhatsAppCampaignRecipient,
  WhatsAppCampaignStatus,
  WhatsAppCampaignResult
} from '@/lib/types/whatsapp';
import { Lead, LeadStatus, PipelineStage } from '@/lib/types/crm';

export interface CampaignTrigger {
  type: 'stage_change' | 'time_based' | 'score_change' | 'inactivity' | 'manual';
  conditions: {
    stage_id?: string;
    previous_stage_id?: string;
    score_threshold?: number;
    days_since_last_contact?: number;
    lead_status?: LeadStatus[];
    custom_field_conditions?: Record<string, any>;
  };
  delay_minutes?: number; // Delay before sending message
}

export interface CampaignAudience {
  lead_filters: {
    status?: LeadStatus[];
    stage_ids?: string[];
    source_ids?: string[];
    assigned_to?: string[];
    score_min?: number;
    score_max?: number;
    tags?: string[];
    created_after?: Date;
    created_before?: Date;
    last_contact_before?: Date;
    custom_field_filters?: Record<string, any>;
  };
  exclude_recent_contacts?: boolean; // Don't send if contacted in last 24h
  max_recipients?: number;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: Date;
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // Every N days/weeks/months
    days_of_week?: number[]; // For weekly (0=Sunday, 6=Saturday)
    day_of_month?: number; // For monthly
    time_of_day?: string; // HH:MM format
  };
  timezone?: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  template_id: string;
  audience: CampaignAudience;
  trigger?: CampaignTrigger;
  schedule?: CampaignSchedule;
  personalization_rules?: Record<string, string>; // Field mappings for template variables
  is_automated?: boolean;
}

export interface CampaignPerformanceMetrics {
  campaign_id: string;
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  delivery_rate: number;
  read_rate: number;
  engagement_rate: number;
  cost_per_message: number;
  roi_estimate: number;
  top_performing_segments: Array<{
    segment_name: string;
    recipients: number;
    engagement_rate: number;
  }>;
}

export class WhatsAppCampaignService {
  private supabase = createClient();

  /**
   * Create a new campaign
   */
  async createCampaign(
    context: TenantContext,
    data: CreateCampaignRequest
  ): Promise<WhatsAppCampaign> {
    try {
      // Validate template exists and is approved
      const { data: template, error: templateError } = await this.supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('id', data.template_id)
        .eq('tenant_id', context.tenant_id)
        .eq('status', 'APPROVED')
        .single();

      if (templateError || !template) {
        throw new Error('Template not found or not approved');
      }

      // Create campaign
      const { data: campaign, error } = await this.supabase
        .from('whatsapp_campaigns')
        .insert({
          tenant_id: context.tenant_id,
          name: data.name,
          description: data.description,
          template_id: data.template_id,
          target_audience: {
            audience: data.audience,
            trigger: data.trigger,
            schedule: data.schedule,
            personalization_rules: data.personalization_rules,
            is_automated: data.is_automated || false
          },
          status: 'draft',
          created_by: context.user_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create campaign: ${error.message}`);
      }

      // If immediate execution is requested, process the campaign
      if (data.schedule?.type === 'immediate') {
        await this.processCampaign(campaign.id, context);
      }

      return campaign;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaigns for a tenant
   */
  async getCampaigns(
    context: TenantContext,
    status?: WhatsAppCampaignStatus,
    limit: number = 20,
    offset: number = 0
  ): Promise<WhatsAppCampaign[]> {
    try {
      let query = this.supabase
        .from('whatsapp_campaigns')
        .select(`
          *,
          template:whatsapp_templates(name, category, language),
          created_by_user:profiles!created_by(email, full_name)
        `)
        .eq('tenant_id', context.tenant_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: campaigns, error } = await query;

      if (error) {
        throw new Error(`Failed to get campaigns: ${error.message}`);
      }

      return campaigns || [];
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      return [];
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(
    campaignId: string,
    context: TenantContext
  ): Promise<WhatsAppCampaign | null> {
    try {
      const { data: campaign, error } = await this.supabase
        .from('whatsapp_campaigns')
        .select(`
          *,
          template:whatsapp_templates(*),
          recipients:whatsapp_campaign_recipients(*)
        `)
        .eq('id', campaignId)
        .eq('tenant_id', context.tenant_id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to get campaign: ${error.message}`);
      }

      return campaign;
    } catch (error) {
      console.error('Failed to get campaign:', error);
      return null;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignRequest>,
    context: TenantContext
  ): Promise<WhatsAppCampaign> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.template_id) updateData.template_id = updates.template_id;

      if (updates.audience || updates.trigger || updates.schedule || updates.personalization_rules) {
        // Get current target_audience and merge with updates
        const current = await this.getCampaign(campaignId, context);
        if (!current) throw new Error('Campaign not found');

        updateData.target_audience = {
          ...current.target_audience,
          ...(updates.audience && { audience: updates.audience }),
          ...(updates.trigger && { trigger: updates.trigger }),
          ...(updates.schedule && { schedule: updates.schedule }),
          ...(updates.personalization_rules && { personalization_rules: updates.personalization_rules })
        };
      }

      const { data: campaign, error } = await this.supabase
        .from('whatsapp_campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .eq('tenant_id', context.tenant_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update campaign: ${error.message}`);
      }

      return campaign;
    } catch (error) {
      console.error('Failed to update campaign:', error);
      throw error;
    }
  }

  /**
   * Start a campaign
   */
  async startCampaign(
    campaignId: string,
    context: TenantContext
  ): Promise<WhatsAppCampaignResult> {
    try {
      // Update campaign status to active
      await this.supabase
        .from('whatsapp_campaigns')
        .update({
          status: 'active',
          started_at: new Date()
        })
        .eq('id', campaignId)
        .eq('tenant_id', context.tenant_id);

      // Process the campaign
      return await this.processCampaign(campaignId, context);
    } catch (error) {
      console.error('Failed to start campaign:', error);
      throw error;
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(
    campaignId: string,
    context: TenantContext
  ): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)
        .eq('tenant_id', context.tenant_id);
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      throw error;
    }
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(
    campaignId: string,
    context: TenantContext
  ): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId)
        .eq('tenant_id', context.tenant_id);
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      throw error;
    }
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(
    campaignId: string,
    context: TenantContext
  ): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_campaigns')
        .update({ 
          status: 'cancelled',
          completed_at: new Date()
        })
        .eq('id', campaignId)
        .eq('tenant_id', context.tenant_id);
    } catch (error) {
      console.error('Failed to cancel campaign:', error);
      throw error;
    }
  }

  /**
   * Process a campaign - find recipients and send messages
   */
  async processCampaign(
    campaignId: string,
    context: TenantContext
  ): Promise<WhatsAppCampaignResult> {
    try {
      const campaign = await this.getCampaign(campaignId, context);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const audience = campaign.target_audience.audience as CampaignAudience;
      
      // Find eligible leads
      const leads = await this.findCampaignRecipients(audience, context);
      
      // Create campaign recipients
      const recipients = await this.createCampaignRecipients(
        campaignId,
        leads,
        campaign.target_audience.personalization_rules || {},
        context
      );

      // Update campaign with recipient count
      await this.supabase
        .from('whatsapp_campaigns')
        .update({ total_recipients: recipients.length })
        .eq('id', campaignId);

      // Send messages
      const result = await this.sendCampaignMessages(campaignId, context);

      return result;
    } catch (error) {
      console.error('Failed to process campaign:', error);
      throw error;
    }
  }

  /**
   * Find leads that match campaign audience criteria
   */
  private async findCampaignRecipients(
    audience: CampaignAudience,
    context: TenantContext
  ): Promise<Lead[]> {
    try {
      const filters = audience.lead_filters;
      
      // Use CRM service to find leads with filters
      const result = await crmService.getLeads(
        context.tenant_id,
        {
          status: filters.status,
          stage_id: filters.stage_ids,
          source_id: filters.source_ids,
          assigned_to: filters.assigned_to,
          score_min: filters.score_min,
          score_max: filters.score_max,
          tags: filters.tags,
          created_after: filters.created_after,
          created_before: filters.created_before,
          last_contact_before: filters.last_contact_before
        },
        { field: 'created_at', direction: 'desc' },
        1,
        audience.max_recipients || 1000
      );

      let leads = result.leads;

      // Filter out leads without phone numbers
      leads = leads.filter(lead => lead.phone && lead.phone.trim().length > 0);

      // Filter out recent contacts if specified
      if (audience.exclude_recent_contacts) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        leads = leads.filter(lead => 
          !lead.last_contact_at || lead.last_contact_at < yesterday
        );
      }

      return leads;
    } catch (error) {
      console.error('Failed to find campaign recipients:', error);
      return [];
    }
  }

  /**
   * Create campaign recipient records
   */
  private async createCampaignRecipients(
    campaignId: string,
    leads: Lead[],
    personalizationRules: Record<string, string>,
    context: TenantContext
  ): Promise<WhatsAppCampaignRecipient[]> {
    try {
      const recipients = leads.map(lead => ({
        campaign_id: campaignId,
        phone_number: this.cleanPhoneNumber(lead.phone!),
        customer_id: null, // Leads don't have customer_id yet
        lead_id: lead.id,
        template_variables: this.buildTemplateVariables(lead, personalizationRules),
        status: 'pending' as const
      }));

      const { data, error } = await this.supabase
        .from('whatsapp_campaign_recipients')
        .insert(recipients)
        .select();

      if (error) {
        throw new Error(`Failed to create campaign recipients: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to create campaign recipients:', error);
      return [];
    }
  }

  /**
   * Send messages to campaign recipients
   */
  private async sendCampaignMessages(
    campaignId: string,
    context: TenantContext
  ): Promise<WhatsAppCampaignResult> {
    try {
      const campaign = await this.getCampaign(campaignId, context);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get pending recipients
      const { data: recipients, error } = await this.supabase
        .from('whatsapp_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to get campaign recipients: ${error.message}`);
      }

      if (!recipients || recipients.length === 0) {
        return {
          campaignId,
          totalRecipients: 0,
          successfulSends: 0,
          failedSends: 0,
          errors: []
        };
      }

      // Initialize WhatsApp service
      const whatsappService = new WhatsAppService({
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || ''
      });

      const result: WhatsAppCampaignResult = {
        campaignId,
        totalRecipients: recipients.length,
        successfulSends: 0,
        failedSends: 0,
        errors: []
      };

      // Send messages with rate limiting
      for (const recipient of recipients) {
        try {
          // Build template components with personalized variables
          const components = this.buildTemplateComponents(
            campaign.template,
            recipient.template_variables
          );

          // Send template message
          const sendResult = await whatsappService.sendTemplateMessage(
            recipient.phone_number,
            campaign.template.name,
            campaign.template.language,
            components,
            context
          );

          if (sendResult.success) {
            // Update recipient status
            await this.supabase
              .from('whatsapp_campaign_recipients')
              .update({
                status: 'sent',
                sent_at: new Date(),
                message_id: sendResult.messageId
              })
              .eq('id', recipient.id);

            result.successfulSends++;
          } else {
            // Update recipient with error
            await this.supabase
              .from('whatsapp_campaign_recipients')
              .update({
                status: 'failed',
                error_code: sendResult.errorCode,
                error_message: sendResult.error
              })
              .eq('id', recipient.id);

            result.failedSends++;
            result.errors.push({
              recipient: recipient.phone_number,
              error: sendResult.error || 'Unknown error'
            });
          }

          // Rate limiting - wait 100ms between messages
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          result.failedSends++;
          result.errors.push({
            recipient: recipient.phone_number,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          // Update recipient with error
          await this.supabase
            .from('whatsapp_campaign_recipients')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', recipient.id);
        }
      }

      // Mark campaign as completed if all messages processed
      if (result.successfulSends + result.failedSends === result.totalRecipients) {
        await this.supabase
          .from('whatsapp_campaigns')
          .update({
            status: 'completed',
            completed_at: new Date()
          })
          .eq('id', campaignId);
      }

      return result;
    } catch (error) {
      console.error('Failed to send campaign messages:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(
    campaignId: string,
    context: TenantContext
  ): Promise<CampaignPerformanceMetrics> {
    try {
      const campaign = await this.getCampaign(campaignId, context);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const deliveryRate = campaign.total_recipients > 0 
        ? (campaign.messages_delivered / campaign.total_recipients) * 100 
        : 0;

      const readRate = campaign.messages_delivered > 0 
        ? (campaign.messages_read / campaign.messages_delivered) * 100 
        : 0;

      const engagementRate = campaign.total_recipients > 0 
        ? (campaign.messages_read / campaign.total_recipients) * 100 
        : 0;

      // Estimate cost (this would be based on actual WhatsApp pricing)
      const costPerMessage = 0.05; // Example cost in USD
      const totalCost = campaign.messages_sent * costPerMessage;

      return {
        campaign_id: campaignId,
        total_recipients: campaign.total_recipients,
        messages_sent: campaign.messages_sent,
        messages_delivered: campaign.messages_delivered,
        messages_read: campaign.messages_read,
        messages_failed: campaign.messages_failed,
        delivery_rate: Math.round(deliveryRate * 100) / 100,
        read_rate: Math.round(readRate * 100) / 100,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        cost_per_message: costPerMessage,
        roi_estimate: 0, // Would need business logic to calculate ROI
        top_performing_segments: [] // Would need to analyze recipient segments
      };
    } catch (error) {
      console.error('Failed to get campaign metrics:', error);
      throw error;
    }
  }

  /**
   * Process automated campaigns based on triggers
   */
  async processAutomatedCampaigns(context: TenantContext): Promise<void> {
    try {
      // Get active automated campaigns
      const { data: campaigns, error } = await this.supabase
        .from('whatsapp_campaigns')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .eq('status', 'active')
        .contains('target_audience', { is_automated: true });

      if (error || !campaigns) {
        return;
      }

      for (const campaign of campaigns) {
        const trigger = campaign.target_audience.trigger as CampaignTrigger;
        
        if (trigger) {
          await this.processCampaignTrigger(campaign, trigger, context);
        }
      }
    } catch (error) {
      console.error('Failed to process automated campaigns:', error);
    }
  }

  /**
   * Process a specific campaign trigger
   */
  private async processCampaignTrigger(
    campaign: WhatsAppCampaign,
    trigger: CampaignTrigger,
    context: TenantContext
  ): Promise<void> {
    try {
      let eligibleLeads: Lead[] = [];

      switch (trigger.type) {
        case 'stage_change':
          eligibleLeads = await this.findLeadsWithStageChange(trigger, context);
          break;
        case 'time_based':
          eligibleLeads = await this.findLeadsForTimeTrigger(trigger, context);
          break;
        case 'score_change':
          eligibleLeads = await this.findLeadsWithScoreChange(trigger, context);
          break;
        case 'inactivity':
          eligibleLeads = await this.findInactiveLeads(trigger, context);
          break;
      }

      if (eligibleLeads.length > 0) {
        // Create a one-time campaign execution for these leads
        await this.executeTriggeredCampaign(campaign, eligibleLeads, context);
      }
    } catch (error) {
      console.error('Failed to process campaign trigger:', error);
    }
  }

  /**
   * Execute a triggered campaign for specific leads
   */
  private async executeTriggeredCampaign(
    campaign: WhatsAppCampaign,
    leads: Lead[],
    context: TenantContext
  ): Promise<void> {
    try {
      // Create recipients for this trigger execution
      const recipients = await this.createCampaignRecipients(
        campaign.id,
        leads,
        campaign.target_audience.personalization_rules || {},
        context
      );

      // Send messages with delay if specified
      const trigger = campaign.target_audience.trigger as CampaignTrigger;
      if (trigger.delay_minutes && trigger.delay_minutes > 0) {
        // Schedule for later execution (would need a job queue in production)
        setTimeout(async () => {
          await this.sendCampaignMessages(campaign.id, context);
        }, trigger.delay_minutes * 60 * 1000);
      } else {
        // Send immediately
        await this.sendCampaignMessages(campaign.id, context);
      }
    } catch (error) {
      console.error('Failed to execute triggered campaign:', error);
    }
  }

  /**
   * Helper methods for finding leads based on different trigger types
   */
  private async findLeadsWithStageChange(
    trigger: CampaignTrigger,
    context: TenantContext
  ): Promise<Lead[]> {
    // This would query lead_stage_history to find recent stage changes
    // For now, return empty array - would need more complex query
    return [];
  }

  private async findLeadsForTimeTrigger(
    trigger: CampaignTrigger,
    context: TenantContext
  ): Promise<Lead[]> {
    // This would find leads based on time-based conditions
    return [];
  }

  private async findLeadsWithScoreChange(
    trigger: CampaignTrigger,
    context: TenantContext
  ): Promise<Lead[]> {
    // This would find leads that recently crossed score thresholds
    return [];
  }

  private async findInactiveLeads(
    trigger: CampaignTrigger,
    context: TenantContext
  ): Promise<Lead[]> {
    if (!trigger.conditions.days_since_last_contact) {
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - trigger.conditions.days_since_last_contact);

    const result = await crmService.getLeads(
      context.tenant_id,
      {
        last_contact_before: cutoffDate,
        status: trigger.conditions.lead_status
      },
      { field: 'last_contact_at', direction: 'asc' },
      1,
      100
    );

    return result.leads;
  }

  /**
   * Utility methods
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming Brazil +55)
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return '55' + cleaned;
    }
    
    return cleaned;
  }

  private buildTemplateVariables(
    lead: Lead,
    personalizationRules: Record<string, string>
  ): Record<string, any> {
    const variables: Record<string, any> = {};

    // Default mappings
    variables.first_name = lead.first_name;
    variables.last_name = lead.last_name;
    variables.full_name = `${lead.first_name} ${lead.last_name}`;
    variables.company = lead.company || '';
    variables.email = lead.email || '';

    // Apply custom personalization rules
    for (const [templateVar, leadField] of Object.entries(personalizationRules)) {
      if (leadField.startsWith('custom_fields.')) {
        const fieldName = leadField.replace('custom_fields.', '');
        variables[templateVar] = lead.custom_fields[fieldName] || '';
      } else {
        variables[templateVar] = (lead as any)[leadField] || '';
      }
    }

    return variables;
  }

  private buildTemplateComponents(
    template: any,
    variables: Record<string, any>
  ): any[] {
    const components = [];

    // Build body component with variable substitution
    if (template.body) {
      const bodyComponent = {
        type: 'body',
        parameters: []
      };

      // Extract variables from template body and replace with actual values
      const bodyText = template.body.text || '';
      const variableMatches = bodyText.match(/\{\{(\w+)\}\}/g);
      
      if (variableMatches) {
        for (const match of variableMatches) {
          const varName = match.replace(/\{\{|\}\}/g, '');
          bodyComponent.parameters.push({
            type: 'text',
            text: variables[varName] || ''
          });
        }
      }

      if (bodyComponent.parameters.length > 0) {
        components.push(bodyComponent);
      }
    }

    return components;
  }
}

// Export singleton instance
export const whatsappCampaignService = new WhatsAppCampaignService();