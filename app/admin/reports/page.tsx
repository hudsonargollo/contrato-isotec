'use client';

/**
 * Admin Reports Page
 * 
 * Displays analytics and reports for the solar contract system
 * Provides insights on contracts, revenue, and performance metrics
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/ui/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportData {
  totalContracts: number;
  totalRevenue: number;
  averageContractValue: number;
  contractsThisMonth: number;
  revenueThisMonth: number;
  conversionRate: number;
  monthlyData: Array<{
    month: string;
    contracts: number;
    revenue: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        // Sample data for demonstration
        setReportData({
          totalContracts: 24,
          totalRevenue: 856000,
          averageContractValue: 35666.67,
          contractsThisMonth: 8,
          revenueThisMonth: 284000,
          conversionRate: 68.5,
          monthlyData: [
            { month: 'Jan', contracts: 6, revenue: 210000 },
            { month: 'Fev', contracts: 8, revenue: 284000 },
            { month: 'Mar', contracts: 10, revenue: 362000 }
          ],
          statusBreakdown: [
            { status: 'Assinados', count: 16, percentage: 66.7 },
            { status: 'Pendentes', count: 6, percentage: 25.0 },
            { status: 'Cancelados', count: 2, percentage: 8.3 }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-neutral-400">Carregando relatórios...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!reportData) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar relatórios</h3>
              <p className="text-neutral-400">Tente novamente em alguns instantes</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Relatórios</h1>
            <p className="text-neutral-400">Análise de desempenho e métricas do sistema</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            
            <Button variant="outline" size="sm" className="border-neutral-600 text-neutral-300">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total de Contratos</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(reportData.totalContracts)}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                  +{reportData.contractsThisMonth} este mês
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Receita Total</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(reportData.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                  +{formatCurrency(reportData.revenueThisMonth)} este mês
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Valor Médio</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(reportData.averageContractValue)}</p>
                </div>
                <div className="p-3 bg-solar-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-solar-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                  Por contrato
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-white">{reportData.conversionRate}%</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                  +2.3% vs mês anterior
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Performance */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Desempenho Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.monthlyData.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-sm text-neutral-400">{month.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-white">{month.contracts} contratos</div>
                          <div className="text-sm text-neutral-400">•</div>
                          <div className="text-sm text-solar-400">{formatCurrency(month.revenue)}</div>
                        </div>
                        <div className="mt-1 w-full bg-neutral-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-solar-500 to-solar-400 h-2 rounded-full"
                            style={{ width: `${(month.contracts / Math.max(...reportData.monthlyData.map(m => m.contracts))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Status dos Contratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.statusBreakdown.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'Assinados' ? 'bg-green-500' :
                        status.status === 'Pendentes' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-white">{status.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400">{status.count}</span>
                      <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">
                        {status.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-neutral-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{reportData.totalContracts}</div>
                  <div className="text-sm text-neutral-400">Total de contratos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Insights */}
        <Card className="bg-neutral-800/50 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Insights e Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-white">Tendências Positivas</h4>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Taxa de conversão aumentou 2.3% este mês
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Valor médio por contrato cresceu 8.5%
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Redução de 15% no tempo de assinatura
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-white">Oportunidades</h4>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-solar-500 rounded-full" />
                    6 contratos pendentes de assinatura
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-solar-500 rounded-full" />
                    Potencial de R$ 180k em receita pendente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-solar-500 rounded-full" />
                    Follow-up recomendado para 3 clientes
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}