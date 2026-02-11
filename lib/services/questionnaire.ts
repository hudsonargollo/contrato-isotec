/**
 * Questionnaire Service
 * 
 * Database service functions for the dynamic questionnaire system.
 * Handles CRUD operations, scoring, and public API access.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import { createClient } from '@/lib/supabase/client';
import { 
  QuestionnaireTemplate,
  QuestionnaireQuestion,
  QuestionnaireResponse,
  CreateQuestionnaireTemplate,
  UpdateQuestionnaireTemplate,
  CreateQuestionnaireQuestion,
  UpdateQuestionnaireQuestion,
  CreateQuestionnaireResponse,
  UpdateQuestionnaireResponse,
  PublicQuestionnaire,
  PublicResponseSubmission,
  ScreeningResult,
  QuestionnaireProgress,
  ResponseData,
  QuestionAnswer
} from '@/lib/types/questionnaire';

export class QuestionnaireService {
  private supabase = createClient();

  // Template Management
  async getTemplates(tenantId?: string): Promise<QuestionnaireTemplate[]> {
    let query = this.supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
    
    return data || [];
  }

  async getPublicTemplates(): Promise<QuestionnaireTemplate[]> {
    const { data, error } = await this.supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch public templates: ${error.message}`);
    }
    
    return data || [];
  }

  async getTemplate(id: string): Promise<QuestionnaireTemplate | null> {
    const { data, error } = await this.supabase
      .from('questionnaire_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch template: ${error.message}`);
    }
    
    return data;
  }

  async createTemplate(template: CreateQuestionnaireTemplate): Promise<QuestionnaireTemplate> {
    const { data, error } = await this.supabase
      .from('questionnaire_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
    
    return data;
  }

  async updateTemplate(id: string, updates: UpdateQuestionnaireTemplate): Promise<QuestionnaireTemplate> {
    const { data, error } = await this.supabase
      .from('questionnaire_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
    
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('questionnaire_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  // Question Management
  async getQuestions(templateId: string): Promise<QuestionnaireQuestion[]> {
    const { data, error } = await this.supabase
      .from('questionnaire_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
    
    return data || [];
  }

  async createQuestion(question: CreateQuestionnaireQuestion): Promise<QuestionnaireQuestion> {
    const { data, error } = await this.supabase
      .from('questionnaire_questions')
      .insert(question)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }
    
    return data;
  }

  async updateQuestion(id: string, updates: UpdateQuestionnaireQuestion): Promise<QuestionnaireQuestion> {
    const { data, error } = await this.supabase
      .from('questionnaire_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update question: ${error.message}`);
    }
    
    return data;
  }

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('questionnaire_questions')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }

  async reorderQuestions(templateId: string, questionIds: string[]): Promise<void> {
    const updates = questionIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    for (const update of updates) {
      await this.updateQuestion(update.id, { sort_order: update.sort_order });
    }
  }

  // Public API - Get questionnaire with questions
  async getPublicQuestionnaire(templateId: string): Promise<PublicQuestionnaire | null> {
    // Get template
    const template = await this.getTemplate(templateId);
    if (!template || !template.is_active || !template.is_public) {
      return null;
    }

    // Get questions
    const questions = await this.getQuestions(templateId);

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      version: template.version,
      is_active: template.is_active,
      is_public: template.is_public,
      scoring_rules: template.scoring_rules,
      metadata: template.metadata,
      questions: questions.map(q => ({
        id: q.id,
        template_id: q.template_id,
        question_type: q.question_type,
        question_text: q.question_text,
        question_options: q.question_options,
        weight: q.weight,
        is_required: q.is_required,
        sort_order: q.sort_order,
        conditional_logic: q.conditional_logic,
        validation_rules: q.validation_rules,
        metadata: q.metadata
      }))
    };
  }

  // Response Management
  async createResponse(response: CreateQuestionnaireResponse): Promise<QuestionnaireResponse> {
    // Set session context for RLS
    await this.supabase.rpc('set_config', {
      setting_name: 'app.session_id',
      setting_value: response.session_id,
      is_local: true
    });

    const { data, error } = await this.supabase
      .from('questionnaire_responses')
      .insert({
        ...response,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create response: ${error.message}`);
    }
    
    return data;
  }

  async updateResponse(id: string, sessionId: string, updates: UpdateQuestionnaireResponse): Promise<QuestionnaireResponse> {
    // Set session context for RLS
    await this.supabase.rpc('set_config', {
      setting_name: 'app.session_id',
      setting_value: sessionId,
      is_local: true
    });

    const { data, error } = await this.supabase
      .from('questionnaire_responses')
      .update(updates)
      .eq('id', id)
      .eq('session_id', sessionId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update response: ${error.message}`);
    }
    
    return data;
  }

  async getResponse(id: string, sessionId: string): Promise<QuestionnaireResponse | null> {
    // Set session context for RLS
    await this.supabase.rpc('set_config', {
      setting_name: 'app.session_id',
      setting_value: sessionId,
      is_local: true
    });

    const { data, error } = await this.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('id', id)
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch response: ${error.message}`);
    }
    
    return data;
  }

  async getResponseBySession(templateId: string, sessionId: string): Promise<QuestionnaireResponse | null> {
    // Set session context for RLS
    await this.supabase.rpc('set_config', {
      setting_name: 'app.session_id',
      setting_value: sessionId,
      is_local: true
    });

    const { data, error } = await this.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('template_id', templateId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch response: ${error.message}`);
    }
    
    return data;
  }

  // Public API - Submit response
  async submitPublicResponse(submission: PublicResponseSubmission): Promise<{
    response: QuestionnaireResponse;
    screeningResult: ScreeningResult;
  }> {
    // Check if response already exists for this session
    let response = await this.getResponseBySession(submission.templateId, submission.sessionId);
    
    if (response) {
      // Update existing response
      response = await this.updateResponse(response.id, submission.sessionId, {
        responses: submission.responses,
        respondent_email: submission.respondentInfo?.email,
        respondent_name: submission.respondentInfo?.name,
        respondent_phone: submission.respondentInfo?.phone,
        utm_source: submission.utmParams?.source,
        utm_medium: submission.utmParams?.medium,
        utm_campaign: submission.utmParams?.campaign
      });
    } else {
      // Create new response
      response = await this.createResponse({
        template_id: submission.templateId,
        session_id: submission.sessionId,
        responses: submission.responses,
        respondent_email: submission.respondentInfo?.email,
        respondent_name: submission.respondentInfo?.name,
        respondent_phone: submission.respondentInfo?.phone,
        utm_source: submission.utmParams?.source,
        utm_medium: submission.utmParams?.medium,
        utm_campaign: submission.utmParams?.campaign,
        status: 'in_progress'
      });
    }

    // Generate screening result
    const screeningResult = await this.generateScreeningResult(response);

    return { response, screeningResult };
  }

  // Progress Calculation
  async calculateProgress(templateId: string, responses: ResponseData): Promise<QuestionnaireProgress> {
    const questions = await this.getQuestions(templateId);
    
    const totalQuestions = questions.length;
    const requiredQuestions = questions.filter(q => q.is_required).length;
    
    const answeredQuestions = questions.filter(q => {
      const answer = responses[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    
    const answeredRequiredQuestions = questions.filter(q => {
      if (!q.is_required) return false;
      const answer = responses[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    
    const percentComplete = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const canSubmit = answeredRequiredQuestions === requiredQuestions;
    
    // Calculate current score
    const currentScore = await this.calculateScore(templateId, responses);
    
    return {
      totalQuestions,
      answeredQuestions,
      requiredQuestions,
      answeredRequiredQuestions,
      percentComplete: Math.round(percentComplete),
      canSubmit,
      currentScore
    };
  }

  // Scoring
  async calculateScore(templateId: string, responses: ResponseData): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('calculate_questionnaire_score', {
        template_id_param: templateId,
        responses_param: responses
      });
    
    if (error) {
      console.error('Failed to calculate score:', error);
      return 0;
    }
    
    return data || 0;
  }

  // Screening Result Generation
  async generateScreeningResult(response: QuestionnaireResponse): Promise<ScreeningResult> {
    const template = await this.getTemplate(response.template_id);
    const questions = await this.getQuestions(response.template_id);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const score = response.calculated_score;
    const maxScore = questions.reduce((sum, q) => sum + q.weight, 0);
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Determine feasibility rating
    let feasibilityRating: 'high' | 'medium' | 'low' | 'not_feasible';
    if (percentage >= 80) feasibilityRating = 'high';
    else if (percentage >= 60) feasibilityRating = 'medium';
    else if (percentage >= 40) feasibilityRating = 'low';
    else feasibilityRating = 'not_feasible';
    
    // Generate recommendations based on responses
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    const nextSteps: string[] = [];
    
    // Analyze specific responses for solar screening
    const monthlyBill = response.responses['monthly_bill'] as number;
    const roofCondition = response.responses['roof_condition'] as string;
    const propertyType = response.responses['property_type'] as string;
    const shading = response.responses['shading'] as boolean;
    
    if (monthlyBill) {
      if (monthlyBill > 500) {
        recommendations.push('Seu alto consumo de energia torna a energia solar muito vantajosa');
        const estimatedSystemSize = Math.round((monthlyBill * 12) / 1200); // Rough calculation
        nextSteps.push(`Sistema recomendado: ${estimatedSystemSize} kWp`);
      } else if (monthlyBill > 200) {
        recommendations.push('Energia solar pode gerar economia significativa na sua conta');
      } else {
        recommendations.push('Energia solar ainda pode ser vantajosa, mas com retorno mais longo');
      }
    }
    
    if (roofCondition === 'poor') {
      riskFactors.push('Telhado precisa de reforma antes da instalação');
      nextSteps.push('Avaliar custos de reforma do telhado');
    } else if (roofCondition === 'excellent') {
      recommendations.push('Telhado em excelentes condições para instalação');
    }
    
    if (shading) {
      riskFactors.push('Sombreamento pode reduzir a eficiência do sistema');
      nextSteps.push('Análise detalhada de sombreamento necessária');
    }
    
    if (propertyType === 'apartment') {
      riskFactors.push('Apartamentos têm limitações para instalação própria');
      nextSteps.push('Considerar energia solar compartilhada ou por assinatura');
    }
    
    // Determine qualification level
    let qualificationLevel: 'qualified' | 'partially_qualified' | 'not_qualified';
    if (feasibilityRating === 'high') qualificationLevel = 'qualified';
    else if (feasibilityRating === 'medium' || feasibilityRating === 'low') qualificationLevel = 'partially_qualified';
    else qualificationLevel = 'not_qualified';
    
    // Determine follow-up priority
    let followUpPriority: 'high' | 'medium' | 'low';
    if (qualificationLevel === 'qualified' && monthlyBill > 300) followUpPriority = 'high';
    else if (qualificationLevel === 'qualified' || qualificationLevel === 'partially_qualified') followUpPriority = 'medium';
    else followUpPriority = 'low';
    
    // Add default next steps
    if (qualificationLevel === 'qualified') {
      nextSteps.push('Agendar visita técnica gratuita');
      nextSteps.push('Solicitar proposta personalizada');
    } else if (qualificationLevel === 'partially_qualified') {
      nextSteps.push('Análise mais detalhada necessária');
      nextSteps.push('Consultar especialista');
    }
    
    const screeningResult: ScreeningResult = {
      score,
      maxScore,
      percentage: Math.round(percentage),
      feasibilityRating,
      recommendations,
      riskFactors,
      nextSteps,
      estimatedSystemSize: monthlyBill ? {
        recommended: Math.round((monthlyBill * 12) / 1200),
        unit: 'kWp'
      } : undefined,
      estimatedInvestment: monthlyBill ? {
        min: Math.round((monthlyBill * 12) / 1200) * 3000,
        max: Math.round((monthlyBill * 12) / 1200) * 5000,
        currency: 'BRL'
      } : undefined,
      qualificationLevel,
      followUpPriority,
      metadata: {
        templateVersion: template.version,
        calculatedAt: new Date().toISOString(),
        responseId: response.id
      }
    };
    
    // Update response with screening result
    await this.updateResponse(response.id, response.session_id, {
      responses: {
        ...response.responses,
        screening_result: screeningResult
      }
    });
    
    return screeningResult;
  }

  // Admin Analytics
  async getResponseAnalytics(templateId: string, tenantId?: string): Promise<{
    totalResponses: number;
    completedResponses: number;
    averageScore: number;
    completionRate: number;
    qualificationBreakdown: Record<string, number>;
    responsesByDay: Array<{ date: string; count: number }>;
  }> {
    let query = this.supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('template_id', templateId);

    if (tenantId) {
      // Join with template to filter by tenant
      query = this.supabase
        .from('questionnaire_responses')
        .select(`
          *,
          questionnaire_templates!inner(tenant_id)
        `)
        .eq('template_id', templateId)
        .eq('questionnaire_templates.tenant_id', tenantId);
    }

    const { data: responses, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch response analytics: ${error.message}`);
    }
    
    const totalResponses = responses?.length || 0;
    const completedResponses = responses?.filter(r => r.status === 'completed').length || 0;
    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    
    const scores = responses?.map(r => r.calculated_score).filter(s => s > 0) || [];
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
    // Qualification breakdown (would need to calculate from screening results)
    const qualificationBreakdown = {
      qualified: 0,
      partially_qualified: 0,
      not_qualified: 0
    };
    
    // Responses by day (last 30 days)
    const responsesByDay: Array<{ date: string; count: number }> = [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    for (const date of last30Days) {
      const count = responses?.filter(r => 
        r.created_at.startsWith(date)
      ).length || 0;
      responsesByDay.push({ date, count });
    }
    
    return {
      totalResponses,
      completedResponses,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate),
      qualificationBreakdown,
      responsesByDay
    };
  }

  // Utility Functions
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateAnswer(questionType: string, answer: QuestionAnswer, validationRules?: any): boolean {
    if (!answer && validationRules?.required) {
      return false;
    }
    
    switch (questionType) {
      case 'email':
        return typeof answer === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);
      case 'phone':
        return typeof answer === 'string' && /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/.test(answer);
      case 'number':
        const num = Number(answer);
        if (isNaN(num)) return false;
        if (validationRules?.min !== undefined && num < validationRules.min) return false;
        if (validationRules?.max !== undefined && num > validationRules.max) return false;
        return true;
      case 'text':
      case 'textarea':
        if (typeof answer !== 'string') return false;
        if (validationRules?.minLength && answer.length < validationRules.minLength) return false;
        if (validationRules?.maxLength && answer.length > validationRules.maxLength) return false;
        if (validationRules?.pattern && !new RegExp(validationRules.pattern).test(answer)) return false;
        return true;
      default:
        return true;
    }
  }
}

// Export singleton instance
export const questionnaireService = new QuestionnaireService();