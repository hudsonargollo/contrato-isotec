/**
 * Admin Contract Detail Page
 * Displays full contract details with audit logs and admin actions
 * 
 * Requirements: 9.5, 9.6
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/ui/admin-layout';
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
      <AdminLayout userInfo={{ name: 'Administrador', role: 'Admin' }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-solar-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-400">Carregando contrato...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !contract) {
    return (
      <AdminLayout userInfo={{ name: 'Administrador', role: 'Admin' }}>
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
      </AdminLayout>
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
    <AdminLayout userInfo={{ name: 'Administrador', role: 'Admin' }}>
      {/* Header with actions */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/contracts"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos Contratos
            </Link>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="bg-ocean-500 hover:bg-ocean-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadingPDF ? 'Gerando PDF...' : 'Baixar PDF'}
              </Button>
              
              <Link
                href={`/contracts/${contract.uuid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-solar-500 hover:bg-solar-600 text-neutral-900">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver URL Pública
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Badge */}
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {contract.status === 'signed' ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <div>
                        <span className="text-lg font-medium text-green-400 block">
                          Contrato Assinado
                        </span>
                        {contract.signed_at && (
                          <span className="text-sm text-neutral-400">
                            {new Date(contract.signed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="w-6 h-6 text-yellow-500" />
                      <span className="text-lg font-medium text-yellow-400">
                        Aguardando Assinatura
                      </span>
                    </>
                  )}
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

            {/* Contractor Information */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-solar-400" />
                Identificação do Contratante
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-neutral-300">
                <div>
                  <p className="text-sm text-neutral-400">Nome Completo</p>
                  <p className="text-lg font-medium">{contract.contractor_name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">CPF</p>
                  <p className="text-lg font-medium">{formatCPF(contract.contractor_cpf)}</p>
                </div>
                {contract.contractor_email && (
                  <div>
                    <p className="text-sm text-neutral-400">E-mail</p>
                    <p className="text-lg font-medium">{contract.contractor_email}</p>
                  </div>
                )}
                {contract.contractor_phone && (
                  <div>
                    <p className="text-sm text-neutral-400">Telefone</p>
                    <p className="text-lg font-medium">{contract.contractor_phone}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Installation Address */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-solar-400" />
                Endereço da Instalação
              </h2>
              <div className="space-y-3 text-neutral-300">
                <div>
                  <p className="text-sm text-neutral-400">CEP</p>
                  <p className="text-lg font-medium">{formatCEP(contract.address_cep)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Endereço</p>
                  <p className="text-lg font-medium">
                    {contract.address_street}, {contract.address_number}
                    {contract.address_complement && ` - ${contract.address_complement}`}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-neutral-400">Bairro</p>
                    <p className="text-lg font-medium">{contract.address_neighborhood}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Cidade</p>
                    <p className="text-lg font-medium">{contract.address_city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Estado</p>
                    <p className="text-lg font-medium">{contract.address_state}</p>
                  </div>
                </div>
                {contract.location_latitude && contract.location_longitude && (
                  <div className="pt-3 border-t border-neutral-700">
                    <p className="text-sm text-neutral-400">Coordenadas Geográficas</p>
                    <p className="text-lg font-medium font-mono">
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
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-solar-400" />
                Especificações do Projeto
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-neutral-300">
                <div>
                  <p className="text-sm text-neutral-400">Potência do Sistema</p>
                  <p className="text-2xl font-bold text-solar-400">
                    {contract.project_kwp} kWp
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Estimativa de geração: ~{(parseFloat(contract.project_kwp) * 120).toFixed(0)} kWh/mês
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data de Instalação
                  </p>
                  <p className="text-lg font-medium">{installationDateFormatted}</p>
                </div>
              </div>
            </section>

            {/* Equipment List */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-solar-400" />
                Lista de Equipamentos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-neutral-300">
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
                      .map((item) => (
                        <tr key={item.id} className="border-b border-neutral-800">
                          <td className="py-3 px-4">{item.item_name}</td>
                          <td className="text-center py-3 px-4">{item.quantity}</td>
                          <td className="text-center py-3 px-4">{item.unit}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Service Scope */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-solar-400" />
                Escopo de Serviços
              </h2>
              <div className="space-y-3">
                {contract.services
                  ?.filter((service) => service.included)
                  .map((service, index) => (
                    <div key={index} className="flex items-start gap-3 text-neutral-300">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{service.description}</span>
                    </div>
                  ))}
              </div>
            </section>

            {/* Financial Information */}
            <section className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-solar-400" />
                Informações Financeiras
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-neutral-300">
                <div>
                  <p className="text-sm text-neutral-400">Valor Total do Contrato</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(parseFloat(contract.contract_value))}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Valor por kWp: {formatCurrency(parseFloat(contract.contract_value) / parseFloat(contract.project_kwp))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Forma de Pagamento</p>
                  <p className="text-lg font-medium">
                    {contract.payment_method === 'pix' && 'PIX'}
                    {contract.payment_method === 'cash' && 'Dinheiro'}
                    {contract.payment_method === 'credit' && 'Cartão de Crédito'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Audit Log Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
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
    </AdminLayout>
  );
}
