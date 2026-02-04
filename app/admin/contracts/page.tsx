'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, Eye, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Contract {
  id: number;
  uuid: string;
  contractor_name: string;
  contractor_cpf: string;
  status: string;
  contract_value: number;
  created_at: string;
  signed_at: string | null;
}

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch contracts from API
    // For now, show empty state
    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending_signature: 'bg-solar-500/10 text-solar-400 border-solar-500/20',
      signed: 'bg-energy-500/10 text-energy-400 border-energy-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const labels = {
      pending_signature: 'Aguardando Assinatura',
      signed: 'Assinado',
      cancelled: 'Cancelado',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || ''}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900">
      {/* Header */}
      <header className="bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC Logo"
              width={120}
              height={48}
              priority
              className="w-32"
            />
            <div>
              <h1 className="text-xl font-bold text-white">Contratos</h1>
              <p className="text-sm text-neutral-400">Gerenciar todos os contratos</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pending_signature">Aguardando Assinatura</option>
                <option value="signed">Assinado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              
              <Button
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Contracts Table/List */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-solar-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-neutral-400">Carregando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum contrato encontrado</h3>
              <p className="text-neutral-400 mb-6">
                Comece criando seu primeiro contrato
              </p>
              <Link
                href="/wizard"
                className="inline-block px-6 py-3 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200"
              >
                Criar Novo Contrato
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-900/50 border-b border-neutral-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-neutral-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{contract.contractor_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-400">{contract.contractor_cpf}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{formatCurrency(contract.contract_value)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-400">{formatDate(contract.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/contracts/${contract.id}`}
                          className="text-solar-400 hover:text-solar-300 mr-4"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </Link>
                        <Link
                          href={`/contracts/${contract.uuid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ocean-400 hover:text-ocean-300"
                          title="Ver URL Pública"
                        >
                          <FileText className="w-4 h-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
