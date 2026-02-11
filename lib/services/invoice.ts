/**
 * Invoice Management Service
 * Handles invoice creation, management, and automated generation
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Invoice Management System
 */

import { createClient } from '@/lib/supabase/client';
import { 
  Invoice, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest,
  InvoiceTemplate,
  CreateInvoiceTemplateRequest,
  PaymentRecord,
  CreatePaymentRecordRequest,
  InvoiceGenerationRequest,
  InvoiceGenerationResult,
  InvoiceFilters,
  InvoiceSortOptions,
  PaginatedInvoices,
  InvoiceAnalytics,
  InvoiceApprovalRequest,
  BulkInvoiceOperation,
  BulkOperationResult,
  InvoiceDeliveryOptions,
  InvoiceDeliveryResult,
  InvoiceItem,
  CreateInvoiceItemRequest
} from '@/lib/types/invoice';
import { TenantContext } from '@/lib/types/tenant';

export class InvoiceService {
  private supabase = createClient();

  /**
   * Invoice CRUD Operations
   */

  async createInvoice(
    request: CreateInvoiceRequest, 
    context: TenantContext
  ): Promise<Invoice> {
    // Set tenant context
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Calculate invoice items totals
    const processedItems = this.calculateItemTotals(request.items);
    
    // Calculate invoice totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.total_amount, 0);
    const discountAmount = request.discount_amount || 0;
    const taxAmount = processedItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Set default due date if not provided
    const dueDate = request.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const { data, error } = await this.supabase
      .from('invoices')
      .insert({
        tenant_id: context.tenant_id,
        customer_id: request.customer_id,
        customer_name: request.customer_name,
        customer_email: request.customer_email,
        customer_phone: request.customer_phone,
        customer_address: request.customer_address,
        contract_id: request.contract_id,
        lead_id: request.lead_id,
        items: processedItems,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: request.currency || 'BRL',
        payment_terms: request.payment_terms || '30 days',
        due_date: dueDate.toISOString().split('T')[0],
        payment_instructions: request.payment_instructions,
        template_id: request.template_id,
        custom_fields: request.custom_fields || {},
        notes: request.notes,
        footer_text: request.footer_text,
        created_by: context.user_id
      })
      .select(`
        *,
        template:invoice_templates(*),
        customer:leads!customer_id(*),
        lead:leads!lead_id(*),
        created_by_user:auth.users!created_by(id, email, raw_user_meta_data)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    const invoice = this.mapInvoiceFromDb(data);

    // Send webhook notification
    try {
      const { WebhookEvents } = await import('./webhook');
      await WebhookEvents.invoiceCreated(context.tenant_id, invoice);
    } catch (webhookError) {
      console.error('Failed to send invoice created webhook:', webhookError);
      // Don't fail the operation if webhook fails
    }

    // Auto-send if requested
    if (request.auto_send && request.send_to?.length) {
      await this.sendInvoice(data.id, {
        method: 'email',
        recipients: request.send_to,
        include_pdf: true,
        include_payment_link: true
      }, context);
    }

    return invoice;
  }

  async getInvoice(id: string, context: TenantContext): Promise<Invoice | null> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoices')
      .select(`
        *,
        template:invoice_templates(*),
        customer:leads!customer_id(*),
        lead:leads!lead_id(*),
        payments:payment_records(*),
        created_by_user:auth.users!created_by(id, email, raw_user_meta_data)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get invoice: ${error.message}`);
    }

    return this.mapInvoiceFromDb(data);
  }

  async updateInvoice(
    id: string, 
    request: UpdateInvoiceRequest, 
    context: TenantContext
  ): Promise<Invoice> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Process items if provided
    if (request.items) {
      const processedItems = this.calculateItemTotals(request.items);
      updateData.items = processedItems;
      
      // Recalculate totals
      const subtotal = processedItems.reduce((sum, item) => sum + item.total_amount, 0);
      const discountAmount = request.discount_amount || 0;
      const taxAmount = processedItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
      
      updateData.subtotal = subtotal;
      updateData.tax_amount = taxAmount;
      updateData.total_amount = subtotal - discountAmount + taxAmount;
    }

    // Update other fields
    Object.keys(request).forEach(key => {
      if (key !== 'items' && request[key as keyof UpdateInvoiceRequest] !== undefined) {
        updateData[key] = request[key as keyof UpdateInvoiceRequest];
      }
    });

    const { data, error } = await this.supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        template:invoice_templates(*),
        customer:leads!customer_id(*),
        lead:leads!lead_id(*),
        payments:payment_records(*),
        created_by_user:auth.users!created_by(id, email, raw_user_meta_data)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    return this.mapInvoiceFromDb(data);
  }

  async deleteInvoice(id: string, context: TenantContext): Promise<void> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { error } = await this.supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }

  /**
   * Invoice Generation Engine
   */

  async generateInvoice(
    request: InvoiceGenerationRequest,
    context: TenantContext
  ): Promise<InvoiceGenerationResult> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    let generatedFrom: 'contract' | 'lead' | 'manual' = 'manual';
    let autoPopulatedFields: string[] = [];
    let warnings: string[] = [];
    let errors: string[] = [];

    // Prepare invoice data
    const invoiceData: CreateInvoiceRequest = {
      customer_name: '',
      items: request.items || [],
      currency: request.currency || 'BRL',
      payment_terms: request.payment_terms || '30 days',
      template_id: request.template_id,
      custom_fields: request.custom_fields || {},
      notes: request.notes,
      footer_text: request.footer_text
    };

    // Set due date
    if (request.due_days) {
      invoiceData.due_date = new Date(Date.now() + request.due_days * 24 * 60 * 60 * 1000);
    }

    try {
      // Generate from contract if provided
      if (request.contract_id) {
        const contractData = await this.getContractData(request.contract_id, context);
        if (contractData) {
          generatedFrom = 'contract';
          invoiceData.contract_id = request.contract_id;
          invoiceData.customer_name = contractData.customer_name;
          invoiceData.customer_email = contractData.customer_email;
          invoiceData.customer_phone = contractData.customer_phone;
          invoiceData.customer_address = contractData.customer_address;
          
          // Auto-generate items from contract if not provided
          if (!request.items?.length && contractData.items) {
            invoiceData.items = contractData.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_percentage: item.tax_percentage
            }));
          }

          autoPopulatedFields.push('customer_name', 'customer_email', 'customer_phone', 'customer_address');
          if (!request.items?.length) {
            autoPopulatedFields.push('items');
          }
        } else {
          warnings.push('Contract not found, proceeding with manual data');
        }
      }

      // Generate from lead if provided and no contract
      if (request.lead_id && !request.contract_id) {
        const leadData = await this.getLeadData(request.lead_id, context);
        if (leadData) {
          generatedFrom = 'lead';
          invoiceData.lead_id = request.lead_id;
          invoiceData.customer_id = request.lead_id;
          invoiceData.customer_name = `${leadData.first_name} ${leadData.last_name}`;
          invoiceData.customer_email = leadData.email;
          invoiceData.customer_phone = leadData.phone;
          
          autoPopulatedFields.push('customer_name', 'customer_email', 'customer_phone');
        } else {
          warnings.push('Lead not found, proceeding with manual data');
        }
      }

      // Use provided customer data if available
      if (request.customer_data) {
        invoiceData.customer_name = request.customer_data.name;
        invoiceData.customer_email = request.customer_data.email;
        invoiceData.customer_phone = request.customer_data.phone;
        invoiceData.customer_address = request.customer_data.address;
      }

      // Validate required data
      if (!invoiceData.customer_name) {
        errors.push('Customer name is required');
      }

      if (!invoiceData.items?.length) {
        errors.push('At least one invoice item is required');
      }

      if (errors.length > 0) {
        throw new Error(`Invoice generation failed: ${errors.join(', ')}`);
      }

      // Create the invoice
      const invoice = await this.createInvoice(invoiceData, context);

      // Auto-approve if requested and conditions are met
      if (request.auto_approve) {
        try {
          await this.approveInvoice(invoice.id, {
            invoice_id: invoice.id,
            action: 'approve',
            comments: 'Auto-approved during generation'
          }, context);
        } catch (approvalError) {
          warnings.push('Auto-approval failed, invoice created but requires manual approval');
        }
      }

      // Auto-send if requested
      if (request.auto_send && request.send_to?.length) {
        try {
          await this.sendInvoice(invoice.id, {
            method: 'email',
            recipients: request.send_to,
            include_pdf: true,
            include_payment_link: true
          }, context);
        } catch (sendError) {
          warnings.push('Auto-send failed, invoice created but not sent');
        }
      }

      return {
        invoice,
        generated_from: generatedFrom,
        auto_populated_fields: autoPopulatedFields,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      throw new Error(`Invoice generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Invoice Template Management
   */

  async createTemplate(
    request: CreateInvoiceTemplateRequest,
    context: TenantContext
  ): Promise<InvoiceTemplate> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoice_templates')
      .insert({
        tenant_id: context.tenant_id,
        name: request.name,
        description: request.description,
        is_default: request.is_default || false,
        template_html: request.template_html,
        template_variables: request.template_variables || [],
        header_logo_url: request.header_logo_url,
        primary_color: request.primary_color || '#3b82f6',
        secondary_color: request.secondary_color || '#64748b',
        font_family: request.font_family || 'Inter, sans-serif',
        custom_css: request.custom_css,
        show_company_info: request.show_company_info !== false,
        show_customer_address: request.show_customer_address !== false,
        show_payment_terms: request.show_payment_terms !== false,
        show_notes: request.show_notes !== false,
        show_footer: request.show_footer !== false,
        created_by: context.user_id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice template: ${error.message}`);
    }

    return data;
  }

  async getTemplates(context: TenantContext): Promise<InvoiceTemplate[]> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('invoice_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      throw new Error(`Failed to get invoice templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Payment Management
   */

  async addPayment(
    request: CreatePaymentRecordRequest,
    context: TenantContext
  ): Promise<PaymentRecord> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const { data, error } = await this.supabase
      .from('payment_records')
      .insert({
        tenant_id: context.tenant_id,
        invoice_id: request.invoice_id,
        amount: request.amount,
        currency: request.currency || 'BRL',
        payment_method: request.payment_method,
        payment_date: request.payment_date || new Date().toISOString().split('T')[0],
        transaction_id: request.transaction_id,
        gateway_reference: request.gateway_reference,
        gateway_response: request.gateway_response,
        notes: request.notes,
        metadata: request.metadata || {},
        created_by: context.user_id
      })
      .select(`
        *,
        invoice:invoices(id, invoice_number, total_amount)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to add payment: ${error.message}`);
    }

    return data;
  }

  /**
   * Invoice Approval
   */

  async approveInvoice(
    invoiceId: string,
    request: InvoiceApprovalRequest,
    context: TenantContext
  ): Promise<Invoice> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    const updateData: any = {
      approval_status: request.action === 'approve' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString()
    };

    if (request.action === 'approve') {
      updateData.approved_by = context.user_id;
      updateData.approved_at = new Date().toISOString();
      updateData.status = 'approved';
    } else {
      updateData.rejection_reason = request.comments;
    }

    const { data, error } = await this.supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select(`
        *,
        template:invoice_templates(*),
        customer:leads!customer_id(*),
        lead:leads!lead_id(*),
        payments:payment_records(*),
        created_by_user:auth.users!created_by(id, email, raw_user_meta_data)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to ${request.action} invoice: ${error.message}`);
    }

    return this.mapInvoiceFromDb(data);
  }

