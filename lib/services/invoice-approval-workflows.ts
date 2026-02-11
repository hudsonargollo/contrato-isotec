/**
 * Invoice Approval Workflow Engine
 * Handles customer approval workflows for invoices
 * Requirements: 4.2 - Customer approval workflows with notification system
 */

import { createClient } from '@/lib/supabase/client';
import { 
  Invoice, 
  InvoiceApprovalWorkflow, 
  ApprovalStep, 
  WorkflowCondition,
  InvoiceApprovalRequest 
} from '@/lib/types/invoice';
import { TenantContext } from '@/lib/types/tenant';
import { invoiceNotificationService, NotificationRecipient } from './invoice-notifications';

export interface WorkflowExecution {
  id: string;
  invoice_id: string;
  workflow_id: string;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  steps: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  step_order: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approver_id?: string;
  approved_at?: Date;
  comments?: string;
  auto_approved: boolean;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  approval_steps: ApprovalStep[];
  auto_approve_threshold?: number;
  require_approval_above?: number;
  conditions?: WorkflowCondition[];
  is_default?: boolean;
}

export interface StartWorkflowRequest {
  invoice_id: string;
  workflow_id?: string; // If not provided, uses default workflow
  skip_auto_approval?: boolean;
}

export class InvoiceApprovalWorkflowService {
  private supabase = createClient();

  /**
   * Workflow Management
   */

  async createWorkflow(
    request: CreateWorkflowRequest,
    context: TenantContext
  ): Promise<InvoiceApprovalWorkflow> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // If this is set as default, unset other defaults
    if (request.is_default) {
      await this.supabase
        .from('invoice_approval_workflows')
        .update({ is_default: false })
        .eq('tenant_id', context.tenant_id);
    }

    const { data, error } = await this.supabase
      .from('invoice_approval_workflows')
      .insert({
        tenant_id: context.tenant_id,
        name: request.name,
        description: request.description,
        approval_steps: request.approval_steps,
        auto_approve_threshold: request.auto_approve_threshold,
        require_approval_above: request.require_approval_above,
        conditions: request.conditions || [],
        is_active: true,
        is_default: request.is_default || false,
        created_by: context.user_id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create approval workflow: ${error.message}`);
    }

    return data;
  }

  async getWorkflow(id: string, context: TenantContext): Promise<InvoiceApprovalWorkflow | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoice_approval_workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get workflow: ${error.message}`);
    }

