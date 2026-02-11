/**
 * Simple Audit Logger Interface
 * Provides a simplified interface for logging audit events across the platform
 * Requirements: 4.3, 8.5, 12.3 - Payment gateway integration and audit logging
 */

import { auditService } from './audit';
import { UserAction } from '@/lib/types/audit';

export interface AuditLogEntry {
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
}

export interface AuditContext {
  tenant_id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
}

/**
 * Simple audit logger class that wraps the comprehensive audit service
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const context: AuditContext = {
        tenant_id: entry.tenant_id,
        user_id: entry.user_id,
        ip_address: '127.0.0.1', // Default IP for system events
        user_agent: 'System',
        session_id: 'system',
        request_id: `req_${Date.now()}`
      };

      // Map action string to UserAction enum
      const action = this.mapActionToUserAction(entry.action);

      await auditService.logActivity(action, context, {
        resource_type: entry.resource_type as any,
        resource_id: entry.resource_id,
        metadata: entry.details,
        status: 'success'
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Map string actions to UserAction enum values
   */
  private mapActionToUserAction(action: string): UserAction {
    // Map common payment actions to audit actions
    const actionMap: Record<string, UserAction> = {
      'payments.create_intent': 'payments.create',
      'payments.view_intent': 'payments.view',
      'payments.refund': 'payments.refund',
      'payments.reconcile': 'payments.reconcile',
      'payments.webhook_processed': 'payments.webhook',
      'payments.webhook_error': 'payments.webhook',
      'payments.reconcile_error': 'payments.reconcile',
      'payments.refund_error': 'payments.refund',
      'invoices.create': 'invoices.create',
      'invoices.update': 'invoices.update',
      'invoices.delete': 'invoices.delete',
      'invoices.view': 'invoices.view',
      'invoices.approve': 'invoices.approve',
      'invoices.send': 'invoices.send'
    };

    return actionMap[action] || 'system.other';
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();