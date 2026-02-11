'use client';

/**
 * Contract Lifecycle Analytics Component
 * 
 * Provides detailed analytics and reporting for contract lifecycle metrics,
 * performance trends, and business insights.
 * 
 * Requirements: 7.4 - Contract lifecycle tracking and analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';
import { 
  ContractLifecycleService,
  ContractLifecycleStats
} from '@/lib/services/contract-lifecycle';
import { useTenant } from '@/lib/contexts/tenant-context';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractLifecycleAnalyticsProps {
  className?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'percentage' | 'days' | 'currency';
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ContractLifecycleAnalytics({ className }: ContractLifecycleAnalyticsProps) {
  const { tenant } = useTenant();
  const [lifecycleService, setLifecycleService] = useState<ContractLifecycleService | null>(null);
  
  // State management
  const [stats, setStats] = useState<ContractLifecycleStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<ChartData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<ChartData[]>([]);
  const [signingPerformance, setSigningPerformance] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service
  useEffect(() => {
    if (tenant?.id) {
      const tenantContext = {
        tenant_id: tenant.id,
        user_id: tenant.id, // This should come from auth context
        permissions: []
      };
      const service = new ContractLifecycleService(tenantContext);
      setLifecycleService(service);
    }
  }, [tenant]);

  // Load analytics data
  useEffect(() => {
    if (lifecycleService) {
      loadAnalyticsData();
    }
  }, [lifecycleService]);

  const loadAnalyticsData = async () => {
    if (!lifecycleService) return;

    try {
      setLoading(true);
      setError(null);

      // Get current period stats
      const currentStats = await lifecycleService.getLifecycleStats();

      // Get previous period for comparison (mock data for now)
      const previousStats = {
        total_contracts: Math.floor(currentStats.total_contracts * 0.8),
        fully_signed: Math.floor(currentStats.fully_signed * 0.7),
        average_signing_time_days: currentStats.average_signing_time_days * 1.2,
        active_contracts: Math.floor(currentStats.active_contracts * 0.9)
      } as ContractLifecycleStats;

      setStats(currentStats);
      
      // Calculate performance metrics
      const metrics = calculatePerformanceMetrics(currentStats, previousStats);
      setPerformanceMetrics(metrics);

      // Prepare chart data
      const statusData = prepareStatusDistribution(currentStats);
      setStatusDistribution(statusData);

      const trendData = prepareMonthlyTrend(currentStats);
      setMonthlyTrend(trendData);

      const signingData = prepareSigningPerformance(currentStats);
      setSigningPerformance(signingData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = (
    current: ContractLifecycleStats, 
    previous: ContractLifecycleStats
  ): PerformanceMetric[] => {
    const calculateChange = (currentVal: number, previousVal: number) => {
      if (previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    const getTrend = (change: number): 'up' | 'down' | 'stable' => {
      if (Math.abs(change) < 5) return 'stable';
      return change > 0 ? 'up' : 'down';
    };

    return [
      {
        name: 'Total de Contratos',
        value: current.total_contracts,
        change: calculateChange(current.total_contracts, previous.total_contracts),
        trend: getTrend(calculateChange(current.total_contracts, previous.total_contracts)),
        format: 'number'
      },
      {
        name: 'Taxa de Assinatura',
        value: current.total_contracts > 0 ? (current.fully_signed / current.total_contracts) * 100 : 0,
        change: calculateChange(
          current.total_contracts > 0 ? (current.fully_signed / current.total_contracts) * 100 : 0,
          previous.total_contracts > 0 ? (previous.fully_signed / previous.total_contracts) * 100 : 0
        ),
        trend: getTrend(calculateChange(
          current.total_contracts > 0 ? (current.fully_signed / current.total_contracts) * 100 : 0,
          previous.total_contracts > 0 ? (previous.fully_signed / previous.total_contracts) * 100 : 0
        )),
        format: 'percentage'
      },
      {
        name: 'Tempo Médio de Assinatura',
        value: current.average_signing_time_days,
        change: calculateChange(current.average_signing_time_days, previous.average_signing_time_days),
        trend: getTrend(-calculateChange(current.average_signing_time_days, previous.average_signing_time_days)), // Inverted because lower is better
        format: 'days'
      },
      {
        name: 'Contratos Ativos',
        value: current.active_contracts,
        change: calculateChange(current.active_contracts, previous.active_contracts),
        trend: getTrend(calculateChange(current.active_contracts, previous.active_contracts)),
        format: 'number'
      }
    ];
  };

  const prepareStatusDistribution = (stats: ContractLifecycleStats): ChartData[] => {
    return Object.entries(stats.contracts_by_status).map(([status, count], index) => ({
      name: getStatusLabel(status),
      value: count,
      color: COLORS[index % COLORS.length]
    }));
  };

  const prepareMonthlyTrend = (stats: ContractLifecycleStats): ChartData[] => {
    return stats.monthly_creation_trend.map(item => ({
      name: format(new Date(item.month + '-01'), 'MMM', { locale: ptBR }),
      value: item.count
    }));
  };

  const prepareSigningPerformance = (stats: ContractLifecycleStats): ChartData[] => {
    // Mock data for signing performance by week
    // In a real implementation, this would come from the service
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      weeks.push({
        name: format(date, 'MMM', { locale: ptBR }),
        value: Math.floor(Math.random() * 10) + 5 // Mock signing time
      });
    }
    return weeks;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      pending_approval: 'Aguardando Aprovação',
      approved: 'Aprovado',
      sent: 'Enviado',
      signed: 'Assinado',
      cancelled: 'Cancelado',
      expired: 'Expirado'
    };
    return labels[status] || status;
  };

  const formatMetricValue = (value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'days':
        return `${value.toFixed(1)} dias`;
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics do Ciclo de Vida</h2>
          <p className="text-muted-foreground">
            Métricas de performance e tendências dos contratos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAnalyticsData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {getTrendIcon(metric.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(metric.value, metric.format)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={`${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </span>
                <span className="ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Proporção de contratos por status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <g key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal</CardTitle>
            <CardDescription>
              Contratos criados por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Signing Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de Assinatura</CardTitle>
            <CardDescription>
              Tempo médio de assinatura por mês (dias)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={signingPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights Principais</CardTitle>
            <CardDescription>
              Análises e recomendações baseadas nos dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats && (
                <>
                  {stats.average_signing_time_days > 7 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Tempo de assinatura elevado
                        </p>
                        <p className="text-xs text-yellow-700">
                          O tempo médio de {stats.average_signing_time_days} dias está acima do ideal. 
                          Considere otimizar o processo de assinatura.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.renewal_alerts > 5 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Muitas renovações pendentes
                        </p>
                        <p className="text-xs text-blue-700">
                          {stats.renewal_alerts} contratos precisam de atenção para renovação. 
                          Priorize o contato com os clientes.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.expiration_alerts > 3 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Contratos próximos do vencimento
                        </p>
                        <p className="text-xs text-red-700">
                          {stats.expiration_alerts} contratos estão próximos do vencimento. 
                          Ação imediata necessária.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.fully_signed / stats.total_contracts > 0.8 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Excelente taxa de assinatura
                        </p>
                        <p className="text-xs text-green-700">
                          Taxa de {((stats.fully_signed / stats.total_contracts) * 100).toFixed(1)}% 
                          de contratos assinados está acima da média.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ContractLifecycleAnalytics;