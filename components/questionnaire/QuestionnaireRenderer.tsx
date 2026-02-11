'use client';

/**
 * Questionnaire Renderer Component
 * 
 * Dynamic form renderer for questionnaires with conditional logic,
 * progress tracking, and real-time validation.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

import { 
  PublicQuestionnaire, 
  QuestionnaireQuestion,
  ResponseData,
  QuestionAnswer,
  ScreeningResult,
  QuestionnaireProgress
} from '@/lib/types/questionnaire';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FormField } from '@/components/ui/form-field';
import { QuestionRenderer } from './QuestionRenderer';
import { ScreeningResultDisplay } from './ScreeningResultDisplay';

interface QuestionnaireRendererProps {
  questionnaire: PublicQuestionnaire;
  sessionId: string;
  onComplete?: (result: ScreeningResult) => void;
  onProgress?: (progress: QuestionnaireProgress) => void;
  className?: string;
}

// Create dynamic schema based on questionnaire questions
const createQuestionnaireSchema = (questions: QuestionnaireQuestion[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};
  
  questions.forEach(question => {
    let fieldSchema: z.ZodTypeAny;
    
    switch (question.question_type) {
      case 'email':
        fieldSchema = z.string().email('Email inválido');
        break;
      case 'phone':
        fieldSchema = z.string().regex(
          /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/,
          'Telefone inválido'
        );
        break;
      case 'number':
        fieldSchema = z.number().or(z.string().transform(val => Number(val)));
        if (question.validation_rules?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(question.validation_rules.min);
        }
        if (question.validation_rules?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(question.validation_rules.max);
        }
        break;
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'single_choice':
        fieldSchema = z.string();
        break;
      case 'multiple_choice':
        fieldSchema = z.array(z.string());
        break;
      case 'scale':
        fieldSchema = z.number().or(z.string().transform(val => Number(val)));
        break;
      case 'date':
        fieldSchema = z.date().or(z.string().transform(val => new Date(val)));
        break;
      default:
        fieldSchema = z.string();
        if (question.validation_rules?.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(question.validation_rules.minLength);
        }
        if (question.validation_rules?.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(question.validation_rules.maxLength);
        }
        if (question.validation_rules?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            new RegExp(question.validation_rules.pattern),
            question.validation_rules.customMessage || 'Formato inválido'
          );
        }
    }
    
    // Make field optional if not required
    if (!question.is_required) {
      fieldSchema = fieldSchema.optional();
    }
    
    schemaFields[question.id] = fieldSchema;
  });
  
  return z.object(schemaFields);
};

export function QuestionnaireRenderer({
  questionnaire,
  sessionId,
  onComplete,
  onProgress,
  className
}: QuestionnaireRendererProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseData>({});
  const [visibleQuestions, setVisibleQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [progress, setProgress] = useState<QuestionnaireProgress | null>(null);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Create form schema
  const formSchema = createQuestionnaireSchema(questionnaire.questions);
  const methods = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {}
  });

  const { handleSubmit, watch, setValue, formState: { errors } } = methods;

  // Watch all form values
  const watchedValues = watch();

  // Update responses when form values change
  useEffect(() => {
    setResponses(watchedValues);
  }, [watchedValues]);

  // Calculate visible questions based on conditional logic
  const calculateVisibleQuestions = useCallback((currentResponses: ResponseData) => {
    return questionnaire.questions.filter(question => {
      if (!question.conditional_logic?.showIf && !question.conditional_logic?.hideIf) {
        return true; // No conditions, always visible
      }

      let shouldShow = true;

      // Check showIf conditions
      if (question.conditional_logic.showIf) {
        shouldShow = question.conditional_logic.showIf.some(condition => {
          const answer = currentResponses[condition.questionId];
          return evaluateCondition(answer, condition.operator, condition.value);
        });
      }

      // Check hideIf conditions
      if (question.conditional_logic.hideIf && shouldShow) {
        const shouldHide = question.conditional_logic.hideIf.some(condition => {
          const answer = currentResponses[condition.questionId];
          return evaluateCondition(answer, condition.operator, condition.value);
        });
        shouldShow = !shouldHide;
      }

      return shouldShow;
    });
  }, [questionnaire.questions]);

  // Evaluate conditional logic
  const evaluateCondition = (answer: QuestionAnswer | undefined, operator: string, value: any): boolean => {
    if (answer === undefined || answer === null) return false;

    switch (operator) {
      case 'equals':
        return answer === value;
      case 'not_equals':
        return answer !== value;
      case 'contains':
        return Array.isArray(answer) ? answer.includes(value) : String(answer).includes(String(value));
      case 'not_contains':
        return Array.isArray(answer) ? !answer.includes(value) : !String(answer).includes(String(value));
      case 'greater_than':
        return Number(answer) > Number(value);
      case 'less_than':
        return Number(answer) < Number(value);
      default:
        return false;
    }
  };

  // Update visible questions when responses change
  useEffect(() => {
    const visible = calculateVisibleQuestions(responses);
    setVisibleQuestions(visible);
    
    // Adjust current question index if current question is no longer visible
    if (visible.length > 0 && currentQuestionIndex >= visible.length) {
      setCurrentQuestionIndex(Math.max(0, visible.length - 1));
    }
  }, [responses, calculateVisibleQuestions, currentQuestionIndex]);

  // Calculate progress
  useEffect(() => {
    if (visibleQuestions.length === 0) return;

    const totalQuestions = visibleQuestions.length;
    const requiredQuestions = visibleQuestions.filter(q => q.is_required).length;
    
    const answeredQuestions = visibleQuestions.filter(q => {
      const answer = responses[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    
    const answeredRequiredQuestions = visibleQuestions.filter(q => {
      if (!q.is_required) return false;
      const answer = responses[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    
    const percentComplete = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const canSubmit = answeredRequiredQuestions === requiredQuestions;
    
    // Simple score calculation (would be more sophisticated in real implementation)
    const currentScore = visibleQuestions.reduce((score, question) => {
      const answer = responses[question.id];
      if (answer !== undefined && answer !== null && answer !== '') {
        return score + question.weight;
      }
      return score;
    }, 0);

    const newProgress: QuestionnaireProgress = {
      totalQuestions,
      answeredQuestions,
      requiredQuestions,
      answeredRequiredQuestions,
      percentComplete: Math.round(percentComplete),
      canSubmit,
      currentScore
    };

    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [visibleQuestions, responses, onProgress]);

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit handler
  const onSubmit = async (data: any) => {
    if (!progress?.canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/questionnaires/${questionnaire.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          responses: data,
          respondentInfo: {
            email: data.email,
            name: data.name,
            phone: data.phone
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      const result = await response.json();
      
      if (result.success) {
        setScreeningResult(result.data.screeningResult);
        setIsCompleted(true);
        onComplete?.(result.data.screeningResult);
      } else {
        throw new Error(result.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted && screeningResult) {
    return (
      <div className={className}>
        <ScreeningResultDisplay 
          result={screeningResult}
          questionnaireName={questionnaire.name}
        />
      </div>
    );
  }

  if (visibleQuestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-neutral-500">
            Carregando questionário...
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

  return (
    <div className={className}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>{questionnaire.name}</span>
                  <span>
                    {currentQuestionIndex + 1} de {visibleQuestions.length}
                  </span>
                </div>
                <Progress 
                  value={progress?.percentComplete || 0} 
                  className="h-2"
                />
                <div className="text-xs text-neutral-500 text-center">
                  {progress?.percentComplete || 0}% concluído
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Pergunta {currentQuestionIndex + 1}
                {currentQuestion.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormField
                    label={currentQuestion.question_text}
                    required={currentQuestion.is_required}
                    error={errors[currentQuestion.id]?.message}
                    htmlFor={currentQuestion.id}
                  >
                    <QuestionRenderer
                      question={currentQuestion}
                      value={responses[currentQuestion.id]}
                      onChange={(value) => setValue(currentQuestion.id, value)}
                      error={errors[currentQuestion.id]?.message}
                    />
                  </FormField>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <div className="text-sm text-neutral-500">
              {progress?.answeredRequiredQuestions || 0} de {progress?.requiredQuestions || 0} obrigatórias
            </div>

            {isLastQuestion ? (
              <Button
                type="submit"
                variant="primary"
                disabled={!progress?.canSubmit || isSubmitting}
                loading={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Finalizar
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}