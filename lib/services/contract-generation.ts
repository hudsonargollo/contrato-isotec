/**
 * Contract Generation Service
 * 
 * Service layer for automated contract generation, workflow management,
 * validation, and lifecycle tracking.
 * 
 * Requirements: 7.1 - Automated contract generation
 */

import { createClient } from '@/lib/supabase/server';
import { 
  ContractGenerationRequest,
  GeneratedContract,
  ContractValidationRule,
  ContractGenerationWorkflow,
  CreateGenerationRequest,
  UpdateGenerationRequest,
  CreateGeneratedContract,
  UpdateGeneratedContract,
  CreateValidationRule,
  UpdateValidationRule,
  CreateWorkflow,
  UpdateWorkflow,
  ValidationResult,
  ContractPreview,
  GenerationStats,
  GenerationRequestWithContract,
  ContractWithSignatures,
  WorkflowExecution,
  DEFAULT_GENERATION_OPTIONS,
  calculateSignatureProgress,
  isContractExpired
} from '@/lib/types/contract-generation';
import { TenantContext } from '@/lib/types/tenant';
import { ContractTemplate, populateTemplate } from '@/lib/types/contract-templates';
import { Lead } from '@/lib/types/crm';

export class ContractGenerationService {
  private supabase;
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.supabase = createClient();
    this.tenantContext = tenantContext;
  }

  /**
   * Create a new contract generation request
   */
  async createGenerationRequest(data: CreateGenerationRequest): Promise<ContractGenerationRequest> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const requestData = {
      ...data,
      tenant_id: this.tenantContext.tenant_id,
      requested_by: this.tenantContext.user_id,
      generation_options: { ...DEFAULT_GENERATION_OPTIONS, ...data.generation_options }
    };

    const { data: request, error } = await this.supabase
      .from('contract_generation_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create generation request: ${error.message}`);
    }

    // Start generation workflow if auto-execute is enabled
    const workflow = await this.getApplicableWorkflow(data.template_id);
    if (workflow && workflow.auto_execute) {
      await this.executeWorkflow(request.id, workflow.id);
    }

    return this.mapDatabaseToGenerationRequest(request);
  }

  /**
   * Get generation request by ID
   */
  async getGenerationRequest(id: string): Promise<GenerationRequestWithContract | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: request, error } = await this.supabase
      .from('contract_generation_requests')
      .select(`
        *,
        generated_contract:generated_contracts(*),
        template:contract_templates(id, name, version),
        lead:leads(id, contact_info)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get generation request: ${error.message}`);
    }

    return this.mapDatabaseToGenerationRequestWithContract(request);
  }

  /**
   * Update generation request
   */
  async updateGenerationRequest(id: string, data: UpdateGenerationRequest): Promise<ContractGenerationRequest> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: request, error } = await this.supabase
      .from('contract_generation_requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update generation request: ${error.message}`);
    }

    return this.mapDatabaseToGenerationRequest(request);
  }

  /**
   * Generate contract from CRM lead data
   */
  async generateContractFromLead(
    templateId: string, 
    leadId: string, 
    additionalData: Record<string, any> = {}
  ): Promise<ContractGenerationRequest> {
    // Get lead data
    const { data: lead, error: leadError } = await this.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) {
      throw new Error(`Failed to get lead data: ${leadError.message}`);
    }

    // Get template
    const { data: template, error: templateError } = await this.supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      throw new Error(`Failed to get template: ${templateError.message}`);
    }

    // Map lead data to contract variables
    const contractData = this.mapLeadToContractData(lead, additionalData);
    const variableValues = this.extractVariableValues(template, contractData);

    // Create generation request
    const requestData: CreateGenerationRequest = {
      tenant_id: this.tenantContext.tenant_id,
      template_id: templateId,
      lead_id: leadId,
      contract_data: contractData,
      variable_values: variableValues,
      generation_options: DEFAULT_GENERATION_OPTIONS,
      output_format: 'pdf',
      status: 'pending',
      workflow_step: 1,
      approval_status: 'pending',
      requested_by: this.tenantContext.user_id
    };

    return this.createGenerationRequest(requestData);
  }

  /**
   * Validate contract data against rules
   */
  async validateContractData(
    templateId: string,
    contractData: Record<string, any>,
    variableValues: Record<string, any>
  ): Promise<ValidationResult> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    // Call database validation function
    const { data: result, error } = await this.supabase
      .rpc('validate_contract_data', {
        tenant_uuid: this.tenantContext.tenant_id,
        template_uuid: templateId,
        contract_data: contractData,
        variable_values: variableValues
      });

    if (error) {
      throw new Error(`Failed to validate contract data: ${error.message}`);
    }

    return result as ValidationResult;
  }

  /**
   * Generate contract preview
   */
  async generatePreview(previewData: ContractPreview): Promise<{ content: string; validation: ValidationResult }> {
    // Get template
    const { data: template, error } = await this.supabase
      .from('contract_templates')
      .select('*')
      .eq('id', previewData.template_id)
      .single();

    if (error) {
      throw new Error(`Failed to get template: ${error.message}`);
    }

    // Validate data
    const validation = await this.validateContractData(
      previewData.template_id,
      previewData.contract_data,
      previewData.variable_values
    );

    // Populate template
    const content = populateTemplate(
      template.template_content,
      previewData.contract_data,
      previewData.variable_values
    );

    return { content, validation };
  }

  /**
   * Process generation request
   */
  async processGenerationRequest(requestId: string): Promise<GeneratedContract> {
    const request = await this.getGenerationRequest(requestId);
    if (!request) {
      throw new Error('Generation request not found');
    }

    // Update status to processing
    await this.updateGenerationRequest(requestId, { status: 'processing' });

    try {
      // Validate contract data
      const validation = await this.validateContractData(
        request.template_id,
        request.contract_data,
        request.variable_values
      );

      if (!validation.valid && validation.errors.some(error => error.includes('error') || error.includes('critical'))) {
        await this.updateGenerationRequest(requestId, {
          status: 'failed',
          validation_errors: validation.errors
        });
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get template
      const { data: template, error: templateError } = await this.supabase
        .from('contract_templates')
        .select('*')
        .eq('id', request.template_id)
        .single();

      if (templateError) {
        throw new Error(`Failed to get template: ${templateError.message}`);
      }

      // Generate contract content
      const contractContent = populateTemplate(
        template.template_content,
        request.contract_data,
        request.variable_values
      );

      // Create generated contract
      const contractData: CreateGeneratedContract = {
        tenant_id: this.tenantContext.tenant_id,
        generation_request_id: requestId,
        contract_number: '', // Will be auto-generated
        template_id: request.template_id,
        template_version: template.version,
        customer_id: request.lead_id,
        customer_data: request.contract_data,
        contract_content: contractContent,
        contract_variables: request.variable_values,
        file_format: request.output_format,
        status: 'draft',
        signature_status: 'pending',
        signature_requests: this.generateSignatureRequests(template, request.contract_data),
        created_by: this.tenantContext.user_id
      };

      const generatedContract = await this.createGeneratedContract(contractData);

      // Update request status
      await this.updateGenerationRequest(requestId, {
        status: 'completed',
        generated_content: contractContent,
        completed_at: new Date()
      });

      return generatedContract;

    } catch (error) {
      // Update request status to failed
      await this.updateGenerationRequest(requestId, {
        status: 'failed',
        validation_errors: [error instanceof Error ? error.message : 'Unknown error']
      });
      throw error;
    }
  }

  /**
   * Create generated contract
   */
  async createGeneratedContract(data: CreateGeneratedContract): Promise<GeneratedContract> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: contract, error } = await this.supabase
      .from('generated_contracts')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create generated contract: ${error.message}`);
    }

    return this.mapDatabaseToGeneratedContract(contract);
  }

  /**
   * Get generated contract by ID
   */
  async getGeneratedContract(id: string): Promise<ContractWithSignatures | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: contract, error } = await this.supabase
      .from('generated_contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get generated contract: ${error.message}`);
    }

    const mappedContract = this.mapDatabaseToGeneratedContract(contract);
    const signatureProgress = calculateSignatureProgress(mappedContract.signature_requests);

    return {
      ...mappedContract,
      signature_progress: signatureProgress
    };
  }

  /**
   * Update generated contract
   */
  async updateGeneratedContract(id: string, data: UpdateGeneratedContract): Promise<GeneratedContract> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: contract, error } = await this.supabase
      .from('generated_contracts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update generated contract: ${error.message}`);
    }

    return this.mapDatabaseToGeneratedContract(contract);
  }

  /**
   * List generated contracts with filtering
   */
  async listGeneratedContracts(filters: {
    status?: string;
    signature_status?: string;
    customer_id?: string;
    template_id?: string;
    created_after?: Date;
    created_before?: Date;
    expires_soon?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ contracts: ContractWithSignatures[]; total: number }> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    let query = this.supabase
      .from('generated_contracts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.signature_status) {
      query = query.eq('signature_status', filters.signature_status);
    }

    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters.template_id) {
      query = query.eq('template_id', filters.template_id);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString());
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString());
    }

    if (filters.expires_soon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query.lte('expires_at', thirtyDaysFromNow.toISOString());
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: contracts, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list generated contracts: ${error.message}`);
    }

    const mappedContracts = contracts?.map(contract => {
      const mapped = this.mapDatabaseToGeneratedContract(contract);
      const signatureProgress = calculateSignatureProgress(mapped.signature_requests);
      return { ...mapped, signature_progress: signatureProgress };
    }) || [];

    return {
      contracts: mappedContracts,
      total: count || 0
    };
  }

  /**
   * Get applicable workflow for template
   */
  async getApplicableWorkflow(templateId: string): Promise<ContractGenerationWorkflow | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: workflow, error } = await this.supabase
      .from('contract_generation_workflows')
      .select('*')
      .eq('is_active', true)
      .or(`template_id.eq.${templateId},applies_to_all_templates.eq.true`)
      .order('is_default', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get workflow: ${error.message}`);
    }

    return this.mapDatabaseToWorkflow(workflow);
  }

  /**
   * Execute workflow for generation request
   */
  async executeWorkflow(requestId: string, workflowId: string): Promise<WorkflowExecution> {
    // This is a simplified workflow execution
    // In a real implementation, this would be more sophisticated with proper state management
    
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const execution: WorkflowExecution = {
      workflow_id: workflowId,
      request_id: requestId,
      current_step: 1,
      step_results: [],
      started_at: new Date(),
      status: 'running'
    };

    try {
      // Execute workflow steps
      for (const step of workflow.workflow_steps) {
        const stepResult = {
          step_id: step.id,
          status: 'pending' as const,
          started_at: new Date()
        };

        try {
          // Execute step based on type
          switch (step.step_type) {
            case 'validation':
              await this.executeValidationStep(requestId, step);
              stepResult.status = 'completed';
              break;
            case 'approval':
              await this.executeApprovalStep(requestId, step);
              stepResult.status = 'completed';
              break;
            case 'generation':
              await this.processGenerationRequest(requestId);
              stepResult.status = 'completed';
              break;
            case 'notification':
              await this.executeNotificationStep(requestId, step);
              stepResult.status = 'completed';
              break;
            default:
              stepResult.status = 'skipped';
          }

          stepResult.completed_at = new Date();
        } catch (error) {
          stepResult.status = 'failed';
          stepResult.error = error instanceof Error ? error.message : 'Unknown error';
          stepResult.completed_at = new Date();
          
          if (step.is_required) {
            execution.status = 'failed';
            execution.completed_at = new Date();
            break;
          }
        }

        execution.step_results.push(stepResult);
        execution.current_step++;
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completed_at = new Date();
      }

    } catch (error) {
      execution.status = 'failed';
      execution.completed_at = new Date();
    }

    return execution;
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(dateRange?: { start: Date; end: Date }): Promise<GenerationStats> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    let query = this.supabase
      .from('contract_generation_requests')
      .select('status, template_id, created_at');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data: requests, error } = await query;

    if (error) {
      throw new Error(`Failed to get generation stats: ${error.message}`);
    }

    const total = requests?.length || 0;
    const completed = requests?.filter(r => r.status === 'completed').length || 0;
    const failed = requests?.filter(r => r.status === 'failed').length || 0;
    const pending = requests?.filter(r => r.status === 'pending').length || 0;

    const stats: GenerationStats = {
      total_requests: total,
      completed_requests: completed,
      failed_requests: failed,
      pending_requests: pending,
      success_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      most_used_templates: [],
      generation_trends: []
    };

    return stats;
  }

  // Private helper methods
  private mapLeadToContractData(lead: Lead, additionalData: Record<string, any> = {}): Record<string, any> {
    const contactInfo = lead.contact_info as any;
    
    return {
      contractor_name: contactInfo?.name || '',
      contractor_email: contactInfo?.email || '',
      contractor_phone: contactInfo?.phone || '',
      contractor_cpf: contactInfo?.cpf || '',
      address_cep: contactInfo?.address?.cep || '',
      address_street: contactInfo?.address?.street || '',
      address_number: contactInfo?.address?.number || '',
      address_complement: contactInfo?.address?.complement || '',
      address_neighborhood: contactInfo?.address?.neighborhood || '',
      address_city: contactInfo?.address?.city || '',
      address_state: contactInfo?.address?.state || '',
      project_kwp: lead.project_details?.kwp || 0,
      contract_value: lead.project_details?.estimated_value || 0,
      installation_date: lead.project_details?.installation_date || null,
      payment_method: 'pix',
      ...additionalData
    };
  }

  private extractVariableValues(template: ContractTemplate, contractData: Record<string, any>): Record<string, any> {
    const variableValues: Record<string, any> = {};
    
    template.template_variables.forEach(variable => {
      if (contractData[variable.name] !== undefined) {
        variableValues[variable.name] = contractData[variable.name];
      } else if (variable.default_value) {
        variableValues[variable.name] = variable.default_value;
      }
    });
    
    return variableValues;
  }

  private generateSignatureRequests(template: ContractTemplate, contractData: Record<string, any>): any[] {
    const requests = [];
    
    // Add contractor signature request
    if (contractData.contractor_email) {
      requests.push({
        id: crypto.randomUUID(),
        signer_name: contractData.contractor_name || 'Contratante',
        signer_email: contractData.contractor_email,
        signer_role: 'contractor',
        status: 'pending'
      });
    }
    
    // Add company signature request (would be configured per tenant)
    requests.push({
      id: crypto.randomUUID(),
      signer_name: 'Empresa',
      signer_email: 'contratos@empresa.com', // Would come from tenant settings
      signer_role: 'company',
      status: 'pending'
    });
    
    return requests;
  }

  private async executeValidationStep(requestId: string, step: any): Promise<void> {
    const request = await this.getGenerationRequest(requestId);
    if (!request) throw new Error('Request not found');
    
    const validation = await this.validateContractData(
      request.template_id,
      request.contract_data,
      request.variable_values
    );
    
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  private async executeApprovalStep(requestId: string, step: any): Promise<void> {
    // Update request to require approval
    await this.updateGenerationRequest(requestId, {
      approval_status: 'pending',
      workflow_step: step.order
    });
  }

  private async executeNotificationStep(requestId: string, step: any): Promise<void> {
    // Send notification (would integrate with notification service)
    console.log(`Sending notification for request ${requestId}`);
  }

  private async getWorkflow(id: string): Promise<ContractGenerationWorkflow | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_id: this.tenantContext.tenant_id });

    const { data: workflow, error } = await this.supabase
      .from('contract_generation_workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get workflow: ${error.message}`);
    }

    return this.mapDatabaseToWorkflow(workflow);
  }

  // Database mapping methods
  private mapDatabaseToGenerationRequest(data: any): ContractGenerationRequest {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      template_id: data.template_id,
      lead_id: data.lead_id,
      contract_data: data.contract_data || {},
      variable_values: data.variable_values || {},
      generation_options: data.generation_options || DEFAULT_GENERATION_OPTIONS,
      output_format: data.output_format,
      status: data.status,
      generated_content: data.generated_content,
      generated_file_url: data.generated_file_url,
      validation_errors: data.validation_errors || [],
      workflow_step: data.workflow_step,
      approval_status: data.approval_status,
      approved_by: data.approved_by,
      approved_at: data.approved_at ? new Date(data.approved_at) : undefined,
      requested_by: data.requested_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  private mapDatabaseToGenerationRequestWithContract(data: any): GenerationRequestWithContract {
    const request = this.mapDatabaseToGenerationRequest(data);
    
    return {
      ...request,
      generated_contract: data.generated_contract ? this.mapDatabaseToGeneratedContract(data.generated_contract) : undefined,
      template: data.template ? {
        id: data.template.id,
        name: data.template.name,
        version: data.template.version
      } : undefined,
      lead: data.lead ? {
        id: data.lead.id,
        name: data.lead.contact_info?.name || '',
        email: data.lead.contact_info?.email || ''
      } : undefined
    };
  }

  private mapDatabaseToGeneratedContract(data: any): GeneratedContract {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      generation_request_id: data.generation_request_id,
      contract_number: data.contract_number,
      template_id: data.template_id,
      template_version: data.template_version,
      customer_id: data.customer_id,
      customer_data: data.customer_data || {},
      contract_content: data.contract_content,
      contract_variables: data.contract_variables || {},
      file_url: data.file_url,
      file_size: data.file_size,
      file_format: data.file_format,
      file_hash: data.file_hash,
      status: data.status,
      is_final: data.is_final,
      signature_status: data.signature_status,
      signature_requests: data.signature_requests || [],
      signed_at: data.signed_at ? new Date(data.signed_at) : undefined,
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      renewal_date: data.renewal_date ? new Date(data.renewal_date) : undefined,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private mapDatabaseToWorkflow(data: any): ContractGenerationWorkflow {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      name: data.name,
      description: data.description,
      version: data.version,
      workflow_steps: data.workflow_steps || [],
      trigger_conditions: data.trigger_conditions || {},
      template_id: data.template_id,
      applies_to_all_templates: data.applies_to_all_templates,
      is_active: data.is_active,
      is_default: data.is_default,
      auto_execute: data.auto_execute,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
}

// Utility functions for contract generation
export const createContractGenerationService = (tenantContext: TenantContext) => {
  return new ContractGenerationService(tenantContext);
};

export const generateContractNumber = (tenantId: string, year?: number): string => {
  const currentYear = year || new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `CT${yearSuffix}${randomSuffix}`;
};