/**
 * Analytics Tracking Middleware
 * Requirements: 6.1, 6.2 - Multi-tenant analytics dashboards with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsService } from '@/lib/services/analytics';
import type { EventTrackingContext } from '@/lib/types/analytics';

export async function trackAnalyticsEvent(
  request: NextRequest,
  response: NextResponse,
  eventData?: {
    event_name?: string;
    event_category?: string;
    event_action?: string;
    entity_type?: string;
    entity_id?: string;
    properties?: Record<string, any>;
  }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Only track events for authenticated users
    if (!user) return;

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) return;

    // Get client information
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const sessionId = request.headers.get('x-session-id') || request.cookies.get('session-id')?.value;

    const trackingContext: EventTrackingContext = {
      tenant_id: tenantId,
      user_id: user.id,
      session_id: sessionId,
      ip_address: ip,
      user_agent: userAgent
    };

    // Default event data based on request
    const defaultEventData = {
      event_name: eventData?.event_name || 'api_request',
      event_category: eventData?.event_category || 'system',
      event_action: eventData?.event_action || request.method.toLowerCase(),
      entity_type: eventData?.entity_type,
      entity_id: eventData?.entity_id,
      properties: {
        path: request.nextUrl.pathname,
        method: request.method,
        status_code: response.status,
        ...eventData?.properties
      }
    };

    // Track the event asynchronously
    analyticsService.trackEvent(defaultEventData, trackingContext).catch(error => {
      console.error('Failed to track analytics event:', error);
    });

    // Record API metrics
    const responseTime = response.headers.get('x-response-time');
    if (responseTime) {
      analyticsService.recordMetric(
        { tenant_id: tenantId, user_id: user.id },
        'api_response_time',
        parseInt(responseTime),
        'gauge',
        'performance'
      ).catch(error => {
        console.error('Failed to record response time metric:', error);
      });
    }

    // Record API request count
    analyticsService.recordMetric(
      { tenant_id: tenantId, user_id: user.id },
      'api_request_count',
      1,
      'counter',
      'api',
      {
        path: request.nextUrl.pathname,
        method: request.method,
        status_code: response.status.toString()
      }
    ).catch(error => {
      console.error('Failed to record API request metric:', error);
    });

    // Record error metrics for non-2xx responses
    if (response.status >= 400) {
      analyticsService.recordMetric(
        { tenant_id: tenantId, user_id: user.id },
        'api_error_count',
        1,
        'counter',
        'api',
        {
          path: request.nextUrl.pathname,
          method: request.method,
          status_code: response.status.toString()
        }
      ).catch(error => {
        console.error('Failed to record API error metric:', error);
      });
    }

  } catch (error) {
    // Silently fail - analytics should not break the main request
    console.error('Analytics tracking middleware error:', error);
  }
}

export function withAnalyticsTracking(
  handler: (request: NextRequest) => Promise<NextResponse>,
  eventData?: {
    event_name?: string;
    event_category?: string;
    event_action?: string;
    entity_type?: string;
    entity_id?: string;
    properties?: Record<string, any>;
  }
) {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(request);
      
      // Add response time header
      const responseTime = Date.now() - startTime;
      response.headers.set('x-response-time', responseTime.toString());
      
      // Track analytics event
      await trackAnalyticsEvent(request, response, eventData);
      
      return response;
    } catch (error) {
      // Create error response
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      const responseTime = Date.now() - startTime;
      errorResponse.headers.set('x-response-time', responseTime.toString());
      
      // Track error event
      await trackAnalyticsEvent(request, errorResponse, {
        ...eventData,
        event_name: 'api_error',
        event_category: 'system',
        event_action: 'error',
        properties: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          ...eventData?.properties
        }
      });
      
      throw error; // Re-throw to maintain error handling
    }
  };
}

// Convenience functions for common tracking scenarios
export const trackCRMAnalytics = (
  eventName: string,
  action: string,
  entityType: string,
  entityId?: string,
  properties?: Record<string, any>
) => ({
  event_name: eventName,
  event_category: 'crm',
  event_action: action,
  entity_type: entityType,
  entity_id: entityId,
  properties
});

export const trackWhatsAppAnalytics = (
  eventName: string,
  action: string,
  entityType: string,
  entityId?: string,
  properties?: Record<string, any>
) => ({
  event_name: eventName,
  event_category: 'whatsapp',
  event_action: action,
  entity_type: entityType,
  entity_id: entityId,
  properties
});

export const trackInvoiceAnalytics = (
  eventName: string,
  action: string,
  entityType: string,
  entityId?: string,
  properties?: Record<string, any>
) => ({
  event_name: eventName,
  event_category: 'invoice',
  event_action: action,
  entity_type: entityType,
  entity_id: entityId,
  properties
});

export const trackUserAnalytics = (
  eventName: string,
  action: string,
  properties?: Record<string, any>
) => ({
  event_name: eventName,
  event_category: 'user',
  event_action: action,
  properties
});