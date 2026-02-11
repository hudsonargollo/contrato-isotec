/**
 * Analytics Middleware
 * Requirements: 6.1 - Analytics data collection system
 * Automatically tracks events and collects metrics from API requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analytics';
import { getTenantContext } from '@/lib/utils/tenant-context';
import type { EventTrackingContext } from '@/lib/types/analytics';

interface AnalyticsMiddlewareConfig {
  trackRequests?: boolean;
  trackErrors?: boolean;
  trackPerformance?: boolean;
  excludePaths?: string[];
  includeHeaders?: string[];
  sampleRate?: number; // 0-1, for sampling requests
}

const defaultConfig: AnalyticsMiddlewareConfig = {
  trackRequests: true,
  trackErrors: true,
  trackPerformance: true,
  excludePaths: ['/api/analytics', '/api/health', '/_next'],
  includeHeaders: ['user-agent', 'referer'],
  sampleRate: 1.0
};

/**
 * Analytics middleware for automatic event tracking
 */
export function withAnalytics(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: AnalyticsMiddlewareConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    let response: NextResponse;
    let error: Error | null = null;

    // Check if we should track this request
    if (!shouldTrackRequest(req, finalConfig)) {
      return handler(req);
    }

    // Get tracking context
    const trackingContext = await getTrackingContext(req);
    if (!trackingContext) {
      return handler(req);
    }

    try {
      // Execute the handler
      response = await handler(req);

      // Track successful request
      if (finalConfig.trackRequests) {
        await trackRequestEvent(req, response, trackingContext, startTime);
      }

      // Track performance metrics
      if (finalConfig.trackPerformance) {
        await trackPerformanceMetrics(req, response, trackingContext, startTime);
      }

    } catch (err) {
      error = err as Error;
      
      // Track error
      if (finalConfig.trackErrors) {
        await trackErrorEvent(req, error, trackingContext, startTime);
      }

      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return response;
  };
}

/**
 * Track API request events
 */
async function trackRequestEvent(
  req: NextRequest,
  response: NextResponse,
  context: EventTrackingContext,
  startTime: number
): Promise<void> {
  try {
    const url = new URL(req.url);
    const method = req.method;
    const status = response.status;
    const duration = Date.now() - startTime;

    await analyticsService.trackEvent({
      event_name: 'api_request',
      event_category: 'system',
      event_action: method.toLowerCase() as any,
      properties: {
        path: url.pathname,
        method,
        status,
        duration_ms: duration,
        query_params: Object.fromEntries(url.searchParams),
        response_size: response.headers.get('content-length') || 0
      },
      metadata: {
        user_agent: req.headers.get('user-agent'),
        referer: req.headers.get('referer'),
        ip_address: getClientIP(req)
      }
    }, context);
  } catch (error) {
    console.error('Failed to track request event:', error);
  }
}

/**
 * Track error events
 */
async function trackErrorEvent(
  req: NextRequest,
  error: Error,
  context: EventTrackingContext,
  startTime: number
): Promise<void> {
  try {
    const url = new URL(req.url);
    const duration = Date.now() - startTime;

    await analyticsService.trackEvent({
      event_name: 'api_error',
      event_category: 'system',
      event_action: 'error',
      properties: {
        path: url.pathname,
        method: req.method,
        error_name: error.name,
        error_message: error.message,
        duration_ms: duration,
        stack_trace: error.stack?.substring(0, 1000) // Limit stack trace size
      },
      metadata: {
        user_agent: req.headers.get('user-agent'),
        referer: req.headers.get('referer'),
        ip_address: getClientIP(req)
      }
    }, context);
  } catch (trackingError) {
    console.error('Failed to track error event:', trackingError);
  }
}

/**
 * Track performance metrics
 */
async function trackPerformanceMetrics(
  req: NextRequest,
  response: NextResponse,
  context: EventTrackingContext,
  startTime: number
): Promise<void> {
  try {
    const url = new URL(req.url);
    const duration = Date.now() - startTime;
    const method = req.method;
    const status = response.status;

    // Record response time metric
    await analyticsService.recordMetric(
      { tenant_id: context.tenant_id, user_id: context.user_id },
      'api_response_time',
      duration,
      'histogram',
      'performance',
      {
        path: url.pathname,
        method,
        status_code: status
      }
    );

    // Record request count metric
    await analyticsService.recordMetric(
      { tenant_id: context.tenant_id, user_id: context.user_id },
      'api_request_count',
      1,
      'counter',
      'usage',
      {
        path: url.pathname,
        method,
        status_code: status
      }
    );

    // Record error rate if applicable
    if (status >= 400) {
      await analyticsService.recordMetric(
        { tenant_id: context.tenant_id, user_id: context.user_id },
        'api_error_count',
        1,
        'counter',
        'errors',
        {
          path: url.pathname,
          method,
          status_code: status
        }
      );
    }
  } catch (error) {
    console.error('Failed to track performance metrics:', error);
  }
}

