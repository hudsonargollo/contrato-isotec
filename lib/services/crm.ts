/**
 * CRM Service Layer
 * Business logic for lead management, pipeline stages, and interactions
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Enhanced CRM Pipeline Management
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFilters,
  LeadSortOptions,
  PaginatedLeads,
  LeadSource,
  CreateLeadSourceRequest,
  PipelineStage,
  CreatePipelineStageRequest,
  LeadInteraction,
  CreateInteractionRequest,
  InteractionFilters,
  PaginatedInteractions,
  InteractionType,
  LeadScoringRule,
  CreateScoringRuleRequest,
  LeadStageHistory,
  PipelineAnalytics,
  LeadPerformanceMetrics,
  BulkLeadOperation,
  BulkOperationResult
} from '@/lib/types/crm';

export class CRMService {
  private supabase = createClient();

  // Lead Management
  async createLead(tenantId: string, data: CreateLeadRequest): Promise<Lead> {
    const { data: lead, error } = await this.supabase
      .from('leads')
      .insert({
        tenant_id: tenantId,
        ...data,
        created_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        source:lead_sources(*),
        stage:pipeline_stages(*),
        assigned_user:profiles!assigned_to(id, email, full_name)
      `)
      .single();

    if (error) throw error;
    
    const transformedLead = this.transformLead(lead);
    
    // Send webhook notification
    try {
      const { WebhookEvents } = await import('./webhook');
      await WebhookEvents.leadCreated(tenantId, transformedLead);
    } catch (webhookError) {
      console.error('Failed to send lead created webhook:', webhookError);
      // Don't fail the operation if webhook fails
    }
    
    return transformedLead;
  }

  async updateLead(leadId: string, data: UpdateLeadRequest): Promise<Lead> {
    // Get the current lead for comparison
    const { data: currentLead } = await this.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    const { data: lead, error } = await this.supabase
      .from('leads')
      .update(data)
      .eq('id', leadId)
      .select(`
        *,
        source:lead_sources(*),
        stage:pipeline_stages(*),
        assigned_user:profiles!assigned_to(id, email, full_name)
      `)
      .single();

    if (error) throw error;
    
    const transformedLead = this.transformLead(lead);
    
    // Send webhook notifications
    try {
      const { WebhookEvents } = await import('./webhook');
      await WebhookEvents.leadUpdated(lead.tenant_id, transformedLead, data);
      
      // Check if status changed
      if (currentLead && currentLead.status !== lead.status) {
        await WebhookEvents.leadStatusChanged(
          lead.tenant_id, 
          transformedLead, 
          currentLead.status, 
          lead.status
        );
      }
    } catch (webhookError) {
      console.error('Failed to send lead updated webhook:', webhookError);
      // Don't fail the operation if webhook fails
    }
    
    return transformedLead;
  }

  async getLead(leadId: string): Promise<Lead | null> {
    const { data: lead, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        source:lead_sources(*),
        stage:pipeline_stages(*),
        assigned_user:profiles!assigned_to(id, email, full_name),
        interactions_count:lead_interactions(count),
        latest_interaction:lead_interactions(
          id, type_id, channel, subject, content, direction, 
          interaction_date, created_at,
          type:interaction_types(name, icon, color)
        )
      `)
      .eq('id', leadId)
      .order('interaction_date', { 
        referencedTable: 'lead_interactions', 
        ascending: false 
      })
      .limit(1, { referencedTable: 'lead_interactions' })
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.transformLead(lead);
  }

  async getLeads(
    tenantId: string,
    filters: LeadFilters = {},
    sort: LeadSortOptions = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedLeads> {
    let query = this.supabase
      .from('leads')
      .select(`
        *,
        source:lead_sources(*),
        stage:pipeline_stages(*),
        assigned_user:profiles!assigned_to(id, email, full_name),
        interactions_count:lead_interactions(count)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.stage_id?.length) {
      query = query.in('stage_id', filters.stage_id);
    }
    if (filters.source_id?.length) {
      query = query.in('source_id', filters.source_id);
    }
    if (filters.assigned_to?.length) {
      query = query.in('assigned_to', filters.assigned_to);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.score_min !== undefined) {
      query = query.gte('score', filters.score_min);
    }
    if (filters.score_max !== undefined) {
      query = query.lte('score', filters.score_max);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString());
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString());
    }
    if (filters.last_contact_after) {
      query = query.gte('last_contact_at', filters.last_contact_after.toISOString());
    }
    if (filters.last_contact_before) {
      query = query.lte('last_contact_at', filters.last_contact_before.toISOString());
    }

    // Apply search
    if (filters.search_query) {
      const searchFields = filters.search_fields || ['first_name', 'last_name', 'email', 'company'];
      const searchConditions = searchFields.map(field => 
        `${field}.ilike.%${filters.search_query}%`
      ).join(',');
      query = query.or(searchConditions);
    }

    // Apply tags filter
    if (filters.tags?.length) {
      query = query.contains('tags', filters.tags);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) throw error;

    return {
      leads: leads?.map(this.transformLead) || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
      filters,
      sort
    };
  }
  async deleteLead(leadId: string): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
  }

  async updateLeadStage(
    leadId: string, 
    stageId: string, 
    reason?: string, 
    notes?: string
  ): Promise<void> {
    const { error } = await this.supabase.rpc('update_lead_stage', {
      lead_id_param: leadId,
      new_stage_id_param: stageId,
      reason_param: reason,
      notes_param: notes
    });

    if (error) throw error;
  }

  async calculateLeadScore(leadId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('calculate_lead_score', {
      lead_id_param: leadId
    });

    if (error) throw error;
    return data || 0;
  }

  // Lead Sources Management
  async createLeadSource(tenantId: string, data: CreateLeadSourceRequest): Promise<LeadSource> {
    const { data: source, error } = await this.supabase
      .from('lead_sources')
      .insert({
        tenant_id: tenantId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return source;
  }

  async getLeadSources(tenantId: string, activeOnly: boolean = true): Promise<LeadSource[]> {
    let query = this.supabase
      .from('lead_sources')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: sources, error } = await query;

    if (error) throw error;
    return sources || [];
  }

  async updateLeadSource(sourceId: string, data: Partial<CreateLeadSourceRequest>): Promise<LeadSource> {
    const { data: source, error } = await this.supabase
      .from('lead_sources')
      .update(data)
      .eq('id', sourceId)
      .select()
      .single();

    if (error) throw error;
    return source;
  }

  async deleteLeadSource(sourceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('lead_sources')
      .delete()
      .eq('id', sourceId);

    if (error) throw error;
  }

  // Pipeline Stages Management
  async createPipelineStage(tenantId: string, data: CreatePipelineStageRequest): Promise<PipelineStage> {
    const { data: stage, error } = await this.supabase
      .from('pipeline_stages')
      .insert({
        tenant_id: tenantId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return stage;
  }

  async getPipelineStages(tenantId: string, activeOnly: boolean = true): Promise<PipelineStage[]> {
    let query = this.supabase
      .from('pipeline_stages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('stage_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: stages, error } = await query;

    if (error) throw error;
    return stages || [];
  }

  async updatePipelineStage(stageId: string, data: Partial<CreatePipelineStageRequest>): Promise<PipelineStage> {
    const { data: stage, error } = await this.supabase
      .from('pipeline_stages')
      .update(data)
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;
    return stage;
  }

  async deletePipelineStage(stageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  }
  // Interaction Management
  async createInteraction(tenantId: string, data: CreateInteractionRequest): Promise<LeadInteraction> {
    const { data: interactionId, error } = await this.supabase.rpc('create_lead_interaction', {
      lead_id_param: data.lead_id,
      type_id_param: data.type_id,
      channel_param: data.channel,
      subject_param: data.subject,
      content_param: data.content,
      direction_param: data.direction || 'outbound',
      metadata_param: data.metadata || {}
    });

    if (error) throw error;

    // Fetch the created interaction with related data
    const { data: interaction, error: fetchError } = await this.supabase
      .from('lead_interactions')
      .select(`
        *,
        type:interaction_types(*),
        created_by_user:profiles!created_by(id, email, full_name),
        lead:leads(id, first_name, last_name, email)
      `)
      .eq('id', interactionId)
      .single();

    if (fetchError) throw fetchError;
    return this.transformInteraction(interaction);
  }

  async getInteractions(
    tenantId: string,
    filters: InteractionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedInteractions> {
    let query = this.supabase
      .from('lead_interactions')
      .select(`
        *,
        type:interaction_types(*),
        created_by_user:profiles!created_by(id, email, full_name),
        lead:leads(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters.type_id?.length) {
      query = query.in('type_id', filters.type_id);
    }
    if (filters.channel?.length) {
      query = query.in('channel', filters.channel);
    }
    if (filters.direction?.length) {
      query = query.in('direction', filters.direction);
    }
    if (filters.created_by?.length) {
      query = query.in('created_by', filters.created_by);
    }
    if (filters.date_after) {
      query = query.gte('interaction_date', filters.date_after.toISOString());
    }
    if (filters.date_before) {
      query = query.lte('interaction_date', filters.date_before.toISOString());
    }
    if (filters.search_query) {
      query = query.or(`subject.ilike.%${filters.search_query}%,content.ilike.%${filters.search_query}%`);
    }

    // Apply sorting and pagination
    query = query.order('interaction_date', { ascending: false });
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: interactions, error, count } = await query;

    if (error) throw error;

    return {
      interactions: interactions?.map(this.transformInteraction) || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
      filters
    };
  }

  async getLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
    const { data: interactions, error } = await this.supabase
      .from('lead_interactions')
      .select(`
        *,
        type:interaction_types(*),
        created_by_user:profiles!created_by(id, email, full_name)
      `)
      .eq('lead_id', leadId)
      .order('interaction_date', { ascending: false });

    if (error) throw error;
    return interactions?.map(this.transformInteraction) || [];
  }

  // Interaction Types Management
  async getInteractionTypes(tenantId: string, activeOnly: boolean = true): Promise<InteractionType[]> {
    let query = this.supabase
      .from('interaction_types')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: types, error } = await query;

    if (error) throw error;
    return types || [];
  }

  // Lead Scoring Rules Management
  async createScoringRule(tenantId: string, data: CreateScoringRuleRequest): Promise<LeadScoringRule> {
    const { data: rule, error } = await this.supabase
      .from('lead_scoring_rules')
      .insert({
        tenant_id: tenantId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return rule;
  }

  async getScoringRules(tenantId: string, activeOnly: boolean = true): Promise<LeadScoringRule[]> {
    let query = this.supabase
      .from('lead_scoring_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('rule_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: rules, error } = await query;

    if (error) throw error;
    return rules || [];
  }

  async updateScoringRule(ruleId: string, data: Partial<CreateScoringRuleRequest>): Promise<LeadScoringRule> {
    const { data: rule, error } = await this.supabase
      .from('lead_scoring_rules')
      .update(data)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return rule;
  }

  async deleteScoringRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('lead_scoring_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }
  // Lead Stage History
  async getLeadStageHistory(leadId: string): Promise<LeadStageHistory[]> {
    const { data: history, error } = await this.supabase
      .from('lead_stage_history')
      .select(`
        *,
        from_stage:pipeline_stages!from_stage_id(*),
        to_stage:pipeline_stages!to_stage_id(*),
        changed_by_user:profiles!changed_by(id, email, full_name)
      `)
      .eq('lead_id', leadId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return history || [];
  }

  // Analytics and Reporting
  async getPipelineAnalytics(tenantId: string): Promise<PipelineAnalytics> {
    // Get total leads
    const { count: totalLeads } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get leads by stage
    const { data: leadsByStage } = await this.supabase
      .from('pipeline_stages')
      .select(`
        id,
        name,
        stage_order,
        conversion_probability,
        leads:leads(count)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('stage_order');

    // Get leads by source
    const { data: leadsBySource } = await this.supabase
      .from('lead_sources')
      .select(`
        id,
        name,
        leads:leads(count)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    // Get leads by status
    const { data: leadsByStatus } = await this.supabase
      .from('leads')
      .select('status')
      .eq('tenant_id', tenantId);

    // Process status counts
    const statusCounts = leadsByStatus?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as any,
      lead_count: count,
      percentage: totalLeads ? (count / totalLeads) * 100 : 0
    }));

    return {
      total_leads: totalLeads || 0,
      leads_by_stage: leadsByStage?.map(stage => ({
        stage_id: stage.id,
        stage_name: stage.name,
        stage_order: stage.stage_order,
        lead_count: stage.leads?.[0]?.count || 0,
        conversion_probability: stage.conversion_probability,
        avg_time_in_stage: '0 days' // TODO: Calculate from stage history
      })) || [],
      leads_by_source: leadsBySource?.map(source => ({
        source_id: source.id,
        source_name: source.name,
        lead_count: source.leads?.[0]?.count || 0,
        conversion_rate: 0 // TODO: Calculate conversion rate
      })) || [],
      leads_by_status: statusData,
      conversion_funnel: [] // TODO: Calculate conversion funnel
    };
  }

  async getLeadPerformanceMetrics(tenantId: string): Promise<LeadPerformanceMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get basic counts
    const { count: totalLeads } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { count: newLeadsThisMonth } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', startOfMonth.toISOString());

    const { count: qualifiedLeads } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'qualified');

    const { count: closedWon } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'closed_won');

    const { count: closedLost } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'closed_lost');

    // Get average score
    const { data: scoreData } = await this.supabase
      .from('leads')
      .select('score')
      .eq('tenant_id', tenantId);

    const avgScore = scoreData?.length 
      ? scoreData.reduce((sum, lead) => sum + lead.score, 0) / scoreData.length 
      : 0;

    const conversionRate = totalLeads ? ((closedWon || 0) / totalLeads) * 100 : 0;

    return {
      total_leads: totalLeads || 0,
      new_leads_this_month: newLeadsThisMonth || 0,
      qualified_leads: qualifiedLeads || 0,
      closed_won: closedWon || 0,
      closed_lost: closedLost || 0,
      avg_lead_score: Math.round(avgScore),
      avg_time_to_close: '0 days', // TODO: Calculate from stage history
      conversion_rate: Math.round(conversionRate * 100) / 100,
      top_performing_sources: [], // TODO: Calculate from source data
      user_performance: [] // TODO: Calculate user performance metrics
    };
  }
  // Bulk Operations
  async bulkUpdateLeads(operation: BulkLeadOperation): Promise<BulkOperationResult> {
    const results: BulkOperationResult = {
      success_count: 0,
      error_count: 0,
      errors: []
    };

    for (const leadId of operation.lead_ids) {
      try {
        switch (operation.operation) {
          case 'assign':
            await this.updateLead(leadId, { assigned_to: operation.data.assigned_to });
            break;
          case 'update_stage':
            await this.updateLeadStage(leadId, operation.data.stage_id, operation.data.reason);
            break;
          case 'update_status':
            await this.updateLead(leadId, { status: operation.data.status });
            break;
          case 'add_tags':
            const lead = await this.getLead(leadId);
            if (lead) {
              const newTags = [...new Set([...lead.tags, ...operation.data.tags])];
              await this.updateLead(leadId, { tags: newTags });
            }
            break;
          case 'remove_tags':
            const leadForRemoval = await this.getLead(leadId);
            if (leadForRemoval) {
              const filteredTags = leadForRemoval.tags.filter(tag => !operation.data.tags.includes(tag));
              await this.updateLead(leadId, { tags: filteredTags });
            }
            break;
        }
        results.success_count++;
      } catch (error) {
        results.error_count++;
        results.errors.push({
          lead_id: leadId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Utility Methods
  private transformLead(lead: any): Lead {
    return {
      ...lead,
      tags: lead.tags || [],
      custom_fields: lead.custom_fields || {},
      created_at: new Date(lead.created_at),
      updated_at: new Date(lead.updated_at),
      last_contact_at: lead.last_contact_at ? new Date(lead.last_contact_at) : undefined,
      next_follow_up_at: lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : undefined,
      interactions_count: lead.interactions_count?.[0]?.count || 0,
      latest_interaction: lead.latest_interaction?.[0] ? this.transformInteraction(lead.latest_interaction[0]) : undefined
    };
  }

  private transformInteraction(interaction: any): LeadInteraction {
    return {
      ...interaction,
      metadata: interaction.metadata || {},
      attachments: interaction.attachments || [],
      interaction_date: new Date(interaction.interaction_date),
      created_at: new Date(interaction.created_at)
    };
  }

  // Lead Assignment and Routing
  async assignLead(leadId: string, userId: string, reason?: string): Promise<void> {
    await this.updateLead(leadId, { assigned_to: userId });
    
    // Create interaction record for assignment
    const lead = await this.getLead(leadId);
    if (lead) {
      await this.createInteraction(lead.tenant_id, {
        lead_id: leadId,
        channel: 'manual',
        content: `Lead assigned to user ${userId}${reason ? `. Reason: ${reason}` : ''}`,
        direction: 'outbound'
      });
    }
  }

  async unassignLead(leadId: string, reason?: string): Promise<void> {
    await this.updateLead(leadId, { assigned_to: undefined });
    
    // Create interaction record for unassignment
    const lead = await this.getLead(leadId);
    if (lead) {
      await this.createInteraction(lead.tenant_id, {
        lead_id: leadId,
        channel: 'manual',
        content: `Lead unassigned${reason ? `. Reason: ${reason}` : ''}`,
        direction: 'outbound'
      });
    }
  }

  // Lead Qualification
  async qualifyLead(leadId: string, qualificationNotes?: string): Promise<void> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error('Lead not found');

    // Find qualified stage
    const stages = await this.getPipelineStages(lead.tenant_id);
    const qualifiedStage = stages.find(stage => 
      stage.name.toLowerCase().includes('qualified') || 
      stage.stage_order === 3
    );

    if (qualifiedStage) {
      await this.updateLeadStage(leadId, qualifiedStage.id, 'Lead qualified', qualificationNotes);
    }

    await this.updateLead(leadId, { status: 'qualified' });
  }

  async disqualifyLead(leadId: string, reason?: string): Promise<void> {
    await this.updateLead(leadId, { status: 'closed_lost' });
    
    const lead = await this.getLead(leadId);
    if (lead) {
      await this.createInteraction(lead.tenant_id, {
        lead_id: leadId,
        channel: 'manual',
        content: `Lead disqualified${reason ? `. Reason: ${reason}` : ''}`,
        direction: 'outbound'
      });
    }
  }
}

// Export singleton instance
export const crmService = new CRMService();