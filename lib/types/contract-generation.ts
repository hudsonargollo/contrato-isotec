/**
 * Contract Generation System Types
 * 
 * TypeScript types and Zod validation schemas for automated contract generation,
 * workflow management, and validation.
 * 
 * Requirements: 7.1 - Automated contract generation
 */

import { z } from 'zod';

// Generation Status Enum
export const GENERATION_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;
export type GenerationStatus = typeof GENERATION_STATUSES[number];

// Output Format Enum
export const OUTPUT_FORMATS = ['html', 'pdf', 'docx'] as const;
export type OutputFormat = typeof OUTPUT_FORMATS[number];

// Approval Status Enum
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'not_required'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

// Contract Status Enum
export const CONTRACT_STATUSES = ['draft', 'pending_approval', 'approved', 'sent', 'signed', 'cancelled', 'expired'] as const;
export type ContractStatus = typeof CONTRACT_STATUSES[number];

// Signature Status Enum
export const SIGNATURE_STATUSES = ['pending', 'sent', 'partially_signed', 'fully_signed', 'declined', 'expired'] as const;
export type SignatureStatus = typeof SIGNATURE_STATUSES[number];

// Validation Rule Types
export const VALIDATION_RULE_TYPES = ['required_field', 'field_format', 'business_logic', 'custom_script'] as const;
export type ValidationRuleType = typeof VALIDATION_RULE_TYPES[number];

// Validation Severity Levels
export const VALIDATION_SEVERITIES = ['info', 'warning', 'error', 'critical'] as const;
export type ValidationSeverity = typeof VALIDATION_SEVERITIES[number];

// Generation Options Schema
export const generationOptionsSchema = z.object({
  output_format: z.enum(OUTPUT_FORMATS).default('pdf'),
  include_attachments: z.boolean().default(false),
  watermark: z.string().optional(),
  custom_styling: z.record(z.any()).default({}),
  page_settings: z.object({
    size: z.enum(['A4', 'Letter', 'Legal']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    margins: z.object({
      top: z.number().default(20),
      right: z.number().default(20),
      bottom: z.number().default(20),
      left: z.number().default(20)
    }).default({})
  }).default({}),
  signature_settings: z.object({
    require_all_signatures: z.boolean().default(true),
    signature_order: z.array(z.string()).default([]),
    expiration_days: z.number().int().min(1).max(365).default(30)
  }).default({})
});

// Contract Generation Request Schema
export const contractGenerationRequestSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  template_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  contract_data: z.record(z.any()).default({}),
  variable_values: z.record(z.any()).default({}),
  generation_options: generationOptionsSchema,
  output_format: z.enum(OUTPUT_FORMATS).default('pdf'),
  status: z.enum(GENERATION_STATUSES).default('pending'),
  generated_content: z.string().optional(),
  generated_file_url: z.string().optional(),
  validation_errors: z.array(z.string()).default([]),
  workflow_step: z.number().int().min(1).default(1),
  approval_status: z.enum(APPROVAL_STATUSES).default('pending'),
  approved_by: z.string().uuid().optional(),
  approved_at: z.date().optional(),
  requested_by: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
  completed_at: z.date().optional()
});

// Generated Contract Schema
export const generatedContractSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  generation_request_id: z.string().uuid(),
  contract_number: z.string(),
  template_id: z.string().uuid(),
  template_version: z.string(),
  customer_id: z.string().uuid().optional(),
  customer_data: z.record(z.any()).default({}),
  contract_content: z.string(),
  contract_variables: z.record(z.any()).default({}),
  file_url: z.string().optional(),
  file_size: z.number().int().min(0).optional(),
  file_format: z.enum(OUTPUT_FORMATS).default('pdf'),
  file_hash: z.string().optional(),
  status: z.enum(CONTRACT_STATUSES).default('draft'),
  is_final: z.boolean().default(false),
  signature_status: z.enum(SIGNATURE_STATUSES).default('pending'),
  signature_requests: z.array(z.object({
    id: z.string().uuid(),
    signer_name: z.string(),
    signer_email: z.string().email(),
    signer_role: z.string().optional(),
    status: z.enum(SIGNATURE_STATUSES),
    sent_at: z.date().optional(),
    signed_at: z.date().optional(),
    signature_url: z.string().optional(),
    decline_reason: z.string().optional()
  })).default([]),
  signed_at: z.date().optional(),
  expires_at: z.date().optional(),
  renewal_date: z.date().optional(),
  created_by: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date()
});

// Contract Validation Rule Schema
export const contractValidationRuleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Nome da regra é obrigatório'),
  description: z.string().optional(),
  rule_type: z.enum(VALIDATION_RULE_TYPES),
  rule_config: z.record(z.any()).default({}),
  validation_script: z.string().optional(),
  applies_to_templates: z.array(z.string().uuid()).default([]),
  applies_to_categories: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  is_blocking: z.boolean().default(false),
  severity: z.enum(VALIDATION_SEVERITIES).default('warning'),
  created_by: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Workflow Step Schema
