/**
 * Project Screening Service
 * Implements configurable scoring rules and automated feasibility assessment
 * Requirements: 3.2, 3.3 - Project screening and scoring engine
 */

import { createClient } from '@/lib/supabase/client';
import type {
  ScreeningRule,
  ScreeningTemplate,
  EnhancedScreeningResult,
  CreateScreeningRule,
  UpdateScreeningRule,
  CreateScreeningTemplate,
  UpdateScreeningTemplate,
  ScreeningRuleApplication,
  CategoryScore,
  FeasibilityRating,
  QualificationLevel,
  RiskLevel,
  ScreeningAnalytics
} from '@/lib/types/screening';
import type { QuestionnaireResponse, QuestionAnswer } from '@/lib/types/questionnaire';

export class ScreeningService {
  private supabase = createClient();

  // Screening Rules Management
  async createScreeningRule(tenantId: string, data: CreateScreeningRule): Promise<ScreeningRule> {
    const { data: rule, error } = await this.supabase
      .from('screening_rules')
      .insert({
        tenant_id: tenantId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformScreeningRule(rule);
  }

  async getScreeningRules(tenantId: string, activeOnly: boolean = true): Promise<ScreeningRule[]> {
    let query = this.supabase
      .from('screening_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('priority', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: rules, error } = await query;

    if (error) throw error;
    return rules?.map(this.transformScreeningRule) || [];
  }

  async updateScreeningRule(ruleId: string, data: UpdateScreeningRule): Promise<ScreeningRule> {
    const { data: rule, error } = await this.supabase
      .from('screening_rules')
      .update(data)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return this.transformScreeningRule(rule);
  }

  async updateScreeningTemplate(templateId: string, data: UpdateScreeningTemplate): Promise<ScreeningTemplate> {
    const { data: template, error } = await this.supabase
      .from('screening_templates')
      .update(data)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return this.transformScreeningTemplate(template);
  }

  async deleteScreeningTemplate(templateId: string): Promise<void> {
    const { error } = await this.supabase
      .from('screening_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  }

  // Version Control Methods
  async getTemplateVersionHistory(templateId: string): Promise<TemplateVersion[]> {
    const { data: versions, error } = await this.supabase
      .from('screening_template_versions')
      .select(`
        *,
        created_by_user:created_by(email, full_name),
        changes:screening_template_changes(*)
      `)
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return versions?.map(this.transformTemplateVersion) || [];
  }

  async createTemplateVersion(
    templateId: string,
    tenantId: string,
    versionNotes?: string,
    autoIncrement: boolean = true
  ): Promise<TemplateVersion> {
    const { data: versionId, error } = await this.supabase
      .rpc('create_screening_template_version', {
        template_id_param: templateId,
        tenant_id_param: tenantId,
        version_notes_param: versionNotes,
        auto_increment: autoIncrement
      });

    if (error) throw error;

    // Fetch the created version
    const { data: version, error: fetchError } = await this.supabase
      .from('screening_template_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (fetchError) throw fetchError;
    return this.transformTemplateVersion(version);
  }

  async getTemplateChanges(templateId: string, versionId?: string): Promise<TemplateChange[]> {
    let query = this.supabase
      .from('screening_template_changes')
      .select(`
        *,
        changed_by_user:changed_by(email, full_name)
      `)
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    const { data: changes, error } = await query;

    if (error) throw error;
    return changes?.map(this.transformTemplateChange) || [];
  }

  async checkAssessmentConsistency(
    templateId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConsistencyCheck> {
    const { data: result, error } = await this.supabase
      .rpc('check_screening_assessment_consistency', {
        template_id_param: templateId,
        tenant_id_param: tenantId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (error) throw error;
    return this.transformConsistencyCheck(result);
  }

  async getConsistencyHistory(templateId: string): Promise<ConsistencyCheck[]> {
    const { data: history, error } = await this.supabase
      .from('screening_assessment_consistency')
      .select('*')
      .eq('template_id', templateId)
      .order('assessment_period_start', { ascending: false });

    if (error) throw error;
    return history?.map(this.transformConsistencyCheck) || [];
  }

  async compareTemplateVersions(
    templateId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<VersionComparison> {
    const { data: versions, error } = await this.supabase
      .from('screening_template_versions')
      .select('*')
      .eq('template_id', templateId)
      .in('version', [fromVersion, toVersion]);

    if (error) throw error;

    if (!versions || versions.length !== 2) {
      throw new Error('Could not find both versions for comparison');
    }

    const fromVersionData = versions.find(v => v.version === fromVersion);
    const toVersionData = versions.find(v => v.version === toVersion);

    if (!fromVersionData || !toVersionData) {
      throw new Error('Version data not found');
    }

    return this.generateVersionComparison(fromVersionData, toVersionData);
  }

  async revertToVersion(
    templateId: string,
    tenantId: string,
    targetVersion: string,
    revertNotes?: string
  ): Promise<ScreeningTemplate> {
    // Get the target version data
    const { data: versionData, error: versionError } = await this.supabase
      .from('screening_template_versions')
      .select('*')
      .eq('template_id', templateId)
      .eq('version', targetVersion)
      .single();

    if (versionError) throw versionError;

    // Create a new version with the reverted data
    const newVersionNumber = await this.getNextVersionNumber(templateId);
    const newVersion = `${Math.floor(newVersionNumber / 10)}.${newVersionNumber % 10}`;

    // Update the template with reverted data
    const { data: updatedTemplate, error: updateError } = await this.supabase
      .from('screening_templates')
      .update({
        name: versionData.name,
        description: versionData.description,
        version: newVersion,
        version_number: newVersionNumber,
        screening_rules: versionData.screening_rules,
        scoring_config: versionData.scoring_config,
        output_config: versionData.output_config,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create version record for the revert
    await this.createTemplateVersion(
      templateId,
      tenantId,
      `Reverted to version ${targetVersion}. ${revertNotes || ''}`,
      false
    );

    return this.transformScreeningTemplate(updatedTemplate);
  }

  async deleteScreeningRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('screening_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }

  // Screening Templates Management
  async createScreeningTemplate(tenantId: string, data: CreateScreeningTemplate): Promise<ScreeningTemplate> {
    const { data: template, error } = await this.supabase
      .from('screening_templates')
      .insert({
        tenant_id: tenantId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformScreeningTemplate(template);
  }

  async getScreeningTemplates(tenantId: string, activeOnly: boolean = true): Promise<ScreeningTemplate[]> {
    let query = this.supabase
      .from('screening_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error } = await query;

    if (error) throw error;
    return templates?.map(this.transformScreeningTemplate) || [];
  }

  async getScreeningTemplate(templateId: string): Promise<ScreeningTemplate | null> {
    const { data: template, error } = await this.supabase
      .from('screening_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.transformScreeningTemplate(template);
  }

  // Core Screening Engine
  async processScreening(
    tenantId: string,
    response: QuestionnaireResponse,
    templateId?: string
  ): Promise<EnhancedScreeningResult> {
    // Get screening template
    const template = templateId 
      ? await this.getScreeningTemplate(templateId)
      : await this.getDefaultScreeningTemplate(tenantId, response.template_id);

    if (!template) {
      throw new Error('No screening template found');
    }

    // Get screening rules
    const allRules = await this.getScreeningRules(tenantId);
    const applicableRules = allRules.filter(rule => 
      template.screening_rules.includes(rule.id)
    );

    // Process each rule
    const ruleApplications: ScreeningRuleApplication[] = [];
    const categoryScores: Record<string, CategoryScore> = {};

    for (const rule of applicableRules) {
      const application = await this.applyScreeningRule(rule, response.responses);
      ruleApplications.push(application);

      // Aggregate by category
      if (!categoryScores[rule.category]) {
        categoryScores[rule.category] = {
          category: rule.category,
          score: 0,
          maxScore: 0,
          percentage: 0,
          weight: 0,
          rules: []
        };
      }

      categoryScores[rule.category].rules.push(application);
      categoryScores[rule.category].score += application.scoreAwarded;
      categoryScores[rule.category].maxScore += rule.scoring.points;
      categoryScores[rule.category].weight += rule.scoring.weight;
    }

    // Calculate category percentages
    Object.values(categoryScores).forEach(category => {
      category.percentage = category.maxScore > 0 
        ? (category.score / category.maxScore) * 100 
        : 0;
    });

    // Calculate total scores
    const totalScore = ruleApplications.reduce((sum, app) => sum + app.scoreAwarded, 0);
    const maxPossibleScore = applicableRules.reduce((sum, rule) => sum + rule.scoring.points, 0);
    const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Determine ratings
    const feasibilityRating = this.calculateFeasibilityRating(percentageScore, template.scoring_config.feasibility_thresholds);
    const qualificationLevel = this.calculateQualificationLevel(percentageScore, template.scoring_config.qualification_thresholds);
    const riskLevel = this.calculateRiskLevel(ruleApplications, template.scoring_config.risk_thresholds);

    // Generate recommendations and risk factors
    const recommendations = this.generateRecommendations(ruleApplications, qualificationLevel);
    const riskFactors = this.generateRiskFactors(ruleApplications);
    const nextSteps = this.generateNextSteps(qualificationLevel, feasibilityRating);

    // Calculate project estimates
    const projectEstimates = this.calculateProjectEstimates(response.responses, totalScore, maxPossibleScore);

    // Create screening result
    const screeningResult: Omit<EnhancedScreeningResult, 'id' | 'created_at' | 'updated_at'> = {
      tenant_id: tenantId,
      response_id: response.id,
      template_id: template.id,
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      percentage_score: percentageScore,
      category_scores: Object.fromEntries(
        Object.entries(categoryScores).map(([key, value]) => [
          key,
          {
            score: value.score,
            max_score: value.maxScore,
            percentage: value.percentage,
            weight: value.weight
          }
        ])
      ),
      feasibility_rating: feasibilityRating,
      qualification_level: qualificationLevel,
      risk_level: riskLevel,
      follow_up_priority: this.calculateFollowUpPriority(qualificationLevel, feasibilityRating),
      recommendations,
      risk_factors: riskFactors,
      next_steps: nextSteps,
      project_estimates: projectEstimates,
      applied_rules: ruleApplications.map(app => ({
        rule_id: app.rule.id,
        rule_name: app.rule.name,
        category: app.rule.category,
        conditions_met: app.conditionsMet,
        score_awarded: app.scoreAwarded,
        max_score: app.rule.scoring.points,
        details: app.details
      })),
      calculation_metadata: {
        version: '1.0',
        calculated_at: new Date(),
        calculation_time_ms: Date.now(), // Will be updated
        rules_processed: applicableRules.length,
        warnings: [],
        debug_info: {
          template_version: template.version,
          rules_applied: applicableRules.length,
          categories_processed: Object.keys(categoryScores).length
        }
      }
    };

    // Save to database
    const { data: savedResult, error } = await this.supabase
      .from('screening_results')
      .insert(screeningResult)
      .select()
      .single();

    if (error) throw error;

    return this.transformScreeningResult(savedResult);
  }

  // Rule Application Logic
  private async applyScreeningRule(
    rule: ScreeningRule,
    responses: Record<string, QuestionAnswer>
  ): Promise<ScreeningRuleApplication> {
    let conditionsMet = false;
    let scoreAwarded = 0;
    const details: Record<string, any> = {};

    try {
      switch (rule.rule_type) {
        case 'threshold':
          conditionsMet = this.evaluateThresholdRule(rule, responses, details);
          break;
        case 'range':
          conditionsMet = this.evaluateRangeRule(rule, responses, details);
          break;
        case 'weighted_sum':
          conditionsMet = this.evaluateWeightedSumRule(rule, responses, details);
          break;
        case 'conditional':
          conditionsMet = this.evaluateConditionalRule(rule, responses, details);
          break;
        case 'formula':
          conditionsMet = this.evaluateFormulaRule(rule, responses, details);
          break;
        default:
          details.error = `Unknown rule type: ${rule.rule_type}`;
      }

      if (conditionsMet) {
        scoreAwarded = rule.scoring.points;
      }

    } catch (error) {
      details.error = error instanceof Error ? error.message : 'Unknown error';
      conditionsMet = false;
    }

    return {
      rule,
      conditionsMet,
      scoreAwarded,
      details
    };
  }

  private evaluateThresholdRule(
    rule: ScreeningRule,
    responses: Record<string, QuestionAnswer>,
    details: Record<string, any>
  ): boolean {
    if (rule.conditions.length === 0) return false;

    const condition = rule.conditions[0]; // Threshold rules typically have one condition
    const responseValue = responses[condition.questionId];
    
    if (responseValue === undefined || responseValue === null) {
      details.missing_response = condition.questionId;
      return false;
    }

    details.response_value = responseValue;
    details.threshold_value = condition.value;
    details.operator = condition.operator;

    switch (condition.operator) {
      case 'greater_than':
        return Number(responseValue) > Number(condition.value);
      case 'less_than':
        return Number(responseValue) < Number(condition.value);
      case 'equals':
        return responseValue === condition.value;
      case 'not_equals':
        return responseValue !== condition.value;
      default:
        return false;
    }
  }

  private evaluateRangeRule(
    rule: ScreeningRule,
    responses: Record<string, QuestionAnswer>,
    details: Record<string, any>
  ): boolean {
    if (rule.conditions.length === 0) return false;

    const condition = rule.conditions[0];
    const responseValue = responses[condition.questionId];
    
    if (responseValue === undefined || responseValue === null) {
      details.missing_response = condition.questionId;
      return false;
    }

    const numValue = Number(responseValue);
    const rangeValues = Array.isArray(condition.value) ? condition.value : [condition.value];
    
    if (rangeValues.length >= 2) {
      const min = Number(rangeValues[0]);
      const max = Number(rangeValues[1]);
      details.range = { min, max };
      details.response_value = numValue;
      return numValue >= min && numValue <= max;
    }

    return false;
  }

  private evaluateWeightedSumRule(
    rule: ScreeningRule,
    responses: Record<string, QuestionAnswer>,
    details: Record<string, any>
  ): boolean {
    let weightedSum = 0;
    let totalWeight = 0;
    const conditionResults: any[] = [];

    for (const condition of rule.conditions) {
      const responseValue = responses[condition.questionId];
      
      if (responseValue !== undefined && responseValue !== null) {
        let conditionScore = 0;
        
        // Convert response to numeric score if possible
        if (typeof responseValue === 'number') {
          conditionScore = responseValue;
        } else if (typeof responseValue === 'string') {
          // Try to extract numeric value or use predefined scoring
          const numValue = parseFloat(responseValue);
          conditionScore = isNaN(numValue) ? this.getOptionScore(responseValue) : numValue;
        } else if (typeof responseValue === 'boolean') {
          conditionScore = responseValue ? 1 : 0;
        }

        const weightedScore = conditionScore * condition.weight;
        weightedSum += weightedScore;
        totalWeight += condition.weight;

        conditionResults.push({
          questionId: condition.questionId,
          responseValue,
          conditionScore,
          weight: condition.weight,
          weightedScore
        });
      }
    }

    details.condition_results = conditionResults;
    details.weighted_sum = weightedSum;
    details.total_weight = totalWeight;
    details.average_score = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Use thresholds if available, otherwise use a default threshold
    const threshold = rule.thresholds?.medium || (rule.scoring.points * 0.6);
    return weightedSum >= threshold;
  }

  private evaluateConditionalRule(
    rule: ScreeningRule,
    responses: Record<string, QuestionAnswer>,
    details: Record<string, any>
  ): boolean {
    // Evaluate all conditions and apply logical operators
    const conditionResults = rule.conditions.map(condition => {
      const responseValue = responses[condition.questionId];
      
      if (responseValue === undefined || responseValue === null) {
        return false;
      }

      switch (condition.operator) {
        case 'equals':
          return responseValue === condition.value;
        case 'not_equals':
          return responseValue !== condition.value;
        case 'contains':
          return String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'not_contains':
          return !String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater_than':
          return Number(responseValue) > Number(condition.value);
        case 'less_than':
          return Number(responseValue) < Number(condition.value);
        default:
          return false;
      }
    });

    details.condition_results = conditionResults;
    
    // For conditional rules, all conditions must be met (AND logic)
    return conditionResults.every(result => result === true);
  }

  private evaluateFormulaRule(
    rule: ScreeningRule,
    responses: Record<string, QuestionAnswer>,
    details: Record<string, any>
  ): boolean {
    // This would implement custom formula evaluation
    // For now, return false as this is an advanced feature
    details.error = 'Formula rules not yet implemented';
    return false;
  }

  private getOptionScore(optionValue: string): number {
    // This would map option values to scores based on questionnaire configuration
    // For now, return a default score
    const scoreMap: Record<string, number> = {
      'excellent': 3,
      'good': 2,
      'fair': 1,
      'poor': 0,
      'north': 3,
      'northeast': 2.5,
      'northwest': 2.5,
      'east': 2,
      'west': 2,
      'south': 1,
      'house': 2,
      'apartment': 1,
      'commercial': 2,
      'rural': 3
    };

    return scoreMap[optionValue.toLowerCase()] || 0;
  }

  // Rating Calculation Methods
  private calculateFeasibilityRating(
    percentageScore: number,
    thresholds: { high: number; medium: number; low: number; not_feasible: number }
  ): FeasibilityRating {
    if (percentageScore >= thresholds.high) return 'high';
    if (percentageScore >= thresholds.medium) return 'medium';
    if (percentageScore >= thresholds.low) return 'low';
    return 'not_feasible';
  }

  private calculateQualificationLevel(
    percentageScore: number,
    thresholds: { qualified: number; partially_qualified: number; not_qualified: number }
  ): QualificationLevel {
    if (percentageScore >= thresholds.qualified) return 'qualified';
    if (percentageScore >= thresholds.partially_qualified) return 'partially_qualified';
    return 'not_qualified';
  }

  private calculateRiskLevel(
    ruleApplications: ScreeningRuleApplication[],
    thresholds: { low: number; medium: number; high: number; critical: number }
  ): RiskLevel {
    // Calculate risk based on failed critical rules and overall score
    const criticalRulesFailed = ruleApplications.filter(app => 
      app.rule.priority <= 2 && !app.conditionsMet
    ).length;

    const totalRiskFactors = ruleApplications.reduce((sum, app) => 
      sum + app.rule.risk_factors.length, 0
    );

    if (criticalRulesFailed >= 2 || totalRiskFactors >= thresholds.critical) return 'critical';
    if (criticalRulesFailed >= 1 || totalRiskFactors >= thresholds.high) return 'high';
    if (totalRiskFactors >= thresholds.medium) return 'medium';
    return 'low';
  }

  private calculateFollowUpPriority(
    qualificationLevel: QualificationLevel,
    feasibilityRating: FeasibilityRating
  ): 'high' | 'medium' | 'low' {
    if (qualificationLevel === 'qualified' && feasibilityRating === 'high') return 'high';
    if (qualificationLevel === 'qualified' || feasibilityRating === 'high') return 'medium';
    return 'low';
  }

  // Recommendation Generation
  private generateRecommendations(
    ruleApplications: ScreeningRuleApplication[],
    qualificationLevel: QualificationLevel
  ): Array<{
    category: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    action_required: boolean;
  }> {
    const recommendations: Array<{
      category: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
      action_required: boolean;
    }> = [];

    // Add rule-specific recommendations
    ruleApplications.forEach(app => {
      const ruleRecommendations = app.rule.recommendations;
      let message = '';

      if (app.conditionsMet && ruleRecommendations.qualified) {
        message = ruleRecommendations.qualified;
      } else if (!app.conditionsMet && qualificationLevel === 'partially_qualified' && ruleRecommendations.partially_qualified) {
        message = ruleRecommendations.partially_qualified;
      } else if (!app.conditionsMet && ruleRecommendations.not_qualified) {
        message = ruleRecommendations.not_qualified;
      }

      if (message) {
        recommendations.push({
          category: app.rule.category,
          message,
          priority: app.rule.priority <= 2 ? 'high' : app.rule.priority <= 4 ? 'medium' : 'low',
          action_required: !app.conditionsMet && app.rule.priority <= 3
        });
      }
    });

    return recommendations;
  }

  private generateRiskFactors(
    ruleApplications: ScreeningRuleApplication[]
  ): Array<{
    factor: string;
    severity: RiskLevel;
    description: string;
    mitigation?: string;
  }> {
    const riskFactors: Array<{
      factor: string;
      severity: RiskLevel;
      description: string;
      mitigation?: string;
    }> = [];

    ruleApplications.forEach(app => {
      if (!app.conditionsMet && app.rule.risk_factors.length > 0) {
        app.rule.risk_factors.forEach(factor => {
          riskFactors.push({
            factor,
            severity: app.rule.priority <= 2 ? 'high' : app.rule.priority <= 4 ? 'medium' : 'low',
            description: `Risk identified in ${app.rule.category} assessment`,
            mitigation: `Address ${factor.toLowerCase()} before proceeding with installation`
          });
        });
      }
    });

    return riskFactors;
  }

  private generateNextSteps(
    qualificationLevel: QualificationLevel,
    feasibilityRating: FeasibilityRating
  ): Array<{
    step: string;
    description: string;
    priority: number;
    estimated_duration?: string;
  }> {
    const nextSteps: Array<{
      step: string;
      description: string;
      priority: number;
      estimated_duration?: string;
    }> = [];

    if (qualificationLevel === 'qualified') {
      nextSteps.push(
        {
          step: 'Schedule Site Assessment',
          description: 'Conduct detailed on-site evaluation of roof and electrical system',
          priority: 1,
          estimated_duration: '1-2 hours'
        },
        {
          step: 'Prepare Detailed Proposal',
          description: 'Create customized solar system proposal with financial analysis',
          priority: 2,
          estimated_duration: '2-3 days'
        },
        {
          step: 'Present Solution',
          description: 'Schedule presentation meeting to discuss proposal and answer questions',
          priority: 3,
          estimated_duration: '1 hour'
        }
      );
    } else if (qualificationLevel === 'partially_qualified') {
      nextSteps.push(
        {
          step: 'Address Qualification Issues',
          description: 'Work with customer to resolve identified concerns or limitations',
          priority: 1,
          estimated_duration: '1-2 weeks'
        },
        {
          step: 'Follow-up Assessment',
          description: 'Re-evaluate project feasibility after addressing initial concerns',
          priority: 2,
          estimated_duration: '1 week'
        }
      );
    } else {
      nextSteps.push(
        {
          step: 'Educational Follow-up',
          description: 'Provide information about solar benefits and future opportunities',
          priority: 1,
          estimated_duration: '30 minutes'
        },
        {
          step: 'Future Re-evaluation',
          description: 'Schedule follow-up in 6-12 months to reassess situation',
          priority: 2,
          estimated_duration: '15 minutes'
        }
      );
    }

    return nextSteps;
  }

  // Project Estimates Calculation
  private calculateProjectEstimates(
    responses: Record<string, QuestionAnswer>,
    totalScore: number,
    maxScore: number
  ): any {
    // This would implement sophisticated estimation algorithms
    // For now, return basic estimates based on energy consumption
    
    const monthlyBill = this.extractMonthlyBill(responses);
    if (!monthlyBill) return undefined;

    // Basic estimation formulas (these would be more sophisticated in production)
    const estimatedConsumption = monthlyBill * 12 / 0.65; // Assuming R$ 0.65/kWh average
    const systemSizeKwp = estimatedConsumption / 1200; // Assuming 1200 kWh/kWp/year
    const investmentPerKwp = 4500; // R$ 4,500 per kWp (example)
    
    const confidence = Math.min(95, (totalScore / maxScore) * 100);

    return {
      system_size: {
        min_kwp: systemSizeKwp * 0.8,
        max_kwp: systemSizeKwp * 1.2,
        recommended_kwp: systemSizeKwp,
        confidence
      },
      investment: {
        min_amount: systemSizeKwp * 0.8 * investmentPerKwp,
        max_amount: systemSizeKwp * 1.2 * investmentPerKwp,
        estimated_amount: systemSizeKwp * investmentPerKwp,
        currency: 'BRL',
        confidence
      },
      payback_period: {
        min_months: 60,
        max_months: 84,
        estimated_months: 72
      },
      annual_savings: {
        min_amount: monthlyBill * 12 * 0.8,
        max_amount: monthlyBill * 12 * 0.95,
        estimated_amount: monthlyBill * 12 * 0.9,
        currency: 'BRL'
      }
    };
  }

  private extractMonthlyBill(responses: Record<string, QuestionAnswer>): number | null {
    // Look for monthly bill in responses (this would be more sophisticated)
    for (const [key, value] of Object.entries(responses)) {
      if (typeof value === 'number' && value > 50 && value < 10000) {
        // Likely a monthly bill value
        return value;
      }
    }
    return null;
  }

  // Utility Methods
  private async getDefaultScreeningTemplate(
    tenantId: string,
    questionnaireTemplateId: string
  ): Promise<ScreeningTemplate | null> {
    const { data: template, error } = await this.supabase
      .from('screening_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('questionnaire_template_id', questionnaireTemplateId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.transformScreeningTemplate(template);
  }

  private async getNextVersionNumber(templateId: string): Promise<number> {
    const { data: maxVersion, error } = await this.supabase
      .from('screening_template_versions')
      .select('version_number')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (maxVersion?.version_number || 0) + 1;
  }

  private generateVersionComparison(fromVersion: any, toVersion: any): VersionComparison {
    const changes: VersionChange[] = [];

    // Compare basic fields
    if (fromVersion.name !== toVersion.name) {
      changes.push({
        field: 'name',
        type: 'modified',
        oldValue: fromVersion.name,
        newValue: toVersion.name,
        description: `Name changed from "${fromVersion.name}" to "${toVersion.name}"`
      });
    }

    if (fromVersion.description !== toVersion.description) {
      changes.push({
        field: 'description',
        type: 'modified',
        oldValue: fromVersion.description,
        newValue: toVersion.description,
        description: 'Description updated'
      });
    }

    // Compare screening rules
    const oldRules = fromVersion.screening_rules || [];
    const newRules = toVersion.screening_rules || [];
    
    const addedRules = newRules.filter((rule: string) => !oldRules.includes(rule));
    const removedRules = oldRules.filter((rule: string) => !newRules.includes(rule));

    addedRules.forEach((ruleId: string) => {
      changes.push({
        field: 'screening_rules',
        type: 'added',
        newValue: ruleId,
        description: `Added screening rule: ${ruleId}`
      });
    });

    removedRules.forEach((ruleId: string) => {
      changes.push({
        field: 'screening_rules',
        type: 'removed',
        oldValue: ruleId,
        description: `Removed screening rule: ${ruleId}`
      });
    });

    // Compare scoring config
    if (JSON.stringify(fromVersion.scoring_config) !== JSON.stringify(toVersion.scoring_config)) {
      changes.push({
        field: 'scoring_config',
        type: 'modified',
        oldValue: fromVersion.scoring_config,
        newValue: toVersion.scoring_config,
        description: 'Scoring configuration updated'
      });
    }

    return {
      fromVersion: fromVersion.version,
      toVersion: toVersion.version,
      changes,
      summary: {
        totalChanges: changes.length,
        addedItems: changes.filter(c => c.type === 'added').length,
        removedItems: changes.filter(c => c.type === 'removed').length,
        modifiedItems: changes.filter(c => c.type === 'modified').length
      }
    };
  }

  private transformScreeningRule(rule: any): ScreeningRule {
    return {
      ...rule,
      created_at: new Date(rule.created_at),
      updated_at: new Date(rule.updated_at)
    };
  }

  private transformScreeningTemplate(template: any): ScreeningTemplate {
    return {
      ...template,
      created_at: new Date(template.created_at),
      updated_at: new Date(template.updated_at)
    };
  }

  private transformScreeningResult(result: any): EnhancedScreeningResult {
    return {
      ...result,
      calculation_metadata: {
        ...result.calculation_metadata,
        calculated_at: new Date(result.calculation_metadata.calculated_at)
      },
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at)
    };
  }

  private transformTemplateVersion(version: any): TemplateVersion {
    return {
      ...version,
      created_at: new Date(version.created_at),
      created_by_user: version.created_by_user,
      changes: version.changes?.map(this.transformTemplateChange) || []
    };
  }

  private transformTemplateChange(change: any): TemplateChange {
    return {
      ...change,
      created_at: new Date(change.created_at),
      changed_by_user: change.changed_by_user
    };
  }

  private transformConsistencyCheck(check: any): ConsistencyCheck {
    return {
      ...check,
      assessment_period_start: new Date(check.assessment_period_start),
      assessment_period_end: new Date(check.assessment_period_end),
      created_at: new Date(check.created_at),
      updated_at: check.updated_at ? new Date(check.updated_at) : undefined,
      resolved_at: check.resolved_at ? new Date(check.resolved_at) : undefined
    };
  }
}

// Export singleton instance
export const screeningService = new ScreeningService();