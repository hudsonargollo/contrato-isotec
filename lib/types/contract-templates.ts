/**
 * Contract Template Management System Types
 * 
 * TypeScript types and Zod validation schemas for contract template management,
 * version control, and tenant-specific customizations.
 * 
 * Requirements: 7.2 - Contract template management
 */

import { z } from 'zod';

// Template Categories
export const TEMPLATE_CATEGORIES = ['standard', 'residential', 'commercial', 'industrial', 'custom'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

// Variable Types
export const VARIABLE_TYPES = [
  'text', 'number', 'date', 'boolean', 'email', 'phone', 'currency', 'percentage', 'address', 'select', 'multiselect'
] as const;
export type VariableType = typeof VARIABLE_TYPES[number];

// Signature Field Types
export const SIGNATURE_FIELD_TYPES = [
  'signature', 'initial', 'date', 'text', 'checkbox', 'radio'
] as const;
export type SignatureFieldType = typeof SIGNATURE_FIELD_TYPES[number];

// Approval Step Types
export const APPROVAL_STEP_TYPES = ['user', 'role', 'external'] as const;
export type ApprovalStepType = typeof APPROVAL_STEP_TYPES[number];

// Template Variable Schema
export const templateVariableSchema = z.object({
  name: z.string().min(1, 'Nome da variável é obrigatório'),
  label: z.string().min(1, 'Rótulo da variável é obrigatório'),
  type: z.enum(VARIABLE_TYPES),
  required: z.boolean().default(false),
  default_value: z.string().optional(),
  description: z.string().optional(),
  validation: z.object({
    min_length: z.number().optional(),
    max_length: z.number().optional(),
    pattern: z.string().optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional()
  }).optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(), // For select/multiselect types
  placeholder: z.string().optional(),
  help_text: z.string().optional()
});

// Signature Field Schema
export const signatureFieldSchema = z.object({
  name: z.string().min(1, 'Nome do campo é obrigatório'),
  label: z.string().min(1, 'Rótulo do campo é obrigatório'),
  type: z.enum(SIGNATURE_FIELD_TYPES),
  required: z.boolean().default(true),
  position: z.object({
    page: z.number().int().min(1),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1)
  }),
  validation: z.object({
    format: z.string().optional(),
    min_length: z.number().optional(),
    max_length: z.number().optional()
  }).optional(),
  options: z.array(z.string()).optional(), // For radio/checkbox types
  placeholder: z.string().optional()
});

// Approval Step Schema
export const approvalStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome da etapa é obrigatório'),
  type: z.enum(APPROVAL_STEP_TYPES),
  order: z.number().int().min(1),
  required: z.boolean().default(true),
  assignee: z.object({
    user_id: z.string().uuid().optional(),
    role: z.string().optional(),
    email: z.string().email().optional()
  }),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
    value: z.string()
  })).default([]),
  timeout_hours: z.number().int().min(1).optional(),
  escalation: z.object({
    enabled: z.boolean().default(false),
    timeout_hours: z.number().int().min(1).optional(),
    assignee: z.object({
      user_id: z.string().uuid().optional(),
      role: z.string().optional(),
      email: z.string().email().optional()
    }).optional()
  }).optional()
});

// Contract Template Schema
export const contractTemplateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Nome do template é obrigatório').max(200),
  description: z.string().optional(),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/, 'Versão deve seguir o formato semântico (ex: 1.0.0)'),
  template_content: z.string().min(1, 'Conteúdo do template é obrigatório'),
  template_variables: z.array(templateVariableSchema).default([]),
  category: z.enum(TEMPLATE_CATEGORIES).default('standard'),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  signature_fields: z.array(signatureFieldSchema).default([]),
  approval_workflow: z.array(approvalStepSchema).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  created_by: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Contract Template Version Schema
export const contractTemplateVersionSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/, 'Versão deve seguir o formato semântico'),
  version_notes: z.string().optional(),
  template_content: z.string().min(1, 'Conteúdo do template é obrigatório'),
  template_variables: z.array(templateVariableSchema).default([]),
  signature_fields: z.array(signatureFieldSchema).default([]),
  approval_workflow: z.array(approvalStepSchema).default([]),
  is_published: z.boolean().default(false),
  published_at: z.date().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.date()
});

// Contract Template Customization Schema
export const contractTemplateCustomizationSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  template_id: z.string().uuid(),
  custom_variables: z.record(z.any()).default({}),
  custom_styling: z.object({
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      text: z.string().optional(),
      background: z.string().optional()
    }).optional(),
    fonts: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      size_base: z.string().optional(),
      size_heading: z.string().optional()
    }).optional(),
    layout: z.object({
      margin: z.string().optional(),
      padding: z.string().optional(),
      line_height: z.string().optional(),
      page_size: z.enum(['A4', 'Letter', 'Legal']).optional()
    }).optional(),
    custom_css: z.string().optional()
  }).default({}),
  custom_content_overrides: z.record(z.string()).default({}),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Input Schemas (for creating/updating)
export const createContractTemplateSchema = contractTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateContractTemplateSchema = createContractTemplateSchema.partial().omit({
  tenant_id: true
});

export const createTemplateVersionSchema = contractTemplateVersionSchema.omit({
  id: true,
  created_at: true
});

