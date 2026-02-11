/**
 * Billing Portal Component
 * 
 * Comprehensive billing portal for tenants to manage subscriptions,
 * view invoices, and handle payment methods.
 * 
 * Requirements: 9.3, 9.4 - Automated billing and payments
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Receipt, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Download,
  Clock,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate, formatDateTime } from '@/lib/utils/date';

// Types
interface BillingInvoice {
  id: string;
  invoice_number: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  due_date: string;
  paid_at?: string;
  payment_failure_reason?: string;
  retry_count: number;
  created_at: string;
}

interface SubscriptionInfo {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
}

interface BillingPortalProps {
  tenantId: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
}

export default function BillingPortal({ tenantId, subscriptionPlan }: BillingPortalProps) {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingPortal, setProcessingPortal] = useState(false);

  // Load billing data on component mount
  useEffect(() => {
    loadBillingData();
  }, [tenantId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load invoices
      const invoicesResponse = await fetch('/api/billing/invoices?limit=12');
      if (!invoicesResponse.ok) throw new Error('Failed to load invoices');
      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData.invoices || []);

      // Load subscription info (this would come from tenant data)
      // For now, we'll simulate subscription data
      setSubscription({
        id: 'sub_example',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      });
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      setProcessingPortal(true);
      
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          return_url: window.location.href
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open billing portal');
      }

      const data = await response.json();
      
      // Redirect to Stripe billing portal
      window.location.href = data.portal_url;
    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setProcessingPortal(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'active':
        return 'default';
      case 'open':
      case 'trialing':
        return 'secondary';
      case 'past_due':
      case 'uncollectible':
        return 'destructive';
      case 'canceled':
      case 'void':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'open':
      case 'trialing':
        return <Clock className="h-4 w-4" />;
      case 'past_due':
      case 'uncollectible':
        return <AlertCircle className="h-4 w-4" />;
      case 'canceled':
      case 'void':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPlanDisplayName = (plan: string) => {
    const names = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise'
    };
    return names[plan as keyof typeof names] || plan;
  };

  const getPlanPrice = (plan: string) => {
    const prices = {
      starter: 99.00,
      professional: 299.00,
      enterprise: 999.00
    };
    return prices[plan as keyof typeof prices] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const planPrice = getPlanPrice(subscriptionPlan);
  const overdue = invoices.filter(inv => inv.status === 'open' && new Date(inv.due_date) < new Date());
  const failed = invoices.filter(inv => inv.payment_failure_reason);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">
            Manage your subscription and billing information
          </p>
        </div>
        <Button 
          onClick={openBillingPortal}
          disabled={processingPortal}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {processingPortal ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Opening Portal...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Billing
            </>
          )}
        </Button>
      </div>

      {/* Alerts for overdue/failed payments */}
      {overdue.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {overdue.length} overdue invoice{overdue.length > 1 ? 's' : ''}. 
            Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {failed.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {failed.length} payment{failed.length > 1 ? 's' : ''} failed. 
            We'll retry automatically, but please check your payment method.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Subscription</span>
            </CardTitle>
            <CardDescription>
              {getPlanDisplayName(subscriptionPlan)} Plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(planPrice, 'BRL')}
                </div>
                <div className="text-sm text-gray-600">Monthly</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  {getStatusIcon(subscription.status)}
                  <Badge variant={getStatusBadgeVariant(subscription.status)}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {formatDate(new Date(subscription.current_period_end))}
                </div>
                <div className="text-sm text-gray-600">Next Billing</div>
              </div>
              <div className="text-center">
                {subscription.cancel_at_period_end ? (
                  <div className="text-sm text-red-600 font-medium">
                    Canceling
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-medium">
                    Active
                  </div>
                )}
                <div className="text-sm text-gray-600">Renewal</div>
              </div>
            </div>

            {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Trial ends on {formatDate(new Date(subscription.trial_end))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Paid */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Paid</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        invoices.reduce((sum, inv) => sum + inv.amount_paid, 0),
                        'BRL'
                      )}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Outstanding */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Outstanding</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        invoices
                          .filter(inv => inv.status === 'open')
                          .reduce((sum, inv) => sum + (inv.amount_due - inv.amount_paid), 0),
                        'BRL'
                      )}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            {/* Failed Payments */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed Payments</p>
                    <p className="text-2xl font-bold">{failed.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(new Date(invoice.due_date))}
                        </p>
                        {invoice.payment_failure_reason && (
                          <p className="text-xs text-red-600">
                            {invoice.payment_failure_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(invoice.amount_due, invoice.currency)}
                      </p>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No invoices found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Complete billing history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">
                          Created: {formatDate(new Date(invoice.created_at))}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(new Date(invoice.due_date))}
                        </p>
                        {invoice.paid_at && (
                          <p className="text-sm text-green-600">
                            Paid: {formatDateTime(new Date(invoice.paid_at))}
                          </p>
                        )}
                        {invoice.payment_failure_reason && (
                          <p className="text-xs text-red-600">
                            Failed: {invoice.payment_failure_reason}
                            {invoice.retry_count > 0 && ` (${invoice.retry_count} retries)`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="font-bold">
                          {formatCurrency(invoice.amount_due, invoice.currency)}
                        </p>
                        {invoice.amount_paid > 0 && invoice.amount_paid < invoice.amount_due && (
                          <p className="text-sm text-gray-600">
                            Paid: {formatCurrency(invoice.amount_paid, invoice.currency)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No invoices found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}