/**
 * Invoice Delivery Service
 * Handles automated invoice delivery via email with PDF attachments
 * Requirements: 4.4 - Automated invoice delivery system
 */

import { createClient } from '@/lib/supabase/client';
import { Invoice, InvoiceDeliveryOptions, InvoiceDeliveryResult } from '@/lib/types/invoice';
import { TenantContext } from '@/lib/types/tenant';
import { emailService, EmailTemplate } from './email';
import { pdfGeneratorService } from './pdf-generator';
import { invoiceService } from './invoice';

export interface DeliverySchedule {
  immediate?: boolean;
  scheduled_at?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    end_date?: Date;
  };
}

export interface DeliveryPreferences {
  auto_send_new_invoices: boolean;
  send_payment_reminders: boolean;
  reminder_days_before_due: number[];
  send_overdue_notices: boolean;
  overdue_notice_frequency: number; // days
  include_pdf_attachment: boolean;
  include_payment_link: boolean;
  custom_email_template?: string;
  cc_emails?: string[];
  bcc_emails?: string[];
}

export interface BulkDeliveryRequest {
  invoice_ids: string[];
  delivery_options: InvoiceDeliveryOptions;
  schedule?: DeliverySchedule;
}

export interface BulkDeliveryResult {
  total_invoices: number;
  successful_deliveries: number;
  failed_deliveries: number;
  results: Array<{
    invoice_id: string;
    status: 'success' | 'failed';
    delivery_result?: InvoiceDeliveryResult;
    error?: string;
  }>;
}

export class InvoiceDeliveryService {
  private supabase = createClient();

