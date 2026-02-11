/**
 * Invoice Management System Types
 * TypeScript interfaces for the invoice management system
 * Requirements: 4.1, 4.2, 4.3, 4.4 - Invoice Management System
 */

// Invoice Status Types
export type InvoiceStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'pix' | 'boleto' | 'cash' | 'check';

// Invoice Item Types
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  total_amount: number;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceItemRequest {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  metadata?: Record<string, any>;
}

// Invoice Types
export interface Invoice {
  id: string;
  tenant_id: string;
  
  // Invoice Identification
  invoice_number: string;
  reference_number?: string;
  
  // Customer Information
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  // Related Records
  contract_id?: string;
  lead_id?: string;
  
  // Invoice Details
  items: InvoiceItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Payment Terms
  payment_terms: string;
  due_date: Date;
  payment_instructions?: string;
  
  // Status and Workflow
  status: InvoiceStatus;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  
  // Delivery Information
  sent_at?: Date;
  sent_to?: string[];
  delivery_method?: 'email' | 'portal' | 'manual';
  
  // Template and Branding
  template_id?: string;
  custom_fields?: Record<string, any>;
  notes?: string;
  footer_text?: string;
  
  // Audit Fields
  created_by: string;
  created_at: Date;
  updated_at: Date;
  
  // Related Data (populated via joins)
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  contract?: {
    id: string;
    contract_number: string;
    title: string;
  };
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  template?: InvoiceTemplate;
  payments?: PaymentRecord[];
  created_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface CreateInvoiceRequest {
  // Customer Information
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  // Related Records
  contract_id?: string;
  lead_id?: string;
  
  // Invoice Details
  items: CreateInvoiceItemRequest[];
  discount_amount?: number;
  currency?: string;
  
  // Payment Terms
  payment_terms?: string;
  due_date?: Date;
  payment_instructions?: string;
  
  // Template and Customization
  template_id?: string;
  custom_fields?: Record<string, any>;
  notes?: string;
  footer_text?: string;
  
  // Auto-generation options
  auto_send?: boolean;
  send_to?: string[];
}

export interface UpdateInvoiceRequest {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  items?: CreateInvoiceItemRequest[];
  discount_amount?: number;
  payment_terms?: string;
  due_date?: Date;
  payment_instructions?: string;
  template_id?: string;
  custom_fields?: Record<string, any>;
  notes?: string;
  footer_text?: string;
  status?: InvoiceStatus;
}

// Invoice Template Types
export interface InvoiceTemplate {
  id: string;
  tenant_id: string;
  
  // Template Information
  name: string;
  description?: string;
  is_default: boolean;
  
  // Template Content
  template_html: string;
  template_variables: TemplateVariable[];
  
  // Styling and Branding
  header_logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  custom_css?: string;
  
  // Layout Configuration
  show_company_info: boolean;
  show_customer_address: boolean;
  show_payment_terms: boolean;
  show_notes: boolean;
  show_footer: boolean;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'address';
  required: boolean;
  default_value?: any;
  description?: string;
}

export interface CreateInvoiceTemplateRequest {
  name: string;
  description?: string;
  is_default?: boolean;
  template_html: string;
  template_variables?: TemplateVariable[];
  header_logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  custom_css?: string;
  show_company_info?: boolean;
  show_customer_address?: boolean;
  show_payment_terms?: boolean;
  show_notes?: boolean;
  show_footer?: boolean;
}

// Payment Record Types
export interface PaymentRecord {
  id: string;
  tenant_id: string;
  invoice_id: string;
  
  // Payment Details
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_date: Date;
  
  // Transaction Information
  transaction_id?: string;
  gateway_reference?: string;
  gateway_response?: Record<string, any>;
  
  // Status and Processing
  status: PaymentStatus;
  processed_at?: Date;
  failure_reason?: string;
  
  // Reconciliation
  reconciled: boolean;
  reconciled_at?: Date;
  reconciled_by?: string;
  
  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
  
  // Audit Fields
  created_by: string;
  created_at: Date;
  updated_at: Date;
  
  // Related Data (populated via joins)
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
  };
}

