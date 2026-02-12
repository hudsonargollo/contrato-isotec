'use client';

import Link from 'next/link';
import { FileText, Users, CheckCircle, Clock, RefreshCw, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { useDashboardActivity } from '@/lib/hooks/use-dashboard-activity';
import { formatRelativeTime, formatContractStatus, formatContractValue, getStatusIcon, truncateText } from '@/lib/utils/dashboard';
import { Button } from '@/components/ui/button';

// Client component for admin dashboard

// Statistics Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, iconColor, iconBg, loading }: StatCardProps) {
  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 w-16 bg-neutral-600 rounded"></div>
          </div>
        ) : (
          <span className="text-3xl font-bold text-white">{value}</span>
        )}
      </div>
      <h3 className="text-neutral-400 text-sm">{title}</h3>
    </div>
  );
}

// Activity Item Component
interface ActivityItemProps {
  activity: {
    id: string;
    title: string;
    description: string;
    contractUuid: string;
    contractorName: string;
    status: string;
    contractValue: number;
    timestamp: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const statusInfo = formatContractStatus(activity.status);
  const statusIcon = getStatusIcon(activity.status);

  return (
    <div className="flex items-start gap-4 p-4 border border-neutral-700 rounded-lg hover:bg-neutral-800/30 transition-all duration-200">
      <div className="flex-shrink-0 w-10 h-10 bg-solar-500/10 rounded-full flex items-center justify-center">
        <span className="text-lg">{statusIcon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white mb-1">
              {activity.title}
            </h4>
            <p className="text-sm text-neutral-400 mb-2">
              {truncateText(activity.description, 60)}
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className={statusInfo.color}>
                {statusInfo.label}
              </span>
              <span>
                {formatContractValue(activity.contractValue)}
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-neutral-500 mb-1">
              {formatRelativeTime(activity.timestamp)}
            </p>
            <Link
              href={`/contracts/${activity.contractUuid}`}
              className="text-xs text-solar-400 hover:text-solar-300 transition-colors"
            >
              Ver contrato
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { activities, loading: activityLoading, error: activityError, refetch: refetchActivity } = useDashboardActivity(8);

  const handleRefresh = () => {
    refetchStats();
    refetchActivity();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-neutral-400">Visão geral do sistema de contratos</p>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={statsLoading || activityLoading}
          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(statsLoading || activityLoading) ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Error States */}
      {(statsError || activityError) && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-red-400 font-medium">Erro ao carregar dados</h3>
              <p className="text-red-300 text-sm mt-1">
                {statsError || activityError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Contratos"
          value={stats?.totalContracts ?? 0}
          icon={FileText}
          iconColor="text-solar-400"
          iconBg="bg-solar-500/10"
          loading={statsLoading}
        />

        <StatCard
          title="Contratos Assinados"
          value={stats?.signedContracts ?? 0}
          icon={CheckCircle}
          iconColor="text-energy-400"
          iconBg="bg-energy-500/10"
          loading={statsLoading}
        />

        <StatCard
          title="Aguardando Assinatura"
          value={stats?.pendingSignature ?? 0}
          icon={Clock}
          iconColor="text-ocean-400"
          iconBg="bg-ocean-500/10"
          loading={statsLoading}
        />

        <StatCard
          title="Clientes Ativos"
          value={stats?.activeClients ?? 0}
          icon={Users}
          iconColor="text-solar-400"
          iconBg="bg-solar-500/10"
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-solar-400" />
          <h2 className="text-xl font-bold text-white">Ações Rápidas</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/wizard"
            className="group relative px-6 py-4 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200 active:scale-95 text-center"
          >
            <FileText className="w-5 h-5 mx-auto mb-2" />
            Criar Novo Contrato
          </Link>
          
          <Link
            href="/admin/contracts"
            className="px-6 py-4 bg-ocean-500 text-white font-semibold rounded-lg shadow-md hover:bg-ocean-600 transition-all duration-200 active:scale-95 text-center"
          >
            <Users className="w-5 h-5 mx-auto mb-2" />
            Ver Todos os Contratos
          </Link>
          
          <Link
            href="/admin/contracts?status=pending_signature"
            className="px-6 py-4 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition-all duration-200 active:scale-95 text-center"
          >
            <Clock className="w-5 h-5 mx-auto mb-2" />
            Pendentes
          </Link>
          
          <Link
            href="/admin/reports"
            className="px-6 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-200 active:scale-95 text-center"
          >
            <BarChart3 className="w-5 h-5 mx-auto mb-2" />
            Relatórios
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-solar-400" />
            <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
          </div>
          
          <Link
            href="/admin/contracts"
            className="text-sm text-solar-400 hover:text-solar-300 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {activityLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 bg-neutral-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-neutral-500" />
            </div>
            <p className="text-neutral-400 mb-2">Nenhuma atividade recente</p>
            <p className="text-neutral-500 text-sm mb-6">
              Crie seu primeiro contrato para começar
            </p>
            <Link href="/wizard">
              <Button className="bg-solar-500 hover:bg-solar-600 text-neutral-900">
                Criar Primeiro Contrato
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
