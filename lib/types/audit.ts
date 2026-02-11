/**
 * User Activity Audit System Types
 * 
 * TypeScript types and Zod validation schemas for comprehensive user activity logging,
 * audit trails, security monitoring, and compliance reporting.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { z } from 'zod';

// User Activity Action Types
export const USER_ACTIONS = [
  // Authentication actions
  'auth.login', 'auth.logout', 'auth.register', 'auth.password_reset',
  'auth.mfa_enable', 'auth.mfa_disable', 'auth.session_refresh',
  
  // User management actions
  'users.create', 'users.update', 'users.delete', 'users.invite',
  'users.role_change', 'users.permission_change', 'users.activate', 'users.deactivate',
  
  // CRM actions
  'leads.create', 'leads.update', 'leads.delete', 'leads.assign',
  'leads.stage_change', 'leads.score_update', 'leads.convert',
  'interactions.create', 'interactions.update', 'interactions.delete',
  
  // Contract actions
  'contracts.create', 'contracts.update', 'contracts.delete', 'contracts.send',
  'contracts.sign', 'contracts.approve', 'contracts.reject',
  
  // Invoice actions
  'invoices.create', 'invoices.update', 'invoices.delete', 'invoices.send',
  'invoices.approve', 'invoices.pay', 'invoices.cancel', 'invoices.view',
  
  // Payment actions
  'payments.create', 'payments.update', 'payments.delete', 'payments.view',
  'payments.refund', 'payments.reconcile', 'payments.webhook',
  
  // Screening actions
  'screening.create', 'screening.update', 'screening.delete', 'screening.submit',
  'screening.approve', 'screening.reject',
  
  // Settings actions
  'settings.update', 'branding.update', 'subscription.change',
  
  // Data export/import actions
  'data.export', 'data.import', 'data.backup', 'data.restore',
  
  // System actions
  'system.login', 'system.error', 'system.warning'
] as const;

export type UserAction = typeof USER_ACTIONS[number];

// Activity Status Types
export const ACTIVITY_STATUSES = ['success', 'failure', 'warning', 'pending'] as const;
export type ActivityStatus = typeof ACTIVITY_STATUSES[number];

// Resource Types
export const RESOURCE_TYPES = [
  'user', 'tenant', 'lead', 'contract', 'invoice', 'screening',
  'interaction', 'template', 'setting', 'role', 'permission', 'payment'
] as const;
export type ResourceType = typeof RESOURCE_TYPES[number];

// Session Status Types
export const SESSION_STATUSES = ['active', 'expired', 'terminated', 'logged_out'] as const;
export type SessionStatus = typeof SESSION_STATUSES[number];

// Session End Reasons
export const SESSION_END_REASONS = [
  'logout', 'timeout', 'admin_termination', 'security_violation', 'system_shutdown'
] as const;
export type SessionEndReason = typeof SESSION_END_REASONS[number];

// Security Event Types
export const SECURITY_EVENT_TYPES = [
  'failed_login', 'suspicious_activity', 'permission_violation',
  'data_breach_attempt', 'unusual_access_pattern', 'account_lockout',
  'mfa_bypass_attempt', 'privilege_escalation', 'unauthorized_access',
  'data_export_anomaly', 'session_hijacking', 'brute_force_attack'
] as const;
export type SecurityEventType = typeof SECURITY_EVENT_TYPES[number];

// Security Event Severity
export const SECURITY_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type SecuritySeverity = typeof SECURITY_SEVERITIES[number];

// Security Event Status
export const SECURITY_STATUSES = ['open', 'investigating', 'resolved', 'false_positive'] as const;
export type SecurityStatus = typeof SECURITY_STATUSES[number];

// Report Types
export const REPORT_TYPES = [
  'user_activity', 'security_events', 'login_history', 'permission_changes',
  'data_access', 'system_changes', 'compliance_summary', 'custom'
] as const;
export type ReportType = typeof REPORT_TYPES[number];

// Report Status
export const REPORT_STATUSES = ['pending', 'generating', 'completed', 'failed', 'expired'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

// User Activity Log Schema
export const userActivityLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  
  // Activity Details
  action: z.enum(USER_ACTIONS),
  resource_type: z.enum(RESOURCE_TYPES).nullable(),
  resource_id: z.string().uuid().nullable(),
  resource_name: z.string().nullable(),
  
  // Request Context
  ip_address: z.string(),
  user_agent: z.string().nullable(),
  session_id: z.string().nullable(),
  request_id: z.string().nullable(),
  
  // Activity Metadata
  metadata: z.record(z.any()).default({}),
  changes: z.record(z.any()).default({}),
  
  // Status and Results
  status: z.enum(ACTIVITY_STATUSES).default('success'),
  error_message: z.string().nullable(),
  duration_ms: z.number().int().nullable(),
  
  // Timestamps
  created_at: z.date()
});

// Audit Session Schema
export const auditSessionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Session Details
  session_id: z.string(),
  ip_address: z.string(),
  user_agent: z.string().nullable(),
  device_info: z.record(z.any()).default({}),
  
  // Session Lifecycle
  started_at: z.date(),
  last_activity_at: z.date(),
  ended_at: z.date().nullable(),
  
  // Session Status
  status: z.enum(SESSION_STATUSES).default('active'),
  end_reason: z.enum(SESSION_END_REASONS).nullable(),
  
  // Activity Summary
  actions_count: z.number().int().default(0)
});

// Security Event Schema
export const securityEventSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().nullable(),
  user_id: z.string().uuid().nullable(),
  
  // Event Details
  event_type: z.enum(SECURITY_EVENT_TYPES),
  severity: z.enum(SECURITY_SEVERITIES).default('medium'),
  description: z.string(),
  
  // Context
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  resource_type: z.enum(RESOURCE_TYPES).nullable(),
  resource_id: z.string().uuid().nullable(),
  
  // Event Data
  metadata: z.record(z.any()).default({}),
  
  // Status
  status: z.enum(SECURITY_STATUSES).default('open'),
  resolved_at: z.date().nullable(),
  resolved_by: z.string().uuid().nullable(),
  resolution_notes: z.string().nullable(),
  
  // Timestamps
  created_at: z.date()
});

// Audit Report Schema
export const auditReportSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  // Report Details
  report_type: z.enum(REPORT_TYPES),
  report_name: z.string(),
  description: z.string().nullable(),
  
  // Report Configuration
  filters: z.record(z.any()).default({}),
  date_range: z.object({
    start_date: z.date(),
    end_date: z.date()
  }),
  
  // Report Data
  report_data: z.record(z.any()).nullable(),
  file_url: z.string().nullable(),
  file_size_bytes: z.number().int().nullable(),
  
  // Generation Details
  generated_by: z.string().uuid(),
  generated_at: z.date(),
  expires_at: z.date().nullable(),
  
  // Status
  status: z.enum(REPORT_STATUSES).default('pending'),
  error_message: z.string().nullable()
});

// Input Schemas for creating records
export const createUserActivityLogSchema = userActivityLogSchema.omit({
  id: true,
  created_at: true
}).extend({
  user_id: z.string().uuid().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  session_id: z.string().optional(),
  request_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  changes: z.record(z.any()).optional(),
  status: z.enum(ACTIVITY_STATUSES).optional(),
  error_message: z.string().optional(),
  duration_ms: z.number().int().optional()
});

export const createAuditSessionSchema = auditSessionSchema.omit({
  id: true,
  started_at: true,
  last_activity_at: true,
  ended_at: true,
  actions_count: true
}).extend({
  user_agent: z.string().optional(),
  device_info: z.record(z.any()).optional()
});

export const createSecurityEventSchema = securityEventSchema.omit({
  id: true,
  created_at: true,
  resolved_at: true,
  resolved_by: true,
  resolution_notes: true
}).extend({
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  severity: z.enum(SECURITY_SEVERITIES).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  resource_type: z.enum(RESOURCE_TYPES).optional(),
  resource_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
});

export const createAuditReportSchema = auditReportSchema.omit({
  id: true,
  generated_at: true,
  report_data: true,
  file_url: true,
  file_size_bytes: true,
  status: true,
  error_message: true
}).extend({
  description: z.string().optional(),
  filters: z.record(z.any()).optional(),
  expires_at: z.date().optional()
});

// Update Schemas
export const updateSecurityEventSchema = z.object({
  status: z.enum(SECURITY_STATUSES).optional(),
  resolved_by: z.string().uuid().optional(),
  resolution_notes: z.string().optional()
});

export const updateAuditReportSchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  report_data: z.record(z.any()).optional(),
  file_url: z.string().optional(),
  file_size_bytes: z.number().int().optional(),
  error_message: z.string().optional()
});

// Query Schemas
export const auditQuerySchema = z.object({
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  action: z.enum(USER_ACTIONS).optional(),
  resource_type: z.enum(RESOURCE_TYPES).optional(),
  resource_id: z.string().uuid().optional(),
  status: z.enum(ACTIVITY_STATUSES).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  ip_address: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0)
});

export const securityEventQuerySchema = z.object({
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  event_type: z.enum(SECURITY_EVENT_TYPES).optional(),
  severity: z.enum(SECURITY_SEVERITIES).optional(),
  status: z.enum(SECURITY_STATUSES).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0)
});

// Activity Summary Schema
export const activitySummarySchema = z.object({
  action_type: z.string(),
  action_count: z.number().int(),
  success_count: z.number().int(),
  failure_count: z.number().int(),
  last_activity: z.date()
});

// Dashboard Metrics Schema
export const auditDashboardMetricsSchema = z.object({
  total_activities: z.number().int(),
  successful_activities: z.number().int(),
  failed_activities: z.number().int(),
  unique_users: z.number().int(),
  active_sessions: z.number().int(),
  security_events: z.number().int(),
  critical_events: z.number().int(),
  top_actions: z.array(activitySummarySchema),
  recent_activities: z.array(userActivityLogSchema),
  security_alerts: z.array(securityEventSchema)
});

// Export types
export type UserActivityLog = z.infer<typeof userActivityLogSchema>;
export type AuditSession = z.infer<typeof auditSessionSchema>;
export type SecurityEvent = z.infer<typeof securityEventSchema>;
export type AuditReport = z.infer<typeof auditReportSchema>;

export type CreateUserActivityLog = z.infer<typeof createUserActivityLogSchema>;
export type CreateAuditSession = z.infer<typeof createAuditSessionSchema>;
export type CreateSecurityEvent = z.infer<typeof createSecurityEventSchema>;
export type CreateAuditReport = z.infer<typeof createAuditReportSchema>;

export type UpdateSecurityEvent = z.infer<typeof updateSecurityEventSchema>;
export type UpdateAuditReport = z.infer<typeof updateAuditReportSchema>;

export type AuditQuery = z.infer<typeof auditQuerySchema>;
export type SecurityEventQuery = z.infer<typeof securityEventQuerySchema>;
export type ActivitySummary = z.infer<typeof activitySummarySchema>;
export type AuditDashboardMetrics = z.infer<typeof auditDashboardMetricsSchema>;

// Utility types for audit context
export interface AuditContext {
  tenant_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
}

export interface ActivityLogOptions {
  resource_type?: ResourceType;
  resource_id?: string;
  resource_name?: string;
  metadata?: Record<string, any>;
  changes?: Record<string, any>;
  status?: ActivityStatus;
  error_message?: string;
  duration_ms?: number;
}

// Audit event payload for middleware
export interface AuditEventPayload {
  action: UserAction;
  context: AuditContext;
  options?: ActivityLogOptions;
}

// Security event payload
export interface SecurityEventPayload {
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  context: Partial<AuditContext>;
  resource_type?: ResourceType;
  resource_id?: string;
  metadata?: Record<string, any>;
}

// Report generation options
export interface ReportGenerationOptions {
  tenant_id: string;
  report_type: ReportType;
  report_name: string;
  description?: string;
  filters?: Record<string, any>;
  date_range: {
    start_date: Date;
    end_date: Date;
  };
  generated_by: string;
  expires_at?: Date;
}

// Audit configuration
export interface AuditConfig {
  enabled: boolean;
  retention_days: number;
  log_successful_actions: boolean;
  log_failed_actions: boolean;
  log_system_actions: boolean;
  sensitive_actions: UserAction[];
  excluded_actions: UserAction[];
  security_monitoring: boolean;
  real_time_alerts: boolean;
}

// Default audit configuration
export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  retention_days: 365,
  log_successful_actions: true,
  log_failed_actions: true,
  log_system_actions: false,
  sensitive_actions: [
    'users.delete', 'users.role_change', 'users.permission_change',
    'settings.update', 'branding.update', 'subscription.change',
    'data.export', 'data.backup', 'data.restore'
  ],
  excluded_actions: [],
  security_monitoring: true,
  real_time_alerts: true
};

// Utility functions
export const isSecuritySensitiveAction = (action: UserAction): boolean => {
  return DEFAULT_AUDIT_CONFIG.sensitive_actions.includes(action);
};

export const shouldLogAction = (action: UserAction, status: ActivityStatus): boolean => {
  if (DEFAULT_AUDIT_CONFIG.excluded_actions.includes(action)) {
    return false;
  }
  
  if (status === 'success' && !DEFAULT_AUDIT_CONFIG.log_successful_actions) {
    return false;
  }
  
  if (status === 'failure' && !DEFAULT_AUDIT_CONFIG.log_failed_actions) {
    return false;
  }
  
  if (action.startsWith('system.') && !DEFAULT_AUDIT_CONFIG.log_system_actions) {
    return false;
  }
  
  return DEFAULT_AUDIT_CONFIG.enabled;
};

export const getActionCategory = (action: UserAction): string => {
  const [category] = action.split('.');
  return category;
};

export const getActionDescription = (action: UserAction): string => {
  const descriptions: Record<UserAction, string> = {
    // Authentication
    'auth.login': 'User logged in',
    'auth.logout': 'User logged out',
    'auth.register': 'User registered',
    'auth.password_reset': 'Password reset requested',
    'auth.mfa_enable': 'Multi-factor authentication enabled',
    'auth.mfa_disable': 'Multi-factor authentication disabled',
    'auth.session_refresh': 'Session refreshed',
    
    // User management
    'users.create': 'User created',
    'users.update': 'User updated',
    'users.delete': 'User deleted',
    'users.invite': 'User invited',
    'users.role_change': 'User role changed',
    'users.permission_change': 'User permissions changed',
    'users.activate': 'User activated',
    'users.deactivate': 'User deactivated',
    
    // CRM
    'leads.create': 'Lead created',
    'leads.update': 'Lead updated',
    'leads.delete': 'Lead deleted',
    'leads.assign': 'Lead assigned',
    'leads.stage_change': 'Lead stage changed',
    'leads.score_update': 'Lead score updated',
    'leads.convert': 'Lead converted',
    'interactions.create': 'Interaction created',
    'interactions.update': 'Interaction updated',
    'interactions.delete': 'Interaction deleted',
    
    // Contracts
    'contracts.create': 'Contract created',
    'contracts.update': 'Contract updated',
    'contracts.delete': 'Contract deleted',
    'contracts.send': 'Contract sent',
    'contracts.sign': 'Contract signed',
    'contracts.approve': 'Contract approved',
    'contracts.reject': 'Contract rejected',
    
    // Invoices
    'invoices.create': 'Invoice created',
    'invoices.update': 'Invoice updated',
    'invoices.delete': 'Invoice deleted',
    'invoices.send': 'Invoice sent',
    'invoices.approve': 'Invoice approved',
    'invoices.pay': 'Invoice paid',
    'invoices.cancel': 'Invoice cancelled',
    
    // Screening
    'screening.create': 'Screening created',
    'screening.update': 'Screening updated',
    'screening.delete': 'Screening deleted',
    'screening.submit': 'Screening submitted',
    'screening.approve': 'Screening approved',
    'screening.reject': 'Screening rejected',
    
    // Settings
    'settings.update': 'Settings updated',
    'branding.update': 'Branding updated',
    'subscription.change': 'Subscription changed',
    
    // Data operations
    'data.export': 'Data exported',
    'data.import': 'Data imported',
    'data.backup': 'Data backed up',
    'data.restore': 'Data restored',
    
    // System
    'system.login': 'System login',
    'system.error': 'System error',
    'system.warning': 'System warning'
  };
  
  return descriptions[action] || action;
};