  /**
   * Send single invoice via email
   */
  async sendInvoice(
    invoiceId: string,
    options: InvoiceDeliveryOptions,
    context: TenantContext
  ): Promise<InvoiceDeliveryResult> {
    try {
      // Get invoice data
      const invoice = await invoiceService.getInvoice(invoiceId, context);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Validate recipients
      const validation = emailService.validateEmailAddresses(options.recipients);
      if (validation.invalid.length > 0) {
        throw new Error(`Invalid email addresses: ${validation.invalid.map(i => i.email).join(', ')}`);
      }

      // Generate PDF if required
      let pdfBuffer: Buffer | undefined;
      if (options.include_pdf) {
        const pdfResult = await pdfGeneratorService.generateInvoicePDF(invoice, context);
        pdfBuffer = pdfResult.buffer;
      }

      // Get tenant name for email template
      const tenant = await this.getTenantInfo(context.tenant_id);
      const tenantName = tenant?.name || 'SolarCRM Pro';

      // Create email template
      const emailTemplate = this.createDeliveryEmailTemplate(
        invoice,
        tenantName,
        options.message,
        options.include_payment_link
      );

      // Send email
      const emailResult = await emailService.sendInvoiceEmail(
        invoiceId,
        validation.valid,
        emailTemplate,
        pdfBuffer!,
        context,
        {
          includePaymentLink: options.include_payment_link,
          customMessage: options.message
        }
      );

      // Update invoice delivery status
      await this.updateInvoiceDeliveryStatus(invoiceId, {
        status: 'sent',
        sent_at: new Date(),
        sent_to: validation.valid,
        delivery_method: options.method
      }, context);

      // Log delivery
      const deliveryLog = await this.createDeliveryLog({
        tenant_id: context.tenant_id,
        invoice_id: invoiceId,
        delivery_method: options.method,
        recipients: validation.valid,
        subject: emailTemplate.subject,
        message: options.message,
        status: emailResult.status === 'sent' ? 'sent' : 'failed',
        delivered_at: emailResult.status === 'sent' ? new Date() : undefined,
        failed_recipients: emailResult.failedRecipients || [],
        created_by: context.user_id
      });

      return {
        delivery_id: deliveryLog.id,
        status: emailResult.status,
        delivered_to: emailResult.deliveredTo,
        failed_recipients: emailResult.failedRecipients,
        delivery_date: new Date(),
        tracking_urls: [] // TODO: Add email tracking URLs
      };

    } catch (error) {
      // Log failed delivery
      await this.createDeliveryLog({
        tenant_id: context.tenant_id,
        invoice_id: invoiceId,
        delivery_method: options.method,
        recipients: options.recipients,
        subject: options.subject || `Invoice ${invoiceId}`,
        message: options.message,
        status: 'failed',
        failed_recipients: options.recipients.map(email => ({
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        created_by: context.user_id
      });

      throw error;
    }
  }

  /**
   * Send bulk invoices
   */
  async sendBulkInvoices(
    request: BulkDeliveryRequest,
    context: TenantContext
  ): Promise<BulkDeliveryResult> {
    const results: BulkDeliveryResult['results'] = [];
    let successCount = 0;
    let failCount = 0;

    for (const invoiceId of request.invoice_ids) {
      try {
        const deliveryResult = await this.sendInvoice(invoiceId, request.delivery_options, context);
        
        results.push({
          invoice_id: invoiceId,
          status: 'success',
          delivery_result: deliveryResult
        });
        
        successCount++;
      } catch (error) {
        results.push({
          invoice_id: invoiceId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        failCount++;
      }
    }

    return {
      total_invoices: request.invoice_ids.length,
      successful_deliveries: successCount,
      failed_deliveries: failCount,
      results
    };
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    invoiceId: string,
    reminderType: 'gentle' | 'urgent' | 'final',
    customMessage?: string,
    context: TenantContext
  ): Promise<InvoiceDeliveryResult> {
    const invoice = await invoiceService.getInvoice(invoiceId, context);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.customer_email) {
      throw new Error('Customer email not available');
    }

    // Determine template type based on reminder type and due date
    const daysOverdue = Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
    let templateType: 'reminder' | 'overdue';
    
    if (daysOverdue > 0) {
      templateType = 'overdue';
    } else {
      templateType = 'reminder';
    }

    // Get tenant name
    const tenant = await this.getTenantInfo(context.tenant_id);
    const tenantName = tenant?.name || 'SolarCRM Pro';

    // Create email template
    const emailTemplate = emailService.createInvoiceEmailTemplate(
      invoice,
      templateType,
      tenantName,
      customMessage
    );

    // Generate PDF
    const pdfResult = await pdfGeneratorService.generateInvoicePDF(invoice, context);

    // Send email
    const emailResult = await emailService.sendInvoiceEmail(
      invoiceId,
      [invoice.customer_email],
      emailTemplate,
      pdfResult.buffer,
      context,
      {
        includePaymentLink: true,
        customMessage
      }
    );

    // Log reminder
    await this.createDeliveryLog({
      tenant_id: context.tenant_id,
      invoice_id: invoiceId,
      delivery_method: 'email',
      recipients: [invoice.customer_email],
      subject: emailTemplate.subject,
      message: customMessage,
      status: emailResult.status === 'sent' ? 'sent' : 'failed',
      delivered_at: emailResult.status === 'sent' ? new Date() : undefined,
      failed_recipients: emailResult.failedRecipients || [],
      metadata: {
        reminder_type: reminderType,
        days_overdue: daysOverdue
      },
      created_by: context.user_id
    });

    return {
      delivery_id: emailResult.id,
      status: emailResult.status,
      delivered_to: emailResult.deliveredTo,
      failed_recipients: emailResult.failedRecipients,
      delivery_date: new Date()
    };
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    invoiceId: string,
    paymentAmount: number,
    paymentMethod: string,
    context: TenantContext
  ): Promise<InvoiceDeliveryResult> {
    const invoice = await invoiceService.getInvoice(invoiceId, context);
    if (!invoice || !invoice.customer_email) {
      throw new Error('Invoice or customer email not found');
    }

    // Get tenant name
    const tenant = await this.getTenantInfo(context.tenant_id);
    const tenantName = tenant?.name || 'SolarCRM Pro';

    // Create payment confirmation template
    const emailTemplate = emailService.createInvoiceEmailTemplate(
      invoice,
      'payment_received',
      tenantName
    );

    // Send confirmation email
    const emailResult = await emailService.sendPaymentConfirmation(
      invoiceId,
      invoice.customer_email,
      emailTemplate,
      context
    );

    // Log confirmation
    await this.createDeliveryLog({
      tenant_id: context.tenant_id,
      invoice_id: invoiceId,
      delivery_method: 'email',
      recipients: [invoice.customer_email],
      subject: emailTemplate.subject,
      status: emailResult.status === 'sent' ? 'sent' : 'failed',
      delivered_at: emailResult.status === 'sent' ? new Date() : undefined,
      metadata: {
        type: 'payment_confirmation',
        payment_amount: paymentAmount,
        payment_method: paymentMethod
      },
      created_by: context.user_id
    });

    return {
      delivery_id: emailResult.id,
      status: emailResult.status,
      delivered_to: emailResult.deliveredTo,
      delivery_date: new Date()
    };
  }

  /**
   * Schedule automatic invoice delivery
   */
  async scheduleInvoiceDelivery(
    invoiceId: string,
    options: InvoiceDeliveryOptions,
    schedule: DeliverySchedule,
    context: TenantContext
  ): Promise<{ scheduled_id: string; scheduled_at: Date }> {
    const scheduledAt = schedule.scheduled_at || new Date();

    const { data, error } = await this.supabase
      .from('scheduled_deliveries')
      .insert({
        tenant_id: context.tenant_id,
        invoice_id: invoiceId,
        delivery_options: options,
        scheduled_at: scheduledAt.toISOString(),
        recurring_config: schedule.recurring,
        status: 'scheduled',
        created_by: context.user_id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to schedule delivery: ${error.message}`);
    }

    return {
      scheduled_id: data.id,
      scheduled_at: scheduledAt
    };
  }

  /**
   * Get delivery preferences for tenant
   */
  async getDeliveryPreferences(context: TenantContext): Promise<DeliveryPreferences> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('tenant_settings')
      .select('delivery_preferences')
      .eq('tenant_id', context.tenant_id)
      .single();

    if (error || !data?.delivery_preferences) {
      // Return default preferences
      return {
        auto_send_new_invoices: false,
        send_payment_reminders: true,
        reminder_days_before_due: [7, 3, 1],
        send_overdue_notices: true,
        overdue_notice_frequency: 7,
        include_pdf_attachment: true,
        include_payment_link: true
      };
    }

    return data.delivery_preferences;
  }

  /**
   * Update delivery preferences
   */
  async updateDeliveryPreferences(
    preferences: Partial<DeliveryPreferences>,
    context: TenantContext
  ): Promise<DeliveryPreferences> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get current preferences
    const currentPreferences = await this.getDeliveryPreferences(context);
    const updatedPreferences = { ...currentPreferences, ...preferences };

    const { error } = await this.supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: context.tenant_id,
        delivery_preferences: updatedPreferences
      });

    if (error) {
      throw new Error(`Failed to update delivery preferences: ${error.message}`);
    }

    return updatedPreferences;
  }

  /**
   * Get delivery history for invoice
   */
  async getDeliveryHistory(
    invoiceId: string,
    context: TenantContext
  ): Promise<Array<{
    id: string;
    delivery_method: string;
    recipients: string[];
    status: string;
    delivered_at?: Date;
    failed_recipients?: any[];
    created_at: Date;
  }>> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoice_delivery_logs')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get delivery history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Process scheduled deliveries (called by cron job)
   */
  async processScheduledDeliveries(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    // Get scheduled deliveries that are due
    const { data: scheduledDeliveries, error } = await this.supabase
      .from('scheduled_deliveries')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to get scheduled deliveries: ${error.message}`);
    }

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const delivery of scheduledDeliveries || []) {
      processed++;

      try {
        const context: TenantContext = {
          tenant_id: delivery.tenant_id,
          user_id: delivery.created_by
        };

        await this.sendInvoice(
          delivery.invoice_id,
          delivery.delivery_options,
          context
        );

        // Update scheduled delivery status
        await this.supabase
          .from('scheduled_deliveries')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', delivery.id);

        successful++;

      } catch (error) {
        // Update scheduled delivery status as failed
        await this.supabase
          .from('scheduled_deliveries')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', delivery.id);

        failed++;
      }
    }

    return { processed, successful, failed };
  }

  /**
   * Private helper methods
   */

  private createDeliveryEmailTemplate(
    invoice: Invoice,
    tenantName: string,
    customMessage?: string,
    includePaymentLink: boolean = true
  ): EmailTemplate {
    return emailService.createInvoiceEmailTemplate(
      invoice,
      'new_invoice',
      tenantName,
      customMessage
    );
  }

  private async updateInvoiceDeliveryStatus(
    invoiceId: string,
    updates: {
      status: string;
      sent_at: Date;
      sent_to: string[];
      delivery_method: string;
    },
    context: TenantContext
  ): Promise<void> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    await this.supabase
      .from('invoices')
      .update({
        status: updates.status,
        sent_at: updates.sent_at.toISOString(),
        sent_to: updates.sent_to,
        delivery_method: updates.delivery_method
      })
      .eq('id', invoiceId);
  }

  private async createDeliveryLog(data: {
    tenant_id: string;
    invoice_id: string;
    delivery_method: string;
    recipients: string[];
    subject?: string;
    message?: string;
    status: string;
    delivered_at?: Date;
    failed_recipients?: Array<{ email: string; error: string }>;
    metadata?: any;
    created_by: string;
  }): Promise<{ id: string }> {
    const { data: log, error } = await this.supabase
      .from('invoice_delivery_logs')
      .insert({
        tenant_id: data.tenant_id,
        invoice_id: data.invoice_id,
        delivery_method: data.delivery_method,
        recipients: data.recipients,
        subject: data.subject,
        message: data.message,
        status: data.status,
        delivered_at: data.delivered_at?.toISOString(),
        failed_recipients: data.failed_recipients || [],
        metadata: data.metadata || {},
        created_by: data.created_by
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create delivery log: ${error.message}`);
    }

    return log;
  }

  private async getTenantInfo(tenantId: string): Promise<{ name: string; email?: string } | null> {
    try {
      const { data, error } = await this.supabase
        .from('tenants')
        .select('name, settings')
        .eq('id', tenantId)
        .single();

      if (error || !data) return null;

      return {
        name: data.name,
        email: data.settings?.email
      };
    } catch (error) {
      console.error('Failed to get tenant info:', error);
      return null;
    }
  }
}

export const invoiceDeliveryService = new InvoiceDeliveryService();