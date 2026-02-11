/**
 * Screening Results Component
 * Displays detailed screening assessment results
 * Requirements: 3.2, 3.3 - Project screening results display
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import type { EnhancedScreeningResult } from '@/lib/types/screening';

interface ScreeningResultsProps {
  result: EnhancedScreeningResult;
  showDetails?: boolean;
}

export function ScreeningResults({ result, showDetails = true }: ScreeningResultsProps) {
  const getFeasibilityIcon = (rating: string) => {
    switch (rating) {
      case 'high':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'not_feasible':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFeasibilityColor = (rating: string) => {
    switch (rating) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-orange-500';
      case 'not_feasible':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getQualificationColor = (level: string) => {
    switch (level) {
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'partially_qualified':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_qualified':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Project Assessment Score</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {result.percentage_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              {result.total_score} / {result.max_possible_score} points
            </div>
          </div>
        </div>
        <Progress value={result.percentage_score} className="mb-4" />
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getFeasibilityIcon(result.feasibility_rating)}
            </div>
            <div className="text-sm font-medium">Feasibility</div>
            <Badge className={`${getFeasibilityColor(result.feasibility_rating)} text-white`}>
              {result.feasibility_rating.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-sm font-medium">Qualification</div>
            <Badge className={getQualificationColor(result.qualification_level)}>
              {result.qualification_level.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-sm font-medium">Risk Level</div>
            <Badge className={getRiskColor(result.risk_level)}>
              {result.risk_level.toUpperCase()}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      {showDetails && Object.keys(result.category_scores).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(result.category_scores).map(([category, score]) => (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="text-sm text-gray-500">
                    {score.score} / {score.max_score} points ({score.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={score.percentage} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Project Estimates */}
      {result.project_estimates && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Project Estimates
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {result.project_estimates.system_size && (
              <div>
                <h4 className="font-medium mb-2">System Size</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {result.project_estimates.system_size.recommended_kwp?.toFixed(1)} kWp
                </div>
                {result.project_estimates.system_size.confidence && (
                  <div className="text-sm text-gray-500">
                    Confidence: {result.project_estimates.system_size.confidence}%
                  </div>
                )}
                {result.project_estimates.system_size.min_kwp && result.project_estimates.system_size.max_kwp && (
                  <div className="text-sm text-gray-500">
                    Range: {result.project_estimates.system_size.min_kwp.toFixed(1)} - {result.project_estimates.system_size.max_kwp.toFixed(1)} kWp
                  </div>
                )}
              </div>
            )}

            {result.project_estimates.investment && (
              <div>
                <h4 className="font-medium mb-2">Investment</h4>
                <div className="text-2xl font-bold text-green-600">
                  {result.project_estimates.investment.estimated_amount && 
                    formatCurrency(result.project_estimates.investment.estimated_amount, result.project_estimates.investment.currency)
                  }
                </div>
                {result.project_estimates.investment.confidence && (
                  <div className="text-sm text-gray-500">
                    Confidence: {result.project_estimates.investment.confidence}%
                  </div>
                )}
                {result.project_estimates.investment.min_amount && result.project_estimates.investment.max_amount && (
                  <div className="text-sm text-gray-500">
                    Range: {formatCurrency(result.project_estimates.investment.min_amount)} - {formatCurrency(result.project_estimates.investment.max_amount)}
                  </div>
                )}
              </div>
            )}

            {result.project_estimates.payback_period && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payback Period
                </h4>
                <div className="text-2xl font-bold text-purple-600">
                  {result.project_estimates.payback_period.estimated_months && 
                    `${Math.round(result.project_estimates.payback_period.estimated_months / 12)} years`
                  }
                </div>
                {result.project_estimates.payback_period.estimated_months && (
                  <div className="text-sm text-gray-500">
                    {result.project_estimates.payback_period.estimated_months} months
                  </div>
                )}
              </div>
            )}

            {result.project_estimates.annual_savings && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Annual Savings
                </h4>
                <div className="text-2xl font-bold text-green-600">
                  {result.project_estimates.annual_savings.estimated_amount && 
                    formatCurrency(result.project_estimates.annual_savings.estimated_amount, result.project_estimates.annual_savings.currency)
                  }
                </div>
                {result.project_estimates.annual_savings.min_amount && result.project_estimates.annual_savings.max_amount && (
                  <div className="text-sm text-gray-500">
                    Range: {formatCurrency(result.project_estimates.annual_savings.min_amount)} - {formatCurrency(result.project_estimates.annual_savings.max_amount)}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {showDetails && result.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {rec.category}
                    </Badge>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                      {rec.priority} priority
                    </Badge>
                    {rec.action_required && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Risk Factors */}
      {showDetails && result.risk_factors.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Risk Factors
          </h3>
          <div className="space-y-3">
            {result.risk_factors.map((risk, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <AlertTriangle className={`h-4 w-4 mt-1 ${
                  risk.severity === 'critical' ? 'text-red-500' :
                  risk.severity === 'high' ? 'text-orange-500' :
                  risk.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{risk.factor}</span>
                    <Badge className={getRiskColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{risk.description}</p>
                  {risk.mitigation && (
                    <p className="text-sm text-blue-600">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Steps */}
      {showDetails && result.next_steps.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Next Steps
          </h3>
          <div className="space-y-3">
            {result.next_steps
              .sort((a, b) => a.priority - b.priority)
              .map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium mt-1">
                    {step.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{step.step}</span>
                      {step.estimated_duration && (
                        <Badge variant="outline" className="text-xs">
                          {step.estimated_duration}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Calculation Metadata */}
      {showDetails && (
        <Card className="p-4 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Calculated: {result.calculation_metadata.calculated_at.toLocaleString()}</div>
            <div>Rules processed: {result.calculation_metadata.rules_processed}</div>
            <div>Version: {result.calculation_metadata.version}</div>
            {result.calculation_metadata.calculation_time_ms && (
              <div>Processing time: {result.calculation_metadata.calculation_time_ms}ms</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}