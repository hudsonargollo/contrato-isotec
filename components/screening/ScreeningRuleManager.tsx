/**
 * Screening Rule Manager Component
 * Manages configurable screening rules for project assessment
 * Requirements: 3.2 - Configurable scoring rules
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X, Target, AlertTriangle } from 'lucide-react';
import type { 
  ScreeningRule, 
  CreateScreeningRule, 
  ScreeningRuleType,
  ScreeningCondition 
} from '@/lib/types/screening';

interface ScreeningRuleManagerProps {
  tenantId: string;
  onRulesChange?: (rules: ScreeningRule[]) => void;
}

interface RuleFormData {
  name: string;
  description: string;
  rule_type: ScreeningRuleType;
  category: string;
  conditions: ScreeningCondition[];
  scoring: {
    points: number;
    weight: number;
    max_points?: number;
  };
  thresholds: {
    high?: number;
    medium?: number;
    low?: number;
  };
  recommendations: {
    qualified?: string;
    partially_qualified?: string;
    not_qualified?: string;
  };
  risk_factors: string[];
  is_active: boolean;
  priority: number;
}

const RULE_TYPES = [
  { value: 'threshold', label: 'Threshold', description: 'Simple threshold check' },
  { value: 'range', label: 'Range', description: 'Value within range' },
  { value: 'weighted_sum', label: 'Weighted Sum', description: 'Weighted sum of multiple factors' },
  { value: 'conditional', label: 'Conditional', description: 'Conditional logic based on other answers' },
  { value: 'formula', label: 'Formula', description: 'Custom formula evaluation' }
];

const CATEGORIES = [
  { value: 'technical', label: 'Technical', color: 'bg-blue-500' },
  { value: 'financial', label: 'Financial', color: 'bg-green-500' },
  { value: 'regulatory', label: 'Regulatory', color: 'bg-purple-500' },
  { value: 'commercial', label: 'Commercial', color: 'bg-orange-500' },
  { value: 'environmental', label: 'Environmental', color: 'bg-teal-500' }
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' }
];

export function ScreeningRuleManager({ tenantId, onRulesChange }: ScreeningRuleManagerProps) {
  const [rules, setRules] = useState<ScreeningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    rule_type: 'threshold',
    category: 'technical',
    conditions: [],
    scoring: {
      points: 0,
      weight: 1.0
    },
    thresholds: {},
    recommendations: {},
    risk_factors: [],
    is_active: true,
    priority: 0
  });
  const [newRiskFactor, setNewRiskFactor] = useState('');

  useEffect(() => {
    fetchRules();
  }, [tenantId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/screening/rules', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data);
        onRulesChange?.(data);
      }
    } catch (error) {
      console.error('Error fetching screening rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const ruleData: CreateScreeningRule = {
        ...formData,
        tenant_id: tenantId
      };

      const response = await fetch('/api/screening/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(ruleData)
      });

      if (response.ok) {
        await fetchRules();
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating screening rule:', error);
    }
  };

  const handleUpdateRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/screening/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRules();
        setEditingRule(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating screening rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this screening rule?')) return;

    try {
      const response = await fetch(`/api/screening/rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error deleting screening rule:', error);
    }
  };

  const startEditing = (rule: ScreeningRule) => {
    setEditingRule(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      category: rule.category,
      conditions: rule.conditions,
      scoring: rule.scoring,
      thresholds: rule.thresholds || {},
      recommendations: rule.recommendations,
      risk_factors: rule.risk_factors,
      is_active: rule.is_active,
      priority: rule.priority
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'threshold',
      category: 'technical',
      conditions: [],
      scoring: {
        points: 0,
        weight: 1.0
      },
      thresholds: {},
      recommendations: {},
      risk_factors: [],
      is_active: true,
      priority: 0
    });
    setNewRiskFactor('');
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          questionId: '',
          operator: 'equals',
          value: '',
          weight: 1.0,
          metadata: {}
        }
      ]
    }));
  };

  const updateCondition = (index: number, field: keyof ScreeningCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addRiskFactor = () => {
    if (newRiskFactor.trim()) {
      setFormData(prev => ({
        ...prev,
        risk_factors: [...prev.risk_factors, newRiskFactor.trim()]
      }));
      setNewRiskFactor('');
    }
  };

  const removeRiskFactor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      risk_factors: prev.risk_factors.filter((_, i) => i !== index)
    }));
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  const renderRuleForm = (isEditing: boolean, rule?: ScreeningRule) => (
    <Card className="p-6 mb-4">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input
              id="rule-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>
          <div>
            <Label htmlFor="rule-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="rule-description">Description</Label>
          <Textarea
            id="rule-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this rule evaluates"
            rows={2}
          />
        </div>

        {/* Rule Configuration */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="rule-type">Rule Type</Label>
            <Select
              value={formData.rule_type}
              onValueChange={(value: ScreeningRuleType) => setFormData(prev => ({ ...prev, rule_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rule-priority">Priority</Label>
            <Input
              id="rule-priority"
              type="number"
              min="0"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              placeholder="0 = highest"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is-active">Active Rule</Label>
          </div>
        </div>

        {/* Scoring Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="score-points">Score Points</Label>
            <Input
              id="score-points"
              type="number"
              value={formData.scoring.points}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                scoring: { ...prev.scoring, points: parseInt(e.target.value) || 0 }
              }))}
              placeholder="Points awarded when rule passes"
            />
          </div>
          <div>
            <Label htmlFor="score-weight">Weight</Label>
            <Input
              id="score-weight"
              type="number"
              step="0.1"
              value={formData.scoring.weight}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                scoring: { ...prev.scoring, weight: parseFloat(e.target.value) || 1.0 }
              }))}
              placeholder="Rule importance weight"
            />
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Conditions</Label>
            <Button type="button" onClick={addCondition} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
          <div className="space-y-3">
            {formData.conditions.map((condition, index) => (
              <Card key={index} className="p-3">
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label className="text-xs">Question ID</Label>
                    <Input
                      value={condition.questionId}
                      onChange={(e) => updateCondition(index, 'questionId', e.target.value)}
                      placeholder="Question UUID"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={condition.value as string}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Comparison value"
                      className="text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        <div>
          <Label>Risk Factors</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newRiskFactor}
              onChange={(e) => setNewRiskFactor(e.target.value)}
              placeholder="Add risk factor"
              onKeyDown={(e) => e.key === 'Enter' && addRiskFactor()}
            />
            <Button type="button" onClick={addRiskFactor} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.risk_factors.map((factor, index) => (
              <Badge key={index} variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {factor}
                <button
                  onClick={() => removeRiskFactor(index)}
                  className="ml-1 hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => isEditing ? handleUpdateRule(rule!.id) : handleCreateRule()}
            disabled={!formData.name.trim() || formData.conditions.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update' : 'Create'} Rule
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (isEditing) {
                setEditingRule(null);
              } else {
                setShowAddForm(false);
              }
              resetForm();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return <div className="p-4">Loading screening rules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Screening Rules</h3>
          <p className="text-sm text-gray-600">
            {rules.length} rules configured • {rules.filter(r => r.is_active).length} active
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {showAddForm && renderRuleForm(false)}

      <div className="space-y-2">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-4">
            {editingRule === rule.id ? (
              renderRuleForm(true, rule)
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(rule.category)}`} />
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant="outline">{rule.rule_type}</Badge>
                    <Badge variant={rule.scoring.points > 0 ? "default" : "destructive"}>
                      {rule.scoring.points} pts
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Priority: {rule.priority}
                    </Badge>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}</span>
                    <span>Weight: {rule.scoring.weight}</span>
                    {rule.risk_factors.length > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {rule.risk_factors.length} risk factor{rule.risk_factors.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No screening rules configured</p>
          <p className="text-sm text-gray-400 mb-4">
            Create rules to automatically assess project feasibility and score leads
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Rule
          </Button>
        </Card>
      )}
    </div>
  );
}