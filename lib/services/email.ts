/**
 * Email Service
 * Handles email delivery for invoices and notifications
 * Requirements: 4.4 - Automated invoice delivery via email
 */

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailDeliveryResult {
  id: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  deliveredTo: string[];
  failedRecipients?: Array<{
    email: string;
    error: string;
  }>;
}

export class EmailService {
  private resend: Resend;
  private supabase = createClient();

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(apiKey);
  }

  /**
   * Send email with optional attachments
   */
  async sendEmail(
    options: SendEmailOptions,
    context: TenantContext
  ): Promise<EmailDeliveryResult> {
    try {
      // Get tenant information for from address
      const tenant = await this.getTenantInfo(context.tenant_id);
      const fromAddress = tenant?.email || process.env.DEFAULT_FROM_EMAIL || 'noreply@solarcrm.clubemkt.digital';
      const fromName = tenant?.name || 'SolarCRM Pro';

      // Send email via Resend
      const { data, error } = await this.resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        })),
        replyTo: options.replyTo,
        tags: options.tags
      });

      if (error) {
        throw new Error(`Email delivery failed: ${error.message}`);
      }

      // Log email delivery
      await this.logEmailDelivery({
        tenant_id: context.tenant_id,
        user_id: context.user_id,
        message_id: data?.id || '',
        recipients: options.to,
        subject: options.subject,
        status: 'sent',
        provider: 'resend',
        metadata: {
          cc: options.cc,
          bcc: options.bcc,
          tags: options.tags
        }
      });

      return {
        id: data?.id || '',
        status: 'sent',
        messageId: data?.id,
        deliveredTo: options.to
      };

    } catch (error) {
      // Log failed delivery
      await this.logEmailDelivery({
        tenant_id: context.tenant_id,
        user_id: context.user_id,
        message_id: '',
        recipients: options.to,
        subject: options.subject,
        status: 'failed',
        provider: 'resend',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          cc: options.cc,
          bcc: options.bcc,
          tags: options.tags
        }
      });

      return {
        id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveredTo: [],
        failedRecipients: options.to.map(email => ({
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      };
    }
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    invoiceId: string,
    recipients: string[],
    template: EmailTemplate,
    pdfBuffer: Buffer,
    context: TenantContext,
    options?: {
      includePaymentLink?: boolean;
      customMessage?: string;
      cc?: string[];
      bcc?: string[];
    }
  ): Promise<EmailDeliveryResult> {
    const attachments: EmailAttachment[] = [
      {
        filename: `invoice-${invoiceId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    // Add payment link to template if requested
    let emailHtml = template.html;
    if (options?.includePaymentLink) {
      const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}/pay`;
      emailHtml = emailHtml.replace(
        '{{payment_link}}',
        `<a href="${paymentLink}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Pay Invoice</a>`
      );
    }

    // Add custom message if provided
    if (options?.customMessage) {
      emailHtml = emailHtml.replace(
        '{{custom_message}}',
        `<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;"><p><strong>Message:</strong></p><p>${options.customMessage}</p></div>`
      );
    }

    return await this.sendEmail({
      to: recipients,
      cc: options?.cc,
      bcc: options?.bcc,
      subject: template.subject,
      html: emailHtml,
      text: template.text,
      attachments,
      tags: {
        type: 'invoice',
        invoice_id: invoiceId
      }
    }, context);
  }

  /**
   * Send invoice approval notification
   */
  async sendApprovalNotification(
    invoiceId: string,
    approverEmails: string[],
    template: EmailTemplate,
    context: TenantContext
  ): Promise<EmailDeliveryResult> {
    return await this.sendEmail({
      to: approverEmails,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: {
        type: 'approval_notification',
        invoice_id: invoiceId
      }
    }, context);
  }

  /**
   * Send invoice status update notification
   */
  async sendStatusUpdateNotification(
    invoiceId: string,
    recipients: string[],
    template: EmailTemplate,
    context: TenantContext
  ): Promise<EmailDeliveryResult> {
    return await this.sendEmail({
      to: recipients,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: {
        type: 'status_update',
        invoice_id: invoiceId
      }
    }, context);
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    invoiceId: string,
    customerEmail: string,
    template: EmailTemplate,
    context: TenantContext
  ): Promise<EmailDeliveryResult> {
    return await this.sendEmail({
      to: [customerEmail],
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: {
        type: 'payment_confirmation',
        invoice_id: invoiceId
      }
    }, context);
  }

  /**
   * Get email delivery status from provider
   */
  async getDeliveryStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
    timestamp?: Date;
    details?: any;
  }> {
    try {
      // Note: Resend doesn't provide a direct API to get email status
      // This would need to be implemented via webhooks
      // For now, return basic status
      return {
        status: 'sent',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate email addresses
   */
  validateEmailAddresses(emails: string[]): {
    valid: string[];
    invalid: Array<{ email: string; reason: string }>;
  } {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const valid: string[] = [];
    const invalid: Array<{ email: string; reason: string }> = [];

    emails.forEach(email => {
      const trimmedEmail = email.trim().toLowerCase();
      
      if (!trimmedEmail) {
        invalid.push({ email, reason: 'Empty email address' });
      } else if (!emailRegex.test(trimmedEmail)) {
        invalid.push({ email, reason: 'Invalid email format' });
      } else if (trimmedEmail.length > 254) {
        invalid.push({ email, reason: 'Email address too long' });
      } else {
        valid.push(trimmedEmail);
      }
    });

    return { valid, invalid };
  }

  /**
   * Create email templates for different invoice scenarios
   */
  createInvoiceEmailTemplate(
    invoice: any,
    templateType: 'new_invoice' | 'reminder' | 'overdue' | 'payment_received',
    tenantName: string,
    customMessage?: string
  ): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;
    const paymentUrl = `${baseUrl}/invoices/${invoice.id}/pay`;

    const templates = {
      new_invoice: {
        subject: `Invoice ${invoice.invoice_number} from ${tenantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center;">
              <h1 style="color: #333; margin: 0;">New Invoice</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${invoice.customer_name},</p>
              
              <p>We have generated a new invoice for you:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0;">${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Amount:</strong></td>
                    <td style="padding: 5px 0;">${invoice.currency} ${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Due Date:</strong></td>
                    <td style="padding: 5px 0;">${new Date(invoice.due_date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Payment Terms:</strong></td>
                    <td style="padding: 5px 0;">${invoice.payment_terms}</td>
                  </tr>
                </table>
              </div>
              
              {{custom_message}}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">View Invoice</a>
                {{payment_link}}
              </div>
              
              <p>The invoice is attached to this email as a PDF.</p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>${tenantName}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        `,
        text: `
          New Invoice from ${tenantName}
          
          Dear ${invoice.customer_name},
          
          We have generated a new invoice for you:
          
          Invoice Number: ${invoice.invoice_number}
          Amount: ${invoice.currency} ${invoice.total_amount.toFixed(2)}
          Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
          Payment Terms: ${invoice.payment_terms}
          
          ${customMessage ? `Message: ${customMessage}` : ''}
          
          View Invoice: ${invoiceUrl}
          Pay Invoice: ${paymentUrl}
          
          The invoice is attached to this email as a PDF.
          
          If you have any questions, please don't hesitate to contact us.
          
          Best regards,
          ${tenantName}
        `
      },
      
      reminder: {
        subject: `Payment Reminder: Invoice ${invoice.invoice_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fff3cd; padding: 20px; text-align: center;">
              <h1 style="color: #856404; margin: 0;">Payment Reminder</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${invoice.customer_name},</p>
              
              <p>This is a friendly reminder that your invoice is due soon:</p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0;">${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Amount Due:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold; color: #856404;">${invoice.currency} ${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Due Date:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>
              
              {{custom_message}}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">View Invoice</a>
                {{payment_link}}
              </div>
              
              <p>Please ensure payment is made by the due date to avoid any late fees.</p>
              
              <p>Thank you for your prompt attention to this matter.</p>
              
              <p>Best regards,<br>${tenantName}</p>
            </div>
          </div>
        `,
        text: `
          Payment Reminder - Invoice ${invoice.invoice_number}
          
          Dear ${invoice.customer_name},
          
          This is a friendly reminder that your invoice is due soon:
          
          Invoice Number: ${invoice.invoice_number}
          Amount Due: ${invoice.currency} ${invoice.total_amount.toFixed(2)}
          Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
          
          ${customMessage ? `Message: ${customMessage}` : ''}
          
          View Invoice: ${invoiceUrl}
          Pay Invoice: ${paymentUrl}
          
          Please ensure payment is made by the due date to avoid any late fees.
          
          Thank you for your prompt attention to this matter.
          
          Best regards,
          ${tenantName}
        `
      },
      
      overdue: {
        subject: `OVERDUE: Invoice ${invoice.invoice_number} - Immediate Action Required`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8d7da; padding: 20px; text-align: center;">
              <h1 style="color: #721c24; margin: 0;">Invoice Overdue</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${invoice.customer_name},</p>
              
              <p><strong>Your invoice is now overdue and requires immediate attention:</strong></p>
              
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0;">${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Amount Due:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold; color: #721c24; font-size: 18px;">${invoice.currency} ${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Original Due Date:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold; color: #721c24;">${new Date(invoice.due_date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Days Overdue:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold; color: #721c24;">${Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} days</td>
                  </tr>
                </table>
              </div>
              
              {{custom_message}}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">View Invoice</a>
                {{payment_link}}
              </div>
              
              <p><strong>Please make payment immediately to avoid additional late fees and potential service interruption.</strong></p>
              
              <p>If you have already made payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please contact us immediately.</p>
              
              <p>Best regards,<br>${tenantName}</p>
            </div>
          </div>
        `,
        text: `
          OVERDUE INVOICE - Immediate Action Required
          
          Dear ${invoice.customer_name},
          
          Your invoice is now overdue and requires immediate attention:
          
          Invoice Number: ${invoice.invoice_number}
          Amount Due: ${invoice.currency} ${invoice.total_amount.toFixed(2)}
          Original Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
          Days Overdue: ${Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} days
          
          ${customMessage ? `Message: ${customMessage}` : ''}
          
          View Invoice: ${invoiceUrl}
          Pay Invoice: ${paymentUrl}
          
          Please make payment immediately to avoid additional late fees and potential service interruption.
          
          If you have already made payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please contact us immediately.
          
          Best regards,
          ${tenantName}
        `
      },
      
      payment_received: {
        subject: `Payment Received: Invoice ${invoice.invoice_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #d4edda; padding: 20px; text-align: center;">
              <h1 style="color: #155724; margin: 0;">Payment Received</h1>
            </div>
            
            <div style="padding: 20px;">
              <p>Dear ${invoice.customer_name},</p>
              
              <p>Thank you! We have received your payment for the following invoice:</p>
              
              <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0;">${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Amount Paid:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold; color: #155724;">${invoice.currency} ${invoice.total_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Payment Date:</strong></td>
                    <td style="padding: 5px 0;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Status:</strong></td>
                    <td style="padding: 5px 0; font-weight: bold; color: #155724;">PAID</td>
                  </tr>
                </table>
              </div>
              
              {{custom_message}}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Receipt</a>
              </div>
              
              <p>Your payment has been processed and your account has been updated accordingly.</p>
              
              <p>Thank you for your business!</p>
              
              <p>Best regards,<br>${tenantName}</p>
            </div>
          </div>
        `,
        text: `
          Payment Received - Invoice ${invoice.invoice_number}
          
          Dear ${invoice.customer_name},
          
          Thank you! We have received your payment for the following invoice:
          
          Invoice Number: ${invoice.invoice_number}
          Amount Paid: ${invoice.currency} ${invoice.total_amount.toFixed(2)}
          Payment Date: ${new Date().toLocaleDateString()}
          Status: PAID
          
          ${customMessage ? `Message: ${customMessage}` : ''}
          
          View Receipt: ${invoiceUrl}
          
          Your payment has been processed and your account has been updated accordingly.
          
          Thank you for your business!
          
          Best regards,
          ${tenantName}
        `
      }
    };

    return templates[templateType];
  }

  /**
   * Private helper methods
   */

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

  private async logEmailDelivery(data: {
    tenant_id: string;
    user_id: string;
    message_id: string;
    recipients: string[];
    subject: string;
    status: 'sent' | 'failed';
    provider: string;
    error_message?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.supabase
        .from('email_logs')
        .insert({
          tenant_id: data.tenant_id,
          user_id: data.user_id,
          message_id: data.message_id,
          recipients: data.recipients,
          subject: data.subject,
          status: data.status,
          provider: data.provider,
          error_message: data.error_message,
          metadata: data.metadata || {}
        });
    } catch (error) {
      console.error('Failed to log email delivery:', error);
    }
  }
}

export const emailService = new EmailService();
// Export specific email functions for backward compatibility
export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  context: TenantContext
): Promise<EmailDeliveryResult> {
  return await emailService.sendEmail({
    to: [email],
    subject: 'Código de Verificação - SolarCRM Pro',
    html: `
      <h2>Código de Verificação</h2>
      <p>Seu código de verificação é: <strong>${verificationCode}</strong></p>
      <p>Este código expira em 10 minutos.</p>
    `,
    text: `Seu código de verificação é: ${verificationCode}. Este código expira em 10 minutos.`
  }, context);
}

export async function sendContractSignedNotification(
  email: string,
  contractId: string,
  context: TenantContext
): Promise<EmailDeliveryResult> {
  return await emailService.sendEmail({
    to: [email],
    subject: 'Contrato Assinado - SolarCRM Pro',
    html: `
      <h2>Contrato Assinado com Sucesso</h2>
      <p>O contrato ${contractId} foi assinado com sucesso.</p>
      <p>Você pode visualizar o contrato em sua área do cliente.</p>
    `,
    text: `O contrato ${contractId} foi assinado com sucesso. Você pode visualizar o contrato em sua área do cliente.`
  }, context);
}