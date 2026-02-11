/**
 * Tenant Management System Types and Schemas
 * 
 * TypeScript types and Zod validation schemas for the multi-tenant architecture.
 * Supports tenant isolation, branding, subscription management, and user roles.
 * 
 * Requirements: 1.1, 1.2, 1.5 - Multi-Tenant Architecture
 */

import { z } from 'zod';

// Tenant Status Enum
export const TENANT_STATUSES = ['active', 'suspended', 'cancelled', 'trial'] as const;
export type TenantStatus = typeof TENANT_STATUSES[number];

// User Role Enum
export const USER_ROLES = ['owner', 'admin', 'manager', 'user', 'viewer'] as const;
export type UserRole = typeof USER_ROLES[number];

// User Status Enum
export const USER_STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const;
export type UserStatus = typeof USER_STATUSES[number];

// Subscription Plan Enum
export const SUBSCRIPTION_PLANS = ['starter', 'professional', 'enterprise'] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

// Usage Metric Names
export const USAGE_METRICS = [
  'users_count',
  'leads_count', 
  'contracts_count',
  'invoices_count',
  'storage_used_mb',
  'api_calls',
  'whatsapp_messages',
  'email_sent'
] as const;
export type UsageMetric = typeof USAGE_METRICS[number];

// Tenant Branding Schema
export const tenantBrandingSchema = z.object({
  logo_url: z.string().url().optional().or(z.literal('')),
  favicon_url: z.string().url().optional().or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor primária deve ser um código hexadecimal válido').default('#2563eb'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor secundária deve ser um código hexadecimal válido').default('#64748b'),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor de destaque deve ser um código hexadecimal válido').default('#10b981'),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor de fundo deve ser um código hexadecimal válido').default('#ffffff'),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor do texto deve ser um código hexadecimal válido').default('#1f2937'),
  custom_css: z.string().default(''),
  white_label: z.boolean().default(false),
  custom_domain: z.string().optional(),
  company_name: z.string().default(''),
  email_signature: z.string().default(''),
  footer_text: z.string().default('')
});

// Subscription Limits Schema
export const subscriptionLimitsSchema = z.object({
  users: z.number().int().min(1).default(5),
  leads: z.number().int().min(1).default(1000),
  contracts: z.number().int().min(1).default(100),
  storage_gb: z.number().int().min(1).default(10)
});

// Subscription Schema
export const subscriptionSchema = z.object({
  plan: z.enum(SUBSCRIPTION_PLANS).default('starter'),
  status: z.enum(['active', 'cancelled', 'past_due', 'trialing']).default('active'),
  limits: subscriptionLimitsSchema,
  features: z.array(z.string()).default(['crm', 'screening', 'invoices']),
  trial_ends_at: z.date().optional(),
  current_period_start: z.date().optional(),
  current_period_end: z.date().optional(),
  stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional()
});

// Tenant Settings Schema
export const tenantSettingsSchema = z.object({
  timezone: z.string().default('America/Sao_Paulo'),
  currency: z.string().length(3).default('BRL'),
  language: z.string().default('pt-BR'),
  date_format: z.string().default('DD/MM/YYYY'),
  notifications: z.object({
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
    sms: z.boolean().default(false)
  }).default({
    email: true,
    whatsapp: false,
    sms: false
  })
});

// Tenant Schema
export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome do tenant é obrigatório').max(200),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/, 'Formato de domínio inválido'),
  subdomain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*$/, 'Formato de subdomínio inválido'),
  branding: tenantBrandingSchema,
  subscription: subscriptionSchema,
  settings: tenantSettingsSchema,
  status: z.enum(TENANT_STATUSES).default('active'),
  created_at: z.date(),
  updated_at: z.date()
});

// Tenant User Schema
export const tenantUserSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(USER_ROLES).default('user'),
  permissions: z.array(z.string()).default([]),
  status: z.enum(USER_STATUSES).default('active'),
  invited_by: z.string().uuid().optional(),
  invited_at: z.date().optional(),
  joined_at: z.date(),
  last_active_at: z.date(),
  created_at: z.date(),
  updated_at: z.date()
});

// Tenant Usage Schema
export const tenantUsageSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  metric_name: z.enum(USAGE_METRICS),
  metric_value: z.number().int().min(0).default(0),
  period_start: z.date(),
  period_end: z.date(),
  metadata: z.record(z.any()).default({}),
  created_at: z.date()
});

// Input Schemas (for creating/updating)
export const createTenantSchema = tenantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateTenantSchema = createTenantSchema.partial().omit({
  domain: true,
  subdomain: true
});

export const createTenantUserSchema = tenantUserSchema.omit({
  id: true,
  joined_at: true,
  last_active_at: true,
  created_at: true,
  updated_at: true
});

export const updateTenantUserSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(USER_STATUSES).optional()
});

export const inviteTenantUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(USER_ROLES).default('user'),
  permissions: z.array(z.string()).default([]),
  send_invitation: z.boolean().default(true)
});

// Tenant Context Schema
export const tenantContextSchema = z.object({
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.string()),
  subscription_limits: subscriptionLimitsSchema,
  features: z.array(z.string()),
  branding: tenantBrandingSchema,
  settings: tenantSettingsSchema
});

