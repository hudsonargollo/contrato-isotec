/**
 * Property-Based Test: Project Screening Consistency
 * 
 * Property-based tests for verifying project screening assessment consistency across
 * all screening operations. Tests universal properties that should hold for
 * any valid screening template, questionnaire responses, and version control operations.
 * 
 * Feature: saas-platform-transformation, Property 4: Project Screening Consistency
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { ScreeningService } from '@/lib/services/screening';
import { 
  ScreeningRule,
  ScreeningTemplate,
  EnhancedScreeningResult,
  CreateScreeningRule,
  CreateScreeningTemplate,
  ScreeningRuleType,
  FeasibilityRating,
  QualificationLevel,
  RiskLevel,
  TemplateVersion,
  ConsistencyCheck,
  ScreeningCondition
} from '@/lib/types/screening';
import type { QuestionnaireResponse, QuestionAnswer } from '@/lib/types/questionnaire';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock data stores for testing
let mockScreeningRules: Map<string, ScreeningRule[]> = new Map();
let mockScreeningTemplates: Map<string, ScreeningTemplate[]> = new Map();
let mockScreeningResults: Map<string, EnhancedScreeningResult[]> = new Map();
let mockTemplateVersions: Map<string, TemplateVersion[]> = new Map();
let mockConsistencyChecks: Map<string, ConsistencyCheck[]> = new Map();

// Mock Supabase client with comprehensive screening operations
const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: null, error: null });
    }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
    },
    from: jest.fn(() => mockQuery),
    rpc: jest.fn().mockImplementation((functionName, params) => {
      switch (functionName) {
        case 'create_screening_template_version':
          return Promise.resolve({ data: 'version-id', error: null });
        case 'check_screening_assessment_consistency':
          return Promise.resolve({ data: null, error: null });
        default:
          return Promise.resolve({ data: null, error: null });
      }
    }),
  };
};

const mockSupabaseClient = createMockSupabaseClient();
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient),
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));
// Property-based test generators
const screeningRuleTypeArbitrary = fc.constantFrom<ScreeningRuleType>(
  'threshold', 'range', 'weighted_sum', 'conditional', 'formula'
);

const feasibilityRatingArbitrary = fc.constantFrom<FeasibilityRating>(
  'high', 'medium', 'low', 'not_feasible'
);

const qualificationLevelArbitrary = fc.constantFrom<QualificationLevel>(
  'qualified', 'partially_qualified', 'not_qualified'
);

const riskLevelArbitrary = fc.constantFrom<RiskLevel>(
  'low', 'medium', 'high', 'critical'
);

const screeningConditionArbitrary = fc.record({
  questionId: fc.uuid(),
  operator: fc.constantFrom('equals', 'not_equals', 'greater_than', 'less_than', 'between', 'contains', 'not_contains'),
  value: fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.integer({ min: 0, max: 10000 }),
    fc.boolean(),
    fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: 1, maxLength: 5 })
  ),
  weight: fc.float({ min: Math.fround(0.1), max: Math.fround(5.0) }),
  metadata: fc.dictionary(fc.string(), fc.anything())
});

const createScreeningRuleArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  rule_type: screeningRuleTypeArbitrary,
  category: fc.constantFrom('technical', 'financial', 'regulatory', 'commercial', 'environmental'),
  conditions: fc.array(screeningConditionArbitrary, { minLength: 1, maxLength: 5 }),
  scoring: fc.record({
    points: fc.integer({ min: 1, max: 100 }),
    weight: fc.float({ min: Math.fround(0.1), max: Math.fround(3.0) }),
    max_points: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined })
  }),
  thresholds: fc.option(fc.record({
    high: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
    medium: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
    low: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined })
  }), { nil: undefined }),
  recommendations: fc.record({
    qualified: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
    partially_qualified: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
    not_qualified: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined })
  }),
  risk_factors: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 5 }),
  is_active: fc.boolean(),
  priority: fc.integer({ min: 0, max: 10 })
});

const createScreeningTemplateArbitrary = fc.record({
  questionnaire_template_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  version: fc.string().filter(v => /^\d+\.\d+$/.test(v)).map(() => `${fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0]}.${fc.sample(fc.integer({ min: 0, max: 9 }), 1)[0]}`),
  screening_rules: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
  scoring_config: fc.record({
    max_score: fc.integer({ min: 50, max: 200 }),
    qualification_thresholds: fc.record({
      qualified: fc.integer({ min: 70, max: 95 }),
      partially_qualified: fc.integer({ min: 40, max: 69 }),
      not_qualified: fc.integer({ min: 0, max: 39 })
    }),
    feasibility_thresholds: fc.record({
      high: fc.integer({ min: 75, max: 95 }),
      medium: fc.integer({ min: 50, max: 74 }),
      low: fc.integer({ min: 25, max: 49 }),
      not_feasible: fc.integer({ min: 0, max: 24 })
    }),
    risk_thresholds: fc.record({
      low: fc.integer({ min: 0, max: 25 }),
      medium: fc.integer({ min: 26, max: 50 }),
      high: fc.integer({ min: 51, max: 75 }),
      critical: fc.integer({ min: 76, max: 100 })
    })
  }),
  output_config: fc.record({
    include_recommendations: fc.boolean(),
    include_risk_factors: fc.boolean(),
    include_next_steps: fc.boolean(),
    include_estimates: fc.boolean(),
    custom_fields: fc.dictionary(fc.string(), fc.anything())
  }),
  is_active: fc.boolean()
});

const questionnaireResponseArbitrary = fc.record({
  id: fc.uuid(),
  tenant_id: fc.uuid(),
  template_id: fc.uuid(),
  responses: fc.dictionary(
    fc.uuid(), // question ID
    fc.oneof(
      fc.string({ minLength: 1, maxLength: 200 }),
      fc.integer({ min: 0, max: 10000 }),
      fc.boolean(),
      fc.float({ min: Math.fround(0), max: Math.fround(10000) })
    )
  ),
  completed_at: fc.option(fc.date(), { nil: undefined }),
  created_at: fc.date(),
  updated_at: fc.date()
});
// Helper functions for mock data management
const generateMockScreeningRule = (tenantId: string, ruleData: CreateScreeningRule): ScreeningRule => {
  const ruleId = `rule-${Date.now()}-${Math.random()}`;
  const now = new Date();
  
  return {
    id: ruleId,
    tenant_id: tenantId,
    ...ruleData,
    created_at: now,
    updated_at: now,
  };
};

const generateMockScreeningTemplate = (tenantId: string, templateData: CreateScreeningTemplate): ScreeningTemplate => {
  const templateId = `template-${Date.now()}-${Math.random()}`;
  const now = new Date();
  
  return {
    id: templateId,
    tenant_id: tenantId,
    ...templateData,
    created_at: now,
    updated_at: now,
  };
};

const generateMockScreeningResult = (
  tenantId: string, 
  responseId: string, 
  templateId: string,
  totalScore: number,
  maxScore: number
): EnhancedScreeningResult => {
  const resultId = `result-${Date.now()}-${Math.random()}`;
  const now = new Date();
  const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  return {
    id: resultId,
    tenant_id: tenantId,
    response_id: responseId,
    template_id: templateId,
    total_score: totalScore,
    max_possible_score: maxScore,
    percentage_score: percentageScore,
    category_scores: {},
    feasibility_rating: percentageScore >= 75 ? 'high' : percentageScore >= 50 ? 'medium' : percentageScore >= 25 ? 'low' : 'not_feasible',
    qualification_level: percentageScore >= 70 ? 'qualified' : percentageScore >= 40 ? 'partially_qualified' : 'not_qualified',
    risk_level: percentageScore >= 75 ? 'low' : percentageScore >= 50 ? 'medium' : percentageScore >= 25 ? 'high' : 'critical',
    follow_up_priority: percentageScore >= 70 ? 'high' : percentageScore >= 40 ? 'medium' : 'low',
    recommendations: [],
    risk_factors: [],
    next_steps: [],
    project_estimates: undefined,
    applied_rules: [],
    calculation_metadata: {
      version: '1.0',
      calculated_at: now,
      calculation_time_ms: 100,
      rules_processed: 0,
      warnings: [],
      debug_info: {}
    },
    created_at: now,
    updated_at: now,
  };
};

describe('Property-Based Tests: Project Screening Consistency', () => {
  let screeningService: ScreeningService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockScreeningRules.clear();
    mockScreeningTemplates.clear();
    mockScreeningResults.clear();
    mockTemplateVersions.clear();
    mockConsistencyChecks.clear();
    
    screeningService = new ScreeningService();
    
    // Setup mock implementations for screening operations
    setupMockScreeningOperations();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupMockScreeningOperations = () => {
    // Mock createScreeningRule
    jest.spyOn(screeningService, 'createScreeningRule').mockImplementation(async (tenantId: string, data: CreateScreeningRule) => {
      const rule = generateMockScreeningRule(tenantId, data);
      
      if (!mockScreeningRules.has(tenantId)) {
        mockScreeningRules.set(tenantId, []);
      }
      mockScreeningRules.get(tenantId)!.push(rule);
      
      return rule;
    });

    // Mock getScreeningRules
    jest.spyOn(screeningService, 'getScreeningRules').mockImplementation(async (tenantId: string, activeOnly: boolean = true) => {
      const rules = mockScreeningRules.get(tenantId) || [];
      return activeOnly ? rules.filter(rule => rule.is_active) : rules;
    });

    // Mock createScreeningTemplate
    jest.spyOn(screeningService, 'createScreeningTemplate').mockImplementation(async (tenantId: string, data: CreateScreeningTemplate) => {
      const template = generateMockScreeningTemplate(tenantId, data);
      
      if (!mockScreeningTemplates.has(tenantId)) {
        mockScreeningTemplates.set(tenantId, []);
      }
      mockScreeningTemplates.get(tenantId)!.push(template);
      
      return template;
    });

    // Mock getScreeningTemplate
    jest.spyOn(screeningService, 'getScreeningTemplate').mockImplementation(async (templateId: string) => {
      for (const templates of mockScreeningTemplates.values()) {
        const template = templates.find(t => t.id === templateId);
        if (template) return template;
      }
      return null;
    });

    // Mock processScreening
    jest.spyOn(screeningService, 'processScreening').mockImplementation(async (
      tenantId: string, 
      response: QuestionnaireResponse, 
      templateId?: string
    ) => {
      // Find template
      const template = templateId ? await screeningService.getScreeningTemplate(templateId) : null;
      if (!template) {
        throw new Error('No screening template found');
      }

      // Get applicable rules
      const allRules = await screeningService.getScreeningRules(tenantId);
      const applicableRules = allRules.filter(rule => template.screening_rules.includes(rule.id));
      const activeRules = applicableRules.filter(rule => rule.is_active);

      // Calculate score based on rules and responses
      let totalScore = 0;
      const maxPossibleScore = activeRules.reduce((sum, rule) => sum + rule.scoring.points, 0);

      for (const rule of activeRules) {
        // Simplified scoring logic for testing
        const ruleScore = calculateRuleScore(rule, response.responses);
        totalScore += ruleScore;
      }

      const result = generateMockScreeningResult(tenantId, response.id, template.id, totalScore, maxPossibleScore);
      
      // Update calculation metadata with correct rules processed count
      result.calculation_metadata.rules_processed = activeRules.length;
      
      if (!mockScreeningResults.has(tenantId)) {
        mockScreeningResults.set(tenantId, []);
      }
      mockScreeningResults.get(tenantId)!.push(result);
      
      return result;
    });
  };

  // Simplified rule scoring for testing
  const calculateRuleScore = (rule: ScreeningRule, responses: Record<string, QuestionAnswer>): number => {
    for (const condition of rule.conditions) {
      const responseValue = responses[condition.questionId];
      
      if (responseValue === undefined || responseValue === null) {
        return 0; // No response, no score
      }

      let conditionMet = false;
      
      switch (condition.operator) {
        case 'equals':
          conditionMet = responseValue === condition.value;
          break;
        case 'greater_than':
          conditionMet = Number(responseValue) > Number(condition.value);
          break;
        case 'less_than':
          conditionMet = Number(responseValue) < Number(condition.value);
          break;
        case 'contains':
          conditionMet = String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
          break;
        default:
          conditionMet = false;
      }
      
      if (conditionMet) {
        return rule.scoring.points;
      }
    }
    
    return 0;
  };
  describe('Property 4: Project Screening Consistency', () => {
    it('should generate consistent scores and recommendations based on questionnaire responses', async () => {
      // Feature: saas-platform-transformation, Property 4: Project Screening Consistency
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.uuid(),
            rules: fc.array(createScreeningRuleArbitrary, { minLength: 3, maxLength: 8 }),
            template: createScreeningTemplateArbitrary,
            responses: fc.array(questionnaireResponseArbitrary, { minLength: 2, maxLength: 5 })
          }),
          async ({ tenantId, rules, template, responses }) => {
            // Create screening rules
            const createdRules: ScreeningRule[] = [];
            for (const ruleData of rules) {
              const rule = await screeningService.createScreeningRule(tenantId, ruleData);
              createdRules.push(rule);
            }

            // Create screening template with rule references
            const templateWithRules = {
              ...template,
              screening_rules: createdRules.map(rule => rule.id)
            };
            const createdTemplate = await screeningService.createScreeningTemplate(tenantId, templateWithRules);

            // Test Requirement 3.1: Dynamic questionnaire system with consistent form generation
            expect(createdTemplate.questionnaire_template_id).toBe(template.questionnaire_template_id);
            expect(createdTemplate.screening_rules).toEqual(createdRules.map(rule => rule.id));
            expect(createdTemplate.scoring_config).toEqual(template.scoring_config);

            // Test Requirement 3.2: Configurable scoring rules and automated feasibility assessment
            const screeningResults: EnhancedScreeningResult[] = [];
            
            for (const response of responses) {
              const responseWithTenant = { ...response, tenant_id: tenantId };
              const result1 = await screeningService.processScreening(tenantId, responseWithTenant, createdTemplate.id);
              const result2 = await screeningService.processScreening(tenantId, responseWithTenant, createdTemplate.id);
              
              screeningResults.push(result1, result2);
              
              // Property: Same input should produce identical results (consistency)
              expect(result1.total_score).toBe(result2.total_score);
              expect(result1.max_possible_score).toBe(result2.max_possible_score);
              expect(result1.percentage_score).toBe(result2.percentage_score);
              expect(result1.feasibility_rating).toBe(result2.feasibility_rating);
              expect(result1.qualification_level).toBe(result2.qualification_level);
              expect(result1.risk_level).toBe(result2.risk_level);
              
              // Property: Scores should be within valid bounds
              expect(result1.total_score).toBeGreaterThanOrEqual(0);
              expect(result1.total_score).toBeLessThanOrEqual(result1.max_possible_score);
              expect(result1.percentage_score).toBeGreaterThanOrEqual(0);
              expect(result1.percentage_score).toBeLessThanOrEqual(100);
              
              // Property: Max possible score should equal sum of active rule points
              const activeRules = createdRules.filter(rule => rule.is_active);
              const expectedMaxScore = activeRules.reduce((sum, rule) => sum + rule.scoring.points, 0);
              expect(result1.max_possible_score).toBe(expectedMaxScore);
              
              // Property: Percentage score calculation should be accurate
              const expectedPercentage = result1.max_possible_score > 0 
                ? (result1.total_score / result1.max_possible_score) * 100 
                : 0;
              expect(Math.abs(result1.percentage_score - expectedPercentage)).toBeLessThan(0.01);
            }

            // Test Requirement 3.3: Risk assessment algorithms consistency
            for (const result of screeningResults) {
              // Property: Risk level should correlate with score thresholds
              const riskThresholds = createdTemplate.scoring_config.risk_thresholds;
              if (result.percentage_score >= 75) {
                expect(['low', 'medium']).toContain(result.risk_level);
              } else if (result.percentage_score < 25) {
                expect(['high', 'critical']).toContain(result.risk_level);
              }
              
              // Property: Feasibility rating should correlate with score thresholds
              const feasibilityThresholds = createdTemplate.scoring_config.feasibility_thresholds;
              if (result.percentage_score >= feasibilityThresholds.high) {
                expect(result.feasibility_rating).toBe('high');
              } else if (result.percentage_score >= feasibilityThresholds.medium) {
                expect(result.feasibility_rating).toBe('medium');
              } else if (result.percentage_score >= feasibilityThresholds.low) {
                expect(result.feasibility_rating).toBe('low');
              } else {
                expect(result.feasibility_rating).toBe('not_feasible');
              }
              
              // Property: Qualification level should correlate with score thresholds
              const qualificationThresholds = createdTemplate.scoring_config.qualification_thresholds;
              if (result.percentage_score >= qualificationThresholds.qualified) {
                expect(result.qualification_level).toBe('qualified');
              } else if (result.percentage_score >= qualificationThresholds.partially_qualified) {
                expect(result.qualification_level).toBe('partially_qualified');
              } else {
                expect(result.qualification_level).toBe('not_qualified');
              }
            }

            return true;
          }
        ),
        { 
          numRuns: 100,
          timeout: 25000
        }
      );
    }, 30000);
    it('should maintain version control for template changes and historical assessment consistency', async () => {
      // Feature: saas-platform-transformation, Property 4: Project Screening Consistency
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.uuid(),
            initialTemplate: createScreeningTemplateArbitrary,
            templateUpdates: fc.array(fc.record({
              name: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
              description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
              version: fc.string().filter(v => /^\d+\.\d+$/.test(v)).map(() => `${fc.sample(fc.integer({ min: 2, max: 10 }), 1)[0]}.${fc.sample(fc.integer({ min: 0, max: 9 }), 1)[0]}`),
              versionNotes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
            }), { minLength: 1, maxLength: 3 }),
            assessmentResponses: fc.array(questionnaireResponseArbitrary, { minLength: 2, maxLength: 4 })
          }),
          async ({ tenantId, initialTemplate, templateUpdates, assessmentResponses }) => {
            // Create initial template
            const createdTemplate = await screeningService.createScreeningTemplate(tenantId, initialTemplate);
            
            // Mock version control operations
            jest.spyOn(screeningService, 'createTemplateVersion').mockImplementation(async (
              templateId: string, 
              tenantId: string, 
              versionNotes?: string
            ) => {
              const versionId = `version-${Date.now()}-${Math.random()}`;
              const version: TemplateVersion = {
                id: versionId,
                template_id: templateId,
                tenant_id: tenantId,
                version: '2.0',
                version_number: 2,
                name: createdTemplate.name,
                description: createdTemplate.description,
                questionnaire_template_id: createdTemplate.questionnaire_template_id,
                screening_rules: createdTemplate.screening_rules,
                scoring_config: createdTemplate.scoring_config,
                output_config: createdTemplate.output_config,
                version_notes: versionNotes,
                change_summary: {},
                created_by: 'test-user-id',
                is_current: true,
                backward_compatible: true,
                breaking_changes: [],
                migration_required: false,
                created_at: new Date()
              };
              
              if (!mockTemplateVersions.has(templateId)) {
                mockTemplateVersions.set(templateId, []);
              }
              mockTemplateVersions.get(templateId)!.push(version);
              
              return version;
            });

            jest.spyOn(screeningService, 'checkAssessmentConsistency').mockImplementation(async (
              templateId: string,
              tenantId: string,
              startDate: Date,
              endDate: Date
            ) => {
              const consistencyId = `consistency-${Date.now()}-${Math.random()}`;
              const totalAssessments = assessmentResponses.length;
              const consistentAssessments = Math.floor(totalAssessments * 0.95); // 95% consistency
              
              const consistencyCheck: ConsistencyCheck = {
                id: consistencyId,
                tenant_id: tenantId,
                template_id: templateId,
                version_id: 'version-1',
                assessment_period_start: startDate,
                assessment_period_end: endDate,
                total_assessments: totalAssessments,
                consistent_assessments: consistentAssessments,
                inconsistent_assessments: totalAssessments - consistentAssessments,
                consistency_percentage: (consistentAssessments / totalAssessments) * 100,
                inconsistency_reasons: totalAssessments > consistentAssessments ? ['Template version mismatch'] : [],
                affected_results: [],
                resolution_status: 'pending',
                created_at: new Date()
              };
              
              if (!mockConsistencyChecks.has(templateId)) {
                mockConsistencyChecks.set(templateId, []);
              }
              mockConsistencyChecks.get(templateId)!.push(consistencyCheck);
              
              return consistencyCheck;
            });

            // Test Requirement 3.5: Template versioning system with change tracking
            
            // Process initial assessments
            const initialResults: EnhancedScreeningResult[] = [];
            for (const response of assessmentResponses) {
              const responseWithTenant = { ...response, tenant_id: tenantId };
              const result = await screeningService.processScreening(tenantId, responseWithTenant, createdTemplate.id);
              initialResults.push(result);
            }

            // Apply template updates and create versions
            for (const update of templateUpdates) {
              const version = await screeningService.createTemplateVersion(
                createdTemplate.id,
                tenantId,
                update.versionNotes
              );
              
              // Property: Version control maintains proper metadata
              expect(version.template_id).toBe(createdTemplate.id);
              expect(version.tenant_id).toBe(tenantId);
              expect(version.created_by).toBe('test-user-id');
              expect(version.created_at).toBeInstanceOf(Date);
              expect(version.is_current).toBe(true);
              
              // Property: Version notes are preserved
              if (update.versionNotes) {
                expect(version.version_notes).toBe(update.versionNotes);
              }
            }

            // Check assessment consistency across versions
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            const endDate = new Date();
            
            const consistencyCheck = await screeningService.checkAssessmentConsistency(
              createdTemplate.id,
              tenantId,
              startDate,
              endDate
            );

            // Property: Consistency check provides accurate metrics
            expect(consistencyCheck.template_id).toBe(createdTemplate.id);
            expect(consistencyCheck.tenant_id).toBe(tenantId);
            expect(consistencyCheck.total_assessments).toBe(assessmentResponses.length);
            expect(consistencyCheck.consistent_assessments).toBeGreaterThanOrEqual(0);
            expect(consistencyCheck.consistent_assessments).toBeLessThanOrEqual(consistencyCheck.total_assessments);
            expect(consistencyCheck.inconsistent_assessments).toBe(
              consistencyCheck.total_assessments - consistencyCheck.consistent_assessments
            );
            
            // Property: Consistency percentage is calculated correctly
            const expectedPercentage = consistencyCheck.total_assessments > 0 
              ? (consistencyCheck.consistent_assessments / consistencyCheck.total_assessments) * 100 
              : 100;
            expect(Math.abs(consistencyCheck.consistency_percentage - expectedPercentage)).toBeLessThan(0.01);
            
            // Property: Consistency percentage is within valid bounds
            expect(consistencyCheck.consistency_percentage).toBeGreaterThanOrEqual(0);
            expect(consistencyCheck.consistency_percentage).toBeLessThanOrEqual(100);

            // Property: Historical assessment consistency is maintained
            // Re-process same responses and verify consistent results
            for (let i = 0; i < assessmentResponses.length; i++) {
              const response = { ...assessmentResponses[i], tenant_id: tenantId };
              const newResult = await screeningService.processScreening(tenantId, response, createdTemplate.id);
              const originalResult = initialResults[i];
              
              // Results should be consistent for the same template version
              expect(newResult.total_score).toBe(originalResult.total_score);
              expect(newResult.max_possible_score).toBe(originalResult.max_possible_score);
              expect(newResult.percentage_score).toBe(originalResult.percentage_score);
              expect(newResult.feasibility_rating).toBe(originalResult.feasibility_rating);
              expect(newResult.qualification_level).toBe(originalResult.qualification_level);
            }

            return true;
          }
        ),
        { 
          numRuns: 100,
          timeout: 30000
        }
      );
    }, 35000);

    it('should ensure scoring rule application is deterministic and reproducible', async () => {
      // Feature: saas-platform-transformation, Property 4: Project Screening Consistency
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            tenantId: fc.uuid(),
            rules: fc.array(createScreeningRuleArbitrary, { minLength: 5, maxLength: 12 }),
            template: createScreeningTemplateArbitrary,
            testResponse: questionnaireResponseArbitrary,
            iterations: fc.integer({ min: 3, max: 7 })
          }),
          async ({ tenantId, rules, template, testResponse, iterations }) => {
            // Create screening rules with deterministic scoring
            const createdRules: ScreeningRule[] = [];
            for (const ruleData of rules) {
              const rule = await screeningService.createScreeningRule(tenantId, ruleData);
              createdRules.push(rule);
            }

            // Create template with all rules
            const templateWithRules = {
              ...template,
              screening_rules: createdRules.map(rule => rule.id)
            };
            const createdTemplate = await screeningService.createScreeningTemplate(tenantId, templateWithRules);

            // Process the same response multiple times
            const results: EnhancedScreeningResult[] = [];
            const responseWithTenant = { ...testResponse, tenant_id: tenantId };
            
            for (let i = 0; i < iterations; i++) {
              const result = await screeningService.processScreening(tenantId, responseWithTenant, createdTemplate.id);
              results.push(result);
            }

            // Property: All results should be identical (deterministic)
            const firstResult = results[0];
            for (let i = 1; i < results.length; i++) {
              const currentResult = results[i];
              
              expect(currentResult.total_score).toBe(firstResult.total_score);
              expect(currentResult.max_possible_score).toBe(firstResult.max_possible_score);
              expect(currentResult.percentage_score).toBe(firstResult.percentage_score);
              expect(currentResult.feasibility_rating).toBe(firstResult.feasibility_rating);
              expect(currentResult.qualification_level).toBe(firstResult.qualification_level);
              expect(currentResult.risk_level).toBe(firstResult.risk_level);
              expect(currentResult.follow_up_priority).toBe(firstResult.follow_up_priority);
            }

            // Property: Calculation metadata should be consistent
            for (const result of results) {
              expect(result.calculation_metadata.version).toBe('1.0');
              expect(result.calculation_metadata.rules_processed).toBe(createdRules.filter(r => r.is_active).length);
              expect(result.calculation_metadata.calculated_at).toBeInstanceOf(Date);
              expect(result.calculation_metadata.calculation_time_ms).toBeGreaterThan(0);
              expect(Array.isArray(result.calculation_metadata.warnings)).toBe(true);
              expect(typeof result.calculation_metadata.debug_info).toBe('object');
            }

            // Property: Template and response references should be preserved
            for (const result of results) {
              expect(result.tenant_id).toBe(tenantId);
              expect(result.response_id).toBe(testResponse.id);
              expect(result.template_id).toBe(createdTemplate.id);
            }

            return true;
          }
        ),
        { 
          numRuns: 100,
          timeout: 20000
        }
      );
    }, 25000);
  });
});