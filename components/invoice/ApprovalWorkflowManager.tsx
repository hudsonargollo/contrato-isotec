/**
 * Invoice Approval Workflow Manager Component
 * Manages approval workflows and processes for invoices
 * Requirements: 4.2 - Customer approval workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceApprovalWorkflow, 
  InvoiceApprovalRequest,
  ApprovalStep 
} from '@/lib/types/invoice';
import { useTenant } from '@/lib/contexts/tenant-context';

interface ApprovalWorkflowManagerProps {
  invoice?: Invoice;
  workflows?: InvoiceApprovalWorkflow[];
  onApprove?: (request: InvoiceApprovalRequest) => Promise<void>;
  onCreateWorkflow?: (workflow: Partial<InvoiceApprovalWorkflow>) => Promise<void>;
  onUpdateWorkflow?: (id: string, workflow: Partial<InvoiceApprovalWorkflow>) => Promise<void>;
  onDeleteWorkflow?: (id: string) => Promise<void>;
}

export function ApprovalWorkflowManager({
  invoice,
  workflows = [],
  onApprove,
  onCreateWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow
}: ApprovalWorkflowManagerProps) {
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState('approval');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComments, setApprovalComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Workflow creation state
  const [newWorkflow, setNewWorkflow] = useState<Partial<InvoiceApprovalWorkflow>>({
    name: '',
    description: '',
    approval_steps: [],
    auto_approve_threshold: 0,
    require_approval_above: 1000,
    conditions: [],
    is_active: true,
    is_default: false
  });

  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);

  const handleApproval = async () => {
    if (!invoice || !onApprove) return;

    if (approvalAction === 'reject' && !approvalComments.trim()) {
      setError('Comments are required when rejecting an invoice');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onApprove({
        invoice_id: invoice.id,
        action: approvalAction,
        comments: approvalComments.trim() || undefined
      });

      setSuccess(`Invoice ${approvalAction}d successfully`);
      setApprovalComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!onCreateWorkflow) return;

    if (!newWorkflow.name?.trim()) {
      setError('Workflow name is required');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onCreateWorkflow(newWorkflow);
      setSuccess('Workflow created successfully');
      setNewWorkflow({
        name: '',
        description: '',
        approval_steps: [],
        auto_approve_threshold: 0,
        require_approval_above: 1000,
        conditions: [],
        is_active: true,
        is_default: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setIsProcessing(false);
    }
  };

  const addApprovalStep = () => {
    const newStep: ApprovalStep = {
      step_order: (newWorkflow.approval_steps?.length || 0) + 1,
      approver_role: '',
      required: true,
      auto_approve_conditions: {}
    };

    setNewWorkflow(prev => ({
      ...prev,
      approval_steps: [...(prev.approval_steps || []), newStep]
    }));
  };

  const updateApprovalStep = (index: number, step: Partial<ApprovalStep>) => {
    setNewWorkflow(prev => ({
      ...prev,
      approval_steps: prev.approval_steps?.map((s, i) => 
        i === index ? { ...s, ...step } : s
      ) || []
    }));
  };

  const removeApprovalStep = (index: number) => {
    setNewWorkflow(prev => ({
      ...prev,
      approval_steps: prev.approval_steps?.filter((_, i) => i !== index) || []
    }));
  };

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Not Submitted</Badge>;
    }
  };

  const canApprove = invoice && ['draft', 'pending_approval'].includes(invoice.status);

  return (
    <div className="space-y-6">
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approval">Invoice Approval</TabsTrigger>
          <TabsTrigger value="workflows">Manage Workflows</TabsTrigger>
          <TabsTrigger value="create">Create Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="approval" className="space-y-4">
          {invoice ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Invoice Approval
                  {getApprovalStatusBadge(invoice.approval_status)}
                </CardTitle>
                <CardDescription>
                  Review and approve or reject invoice {invoice.invoice_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <p className="text-sm font-medium">{invoice.customer_name}</p>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <p className="text-sm font-medium">
                      {invoice.currency} {invoice.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <p className="text-sm font-medium">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={invoice.status === 'draft' ? 'secondary' : 'default'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>

                {invoice.rejection_reason && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rejection Reason:</strong> {invoice.rejection_reason}
                    </AlertDescription>
                  </Alert>
                )}

                {canApprove && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label>Action</Label>
                      <Select value={approvalAction} onValueChange={(value: 'approve' | 'reject') => setApprovalAction(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Approve
                            </div>
                          </SelectItem>
                          <SelectItem value="reject">
                            <div className="flex items-center">
                              <XCircle className="w-4 h-4 mr-2 text-red-600" />
                              Reject
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Comments {approvalAction === 'reject' && <span className="text-red-500">*</span>}</Label>
                      <Textarea
                        value={approvalComments}
                        onChange={(e) => setApprovalComments(e.target.value)}
                        placeholder={
                          approvalAction === 'approve' 
                            ? 'Optional approval comments...' 
                            : 'Please provide a reason for rejection...'
                        }
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleApproval}
                      disabled={isProcessing}
                      className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    >
                      {isProcessing ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {approvalAction === 'approve' ? (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          {approvalAction === 'approve' ? 'Approve Invoice' : 'Reject Invoice'}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!canApprove && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This invoice cannot be approved in its current state. Status: {invoice.status}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No invoice selected for approval.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
              <CardDescription>
                Manage approval workflows for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No approval workflows configured. Create one to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{workflow.name}</h4>
                              {workflow.is_default && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                              {!workflow.is_active && (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground">
                                {workflow.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Steps: {workflow.approval_steps.length}</span>
                              {workflow.auto_approve_threshold && (
                                <span>Auto-approve under: {workflow.auto_approve_threshold}</span>
                              )}
                              {workflow.require_approval_above && (
                                <span>Require approval above: {workflow.require_approval_above}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingWorkflow(workflow.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteWorkflow?.(workflow.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Approval Workflow</CardTitle>
              <CardDescription>
                Define a new approval workflow for invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name *</Label>
                  <Input
                    id="workflow-name"
                    value={newWorkflow.name || ''}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Approval Process"
                  />
                </div>
                <div>
                  <Label htmlFor="auto-approve-threshold">Auto-approve Threshold</Label>
                  <Input
                    id="auto-approve-threshold"
                    type="number"
                    value={newWorkflow.auto_approve_threshold || 0}
                    onChange={(e) => setNewWorkflow(prev => ({ 
                      ...prev, 
                      auto_approve_threshold: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={newWorkflow.description || ''}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this workflow..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="require-approval-above">Require Approval Above</Label>
                  <Input
                    id="require-approval-above"
                    type="number"
                    value={newWorkflow.require_approval_above || 1000}
                    onChange={(e) => setNewWorkflow(prev => ({ 
                      ...prev, 
                      require_approval_above: parseFloat(e.target.value) || 1000 
                    }))}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is-active"
                    checked={newWorkflow.is_active}
                    onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Approval Steps</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addApprovalStep}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                {newWorkflow.approval_steps?.map((step, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Step {step.step_order}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeApprovalStep(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Approver Role</Label>
                        <Select
                          value={step.approver_role || ''}
                          onValueChange={(value) => updateApprovalStep(index, { approver_role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          checked={step.required}
                          onCheckedChange={(checked) => updateApprovalStep(index, { required: checked })}
                        />
                        <Label>Required</Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={newWorkflow.is_default}
                  onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is-default">Set as Default Workflow</Label>
              </div>

              <Button 
                onClick={handleCreateWorkflow}
                disabled={isProcessing || !newWorkflow.name?.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}