'use client';

/**
 * Screening Result Display Component
 * 
 * Displays the results of questionnaire screening with recommendations,
 * feasibility rating, and next steps.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  Zap, 
  DollarSign,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

import { ScreeningResult } from '@/lib/types/questionnaire';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScreeningResultDisplayProps {
  result: ScreeningResult;
  questionnaireName: string;
  onContactRequest?: () => void;
  onNewQuote?: () => void;
  className?: string;
}

export function ScreeningResultDisplay({
  result,
  questionnaireName,
  onContactRequest,
  onNewQuote,
  className
}: ScreeningResultDisplayProps) {
  // Get feasibility rating details
  const getFeasibilityDetails = (rating: string) => {
    switch (rating) {
      case 'high':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Alta Viabilidade',
          description: 'Excelente candidato para energia solar!'
        };
      case 'medium':
        return {
          icon: TrendingUp,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Média Viabilidade',
          description: 'Boas condições para energia solar'
        };
      case 'low':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Baixa Viabilidade',
          description: 'Algumas limitações identificadas'
        };
      case 'not_feasible':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Não Viável',
          description: 'Condições não adequadas no momento'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-neutral-600',
          bgColor: 'bg-neutral-50',
          borderColor: 'border-neutral-200',
          title: 'Avaliação Pendente',
          description: 'Análise em andamento'
        };
    }
  };

  // Get qualification badge variant
  const getQualificationVariant = (level: string) => {
    switch (level) {
      case 'qualified':
        return 'default'; // Green
      case 'partially_qualified':
        return 'secondary'; // Blue
      case 'not_qualified':
        return 'outline'; // Gray
      default:
        return 'outline';
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'; // Red
      case 'medium':
        return 'default'; // Green
      case 'low':
        return 'secondary'; // Blue
      default:
        return 'outline';
    }
  };

  const feasibilityDetails = getFeasibilityDetails(result.feasibilityRating);
  const FeasibilityIcon = feasibilityDetails.icon;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={cn('border-2', feasibilityDetails.borderColor, feasibilityDetails.bgColor)}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className={cn(
                'p-4 rounded-full',
                feasibilityDetails.bgColor,
                'ring-4 ring-white shadow-lg'
              )}>
                <FeasibilityIcon className={cn('w-8 h-8', feasibilityDetails.color)} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {feasibilityDetails.title}
            </CardTitle>
            <p className="text-neutral-600">
              {feasibilityDetails.description}
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              {/* Score */}
              <div>
                <div className="text-3xl font-bold text-neutral-900 mb-2">
                  {result.percentage}%
                </div>
                <Progress value={result.percentage} className="h-3 mb-2" />
                <p className="text-sm text-neutral-600">
                  Pontuação: {result.score.toFixed(1)} de {result.maxScore.toFixed(1)}
                </p>
              </div>

              {/* Badges */}
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant={getQualificationVariant(result.qualificationLevel)}>
                  {result.qualificationLevel === 'qualified' && 'Qualificado'}
                  {result.qualificationLevel === 'partially_qualified' && 'Parcialmente Qualificado'}
                  {result.qualificationLevel === 'not_qualified' && 'Não Qualificado'}
                </Badge>
                <Badge variant={getPriorityVariant(result.followUpPriority)}>
                  Prioridade {result.followUpPriority === 'high' ? 'Alta' : 
                             result.followUpPriority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Estimates */}
      {(result.estimatedSystemSize || result.estimatedInvestment) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {result.estimatedSystemSize && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-solar-500" />
                    Sistema Recomendado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-solar-600 mb-1">
                    {result.estimatedSystemSize.recommended} {result.estimatedSystemSize.unit}
                  </div>
                  {(result.estimatedSystemSize.min && result.estimatedSystemSize.max) && (
                    <p className="text-sm text-neutral-600">
                      Faixa: {result.estimatedSystemSize.min} - {result.estimatedSystemSize.max} {result.estimatedSystemSize.unit}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {result.estimatedInvestment && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Investimento Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {result.estimatedInvestment.min && result.estimatedInvestment.max ? (
                      <>
                        R$ {result.estimatedInvestment.min.toLocaleString()} - 
                        R$ {result.estimatedInvestment.max.toLocaleString()}
                      </>
                    ) : (
                      'Sob consulta'
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    Valores aproximados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Risk Factors */}
      {result.riskFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Pontos de Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.riskFactors.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Next Steps */}
      {result.nextSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-solar-50 to-energy-50 border-solar-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-4">
              Interessado em energia solar?
            </h3>
            <p className="text-neutral-600 mb-6">
              Nossa equipe pode ajudar você a dar o próximo passo rumo à independência energética.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={onContactRequest}
                className="flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Falar com Especialista
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={onNewQuote}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar Visita Técnica
              </Button>
            </div>
            <div className="mt-4 text-sm text-neutral-500">
              <p>Atendimento gratuito • Sem compromisso</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center text-xs text-neutral-400"
      >
        <p>
          Resultado baseado em {questionnaireName} • 
          Calculado em {new Date().toLocaleDateString('pt-BR')}
        </p>
      </motion.div>
    </div>
  );
}