export const createTemplateCustomizationSchema = contractTemplateCustomizationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateTemplateCustomizationSchema = createTemplateCustomizationSchema.partial().omit({
  tenant_id: true,
  template_id: true
});

// Template Search and Filter Schema
export const templateFiltersSchema = z.object({
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search_query: z.string().optional(),
  created_by: z.string().uuid().optional(),
  created_after: z.date().optional(),
  created_before: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

// Template Usage Statistics Schema
export const templateUsageStatsSchema = z.object({
  template_id: z.string().uuid(),
  total_contracts: z.number().int().min(0),
  contracts_this_month: z.number().int().min(0),
  contracts_this_year: z.number().int().min(0),
  average_completion_time: z.number().min(0).optional(), // in minutes
  success_rate: z.number().min(0).max(100), // percentage
  last_used: z.date().optional()
});

// Template Preview Schema
export const templatePreviewSchema = z.object({
  template_id: z.string().uuid(),
  variable_values: z.record(z.any()).default({}),
  preview_format: z.enum(['html', 'pdf']).default('html'),
  include_signatures: z.boolean().default(false)
});

// Type exports
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type SignatureField = z.infer<typeof signatureFieldSchema>;
export type ApprovalStep = z.infer<typeof approvalStepSchema>;
export type ContractTemplate = z.infer<typeof contractTemplateSchema>;
export type ContractTemplateVersion = z.infer<typeof contractTemplateVersionSchema>;
export type ContractTemplateCustomization = z.infer<typeof contractTemplateCustomizationSchema>;

export type CreateContractTemplate = z.infer<typeof createContractTemplateSchema>;
export type UpdateContractTemplate = z.infer<typeof updateContractTemplateSchema>;
export type CreateTemplateVersion = z.infer<typeof createTemplateVersionSchema>;
export type CreateTemplateCustomization = z.infer<typeof createTemplateCustomizationSchema>;
export type UpdateTemplateCustomization = z.infer<typeof updateTemplateCustomizationSchema>;

export type TemplateFilters = z.infer<typeof templateFiltersSchema>;
export type TemplateUsageStats = z.infer<typeof templateUsageStatsSchema>;
export type TemplatePreview = z.infer<typeof templatePreviewSchema>;

// Utility types
export type TemplateWithVersions = ContractTemplate & {
  versions: ContractTemplateVersion[];
  customization?: ContractTemplateCustomization;
  usage_stats?: TemplateUsageStats;
};

export type PaginatedTemplates = {
  templates: TemplateWithVersions[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

// Template validation utilities
export const validateTemplateContent = (content: string, variables: TemplateVariable[]): string[] => {
  const errors: string[] = [];
  const variableNames = variables.map(v => v.name);
  
  // Check for undefined variables in template
  const variablePattern = /\{\{([^}]+)\}\}/g;
  let match;
  const usedVariables = new Set<string>();
  
  while ((match = variablePattern.exec(content)) !== null) {
    const variableName = match[1].trim();
    usedVariables.add(variableName);
    
    if (!variableNames.includes(variableName)) {
      errors.push(`Variável não definida encontrada no template: ${variableName}`);
    }
  }
  
  // Check for required variables not used in template
  variables.forEach(variable => {
    if (variable.required && !usedVariables.has(variable.name)) {
      errors.push(`Variável obrigatória não utilizada no template: ${variable.name}`);
    }
  });
  
  return errors;
};

export const getNextVersion = (currentVersion: string, type: 'major' | 'minor' | 'patch' = 'patch'): string => {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
};

export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1;
    if (v1Parts[i] < v2Parts[i]) return -1;
  }
  
  return 0;
};

// Default template configurations
export const DEFAULT_TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    name: 'contractor_name',
    label: 'Nome do Contratante',
    type: 'text',
    required: true,
    description: 'Nome completo do contratante'
  },
  {
    name: 'contractor_cpf',
    label: 'CPF do Contratante',
    type: 'text',
    required: true,
    validation: {
      pattern: '^[0-9]{11}$'
    },
    description: 'CPF do contratante (apenas números)'
  },
  {
    name: 'contractor_email',
    label: 'Email do Contratante',
    type: 'email',
    required: false,
    description: 'Email de contato do contratante'
  },
  {
    name: 'project_kwp',
    label: 'Potência do Projeto (kWp)',
    type: 'number',
    required: true,
    validation: {
      min_value: 0.1
    },
    description: 'Potência total do sistema em kWp'
  },
  {
    name: 'contract_value',
    label: 'Valor do Contrato',
    type: 'currency',
    required: true,
    validation: {
      min_value: 0
    },
    description: 'Valor total do contrato'
  },
  {
    name: 'installation_date',
    label: 'Data de Instalação',
    type: 'date',
    required: false,
    description: 'Data prevista para instalação'
  }
];

export const DEFAULT_SIGNATURE_FIELDS: SignatureField[] = [
  {
    name: 'contractor_signature',
    label: 'Assinatura do Contratante',
    type: 'signature',
    required: true,
    position: {
      page: 1,
      x: 50,
      y: 700,
      width: 200,
      height: 50
    }
  },
  {
    name: 'contractor_date',
    label: 'Data da Assinatura',
    type: 'date',
    required: true,
    position: {
      page: 1,
      x: 300,
      y: 700,
      width: 100,
      height: 30
    }
  }
];