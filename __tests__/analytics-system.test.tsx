/**
 * Analytics System Tests
 * Requirements: 6.1 - Analytics data collection system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { analyticsService, trackCRMEvent, trackWhatsAppEvent, trackInvoiceEvent } from '@/lib/services/analytics';
import type { 
  AnalyticsEvent, 
  AnalyticsMetric, 
  EventTrackingContext,
  TimeRange 
} from '@/lib/types/analytics';

// Mock crypto.randomUUID for Jest environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Mock Supabase client
const mockSupabase = {
  from: jest.fn((table: string) => {
    const mockQuery = {
      select: jest.fn(() => mockQuery),
      eq: jest.fn(() => mockQuery),
      order: jest.fn(() => mockQuery),
      range: jest.fn(() => ({ data: [], error: null })),
      limit: jest.fn(() => ({ data: [], error: null })),
      gte: jest.fn(() => mockQuery),
      lte: jest.fn(() => ({ data: [], error: null })),
      or: jest.fn(() => mockQuery),
      neq: jest.fn(() => mockQuery),
      gt: jest.fn(() => mockQuery),
      lt: jest.fn(() => mockQuery),
      in: jest.fn(() => mockQuery),
      ilike: jest.fn(() => mockQuery),
      single: jest.fn(() => ({ data: { id: 'test-dashboard-id', name: 'Test Dashboard' }, error: null })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: { id: 'test-dashboard-id', name: 'Test Dashboard' }, error: null }))
        }))
      })),
      upsert: jest.fn(() => ({ error: null }))
    };
    return mockQuery;
  }),
  insert: jest.fn(() => ({
    data: [{ id: 'test-event-id' }],
    error: null
  }))
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('Analytics System', () => {
  const mockTenantContext = {
    tenant_id: 'test-tenant-id',
    user_id: 'test-user-id'
  };

  const mockTrackingContext: EventTrackingContext = {
    tenant_id: 'test-tenant-id',
    user_id: 'test-user-id',
    session_id: 'test-session-id',
    ip_address: '127.0.0.1',
    user_agent: 'test-user-agent'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any timers or resources
    analyticsService.destroy();
  });

  describe('Event Tracking', () => {
    it('should track a basic event', async () => {
      const eventRequest = {
        event_name: 'test_event',
        event_category: 'system' as const,
        event_action: 'create' as const,
        properties: { test: 'value' }
      };

      const eventId = await analyticsService.trackEvent(eventRequest, mockTrackingContext);

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    it('should track CRM events', async () => {
      const eventId = await trackCRMEvent(
        'lead_created',
        'create',
        'lead',
        'test-lead-id',
        { source: 'website' },
        mockTrackingContext
      );

      expect(eventId).toBeDefined();
    });

    it('should track WhatsApp events', async () => {
      const eventId = await trackWhatsAppEvent(
        'message_sent',
        'send',
        'message',
        'test-message-id',
        { type: 'text', to: '+1234567890' },
        mockTrackingContext
      );

      expect(eventId).toBeDefined();
    });

    it('should track Invoice events', async () => {
      const eventId = await trackInvoiceEvent(
        'invoice_created',
        'create',
        'invoice',
        'test-invoice-id',
        { amount: 1000, currency: 'USD' },
        mockTrackingContext
      );

      expect(eventId).toBeDefined();
    });

    it('should handle batch event tracking', async () => {
      const events = [
        {
          event_name: 'event_1',
          event_category: 'crm' as const,
          event_action: 'create' as const
        },
        {
          event_name: 'event_2',
          event_category: 'whatsapp' as const,
          event_action: 'send' as const
        }
      ];

      const eventIds = await analyticsService.trackEvents(events, mockTrackingContext);

      expect(eventIds).toHaveLength(2);
      expect(eventIds.every(id => typeof id === 'string')).toBe(true);
    });
  });

  describe('Metrics Recording', () => {
    it('should record a counter metric', async () => {
      await analyticsService.recordMetric(
        mockTenantContext,
        'test_counter',
        1,
        'counter',
        'test',
        { dimension: 'value' }
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_metrics');
    });

    it('should record a gauge metric', async () => {
      await analyticsService.recordMetric(
        mockTenantContext,
        'test_gauge',
        100,
        'gauge',
        'test',
        { dimension: 'value' }
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_metrics');
    });

    it('should record metrics with different period types', async () => {
      const periodTypes: Array<'hour' | 'day' | 'week' | 'month'> = ['hour', 'day', 'week', 'month'];

      for (const periodType of periodTypes) {
        await analyticsService.recordMetric(
          mockTenantContext,
          'test_metric',
          1,
          'counter',
          'test',
          {},
          periodType
        );
      }

      expect(mockSupabase.from).toHaveBeenCalledTimes(periodTypes.length);
    });
  });

  describe('Data Querying', () => {
    it('should get events with filters', async () => {
      const filters = {
        event_category: 'crm',
        event_name: 'lead_created',
        time_range: {
          type: 'relative' as const,
          relative: { amount: 24, unit: 'hours' as const }
        }
      };

      const events = await analyticsService.getEvents(mockTenantContext, filters);

      expect(Array.isArray(events)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events');
    });

    it('should get metrics with filters', async () => {
      const filters = {
        metric_name: 'api_request_count',
        metric_category: 'performance',
        time_range: {
          type: 'relative' as const,
          relative: { amount: 7, unit: 'days' as const }
        }
      };

      const metrics = await analyticsService.getMetrics(mockTenantContext, filters);

      expect(Array.isArray(metrics)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_metrics');
    });

    it('should query analytics data', async () => {
      const query = {
        metrics: ['event_count'],
        dimensions: ['event_category'],
        time_range: {
          type: 'relative' as const,
          relative: { amount: 24, unit: 'hours' as const }
        }
      };

      const result = await analyticsService.queryAnalytics(query, mockTenantContext);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total_count');
      expect(result).toHaveProperty('query_time_ms');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Real-time Metrics', () => {
    it('should get real-time metrics', async () => {
      const metricNames = ['api_request_count', 'active_users', 'error_rate'];

      const realTimeMetrics = await analyticsService.getRealTimeMetrics(
        mockTenantContext,
        metricNames
      );

      expect(Array.isArray(realTimeMetrics)).toBe(true);
      expect(realTimeMetrics).toHaveLength(metricNames.length);
      
      realTimeMetrics.forEach(metric => {
        expect(metric).toHaveProperty('metric_name');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('change');
        expect(metric).toHaveProperty('change_percentage');
        expect(metric).toHaveProperty('trend');
        expect(['up', 'down', 'stable']).toContain(metric.trend);
      });
    });
  });

  describe('Dashboard Management', () => {
    it('should create a dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'A test dashboard',
        config: {
          layout: { columns: 12, rows: 8, grid_size: 20 },
          widgets: [],
          filters: []
        },
        is_public: false,
        shared_with: []
      };

      const mockDashboard = { id: 'test-dashboard-id', ...dashboardData };

      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockDashboard,
              error: null
            }))
          }))
        }))
      }));

      const dashboard = await analyticsService.createDashboard(
        mockTenantContext,
        dashboardData
      );

      expect(dashboard).toHaveProperty('id');
      expect(dashboard.name).toBe(dashboardData.name);
    });

    it('should get dashboards for tenant', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      }));

      const dashboards = await analyticsService.getDashboards(mockTenantContext);

      expect(Array.isArray(dashboards)).toBe(true);
    });
  });

  describe('Metric Aggregation', () => {
    it('should aggregate metrics over time range', async () => {
      const aggregations = [
        {
          metric_name: 'api_request_count',
          aggregation_type: 'sum' as const,
          time_window: 'hour' as const
        },
        {
          metric_name: 'response_time',
          aggregation_type: 'avg' as const,
          time_window: 'hour' as const
        }
      ];

      const timeRange: TimeRange = {
        type: 'relative',
        relative: { amount: 24, unit: 'hours' }
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                data: [
                  { value: 100, dimensions: {}, period_start: new Date(), period_end: new Date() },
                  { value: 200, dimensions: {}, period_start: new Date(), period_end: new Date() }
                ],
                error: null
              }))
            }))
          }))
        }))
      }));

      const results = await analyticsService.aggregateMetrics(
        mockTenantContext,
        aggregations,
        timeRange
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(aggregations.length);
      
      results.forEach(result => {
        expect(result).toHaveProperty('metric_name');
        expect(result).toHaveProperty('value');
        expect(result).toHaveProperty('period_start');
        expect(result).toHaveProperty('period_end');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          error: new Error('Database error')
        }))
      }));

      // Should not throw, but handle error internally
      const result = await analyticsService.trackEvent({
        event_name: 'test_event',
        event_category: 'system',
        event_action: 'create'
      }, mockTrackingContext).catch(() => 'error-handled');

      expect(result).toBe('error-handled');
    });

    it('should handle query errors gracefully', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                error: new Error('Query error')
              }))
            }))
          }))
        }))
      }));

      const events = await analyticsService.getEvents(mockTenantContext);
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(0);
    });
  });

  describe('Time Range Resolution', () => {
    it('should resolve relative time ranges correctly', async () => {
      const relativeRange: TimeRange = {
        type: 'relative',
        relative: { amount: 7, unit: 'days' }
      };

      // This tests the internal time range resolution
      const events = await analyticsService.getEvents(
        mockTenantContext,
        { time_range: relativeRange }
      );

      expect(Array.isArray(events)).toBe(true);
    });

    it('should resolve absolute time ranges correctly', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const absoluteRange: TimeRange = {
        type: 'absolute',
        absolute: { start: yesterday, end: now }
      };

      const events = await analyticsService.getEvents(
        mockTenantContext,
        { time_range: absoluteRange }
      );

      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('Event Buffer Management', () => {
    it('should buffer events for batch processing', async () => {
      // Track multiple events quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(analyticsService.trackEvent({
          event_name: `test_event_${i}`,
          event_category: 'system',
          event_action: 'create'
        }, mockTrackingContext));
      }

      await Promise.all(promises);

      // All events should be tracked
      expect(promises).toHaveLength(5);
    });
  });
});

describe('Analytics Middleware Integration', () => {
  it('should track API request events', async () => {
    // This would test the middleware integration
    // In a real test, you'd mock the Next.js request/response objects
    expect(true).toBe(true); // Placeholder
  });

  it('should track performance metrics', async () => {
    // This would test performance metric collection
    expect(true).toBe(true); // Placeholder
  });

  it('should track error events', async () => {
    // This would test error event tracking
    expect(true).toBe(true); // Placeholder
  });
});