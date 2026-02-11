/**
 * Approval Workflow Manager Component
 * Manages approval workflows configuration and monitoring
 * Requirements: 4.2 - Customer approval workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Edit,
  Trash2,
  Play
} from 'lucide-react';
import { InvoiceApprovalWorkflow, ApprovalStep } from '@/lib/types/invoice';
import { CreateWorkflowRequest } from '@/lib/services/invoice-approval-workflows';

interface ApprovalWorkflowManagerProps {
  workflows: InvoiceApprovalWorkflow[];
  onCreateWorkflow: (request: CreateWorkflowRequest) => Promise<void>;
  onUpdateWorkflow: (id: string, request: Partial<CreateWorkflowRequest>) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  loading?: boolean;
}

interface WorkflowFormData {
  name: string;
  description: string;
  approval_steps: ApprovalStep[];
  auto_approve_threshold?: number;
  require_approval_above?: number;
  is_default: boolean;
}

export function ApprovalWorkflowManager({
  workflows,
  onCreateWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow,
  loading = false
}: ApprovalWorkflowManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<InvoiceApprovalWorkflow | null>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    approval_steps: [{ step_order: 1, approver_role: '', required: true, auto_approve_conditions: {} }],
    is_default: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      approval_steps: [{ step_order: 1, approver_role: '', required: true, auto_approve_conditions: {} }],
      is_default: false
    });
    setEditingWorkflow(null);
    setError(null);
    setSuccess(null);
  };

  const handleCreateWorkflow = async () => {
    try {
      setError(null);
      
      if (!formData.name.trim()) {
        setError('Workflow name is required');
        return;
      }

      if (formData.approval_steps.length === 0) {
        setError('At least one approval step is required');
        return;
      }

      // Validate approval steps
      for (const step of formData.approval_steps) {
        if (!step.approver_role && !step.approver_user_id) {
          setError('Each approval step must have either an approver role or specific user');
          return;
        }
      }

      const request: CreateWorkflowRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        approval_steps: formData.approval_steps,
        auto_approve_threshold: formData.auto_approve_threshold,
        require_approval_above: formData.require_approval_above,
        is_default: formData.is_default
      };

      await onCreateWorkflow(request);
      setSuccess('Workflow created successfully!');
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    }
  };

  const handleEditWorkflow = (workflow: InvoiceApprovalWorkflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      approval_steps: workflow.approval_steps,
      auto_approve_threshold: workflow.auto_approve_threshold,
      require_approval_above: workflow.require_approval_above,
      is_default: workflow.is_default
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow) return;

    try {
      setError(null);
      
      const request: Partial<CreateWorkflowRequest> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        approval_steps: formData.approval_steps,
        auto_approve_threshold: formData.auto_approve_threshold,
        require_approval_above: formData.require_approval_above,
        is_default: formData.is_default
      };

      await onUpdateWorkflow(editingWorkflow.id, request);
      setSuccess('Workflow updated successfully!');
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
    }
  };

  const addApprovalStep = () => {
    const newStep: ApprovalStep = {
      step_order: formData.approval_steps.length + 1,
      approver_role: '',
      required: true,
      auto_approve_conditions: {}
    };
    setFormData({
      ...formData,
      approval_steps: [...formData.approval_steps, newStep]
    });
  };

  const removeApprovalStep = (index: number) => {
    const updatedSteps = formData.approval_steps.filter((_, i) => i !== index);
    // Reorder step numbers
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_order: i + 1
    }));
    setFormData({
      ...formData,
      approval_steps: reorderedSteps
    });
  };

  const updateApprovalStep = (index: number, field: keyof ApprovalStep, value: any) => {
    const updatedSteps = [...formData.approval_steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setFormData({
      ...formData,
      approval_steps: updatedSteps
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approval Workflows</h2>
          <p className="text-gray-600">Manage invoice approval workflows and processes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </DialogTitle>
              <DialogDescription>
                Configure the approval process for invoices
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this workflow"
                  rows={2}
                />
              </div>

              {/* Auto-approval Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auto_approve_threshold">Auto-approve Below</Label>
                  <Input
                    id="auto_approve_threshold"
                    type="number"
                    step="0.01"
                    value={formData.auto_approve_threshold || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      auto_approve_threshold: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="require_approval_above">Require Approval Above</Label>
                  <Input
                    id="require_approval_above"
                    type="number"
                    step="0.01"
                    value={formData.require_approval_above || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      require_approval_above: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Approval Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Approval Steps</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addApprovalStep}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Step
                  </Button>
                </div>

                {formData.approval_steps.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Step {step.step_order}</h4>
                      {formData.approval_steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeApprovalStep(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Approver Role</Label>
                        <Select
                          value={step.approver_role || ''}
                          onValueChange={(value) => updateApprovalStep(index, 'approver_role', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="director">Director</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Required</Label>
                        <Select
                          value={step.required ? 'true' : 'false'}
                          onValueChange={(value) => updateApprovalStep(index, 'required', value === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Required</SelectItem>
                            <SelectItem value="false">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Default Workflow */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_default">Set as default workflow</Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={editingWorkflow ? handleUpdateWorkflow : handleCreateWorkflow}
                  disabled={loading}
                  className="flex-1"
                >
                  {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{workflow.name}</span>
                      {workflow.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      {!workflow.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </CardTitle>
                    {workflow.description && (
                      <CardDescription>{workflow.description}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditWorkflow(workflow)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Auto-approval Settings */}
              {(workflow.auto_approve_threshold || workflow.require_approval_above) && (
                <div className="flex items-center space-x-4 text-sm">
                  {workflow.auto_approve_threshold && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Auto-approve below {formatCurrency(workflow.auto_approve_threshold)}</span>
                    </div>
                  )}
                  {workflow.require_approval_above && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Require approval above {formatCurrency(workflow.require_approval_above)}</span>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Approval Steps */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Approval Steps ({workflow.approval_steps.length})</span>
                </h4>
                <div className="space-y-2">
                  {workflow.approval_steps.map((step, index) => (
                    <div
                      key={step.step_order}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                          {step.step_order}
                        </div>
                        <div>
                          <p className="font-medium">
                            {step.approver_role || 'Specific User'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {step.required ? 'Required' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      {step.required ? (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows configured</h3>
              <p className="text-gray-500 mb-4">
                Create your first approval workflow to start managing invoice approvals.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}