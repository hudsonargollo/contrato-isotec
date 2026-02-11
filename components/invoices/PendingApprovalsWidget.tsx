/**
 * Pending Approvals Widget Component
 * Displays pending approvals for the current user
 * Requirements: 4.2 - Customer approval workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  DollarSign,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { Invoice } from '@/lib/types/invoice';
import { WorkflowExecution } from '@/lib/services/invoice-approval-workflows';

interface PendingApproval {
  execution: WorkflowExecution;
  invoice: Invoice;
  workflow: any;
}

interface PendingApprovalsWidgetProps {
  pendingApprovals: PendingApproval[];
  onRefresh: () => Promise<void>;
  onApprove: (invoiceId: string) => void;
  loading?: boolean;
}

export function PendingApprovalsWidget({
  pendingApprovals,
  onRefresh,
  onApprove,
  loading = false
}: PendingApprovalsWidgetProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysPending = (startDate: Date | string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (daysPending: number) => {
    if (daysPending >= 7) return 'text-red-600';
    if (daysPending >= 3) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getPriorityBadge = (daysPending: number) => {
    if (daysPending >= 7) return { variant: 'destructive' as const, text: 'Urgent' };
    if (daysPending >= 3) return { variant: 'secondary' as const, text: 'High' };
    return { variant: 'outline' as const, text: 'Normal' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                {pendingApprovals.length} invoice{pendingApprovals.length !== 1 ? 's' : ''} awaiting your approval
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">
              You have no pending invoice approvals at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map(({ execution, invoice, workflow }) => {
              const daysPending = getDaysPending(execution.started_at);
              const priorityBadge = getPriorityBadge(daysPending);
              const currentStep = workflow.approval_steps.find(
                (s: any) => s.step_order === execution.current_step
              );

              return (
                <Card key={execution.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <h4 className="font-semibold text-lg">
                            Invoice {invoice.invoice_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {invoice.customer_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge {...priorityBadge}>
                          {priorityBadge.text}
                        </Badge>
                        <Badge variant="outline">
                          Step {execution.current_step}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-semibold">
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-semibold">
                            {formatDate(invoice.due_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Pending</p>
                          <p className={`font-semibold ${getPriorityColor(daysPending)}`}>
                            {daysPending} day{daysPending !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {currentStep && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            Current Step: {currentStep.approver_role || 'Specific Approver'}
                          </p>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Workflow: {workflow.name}
                        </p>
                      </div>
                    )}

                    {daysPending >= 7 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This approval has been pending for {daysPending} days and requires urgent attention.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onApprove(invoice.id)}
                        className="flex-1"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Review & Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {pendingApprovals.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingApprovals.filter(p => getDaysPending(p.execution.started_at) >= 3).length}
                  </p>
                  <p className="text-sm text-gray-600">High Priority</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {pendingApprovals.filter(p => getDaysPending(p.execution.started_at) >= 7).length}
                  </p>
                  <p className="text-sm text-gray-600">Urgent</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}