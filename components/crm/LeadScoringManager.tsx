/**
 * Lead Scoring Manager Component
 * Manages configurable lead scoring rules and algorithms
 * Requirements: 2.3 - Lead scoring and qualification system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X, Target, TrendingUp } from 'lucide-react';
import type { LeadScoringRule, CreateScoringRuleRequest, ScoringOperator } from '@/lib/types/crm';

interface LeadScoringManagerProps {
  tenantId: string;
  onRulesChange?: (rules: LeadScoringRule[]) => void;
}

interface RuleFormData {
  name: string;
  description: string;
  field_name: string;
  operator: ScoringOperator;
  value_criteria: Record<string, any>;
  score_points: number;
  is_active: boolean;
  rule_order: number;
}

const FIELD_OPTIONS = [
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'company', label: 'Company Name' },
  { value: 'source_id', label: 'Lead Source' },
  { value: 'status', label: 'Lead Status' },
  { value: 'priority', label: 'Priority Level' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' }
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals', description: 'Field value equals specific value' },
  { value: 'contains', label: 'Contains', description: 'Field value contains text' },
  { value: 'not_empty', label: 'Not Empty', description: 'Field has any value' },
  { value: 'in_list', label: 'In List', description: 'Field value is in a list of values' },
  { value: 'greater_than', label: 'Greater Than', description: 'Numeric field is greater than value' },
  { value: 'less_than', label: 'Less Than', description: 'Numeric field is less than value' },
  { value: 'regex', label: 'Regex Match', description: 'Field matches regular expression' }
];

export function LeadScoringManager({ tenantId, onRulesChange }: LeadScoringManagerProps) {
  const [rules, setRules] = useState<LeadScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    field_name: '',
    operator: 'equals',
    value_criteria: {},
    score_points: 0,
    is_active: true,
    rule_order: 0
  });
  const [criteriaValue, setCriteriaValue] = useState('');
  const [criteriaList, setCriteriaList] = useState<string[]>([]);

  useEffect(() => {
    fetchRules();
  }, [tenantId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/scoring-rules', {
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
      console.error('Error fetching scoring rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const ruleData: CreateScoringRuleRequest = {
        ...formData,
        rule_order: rules.length + 1,
        value_criteria: buildValueCriteria()
      };

      const response = await fetch('/api/crm/scoring-rules', {
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
      console.error('Error creating scoring rule:', error);
    }
  };

  const handleUpdateRule = async (ruleId: string) => {
    try {
      const ruleData = {
        ...formData,
        value_criteria: buildValueCriteria()
      };

      const response = await fetch(`/api/crm/scoring-rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(ruleData)
      });

      if (response.ok) {
        await fetchRules();
        setEditingRule(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating scoring rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this scoring rule?')) return;

    try {
      const response = await fetch(`/api/crm/scoring-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error deleting scoring rule:', error);
    }
  };

  const startEditing = (rule: LeadScoringRule) => {
    setEditingRule(rule.id);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      field_name: rule.field_name,
      operator: rule.operator,
      value_criteria: rule.value_criteria,
      score_points: rule.score_points,
      is_active: rule.is_active,
      rule_order: rule.rule_order
    });

    // Parse existing criteria for editing
    if (rule.operator === 'in_list' && rule.value_criteria.values) {
      setCriteriaList(rule.value_criteria.values);
    } else if (rule.value_criteria.value) {
      setCriteriaValue(rule.value_criteria.value);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      field_name: '',
      operator: 'equals',
      value_criteria: {},
      score_points: 0,
      is_active: true,
      rule_order: 0
    });
    setCriteriaValue('');
    setCriteriaList([]);
  };

  const buildValueCriteria = (): Record<string, any> => {
    switch (formData.operator) {
      case 'in_list':
        return { values: criteriaList };
      case 'not_empty':
        return {};
      case 'equals':
      case 'contains':
      case 'greater_than':
      case 'less_than':
      case 'regex':
        return { value: criteriaValue };
      default:
        return {};
    }
  };

  const addToList = () => {
    if (criteriaValue.trim() && !criteriaList.includes(criteriaValue.trim())) {
      setCriteriaList([...criteriaList, criteriaValue.trim()]);
      setCriteriaValue('');
    }
  };

  const removeFromList = (index: number) => {
    setCriteriaList(criteriaList.filter((_, i) => i !== index));
  };

  const renderCriteriaInput = () => {
    switch (formData.operator) {
      case 'not_empty':
        return (
          <div className="text-sm text-gray-600">
            No additional criteria needed - rule applies when field has any value
          </div>
        );

      case 'in_list':
        return (
          <div>
            <Label>Values List</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={criteriaValue}
                onChange={(e) => setCriteriaValue(e.target.value)}
                placeholder="Add value to list"
                onKeyPress={(e) => e.key === 'Enter' && addToList()}
              />
              <Button type="button" onClick={addToList} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {criteriaList.map((value, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {value}
                  <button
                    onClick={() => removeFromList(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label htmlFor="criteria-value">Criteria Value</Label>
            <Input
              id="criteria-value"
              value={criteriaValue}
              onChange={(e) => setCriteriaValue(e.target.value)}
              placeholder="Enter comparison value"
            />
          </div>
        );
    }
  };

  const renderRuleForm = (isEditing: boolean, rule?: LeadScoringRule) => (
    <Card className="p-4 mb-4">
      <div className="space-y-4">
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
          <Label htmlFor="rule-description">Description</Label>
          <Input
            id="rule-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter rule description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="field-name">Field to Check</Label>
            <Select
              value={formData.field_name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, field_name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="operator">Operator</Label>
            <Select
              value={formData.operator}
              onValueChange={(value: ScoringOperator) => {
                setFormData(prev => ({ ...prev, operator: value }));
                setCriteriaValue('');
                setCriteriaList([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {OPERATOR_OPTIONS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    <div>
                      <div>{op.label}</div>
                      <div className="text-xs text-gray-500">{op.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {renderCriteriaInput()}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="score-points">Score Points</Label>
            <Input
              id="score-points"
              type="number"
              value={formData.score_points}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                score_points: parseInt(e.target.value) || 0 
              }))}
              placeholder="Points to add/subtract"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is-active">Active Rule</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => isEditing ? handleUpdateRule(rule!.id) : handleCreateRule()}
            disabled={!formData.name.trim() || !formData.field_name}
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
    return <div className="p-4">Loading scoring rules...</div>;
  }

  const totalPossibleScore = rules
    .filter(rule => rule.is_active && rule.score_points > 0)
    .reduce((sum, rule) => sum + rule.score_points, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Lead Scoring Rules</h3>
          <p className="text-sm text-gray-600">
            Maximum possible score: <Badge variant="outline">{totalPossibleScore} points</Badge>
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
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant={rule.score_points > 0 ? "default" : "destructive"}>
                      {rule.score_points > 0 ? '+' : ''}{rule.score_points} pts
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Order: {rule.rule_order}
                    </Badge>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">
                      {FIELD_OPTIONS.find(f => f.value === rule.field_name)?.label || rule.field_name}
                    </span>
                    {' '}
                    <span className="font-medium">
                      {OPERATOR_OPTIONS.find(o => o.value === rule.operator)?.label || rule.operator}
                    </span>
                    {rule.value_criteria.value && (
                      <span> "{rule.value_criteria.value}"</span>
                    )}
                    {rule.value_criteria.values && (
                      <span> [{rule.value_criteria.values.join(', ')}]</span>
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
          <p className="text-gray-500 mb-4">No scoring rules configured</p>
          <p className="text-sm text-gray-400 mb-4">
            Create rules to automatically score leads based on their attributes
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