/**
 * Get tracking context from request
 */
async function getTrackingContext(req: NextRequest): Promise<EventTrackingContext | null> {
  try {
    // Try to get tenant context
    const tenantContext = await getTenantContext(req);
    if (!tenantContext) {
      return null;
    }

    return {
      tenant_id: tenantContext.tenant_id,
      user_id: tenantContext.user_id,
      session_id: req.headers.get('x-session-id') || undefined,
      ip_address: getClientIP(req),
      user_agent: req.headers.get('user-agent') || undefined
    };
  } catch (error) {
    console.error('Failed to get tracking context:', error);
    return null;
  }
}

/**
 * Check if request should be tracked
 */
function shouldTrackRequest(req: NextRequest, config: AnalyticsMiddlewareConfig): boolean {
  const url = new URL(req.url);
  
  // Check excluded paths
  if (config.excludePaths?.some(path => url.pathname.startsWith(path))) {
    return false;
  }

  // Check sample rate
  if (config.sampleRate && config.sampleRate < 1) {
    return Math.random() < config.sampleRate;
  }

  return true;
}

/**
 * Get client IP address
 */
function getClientIP(req: NextRequest): string | undefined {
  // Check various headers for client IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return undefined;
}

/**
 * Decorator for tracking specific events in API handlers
 */
export function trackEvent(
  eventName: string,
  eventCategory: 'crm' | 'whatsapp' | 'invoice' | 'contract' | 'user' | 'system',
  eventAction: string,
  entityType?: string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0] as NextRequest;
      const trackingContext = await getTrackingContext(req);

      try {
        const result = await method.apply(this, args);

        // Track successful event
        if (trackingContext) {
          await analyticsService.trackEvent({
            event_name: eventName,
            event_category: eventCategory,
            event_action: eventAction as any,
            entity_type: entityType,
            properties: {
              success: true,
              method: req.method,
              path: new URL(req.url).pathname
            }
          }, trackingContext);
        }

        return result;
      } catch (error) {
        // Track error event
        if (trackingContext) {
          await analyticsService.trackEvent({
            event_name: `${eventName}_error`,
            event_category: eventCategory,
            event_action: 'error',
            entity_type: entityType,
            properties: {
              success: false,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              method: req.method,
              path: new URL(req.url).pathname
            }
          }, trackingContext);
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper function to track custom events from API handlers
 */
export async function trackCustomEvent(
  req: NextRequest,
  eventName: string,
  eventCategory: 'crm' | 'whatsapp' | 'invoice' | 'contract' | 'user' | 'system',
  eventAction: string,
  properties: Record<string, any> = {},
  entityType?: string,
  entityId?: string
): Promise<void> {
  try {
    const trackingContext = await getTrackingContext(req);
    if (!trackingContext) return;

    await analyticsService.trackEvent({
      event_name: eventName,
      event_category: eventCategory,
      event_action: eventAction as any,
      entity_type: entityType,
      entity_id: entityId,
      properties
    }, trackingContext);
  } catch (error) {
    console.error('Failed to track custom event:', error);
  }
}

/**
 * Helper function to record custom metrics from API handlers
 */
export async function recordCustomMetric(
  req: NextRequest,
  metricName: string,
  value: number,
  metricType: 'counter' | 'gauge' | 'histogram' | 'rate',
  category: string,
  dimensions: Record<string, any> = {}
): Promise<void> {
  try {
    const trackingContext = await getTrackingContext(req);
    if (!trackingContext) return;

    await analyticsService.recordMetric(
      { tenant_id: trackingContext.tenant_id, user_id: trackingContext.user_id },
      metricName,
      value,
      metricType,
      category,
      dimensions
    );
  } catch (error) {
    console.error('Failed to record custom metric:', error);
  }
}