/**
 * Usage Billing Dashboard Component
 * 
 * Comprehensive dashboard for viewing usage metrics, billing cycles,
 * and managing usage-based billing for tenants.
 * 
 * Requirements: 9.2 - Usage-based billing tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Mail,
  FileText,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

// Types
interface UsageData {
  [key: string]: number;
}

interface UsageSummary {
  tenant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  event_type: string;
  total_quantity: number;
  billable_quantity: number;
  rate_per_unit: number;
  total_charge: number;
  currency: string;
  tier_breakdown: Array<{
    tier_start: number;
    tier_end?: number;
    quantity: number;
    rate: number;
    charge: number;
  }>;
}

interface BillingCycle {
  id: string;
  tenant_id: string;
  cycle_start: string;
  cycle_end: string;
  status: 'active' | 'processing' | 'completed' | 'failed';
  total_usage_charges: number;
  subscription_charges: number;
  total_charges: number;
  currency: string;
  invoice_id?: string;
  processed_at?: string;
}

// Event type configurations
const EVENT_TYPE_CONFIG = {
  api_call: { 
    label: 'API Calls', 
    icon: Zap, 
    color: '#3b82f6',
    unit: 'calls'
  },
  whatsapp_message_sent: { 
    label: 'WhatsApp Sent', 
    icon: MessageSquare, 
    color: '#10b981',
    unit: 'messages'
  },
  whatsapp_message_received: { 
    label: 'WhatsApp Received', 
    icon: MessageSquare, 
    color: '#06b6d4',
    unit: 'messages'
  },
  email_sent: { 
    label: 'Emails Sent', 
    icon: Mail, 
    color: '#8b5cf6',
    unit: 'emails'
  },
  contract_generated: { 
    label: 'Contracts Generated', 
    icon: FileText, 
    color: '#f59e0b',
    unit: 'contracts'
  },
  invoice_created: { 
    label: 'Invoices Created', 
    icon: FileText, 
    color: '#ef4444',
    unit: 'invoices'
  },
  storage_used: { 
    label: 'Storage Used', 
    icon: Database, 
    color: '#6366f1',
    unit: 'GB'
  },
  report_generated: { 
    label: 'Reports Generated', 
    icon: BarChart, 
    color: '#ec4899',
    unit: 'reports'
  }
};

// Free tier allowances by plan
const FREE_ALLOWANCES = {
  starter: {
    api_call: 1000,
    whatsapp_message_sent: 100,
    whatsapp_message_received: 500,
    email_sent: 1000,
    contract_generated: 50,
    invoice_created: 100,
    storage_used: 10,
    report_generated: 25
  },
  professional: {
    api_call: 5000,
    whatsapp_message_sent: 500,
    whatsapp_message_received: 2500,
    email_sent: 5000,
    contract_generated: 250,
    invoice_created: 500,
    storage_used: 50,
    report_generated: 125
  },
  enterprise: {
    api_call: 25000,
    whatsapp_message_sent: 2500,
    whatsapp_message_received: 12500,
    email_sent: 25000,
    contract_generated: 1250,
    invoice_created: 2500,
    storage_used: 200,
    report_generated: 625
  }
};

interface UsageBillingDashboardProps {
  tenantId: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
}

export default function UsageBillingDashboard({ 
  tenantId, 
  subscriptionPlan 
}: UsageBillingDashboardProps) {
  const [currentUsage, setCurrentUsage] = useState<UsageData>({});
  const [usageSummary, setUsageSummary] = useState<UsageSummary[]>([]);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState<BillingCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [tenantId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current usage
      const usageResponse = await fetch('/api/billing/usage?period=current');
      if (!usageResponse.ok) throw new Error('Failed to load current usage');
      const usageData = await usageResponse.json();
      setCurrentUsage(usageData.usage || {});

      // Load current billing cycle
      const cycleResponse = await fetch('/api/billing/cycles?type=current');
      if (!cycleResponse.ok) throw new Error('Failed to load current cycle');
      const cycleData = await cycleResponse.json();
      setCurrentCycle(cycleData.current_cycle);

      // Load billing history
      const historyResponse = await fetch('/api/billing/cycles?type=history&limit=6');
      if (!historyResponse.ok) throw new Error('Failed to load billing history');
      const historyData = await historyResponse.json();
      setBillingCycles(historyData.billing_cycles || []);

      // Load usage summary for current period if cycle exists
      if (cycleData.current_cycle) {
        const summaryResponse = await fetch(
          `/api/billing/usage?period=historical&start_date=${cycleData.current_cycle.cycle_start}&end_date=${cycleData.current_cycle.cycle_end}`
        );
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setUsageSummary(summaryData.usage_summary || []);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processBillingCycle = async (cycleId: string) => {
    try {
      const response = await fetch(`/api/billing/cycles/${cycleId}/process`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to process billing cycle');
      }

      // Reload data after processing
      await loadDashboardData();
    } catch (err) {
      console.error('Error processing billing cycle:', err);
      setError(err instanceof Error ? err.message : 'Failed to process billing cycle');
    }
  };

  // Calculate usage statistics
  const calculateUsageStats = () => {
    const freeAllowances = FREE_ALLOWANCES[subscriptionPlan];
    const stats = [];

    for (const [eventType, usage] of Object.entries(currentUsage)) {
      const config = EVENT_TYPE_CONFIG[eventType as keyof typeof EVENT_TYPE_CONFIG];
      const freeAllowance = freeAllowances[eventType as keyof typeof freeAllowances] || 0;
      const usagePercentage = freeAllowance > 0 ? (usage / freeAllowance) * 100 : 0;
      const isOverLimit = usage > freeAllowance;

      if (config) {
        stats.push({
          eventType,
          label: config.label,
          icon: config.icon,
          color: config.color,
          unit: config.unit,
          usage,
          freeAllowance,
          usagePercentage: Math.min(usagePercentage, 100),
          isOverLimit,
          billableUsage: Math.max(0, usage - freeAllowance)
        });
      }
    }

    return stats.sort((a, b) => b.usage - a.usage);
  };

  // Prepare chart data
  const prepareChartData = () => {
    const stats = calculateUsageStats();
    return stats.map(stat => ({
      name: stat.label,
      usage: stat.usage,
      free_allowance: stat.freeAllowance,
      billable: stat.billableUsage,
      color: stat.color
    }));
  };

  // Calculate total charges
  const calculateTotalCharges = () => {
    return usageSummary.reduce((total, summary) => total + summary.total_charge, 0);
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={loadDashboardData} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usageStats = calculateUsageStats();
  const chartData = prepareChartData();
  const totalCharges = calculateTotalCharges();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage & Billing</h1>
          <p className="text-gray-600">
            Monitor your platform usage and billing information
          </p>
        </div>
        {currentCycle && currentCycle.status === 'active' && (
          <Button 
            onClick={() => processBillingCycle(currentCycle.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Process Current Cycle
          </Button>
        )}
      </div>

      {/* Current Cycle Overview */}
      {currentCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Current Billing Cycle</span>
            </CardTitle>
            <CardDescription>
              {formatDate(new Date(currentCycle.cycle_start))} - {formatDate(new Date(currentCycle.cycle_end))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(currentCycle.subscription_charges, currentCycle.currency)}
                </div>
                <div className="text-sm text-gray-600">Subscription</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentCycle.total_usage_charges, currentCycle.currency)}
                </div>
                <div className="text-sm text-gray-600">Usage Charges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(currentCycle.total_charges, currentCycle.currency)}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <Badge 
                  variant={
                    currentCycle.status === 'active' ? 'default' :
                    currentCycle.status === 'completed' ? 'secondary' :
                    currentCycle.status === 'processing' ? 'outline' : 'destructive'
                  }
                >
                  {currentCycle.status.charAt(0).toUpperCase() + currentCycle.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Usage Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {usageStats.slice(0, 4).map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.eventType}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">
                          {stat.usage.toLocaleString()} {stat.unit}
                        </p>
                      </div>
                      <Icon className="h-8 w-8" style={{ color: stat.color }} />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Free: {stat.freeAllowance.toLocaleString()}</span>
                        <span className={stat.isOverLimit ? 'text-red-600' : 'text-green-600'}>
                          {stat.usagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={stat.usagePercentage} 
                        className="mt-2"
                        style={{ 
                          '--progress-background': stat.isOverLimit ? '#ef4444' : stat.color 
                        } as React.CSSProperties}
                      />
                      {stat.isOverLimit && (
                        <p className="text-xs text-red-600 mt-1">
                          Billable: {stat.billableUsage.toLocaleString()} {stat.unit}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Current period usage vs. free allowances</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="free_allowance" fill="#e5e7eb" name="Free Allowance" />
                  <Bar dataKey="billable" fill="#ef4444" name="Billable Usage" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Details Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detailed Usage Table */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Breakdown</CardTitle>
                <CardDescription>Detailed usage metrics for current period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.eventType} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" style={{ color: stat.color }} />
                          <div>
                            <p className="font-medium">{stat.label}</p>
                            <p className="text-sm text-gray-600">
                              {stat.usage.toLocaleString()} / {stat.freeAllowance.toLocaleString()} {stat.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={stat.isOverLimit ? 'destructive' : 'secondary'}>
                            {stat.usagePercentage.toFixed(1)}%
                          </Badge>
                          {stat.isOverLimit && (
                            <p className="text-xs text-red-600 mt-1">
                              +{stat.billableUsage.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Usage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
                <CardDescription>Breakdown of current usage by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="usage"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Past billing cycles and charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingCycles.map((cycle) => (
                  <div key={cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {formatDate(new Date(cycle.cycle_start))} - {formatDate(new Date(cycle.cycle_end))}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subscription: {formatCurrency(cycle.subscription_charges, cycle.currency)} | 
                        Usage: {formatCurrency(cycle.total_usage_charges, cycle.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(cycle.total_charges, cycle.currency)}
                      </p>
                      <Badge 
                        variant={
                          cycle.status === 'completed' ? 'secondary' :
                          cycle.status === 'active' ? 'default' :
                          cycle.status === 'processing' ? 'outline' : 'destructive'
                        }
                      >
                        {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {billingCycles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No billing history available
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