export const workflowStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome da etapa é obrigatório'),
  description: z.string().optional(),
  step_type: z.enum(['validation', 'approval', 'generation', 'notification', 'custom']),
  order: z.number().int().min(1),
  is_required: z.boolean().default(true),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists']),
    value: z.any(),
    logical_operator: z.enum(['AND', 'OR']).optional()
  })).default([]),
  actions: z.array(z.object({
    action_type: z.enum(['validate', 'approve', 'generate', 'notify', 'assign', 'custom']),
    action_config: z.record(z.any()).default({})
  })).default([]),
  timeout_hours: z.number().int().min(1).optional(),
  escalation: z.object({
    enabled: z.boolean().default(false),
    timeout_hours: z.number().int().min(1).optional(),
    escalate_to: z.string().uuid().optional(),
    escalation_action: z.string().optional()
  }).optional()
});

// Contract Generation Workflow Schema
export const contractGenerationWorkflowSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Nome do workflow é obrigatório'),
  description: z.string().optional(),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/, 'Versão deve seguir o formato semântico'),
  workflow_steps: z.array(workflowStepSchema).default([]),
  trigger_conditions: z.object({
    template_ids: z.array(z.string().uuid()).default([]),
    template_categories: z.array(z.string()).default([]),
    lead_criteria: z.record(z.any()).default({}),
    auto_trigger: z.boolean().default(false)
  }).default({}),
  template_id: z.string().uuid().optional(),
  applies_to_all_templates: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  auto_execute: z.boolean().default(false),
  created_by: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Input Schemas (for creating/updating)
export const createGenerationRequestSchema = contractGenerationRequestSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  completed_at: true
});

export const updateGenerationRequestSchema = createGenerationRequestSchema.partial().omit({
  tenant_id: true,
  requested_by: true
});

export const createGeneratedContractSchema = generatedContractSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateGeneratedContractSchema = createGeneratedContractSchema.partial().omit({
  tenant_id: true,
  generation_request_id: true,
  created_by: true
});

export const createValidationRuleSchema = contractValidationRuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateValidationRuleSchema = createValidationRuleSchema.partial().omit({
  tenant_id: true
});

export const createWorkflowSchema = contractGenerationWorkflowSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateWorkflowSchema = createWorkflowSchema.partial().omit({
  tenant_id: true
});

// Validation Result Schema
export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  rule_results: z.array(z.object({
    rule_id: z.string().uuid(),
    rule_name: z.string(),
    passed: z.boolean(),
    message: z.string().optional(),
    severity: z.enum(VALIDATION_SEVERITIES)
  })).default([])
});

// Contract Preview Schema
export const contractPreviewSchema = z.object({
  template_id: z.string().uuid(),
  contract_data: z.record(z.any()).default({}),
  variable_values: z.record(z.any()).default({}),
  generation_options: generationOptionsSchema,
  preview_format: z.enum(['html', 'pdf']).default('html')
});

// Generation Statistics Schema
export const generationStatsSchema = z.object({
  total_requests: z.number().int().min(0),
  completed_requests: z.number().int().min(0),
  failed_requests: z.number().int().min(0),
  pending_requests: z.number().int().min(0),
  success_rate: z.number().min(0).max(100),
  average_generation_time: z.number().min(0).optional(), // in seconds
  most_used_templates: z.array(z.object({
    template_id: z.string().uuid(),
    template_name: z.string(),
    usage_count: z.number().int().min(0)
  })).default([]),
  generation_trends: z.array(z.object({
    date: z.date(),
    count: z.number().int().min(0)
  })).default([])
});

// Type exports
export type GenerationOptions = z.infer<typeof generationOptionsSchema>;
export type ContractGenerationRequest = z.infer<typeof contractGenerationRequestSchema>;
export type GeneratedContract = z.infer<typeof generatedContractSchema>;
export type ContractValidationRule = z.infer<typeof contractValidationRuleSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type ContractGenerationWorkflow = z.infer<typeof contractGenerationWorkflowSchema>;

export type CreateGenerationRequest = z.infer<typeof createGenerationRequestSchema>;
export type UpdateGenerationRequest = z.infer<typeof updateGenerationRequestSchema>;
export type CreateGeneratedContract = z.infer<typeof createGeneratedContractSchema>;
export type UpdateGeneratedContract = z.infer<typeof updateGeneratedContractSchema>;
export type CreateValidationRule = z.infer<typeof createValidationRuleSchema>;
export type UpdateValidationRule = z.infer<typeof updateValidationRuleSchema>;
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;

