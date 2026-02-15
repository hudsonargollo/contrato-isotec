'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Eye, FileText, ChevronLeft, ChevronRight, Calendar, DollarSign, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Client component for admin contracts

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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ContractsListPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
        // Determine if search query looks like CPF or name
        const isNumeric = /^\d+/.test(searchQuery.trim());
        params.append('searchField', isNumeric ? 'cpf' : 'name');
      }
      
      // Add pagination and sorting
      params.append('page', currentPage.toString());
      params.append('limit', pagination.itemsPerPage.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`/api/contracts?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contracts');
      }

      const data = await response.json();
      setContracts(data.contracts || []);
      
      // Update pagination info
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, currentPage, pagination.itemsPerPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        setCurrentPage(1); // Reset to first page on search
        fetchContracts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchContracts]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy, sortOrder]);

  // Detect mobile viewport for automatic view mode switching
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };

    handleResize(); // Set initial view mode
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const formatCPF = (cpf: string) => {
    // Remove all non-digits
    const digits = cpf.replace(/\D/g, '');
    
    // Only format if we have exactly 11 digits
    if (digits.length !== 11) {
      return cpf;
    }
    
    // Apply formatting: XXX.XXX.XXX-XX
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const ContractCard = ({ contract }: { contract: Contract }) => (
    <div className="bg-neutral-700/30 border border-neutral-600 rounded-xl p-6 hover:bg-neutral-700/50 transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{contract.contractor_name}</h3>
          <p className="text-sm text-neutral-400">CPF: {formatCPF(contract.contractor_cpf)}</p>
        </div>
        {getStatusBadge(contract.status)}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-solar-400" />
          <div>
            <p className="text-xs text-neutral-400">Valor</p>
            <p className="text-sm font-medium text-white">{formatCurrency(contract.contract_value)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ocean-400" />
          <div>
            <p className="text-xs text-neutral-400">Data</p>
            <p className="text-sm font-medium text-white">{formatDate(contract.created_at)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Link
          href={`/admin/contracts/${contract.id}`}
          className="flex items-center gap-2 px-3 py-2 bg-solar-500/10 text-solar-400 border border-solar-500/20 rounded-lg hover:bg-solar-500/20 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          Detalhes
        </Link>
        <Link
          href={`/contracts/${contract.uuid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-ocean-500/10 text-ocean-400 border border-ocean-500/20 rounded-lg hover:bg-ocean-500/20 transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          Público
        </Link>
      </div>
    </div>
  );

  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-700">
        <div className="text-sm text-neutral-400">
          Mostrando {((currentPage - 1) * pagination.itemsPerPage) + 1} a {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} contratos
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {pages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "primary" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className={page === currentPage 
                ? "bg-solar-500 text-neutral-900 hover:bg-solar-600" 
                : "border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Contratos</h1>
          <p className="text-neutral-400">Gerencie todos os contratos do sistema</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400 focus:border-solar-500 focus:ring-solar-500/10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 min-w-[200px]"
              >
                <option value="all">Todos os Status</option>
                <option value="pending_signature">Aguardando Assinatura</option>
                <option value="signed">Assinado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 min-w-[150px]"
              >
                <option value="created_at">Data de Criação</option>
                <option value="contractor_name">Nome</option>
                <option value="contract_value">Valor</option>
                <option value="status">Status</option>
              </select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white px-3"
                title={`Ordenar ${sortOrder === 'asc' ? 'Decrescente' : 'Crescente'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              
              {/* View mode toggle for desktop */}
              <div className="hidden md:flex border border-neutral-600 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' 
                    ? "bg-solar-500 text-neutral-900 hover:bg-solar-600 rounded-none" 
                    : "text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-none"
                  }
                >
                  Tabela
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={viewMode === 'cards' 
                    ? "bg-solar-500 text-neutral-900 hover:bg-solar-600 rounded-none" 
                    : "text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-none"
                  }
                >
                  Cards
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contracts Display */}
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
                {searchQuery || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Comece criando seu primeiro contrato'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  href="/wizard"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold rounded-lg shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 transition-all duration-200"
                >
                  Criar Novo Contrato
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900/50 border-b border-neutral-700">
                      <tr>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-solar-400 transition-colors"
                          onClick={() => handleSort('contractor_name')}
                        >
                          Cliente {sortBy === 'contractor_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                          CPF
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-solar-400 transition-colors"
                          onClick={() => handleSort('contract_value')}
                        >
                          Valor {sortBy === 'contract_value' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-solar-400 transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-solar-400 transition-colors"
                          onClick={() => handleSort('created_at')}
                        >
                          Data {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-solar-500/10 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-solar-400" />
                              </div>
                              <div className="text-sm font-medium text-white">{contract.contractor_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-400 font-mono">{formatCPF(contract.contractor_cpf)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-white">{formatCurrency(contract.contract_value)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(contract.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-400">{formatDate(contract.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/contracts/${contract.id}`}
                                className="p-2 text-solar-400 hover:text-solar-300 hover:bg-solar-500/10 rounded-lg transition-all"
                                title="Ver Detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/contracts/${contract.uuid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-ocean-400 hover:text-ocean-300 hover:bg-ocean-500/10 rounded-lg transition-all"
                                title="Ver URL Pública"
                              >
                                <FileText className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Card View */}
              {viewMode === 'cards' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {contracts.map((contract) => (
                      <ContractCard key={contract.id} contract={contract} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              <PaginationControls />
            </>
          )}
        </div>
      </div>
    </>
  );
}
