/**
 * Lead Qualification Component
 * Handles lead qualification workflows and scoring display
 * Requirements: 2.3 - Lead scoring and qualification system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import type { Lead, LeadScoringRule } from '@/lib/types/crm';

interface LeadQualificationProps {
  lead: Lead;
  scoringRules: LeadScoringRule[];
  onQualify?: (leadId: string, notes?: string) => void;
  onDisqualify?: (leadId: string, reason?: string) => void;
  onRecalculateScore?: (leadId: string) => void;
}

interface ScoreBreakdown {
  rule: LeadScoringRule;
  applied: boolean;
  points: number;
  reason: string;
}

export function LeadQualification({ 
  lead, 
  scoringRules, 
  onQualify, 
  onDisqualify, 
  onRecalculateScore 
}: LeadQualificationProps) {
  const [qualificationNotes, setQualificationNotes] = useState('');
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [showQualifyForm, setShowQualifyForm] = useState(false);
  const [showDisqualifyForm, setShowDisqualifyForm] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown[]>([]);

  useEffect(() => {
    calculateScoreBreakdown();
  }, [lead, scoringRules]);

  const calculateScoreBreakdown = () => {
    const breakdown: ScoreBreakdown[] = [];

    scoringRules.forEach(rule => {
      if (!rule.is_active) return;

      let applied = false;
      let reason = '';

      // Get field value
      let fieldValue: any;
      switch (rule.field_name) {
        case 'email':
          fieldValue = lead.email;
          break;
        case 'phone':
          fieldValue = lead.phone;
          break;
        case 'company':
          fieldValue = lead.company;
          break;
        case 'source_id':
          fieldValue = lead.source_id;
          break;
        case 'status':
          fieldValue = lead.status;
          break;
        case 'priority':
          fieldValue = lead.priority;
          break;
        case 'first_name':
          fieldValue = lead.first_name;
          break;
        case 'last_name':
          fieldValue = lead.last_name;
          break;
        default:
          fieldValue = lead.custom_fields?.[rule.field_name];
      }

      // Evaluate rule
      switch (rule.operator) {
        case 'equals':
          applied = fieldValue === rule.value_criteria.value;
          reason = applied 
            ? `${rule.field_name} equals "${rule.value_criteria.value}"`
            : `${rule.field_name} does not equal "${rule.value_criteria.value}"`;
          break;

        case 'contains':
          applied = fieldValue && fieldValue.toString().toLowerCase().includes(rule.value_criteria.value.toLowerCase());
          reason = applied
            ? `${rule.field_name} contains "${rule.value_criteria.value}"`
            : `${rule.field_name} does not contain "${rule.value_criteria.value}"`;
          break;

        case 'not_empty':
          applied = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          reason = applied
            ? `${rule.field_name} has a value`
            : `${rule.field_name} is empty`;
          break;

        case 'in_list':
          applied = rule.value_criteria.values && rule.value_criteria.values.includes(fieldValue);
          reason = applied
            ? `${rule.field_name} is in allowed list`
            : `${rule.field_name} is not in allowed list`;
          break;

        default:
          applied = false;
          reason = 'Rule evaluation not implemented';
      }

      breakdown.push({
        rule,
        applied,
        points: applied ? rule.score_points : 0,
        reason
      });
    });

    setScoreBreakdown(breakdown);
  };

  const handleQualify = () => {
    if (onQualify) {
      onQualify(lead.id, qualificationNotes);
      setShowQualifyForm(false);
      setQualificationNotes('');
    }
  };

  const handleDisqualify = () => {
    if (onDisqualify) {
      onDisqualify(lead.id, disqualificationReason);
      setShowDisqualifyForm(false);
      setDisqualificationReason('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getQualificationLevel = (score: number) => {
    if (score >= 80) return { level: 'Hot Lead', icon: Star, color: 'text-green-600' };
    if (score >= 60) return { level: 'Qualified', icon: CheckCircle, color: 'text-yellow-600' };
    if (score >= 40) return { level: 'Warm Lead', icon: Clock, color: 'text-orange-600' };
    return { level: 'Cold Lead', icon: AlertTriangle, color: 'text-red-600' };
  };

  const totalAppliedScore = scoreBreakdown.reduce((sum, item) => sum + item.points, 0);
  const maxPossibleScore = scoringRules
    .filter(rule => rule.is_active && rule.score_points > 0)
    .reduce((sum, rule) => sum + rule.score_points, 0);

  const qualification = getQualificationLevel(lead.score);
  const QualificationIcon = qualification.icon;

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <QualificationIcon className={`h-8 w-8 ${qualification.color}`} />
            <div>
              <h3 className="text-lg font-semibold">Lead Qualification</h3>
              <p className="text-sm text-gray-600">{qualification.level}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(lead.score)}`}>
              {lead.score}
            </div>
            <div className="text-sm text-gray-500">
              / {maxPossibleScore} points
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Progress 
            value={maxPossibleScore > 0 ? (lead.score / maxPossibleScore) * 100 : 0} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Score Progress</span>
            <span>{maxPossibleScore > 0 ? Math.round((lead.score / maxPossibleScore) * 100) : 0}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowQualifyForm(true)}
            disabled={lead.status === 'qualified' || lead.status === 'closed_won'}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Qualify Lead
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDisqualifyForm(true)}
            disabled={lead.status === 'closed_lost'}
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Disqualify
          </Button>
          <Button
            variant="outline"
            onClick={() => onRecalculateScore?.(lead.id)}
          >
            <Target className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        </div>
      </Card>

      {/* Qualification Form */}
      {showQualifyForm && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Qualify Lead</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="qualification-notes">Qualification Notes</Label>
              <Textarea
                id="qualification-notes"
                value={qualificationNotes}
                onChange={(e) => setQualificationNotes(e.target.value)}
                placeholder="Add notes about why this lead is qualified..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleQualify}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Qualification
              </Button>
              <Button variant="outline" onClick={() => setShowQualifyForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Disqualification Form */}
      {showDisqualifyForm && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Disqualify Lead</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="disqualification-reason">Reason for Disqualification</Label>
              <Textarea
                id="disqualification-reason"
                value={disqualificationReason}
                onChange={(e) => setDisqualificationReason(e.target.value)}
                placeholder="Explain why this lead is being disqualified..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDisqualify}>
                <XCircle className="h-4 w-4 mr-2" />
                Confirm Disqualification
              </Button>
              <Button variant="outline" onClick={() => setShowDisqualifyForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Score Breakdown */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Score Breakdown
        </h4>
        
        <div className="space-y-3">
          {scoreBreakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.rule.name}</span>
                  {item.applied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{item.reason}</p>
                {item.rule.description && (
                  <p className="text-xs text-gray-500 mt-1">{item.rule.description}</p>
                )}
              </div>
              <div className="text-right">
                <Badge 
                  variant={item.applied ? getScoreBadgeVariant(item.points) : "outline"}
                  className="ml-2"
                >
                  {item.applied ? '+' : ''}{item.points} pts
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {scoreBreakdown.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No scoring rules configured</p>
            <p className="text-sm">Set up scoring rules to automatically evaluate leads</p>
          </div>
        )}

        {scoreBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Applied Score:</span>
              <Badge variant={getScoreBadgeVariant(totalAppliedScore)} className="text-lg px-3 py-1">
                {totalAppliedScore} points
              </Badge>
            </div>
            {totalAppliedScore !== lead.score && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ Calculated score ({totalAppliedScore}) differs from stored score ({lead.score}). 
                Consider recalculating.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}