/**
 * Invoice Notification Service
 * Handles notifications for invoice approval workflows
 * Requirements: 4.2 - Customer approval workflows with notification system
 */

import { createClient } from '@/lib/supabase/client';
import { Invoice, InvoiceApprovalWorkflow } from '@/lib/types/invoice';
import { TenantContext } from '@/lib/types/tenant';

export interface NotificationRecipient {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  variables: Record<string, any>;
}

export interface NotificationOptions {
  method: 'email' | 'in_app' | 'both';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  schedule_at?: Date;
}

export class InvoiceNotificationService {
  private supabase = createClient();

  /**
   * Send approval request notification
   */
  async sendApprovalRequest(
    invoice: Invoice,
    workflow: InvoiceApprovalWorkflow,
    approvers: NotificationRecipient[],
    context: TenantContext,
    options: NotificationOptions = { method: 'email', priority: 'normal' }
  ): Promise<void> {
    const template = this.getApprovalRequestTemplate(invoice, workflow, context);
    
    for (const approver of approvers) {
      await this.sendNotification({
        recipient: approver,
        template: {
          ...template,
          variables: {
            ...template.variables,
            approver_name: approver.name || approver.email
          }
        },
        options,
        context
      });
    }

    // Log notification activity
    await this.logNotificationActivity({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'approval_request_sent',
      invoice_id: invoice.id,
      recipients: approvers.map(a => a.email),
      workflow_id: workflow.id
    });
  }

  /**
   * Send approval decision notification
   */
  async sendApprovalDecision(
    invoice: Invoice,
    action: 'approved' | 'rejected',
    approver: NotificationRecipient,
    comments?: string,
    context: TenantContext,
    options: NotificationOptions = { method: 'email', priority: 'normal' }
  ): Promise<void> {
    const template = this.getApprovalDecisionTemplate(invoice, action, approver, comments, context);
    
    // Notify invoice creator
    const creator = await this.getInvoiceCreator(invoice.id, context);
    if (creator) {
      await this.sendNotification({
        recipient: creator,
        template,
        options,
        context
      });
    }

    // Notify customer if approved
    if (action === 'approved' && invoice.customer_email) {
      const customerTemplate = this.getCustomerApprovalTemplate(invoice, context);
      await this.sendNotification({
        recipient: {
          id: 'customer',
          email: invoice.customer_email,
          name: invoice.customer_name
        },
        template: customerTemplate,
        options: { ...options, priority: 'normal' },
        context
      });
    }

    // Log notification activity
    await this.logNotificationActivity({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: `approval_${action}_notification_sent`,
      invoice_id: invoice.id,
      recipients: creator ? [creator.email] : [],
      approver_id: approver.id
    });
  }

  /**
   * Send overdue approval reminder
   */
  async sendOverdueReminder(
    invoice: Invoice,
    workflow: InvoiceApprovalWorkflow,
    approvers: NotificationRecipient[],
    daysPending: number,
    context: TenantContext
  ): Promise<void> {
    const template = this.getOverdueReminderTemplate(invoice, workflow, daysPending, context);
    
    for (const approver of approvers) {
      await this.sendNotification({
        recipient: approver,
        template: {
          ...template,
          variables: {
            ...template.variables,
            approver_name: approver.name || approver.email
          }
        },
        options: { method: 'email', priority: 'high' },
        context
      });
    }

    // Log notification activity
    await this.logNotificationActivity({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'overdue_reminder_sent',
      invoice_id: invoice.id,
      recipients: approvers.map(a => a.email),
      workflow_id: workflow.id,
      days_pending: daysPending
    });
  }

  /**
   * Send invoice status update notification
   */
  async sendStatusUpdate(
    invoice: Invoice,
    oldStatus: string,
    newStatus: string,
    context: TenantContext
  ): Promise<void> {
    const template = this.getStatusUpdateTemplate(invoice, oldStatus, newStatus, context);
    
    // Notify relevant stakeholders
    const stakeholders = await this.getInvoiceStakeholders(invoice.id, context);
    
    for (const stakeholder of stakeholders) {
      await this.sendNotification({
        recipient: stakeholder,
        template,
        options: { method: 'in_app', priority: 'normal' },
        context
      });
    }

    // Log notification activity
    await this.logNotificationActivity({
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action: 'status_update_notification_sent',
      invoice_id: invoice.id,
      recipients: stakeholders.map(s => s.email),
      old_status: oldStatus,
      new_status: newStatus
    });
  }

  /**
   * Get approvers for a workflow step
   */
  async getWorkflowApprovers(
    workflow: InvoiceApprovalWorkflow,
    stepOrder: number,
    context: TenantContext
  ): Promise<NotificationRecipient[]> {
    const step = workflow.approval_steps.find(s => s.step_order === stepOrder);
    if (!step) return [];

    const approvers: NotificationRecipient[] = [];

    // Get approvers by role
    if (step.approver_role) {
      const roleApprovers = await this.getUsersByRole(step.approver_role, context);
      approvers.push(...roleApprovers);
    }

    // Get specific approver by user ID
    if (step.approver_user_id) {
      const userApprover = await this.getUserById(step.approver_user_id, context);
      if (userApprover) {
        approvers.push(userApprover);
      }
    }

    return approvers;
  }

