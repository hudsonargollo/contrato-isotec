/**
 * CRM System Types
 * TypeScript interfaces for the enhanced CRM system
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Enhanced CRM Pipeline Management
 */

// Lead Source Types
export interface LeadSource {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLeadSourceRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

// Pipeline Stage Types
export interface PipelineStage {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  stage_order: number;
  conversion_probability: number;
  required_actions: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePipelineStageRequest {
  name: string;
  description?: string;
  stage_order: number;
  conversion_probability?: number;
  required_actions?: string[];
  is_active?: boolean;
}

// Lead Types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
  id: string;
  tenant_id: string;
  
  // Contact Information
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  
  // Lead Details
  source_id?: string;
  status: LeadStatus;
  stage_id?: string;
  score: number;
  priority: LeadPriority;
  
  // Assignment and Ownership
  assigned_to?: string;
  created_by: string;
  
  // Additional Data
  notes?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  
  // Tracking
  last_contact_at?: Date;
  next_follow_up_at?: Date;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
  
  // Related Data (populated via joins)
  source?: LeadSource;
  stage?: PipelineStage;
  assigned_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  interactions_count?: number;
  latest_interaction?: LeadInteraction;
}

export interface CreateLeadRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  source_id?: string;
  status?: LeadStatus;
  stage_id?: string;
  priority?: LeadPriority;
  assigned_to?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  next_follow_up_at?: Date;
}

export interface UpdateLeadRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source_id?: string;
  status?: LeadStatus;
  stage_id?: string;
  priority?: LeadPriority;
  assigned_to?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  next_follow_up_at?: Date;
}
// Interaction Types
export type InteractionChannel = 'email' | 'phone' | 'whatsapp' | 'sms' | 'meeting' | 'manual' | 'web' | 'social';
export type InteractionDirection = 'inbound' | 'outbound';

export interface InteractionType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  created_at: Date;
}

export interface LeadInteraction {
  id: string;
  tenant_id: string;
  lead_id: string;
  
  // Interaction Details
  type_id?: string;
  channel: InteractionChannel;
  subject?: string;
  content: string;
  direction: InteractionDirection;
  
  // Metadata
  metadata: Record<string, any>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  
  // User and Timing
  created_by: string;
  interaction_date: Date;
  created_at: Date;
  
  // Related Data (populated via joins)
  type?: InteractionType;
  created_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export interface CreateInteractionRequest {
  lead_id: string;
  type_id?: string;
  channel: InteractionChannel;
  subject?: string;
  content: string;
  direction?: InteractionDirection;
  metadata?: Record<string, any>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  interaction_date?: Date;
}

// Lead Stage History Types
export interface LeadStageHistory {
  id: string;
  tenant_id: string;
  lead_id: string;
  
  // Stage Transition
  from_stage_id?: string;
  to_stage_id: string;
  
  // Transition Details
  reason?: string;
  notes?: string;
  duration_in_previous_stage?: string; // PostgreSQL interval as string
  
  // User and Timing
  changed_by: string;
  changed_at: Date;
  
  // Related Data (populated via joins)
  from_stage?: PipelineStage;
  to_stage?: PipelineStage;
  changed_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

// Lead Scoring Types
export type ScoringOperator = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list' | 'not_empty' | 'regex';

export interface LeadScoringRule {
  id: string;
  tenant_id: string;
  
  // Rule Definition
  name: string;
  description?: string;
  field_name: string;
  operator: ScoringOperator;
  value_criteria: Record<string, any>;
  score_points: number;
  
  // Rule Configuration
  is_active: boolean;
  rule_order: number;
  
  // Audit Fields
  created_at: Date;
  updated_at: Date;
}

export interface CreateScoringRuleRequest {
  name: string;
  description?: string;
  field_name: string;
  operator: ScoringOperator;
  value_criteria: Record<string, any>;
  score_points: number;
  is_active?: boolean;
  rule_order?: number;
}
// Search and Filter Types
export interface LeadFilters {
  status?: LeadStatus[];
  stage_id?: string[];
  source_id?: string[];
  assigned_to?: string[];
  priority?: LeadPriority[];
  tags?: string[];
  score_min?: number;
  score_max?: number;
  created_after?: Date;
  created_before?: Date;
  last_contact_after?: Date;
  last_contact_before?: Date;
  search_query?: string;
  search_fields?: ('first_name' | 'last_name' | 'email' | 'phone' | 'company')[];
}

export interface LeadSortOptions {
  field: 'created_at' | 'updated_at' | 'last_contact_at' | 'score' | 'first_name' | 'last_name';
  direction: 'asc' | 'desc';
}

export interface PaginatedLeads {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters?: LeadFilters;
  sort?: LeadSortOptions;
}

export interface InteractionFilters {
  lead_id?: string;
  type_id?: string[];
  channel?: InteractionChannel[];
  direction?: InteractionDirection[];
  created_by?: string[];
  date_after?: Date;
  date_before?: Date;
  search_query?: string;
}

export interface PaginatedInteractions {
  interactions: LeadInteraction[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters?: InteractionFilters;
}

// Analytics and Reporting Types
export interface PipelineAnalytics {
  total_leads: number;
  leads_by_stage: Array<{
    stage_id: string;
    stage_name: string;
    stage_order: number;
    lead_count: number;
    conversion_probability: number;
    avg_time_in_stage: string; // Duration as string
  }>;
  leads_by_source: Array<{
    source_id: string;
    source_name: string;
    lead_count: number;
    conversion_rate: number;
  }>;
  leads_by_status: Array<{
    status: LeadStatus;
    lead_count: number;
    percentage: number;
  }>;
  conversion_funnel: Array<{
    stage_name: string;
    lead_count: number;
    conversion_rate: number;
    drop_off_rate: number;
  }>;
}

export interface LeadPerformanceMetrics {
  total_leads: number;
  new_leads_this_month: number;
  qualified_leads: number;
  closed_won: number;
  closed_lost: number;
  avg_lead_score: number;
  avg_time_to_close: string; // Duration as string
  conversion_rate: number;
  top_performing_sources: Array<{
    source_name: string;
    lead_count: number;
    conversion_rate: number;
  }>;
  user_performance: Array<{
    user_id: string;
    user_name: string;
    assigned_leads: number;
    closed_deals: number;
    conversion_rate: number;
  }>;
}

// Lead Assignment Types
export interface LeadAssignmentRule {
  id: string;
  tenant_id: string;
  name: string;
  conditions: Record<string, any>;
  assignment_type: 'round_robin' | 'load_balanced' | 'specific_user' | 'team';
  assignment_target: string; // user_id or team_id
  is_active: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface BulkLeadOperation {
  lead_ids: string[];
  operation: 'assign' | 'update_stage' | 'update_status' | 'add_tags' | 'remove_tags';
  data: Record<string, any>;
}

export interface BulkOperationResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    lead_id: string;
    error: string;
  }>;
}