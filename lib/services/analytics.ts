/**
 * Analytics Service
 * Requirements: 6.1 - Analytics data collection system
 * Handles event tracking, metrics collection, and real-time analytics data pipeline
 */

import { createClient } from '@/lib/supabase/client';
import { TenantContext } from '@/lib/types/tenant';
import type {
  AnalyticsEvent,
  AnalyticsMetric,
  AnalyticsDashboard,
  AnalyticsFunnel,
  AnalyticsCohort,
  AnalyticsReport,
  TrackEventRequest,
  EventTrackingContext,
  AnalyticsQuery,
  AnalyticsQueryResult,
  RealTimeMetric,
  MetricAggregation,
  AggregationResult,
  TimeRange
} from '@/lib/types/analytics';

export class AnalyticsService {
  private supabase = createClient();
  private eventBuffer: AnalyticsEvent[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startEventBuffering();
  }

  /**
   * Track an analytics event
   */
  async trackEvent(
    request: TrackEventRequest,
    context: EventTrackingContext
  ): Promise<string> {
    try {
      const event: Omit<AnalyticsEvent, 'id' | 'created_at'> = {
        tenant_id: context.tenant_id,
        user_id: context.user_id,
        event_name: request.event_name,
        event_category: request.event_category,
        event_action: request.event_action,
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        properties: request.properties || {},
        metadata: request.metadata || {},
        session_id: context.session_id,
        ip_address: context.ip_address,
        user_agent: context.user_agent
      };

      // Add to buffer for batch processing
      this.eventBuffer.push({
        ...event,
        id: crypto.randomUUID(),
        created_at: new Date()
      });

      // Flush buffer if it's full
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushEventBuffer();
      }

      return event.id || '';
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackEvents(
    events: TrackEventRequest[],
    context: EventTrackingContext
  ): Promise<string[]> {
    try {
      const eventIds: string[] = [];
      
      for (const request of events) {
        const eventId = await this.trackEvent(request, context);
        eventIds.push(eventId);
      }

      return eventIds;
    } catch (error) {
      console.error('Failed to track events:', error);
      throw error;
    }
  }

  /**
   * Get analytics events with filtering
   */
  async getEvents(
    context: TenantContext,
    filters?: {
      event_category?: string;
      event_name?: string;
      entity_type?: string;
      entity_id?: string;
      user_id?: string;
      time_range?: TimeRange;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<AnalyticsEvent[]> {
    try {
      let query = this.supabase
        .from('analytics_events')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.event_category) {
        query = query.eq('event_category', filters.event_category);
      }

      if (filters?.event_name) {
        query = query.eq('event_name', filters.event_name);
      }

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

      if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.time_range) {
        const { start, end } = this.resolveTimeRange(filters.time_range);
        query = query.gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get events: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  /**
   * Query analytics data with aggregation
   */
  async queryAnalytics(
    query: AnalyticsQuery,
    context: TenantContext
  ): Promise<AnalyticsQueryResult> {
    try {
      const startTime = Date.now();
      
      // Build the query based on metrics and dimensions
      const result = await this.executeAnalyticsQuery(query, context);
      
      const queryTime = Date.now() - startTime;

      return {
        data: result.data,
        total_count: result.total_count,
        query_time_ms: queryTime,
        cached: false // TODO: Implement caching
      };
    } catch (error) {
      console.error('Failed to query analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(
    context: TenantContext,
    metricNames: string[]
  ): Promise<RealTimeMetric[]> {
    try {
      const metrics: RealTimeMetric[] = [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      for (const metricName of metricNames) {
        // Get current hour value
        const currentValue = await this.getMetricValue(
          context,
          metricName,
          oneHourAgo,
          now
        );

        // Get previous hour value for comparison
        const previousValue = await this.getMetricValue(
          context,
          metricName,
          twoHoursAgo,
          oneHourAgo
        );

        const change = currentValue - previousValue;
        const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(changePercentage) > 5) {
          trend = changePercentage > 0 ? 'up' : 'down';
        }

        metrics.push({
          metric_name: metricName,
          value: currentValue,
          change,
          change_percentage: Math.round(changePercentage * 100) / 100,
          trend,
          last_updated: now
        });
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get real-time metrics:', error);
      return [];
    }
  }

  /**
   * Create or update a metric
   */
  async recordMetric(
    context: TenantContext,
    metricName: string,
    value: number,
    metricType: 'counter' | 'gauge' | 'histogram' | 'rate',
    category: string,
    dimensions: Record<string, any> = {},
    periodType: 'hour' | 'day' | 'week' | 'month' = 'hour'
  ): Promise<void> {
    try {
      const now = new Date();
      const periodStart = this.getPeriodStart(now, periodType);
      const periodEnd = this.getPeriodEnd(periodStart, periodType);

      const { error } = await this.supabase
        .from('analytics_metrics')
        .upsert({
          tenant_id: context.tenant_id,
          metric_name: metricName,
          metric_type: metricType,
          metric_category: category,
          value,
          dimensions,
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
          updated_at: now
        }, {
          onConflict: 'tenant_id,metric_name,metric_category,period_type,period_start,dimensions'
        });

      if (error) {
        throw new Error(`Failed to record metric: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to record metric:', error);
      throw error;
    }
  }

  /**
   * Get metrics with filtering and aggregation
   */
  async getMetrics(
    context: TenantContext,
    filters?: {
      metric_name?: string;
      metric_category?: string;
      period_type?: string;
      time_range?: TimeRange;
    },
    limit: number = 100
  ): Promise<AnalyticsMetric[]> {
    try {
      let query = this.supabase
        .from('analytics_metrics')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .order('period_start', { ascending: false })
        .limit(limit);

      if (filters?.metric_name) {
        query = query.eq('metric_name', filters.metric_name);
      }

      if (filters?.metric_category) {
        query = query.eq('metric_category', filters.metric_category);
      }

      if (filters?.period_type) {
        query = query.eq('period_type', filters.period_type);
      }

      if (filters?.time_range) {
        const { start, end } = this.resolveTimeRange(filters.time_range);
        query = query.gte('period_start', start.toISOString())
                    .lte('period_end', end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get metrics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  }

  /**
   * Aggregate metrics for a time period
   */
  async aggregateMetrics(
    context: TenantContext,
    aggregations: MetricAggregation[],
    timeRange: TimeRange
  ): Promise<AggregationResult[]> {
    try {
      const results: AggregationResult[] = [];
      const { start, end } = this.resolveTimeRange(timeRange);

      for (const aggregation of aggregations) {
        const { data } = await this.supabase
          .from('analytics_metrics')
          .select('value, dimensions, period_start, period_end')
          .eq('tenant_id', context.tenant_id)
          .eq('metric_name', aggregation.metric_name)
          .gte('period_start', start.toISOString())
          .lte('period_end', end.toISOString());

        if (data && data.length > 0) {
          let aggregatedValue: number;
          
          switch (aggregation.aggregation_type) {
            case 'sum':
              aggregatedValue = data.reduce((sum, item) => sum + item.value, 0);
              break;
            case 'avg':
              aggregatedValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
              break;
            case 'count':
              aggregatedValue = data.length;
              break;
            case 'min':
              aggregatedValue = Math.min(...data.map(item => item.value));
              break;
            case 'max':
              aggregatedValue = Math.max(...data.map(item => item.value));
              break;
            case 'distinct_count':
              const uniqueValues = new Set(data.map(item => item.value));
              aggregatedValue = uniqueValues.size;
              break;
            default:
              aggregatedValue = 0;
          }

          results.push({
            metric_name: aggregation.metric_name,
            value: aggregatedValue,
            dimensions: aggregation.dimensions ? {} : {}, // TODO: Implement dimension grouping
            period_start: start,
            period_end: end
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to aggregate metrics:', error);
      return [];
    }
  }

  /**
   * Create a dashboard
   */
  async createDashboard(
    context: TenantContext,
    dashboard: Omit<AnalyticsDashboard, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AnalyticsDashboard> {
    try {
      const { data, error } = await this.supabase
        .from('analytics_dashboards')
        .insert({
          ...dashboard,
          tenant_id: context.tenant_id,
          user_id: context.user_id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create dashboard: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboards for a tenant
   */
  async getDashboards(
    context: TenantContext,
    includeShared: boolean = true
  ): Promise<AnalyticsDashboard[]> {
    try {
      let query = this.supabase
        .from('analytics_dashboards')
        .select('*')
        .eq('tenant_id', context.tenant_id);

      if (!includeShared) {
        query = query.eq('user_id', context.user_id);
      } else {
        query = query.or(`user_id.eq.${context.user_id},is_public.eq.true,shared_with.cs.{${context.user_id}}`);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get dashboards: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get dashboards:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */

  private startEventBuffering(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushEventBuffer();
      }
    }, this.flushInterval);
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const eventsToFlush = [...this.eventBuffer];
      this.eventBuffer = [];

      const { error } = await this.supabase
        .from('analytics_events')
        .insert(eventsToFlush);

      if (error) {
        console.error('Failed to flush event buffer:', error);
        // Re-add events to buffer for retry
        this.eventBuffer.unshift(...eventsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush event buffer:', error);
    }
  }

  private resolveTimeRange(timeRange: TimeRange): { start: Date; end: Date } {
    if (timeRange.type === 'absolute' && timeRange.absolute) {
      return {
        start: timeRange.absolute.start,
        end: timeRange.absolute.end
      };
    }

    if (timeRange.type === 'relative' && timeRange.relative) {
      const now = new Date();
      const { amount, unit } = timeRange.relative;
      
      let milliseconds = 0;
      switch (unit) {
        case 'minutes':
          milliseconds = amount * 60 * 1000;
          break;
        case 'hours':
          milliseconds = amount * 60 * 60 * 1000;
          break;
        case 'days':
          milliseconds = amount * 24 * 60 * 60 * 1000;
          break;
        case 'weeks':
          milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'months':
          milliseconds = amount * 30 * 24 * 60 * 60 * 1000;
          break;
      }

      return {
        start: new Date(now.getTime() - milliseconds),
        end: now
      };
    }

    // Default to last 24 hours
    const now = new Date();
    return {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      end: now
    };
  }

  private async getMetricValue(
    context: TenantContext,
    metricName: string,
    start: Date,
    end: Date
  ): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('analytics_metrics')
        .select('value')
        .eq('tenant_id', context.tenant_id)
        .eq('metric_name', metricName)
        .gte('period_start', start.toISOString())
        .lte('period_end', end.toISOString());

      if (!data || data.length === 0) return 0;

      return data.reduce((sum, item) => sum + item.value, 0);
    } catch (error) {
      console.error('Failed to get metric value:', error);
      return 0;
    }
  }

  private getPeriodStart(date: Date, periodType: string): Date {
    switch (periodType) {
      case 'hour':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
      case 'day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      case 'week':
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek;
        return new Date(date.getFullYear(), date.getMonth(), diff);
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1);
      default:
        return date;
    }
  }

  private getPeriodEnd(periodStart: Date, periodType: string): Date {
    switch (periodType) {
      case 'hour':
        return new Date(periodStart.getTime() + 60 * 60 * 1000);
      case 'day':
        return new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'month':
        const nextMonth = new Date(periodStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      default:
        return periodStart;
    }
  }

  private async executeAnalyticsQuery(
    query: AnalyticsQuery,
    context: TenantContext
  ): Promise<{ data: any[]; total_count: number }> {
    // This is a simplified implementation
    // In a real system, this would build complex SQL queries based on the query parameters
    
    try {
      const { start, end } = this.resolveTimeRange(query.time_range);
      
      let supabaseQuery = this.supabase
        .from('analytics_events')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (query.filters) {
        for (const filter of query.filters) {
          switch (filter.operator) {
            case 'eq':
              supabaseQuery = supabaseQuery.eq(filter.field, filter.value);
              break;
            case 'ne':
              supabaseQuery = supabaseQuery.neq(filter.field, filter.value);
              break;
            case 'gt':
              supabaseQuery = supabaseQuery.gt(filter.field, filter.value);
              break;
            case 'gte':
              supabaseQuery = supabaseQuery.gte(filter.field, filter.value);
              break;
            case 'lt':
              supabaseQuery = supabaseQuery.lt(filter.field, filter.value);
              break;
            case 'lte':
              supabaseQuery = supabaseQuery.lte(filter.field, filter.value);
              break;
            case 'in':
              supabaseQuery = supabaseQuery.in(filter.field, filter.value);
              break;
            case 'contains':
              supabaseQuery = supabaseQuery.ilike(filter.field, `%${filter.value}%`);
              break;
          }
        }
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 100) - 1);
      }

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      return {
        data: data || [],
        total_count: count || 0
      };
    } catch (error) {
      console.error('Failed to execute analytics query:', error);
      return { data: [], total_count: 0 };
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush any remaining events
    if (this.eventBuffer.length > 0) {
      this.flushEventBuffer();
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Convenience functions for common tracking scenarios
export const trackCRMEvent = (
  eventName: string,
  action: string,
  entityType: string,
  entityId: string,
  properties: Record<string, any>,
  context: EventTrackingContext
) => {
  return analyticsService.trackEvent({
    event_name: eventName,
    event_category: 'crm',
    event_action: action as any,
    entity_type: entityType,
    entity_id: entityId,
    properties
  }, context);
};

export const trackWhatsAppEvent = (
  eventName: string,
  action: string,
  entityType: string,
  entityId: string,
  properties: Record<string, any>,
  context: EventTrackingContext
) => {
  return analyticsService.trackEvent({
    event_name: eventName,
    event_category: 'whatsapp',
    event_action: action as any,
    entity_type: entityType,
    entity_id: entityId,
    properties
  }, context);
};

export const trackInvoiceEvent = (
  eventName: string,
  action: string,
  entityType: string,
  entityId: string,
  properties: Record<string, any>,
  context: EventTrackingContext
) => {
  return analyticsService.trackEvent({
    event_name: eventName,
    event_category: 'invoice',
    event_action: action as any,
    entity_type: entityType,
    entity_id: entityId,
    properties
  }, context);
};

export const trackUserEvent = (
  eventName: string,
  action: string,
  properties: Record<string, any>,
  context: EventTrackingContext
) => {
  return analyticsService.trackEvent({
    event_name: eventName,
    event_category: 'user',
    event_action: action as any,
    properties
  }, context);
};