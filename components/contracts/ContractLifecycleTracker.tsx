'use client';

/**
 * Contract Lifecycle Tracker Component
 * 
 * Provides comprehensive contract lifecycle tracking, renewal alerts,
 * expiration monitoring, and lifecycle analytics dashboard.
 * 
 * Requirements: 7.4 - Contract lifecycle tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  ContractLifecycleService,
  ContractLifecycleStats,
  ContractRenewalAlert,
  ContractExpirationAlert,
  ContractLifecycleFilters
} from '@/lib/services/contract-lifecycle';
import { GeneratedContract, ContractStatus, SignatureStatus } from '@/lib/types/contract-generation';
import { useTenant } from '@/lib/contexts/tenant-context';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractLifecycleTrackerProps {
  className?: string;
}

export function ContractLifecycleTracker({ className }: ContractLifecycleTrackerProps) {
  const { tenantContext } = useTenant();
  const [lifecycleService, setLifecycleService] = useState<ContractLifecycleService | null>(null);
  
  // State management
  const [stats, setStats] = useState<ContractLifecycleStats | null>(null);
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [renewalAlerts, setRenewalAlerts] = useState<ContractRenewalAlert[]>([]);
  const [expirationAlerts, setExpirationAlerts] = useState<ContractExpirationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<ContractLifecycleFilters>({});

  // Initialize service
  useEffect(() => {
    if (tenantContext) {
      const service = new ContractLifecycleService(tenantContext);
      setLifecycleService(service);
    }
  }, [tenantContext]);

  // Load data
  useEffect(() => {
    if (lifecycleService) {
      loadData();
    }
  }, [lifecycleService, filters]);

  const loadData = async () => {
    if (!lifecycleService) return;

    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        contractsData,
        renewalAlertsData,
        expirationAlertsData
      ] = await Promise.all([
        lifecycleService.getLifecycleStats(filters),
        lifecycleService.listContracts(filters),
        lifecycleService.getRenewalAlerts(30),
        lifecycleService.getExpirationAlerts(30)
      ]);

      setStats(statsData);
      setContracts(contractsData);
      setRenewalAlerts(renewalAlertsData);
      setExpirationAlerts(expirationAlertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExpiredContracts = async () => {
    if (!lifecycleService) return;

    try {
      setLoading(true);
      const result = await lifecycleService.processExpiredContracts();
      
      if (result.errors.length > 0) {
        setError(`Processados ${result.processed} contratos. Erros: ${result.errors.join(', ')}`);
      } else {
        setError(null);
      }
      
      await loadData(); // Reload data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar contratos expirados');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      case 'pending_approval':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getAlertBadgeVariant = (alertType: string) => {
    switch (alertType) {
      case 'urgent':
        return 'destructive';
      case 'overdue':
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados do ciclo de vida...</span>
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
          <h2 className="text-2xl font-bold">Ciclo de Vida dos Contratos</h2>
          <p className="text-muted-foreground">
            Acompanhe o status, renovações e expirações dos contratos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessExpiredContracts}
            disabled={loading}
          >
            <Clock className="h-4 w-4 mr-2" />
            Processar Expirados
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_contracts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_contracts} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fully_signed}</div>
              <p className="text-xs text-muted-foreground">
                Tempo médio: {stats.average_signing_time_days} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Renovação</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.renewal_alerts}</div>
              <p className="text-xs text-muted-foreground">
                Próximos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Expiração</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiration_alerts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expired_contracts} já expirados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="renewals">Renovações</TabsTrigger>
          <TabsTrigger value="expirations">Expirações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <>
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                  <CardDescription>
                    Contratos organizados por status atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.contracts_by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(status as ContractStatus)}>
                            {status}
                          </Badge>
                          <span className="text-sm">{count} contratos</span>
                        </div>
                        <div className="w-32">
                          <Progress 
                            value={(count / stats.total_contracts) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência Mensal</CardTitle>
                  <CardDescription>
                    Contratos criados nos últimos 12 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.monthly_creation_trend.map((item) => (
                      <div key={item.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {format(new Date(item.month + '-01'), 'MMM yyyy', { locale: ptBR })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.count}</span>
                          <div className="w-24">
                            <Progress 
                              value={(item.count / Math.max(...stats.monthly_creation_trend.map(t => t.count))) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Contratos</CardTitle>
              <CardDescription>
                Todos os contratos com informações de ciclo de vida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{contract.contract_number}</span>
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {contract.status}
                        </Badge>
                        <Badge variant="outline">
                          {contract.signature_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {contract.customer_data?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Criado: {formatDistanceToNow(contract.created_at, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      {contract.expires_at && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Expira: </span>
                          {format(contract.expires_at, 'dd/MM/yyyy')}
                        </div>
                      )}
                      {contract.renewal_date && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Renovação: </span>
                          {format(contract.renewal_date, 'dd/MM/yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {contracts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renewals Tab */}
        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Renovação</CardTitle>
              <CardDescription>
                Contratos que precisam de atenção para renovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renewalAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{alert.contract_number}</span>
                        <Badge variant={getAlertBadgeVariant(alert.alert_type)}>
                          {alert.alert_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {alert.customer_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Renovação: {format(alert.renewal_date, 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {alert.days_until_renewal > 0 
                          ? `${alert.days_until_renewal} dias`
                          : `${Math.abs(alert.days_until_renewal)} dias em atraso`
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {renewalAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum alerta de renovação
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expirations Tab */}
        <TabsContent value="expirations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Expiração</CardTitle>
              <CardDescription>
                Contratos próximos do vencimento ou já expirados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expirationAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{alert.contract_number}</span>
                        <Badge variant={getAlertBadgeVariant(alert.alert_type)}>
                          {alert.alert_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cliente: {alert.customer_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expira: {format(alert.expires_at, 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {alert.days_until_expiration > 0 
                          ? `${alert.days_until_expiration} dias`
                          : alert.alert_type === 'expired' 
                            ? 'Expirado'
                            : `${Math.abs(alert.days_until_expiration)} dias expirado`
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {expirationAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum alerta de expiração
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

export default ContractLifecycleTracker;