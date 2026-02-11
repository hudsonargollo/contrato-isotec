/**
 * Audit Middleware
 * 
 * Middleware for automatically logging user activities, managing sessions,
 * and monitoring security events across the platform.
 * 
 * Requirements: 8.5, 12.3 - User Management and Security Compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditService, logUserActivity, createSecurityEvent } from '@/lib/services/audit';
import { 
  UserAction, 
  AuditContext, 
  ActivityLogOptions,
  SecurityEventType,
  SecuritySeverity 
} from '@/lib/types/audit';

export interface AuditMiddlewareConfig {
  enableActivityLogging: boolean;
  enableSecurityMonitoring: boolean;
  enableSessionTracking: boolean;
  excludedPaths: string[];
  excludedActions: UserAction[];
  sensitiveEndpoints: string[];
  maxFailedAttempts: number;
  suspiciousActivityThreshold: number;
}

const DEFAULT_CONFIG: AuditMiddlewareConfig = {
  enableActivityLogging: true,
  enableSecurityMonitoring: true,
  enableSessionTracking: true,
  excludedPaths: ['/api/health', '/api/metrics', '/_next', '/favicon.ico'],
  excludedActions: [],
  sensitiveEndpoints: [
    '/api/users',
    '/api/tenants',
    '/api/settings',
    '/api/billing',
    '/api/export'
  ],
  maxFailedAttempts: 5,
  suspiciousActivityThreshold: 10
};

/**
 * Audit Middleware Class
 */
export class AuditMiddleware {
  private config: AuditMiddlewareConfig;
  private failedAttempts: Map<string, number> = new Map();
  private activityCounts: Map<string, number> = new Map();

  constructor(config?: Partial<AuditMiddlewareConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main middleware function
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next();
    
    // Skip excluded paths
    if (this.shouldSkipPath(request.nextUrl.pathname)) {
      return response;
    }

    try {
      const context = await this.buildAuditContext(request);
      
      if (!context) {
        return response;
      }

      // Log the request
      if (this.config.enableActivityLogging) {
        await this.logRequest(request, context);
      }

      // Monitor for security events
      if (this.config.enableSecurityMonitoring) {
        await this.monitorSecurity(request, context);
      }

      // Track session activity
      if (this.config.enableSessionTracking && context.session_id) {
        await this.trackSession(request, context);
      }

      return response;
    } catch (error) {
      console.error('Audit middleware error:', error);
      return response;
    }
  }

  /**
   * Build audit context from request
   */
  private async buildAuditContext(request: NextRequest): Promise<AuditContext | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get tenant context
      const tenantId = request.headers.get('x-tenant-id') || 
                     request.cookies.get('tenant-id')?.value;
      
      if (!tenantId) {
        return null;
      }

      const ipAddress = this.getClientIP(request);
      const userAgent = request.headers.get('user-agent') || undefined;
      const sessionId = request.cookies.get('session-id')?.value;
      const requestId = request.headers.get('x-request-id') || 
                       crypto.randomUUID();

