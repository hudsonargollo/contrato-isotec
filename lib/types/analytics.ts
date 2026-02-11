/**
 * Analytics Types
 * Requirements: 6.1 - Analytics data collection system
 */

export interface AnalyticsEvent {
  id: string;
  tenant_id: string;
  user_id?: string;
  
  // Event identification
  event_name: string;
  event_category: 'crm' | 'whatsapp' | 'invoice' | 'contract' | 'user' | 'system' | 'screening' | 'campaign';
  event_action: 'create' | 'update' | 'delete' | 'view' | 'send' | 'receive' | 'approve' | 'reject' | 'complete';
  
  // Event context
  entity_type?: string;
  entity_id?: string;
  
  // Event properties
  properties: Record<string, any>;
  metadata: Record<string, any>;
  
  // Session and device info
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  
  created_at: Date;
}

export interface AnalyticsMetric {
  id: string;
  tenant_id: string;
  
  // Metric identification
  metric_name: string;
  metric_type: 'counter' | 'gauge' | 'histogram' | 'rate';
  metric_category: string;
  
  // Metric value
  value: number;
  
  // Dimensions for filtering/grouping
  dimensions: Record<string, any>;
  
  // Time period
  period_type: 'hour' | 'day' | 'week' | 'month';
  period_start: Date;
  period_end: Date;
  
  // Metadata
  metadata: Record<string, any>;
  
  created_at: Date;
  updated_at: Date;
}

export interface AnalyticsDashboard {
  id: string;
  tenant_id: string;
  user_id?: string;
  
  // Dashboard info
  name: string;
  description?: string;
  
  // Dashboard configuration
  config: DashboardConfig;
  
  // Sharing and permissions
  is_public: boolean;
  shared_with: string[];
  
  created_at: Date;
  updated_at: Date;
}

export interface DashboardConfig {
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  refresh_interval?: number;
  theme?: 'light' | 'dark';
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  grid_size: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'cohort';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
}

export interface WidgetConfig {
  metric_name?: string;
  chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  time_range?: TimeRange;
  filters?: Record<string, any>;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  group_by?: string[];
  limit?: number;
}

export interface DashboardFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
  label?: string;
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  relative?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };
  absolute?: {
    start: Date;
    end: Date;
  };
}

export interface AnalyticsFunnel {
  id: string;
  tenant_id: string;
  
  // Funnel definition
  name: string;
  description?: string;
  
  // Funnel steps
  steps: FunnelStep[];
  
  // Configuration
  config: FunnelConfig;
  
  // Status
  is_active: boolean;
  
  created_at: Date;
  updated_at: Date;
}

export interface FunnelStep {
  name: string;
  event: string;
  conditions?: Record<string, any>;
  time_window?: number; // Minutes
}

export interface FunnelConfig {
  conversion_window: number; // Days
  attribution_model: 'first_touch' | 'last_touch' | 'linear';
  exclude_bounces: boolean;
}

export interface FunnelEvent {
  id: string;
  tenant_id: string;
  funnel_id: string;
  
  // User journey
  user_id?: string;
  session_id?: string;
  
  // Funnel progress
  step_index: number;
  step_name: string;
  
  // Event data
  event_data: Record<string, any>;
  
  created_at: Date;
}

export interface AnalyticsCohort {
  id: string;
  tenant_id: string;
  
  // Cohort definition
  name: string;
  description?: string;
  
  // Cohort criteria
  criteria: CohortCriteria;
  
  // Cohort type
  cohort_type: 'static' | 'dynamic';
  
  // Status
  is_active: boolean;
  
  created_at: Date;
  updated_at: Date;
}

export interface CohortCriteria {
  conditions: CohortCondition[];
  time_window?: TimeRange;
  user_properties?: Record<string, any>;
}

export interface CohortCondition {
  event: string;
  properties?: Record<string, any>;
  count?: {
    operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
    value: number;
  };
}