export interface CreatePaymentRecordRequest {
  invoice_id: string;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  payment_date?: Date;
  transaction_id?: string;
  gateway_reference?: string;
  gateway_response?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
}

// Invoice Generation Types
export interface InvoiceGenerationRequest {
  // Source Data
  contract_id?: string;
  lead_id?: string;
  customer_data?: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
  };
  
  // Invoice Configuration
  template_id?: string;
  payment_terms?: string;
  due_days?: number;
  currency?: string;
  
  // Items (if not auto-generated from contract)
  items?: CreateInvoiceItemRequest[];
  
  // Customization
  custom_fields?: Record<string, any>;
  notes?: string;
  footer_text?: string;
  
  // Workflow Options
  auto_approve?: boolean;
  auto_send?: boolean;
  send_to?: string[];
}

export interface InvoiceGenerationResult {
  invoice: Invoice;
  generated_from: 'contract' | 'lead' | 'manual';
  auto_populated_fields: string[];
  warnings?: string[];
  errors?: string[];
}

// Search and Filter Types
export interface InvoiceFilters {
  status?: InvoiceStatus[];
  customer_id?: string[];
  contract_id?: string[];
  lead_id?: string[];
  template_id?: string[];
  created_by?: string[];
  amount_min?: number;
  amount_max?: number;
  due_date_after?: Date;
  due_date_before?: Date;
  created_after?: Date;
  created_before?: Date;
  search_query?: string;
  search_fields?: ('invoice_number' | 'customer_name' | 'customer_email' | 'reference_number')[];
}

export interface InvoiceSortOptions {
  field: 'created_at' | 'updated_at' | 'due_date' | 'total_amount' | 'invoice_number' | 'customer_name';
  direction: 'asc' | 'desc';
}

export interface PaginatedInvoices {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters?: InvoiceFilters;
  sort?: InvoiceSortOptions;
}

// Analytics and Reporting Types
export interface InvoiceAnalytics {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  overdue_amount: number;
  
  invoices_by_status: Array<{
    status: InvoiceStatus;
    count: number;
    total_amount: number;
    percentage: number;
  }>;
  
  payment_performance: {
    avg_days_to_payment: number;
    on_time_payment_rate: number;
    overdue_rate: number;
  };
  
  monthly_revenue: Array<{
    month: string;
    invoiced_amount: number;
    paid_amount: number;
    invoice_count: number;
  }>;
  
  top_customers: Array<{
    customer_id?: string;
    customer_name: string;
    invoice_count: number;
    total_amount: number;
    avg_payment_days: number;
  }>;
}

// Approval Workflow Types
export interface InvoiceApprovalWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  
  // Workflow Configuration
  approval_steps: ApprovalStep[];
  auto_approve_threshold?: number;
  require_approval_above?: number;
  
  // Conditions
  conditions: WorkflowCondition[];
  
  // Status
  is_active: boolean;
  is_default: boolean;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface ApprovalStep {
  step_order: number;
  approver_role?: string;
  approver_user_id?: string;
  required: boolean;
  auto_approve_conditions?: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_list';
  value: any;
}

export interface InvoiceApprovalRequest {
  invoice_id: string;
  action: 'approve' | 'reject';
  comments?: string;
  conditions_met?: Record<string, boolean>;
}

// Bulk Operations Types
export interface BulkInvoiceOperation {
  invoice_ids: string[];
  operation: 'approve' | 'send' | 'cancel' | 'update_status' | 'add_payment';
  data?: Record<string, any>;
}

export interface BulkOperationResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    invoice_id: string;
    error: string;
  }>;
}

// Invoice Delivery Types
export interface InvoiceDeliveryOptions {
  method: 'email' | 'portal' | 'download';
  recipients: string[];
  subject?: string;
  message?: string;
  include_pdf: boolean;
  include_payment_link: boolean;
  schedule_delivery?: Date;
}

export interface InvoiceDeliveryResult {
  delivery_id: string;
  status: 'sent' | 'failed' | 'scheduled';
  delivered_to: string[];
  failed_recipients?: Array<{
    email: string;
    error: string;
  }>;
  delivery_date: Date;
  tracking_urls?: string[];
}