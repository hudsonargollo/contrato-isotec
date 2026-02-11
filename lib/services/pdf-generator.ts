/**
 * PDF Generator Service
 * Generates PDF documents for invoices using Puppeteer
 * Requirements: 4.4 - Invoice PDF generation for email delivery
 */

import puppeteer from 'puppeteer';
import { createClient } from '@/lib/supabase/client';
import { Invoice, InvoiceTemplate } from '@/lib/types/invoice';
import { TenantContext } from '@/lib/types/tenant';

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
}

export interface PDFGenerationResult {
  buffer: Buffer;
  filename: string;
  size: number;
  generatedAt: Date;
}

export class PDFGeneratorService {
  private supabase = createClient();

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(
    invoice: Invoice,
    context: TenantContext,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      // Get invoice template
      const template = await this.getInvoiceTemplate(invoice.template_id, context);
      
      // Generate HTML content
      const htmlContent = await this.generateInvoiceHTML(invoice, template, context);
      
      // Generate PDF from HTML
      const pdfBuffer = await this.generatePDFFromHTML(htmlContent, {
        format: options.format || 'A4',
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate,
        footerTemplate: options.footerTemplate,
        printBackground: options.printBackground !== false
      });

      const filename = `invoice-${invoice.invoice_number}.pdf`;
      
      // Log PDF generation
      await this.logPDFGeneration({
        tenant_id: context.tenant_id,
        user_id: context.user_id,
        invoice_id: invoice.id,
        filename,
        size: pdfBuffer.length,
        status: 'success'
      });

      return {
        buffer: pdfBuffer,
        filename,
        size: pdfBuffer.length,
        generatedAt: new Date()
      };

    } catch (error) {
      // Log PDF generation failure
      await this.logPDFGeneration({
        tenant_id: context.tenant_id,
        user_id: context.user_id,
        invoice_id: invoice.id,
        filename: `invoice-${invoice.invoice_number}.pdf`,
        size: 0,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML content for invoice
   */
  private async generateInvoiceHTML(
    invoice: Invoice,
    template: InvoiceTemplate | null,
    context: TenantContext
  ): Promise<string> {
    // Get tenant branding
    const tenant = await this.getTenantBranding(context.tenant_id);
    
    // Use default template if none specified
    const htmlTemplate = template?.template_html || this.getDefaultInvoiceTemplate();
    
    // Prepare template variables
    const variables = {
      // Invoice data
      invoice_number: invoice.invoice_number,
      reference_number: invoice.reference_number || '',
      created_at: new Date(invoice.created_at).toLocaleDateString(),
      due_date: new Date(invoice.due_date).toLocaleDateString(),
      
      // Customer data
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email || '',
      customer_phone: invoice.customer_phone || '',
      customer_address: invoice.customer_address || {},
      
      // Financial data
      items: invoice.items,
      subtotal: invoice.subtotal.toFixed(2),
      discount_amount: invoice.discount_amount.toFixed(2),
      tax_amount: invoice.tax_amount.toFixed(2),
      total_amount: invoice.total_amount.toFixed(2),
      currency: invoice.currency,
      
      // Payment terms
      payment_terms: invoice.payment_terms,
      payment_instructions: invoice.payment_instructions || '',
      
      // Additional content
      notes: invoice.notes || '',
      footer_text: invoice.footer_text || '',
      
      // Template styling
      font_family: template?.font_family || 'Arial, sans-serif',
      primary_color: template?.primary_color || tenant?.branding?.primary_color || '#007bff',
      secondary_color: template?.secondary_color || tenant?.branding?.secondary_color || '#6c757d',
      header_logo_url: template?.header_logo_url || tenant?.branding?.logo_url || '',
      
      // Template flags
      show_company_info: template?.show_company_info !== false,
      show_customer_address: template?.show_customer_address !== false,
      show_payment_terms: template?.show_payment_terms !== false,
      show_notes: template?.show_notes !== false,
      show_footer: template?.show_footer !== false,
      
      // Company info
      company_name: tenant?.name || 'SolarCRM Pro',
      company_address: tenant?.settings?.address || '',
      company_phone: tenant?.settings?.phone || '',
      company_email: tenant?.settings?.email || '',
      company_website: tenant?.settings?.website || ''
    };

    // Process template with variables
    return this.processTemplate(htmlTemplate, variables);
  }

  /**
   * Generate PDF from HTML content
   */
  private async generatePDFFromHTML(
    htmlContent: string,
    options: PDFGenerationOptions
  ): Promise<Buffer> {
    let browser;
    
    try {
      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format as any,
        margin: options.margin,
        displayHeaderFooter: options.displayHeaderFooter,
        headerTemplate: options.headerTemplate,
        footerTemplate: options.footerTemplate,
        printBackground: options.printBackground
      });

      return Buffer.from(pdfBuffer);

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Get invoice template
   */
  private async getInvoiceTemplate(
    templateId: string | undefined,
    context: TenantContext
  ): Promise<InvoiceTemplate | null> {
    if (!templateId) return null;

    try {
      await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

      const { data, error } = await this.supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) return null;
      return data;

    } catch (error) {
      console.error('Failed to get invoice template:', error);
      return null;
    }
  }

  /**
   * Get tenant branding information
   */
  private async getTenantBranding(tenantId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('tenants')
        .select('name, branding, settings')
        .eq('id', tenantId)
        .single();

      if (error) return null;
      return data;

    } catch (error) {
      console.error('Failed to get tenant branding:', error);
      return null;
    }
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Replace simple variables {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    processed = processed.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    // Handle loops {{#each array}}...{{/each}}
    processed = processed.replace(/{{#each\s+(\w+)}}(.*?){{\/each}}/gs, (match, arrayName, itemTemplate) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemHtml = itemTemplate;
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          itemHtml = itemHtml.replace(regex, String(value || ''));
        });
        return itemHtml;
      }).join('');
    });

