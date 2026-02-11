/**
 * Qualification Rules Manager Component
 * Manages automated lead qualification rules based on screening results
 * Requirements: 3.4 - Integrate screening with CRM pipeline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Settings, Target, ArrowUp, ArrowDown } from 'lucide-react';
import type { ScreeningQualificationRule, CreateQualificationRuleRequest } from '@/lib/services/crm-screening-integration';
import type { PipelineStage } from '@/lib/types/crm';

interface QualificationRulesManagerProps {
  tenantId: string;
  rules: ScreeningQualificationRule[];
  pipelineStages: PipelineStage[];
  onCreateRule: (data: CreateQualificationRuleRequest) => Promise<void>;
  onUpdateRule: (ruleId: string, data: Partial<CreateQualificationRuleRequest>) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onReorderRules?: (rules: ScreeningQualificationRule[]) => Promise<void>;
}

export function QualificationRulesManager({
  tenantId,
  rules,
  pipelineStages,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onReorderRules
}: QualificationRulesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScreeningQualificationRule | null>(null);
  const [formData, setFormData] = useState<CreateQualificationRuleRequest>({
    name: '',
    description: '',
    min_screening_score: undefined,
    required_feasibility: [],
    max_risk_level: undefined,
    required_qualification: [],
    auto_assign_stage_id: undefined,
    auto_assign_status: undefined,
    auto_assign_priority: undefined,
    is_active: true,
    rule_order: rules.length
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      min_screening_score: undefined,
      required_feasibility: [],
      max_risk_level: undefined,
      required_qualification: [],
      auto_assign_stage_id: undefined,
      auto_assign_status: undefined,
      auto_assign_priority: undefined,
      is_active: true,
      rule_order: rules.length
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRule) {
        await onUpdateRule(editingRule.id, formData);
        setEditingRule(null);
      } else {
        await onCreateRule(formData);
        setIsCreateDialogOpen(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleEdit = (rule: ScreeningQualificationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      min_screening_score: rule.min_screening_score,
      required_feasibility: rule.required_feasibility || [],
      max_risk_level: rule.max_risk_level,
      required_qualification: rule.required_qualification || [],
      auto_assign_stage_id: rule.auto_assign_stage_id,
      auto_assign_status: rule.auto_assign_status,
      auto_assign_priority: rule.auto_assign_priority,
      auto_assign_user_id: rule.auto_assign_user_id,
      is_active: rule.is_active,
      rule_order: rule.rule_order
    });
  };

  const handleMoveRule = async (ruleId: string, direction: 'up' | 'down') => {
    if (!onReorderRules) return;

    const currentIndex = rules.findIndex(r => r.id === ruleId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= rules.length) return;

    const reorderedRules = [...rules];
    const [movedRule] = reorderedRules.splice(currentIndex, 1);
    reorderedRules.splice(newIndex, 0, movedRule);

    // Update rule orders
    const updatedRules = reorderedRules.map((rule, index) => ({
      ...rule,
      rule_order: index
    }));

    await onReorderRules(updatedRules);
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'closed_won': return 'bg-emerald-100 text-emerald-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Qualification Rules</h2>
          <p className="text-muted-foreground">
            Automatically qualify leads based on screening results
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Qualification Rule</DialogTitle>
              <DialogDescription>
                Define criteria for automatically qualifying leads based on screening results
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="High Quality Leads"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_score">Minimum Screening Score</Label>
                  <Input
                    id="min_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.min_screening_score || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      min_screening_score: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when this rule should apply..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Feasibility</Label>
                  <Select
                    value={formData.required_feasibility?.[0] || ''}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      required_feasibility: value ? [value] : [] 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any feasibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any feasibility</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Risk Level</Label>
                  <Select
                    value={formData.max_risk_level || ''}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      max_risk_level: value || undefined 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any risk level</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Automatic Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assign to Stage</Label>
                    <Select
                      value={formData.auto_assign_stage_id || ''}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        auto_assign_stage_id: value || undefined 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No stage change" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No stage change</SelectItem>
                        {pipelineStages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Set Status</Label>
                    <Select
                      value={formData.auto_assign_status || ''}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        auto_assign_status: value || undefined 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No status change" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No status change</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="space-y-2">
                    <Label>Set Priority</Label>
                    <Select
                      value={formData.auto_assign_priority || ''}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        auto_assign_priority: value || undefined 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No priority change" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No priority change</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Rule is active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">Create Rule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No qualification rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first rule to automatically qualify leads based on screening results
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule, index) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{rule.name}</span>
                      {!rule.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </CardTitle>
                    {rule.description && (
                      <CardDescription>{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {onReorderRules && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveRule(rule.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveRule(rule.id, 'down')}
                          disabled={index === rules.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{rule.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteRule(rule.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Criteria */}
                  <div>
                    <h4 className="font-medium mb-2">Criteria</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.min_screening_score && (
                        <Badge variant="outline">
                          Score ≥ {rule.min_screening_score}%
                        </Badge>
                      )}
                      {rule.required_feasibility?.map(feasibility => (
                        <Badge key={feasibility} variant="outline">
                          Feasibility: {feasibility}
                        </Badge>
                      ))}
                      {rule.max_risk_level && (
                        <Badge variant="outline" className={getRiskLevelColor(rule.max_risk_level)}>
                          Max Risk: {rule.max_risk_level}
                        </Badge>
                      )}
                      {rule.required_qualification?.map(qual => (
                        <Badge key={qual} variant="outline">
                          Qualification: {qual}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-medium mb-2">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.auto_assign_status && (
                        <Badge className={getStatusColor(rule.auto_assign_status)}>
                          Status: {rule.auto_assign_status}
                        </Badge>
                      )}
                      {rule.auto_assign_priority && (
                        <Badge variant="outline">
                          Priority: {rule.auto_assign_priority}
                        </Badge>
                      )}
                      {rule.auto_assign_stage_id && (
                        <Badge variant="outline">
                          Stage: {pipelineStages.find(s => s.id === rule.auto_assign_stage_id)?.name || 'Unknown'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Qualification Rule</DialogTitle>
            <DialogDescription>
              Update the criteria and actions for this qualification rule
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form content as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Rule Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_min_score">Minimum Screening Score</Label>
                <Input
                  id="edit_min_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.min_screening_score || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    min_screening_score: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active">Rule is active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button type="submit">Update Rule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}