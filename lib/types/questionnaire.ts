/**
 * Questionnaire System Types and Schemas
 * 
 * TypeScript types and Zod validation schemas for the dynamic questionnaire system.
 * Supports public marketing funnels, lead qualification, and project screening.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import { z } from 'zod';

// Question Types Enum
export const QUESTION_TYPES = [
  'text',
  'textarea', 
  'number',
  'email',
  'phone',
  'url',
  'single_choice',
  'multiple_choice',
  'boolean',
  'scale',
  'date',
  'time',
  'datetime',
  'file_upload'
] as const;

export type QuestionType = typeof QUESTION_TYPES[number];

// Response Status Enum
export const RESPONSE_STATUSES = ['in_progress', 'completed', 'abandoned'] as const;
export type ResponseStatus = typeof RESPONSE_STATUSES[number];

// Question Option Schema
export const questionOptionSchema = z.union([
  z.string(), // Simple string option
  z.object({
    value: z.string(),
    label: z.string(),
    score: z.number().optional(), // For weighted scoring
    metadata: z.record(z.any()).optional()
  })
]);

// Scale Question Configuration Schema
export const scaleConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().optional().default(1),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional()
});

// Conditional Logic Schema
export const conditionalLogicSchema = z.object({
  showIf: z.array(z.object({
    questionId: z.string().uuid(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  })).optional(),
  hideIf: z.array(z.object({
    questionId: z.string().uuid(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
  })).optional()
});

// Validation Rules Schema
export const validationRulesSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  customMessage: z.string().optional()
});

// Scoring Rule Schema
export const scoringRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  conditions: z.array(z.object({
    questionId: z.string().uuid(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'between']),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
    weight: z.number().default(1)
  })),
  score: z.number(),
  recommendation: z.string().optional()
});

// Questionnaire Template Schema
export const questionnaireTemplateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().optional(), // Optional for public templates
  name: z.string().min(1, 'Nome do questionário é obrigatório').max(200),
  description: z.string().max(1000).optional(),
  version: z.string().regex(/^\d+\.\d+$/, 'Versão deve estar no formato X.Y'),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
  scoring_rules: z.array(scoringRuleSchema).default([]),
  metadata: z.record(z.any()).default({}),
  created_at: z.date(),
  updated_at: z.date()
});

// Questionnaire Question Schema
export const questionnaireQuestionSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  question_type: z.enum(QUESTION_TYPES),
  question_text: z.string().min(1, 'Texto da pergunta é obrigatório').max(1000),
  question_options: z.union([
    z.array(questionOptionSchema), // For choice questions
    scaleConfigSchema, // For scale questions
    z.record(z.any()) // For other configurations
  ]).default([]),
  weight: z.number().min(0).default(1.0),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  conditional_logic: conditionalLogicSchema.default({}),
  validation_rules: validationRulesSchema.default({}),
  metadata: z.record(z.any()).default({}),
  created_at: z.date()
});

// Questionnaire Response Schema
export const questionnaireResponseSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  session_id: z.string().min(1, 'Session ID é obrigatório'),
  respondent_email: z.string().email('Email inválido').optional(),
  respondent_name: z.string().max(200).optional(),
  respondent_phone: z.string().max(20).optional(),
  responses: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.date()
  ])).default({}),
  calculated_score: z.number().default(0),
  screening_result: z.record(z.any()).default({}),
  status: z.enum(RESPONSE_STATUSES).default('in_progress'),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  started_at: z.date(),
  completed_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Input Schemas (for creating/updating)
export const createQuestionnaireTemplateSchema = questionnaireTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const updateQuestionnaireTemplateSchema = createQuestionnaireTemplateSchema.partial();

export const createQuestionnaireQuestionSchema = questionnaireQuestionSchema.omit({
  id: true,
  created_at: true
});

export const updateQuestionnaireQuestionSchema = createQuestionnaireQuestionSchema.partial().omit({
  template_id: true
});

export const createQuestionnaireResponseSchema = questionnaireResponseSchema.omit({
  id: true,
  calculated_score: true,
  screening_result: true,
  created_at: true,
  updated_at: true,
  started_at: true,
  completed_at: true
});

export const updateQuestionnaireResponseSchema = z.object({
  responses: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.date()
  ])).optional(),
  respondent_email: z.string().email('Email inválido').optional(),
  respondent_name: z.string().max(200).optional(),
  respondent_phone: z.string().max(20).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

// Answer Validation Schema
export const answerValidationSchema = z.object({
  questionId: z.string().uuid(),
  questionType: z.enum(QUESTION_TYPES),
  answer: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.date()
  ]),
  validationRules: validationRulesSchema.optional()
});

// Questionnaire Progress Schema
export const questionnaireProgressSchema = z.object({
  totalQuestions: z.number().int().min(0),
  answeredQuestions: z.number().int().min(0),
  requiredQuestions: z.number().int().min(0),
  answeredRequiredQuestions: z.number().int().min(0),
  percentComplete: z.number().min(0).max(100),
  canSubmit: z.boolean(),
  currentScore: z.number().min(0)
});

// Screening Result Schema
export const screeningResultSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number().min(0),
  percentage: z.number().min(0).max(100),
  feasibilityRating: z.enum(['high', 'medium', 'low', 'not_feasible']),
  recommendations: z.array(z.string()),
  riskFactors: z.array(z.string()),
  nextSteps: z.array(z.string()),
  estimatedSystemSize: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    recommended: z.number().optional(),
    unit: z.string().default('kWp')
  }).optional(),
  estimatedInvestment: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('BRL')
  }).optional(),
  qualificationLevel: z.enum(['qualified', 'partially_qualified', 'not_qualified']),
  followUpPriority: z.enum(['high', 'medium', 'low']),
  metadata: z.record(z.any()).default({})
});

// Public API Schemas
export const publicQuestionnaireSchema = questionnaireTemplateSchema.omit({
  tenant_id: true,
  created_at: true,
  updated_at: true
}).extend({
  questions: z.array(questionnaireQuestionSchema.omit({
    created_at: true
  }))
});

export const publicResponseSubmissionSchema = z.object({
  templateId: z.string().uuid(),
  sessionId: z.string().min(1),
  responses: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string())
  ])),
  respondentInfo: z.object({
    email: z.string().email().optional(),
    name: z.string().max(200).optional(),
    phone: z.string().max(20).optional()
  }).optional(),
  utmParams: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional()
  }).optional()
});

// Type exports
export type QuestionnaireTemplate = z.infer<typeof questionnaireTemplateSchema>;
export type QuestionnaireQuestion = z.infer<typeof questionnaireQuestionSchema>;
export type QuestionnaireResponse = z.infer<typeof questionnaireResponseSchema>;
export type CreateQuestionnaireTemplate = z.infer<typeof createQuestionnaireTemplateSchema>;
export type UpdateQuestionnaireTemplate = z.infer<typeof updateQuestionnaireTemplateSchema>;
export type CreateQuestionnaireQuestion = z.infer<typeof createQuestionnaireQuestionSchema>;
export type UpdateQuestionnaireQuestion = z.infer<typeof updateQuestionnaireQuestionSchema>;
export type CreateQuestionnaireResponse = z.infer<typeof createQuestionnaireResponseSchema>;
export type UpdateQuestionnaireResponse = z.infer<typeof updateQuestionnaireResponseSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type ScaleConfig = z.infer<typeof scaleConfigSchema>;
export type ConditionalLogic = z.infer<typeof conditionalLogicSchema>;
export type ValidationRules = z.infer<typeof validationRulesSchema>;
export type ScoringRule = z.infer<typeof scoringRuleSchema>;
export type AnswerValidation = z.infer<typeof answerValidationSchema>;
export type QuestionnaireProgress = z.infer<typeof questionnaireProgressSchema>;
export type ScreeningResult = z.infer<typeof screeningResultSchema>;
export type PublicQuestionnaire = z.infer<typeof publicQuestionnaireSchema>;
export type PublicResponseSubmission = z.infer<typeof publicResponseSubmissionSchema>;

// Utility types
export type QuestionAnswer = string | number | boolean | string[] | Date;
export type ResponseData = Record<string, QuestionAnswer>;

// Default questionnaire template for solar screening
export const DEFAULT_SOLAR_SCREENING_TEMPLATE: Omit<CreateQuestionnaireTemplate, 'tenant_id'> = {
  name: 'Avaliação de Viabilidade Solar',
  description: 'Questionário para avaliar a viabilidade de instalação de sistema fotovoltaico',
  version: '1.0',
  is_active: true,
  is_public: true,
  scoring_rules: [
    {
      id: 'high_consumption',
      name: 'Alto Consumo',
      description: 'Cliente com alto consumo de energia',
      conditions: [
        {
          questionId: '', // Will be filled when questions are created
          operator: 'greater_than',
          value: 500,
          weight: 2
        }
      ],
      score: 20,
      recommendation: 'Cliente ideal para sistema de grande porte'
    },
    {
      id: 'good_roof_condition',
      name: 'Telhado em Boas Condições',
      description: 'Telhado adequado para instalação',
      conditions: [
        {
          questionId: '', // Will be filled when questions are created
          operator: 'equals',
          value: 'excellent',
          weight: 1.5
        }
      ],
      score: 15,
      recommendation: 'Instalação sem necessidade de reformas'
    }
  ],
  metadata: {
    category: 'solar_screening',
    target_audience: 'residential',
    estimated_duration: '5-10 minutes'
  }
};

// Default questions for solar screening
export const DEFAULT_SOLAR_SCREENING_QUESTIONS: Omit<CreateQuestionnaireQuestion, 'template_id'>[] = [
  {
    question_type: 'number',
    question_text: 'Qual é o valor médio da sua conta de energia elétrica mensal?',
    weight: 2.0,
    is_required: true,
    sort_order: 1,
    validation_rules: {
      required: true,
      min: 0,
      customMessage: 'Por favor, informe um valor válido para sua conta de energia'
    },
    metadata: {
      category: 'consumption',
      unit: 'BRL'
    }
  },
  {
    question_type: 'single_choice',
    question_text: 'Qual é o tipo da sua residência?',
    question_options: [
      { value: 'house', label: 'Casa', score: 2 },
      { value: 'apartment', label: 'Apartamento', score: 1 },
      { value: 'commercial', label: 'Estabelecimento comercial', score: 2 },
      { value: 'rural', label: 'Propriedade rural', score: 3 }
    ],
    weight: 1.5,
    is_required: true,
    sort_order: 2,
    metadata: {
      category: 'property_type'
    }
  },
  {
    question_type: 'single_choice',
    question_text: 'Como você avalia as condições do seu telhado?',
    question_options: [
      { value: 'excellent', label: 'Excelente - novo ou reformado recentemente', score: 3 },
      { value: 'good', label: 'Bom - em boas condições', score: 2 },
      { value: 'fair', label: 'Regular - precisa de pequenos reparos', score: 1 },
      { value: 'poor', label: 'Ruim - precisa de reforma', score: 0 }
    ],
    weight: 2.0,
    is_required: true,
    sort_order: 3,
    metadata: {
      category: 'roof_condition'
    }
  },
  {
    question_type: 'single_choice',
    question_text: 'Qual é a orientação principal do seu telhado?',
    question_options: [
      { value: 'north', label: 'Norte', score: 3 },
      { value: 'northeast', label: 'Nordeste', score: 2.5 },
      { value: 'northwest', label: 'Noroeste', score: 2.5 },
      { value: 'east', label: 'Leste', score: 2 },
      { value: 'west', label: 'Oeste', score: 2 },
      { value: 'south', label: 'Sul', score: 1 },
      { value: 'unknown', label: 'Não sei', score: 1.5 }
    ],
    weight: 1.5,
    is_required: true,
    sort_order: 4,
    metadata: {
      category: 'roof_orientation'
    }
  },
  {
    question_type: 'boolean',
    question_text: 'Há sombreamento significativo no seu telhado (árvores, prédios, etc.)?',
    weight: 1.0,
    is_required: true,
    sort_order: 5,
    metadata: {
      category: 'shading',
      scoring: 'inverted' // false = better score
    }
  },
  {
    question_type: 'scale',
    question_text: 'Em uma escala de 1 a 10, qual é seu interesse em energia solar?',
    question_options: {
      min: 1,
      max: 10,
      step: 1,
      minLabel: 'Pouco interessado',
      maxLabel: 'Muito interessado'
    },
    weight: 1.0,
    is_required: true,
    sort_order: 6,
    metadata: {
      category: 'interest_level'
    }
  },
  {
    question_type: 'email',
    question_text: 'Deixe seu e-mail para receber o resultado da avaliação:',
    weight: 0,
    is_required: false,
    sort_order: 7,
    validation_rules: {
      pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$',
      customMessage: 'Por favor, digite um e-mail válido'
    },
    metadata: {
      category: 'lead_capture'
    }
  },
  {
    question_type: 'text',
    question_text: 'Nome (opcional):',
    weight: 0,
    is_required: false,
    sort_order: 8,
    validation_rules: {
      maxLength: 200
    },
    metadata: {
      category: 'lead_capture'
    }
  },
  {
    question_type: 'phone',
    question_text: 'Telefone para contato (opcional):',
    weight: 0,
    is_required: false,
    sort_order: 9,
    validation_rules: {
      pattern: '^(\\+55\\s?)?(\\(?\\d{2}\\)?\\s?)?\\d{4,5}-?\\d{4}$',
      customMessage: 'Digite um telefone válido'
    },
    metadata: {
      category: 'lead_capture'
    }
  }
];