    return data;
  }

  async getDefaultWorkflow(context: TenantContext): Promise<InvoiceApprovalWorkflow | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoice_approval_workflows')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get default workflow: ${error.message}`);
    }

    return data;
  }

  async getWorkflows(context: TenantContext): Promise<InvoiceApprovalWorkflow[]> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoice_approval_workflows')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      throw new Error(`Failed to get workflows: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Workflow Execution
   */

  async startWorkflow(
    request: StartWorkflowRequest,
    context: TenantContext
  ): Promise<WorkflowExecution> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get the invoice
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', request.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Get the workflow
    let workflow: InvoiceApprovalWorkflow;
    if (request.workflow_id) {
      const workflowData = await this.getWorkflow(request.workflow_id, context);
      if (!workflowData) {
        throw new Error('Workflow not found');
      }
      workflow = workflowData;
    } else {
      const defaultWorkflow = await this.getDefaultWorkflow(context);
      if (!defaultWorkflow) {
        throw new Error('No default workflow found');
      }
      workflow = defaultWorkflow;
    }

    // Check if workflow conditions are met
    const conditionsMet = this.evaluateWorkflowConditions(invoice, workflow);
    if (!conditionsMet) {
      throw new Error('Invoice does not meet workflow conditions');
    }

    // Check for auto-approval
    const shouldAutoApprove = !request.skip_auto_approval && 
      this.shouldAutoApprove(invoice, workflow);

    if (shouldAutoApprove) {
      // Auto-approve the invoice
      await this.supabase
        .from('invoices')
        .update({
          status: 'approved',
          approval_status: 'approved',
          approved_by: 'system',
          approved_at: new Date().toISOString()
        })
        .eq('id', request.invoice_id);

      // Create completed workflow execution
      const { data: execution, error: executionError } = await this.supabase
        .from('workflow_executions')
        .insert({
          tenant_id: context.tenant_id,
          invoice_id: request.invoice_id,
          workflow_id: workflow.id,
          current_step: 0,
          status: 'approved',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          steps: [{
            step_order: 0,
            status: 'approved',
            auto_approved: true,
            approved_at: new Date().toISOString(),
            comments: 'Auto-approved based on workflow conditions'
          }],
          created_by: context.user_id
        })
        .select()
        .single();

      if (executionError) {
        throw new Error(`Failed to create workflow execution: ${executionError.message}`);
      }

      return this.mapWorkflowExecutionFromDb(execution);
    }

    // Start manual approval process
    const initialSteps = workflow.approval_steps.map(step => ({
      step_order: step.step_order,
      status: 'pending' as const,
      auto_approved: false
    }));

    const { data: execution, error: executionError } = await this.supabase
      .from('workflow_executions')
      .insert({
        tenant_id: context.tenant_id,
        invoice_id: request.invoice_id,
        workflow_id: workflow.id,
        current_step: 1,
        status: 'pending',
        started_at: new Date().toISOString(),
        steps: initialSteps,
        created_by: context.user_id
      })
      .select()
      .single();

    if (executionError) {
      throw new Error(`Failed to create workflow execution: ${executionError.message}`);
    }

    // Update invoice status
    await this.supabase
      .from('invoices')
      .update({
        status: 'pending_approval',
        approval_status: 'pending'
      })
      .eq('id', request.invoice_id);

    // Send approval notifications for first step
    await this.sendStepApprovalNotifications(
      this.mapWorkflowExecutionFromDb(execution),
      workflow,
      invoice,
      context
    );

    return this.mapWorkflowExecutionFromDb(execution);
  }

  async processApproval(
    executionId: string,
    request: InvoiceApprovalRequest,
    context: TenantContext
  ): Promise<WorkflowExecution> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get workflow execution
    const { data: execution, error: executionError } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (executionError || !execution) {
      throw new Error('Workflow execution not found');
    }

    if (execution.status !== 'pending') {
      throw new Error('Workflow is not in pending state');
    }

    // Get workflow and invoice
    const workflow = await this.getWorkflow(execution.workflow_id, context);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', execution.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Update current step
    const steps = [...execution.steps];
    const currentStepIndex = steps.findIndex(s => s.step_order === execution.current_step);
    
    if (currentStepIndex === -1) {
      throw new Error('Current step not found');
    }

    steps[currentStepIndex] = {
      ...steps[currentStepIndex],
      status: request.action === 'approve' ? 'approved' : 'rejected',
      approver_id: context.user_id,
      approved_at: new Date().toISOString(),
      comments: request.comments,
      auto_approved: false
    };

    let newStatus = execution.status;
    let newCurrentStep = execution.current_step;
    let completedAt = execution.completed_at;

    if (request.action === 'reject') {
      // Rejection stops the workflow
      newStatus = 'rejected';
      completedAt = new Date().toISOString();

      // Update invoice status
      await this.supabase
        .from('invoices')
        .update({
          status: 'draft',
          approval_status: 'rejected',
          rejection_reason: request.comments
        })
        .eq('id', execution.invoice_id);

    } else {
      // Check if there are more steps
      const nextStep = workflow.approval_steps.find(s => s.step_order > execution.current_step);
      
      if (nextStep) {
        // Move to next step
        newCurrentStep = nextStep.step_order;
      } else {
        // All steps completed - approve
        newStatus = 'approved';
        completedAt = new Date().toISOString();

        // Update invoice status
        await this.supabase
          .from('invoices')
          .update({
            status: 'approved',
            approval_status: 'approved',
            approved_by: context.user_id,
            approved_at: new Date().toISOString()
          })
          .eq('id', execution.invoice_id);
      }
    }

    // Update workflow execution
    const { data: updatedExecution, error: updateError } = await this.supabase
      .from('workflow_executions')
      .update({
        current_step: newCurrentStep,
        status: newStatus,
        completed_at: completedAt,
        steps: steps
      })
      .eq('id', executionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update workflow execution: ${updateError.message}`);
    }

    const mappedExecution = this.mapWorkflowExecutionFromDb(updatedExecution);

    // Send notifications
    const approver: NotificationRecipient = {
      id: context.user_id,
      email: 'approver@example.com', // TODO: Get actual user email
      name: 'Approver'
    };

    await invoiceNotificationService.sendApprovalDecision(
      invoice,
      request.action === 'approve' ? 'approved' : 'rejected',
      approver,
      request.comments,
      context
    );

    // If moving to next step, send notifications for next step
    if (newStatus === 'pending' && newCurrentStep > execution.current_step) {
      await this.sendStepApprovalNotifications(
        mappedExecution,
        workflow,
        invoice,
        context
      );
    }

    return mappedExecution;
  }

  async getWorkflowExecution(
    executionId: string,
    context: TenantContext
  ): Promise<WorkflowExecution | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get workflow execution: ${error.message}`);
    }

    return this.mapWorkflowExecutionFromDb(data);
  }

  async getInvoiceWorkflowExecution(
    invoiceId: string,
    context: TenantContext
  ): Promise<WorkflowExecution | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get invoice workflow execution: ${error.message}`);
    }

    return this.mapWorkflowExecutionFromDb(data);
  }

  /**
   * Workflow Monitoring and Management
   */

  async getPendingApprovals(
    userId: string,
    context: TenantContext
  ): Promise<Array<{
    execution: WorkflowExecution;
    invoice: Invoice;
    workflow: InvoiceApprovalWorkflow;
  }>> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get pending workflow executions where user is an approver
    const { data: executions, error: executionsError } = await this.supabase
      .from('workflow_executions')
      .select(`
        *,
        invoice:invoices(*),
        workflow:invoice_approval_workflows(*)
      `)
      .eq('status', 'pending');

    if (executionsError) {
      throw new Error(`Failed to get pending approvals: ${executionsError.message}`);
    }

    const results = [];

    for (const execution of executions || []) {
      const workflow = execution.workflow;
      const currentStep = workflow.approval_steps.find(
        (s: ApprovalStep) => s.step_order === execution.current_step
      );

      if (!currentStep) continue;

      // Check if user is an approver for current step
      const isApprover = await this.isUserApproverForStep(userId, currentStep, context);
      
      if (isApprover) {
        results.push({
          execution: this.mapWorkflowExecutionFromDb(execution),
          invoice: execution.invoice,
          workflow: workflow
        });
      }
    }

    return results;
  }

  async getOverdueApprovals(
    daysPending: number,
    context: TenantContext
  ): Promise<Array<{
    execution: WorkflowExecution;
    invoice: Invoice;
    workflow: InvoiceApprovalWorkflow;
  }>> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPending);

    const { data: executions, error } = await this.supabase
      .from('workflow_executions')
      .select(`
        *,
        invoice:invoices(*),
        workflow:invoice_approval_workflows(*)
      `)
      .eq('status', 'pending')
      .lt('started_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to get overdue approvals: ${error.message}`);
    }

    return (executions || []).map(execution => ({
      execution: this.mapWorkflowExecutionFromDb(execution),
      invoice: execution.invoice,
      workflow: execution.workflow
    }));
  }

  async sendOverdueReminders(
    daysPending: number,
    context: TenantContext
  ): Promise<void> {
    const overdueApprovals = await this.getOverdueApprovals(daysPending, context);

    for (const { execution, invoice, workflow } of overdueApprovals) {
      const currentStep = workflow.approval_steps.find(
        s => s.step_order === execution.current_step
      );

      if (currentStep) {
        const approvers = await invoiceNotificationService.getWorkflowApprovers(
          workflow,
          currentStep.step_order,
          context
        );

        await invoiceNotificationService.sendOverdueReminder(
          invoice,
          workflow,
          approvers,
          daysPending,
          context
        );
      }
    }
  }

  /**
   * Private Helper Methods
   */

  private evaluateWorkflowConditions(
    invoice: any,
    workflow: InvoiceApprovalWorkflow
  ): boolean {
    if (!workflow.conditions || workflow.conditions.length === 0) {
      return true;
    }

    return workflow.conditions.every(condition => {
      const fieldValue = this.getFieldValue(invoice, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private shouldAutoApprove(invoice: any, workflow: InvoiceApprovalWorkflow): boolean {
    if (!workflow.auto_approve_threshold) {
      return false;
    }

    return parseFloat(invoice.total_amount) <= workflow.auto_approve_threshold;
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((value, key) => value?.[key], obj);
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(expectedValue);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(expectedValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'in_list':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private async sendStepApprovalNotifications(
    execution: WorkflowExecution,
    workflow: InvoiceApprovalWorkflow,
    invoice: any,
    context: TenantContext
  ): Promise<void> {
    const currentStep = workflow.approval_steps.find(
      s => s.step_order === execution.current_step
    );

    if (!currentStep) return;

    const approvers = await invoiceNotificationService.getWorkflowApprovers(
      workflow,
      currentStep.step_order,
      context
    );

    await invoiceNotificationService.sendApprovalRequest(
      invoice,
      workflow,
      approvers,
      context
    );
  }

  private async isUserApproverForStep(
    userId: string,
    step: ApprovalStep,
    context: TenantContext
  ): Promise<boolean> {
    // Check if user is specifically assigned
    if (step.approver_user_id === userId) {
      return true;
    }

    // Check if user has the required role
    if (step.approver_role) {
      const { data: userRoles, error } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('tenant_id', context.tenant_id);

      if (error) return false;

      return userRoles?.some(ur => ur.role === step.approver_role) || false;
    }

    return false;
  }

  private mapWorkflowExecutionFromDb(data: any): WorkflowExecution {
    return {
      id: data.id,
      invoice_id: data.invoice_id,
      workflow_id: data.workflow_id,
      current_step: data.current_step,
      status: data.status,
      started_at: new Date(data.started_at),
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      steps: data.steps || []
    };
  }
}

export const invoiceApprovalWorkflowService = new InvoiceApprovalWorkflowService();