  /**
   * Private helper methods
   */

  private async sendNotification({
    recipient,
    template,
    options,
    context
  }: {
    recipient: NotificationRecipient;
    template: NotificationTemplate;
    options: NotificationOptions;
    context: TenantContext;
  }): Promise<void> {
    // Set tenant context
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Create notification record
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        tenant_id: context.tenant_id,
        recipient_id: recipient.id,
        recipient_email: recipient.email,
        subject: template.subject,
        body: this.processTemplate(template.body, template.variables),
        method: options.method,
        priority: options.priority,
        status: 'pending',
        scheduled_at: options.schedule_at || new Date(),
        created_by: context.user_id
      });

    if (error) {
      console.error('Failed to create notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // TODO: Integrate with actual email service (e.g., Resend, SendGrid)
    // For now, we'll just log the notification
    console.log(`Notification sent to ${recipient.email}: ${template.subject}`);
  }

  private getApprovalRequestTemplate(
    invoice: Invoice,
    workflow: InvoiceApprovalWorkflow,
    context: TenantContext
  ): NotificationTemplate {
    return {
      subject: `Invoice Approval Required: ${invoice.invoice_number}`,
      body: `
        <h2>Invoice Approval Request</h2>
        <p>Hello {{approver_name}},</p>
        
        <p>An invoice requires your approval:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Invoice Details:</strong><br>
          Invoice Number: {{invoice_number}}<br>
          Customer: {{customer_name}}<br>
          Amount: {{currency}} {{total_amount}}<br>
          Due Date: {{due_date}}<br>
          Status: {{status}}
        </div>
        
        <p>Workflow: {{workflow_name}}</p>
        
        <p>Please review and approve or reject this invoice in the system.</p>
        
        <p><a href="{{approval_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Invoice</a></p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
      `,
      variables: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        currency: invoice.currency,
        total_amount: invoice.total_amount.toFixed(2),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        status: invoice.status,
        workflow_name: workflow.name,
        approval_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/approve`,
        tenant_name: context.tenant_id // TODO: Get actual tenant name
      }
    };
  }

  private getApprovalDecisionTemplate(
    invoice: Invoice,
    action: 'approved' | 'rejected',
    approver: NotificationRecipient,
    comments?: string,
    context: TenantContext
  ): NotificationTemplate {
    const actionText = action === 'approved' ? 'Approved' : 'Rejected';
    const statusColor = action === 'approved' ? '#28a745' : '#dc3545';

    return {
      subject: `Invoice ${actionText}: ${invoice.invoice_number}`,
      body: `
        <h2>Invoice ${actionText}</h2>
        
        <p>Your invoice has been ${action.toLowerCase()}:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Invoice Details:</strong><br>
          Invoice Number: {{invoice_number}}<br>
          Customer: {{customer_name}}<br>
          Amount: {{currency}} {{total_amount}}<br>
          Status: <span style="color: ${statusColor}; font-weight: bold;">{{action_text}}</span>
        </div>
        
        <p><strong>Approved by:</strong> {{approver_name}}</p>
        
        ${comments ? `
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Comments:</strong><br>
          {{comments}}
        </div>
        ` : ''}
        
        <p><a href="{{invoice_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
      `,
      variables: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        currency: invoice.currency,
        total_amount: invoice.total_amount.toFixed(2),
        action_text: actionText,
        approver_name: approver.name || approver.email,
        comments: comments || '',
        invoice_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
        tenant_name: context.tenant_id // TODO: Get actual tenant name
      }
    };
  }

  private getCustomerApprovalTemplate(
    invoice: Invoice,
    context: TenantContext
  ): NotificationTemplate {
    return {
      subject: `Invoice Ready: ${invoice.invoice_number}`,
      body: `
        <h2>Your Invoice is Ready</h2>
        
        <p>Dear {{customer_name}},</p>
        
        <p>Your invoice has been approved and is now ready for payment:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Invoice Details:</strong><br>
          Invoice Number: {{invoice_number}}<br>
          Amount: {{currency}} {{total_amount}}<br>
          Due Date: {{due_date}}
        </div>
        
        <p><a href="{{payment_url}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View & Pay Invoice</a></p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
      `,
      variables: {
        customer_name: invoice.customer_name,
        invoice_number: invoice.invoice_number,
        currency: invoice.currency,
        total_amount: invoice.total_amount.toFixed(2),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        payment_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/pay`,
        tenant_name: context.tenant_id // TODO: Get actual tenant name
      }
    };
  }

  private getOverdueReminderTemplate(
    invoice: Invoice,
    workflow: InvoiceApprovalWorkflow,
    daysPending: number,
    context: TenantContext
  ): NotificationTemplate {
    return {
      subject: `REMINDER: Invoice Approval Overdue - ${invoice.invoice_number}`,
      body: `
        <h2 style="color: #dc3545;">Invoice Approval Overdue</h2>
        
        <p>Hello {{approver_name}},</p>
        
        <p><strong>This invoice has been pending approval for {{days_pending}} days:</strong></p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Invoice Details:</strong><br>
          Invoice Number: {{invoice_number}}<br>
          Customer: {{customer_name}}<br>
          Amount: {{currency}} {{total_amount}}<br>
          Due Date: {{due_date}}<br>
          Days Pending: <strong style="color: #dc3545;">{{days_pending}} days</strong>
        </div>
        
        <p>Please review and approve or reject this invoice as soon as possible.</p>
        
        <p><a href="{{approval_url}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Invoice Now</a></p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
      `,
      variables: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        currency: invoice.currency,
        total_amount: invoice.total_amount.toFixed(2),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        days_pending: daysPending.toString(),
        approval_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/approve`,
        tenant_name: context.tenant_id // TODO: Get actual tenant name
      }
    };
  }

  private getStatusUpdateTemplate(
    invoice: Invoice,
    oldStatus: string,
    newStatus: string,
    context: TenantContext
  ): NotificationTemplate {
    return {
      subject: `Invoice Status Update: ${invoice.invoice_number}`,
      body: `
        <h2>Invoice Status Update</h2>
        
        <p>The status of invoice {{invoice_number}} has been updated:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>Invoice:</strong> {{invoice_number}}<br>
          <strong>Customer:</strong> {{customer_name}}<br>
          <strong>Previous Status:</strong> {{old_status}}<br>
          <strong>New Status:</strong> <span style="font-weight: bold; color: #007bff;">{{new_status}}</span>
        </div>
        
        <p><a href="{{invoice_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
      `,
      variables: {
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        old_status: oldStatus,
        new_status: newStatus,
        invoice_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
        tenant_name: context.tenant_id // TODO: Get actual tenant name
      }
    };
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value));
    });
    
    return processed;
  }

  private async getUsersByRole(role: string, context: TenantContext): Promise<NotificationRecipient[]> {
    const { data: users, error } = await this.supabase
      .from('user_roles')
      .select(`
        user_id,
        users:auth.users!user_id(id, email, raw_user_meta_data)
      `)
      .eq('role', role);

    if (error) {
      console.error('Failed to get users by role:', error);
      return [];
    }

    return users?.map(ur => ({
      id: ur.users.id,
      email: ur.users.email,
      name: ur.users.raw_user_meta_data?.full_name,
      role
    })) || [];
  }

  private async getUserById(userId: string, context: TenantContext): Promise<NotificationRecipient | null> {
    const { data: user, error } = await this.supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.raw_user_meta_data?.full_name
    };
  }

  private async getInvoiceCreator(invoiceId: string, context: TenantContext): Promise<NotificationRecipient | null> {
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select(`
        created_by,
        created_by_user:auth.users!created_by(id, email, raw_user_meta_data)
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice.created_by_user) {
      return null;
    }

    return {
      id: invoice.created_by_user.id,
      email: invoice.created_by_user.email,
      name: invoice.created_by_user.raw_user_meta_data?.full_name
    };
  }

  private async getInvoiceStakeholders(invoiceId: string, context: TenantContext): Promise<NotificationRecipient[]> {
    // Get invoice creator and any assigned users
    const creator = await this.getInvoiceCreator(invoiceId, context);
    const stakeholders: NotificationRecipient[] = [];
    
    if (creator) {
      stakeholders.push(creator);
    }

    // TODO: Add logic to get other stakeholders (assigned users, managers, etc.)
    
    return stakeholders;
  }

  private async logNotificationActivity(data: {
    tenant_id: string;
    user_id: string;
    action: string;
    invoice_id: string;
    recipients: string[];
    workflow_id?: string;
    approver_id?: string;
    days_pending?: number;
    old_status?: string;
    new_status?: string;
  }): Promise<void> {
    try {
      await this.supabase
        .from('notification_logs')
        .insert({
          tenant_id: data.tenant_id,
          user_id: data.user_id,
          action: data.action,
          resource_type: 'invoice',
          resource_id: data.invoice_id,
          recipients: data.recipients,
          metadata: {
            workflow_id: data.workflow_id,
            approver_id: data.approver_id,
            days_pending: data.days_pending,
            old_status: data.old_status,
            new_status: data.new_status
          }
        });
    } catch (error) {
      console.error('Failed to log notification activity:', error);
    }
  }
}

export const invoiceNotificationService = new InvoiceNotificationService();