      return {
        tenant_id: tenantId,
        user_id: user?.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        request_id: requestId
      };
    } catch (error) {
      console.error('Error building audit context:', error);
      return null;
    }
  }

  /**
   * Log HTTP request as user activity
   */
  private async logRequest(request: NextRequest, context: AuditContext): Promise<void> {
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    const action = this.mapRequestToAction(method, pathname);
    
    if (!action || this.config.excludedActions.includes(action)) {
      return;
    }

    const options: ActivityLogOptions = {
      metadata: {
        method,
        pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
        headers: this.sanitizeHeaders(request.headers)
      }
    };

    // Extract resource information from URL
    const resourceInfo = this.extractResourceInfo(pathname);
    if (resourceInfo) {
      options.resource_type = resourceInfo.type;
      options.resource_id = resourceInfo.id;
      options.resource_name = resourceInfo.name;
    }

    await logUserActivity(action, context, options);
  }

  /**
   * Monitor for security events
   */
  private async monitorSecurity(request: NextRequest, context: AuditContext): Promise<void> {
    const ipAddress = context.ip_address;
    const userId = context.user_id;
    const pathname = request.nextUrl.pathname;

    // Check for suspicious activity patterns
    await this.checkSuspiciousActivity(request, context);
    
    // Check for unauthorized access attempts
    await this.checkUnauthorizedAccess(request, context);
    
    // Check for brute force attacks
    await this.checkBruteForce(request, context);
    
    // Check for sensitive endpoint access
    if (this.isSensitiveEndpoint(pathname)) {
      await this.logSensitiveAccess(request, context);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(request: NextRequest, context: AuditContext): Promise<void> {
    const key = `activity_${context.ip_address}_${context.user_id || 'anonymous'}`;
    const currentCount = this.activityCounts.get(key) || 0;
    const newCount = currentCount + 1;
    
    this.activityCounts.set(key, newCount);
    
    // Reset counter after 1 hour
    setTimeout(() => {
      this.activityCounts.delete(key);
    }, 60 * 60 * 1000);

    if (newCount > this.config.suspiciousActivityThreshold) {
      await createSecurityEvent({
        event_type: 'unusual_access_pattern',
        severity: 'medium',
        description: `Unusual activity pattern detected: ${newCount} requests in short time`,
        context,
        metadata: {
          request_count: newCount,
          pathname: request.nextUrl.pathname,
          method: request.method
        }
      });
    }
  }

  /**
   * Check for unauthorized access attempts
   */
  private async checkUnauthorizedAccess(request: NextRequest, context: AuditContext): Promise<void> {
    // Check if accessing protected resources without proper authentication
    if (!context.user_id && this.isProtectedEndpoint(request.nextUrl.pathname)) {
      await createSecurityEvent({
        event_type: 'unauthorized_access',
        severity: 'high',
        description: `Unauthorized access attempt to protected endpoint: ${request.nextUrl.pathname}`,
        context,
        metadata: {
          pathname: request.nextUrl.pathname,
          method: request.method
        }
      });
    }
  }

  /**
   * Check for brute force attacks
   */
  private async checkBruteForce(request: NextRequest, context: AuditContext): Promise<void> {
    // Only check for login endpoints
    if (!request.nextUrl.pathname.includes('/auth/') && !request.nextUrl.pathname.includes('/login')) {
      return;
    }

    const key = `failed_${context.ip_address}`;
    const failedCount = this.failedAttempts.get(key) || 0;

    // This would be called after authentication failure
    if (request.method === 'POST' && failedCount >= this.config.maxFailedAttempts) {
      await createSecurityEvent({
        event_type: 'brute_force_attack',
        severity: 'critical',
        description: `Brute force attack detected: ${failedCount} failed login attempts`,
        context,
        metadata: {
          failed_attempts: failedCount,
          pathname: request.nextUrl.pathname
        }
      });
    }
  }

  /**
   * Log sensitive endpoint access
   */
  private async logSensitiveAccess(request: NextRequest, context: AuditContext): Promise<void> {
    await createSecurityEvent({
      event_type: 'suspicious_activity',
      severity: 'medium',
      description: `Access to sensitive endpoint: ${request.nextUrl.pathname}`,
      context,
      metadata: {
        pathname: request.nextUrl.pathname,
        method: request.method,
        query: Object.fromEntries(request.nextUrl.searchParams)
      }
    });
  }

  /**
   * Track session activity
   */
  private async trackSession(request: NextRequest, context: AuditContext): Promise<void> {
    if (!context.user_id || !context.session_id) {
      return;
    }

    try {
      await auditService.manageSession(
        'update',
        context.tenant_id,
        context.user_id,
        context.session_id,
        context.ip_address || '127.0.0.1',
        context.user_agent
      );
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  }

  /**
   * Map HTTP request to user action
   */
  private mapRequestToAction(method: string, pathname: string): UserAction | null {
    // Authentication endpoints
    if (pathname.includes('/auth/login')) return 'auth.login';
    if (pathname.includes('/auth/logout')) return 'auth.logout';
    if (pathname.includes('/auth/register')) return 'auth.register';
    if (pathname.includes('/auth/reset')) return 'auth.password_reset';

    // API endpoints mapping
    const apiMatch = pathname.match(/^\/api\/([^\/]+)(?:\/([^\/]+))?/);
    if (!apiMatch) return null;

    const [, resource, action] = apiMatch;
    
    // Map REST operations to actions
    switch (method) {
      case 'GET':
        return null; // Don't log read operations by default
      case 'POST':
        return this.getCreateAction(resource);
      case 'PUT':
      case 'PATCH':
        return this.getUpdateAction(resource);
      case 'DELETE':
        return this.getDeleteAction(resource);
      default:
        return null;
    }
  }

  /**
   * Get create action for resource
   */
  private getCreateAction(resource: string): UserAction | null {
    const actionMap: Record<string, UserAction> = {
      'users': 'users.create',
      'leads': 'leads.create',
      'contracts': 'contracts.create',
      'invoices': 'invoices.create',
      'screening': 'screening.create',
      'interactions': 'interactions.create'
    };
    
    return actionMap[resource] || null;
  }

  /**
   * Get update action for resource
   */
  private getUpdateAction(resource: string): UserAction | null {
    const actionMap: Record<string, UserAction> = {
      'users': 'users.update',
      'leads': 'leads.update',
      'contracts': 'contracts.update',
      'invoices': 'invoices.update',
      'screening': 'screening.update',
      'interactions': 'interactions.update',
      'settings': 'settings.update',
      'branding': 'branding.update'
    };
    
    return actionMap[resource] || null;
  }

  /**
   * Get delete action for resource
   */
  private getDeleteAction(resource: string): UserAction | null {
    const actionMap: Record<string, UserAction> = {
      'users': 'users.delete',
      'leads': 'leads.delete',
      'contracts': 'contracts.delete',
      'invoices': 'invoices.delete',
      'screening': 'screening.delete',
      'interactions': 'interactions.delete'
    };
    
    return actionMap[resource] || null;
  }

  /**
   * Extract resource information from pathname
   */
  private extractResourceInfo(pathname: string): {
    type: string;
    id?: string;
    name?: string;
  } | null {
    const match = pathname.match(/^\/api\/([^\/]+)(?:\/([^\/]+))?/);
    if (!match) return null;

    const [, resource, id] = match;
    
    return {
      type: resource,
      id: id && id !== 'route' ? id : undefined
    };
  }

  /**
   * Check if path should be skipped
   */
  private shouldSkipPath(pathname: string): boolean {
    return this.config.excludedPaths.some(path => 
      pathname.startsWith(path)
    );
  }

  /**
   * Check if endpoint is sensitive
   */
  private isSensitiveEndpoint(pathname: string): boolean {
    return this.config.sensitiveEndpoints.some(endpoint =>
      pathname.startsWith(endpoint)
    );
  }

  /**
   * Check if endpoint is protected
   */
  private isProtectedEndpoint(pathname: string): boolean {
    // Most API endpoints are protected except public ones
    const publicEndpoints = [
      '/api/health',
      '/api/auth',
      '/api/public'
    ];
    
    return pathname.startsWith('/api/') && 
           !publicEndpoints.some(endpoint => pathname.startsWith(endpoint));
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || cfIP || '127.0.0.1';
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    headers.forEach((value, key) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Record authentication failure
   */
  async recordAuthFailure(ipAddress: string): Promise<void> {
    const key = `failed_${ipAddress}`;
    const currentCount = this.failedAttempts.get(key) || 0;
    const newCount = currentCount + 1;
    
    this.failedAttempts.set(key, newCount);
    
    // Reset counter after 1 hour
    setTimeout(() => {
      this.failedAttempts.delete(key);
    }, 60 * 60 * 1000);
  }

  /**
   * Clear authentication failures
   */
  async clearAuthFailures(ipAddress: string): Promise<void> {
    const key = `failed_${ipAddress}`;
    this.failedAttempts.delete(key);
  }
}

// Export singleton instance
export const auditMiddleware = new AuditMiddleware();

// Utility functions for Next.js middleware integration
export const createAuditMiddleware = (config?: Partial<AuditMiddlewareConfig>) => {
  return new AuditMiddleware(config);
};

export const withAuditLogging = (handler: any) => {
  return async (request: NextRequest, context: any) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;
      
      // Log successful request
      const auditContext = await auditMiddleware['buildAuditContext'](request);
      if (auditContext) {
        const action = auditMiddleware['mapRequestToAction'](request.method, request.nextUrl.pathname);
        if (action) {
          await logUserActivity(action, auditContext, {
            status: 'success',
            duration_ms: duration,
            metadata: {
              status_code: response.status
            }
          });
        }
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed request
      const auditContext = await auditMiddleware['buildAuditContext'](request);
      if (auditContext) {
        const action = auditMiddleware['mapRequestToAction'](request.method, request.nextUrl.pathname);
        if (action) {
          await logUserActivity(action, auditContext, {
            status: 'failure',
            duration_ms: duration,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      throw error;
    }
  };
};