export interface AnalyticsReport {
  id: string;
  tenant_id: string;
  user_id?: string;
  
  // Report info
  name: string;
  description?: string;
  report_type: 'standard' | 'custom' | 'scheduled';
  
  // Report configuration
  config: ReportConfig;
  
  // Report data (for cached reports)
  data?: any;
  
  // Scheduling
  schedule_config?: ScheduleConfig;
  last_generated_at?: Date;
  next_generation_at?: Date;
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'error';
  
  created_at: Date;
  updated_at: Date;
}

export interface ReportConfig {
  metrics: string[];
  dimensions: string[];
  filters: DashboardFilter[];
  time_range: TimeRange;
  format: 'json' | 'csv' | 'pdf';
  visualization?: {
    type: 'table' | 'chart';
    chart_type?: 'line' | 'bar' | 'pie';
  };
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  timezone: string;
  recipients: string[];
  delivery_method: 'email' | 'webhook';
}

// Event tracking interfaces
export interface TrackEventRequest {
  event_name: string;
  event_category: AnalyticsEvent['event_category'];
  event_action: AnalyticsEvent['event_action'];
  entity_type?: string;
  entity_id?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  session_id?: string;
}

export interface EventTrackingContext {
  tenant_id: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

// Analytics query interfaces
export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  time_range: TimeRange;
  group_by?: string[];
  order_by?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'exists';
  value: any;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AnalyticsQueryResult {
  data: AnalyticsDataPoint[];
  total_count: number;
  query_time_ms: number;
  cached: boolean;
}

export interface AnalyticsDataPoint {
  dimensions: Record<string, any>;
  metrics: Record<string, number>;
  timestamp?: Date;
}

// Real-time analytics interfaces
export interface RealTimeMetric {
  metric_name: string;
  value: number;
  change: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  last_updated: Date;
}

export interface RealTimeEvent {
  event: AnalyticsEvent;
  processed_at: Date;
}

// Analytics aggregation interfaces
export interface MetricAggregation {
  metric_name: string;
  aggregation_type: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count';
  time_window: 'hour' | 'day' | 'week' | 'month';
  dimensions?: string[];
}

export interface AggregationResult {
  metric_name: string;
  value: number;
  dimensions: Record<string, any>;
  period_start: Date;
  period_end: Date;
}

// Platform-specific event types
export interface CRMAnalyticsEvent extends Omit<AnalyticsEvent, 'event_category'> {
  event_category: 'crm';
  entity_type: 'lead' | 'interaction' | 'pipeline_stage' | 'lead_source';
}

export interface WhatsAppAnalyticsEvent extends Omit<AnalyticsEvent, 'event_category'> {
  event_category: 'whatsapp';
  entity_type: 'message' | 'conversation' | 'template' | 'campaign';
}

export interface InvoiceAnalyticsEvent extends Omit<AnalyticsEvent, 'event_category'> {
  event_category: 'invoice';
  entity_type: 'invoice' | 'payment' | 'approval_workflow';
}

export interface ContractAnalyticsEvent extends Omit<AnalyticsEvent, 'event_category'> {
  event_category: 'contract';
  entity_type: 'contract' | 'template' | 'signature';
}

export interface UserAnalyticsEvent extends Omit<AnalyticsEvent, 'event_category'> {
  event_category: 'user';
  entity_type: 'session' | 'login' | 'logout' | 'profile_update';
}

export interface SystemAnalyticsEvent extends Omit<AnalyticsEvent, 'event_category'> {
  event_category: 'system';
  entity_type: 'error' | 'performance' | 'security' | 'backup';
}

// Export utility types
export type EventCategory = AnalyticsEvent['event_category'];
export type EventAction = AnalyticsEvent['event_action'];
export type MetricType = AnalyticsMetric['metric_type'];
export type PeriodType = AnalyticsMetric['period_type'];
export type ReportStatus = AnalyticsReport['status'];
export type CohortType = AnalyticsCohort['cohort_type'];