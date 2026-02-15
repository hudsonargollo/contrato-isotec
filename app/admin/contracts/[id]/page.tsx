/**
 * Admin Contract Detail Page
 * Displays full contract details with audit logs and admin actions
 * Enhanced with responsive design and improved UI/UX
 * 
 * Requirements: 9.5, 9.6, 7.4, 7.6
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Client component for admin contract details
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Zap, 
  Package, 
  Wrench, 
  DollarSign,
  Clock,
  Shield,
  Edit,
  Trash2,
  Copy,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCPF } from '@/lib/validation/cpf';
import { formatCEP } from '@/lib/validation/cep';
import { formatCurrency } from '@/lib/validation/currency';
import { formatCoordinates } from '@/lib/services/googlemaps';

interface ContractItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  sort_order: number;
}

interface ServiceItem {
  description: string;
  included: boolean;
}

interface AuditLog {
  id: string;
  event_type: string;
  signature_method: string;
  contract_hash: string;
  signer_identifier: string | null;
  ip_address: string;
  created_at: string;
}

interface Contract {
  id: string;
  uuid: string;
  contractor_name: string;
  contractor_cpf: string;
  contractor_email: string | null;
  contractor_phone: string | null;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  location_latitude: string | null;
  location_longitude: string | null;
  project_kwp: string;
  installation_date: string | null;
  services: ServiceItem[];
  contract_value: string;
  payment_method: string;
  status: string;
  contract_hash: string | null;
  created_at: string;
  signed_at: string | null;
  contract_items: ContractItem[];
  auditLogs: AuditLog[];
}

interface ContractDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContractDetailPage({ params }: ContractDetailPageProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setContractId(id);
      fetchContract(id);
    });
  }, [params]);

  const fetchContract = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Contrato não encontrado');
        } else if (response.status === 401) {
          setError('Não autorizado. Faça login como administrador.');
        } else {
          setError('Erro ao carregar contrato');
        }
        return;
      }

      const data = await response.json();
      setContract(data.contract);
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Erro ao carregar contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contractId) return;
    
    try {
      setDownloadingPDF(true);
      const response = await fetch(`/api/contracts/${contractId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${contract?.contractor_name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Erro ao baixar PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleCopyUUID = async () => {
    if (!contract?.uuid) return;
    
    try {
      await navigator.clipboard.writeText(contract.uuid);
      // You could add a toast notification here
      alert('UUID copiado para a área de transferência');
    } catch (err) {
      console.error('Error copying UUID:', err);
      alert('Erro ao copiar UUID');
    }
  };

  const handleDeleteContract = async () => {
    if (!contractId) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir contrato');
      }
      
      // Redirect to contracts list
      window.location.href = '/admin/contracts';
    } catch (err) {
      console.error('Error deleting contract:', err);
      alert('Erro ao excluir contrato');
      setDeleting(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || ''}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      signature_initiated: 'Assinatura Iniciada',
      signature_completed: 'Assinatura Concluída',
      signature_failed: 'Assinatura Falhou'
    };
    return labels[eventType] || eventType;
  };

  const getSignatureMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      govbr: 'GOV.BR',
      email: 'E-mail'
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-solar-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-400">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/admin/contracts"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Contratos
        </Link>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <p className="text-red-400 text-xl mb-4">{error}</p>
            <Link
              href="/admin/contracts"
              className="text-solar-400 hover:text-solar-300"
            >
              Voltar aos Contratos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const installationDateFormatted = contract.installation_date
    ? new Date(contract.installation_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'A definir';

  return (
    <>
      <div className="bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/contracts"
                className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar aos Contratos
              </Link>
              
              <div className="hidden sm:block w-px h-6 bg-neutral-600" />
              
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-white">
                  {contract.contractor_name}
                </h1>
                {getStatusBadge(contract.status)}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUUID}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                UUID
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="border-ocean-500 text-ocean-400 hover:bg-ocean-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadingPDF ? 'Gerando...' : 'PDF'}
              </Button>
              
              <Link
                href={`/contracts/${contract.uuid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-solar-500 text-solar-400 hover:bg-solar-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Público
                </Button>
              </Link>
              
              <div className="flex items-center gap-1 border-l border-neutral-600 pl-2 ml-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  title="Editar Contrato"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                  title="Excluir Contrato"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Confirmar Exclusão</h3>
            </div>
            
            <p className="text-neutral-300 mb-6">
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteContract}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Contract Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Contract Overview Card */}
            <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {contract.status === 'signed' ? (
                    <>
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-green-400">
                          Contrato Assinado
                        </h2>
                        {contract.signed_at && (
                          <p className="text-sm text-neutral-400">
                            {new Date(contract.signed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-solar-500/10 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-solar-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-solar-400">
                          Aguardando Assinatura
                        </h2>
                        <p className="text-sm text-neutral-400">
                          Criado em {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(parseFloat(contract.contract_value))}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {contract.project_kwp} kWp
                    </p>
                  </div>
                  <Image
                    src="/mascote.webp"
                    alt="ISOTEC Mascot"
                    width={60}
                    height={60}
                    className="h-15 w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-solar-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{contract.project_kwp}</p>
                <p className="text-xs text-neutral-400">kWp</p>
              </div>
              
              <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-4 text-center">
                <Package className="w-6 h-6 text-ocean-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{contract.contract_items?.length || 0}</p>
                <p className="text-xs text-neutral-400">Equipamentos</p>
              </div>
              
              <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-4 text-center">
                <Wrench className="w-6 h-6 text-energy-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {contract.services?.filter(s => s.included).length || 0}
                </p>
                <p className="text-xs text-neutral-400">Serviços</p>
              </div>
              
              <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-4 text-center">
                <FileText className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{contract.auditLogs?.length || 0}</p>
                <p className="text-xs text-neutral-400">Eventos</p>
              </div>
            </div>

            {/* Contractor Information */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-solar-400" />
                Identificação do Contratante
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-400 mb-1">Nome Completo</p>
                    <p className="text-lg text-white">{contract.contractor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-400 mb-1">CPF</p>
                    <p className="text-lg font-mono text-white">{formatCPF(contract.contractor_cpf)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {contract.contractor_email && (
                    <div>
                      <p className="text-sm font-medium text-neutral-400 mb-1">E-mail</p>
                      <p className="text-lg text-white break-all">{contract.contractor_email}</p>
                    </div>
                  )}
                  {contract.contractor_phone && (
                    <div>
                      <p className="text-sm font-medium text-neutral-400 mb-1">Telefone</p>
                      <p className="text-lg text-white">{contract.contractor_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Installation Address */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-solar-400" />
                Endereço da Instalação
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-400 mb-1">CEP</p>
                    <p className="text-lg font-mono text-white">{formatCEP(contract.address_cep)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-neutral-400 mb-1">Endereço</p>
                    <p className="text-lg text-white">
                      {contract.address_street}, {contract.address_number}
                      {contract.address_complement && ` - ${contract.address_complement}`}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-400 mb-1">Bairro</p>
                    <p className="text-lg text-white">{contract.address_neighborhood}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-400 mb-1">Cidade</p>
                    <p className="text-lg text-white">{contract.address_city}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-400 mb-1">Estado</p>
                    <p className="text-lg text-white">{contract.address_state}</p>
                  </div>
                </div>
                
                {contract.location_latitude && contract.location_longitude && (
                  <div className="pt-4 border-t border-neutral-700">
                    <p className="text-sm font-medium text-neutral-400 mb-1">Coordenadas Geográficas</p>
                    <p className="text-lg font-mono text-white">
                      {formatCoordinates(
                        parseFloat(contract.location_latitude),
                        parseFloat(contract.location_longitude)
                      )}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Precisão de 8 casas decimais (~1mm) para geração de mockup 3D
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Project Specifications */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-solar-400" />
                Especificações do Projeto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-solar-500/10 to-solar-600/5 border border-solar-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-6 h-6 text-solar-400" />
                    <p className="text-sm font-medium text-neutral-400">Potência do Sistema</p>
                  </div>
                  <p className="text-3xl font-bold text-solar-400 mb-1">
                    {contract.project_kwp} kWp
                  </p>
                  <p className="text-xs text-neutral-500">
                    Estimativa de geração: ~{(parseFloat(contract.project_kwp) * 120).toFixed(0)} kWh/mês
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-ocean-500/10 to-ocean-600/5 border border-ocean-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-ocean-400" />
                    <p className="text-sm font-medium text-neutral-400">Data de Instalação</p>
                  </div>
                  <p className="text-lg font-semibold text-white">{installationDateFormatted}</p>
                </div>
              </div>
            </section>

            {/* Equipment List */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-solar-400" />
                Lista de Equipamentos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                        Item
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-neutral-400">
                        Quantidade
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-neutral-400">
                        Unidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.contract_items
                      ?.sort((a, b) => a.sort_order - b.sort_order)
                      .map((item, index) => (
                        <tr key={item.id} className={`border-b border-neutral-800 ${index % 2 === 0 ? 'bg-neutral-900/20' : ''}`}>
                          <td className="py-4 px-4 text-white">{item.item_name}</td>
                          <td className="text-center py-4 px-4 text-white font-semibold">{item.quantity}</td>
                          <td className="text-center py-4 px-4 text-neutral-300">{item.unit}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Service Scope */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-solar-400" />
                Escopo de Serviços
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contract.services
                  ?.filter((service) => service.included)
                  .map((service, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-white">{service.description}</span>
                    </div>
                  ))}
              </div>
            </section>

            {/* Financial Information */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-solar-400" />
                Informações Financeiras
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-neutral-400 mb-2">Valor Total do Contrato</p>
                  <p className="text-3xl font-bold text-green-400 mb-1">
                    {formatCurrency(parseFloat(contract.contract_value))}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Valor por kWp: {formatCurrency(parseFloat(contract.contract_value) / parseFloat(contract.project_kwp))}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-ocean-500/10 to-ocean-600/5 border border-ocean-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-neutral-400 mb-2">Forma de Pagamento</p>
                  <p className="text-xl font-semibold text-white">
                    {contract.payment_method === 'pix' && 'PIX'}
                    {contract.payment_method === 'cash' && 'Dinheiro'}
                    {contract.payment_method === 'credit' && 'Cartão de Crédito'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Audit Log Timeline */}
          <div className="xl:col-span-1">
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-solar-400" />
                Histórico de Auditoria
              </h2>
              
              {contract.auditLogs && contract.auditLogs.length > 0 ? (
                <div className="space-y-4">
                  {contract.auditLogs.map((log, index) => (
                    <div key={log.id} className="relative">
                      {index !== contract.auditLogs.length - 1 && (
                        <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-neutral-700" />
                      )}
                      
                      <div className="flex gap-3">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full mt-1 ${
                            log.event_type === 'signature_completed' 
                              ? 'bg-green-500' 
                              : log.event_type === 'signature_failed'
                              ? 'bg-red-500'
                              : 'bg-solar-500'
                          }`} />
                        </div>
                        
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium text-white">
                            {getEventTypeLabel(log.event_type)}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {new Date(log.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-neutral-500">
                            <p>Método: {getSignatureMethodLabel(log.signature_method)}</p>
                            {log.signer_identifier && (
                              <p>Assinante: {log.signer_identifier}</p>
                            )}
                            <p>IP: {log.ip_address}</p>
                            {log.contract_hash && (
                              <p className="font-mono break-all">
                                Hash: {log.contract_hash.substring(0, 16)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">
                    Nenhum evento de auditoria registrado
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