// Permission Definitions
export const PERMISSIONS = {
  // User Management
  'users.view': 'Visualizar usuários',
  'users.create': 'Criar usuários',
  'users.update': 'Editar usuários',
  'users.delete': 'Excluir usuários',
  'users.invite': 'Convidar usuários',
  
  // CRM
  'leads.view': 'Visualizar leads',
  'leads.create': 'Criar leads',
  'leads.update': 'Editar leads',
  'leads.delete': 'Excluir leads',
  'leads.assign': 'Atribuir leads',
  
  // Contracts
  'contracts.view': 'Visualizar contratos',
  'contracts.create': 'Criar contratos',
  'contracts.update': 'Editar contratos',
  'contracts.delete': 'Excluir contratos',
  'contracts.send': 'Enviar contratos',
  
  // Invoices
  'invoices.view': 'Visualizar faturas',
  'invoices.create': 'Criar faturas',
  'invoices.update': 'Editar faturas',
  'invoices.delete': 'Excluir faturas',
  'invoices.send': 'Enviar faturas',
  
  // Analytics
  'analytics.view': 'Visualizar relatórios',
  'analytics.export': 'Exportar relatórios',
  
  // Settings
  'settings.view': 'Visualizar configurações',
  'settings.update': 'Editar configurações',
  'settings.branding': 'Editar marca',
  
  // Billing
  'billing.view': 'Visualizar cobrança',
  'billing.manage': 'Gerenciar cobrança'
} as const;

// Role-based default permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: Object.keys(PERMISSIONS),
  admin: Object.keys(PERMISSIONS).filter(p => !p.startsWith('billing.')),
  manager: [
    'users.view', 'users.invite',
    'leads.view', 'leads.create', 'leads.update', 'leads.assign',
    'contracts.view', 'contracts.create', 'contracts.update', 'contracts.send',
    'invoices.view', 'invoices.create', 'invoices.update', 'invoices.send',
    'analytics.view', 'analytics.export',
    'settings.view'
  ],
  user: [
    'leads.view', 'leads.create', 'leads.update',
    'contracts.view', 'contracts.create', 'contracts.update',
    'invoices.view', 'invoices.create', 'invoices.update',
    'analytics.view'
  ],
  viewer: [
    'leads.view',
    'contracts.view',
    'invoices.view',
    'analytics.view'
  ]
};

// Subscription Plan Features
export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  starter: ['crm', 'screening', 'invoices'],
  professional: ['crm', 'screening', 'invoices', 'whatsapp', 'analytics'],
  enterprise: ['crm', 'screening', 'invoices', 'whatsapp', 'analytics', 'contracts', 'api', 'white_label']
};

// Subscription Plan Limits
export const PLAN_LIMITS: Record<SubscriptionPlan, z.infer<typeof subscriptionLimitsSchema>> = {
  starter: {
    users: 5,
    leads: 1000,
    contracts: 100,
    storage_gb: 10
  },
  professional: {
    users: 25,
    leads: 5000,
    contracts: 500,
    storage_gb: 50
  },
  enterprise: {
    users: 100,
    leads: 25000,
    contracts: 2500,
    storage_gb: 200
  }
};

// Type exports
export type Tenant = z.infer<typeof tenantSchema>;
export type TenantBranding = z.infer<typeof tenantBrandingSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionLimits = z.infer<typeof subscriptionLimitsSchema>;
export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type TenantUser = z.infer<typeof tenantUserSchema>;
export type TenantUsage = z.infer<typeof tenantUsageSchema>;
export type TenantContext = z.infer<typeof tenantContextSchema>;

export type CreateTenant = z.infer<typeof createTenantSchema>;
export type UpdateTenant = z.infer<typeof updateTenantSchema>;
export type CreateTenantUser = z.infer<typeof createTenantUserSchema>;
export type UpdateTenantUser = z.infer<typeof updateTenantUserSchema>;
export type InviteTenantUser = z.infer<typeof inviteTenantUserSchema>;

// Utility types
export type Permission = keyof typeof PERMISSIONS;
export type PermissionGroup = 'users' | 'leads' | 'contracts' | 'invoices' | 'analytics' | 'settings' | 'billing';

// Default tenant configuration for new tenants
export const DEFAULT_TENANT_CONFIG: Omit<CreateTenant, 'name' | 'domain' | 'subdomain'> = {
  branding: {
    logo_url: '',
    favicon_url: '',
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    background_color: '#ffffff',
    text_color: '#1f2937',
    custom_css: '',
    white_label: false,
    company_name: '',
    email_signature: '',
    footer_text: ''
  },
  subscription: {
    plan: 'starter',
    status: 'trialing',
    limits: PLAN_LIMITS.starter,
    features: PLAN_FEATURES.starter,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  settings: {
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    language: 'pt-BR',
    date_format: 'DD/MM/YYYY',
    notifications: {
      email: true,
      whatsapp: false,
      sms: false
    }
  },
  status: 'trial'
};

// Utility functions for working with tenants
export const getTenantFeatures = (subscription: Subscription): string[] => {
  return subscription.features || PLAN_FEATURES[subscription.plan] || [];
};

export const hasFeature = (subscription: Subscription, feature: string): boolean => {
  const features = getTenantFeatures(subscription);
  return features.includes(feature);
};

export const getUserPermissions = (role: UserRole, customPermissions?: string[]): string[] => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  const permissions = customPermissions || [];
  
  // Combine role permissions with custom permissions, removing duplicates
  return [...new Set([...rolePermissions, ...permissions])];
};

export const hasPermission = (userPermissions: string[], permission: string): boolean => {
  return userPermissions.includes(permission);
};

export const isWithinLimit = (usage: number, limit: number): boolean => {
  return usage < limit;
};

export const getUsagePercentage = (usage: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min((usage / limit) * 100, 100);
};