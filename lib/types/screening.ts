/**
 * Project Screening System Types
 * Enhanced screening and scoring engine for project feasibility assessment
 * Requirements: 3.2, 3.3 - Project screening and scoring engine
 */

import { z } from 'zod';
import type { QuestionnaireResponse, ScreeningResult } from './questionnaire';

// Feasibility Rating Enum
export const FEASIBILITY_RATINGS = ['high', 'medium', 'low', 'not_feasible'] as const;
export type FeasibilityRating = typeof FEASIBILITY_RATINGS[number];

// Risk Level Enum
export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

// Qualification Level Enum
export const QUALIFICATION_LEVELS = ['qualified', 'partially_qualified', 'not_qualified'] as const;
export type QualificationLevel = typeof QUALIFICATION_LEVELS[number];

// Screening Rule Types
export const SCREENING_RULE_TYPES = [
  'threshold',      // Simple threshold check
  'range',          // Value within range
  'weighted_sum',   // Weighted sum of multiple factors
  'conditional',    // Conditional logic based on other answers
  'formula'         // Custom formula evaluation
] as const;
export type ScreeningRuleType = typeof SCREENING_RULE_TYPES[number];

// Screening Rule Condition Schema
export const screeningConditionSchema = z.object({
  questionId: z.string().uuid(),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'contains', 'not_contains']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
  weight: z.number().default(1.0),
  metadata: z.record(z.any()).default({})
});

// Screening Rule Schema
export const screeningRuleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  rule_type: z.enum(SCREENING_RULE_TYPES),
  category: z.string().max(100), // e.g., 'technical', 'financial', 'regulatory'
  conditions: z.array(screeningConditionSchema),
  scoring: z.object({
    points: z.number(),
    weight: z.number().default(1.0),
    max_points: z.number().optional()
  }),
  thresholds: z.object({
    high: z.number().optional(),
    medium: z.number().optional(),
    low: z.number().optional()
  }).optional(),
  recommendations: z.object({
    qualified: z.string().optional(),
    partially_qualified: z.string().optional(),
    not_qualified: z.string().optional()
  }).default({}),
  risk_factors: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  priority: z.number().default(0),
  created_at: z.date(),
  updated_at: z.date()
});

// Screening Template Schema
export const screeningTemplateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  questionnaire_template_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+$/),
  screening_rules: z.array(z.string().uuid()), // Rule IDs
  scoring_config: z.object({
    max_score: z.number().positive(),
    qualification_thresholds: z.object({
      qualified: z.number(),
      partially_qualified: z.number(),
      not_qualified: z.number()
    }),
    feasibility_thresholds: z.object({
      high: z.number(),
      medium: z.number(),
      low: z.number(),
      not_feasible: z.number()
    }),
    risk_thresholds: z.object({
      low: z.number(),
      medium: z.number(),
      high: z.number(),
      critical: z.number()
    })
  }),
  output_config: z.object({
    include_recommendations: z.boolean().default(true),
    include_risk_factors: z.boolean().default(true),
    include_next_steps: z.boolean().default(true),
    include_estimates: z.boolean().default(true),
    custom_fields: z.record(z.any()).default({})
  }).default({}),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date()
});

// Enhanced Screening Result Schema
export const enhancedScreeningResultSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  response_id: z.string().uuid(),
  template_id: z.string().uuid(),
  
  // Core Scoring
  total_score: z.number().min(0),
  max_possible_score: z.number().min(0),
  percentage_score: z.number().min(0).max(100),
  
  // Category Scores
  category_scores: z.record(z.object({
    score: z.number(),
    max_score: z.number(),
    percentage: z.number(),
    weight: z.number()
  })).default({}),
  
  // Assessment Results
  feasibility_rating: z.enum(FEASIBILITY_RATINGS),
  qualification_level: z.enum(QUALIFICATION_LEVELS),
  risk_level: z.enum(RISK_LEVELS),
  follow_up_priority: z.enum(['high', 'medium', 'low']),
  
  // Detailed Analysis
  recommendations: z.array(z.object({
    category: z.string(),
    message: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    action_required: z.boolean().default(false)
  })).default([]),
  
  risk_factors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(RISK_LEVELS),
    description: z.string(),
    mitigation: z.string().optional()
  })).default([]),
  
  next_steps: z.array(z.object({
    step: z.string(),
    description: z.string(),
    priority: z.number(),
    estimated_duration: z.string().optional()
  })).default([]),
  
  // Project Estimates
  project_estimates: z.object({
    system_size: z.object({
      min_kwp: z.number().optional(),
      max_kwp: z.number().optional(),
      recommended_kwp: z.number().optional(),
      confidence: z.number().min(0).max(100).optional()
    }).optional(),
    
    investment: z.object({
      min_amount: z.number().optional(),
      max_amount: z.number().optional(),
      estimated_amount: z.number().optional(),
      currency: z.string().default('BRL'),
      confidence: z.number().min(0).max(100).optional()
    }).optional(),
    
    payback_period: z.object({
      min_months: z.number().optional(),
      max_months: z.number().optional(),
      estimated_months: z.number().optional()
    }).optional(),
    
    annual_savings: z.object({
      min_amount: z.number().optional(),
      max_amount: z.number().optional(),
      estimated_amount: z.number().optional(),
      currency: z.string().default('BRL')
    }).optional()
  }).optional(),
  
  // Rule Application Details
  applied_rules: z.array(z.object({
    rule_id: z.string().uuid(),
    rule_name: z.string(),
    category: z.string(),
    conditions_met: z.boolean(),
    score_awarded: z.number(),
    max_score: z.number(),
    details: z.record(z.any()).default({})
  })).default([]),
  
  // Metadata
  calculation_metadata: z.object({
    version: z.string(),
    calculated_at: z.date(),
    calculation_time_ms: z.number().optional(),
    rules_processed: z.number(),
    warnings: z.array(z.string()).default([]),
    debug_info: z.record(z.any()).default({})
  }),
  
  created_at: z.date(),
  updated_at: z.date()
});