export type ValidationResult = z.infer<typeof validationResultSchema>;
export type ContractPreview = z.infer<typeof contractPreviewSchema>;
export type GenerationStats = z.infer<typeof generationStatsSchema>;

// Utility types
export type GenerationRequestWithContract = ContractGenerationRequest & {
  generated_contract?: GeneratedContract;
  template?: {
    id: string;
    name: string;
    version: string;
  };
  lead?: {
    id: string;
    name: string;
    email: string;
  };
};

export type ContractWithSignatures = GeneratedContract & {
  signature_progress: {
    total_signers: number;
    signed_count: number;
    pending_count: number;
    declined_count: number;
  };
};

export type WorkflowExecution = {
  workflow_id: string;
  request_id: string;
  current_step: number;
  step_results: Array<{
    step_id: string;
    status: 'pending' | 'completed' | 'failed' | 'skipped';
    started_at: Date;
    completed_at?: Date;
    result?: any;
    error?: string;
  }>;
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
};

// Default configurations
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  output_format: 'pdf',
  include_attachments: false,
  custom_styling: {},
  page_settings: {
    size: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  },
  signature_settings: {
    require_all_signatures: true,
    signature_order: [],
    expiration_days: 30
  }
};

export const DEFAULT_VALIDATION_RULES: Omit<CreateValidationRule, 'tenant_id' | 'name'>[] = [
  {
    name: 'Campo Nome Obrigatório',
    description: 'Valida se o nome do contratante foi preenchido',
    rule_type: 'required_field',
    rule_config: {
      field_name: 'contractor_name',
      error_message: 'Nome do contratante é obrigatório'
    },
    applies_to_templates: [],
    applies_to_categories: [],
    is_active: true,
    is_blocking: true,
    severity: 'error'
  },
  {
    name: 'Formato CPF',
    description: 'Valida o formato do CPF',
    rule_type: 'field_format',
    rule_config: {
      field_name: 'contractor_cpf',
      pattern: '^[0-9]{11}$',
      error_message: 'CPF deve conter exatamente 11 dígitos'
    },
    applies_to_templates: [],
    applies_to_categories: [],
    is_active: true,
    is_blocking: true,
    severity: 'error'
  },
  {
    name: 'Valor Mínimo Contrato',
    description: 'Valida se o valor do contrato está acima do mínimo',
    rule_type: 'business_logic',
    rule_config: {
      field_name: 'contract_value',
      min_value: 1000,
      error_message: 'Valor do contrato deve ser maior que R$ 1.000,00'
    },
    applies_to_templates: [],
    applies_to_categories: [],
    is_active: true,
    is_blocking: false,
    severity: 'warning'
  }
];

// Utility functions
export const getStatusLabel = (status: GenerationStatus | ContractStatus | SignatureStatus): string => {
  const labels: Record<string, string> = {
    // Generation statuses
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Falhou',
    cancelled: 'Cancelado',
    
    // Contract statuses
    draft: 'Rascunho',
    pending_approval: 'Aguardando Aprovação',
    approved: 'Aprovado',
    sent: 'Enviado',
    signed: 'Assinado',
    expired: 'Expirado',
    
    // Signature statuses
    partially_signed: 'Parcialmente Assinado',
    fully_signed: 'Totalmente Assinado',
    declined: 'Recusado'
  };
  
  return labels[status] || status;
};

export const getStatusColor = (status: GenerationStatus | ContractStatus | SignatureStatus): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    sent: 'bg-blue-100 text-blue-800',
    signed: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    
    partially_signed: 'bg-yellow-100 text-yellow-800',
    fully_signed: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const calculateSignatureProgress = (signatureRequests: GeneratedContract['signature_requests']) => {
  const total = signatureRequests.length;
  const signed = signatureRequests.filter(req => req.status === 'fully_signed').length;
  const pending = signatureRequests.filter(req => req.status === 'pending').length;
  const sent = signatureRequests.filter(req => req.status === 'sent').length;
  const declined = signatureRequests.filter(req => req.status === 'declined' || req.status === 'expired').length;
  
  return {
    total_signers: total,
    signed_count: signed,
    pending_count: pending,
    sent_count: sent,
    declined_count: declined,
    completion_percentage: total > 0 ? Math.round((signed / total) * 100) : 0
  };
};

export const isContractExpired = (contract: GeneratedContract, currentDate?: Date): boolean => {
  if (!contract.expires_at) return false;
  const now = currentDate || new Date();
  return now > new Date(contract.expires_at);
};

export const isContractRenewalDue = (contract: GeneratedContract, daysBeforeRenewal: number = 30, currentDate?: Date): boolean => {
  if (!contract.renewal_date) return false;
  const renewalDate = new Date(contract.renewal_date);
  const warningDate = new Date(renewalDate.getTime() - (daysBeforeRenewal * 24 * 60 * 60 * 1000));
  const now = currentDate || new Date();
  return now >= warningDate;
};