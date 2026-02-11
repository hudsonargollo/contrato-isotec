/**
 * User Activity Audit Service
 * 
 * Comprehensive audit service for logging user activities, managing sessions,
 * tracking security events, and generating compliance reports.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { createClient } from '@/lib/supabase/server';
import {
  UserAction,
  ActivityStatus,
  ResourceType,
  SecurityEventType,
  SecuritySeverity,
  ReportType,
  UserActivityLog,
  AuditSession,
  SecurityEvent,
  AuditReport,
  CreateUserActivityLog,
  CreateAuditSession,
  CreateSecurityEvent,
  CreateAuditReport,
  UpdateSecurityEvent,
  UpdateAuditReport,
  AuditQuery,
  SecurityEventQuery,
  ActivitySummary,
  AuditDashboardMetrics,
  AuditContext,
  ActivityLogOptions,
  AuditEventPayload,
  SecurityEventPayload,
  ReportGenerationOptions,
  shouldLogAction,
  isSecuritySensitiveAction,
  getActionDescription
} from '@/lib/types/audit';

export interface AuditServiceConfig {
  enableRealTimeAlerts: boolean;
  retentionDays: number;
  batchSize: number;
  maxRetries: number;
}

/**
 * Audit Service Class
 * Manages comprehensive user activity logging and security monitoring
 */
export class AuditService {
  private static instance: AuditService;
  private config: AuditServiceConfig;

  private constructor(config?: Partial<AuditServiceConfig>) {
    this.config = {
      enableRealTimeAlerts: true,
      retentionDays: 365,
      batchSize: 100,
      maxRetries: 3,
      ...config
    };
  }