// Screening Analytics Schema
export const screeningAnalyticsSchema = z.object({
  tenant_id: z.string().uuid(),
  template_id: z.string().uuid(),
  period: z.object({
    start_date: z.date(),
    end_date: z.date()
  }),
  
  // Volume Metrics
  total_screenings: z.number().min(0),
  completed_screenings: z.number().min(0),
  completion_rate: z.number().min(0).max(100),
  
  // Quality Metrics
  qualification_distribution: z.object({
    qualified: z.number().min(0),
    partially_qualified: z.number().min(0),
    not_qualified: z.number().min(0)
  }),
  
  feasibility_distribution: z.object({
    high: z.number().min(0),
    medium: z.number().min(0),
    low: z.number().min(0),
    not_feasible: z.number().min(0)
  }),
  
  // Score Analytics
  score_statistics: z.object({
    average_score: z.number(),
    median_score: z.number(),
    min_score: z.number(),
    max_score: z.number(),
    score_distribution: z.array(z.object({
      range: z.string(),
      count: z.number()
    }))
  }),
  
  // Category Performance
  category_performance: z.record(z.object({
    average_score: z.number(),
    max_possible: z.number(),
    performance_percentage: z.number()
  })),
  
  // Conversion Metrics
  conversion_metrics: z.object({
    leads_generated: z.number().min(0),
    qualified_leads: z.number().min(0),
    conversion_rate: z.number().min(0).max(100),
    average_project_size: z.number().optional(),
    total_pipeline_value: z.number().optional()
  }).optional(),
  
  generated_at: z.date()
});

// Input Schemas
export const createScreeningRuleSchema = screeningRuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateScreeningRuleSchema = createScreeningRuleSchema.partial();

export const createScreeningTemplateSchema = screeningTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateScreeningTemplateSchema = createScreeningTemplateSchema.partial();

// Type Exports
export type ScreeningCondition = z.infer<typeof screeningConditionSchema>;
export type ScreeningRule = z.infer<typeof screeningRuleSchema>;
export type ScreeningTemplate = z.infer<typeof screeningTemplateSchema>;
export type EnhancedScreeningResult = z.infer<typeof enhancedScreeningResultSchema>;
export type ScreeningAnalytics = z.infer<typeof screeningAnalyticsSchema>;

export type CreateScreeningRule = z.infer<typeof createScreeningRuleSchema>;
export type UpdateScreeningRule = z.infer<typeof updateScreeningRuleSchema>;
export type CreateScreeningTemplate = z.infer<typeof createScreeningTemplateSchema>;
export type UpdateScreeningTemplate = z.infer<typeof updateScreeningTemplateSchema>;

// Utility Types
export type ScreeningRuleApplication = {
  rule: ScreeningRule;
  conditionsMet: boolean;
  scoreAwarded: number;
  details: Record<string, any>;
};

export type CategoryScore = {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
  rules: ScreeningRuleApplication[];
};

// Version Control Types
export type TemplateVersion = {
  id: string;
  template_id: string;
  tenant_id: string;
  version: string;
  version_number: number;
  name: string;
  description?: string;
  questionnaire_template_id: string;
  screening_rules: string[];
  scoring_config: any;
  output_config: any;
  version_notes?: string;
  change_summary?: Record<string, any>;
  created_by?: string;
  is_current: boolean;
  backward_compatible: boolean;
  breaking_changes: string[];
  migration_required: boolean;
  created_at: Date;
  created_by_user?: {
    email: string;
    full_name?: string;
  };
  changes?: TemplateChange[];
};

