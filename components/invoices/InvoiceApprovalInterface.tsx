/**
 * Invoice Approval Interface Component
 * Provides customer-facing interface for invoice approval
 * Requirements: 4.2 - Customer approval workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, User, Calendar, DollarSign } from 'lucide-react';
import { Invoice, InvoiceApprovalRequest } from '@/lib/types/invoice';
import { WorkflowExecution } from '@/lib/services/invoice-approval-workflows';

interface InvoiceApprovalInterfaceProps {
  invoice: Invoice;
  workflowExecution?: WorkflowExecution;
  workflow?: any;
  canApprove: boolean;
  onApproval: (request: InvoiceApprovalRequest) => Promise<void>;
  onReject: (request: InvoiceApprovalRequest) => Promise<void>;
  loading?: boolean;
}

export function InvoiceApprovalInterface({
  invoice,
  workflowExecution,
  workflow,
  canApprove,
  onApproval,
  onReject,
  loading = false
}: InvoiceApprovalInterfaceProps) {
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending_approval':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const request: InvoiceApprovalRequest = {
        invoice_id: invoice.id,
        action: 'approve',
        comments: comments.trim() || undefined
      };

      await onApproval(request);
      setSuccess('Invoice approved successfully!');
      setComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;

    if (!comments.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const request: InvoiceApprovalRequest = {
        invoice_id: invoice.id,
        action: 'reject',
        comments: comments.trim()
      };

      await onReject(request);
      setSuccess('Invoice rejected successfully!');
      setComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(invoice.status)}
              <div>
                <CardTitle className="text-2xl">Invoice {invoice.invoice_number}</CardTitle>
                <CardDescription>
                  Customer: {invoice.customer_name}
                </CardDescription>
              </div>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Invoice Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-semibold">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-semibold">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="font-semibold">{invoice.payment_terms}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h4 className="font-semibold mb-3">Invoice Items</h4>
            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.total_amount, invoice.currency)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Workflow Status */}
      {workflowExecution && workflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Approval Workflow</span>
            </CardTitle>
            <CardDescription>
              Workflow: {workflow.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.approval_steps.map((step: any, index: number) => {
                const stepExecution = workflowExecution.steps.find(
                  (s: any) => s.step_order === step.step_order
                );
                const isCurrentStep = step.step_order === workflowExecution.current_step;
                const isCompleted = stepExecution?.status === 'approved';
                const isRejected = stepExecution?.status === 'rejected';

                return (
                  <div
                    key={step.step_order}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      isCurrentStep ? 'bg-blue-50 border border-blue-200' : 
                      isCompleted ? 'bg-green-50' : 
                      isRejected ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : isRejected ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : isCurrentStep ? (
                        <Clock className="h-5 w-5 text-blue-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">
                        Step {step.step_order}: {step.approver_role || 'Specific Approver'}
                      </p>
                      {stepExecution?.comments && (
                        <p className="text-sm text-gray-600 mt-1">{stepExecution.comments}</p>
                      )}
                    </div>
                    {isCurrentStep && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Current Step
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Actions */}
      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Decision</CardTitle>
            <CardDescription>
              Please review the invoice details above and provide your decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="comments" className="block text-sm font-medium mb-2">
                Comments {!canApprove && '(Required for rejection)'}
              </label>
              <Textarea
                id="comments"
                placeholder="Add your comments here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                disabled={isProcessing || loading}
              />
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

            <div className="flex space-x-3">
              <Button
                onClick={handleApprove}
                disabled={isProcessing || loading}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Approve Invoice'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing || loading}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Reject Invoice'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {!canApprove && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {invoice.status === 'approved' && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">Invoice Approved</span>
                </div>
              )}
              {invoice.status === 'rejected' && (
                <div className="flex items-center justify-center space-x-2 text-red-600">
                  <XCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">Invoice Rejected</span>
                </div>
              )}
              {invoice.status === 'draft' && (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <FileText className="h-6 w-6" />
                  <span className="text-lg font-semibold">Invoice in Draft</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}