    // Handle nested object properties {{object.property}}
    processed = processed.replace(/{{(\w+)\.(\w+)}}/g, (match, objectName, propertyName) => {
      const obj = variables[objectName];
      if (obj && typeof obj === 'object' && obj[propertyName] !== undefined) {
        return String(obj[propertyName]);
      }
      return '';
    });

    return processed;
  }

  /**
   * Get default invoice template
   */
  private getDefaultInvoiceTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice {{invoice_number}}</title>
        <style>
          body {
            font-family: {{font_family}};
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          .header {
            background: {{primary_color}};
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 36px;
          }
          .logo {
            height: 60px;
            margin-bottom: 10px;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .invoice-details, .company-info {
            flex: 1;
          }
          .company-info {
            text-align: right;
          }
          .customer-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background: {{secondary_color}};
            color: white;
            font-weight: bold;
          }
          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .totals {
            text-align: right;
            margin: 30px 0;
          }
          .totals table {
            margin-left: auto;
            border-collapse: collapse;
          }
          .totals td {
            padding: 8px 15px;
            border-bottom: 1px solid #ddd;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 18px;
            background: {{primary_color}};
            color: white;
          }
          .payment-terms {
            background: #e9ecef;
            padding: 20px;
            border-radius: 5px;
            margin: 30px 0;
          }
          .notes {
            margin: 30px 0;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid {{primary_color}};
            text-align: center;
            color: #666;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .header { margin-bottom: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          {{#if header_logo_url}}
            <img src="{{header_logo_url}}" alt="Logo" class="logo">
          {{/if}}
          <h1>INVOICE</h1>
        </div>

        <div class="invoice-info">
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
            {{#if reference_number}}
            <p><strong>Reference:</strong> {{reference_number}}</p>
            {{/if}}
            <p><strong>Date:</strong> {{created_at}}</p>
            <p><strong>Due Date:</strong> {{due_date}}</p>
          </div>

          {{#if show_company_info}}
          <div class="company-info">
            <h3>{{company_name}}</h3>
            {{#if company_address}}<p>{{company_address}}</p>{{/if}}
            {{#if company_phone}}<p>Phone: {{company_phone}}</p>{{/if}}
            {{#if company_email}}<p>Email: {{company_email}}</p>{{/if}}
            {{#if company_website}}<p>Web: {{company_website}}</p>{{/if}}
          </div>
          {{/if}}
        </div>

        {{#if show_customer_address}}
        <div class="customer-info">
          <h3>Bill To:</h3>
          <p><strong>{{customer_name}}</strong></p>
          {{#if customer_email}}<p>{{customer_email}}</p>{{/if}}
          {{#if customer_phone}}<p>{{customer_phone}}</p>{{/if}}
          {{#if customer_address.street}}
          <p>{{customer_address.street}}</p>
          <p>{{customer_address.city}}, {{customer_address.state}} {{customer_address.zip_code}}</p>
          {{#if customer_address.country}}<p>{{customer_address.country}}</p>{{/if}}
          {{/if}}
        </div>
        {{/if}}

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{description}}</td>
              <td style="text-align: center;">{{quantity}}</td>
              <td style="text-align: right;">{{../currency}} {{unit_price}}</td>
              <td style="text-align: right;">{{../currency}} {{total_amount}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">{{currency}} {{subtotal}}</td>
            </tr>
            {{#if discount_amount}}
            <tr>
              <td>Discount:</td>
              <td style="text-align: right;">-{{currency}} {{discount_amount}}</td>
            </tr>
            {{/if}}
            {{#if tax_amount}}
            <tr>
              <td>Tax:</td>
              <td style="text-align: right;">{{currency}} {{tax_amount}}</td>
            </tr>
            {{/if}}
            <tr class="total-row">
              <td><strong>Total:</strong></td>
              <td style="text-align: right;"><strong>{{currency}} {{total_amount}}</strong></td>
            </tr>
          </table>
        </div>

        {{#if show_payment_terms}}
        <div class="payment-terms">
          <h3>Payment Terms</h3>
          <p>{{payment_terms}}</p>
          {{#if payment_instructions}}
          <p><strong>Payment Instructions:</strong></p>
          <p>{{payment_instructions}}</p>
          {{/if}}
        </div>
        {{/if}}

        {{#if show_notes}}
        {{#if notes}}
        <div class="notes">
          <h3>Notes</h3>
          <p>{{notes}}</p>
        </div>
        {{/if}}
        {{/if}}

        {{#if show_footer}}
        <div class="footer">
          {{#if footer_text}}<p>{{footer_text}}</p>{{/if}}
          <p>Thank you for your business!</p>
        </div>
        {{/if}}
      </body>
      </html>
    `;
  }

  /**
   * Log PDF generation activity
   */
  private async logPDFGeneration(data: {
    tenant_id: string;
    user_id: string;
    invoice_id: string;
    filename: string;
    size: number;
    status: 'success' | 'failed';
    error_message?: string;
  }): Promise<void> {
    try {
      await this.supabase
        .from('pdf_generation_logs')
        .insert({
          tenant_id: data.tenant_id,
          user_id: data.user_id,
          resource_type: 'invoice',
          resource_id: data.invoice_id,
          filename: data.filename,
          file_size: data.size,
          status: data.status,
          error_message: data.error_message,
          generated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log PDF generation:', error);
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();