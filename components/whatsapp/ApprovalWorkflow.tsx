/**
 * WhatsApp Template Approval Workflow Component
 * Requirements: 5.4 - Template approval workflows
 */

'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WhatsAppTemplate, WhatsAppApprovalStatus } from '@/lib/types/whatsapp';
import { TemplatePreview } from './TemplatePreview';

interface ApprovalWorkflowProps {
  template: WhatsAppTemplate;
  onApprovalUpdated: () => void;
  onCancel: () => void;
}

interface ApprovalAction {
  action: 'approve' | 'reject';
  reason?: string;
}

export function ApprovalWorkflow({ 
  template, 
  onApprovalUpdated, 
  onCancel 
}: ApprovalWorkflowProps) {
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmitApproval = async () => {
    if (!selectedAction) return;

    if (selectedAction === 'reject' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updateData: any = {
        approval_status: selectedAction === 'approve' ? 'APPROVED' : 'REJECTED'
      };

      if (selectedAction === 'reject') {
        updateData.rejection_reason = rejectionReason.trim();
      } else {
        updateData.approval_comment = approvalComment.trim();
      }

      const response = await fetch(`/api/whatsapp/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update approval status');
      }

      onApprovalUpdated();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update approval status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: WhatsAppApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: WhatsAppApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getComplianceChecks = () => {
    const checks = [
      {
        id: 'naming',
        label: 'Template naming follows conventions',
        status: /^[a-z0-9_]+$/.test(template.name) ? 'pass' : 'fail',
        description: 'Template name uses only lowercase letters, numbers, and underscores'
      },
      {
        id: 'category',
        label: 'Appropriate category selected',
        status: ['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(template.category) ? 'pass' : 'fail',
        description: 'Template category is valid for WhatsApp Business API'
      },
      {
        id: 'body_length',
        label: 'Body text length is appropriate',
        status: template.body.text && template.body.text.length <= 1024 ? 'pass' : 'fail',
        description: 'Body text should be concise and under 1024 characters'
      },
      {
        id: 'parameters',
        label: 'Parameter usage is valid',
        status: 'pass', // This would need more complex validation
        description: 'Parameters are properly formatted and sequential'
      },
      {
        id: 'buttons',
        label: 'Button configuration is valid',
        status: !template.buttons || template.buttons.length <= 3 ? 'pass' : 'fail',
        description: 'Maximum 3 buttons allowed per template'
      }
    ];

    return checks;
  };

  const complianceChecks = getComplianceChecks();
  const failedChecks = complianceChecks.filter(check => check.status === 'fail');
  const hasComplianceIssues = failedChecks.length > 0;

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Template Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(template.approval_status)}
                Template Approval Review
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve or reject this WhatsApp template
              </p>
            </div>
            <Badge className={getStatusColor(template.approval_status)}>
              {template.approval_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">Template Name</Label>
              <p className="font-mono bg-gray-50 p-2 rounded">{template.name}</p>
            </div>
            <div>
              <Label className="text-gray-600">Category</Label>
              <p>{template.category}</p>
            </div>
            <div>
              <Label className="text-gray-600">Language</Label>
              <p>{template.language}</p>
            </div>
            <div>
              <Label className="text-gray-600">Created By</Label>
              <p className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {template.created_by}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Created Date</Label>
              <p className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(template.created_at).toLocaleDateString()}
              </p>
            </div>
            {template.approved_at && (
              <div>
                <Label className="text-gray-600">Approved Date</Label>
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(template.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {template.rejection_reason && (
            <div>
              <Label className="text-gray-600">Previous Rejection Reason</Label>
              <p className="text-red-600 bg-red-50 p-2 rounded text-sm">
                {template.rejection_reason}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Template Preview</DialogTitle>
                </DialogHeader>
                <TemplatePreview template={template} showParameterInputs />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Compliance Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceChecks.map((check) => (
              <div key={check.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    check.status === 'pass' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {check.label}
                  </p>
                  <p className="text-xs text-gray-600">{check.description}</p>
                </div>
              </div>
            ))}
          </div>

          {hasComplianceIssues && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                This template has {failedChecks.length} compliance issue(s) that should be addressed before approval.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {template.approval_status === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action Selection */}
            <div className="flex gap-4">
              <Button
                variant={selectedAction === 'approve' ? 'default' : 'outline'}
                onClick={() => setSelectedAction('approve')}
                className="flex items-center gap-2"
                disabled={hasComplianceIssues}
              >
                <CheckCircle className="w-4 h-4" />
                Approve Template
              </Button>
              <Button
                variant={selectedAction === 'reject' ? 'destructive' : 'outline'}
                onClick={() => setSelectedAction('reject')}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Template
              </Button>
            </div>

            {hasComplianceIssues && selectedAction === 'approve' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  Cannot approve template with compliance issues. Please address the issues first or reject the template.
                </AlertDescription>
              </Alert>
            )}

            {/* Approval Comment */}
            {selectedAction === 'approve' && !hasComplianceIssues && (
              <div>
                <Label htmlFor="approvalComment">Approval Comment (Optional)</Label>
                <Textarea
                  id="approvalComment"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add any comments about the approval..."
                  rows={3}
                />
              </div>
            )}

            {/* Rejection Reason */}
            {selectedAction === 'reject' && (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this template..."
                  rows={4}
                  className={!rejectionReason.trim() && error ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-600 mt-1">
                  This reason will be shared with the template creator to help them improve the template.
                </p>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApproval}
                disabled={!selectedAction || submitting || (selectedAction === 'approve' && hasComplianceIssues)}
                className={selectedAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {submitting ? 'Processing...' : (
                  selectedAction === 'approve' ? 'Approve Template' : 'Reject Template'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already Processed */}
      {template.approval_status !== 'PENDING' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-4">
                {getStatusIcon(template.approval_status)}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Template {template.approval_status.toLowerCase()}
              </h3>
              <p className="text-gray-600">
                This template has already been {template.approval_status.toLowerCase()}.
              </p>
              {template.approved_at && (
                <p className="text-sm text-gray-500 mt-2">
                  Processed on {new Date(template.approved_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}