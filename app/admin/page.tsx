import Link from 'next/link';
import { FileText, Users, CheckCircle, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/ui/admin-layout';

export default function AdminDashboard() {
  return (
    <AdminLayout userInfo={{ name: 'Administrador', role: 'Admin' }}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-solar-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-solar-400" />
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-neutral-400 text-sm">Total de Contratos</h3>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-energy-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-energy-400" />
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-neutral-400 text-sm">Contratos Assinados</h3>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-ocean-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-ocean-400" />
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-neutral-400 text-sm">Aguardando Assinatura</h3>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 hover:bg-neutral-800/70 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-solar-500/10 rounded-lg">
                <Users className="w-6 h-6 text-solar-400" />
              </div>
              <span className="text-3xl font-bold text-white">0</span>
            </div>
            <h3 className="text-neutral-400 text-sm">Clientes Ativos</h3>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/wizard"
              className="group relative px-6 py-4 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200 active:scale-95 text-center"
            >
              Criar Novo Contrato
            </Link>
            
            <Link
              href="/admin/contracts"
              className="px-6 py-4 bg-ocean-500 text-white font-semibold rounded-lg shadow-md hover:bg-ocean-600 transition-all duration-200 active:scale-95 text-center"
            >
              Ver Todos os Contratos
            </Link>
            
            <button
              disabled
              className="px-6 py-4 bg-neutral-700 text-neutral-500 font-semibold rounded-lg cursor-not-allowed text-center"
            >
              Relatórios (Em breve)
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Atividade Recente</h2>
          <div className="text-center py-12">
            <p className="text-neutral-400">Nenhuma atividade recente</p>
            <p className="text-neutral-500 text-sm mt-2">
              Crie seu primeiro contrato para começar
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
