/**
 * Invoice Approval Page
 * Customer-facing page for invoice approval
 * Requirements: 4.2 - Customer approval workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InvoiceApprovalInterface } from '@/components/invoices/InvoiceApprovalInterface';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Invoice, InvoiceApprovalRequest } from '@/lib/types/invoice';
import { WorkflowExecution } from '@/lib/services/invoice-approval-workflows';

interface ApprovalPageData {
  invoice: Invoice;
  workflow_execution?: WorkflowExecution;
  workflow?: any;
  can_approve: boolean;
}

export default function InvoiceApprovePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [data, setData] = useState<ApprovalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovalData();
  }, [invoiceId]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}/approve`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load invoice');
      }

      const approvalData = await response.json();
      setData(approvalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (request: InvoiceApprovalRequest) => {
    const response = await fetch(`/api/invoices/${invoiceId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process approval');
    }

    // Reload data to show updated status
    await loadApprovalData();
  };

  const handleReject = async (request: InvoiceApprovalRequest) => {
    const response = await fetch(`/api/invoices/${invoiceId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process rejection');
    }

    // Reload data to show updated status
    await loadApprovalData();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </Card>

          {/* Content Skeleton */}
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <Skeleton className="h-32" />
            </div>
          </Card>

          {/* Actions Skeleton */}
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-20" />
              <div className="flex space-x-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Invoice not found or you don't have permission to view it.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <InvoiceApprovalInterface
        invoice={data.invoice}
        workflowExecution={data.workflow_execution}
        workflow={data.workflow}
        canApprove={data.can_approve}
        onApproval={handleApproval}
        onReject={handleReject}
        loading={loading}
      />
    </div>
  );
}