  /**
   * Invoice Delivery
   */

  async sendInvoice(
    invoiceId: string,
    options: InvoiceDeliveryOptions,
    context: TenantContext
  ): Promise<InvoiceDeliveryResult> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get invoice data
    const invoice = await this.getInvoice(invoiceId, context);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create delivery log
    const { data: deliveryLog, error: logError } = await this.supabase
      .from('invoice_delivery_logs')
      .insert({
        tenant_id: context.tenant_id,
        invoice_id: invoiceId,
        delivery_method: options.method,
        recipients: options.recipients,
        subject: options.subject || `Invoice ${invoice.invoice_number}`,
        message: options.message,
        status: options.schedule_delivery ? 'scheduled' : 'pending',
        created_by: context.user_id
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create delivery log: ${logError.message}`);
    }

    // Update invoice status
    await this.supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_to: options.recipients,
        delivery_method: options.method
      })
      .eq('id', invoiceId);

    // TODO: Implement actual email sending logic here
    // For now, we'll simulate successful delivery

    // Update delivery log as sent
    await this.supabase
      .from('invoice_delivery_logs')
      .update({
        status: 'sent',
        delivered_at: new Date().toISOString()
      })
      .eq('id', deliveryLog.id);

    return {
      delivery_id: deliveryLog.id,
      status: 'sent',
      delivered_to: options.recipients,
      delivery_date: new Date(),
      tracking_urls: [] // TODO: Add tracking URLs when email service is implemented
    };
  }

  /**
   * Search and Analytics
   */

  async searchInvoices(
    filters: InvoiceFilters,
    sort: InvoiceSortOptions,
    page: number = 1,
    limit: number = 20,
    context: TenantContext
  ): Promise<PaginatedInvoices> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    let query = this.supabase
      .from('invoices')
      .select(`
        *,
        template:invoice_templates(id, name),
        customer:leads!customer_id(id, first_name, last_name, email),
        lead:leads!lead_id(id, first_name, last_name, email),
        created_by_user:auth.users!created_by(id, email, raw_user_meta_data)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters.customer_id?.length) {
      query = query.in('customer_id', filters.customer_id);
    }

    if (filters.search_query) {
      const searchFields = filters.search_fields || ['invoice_number', 'customer_name', 'customer_email'];
      const searchConditions = searchFields.map(field => 
        `${field}.ilike.%${filters.search_query}%`
      ).join(',');
      query = query.or(searchConditions);
    }

    if (filters.amount_min !== undefined) {
      query = query.gte('total_amount', filters.amount_min);
    }

    if (filters.amount_max !== undefined) {
      query = query.lte('total_amount', filters.amount_max);
    }

    if (filters.due_date_after) {
      query = query.gte('due_date', filters.due_date_after.toISOString().split('T')[0]);
    }

    if (filters.due_date_before) {
      query = query.lte('due_date', filters.due_date_before.toISOString().split('T')[0]);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to search invoices: ${error.message}`);
    }

    const invoices = (data || []).map(this.mapInvoiceFromDb);
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      invoices,
      total,
      page,
      limit,
      total_pages: totalPages,
      filters,
      sort
    };
  }

  async getAnalytics(context: TenantContext): Promise<InvoiceAnalytics> {
    await this.supabase.rpc('set_tenant_context', { tenant_uuid: context.tenant_id });

    // Get basic invoice statistics
    const { data: invoiceStats, error: statsError } = await this.supabase
      .from('invoices')
      .select('status, total_amount, created_at, customer_name, customer_id')
      .order('created_at', { ascending: false });

    if (statsError) {
      throw new Error(`Failed to get invoice analytics: ${statsError.message}`);
    }

    // Get payment statistics
    const { data: paymentStats, error: paymentError } = await this.supabase
      .from('payment_records')
      .select('amount, status, payment_date')
      .eq('status', 'completed');

    if (paymentError) {
      throw new Error(`Failed to get payment analytics: ${paymentError.message}`);
    }

    const invoices = invoiceStats || [];
    const payments = paymentStats || [];

    // Calculate totals
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
    const paidAmount = payments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    const outstandingAmount = totalAmount - paidAmount;
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

    // Group by status
    const statusGroups = invoices.reduce((acc, inv) => {
      const status = inv.status;
      if (!acc[status]) {
        acc[status] = { count: 0, total_amount: 0 };
      }
      acc[status].count++;
      acc[status].total_amount += parseFloat(inv.total_amount);
      return acc;
    }, {} as Record<string, { count: number; total_amount: number }>);

    const invoicesByStatus = Object.entries(statusGroups).map(([status, stats]) => ({
      status: status as any,
      count: stats.count,
      total_amount: stats.total_amount,
      percentage: totalInvoices > 0 ? (stats.count / totalInvoices) * 100 : 0
    }));

    // Calculate payment performance (simplified)
    const onTimePayments = payments.length; // Simplified - would need due date comparison
    const totalPaidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const onTimePaymentRate = totalPaidInvoices > 0 ? (onTimePayments / totalPaidInvoices) * 100 : 0;
    const overdueRate = totalInvoices > 0 ? (invoices.filter(inv => inv.status === 'overdue').length / totalInvoices) * 100 : 0;

    return {
      total_invoices: totalInvoices,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      overdue_amount: overdueAmount,
      invoices_by_status: invoicesByStatus,
      payment_performance: {
        avg_days_to_payment: 15, // Simplified - would need actual calculation
        on_time_payment_rate: onTimePaymentRate,
        overdue_rate: overdueRate
      },
      monthly_revenue: [], // TODO: Implement monthly grouping
      top_customers: [] // TODO: Implement customer grouping
    };
  }

  /**
   * Helper Methods
   */

  private calculateItemTotals(items: CreateInvoiceItemRequest[]): InvoiceItem[] {
    return items.map((item, index) => {
      const subtotal = item.quantity * item.unit_price;
      const discountAmount = item.discount_amount || (item.discount_percentage ? subtotal * (item.discount_percentage / 100) : 0);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = item.tax_amount || (item.tax_percentage ? taxableAmount * (item.tax_percentage / 100) : 0);
      const totalAmount = taxableAmount + taxAmount;

      return {
        id: `item_${index}`,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: discountAmount,
        tax_percentage: item.tax_percentage,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        metadata: item.metadata
      };
    });
  }

  private async getContractData(contractId: string, context: TenantContext): Promise<any> {
    // TODO: Implement contract data retrieval when contracts system is available
    // For now, return null to indicate contract not found
    return null;
  }

  private async getLeadData(leadId: string, context: TenantContext): Promise<any> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, company')
      .eq('id', leadId)
      .single();

    if (error) return null;
    return data;
  }

  private mapInvoiceFromDb(data: any): Invoice {
    return {
      id: data.id,
      tenant_id: data.tenant_id,
      invoice_number: data.invoice_number,
      reference_number: data.reference_number,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_address: data.customer_address,
      contract_id: data.contract_id,
      lead_id: data.lead_id,
      items: data.items || [],
      subtotal: parseFloat(data.subtotal),
      discount_amount: parseFloat(data.discount_amount || 0),
      tax_amount: parseFloat(data.tax_amount || 0),
      total_amount: parseFloat(data.total_amount),
      currency: data.currency,
      payment_terms: data.payment_terms,
      due_date: new Date(data.due_date),
      payment_instructions: data.payment_instructions,
      status: data.status,
      approval_status: data.approval_status,
      approved_by: data.approved_by,
      approved_at: data.approved_at ? new Date(data.approved_at) : undefined,
      rejection_reason: data.rejection_reason,
      sent_at: data.sent_at ? new Date(data.sent_at) : undefined,
      sent_to: data.sent_to || [],
      delivery_method: data.delivery_method,
      template_id: data.template_id,
      custom_fields: data.custom_fields || {},
      notes: data.notes,
      footer_text: data.footer_text,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      template: data.template,
      customer: data.customer,
      contract: data.contract,
      lead: data.lead,
      payments: data.payments,
      created_by_user: data.created_by_user
    };
  }
}

export const invoiceService = new InvoiceService();