  public static getInstance(config?: Partial<AuditServiceConfig>): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService(config);
    }
    return AuditService.instance;
  }

  /**
   * Log user activity
   */
  async logActivity(
    action: UserAction,
    context: AuditContext,
    options?: ActivityLogOptions
  ): Promise<string | null> {
    const status = options?.status || 'success';
    
    // Check if we should log this action
    if (!shouldLogAction(action, status)) {
      return null;
    }

    const supabase = await createClient();
    
    const activityData: CreateUserActivityLog = {
      tenant_id: context.tenant_id,
      user_id: context.user_id,
      action,
      resource_type: options?.resource_type,
      resource_id: options?.resource_id,
      resource_name: options?.resource_name,
      ip_address: context.ip_address,
      user_agent: context.user_agent,
      session_id: context.session_id,
      request_id: context.request_id,
      metadata: options?.metadata || {},
      changes: options?.changes || {},
      status,
      error_message: options?.error_message,
      duration_ms: options?.duration_ms
    };

    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .insert(activityData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log user activity:', error);
        return null;
      }

      // Create security event for sensitive actions
      if (isSecuritySensitiveAction(action) && status === 'success') {
        await this.createSecurityEvent({
          event_type: 'suspicious_activity',
          severity: 'medium',
          description: `Sensitive action performed: ${getActionDescription(action)}`,
          context,
          resource_type: options?.resource_type,
          resource_id: options?.resource_id,
          metadata: {
            action,
            ...options?.metadata
          }
        });
      }

      // Update session activity
      if (context.session_id && context.user_id) {
        await this.updateSessionActivity(
          context.tenant_id,
          context.user_id,
          context.session_id
        );
      }

      return data.id;
    } catch (error) {
      console.error('Error logging user activity:', error);
      return null;
    }
  }

  /**
   * Batch log multiple activities
   */
  async logActivities(activities: AuditEventPayload[]): Promise<string[]> {
    const supabase = await createClient();
    const loggedIds: string[] = [];

    // Process in batches
    for (let i = 0; i < activities.length; i += this.config.batchSize) {
      const batch = activities.slice(i, i + this.config.batchSize);
      
      const activityData = batch
        .filter(activity => shouldLogAction(activity.action, activity.options?.status || 'success'))
        .map(activity => ({
          tenant_id: activity.context.tenant_id,
          user_id: activity.context.user_id,
          action: activity.action,
          resource_type: activity.options?.resource_type,
          resource_id: activity.options?.resource_id,
          resource_name: activity.options?.resource_name,
          ip_address: activity.context.ip_address,
          user_agent: activity.context.user_agent,
          session_id: activity.context.session_id,
          request_id: activity.context.request_id,
          metadata: activity.options?.metadata || {},
          changes: activity.options?.changes || {},
          status: activity.options?.status || 'success',
          error_message: activity.options?.error_message,
          duration_ms: activity.options?.duration_ms
        }));

      if (activityData.length === 0) continue;

      try {
        const { data, error } = await supabase
          .from('user_activity_logs')
          .insert(activityData)
          .select('id');

        if (error) {
          console.error('Failed to batch log activities:', error);
          continue;
        }

        loggedIds.push(...(data?.map(item => item.id) || []));
      } catch (error) {
        console.error('Error batch logging activities:', error);
      }
    }

    return loggedIds;
  }

  /**
   * Create or update audit session
   */
  async manageSession(
    action: 'start' | 'update' | 'end',
    tenantId: string,
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent?: string,
    deviceInfo?: Record<string, any>
  ): Promise<string | null> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.rpc('manage_audit_session', {
        p_tenant_id: tenantId,
        p_user_id: userId,
        p_session_id: sessionId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_device_info: deviceInfo || {},
        p_action: action
      });

      if (error) {
        console.error('Failed to manage audit session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error managing audit session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   */
  private async updateSessionActivity(
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<void> {
    await this.manageSession('update', tenantId, userId, sessionId, '127.0.0.1');
  }

  /**
   * Create security event
   */
  async createSecurityEvent(payload: SecurityEventPayload): Promise<string | null> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.rpc('create_security_event', {
        p_tenant_id: payload.context.tenant_id,
        p_user_id: payload.context.user_id,
        p_event_type: payload.event_type,
        p_severity: payload.severity,
        p_description: payload.description,
        p_ip_address: payload.context.ip_address,
        p_user_agent: payload.context.user_agent,
        p_resource_type: payload.resource_type,
        p_resource_id: payload.resource_id,
        p_metadata: payload.metadata || {}
      });

      if (error) {
        console.error('Failed to create security event:', error);
        return null;
      }

      // Send real-time alert for critical events
      if (payload.severity === 'critical' && this.config.enableRealTimeAlerts) {
        await this.sendSecurityAlert(data, payload);
      }

      return data;
    } catch (error) {
      console.error('Error creating security event:', error);
      return null;
    }
  }

  /**
   * Get user activities with filtering
   */
  async getUserActivities(query: AuditQuery): Promise<{
    activities: UserActivityLog[];
    total: number;
  }> {
    const supabase = await createClient();

    let queryBuilder = supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', query.tenant_id);

    // Apply filters
    if (query.user_id) {
      queryBuilder = queryBuilder.eq('user_id', query.user_id);
    }
    if (query.action) {
      queryBuilder = queryBuilder.eq('action', query.action);
    }
    if (query.resource_type) {
      queryBuilder = queryBuilder.eq('resource_type', query.resource_type);
    }
    if (query.resource_id) {
      queryBuilder = queryBuilder.eq('resource_id', query.resource_id);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }
    if (query.start_date) {
      queryBuilder = queryBuilder.gte('created_at', query.start_date.toISOString());
    }
    if (query.end_date) {
      queryBuilder = queryBuilder.lte('created_at', query.end_date.toISOString());
    }
    if (query.ip_address) {
      queryBuilder = queryBuilder.eq('ip_address', query.ip_address);
    }

    // Apply pagination and ordering
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Failed to get user activities:', error);
      return { activities: [], total: 0 };
    }

    return {
      activities: data || [],
      total: count || 0
    };
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(query: SecurityEventQuery): Promise<{
    events: SecurityEvent[];
    total: number;
  }> {
    const supabase = await createClient();

    let queryBuilder = supabase
      .from('security_events')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query.tenant_id) {
      queryBuilder = queryBuilder.eq('tenant_id', query.tenant_id);
    }
    if (query.user_id) {
      queryBuilder = queryBuilder.eq('user_id', query.user_id);
    }
    if (query.event_type) {
      queryBuilder = queryBuilder.eq('event_type', query.event_type);
    }
    if (query.severity) {
      queryBuilder = queryBuilder.eq('severity', query.severity);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }
    if (query.start_date) {
      queryBuilder = queryBuilder.gte('created_at', query.start_date.toISOString());
    }
    if (query.end_date) {
      queryBuilder = queryBuilder.lte('created_at', query.end_date.toISOString());
    }

    // Apply pagination and ordering
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Failed to get security events:', error);
      return { events: [], total: 0 };
    }

    return {
      events: data || [],
      total: count || 0
    };
  }

  /**
   * Get activity summary for dashboard
   */
  async getActivitySummary(
    tenantId: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ActivitySummary[]> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.rpc('get_user_activity_summary', {
        p_tenant_id: tenantId,
        p_user_id: userId,
        p_start_date: startDate?.toISOString(),
        p_end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Failed to get activity summary:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return [];
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditDashboardMetrics> {
    const supabase = await createClient();

    try {
      // Get activity counts
      const activityQuery = supabase
        .from('user_activity_logs')
        .select('status', { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (startDate) {
        activityQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        activityQuery.lte('created_at', endDate.toISOString());
      }

      const { count: totalActivities } = await activityQuery;

      // Get successful activities
      const { count: successfulActivities } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'success')
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      // Get failed activities
      const { count: failedActivities } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'failure')
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      // Get unique users
      const { data: uniqueUsersData } = await supabase
        .from('user_activity_logs')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      const uniqueUsers = new Set(uniqueUsersData?.map(u => u.user_id).filter(Boolean)).size;

      // Get active sessions
      const { count: activeSessions } = await supabase
        .from('audit_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      // Get security events
      const { count: securityEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      // Get critical events
      const { count: criticalEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('severity', 'critical')
        .gte('created_at', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', endDate?.toISOString() || new Date().toISOString());

      // Get top actions
      const topActions = await this.getActivitySummary(tenantId, undefined, startDate, endDate);

      // Get recent activities
      const { data: recentActivities } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get security alerts
      const { data: securityAlerts } = await supabase
        .from('security_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        total_activities: totalActivities || 0,
        successful_activities: successfulActivities || 0,
        failed_activities: failedActivities || 0,
        unique_users: uniqueUsers,
        active_sessions: activeSessions || 0,
        security_events: securityEvents || 0,
        critical_events: criticalEvents || 0,
        top_actions: topActions.slice(0, 10),
        recent_activities: recentActivities || [],
        security_alerts: securityAlerts || []
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        total_activities: 0,
        successful_activities: 0,
        failed_activities: 0,
        unique_users: 0,
        active_sessions: 0,
        security_events: 0,
        critical_events: 0,
        top_actions: [],
        recent_activities: [],
        security_alerts: []
      };
    }
  }

  /**
   * Generate audit report
   */
  async generateReport(options: ReportGenerationOptions): Promise<string | null> {
    const supabase = await createClient();

    // Create report record
    const reportData: CreateAuditReport = {
      tenant_id: options.tenant_id,
      report_type: options.report_type,
      report_name: options.report_name,
      description: options.description,
      filters: options.filters || {},
      date_range: options.date_range,
      generated_by: options.generated_by,
      expires_at: options.expires_at
    };

    try {
      const { data: report, error } = await supabase
        .from('audit_reports')
        .insert(reportData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create audit report:', error);
        return null;
      }

      // Generate report data asynchronously
      this.generateReportData(report.id, options);

      return report.id;
    } catch (error) {
      console.error('Error generating audit report:', error);
      return null;
    }
  }

  /**
   * Generate report data (async)
   */
  private async generateReportData(
    reportId: string,
    options: ReportGenerationOptions
  ): Promise<void> {
    const supabase = await createClient();

    try {
      // Update status to generating
      await supabase
        .from('audit_reports')
        .update({ status: 'generating' })
        .eq('id', reportId);

      let reportData: any = {};

      // Generate different types of reports
      switch (options.report_type) {
        case 'user_activity':
          reportData = await this.generateUserActivityReport(options);
          break;
        case 'security_events':
          reportData = await this.generateSecurityEventsReport(options);
          break;
        case 'login_history':
          reportData = await this.generateLoginHistoryReport(options);
          break;
        case 'compliance_summary':
          reportData = await this.generateComplianceReport(options);
          break;
        default:
          reportData = await this.generateCustomReport(options);
      }

      // Update report with generated data
      await supabase
        .from('audit_reports')
        .update({
          status: 'completed',
          report_data: reportData
        })
        .eq('id', reportId);

    } catch (error) {
      console.error('Error generating report data:', error);
      
      // Update report status to failed
      await supabase
        .from('audit_reports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', reportId);
    }
  }

  /**
   * Generate user activity report
   */
  private async generateUserActivityReport(options: ReportGenerationOptions): Promise<any> {
    const activities = await this.getUserActivities({
      tenant_id: options.tenant_id,
      start_date: options.date_range.start_date,
      end_date: options.date_range.end_date,
      limit: 10000,
      offset: 0,
      ...options.filters
    });

    const summary = await this.getActivitySummary(
      options.tenant_id,
      undefined,
      options.date_range.start_date,
      options.date_range.end_date
    );

    return {
      summary: {
        total_activities: activities.total,
        date_range: options.date_range,
        top_actions: summary.slice(0, 10)
      },
      activities: activities.activities
    };
  }

  /**
   * Generate security events report
   */
  private async generateSecurityEventsReport(options: ReportGenerationOptions): Promise<any> {
    const events = await this.getSecurityEvents({
      tenant_id: options.tenant_id,
      start_date: options.date_range.start_date,
      end_date: options.date_range.end_date,
      limit: 10000,
      offset: 0,
      ...options.filters
    });

    return {
      summary: {
        total_events: events.total,
        date_range: options.date_range
      },
      events: events.events
    };
  }

  /**
   * Generate login history report
   */
  private async generateLoginHistoryReport(options: ReportGenerationOptions): Promise<any> {
    const loginActivities = await this.getUserActivities({
      tenant_id: options.tenant_id,
      action: 'auth.login',
      start_date: options.date_range.start_date,
      end_date: options.date_range.end_date,
      limit: 10000,
      offset: 0
    });

    return {
      summary: {
        total_logins: loginActivities.total,
        date_range: options.date_range
      },
      logins: loginActivities.activities
    };
  }

  /**
   * Generate compliance report
   */
  private async generateComplianceReport(options: ReportGenerationOptions): Promise<any> {
    const metrics = await this.getDashboardMetrics(
      options.tenant_id,
      options.date_range.start_date,
      options.date_range.end_date
    );

    return {
      compliance_summary: {
        date_range: options.date_range,
        total_activities: metrics.total_activities,
        security_events: metrics.security_events,
        critical_events: metrics.critical_events,
        unique_users: metrics.unique_users
      },
      security_alerts: metrics.security_alerts,
      top_actions: metrics.top_actions
    };
  }

  /**
   * Generate custom report
   */
  private async generateCustomReport(options: ReportGenerationOptions): Promise<any> {
    // Custom report logic based on filters
    return {
      message: 'Custom report generated',
      filters: options.filters,
      date_range: options.date_range
    };
  }

  /**
   * Send security alert (placeholder for real implementation)
   */
  private async sendSecurityAlert(eventId: string, payload: SecurityEventPayload): Promise<void> {
    // In a real implementation, this would send notifications via email, Slack, etc.
    console.log(`SECURITY ALERT: ${payload.description}`, {
      eventId,
      severity: payload.severity,
      eventType: payload.event_type
    });
  }

  /**
   * Clean up old audit data
   */
  async cleanupOldData(retentionDays?: number): Promise<number> {
    const supabase = await createClient();
    const retention = retentionDays || this.config.retentionDays;

    try {
      const { data, error } = await supabase.rpc('cleanup_audit_data', {
        retention_days: retention
      });

      if (error) {
        console.error('Failed to cleanup audit data:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error cleaning up audit data:', error);
      return 0;
    }
  }

  /**
   * Update security event status
   */
  async updateSecurityEvent(
    eventId: string,
    updates: UpdateSecurityEvent
  ): Promise<boolean> {
    const supabase = await createClient();

    try {
      const updateData: any = { ...updates };
      
      if (updates.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('security_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        console.error('Failed to update security event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating security event:', error);
      return false;
    }
  }

  /**
   * Get audit report
   */
  async getAuditReport(reportId: string): Promise<AuditReport | null> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Failed to get audit report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting audit report:', error);
      return null;
    }
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();

// Utility functions for middleware integration
export const logUserActivity = async (
  action: UserAction,
  context: AuditContext,
  options?: ActivityLogOptions
): Promise<string | null> => {
  return auditService.logActivity(action, context, options);
};

export const createSecurityEvent = async (
  payload: SecurityEventPayload
): Promise<string | null> => {
  return auditService.createSecurityEvent(payload);
};

export const startAuditSession = async (
  tenantId: string,
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent?: string,
  deviceInfo?: Record<string, any>
): Promise<string | null> => {
  return auditService.manageSession('start', tenantId, userId, sessionId, ipAddress, userAgent, deviceInfo);
};

export const endAuditSession = async (
  tenantId: string,
  userId: string,
  sessionId: string,
  ipAddress: string
): Promise<string | null> => {
  return auditService.manageSession('end', tenantId, userId, sessionId, ipAddress);
};