export type TemplateChange = {
  id: string;
  template_id: string;
  version_id: string;
  tenant_id: string;
  change_type: 'create' | 'update' | 'delete' | 'rule_add' | 'rule_remove' | 'config_change' | 'activation' | 'deactivation';
  field_path?: string;
  old_value?: any;
  new_value?: any;
  change_description?: string;
  changed_by?: string;
  change_reason?: string;
  impact_assessment?: string;
  created_at: Date;
  changed_by_user?: {
    email: string;
    full_name?: string;
  };
};

export type ConsistencyCheck = {
  id: string;
  tenant_id: string;
  template_id: string;
  version_id: string;
  assessment_period_start: Date;
  assessment_period_end: Date;
  total_assessments: number;
  consistent_assessments: number;
  inconsistent_assessments: number;
  consistency_percentage: number;
  inconsistency_reasons: string[];
  affected_results: any[];
  resolution_status: 'pending' | 'resolved' | 'accepted';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at?: Date;
};

export type VersionChange = {
  field: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
  description: string;
};

export type VersionComparison = {
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  summary: {
    totalChanges: number;
    addedItems: number;
    removedItems: number;
    modifiedItems: number;
  };
};

// Default Screening Rules for Solar Projects
export const DEFAULT_SOLAR_SCREENING_RULES: Omit<CreateScreeningRule, 'tenant_id'>[] = [
  {
    name: 'High Energy Consumption',
    description: 'Customers with high monthly energy bills are better candidates',
    rule_type: 'threshold',
    category: 'financial',
    conditions: [{
      questionId: '', // Will be filled when linked to questionnaire
      operator: 'greater_than',
      value: 300,
      weight: 1.0
    }],
    scoring: {
      points: 25,
      weight: 2.0
    },
    thresholds: {
      high: 500,
      medium: 300,
      low: 150
    },
    recommendations: {
      qualified: 'Excellent candidate for solar installation with high potential savings',
      partially_qualified: 'Good candidate with moderate savings potential',
      not_qualified: 'Low energy consumption may not justify solar investment'
    },
    is_active: true,
    priority: 1
  },
  {
    name: 'Roof Condition Assessment',
    description: 'Roof condition affects installation feasibility and costs',
    rule_type: 'weighted_sum',
    category: 'technical',
    conditions: [{
      questionId: '', // Will be filled when linked to questionnaire
      operator: 'equals',
      value: 'excellent',
      weight: 1.0
    }],
    scoring: {
      points: 20,
      weight: 1.5
    },
    recommendations: {
      qualified: 'Roof is in excellent condition for solar installation',
      partially_qualified: 'Roof may need minor repairs before installation',
      not_qualified: 'Roof requires significant repairs before solar installation'
    },
    risk_factors: ['Roof structural integrity', 'Weather resistance'],
    is_active: true,
    priority: 2
  },
  {
    name: 'Solar Orientation Optimization',
    description: 'Roof orientation affects solar panel efficiency',
    rule_type: 'weighted_sum',
    category: 'technical',
    conditions: [{
      questionId: '', // Will be filled when linked to questionnaire
      operator: 'equals',
      value: 'north',
      weight: 1.0
    }],
    scoring: {
      points: 15,
      weight: 1.0
    },
    thresholds: {
      high: 15, // North facing
      medium: 10, // East/West facing
      low: 5     // Other orientations
    },
    recommendations: {
      qualified: 'Optimal roof orientation for maximum solar efficiency',
      partially_qualified: 'Good roof orientation with acceptable efficiency',
      not_qualified: 'Suboptimal orientation may reduce system efficiency'
    },
    is_active: true,
    priority: 3
  },
  {
    name: 'Shading Impact Assessment',
    description: 'Shading significantly reduces solar panel efficiency',
    rule_type: 'conditional',
    category: 'technical',
    conditions: [{
      questionId: '', // Will be filled when linked to questionnaire
      operator: 'equals',
      value: false, // No significant shading
      weight: 1.0
    }],
    scoring: {
      points: 10,
      weight: 1.0
    },
    recommendations: {
      qualified: 'Minimal shading allows for optimal solar performance',
      not_qualified: 'Significant shading may require system redesign or tree removal'
    },
    risk_factors: ['Reduced energy production', 'Potential hot spots on panels'],
    is_active: true,
    priority: 4
  },
  {
    name: 'Customer Interest Level',
    description: 'Customer interest level affects project success probability',
    rule_type: 'threshold',
    category: 'commercial',
    conditions: [{
      questionId: '', // Will be filled when linked to questionnaire
      operator: 'greater_than',
      value: 7,
      weight: 1.0
    }],
    scoring: {
      points: 10,
      weight: 0.5
    },
    thresholds: {
      high: 9,
      medium: 7,
      low: 5
    },
    recommendations: {
      qualified: 'High customer interest indicates strong project potential',
      partially_qualified: 'Moderate interest requires additional nurturing',
      not_qualified: 'Low interest may indicate poor timing or fit'
    },
    is_active: true,
    priority: 5
  }
];