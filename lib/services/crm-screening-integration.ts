/**
 * CRM-Screening Integration Service
 * Handles the integration between screening results and CRM pipeline
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

import { createClient } from '@/lib/supabase/client';
import type { Lead, CreateLeadRequest, UpdateLeadRequest } from '@/lib/types/crm';
import type { EnhancedScreeningResult } from '@/lib/types/screening';
import { crmService } from './crm';
import { screeningService } from './screening';

// Integration-specific types
export interface ScreeningQualificationRule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  min_screening_score?: number;
  required_feasibility?: string[];
  max_risk_level?: string;
  required_qualification?: string[];
  auto_assign_stage_id?: string;
  auto_assign_status?: string;
  auto_assign_priority?: string;
  auto_assign_user_id?: string;
  is_active: boolean;
  rule_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateQualificationRuleRequest {
  name: string;
  description?: string;
  min_screening_score?: number;
  required_feasibility?: string[];
  max_risk_level?: string;
  required_qualification?: string[];
  auto_assign_stage_id?: string;
  auto_assign_status?: string;
  auto_assign_priority?: string;
  auto_assign_user_id?: string;
  is_active?: boolean;
  rule_order?: number;
}

export interface ScreeningAnalyticsReport {
  id: string;
  tenant_id: string;
  report_name: string;
  report_type: 'screening_performance' | 'lead_conversion' | 'qualification_analysis' | 'pipeline_impact';
  date_range: {
    start_date: Date;
    end_date: Date;
  };
  filters: Record<string, any>;
  screening_metrics: Record<string, any>;
  crm_metrics: Record<string, any>;
  conversion_metrics: Record<string, any>;
  generated_by: string;
  generated_at: Date;
  expires_at?: Date;
}

export interface LeadWithScreening extends Lead {
  screening_result_id?: string;
  screening_score?: number;
  screening_qualification?: 'qualified' | 'partially_qualified' | 'not_qualified';
  screening_feasibility?: 'high' | 'medium' | 'low' | 'not_feasible';
  screening_risk_level?: 'low' | 'medium' | 'high' | 'critical';
  screening_completed_at?: Date;
  screening_result?: EnhancedScreeningResult;
}

export class CRMScreeningIntegrationService {
  private supabase = createClient();

  // Lead Management with Screening Integration
  async createLeadFromScreening(
    tenantId: string,
    screeningResult: EnhancedScreeningResult,
    leadData: CreateLeadRequest
  ): Promise<LeadWithScreening> {
    // Create the lead first
    const lead = await crmService.createLead(tenantId, leadData);

    // Update screening result with lead reference
    await this.supabase
      .from('screening_results')
      .update({ lead_id: lead.id })
      .eq('id', screeningResult.id);

    // The trigger will automatically update the lead with screening data
    // Fetch the updated lead with screening information
    return this.getLeadWithScreening(lead.id);
  }

  async getLeadWithScreening(leadId: string): Promise<LeadWithScreening | null> {
    const { data: lead, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        source:lead_sources(*),
        stage:pipeline_stages(*),
        assigned_user:profiles!assigned_to(id, email, full_name),
        screening_result:screening_results!screening_result_id(*)
      `)
      .eq('id', leadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.transformLeadWithScreening(lead);
  }

  async getLeadsWithScreening(
    tenantId: string,
    filters: {
      screening_qualification?: string[];
      screening_feasibility?: string[];
      screening_risk_level?: string[];
      min_screening_score?: number;
      max_screening_score?: number;
      screening_completed_after?: Date;
      screening_completed_before?: Date;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    leads: LeadWithScreening[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    let query = this.supabase
      .from('leads')
      .select(`
        *,
        source:lead_sources(*),
        stage:pipeline_stages(*),
        assigned_user:profiles!assigned_to(id, email, full_name),
        screening_result:screening_results!screening_result_id(*)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .not('screening_result_id', 'is', null); // Only leads with screening results

    // Apply screening-specific filters
    if (filters.screening_qualification?.length) {
      query = query.in('screening_qualification', filters.screening_qualification);
    }
    if (filters.screening_feasibility?.length) {
      query = query.in('screening_feasibility', filters.screening_feasibility);
    }
    if (filters.screening_risk_level?.length) {
      query = query.in('screening_risk_level', filters.screening_risk_level);
    }
    if (filters.min_screening_score !== undefined) {
      query = query.gte('screening_score', filters.min_screening_score);
    }
    if (filters.max_screening_score !== undefined) {
      query = query.lte('screening_score', filters.max_screening_score);
    }
    if (filters.screening_completed_after) {
      query = query.gte('screening_completed_at', filters.screening_completed_after.toISOString());
    }
    if (filters.screening_completed_before) {
      query = query.lte('screening_completed_at', filters.screening_completed_before.toISOString());
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    query = query.order('screening_completed_at', { ascending: false });

    const { data: leads, error, count } = await query;

    if (error) throw error;

    return {
      leads: leads?.map(this.transformLeadWithScreening) || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }
  // Qualification Rules Management
  async createQualificationRule(
    tenantId: string,
    data: CreateQualificationRuleRequest
  ): Promise<ScreeningQualificationRule> {
    const { data: rule, error } = await this.supabase
      .from('screening_lead_qualification_rules')
      .insert({
        tenant_id: tenantId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformQualificationRule(rule);
  }

  async getQualificationRules(
    tenantId: string,
    activeOnly: boolean = true
  ): Promise<ScreeningQualificationRule[]> {
    let query = this.supabase
      .from('screening_lead_qualification_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('rule_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: rules, error } = await query;

    if (error) throw error;
    return rules?.map(this.transformQualificationRule) || [];
  }

  async updateQualificationRule(
    ruleId: string,
    data: Partial<CreateQualificationRuleRequest>
  ): Promise<ScreeningQualificationRule> {
    const { data: rule, error } = await this.supabase
      .from('screening_lead_qualification_rules')
      .update(data)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return this.transformQualificationRule(rule);
  }

  async deleteQualificationRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('screening_lead_qualification_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }

  // Manual Lead Qualification Based on Screening
  async qualifyLeadFromScreening(
    leadId: string,
    overrideQualification?: 'qualified' | 'partially_qualified' | 'not_qualified',
    notes?: string
  ): Promise<LeadWithScreening> {
    const lead = await this.getLeadWithScreening(leadId);
    if (!lead) throw new Error('Lead not found');

    if (!lead.screening_result) {
      throw new Error('Lead has no screening result');
    }

    // Determine qualification level
    const qualificationLevel = overrideQualification || lead.screening_qualification;
    
    // Update lead based on qualification
    let updateData: UpdateLeadRequest = {};
    
    if (qualificationLevel === 'qualified') {
      // Find qualified stage
      const stages = await crmService.getPipelineStages(lead.tenant_id);
      const qualifiedStage = stages.find(stage => 
        stage.name.toLowerCase().includes('qualified') || 
        stage.stage_order === 3
      );
      
      if (qualifiedStage) {
        updateData.stage_id = qualifiedStage.id;
      }
      updateData.status = 'qualified';
      updateData.priority = lead.screening_feasibility === 'high' ? 'high' : 'medium';
    } else if (qualificationLevel === 'partially_qualified') {
      updateData.status = 'contacted';
      updateData.priority = 'medium';
    } else {
      updateData.status = 'closed_lost';
      updateData.priority = 'low';
    }

    // Update the lead
    await crmService.updateLead(leadId, updateData);

    // Create interaction record
    await crmService.createInteraction(lead.tenant_id, {
      lead_id: leadId,
      channel: 'manual',
      content: `Lead ${qualificationLevel} based on screening results. Score: ${lead.screening_score}%, Feasibility: ${lead.screening_feasibility}, Risk: ${lead.screening_risk_level}${notes ? `. Notes: ${notes}` : ''}`,
      direction: 'outbound',
      metadata: {
        screening_result_id: lead.screening_result_id,
        screening_score: lead.screening_score,
        qualification_level: qualificationLevel,
        feasibility_rating: lead.screening_feasibility,
        risk_level: lead.screening_risk_level,
        manual_override: !!overrideQualification
      }
    });

    return this.getLeadWithScreening(leadId);
  }

  // Analytics and Reporting
  async generateScreeningCRMReport(
    tenantId: string,
    reportType: 'screening_performance' | 'lead_conversion' | 'qualification_analysis' | 'pipeline_impact',
    startDate: Date,
    endDate: Date,
    reportName?: string
  ): Promise<ScreeningAnalyticsReport> {
    const { data: reportData, error } = await this.supabase
      .rpc('generate_screening_crm_analytics', {
        tenant_id_param: tenantId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        report_type: reportType
      });

    if (error) throw error;

    // Save the report
    const { data: savedReport, error: saveError } = await this.supabase
      .from('screening_analytics_reports')
      .insert({
        tenant_id: tenantId,
        report_name: reportName || `${reportType}_${new Date().toISOString().split('T')[0]}`,
        report_type: reportType,
        date_range: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        screening_metrics: reportData.screening_metrics || {},
        crm_metrics: reportData.crm_metrics || {},
        conversion_metrics: reportData.conversion_metrics || {},
        generated_by: (await this.supabase.auth.getUser()).data.user?.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return this.transformAnalyticsReport(savedReport);
  }

  async getScreeningCRMReports(
    tenantId: string,
    reportType?: string
  ): Promise<ScreeningAnalyticsReport[]> {
    let query = this.supabase
      .from('screening_analytics_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('generated_at', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data: reports, error } = await query;

    if (error) throw error;
    return reports?.map(this.transformAnalyticsReport) || [];
  }

  // Screening-based Lead Scoring Enhancement
  async enhanceLeadScoreWithScreening(leadId: string): Promise<number> {
    const lead = await this.getLeadWithScreening(leadId);
    if (!lead || !lead.screening_result) {
      return await crmService.calculateLeadScore(leadId);
    }

    // Calculate enhanced score combining CRM score and screening score
    const baseScore = await crmService.calculateLeadScore(leadId);
    const screeningScore = lead.screening_score || 0;
    
    // Weight: 60% CRM score, 40% screening score
    const enhancedScore = Math.round((baseScore * 0.6) + (screeningScore * 0.4));
    
    // Update lead with enhanced score
    await crmService.updateLead(leadId, { score: enhancedScore });
    
    return enhancedScore;
  }

  // Bulk Operations for Screened Leads
  async bulkQualifyScreenedLeads(
    tenantId: string,
    criteria: {
      min_screening_score?: number;
      required_feasibility?: string[];
      max_risk_level?: string;
    }
  ): Promise<{
    qualified_count: number;
    partially_qualified_count: number;
    not_qualified_count: number;
    errors: Array<{ lead_id: string; error: string }>;
  }> {
    const result = {
      qualified_count: 0,
      partially_qualified_count: 0,
      not_qualified_count: 0,
      errors: [] as Array<{ lead_id: string; error: string }>
    };

    // Get leads matching criteria
    const { leads } = await this.getLeadsWithScreening(tenantId, criteria, 1, 1000);

    for (const lead of leads) {
      try {
        if (lead.screening_qualification === 'qualified') {
          await this.qualifyLeadFromScreening(lead.id, 'qualified', 'Bulk qualification based on screening criteria');
          result.qualified_count++;
        } else if (lead.screening_qualification === 'partially_qualified') {
          await this.qualifyLeadFromScreening(lead.id, 'partially_qualified', 'Bulk qualification based on screening criteria');
          result.partially_qualified_count++;
        } else {
          await this.qualifyLeadFromScreening(lead.id, 'not_qualified', 'Bulk qualification based on screening criteria');
          result.not_qualified_count++;
        }
      } catch (error) {
        result.errors.push({
          lead_id: lead.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }
  // Utility Methods
  private transformLeadWithScreening(lead: any): LeadWithScreening {
    return {
      ...lead,
      tags: lead.tags || [],
      custom_fields: lead.custom_fields || {},
      created_at: new Date(lead.created_at),
      updated_at: new Date(lead.updated_at),
      last_contact_at: lead.last_contact_at ? new Date(lead.last_contact_at) : undefined,
      next_follow_up_at: lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : undefined,
      screening_completed_at: lead.screening_completed_at ? new Date(lead.screening_completed_at) : undefined,
      screening_result: lead.screening_result ? {
        ...lead.screening_result,
        created_at: new Date(lead.screening_result.created_at),
        updated_at: new Date(lead.screening_result.updated_at),
        calculation_metadata: {
          ...lead.screening_result.calculation_metadata,
          calculated_at: new Date(lead.screening_result.calculation_metadata.calculated_at)
        }
      } : undefined
    };
  }

  private transformQualificationRule(rule: any): ScreeningQualificationRule {
    return {
      ...rule,
      created_at: new Date(rule.created_at),
      updated_at: new Date(rule.updated_at)
    };
  }

  private transformAnalyticsReport(report: any): ScreeningAnalyticsReport {
    return {
      ...report,
      date_range: {
        start_date: new Date(report.date_range.start_date),
        end_date: new Date(report.date_range.end_date)
      },
      generated_at: new Date(report.generated_at),
      expires_at: report.expires_at ? new Date(report.expires_at) : undefined
    };
  }

  // Integration Workflow Methods
  async processQuestionnaireToLead(
    tenantId: string,
    questionnaireResponseId: string,
    leadData: Partial<CreateLeadRequest>
  ): Promise<LeadWithScreening> {
    // Get questionnaire response
    const { data: response, error: responseError } = await this.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('id', questionnaireResponseId)
      .single();

    if (responseError) throw responseError;

    // Process screening if not already done
    let screeningResult: EnhancedScreeningResult;
    
    const { data: existingResult, error: existingError } = await this.supabase
      .from('screening_results')
      .select('*')
      .eq('response_id', questionnaireResponseId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingResult) {
      screeningResult = existingResult;
    } else {
      // Process screening
      screeningResult = await screeningService.processScreening(
        tenantId,
        response
      );
    }

    // Extract lead information from questionnaire responses
    const extractedLeadData = this.extractLeadDataFromResponses(response.responses);
    
    // Merge with provided lead data
    const finalLeadData: CreateLeadRequest = {
      first_name: leadData.first_name || extractedLeadData.first_name || 'Unknown',
      last_name: leadData.last_name || extractedLeadData.last_name || 'Prospect',
      email: leadData.email || extractedLeadData.email,
      phone: leadData.phone || extractedLeadData.phone,
      company: leadData.company || extractedLeadData.company,
      source_id: leadData.source_id,
      notes: leadData.notes || `Lead created from questionnaire response. Screening score: ${screeningResult.percentage_score}%`,
      custom_fields: {
        ...extractedLeadData.custom_fields,
        ...leadData.custom_fields,
        questionnaire_response_id: questionnaireResponseId,
        screening_result_id: screeningResult.id
      }
    };

    // Create lead with screening integration
    return this.createLeadFromScreening(tenantId, screeningResult, finalLeadData);
  }

  private extractLeadDataFromResponses(responses: Record<string, any>): Partial<CreateLeadRequest> {
    const leadData: Partial<CreateLeadRequest> = {
      custom_fields: {}
    };

    // Common field mappings
    const fieldMappings = {
      'first_name': ['first_name', 'firstName', 'nome', 'name'],
      'last_name': ['last_name', 'lastName', 'sobrenome', 'surname'],
      'email': ['email', 'e-mail', 'email_address'],
      'phone': ['phone', 'telefone', 'phone_number', 'mobile'],
      'company': ['company', 'empresa', 'company_name', 'organization']
    };

    // Extract standard fields
    for (const [leadField, possibleKeys] of Object.entries(fieldMappings)) {
      for (const key of possibleKeys) {
        if (responses[key] && typeof responses[key] === 'string') {
          (leadData as any)[leadField] = responses[key];
          break;
        }
      }
    }

    // Store all other responses as custom fields
    for (const [key, value] of Object.entries(responses)) {
      if (!Object.values(fieldMappings).flat().includes(key)) {
        leadData.custom_fields![key] = value;
      }
    }

    return leadData;
  }

  // Pipeline Integration Methods
  async getScreeningPipelineAnalytics(tenantId: string): Promise<{
    stages_with_screening: Array<{
      stage_id: string;
      stage_name: string;
      total_leads: number;
      screened_leads: number;
      screening_percentage: number;
      avg_screening_score: number;
      qualification_distribution: Record<string, number>;
    }>;
    screening_impact_on_conversion: {
      screened_conversion_rate: number;
      unscreened_conversion_rate: number;
      improvement_factor: number;
    };
  }> {
    // Get stages with screening data
    const { data: stageData, error: stageError } = await this.supabase
      .from('pipeline_stages')
      .select(`
        id,
        name,
        leads:leads(
          id,
          screening_result_id,
          screening_score,
          screening_qualification,
          status
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (stageError) throw stageError;

    const stagesWithScreening = stageData?.map(stage => {
      const totalLeads = stage.leads?.length || 0;
      const screenedLeads = stage.leads?.filter(lead => lead.screening_result_id).length || 0;
      const screeningPercentage = totalLeads > 0 ? (screenedLeads / totalLeads) * 100 : 0;
      
      const screenedLeadsList = stage.leads?.filter(lead => lead.screening_result_id) || [];
      const avgScreeningScore = screenedLeadsList.length > 0 
        ? screenedLeadsList.reduce((sum, lead) => sum + (lead.screening_score || 0), 0) / screenedLeadsList.length
        : 0;

      const qualificationDist = screenedLeadsList.reduce((acc, lead) => {
        const qual = lead.screening_qualification || 'unknown';
        acc[qual] = (acc[qual] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        stage_id: stage.id,
        stage_name: stage.name,
        total_leads: totalLeads,
        screened_leads: screenedLeads,
        screening_percentage: Math.round(screeningPercentage * 100) / 100,
        avg_screening_score: Math.round(avgScreeningScore * 100) / 100,
        qualification_distribution: qualificationDist
      };
    }) || [];

    // Calculate screening impact on conversion
    const { data: conversionData, error: conversionError } = await this.supabase
      .from('leads')
      .select('screening_result_id, status')
      .eq('tenant_id', tenantId);

    if (conversionError) throw conversionError;

    const screenedLeads = conversionData?.filter(lead => lead.screening_result_id) || [];
    const unscreenedLeads = conversionData?.filter(lead => !lead.screening_result_id) || [];

    const screenedWon = screenedLeads.filter(lead => lead.status === 'closed_won').length;
    const unscreenedWon = unscreenedLeads.filter(lead => lead.status === 'closed_won').length;

    const screenedConversionRate = screenedLeads.length > 0 ? (screenedWon / screenedLeads.length) * 100 : 0;
    const unscreenedConversionRate = unscreenedLeads.length > 0 ? (unscreenedWon / unscreenedLeads.length) * 100 : 0;
    const improvementFactor = unscreenedConversionRate > 0 ? screenedConversionRate / unscreenedConversionRate : 0;

    return {
      stages_with_screening: stagesWithScreening,
      screening_impact_on_conversion: {
        screened_conversion_rate: Math.round(screenedConversionRate * 100) / 100,
        unscreened_conversion_rate: Math.round(unscreenedConversionRate * 100) / 100,
        improvement_factor: Math.round(improvementFactor * 100) / 100
      }
    };
  }
}

// Export singleton instance
export const crmScreeningIntegrationService = new CRMScreeningIntegrationService();