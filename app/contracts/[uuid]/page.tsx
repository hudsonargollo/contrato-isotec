/**
 * Public Contract View Page
 * Displays contract details accessible via UUID (no authentication required)
 * 
 * Requirements: 7.2, 7.3, 7.4, 3A.5
 */

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatCPF } from '@/lib/validation/cpf';
import { formatCEP } from '@/lib/validation/cep';
import { formatCurrency } from '@/lib/validation/currency';
import { formatCoordinates } from '@/lib/services/googlemaps';
import { CheckCircle2, MapPin, Calendar, Zap, Package, Wrench, DollarSign } from 'lucide-react';
import { EmailSignature } from '@/components/contract/EmailSignature';

interface ContractPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default async function ContractPage({ params }: ContractPageProps) {
  const { uuid } = await params;
  
  // Get Supabase client (no auth required for public view)
  const supabase = await createClient();

  // Fetch contract by UUID
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, contract_items(*)')
    .eq('uuid', uuid)
    .single();

  if (error || !contract) {
    notFound();
  }

  // Format installation date if available
  const installationDateFormatted = contract.installation_date
    ? new Date(contract.installation_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'A definir';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/isotec-logo.webp"
                alt="ISOTEC Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
              <div className="h-8 w-px bg-gray-700" />
              <h1 className="text-xl font-semibold text-white">
                Contrato de Instalação Fotovoltaica
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {contract.status === 'signed' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-lg font-medium text-green-400">
                    Contrato Assinado
                  </span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  </div>
                  <span className="text-lg font-medium text-yellow-400">
                    Aguardando Assinatura
                  </span>
                </>
              )}
            </div>
            
            {/* Mascot */}
            <Image
              src="/mascote.webp"
              alt="ISOTEC Mascot"
              width={80}
              height={80}
              className="h-20 w-auto"
            />
          </div>

          {/* Contractor Information */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-yellow-500" />
              Identificação do Contratante
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="text-sm text-gray-400">Nome Completo</p>
                <p className="text-lg font-medium">{contract.contractor_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">CPF</p>
                <p className="text-lg font-medium">{formatCPF(contract.contractor_cpf)}</p>
              </div>
              {contract.contractor_email && (
                <div>
                  <p className="text-sm text-gray-400">E-mail</p>
                  <p className="text-lg font-medium">{contract.contractor_email}</p>
                </div>
              )}
              {contract.contractor_phone && (
                <div>
                  <p className="text-sm text-gray-400">Telefone</p>
                  <p className="text-lg font-medium">{contract.contractor_phone}</p>
                </div>
              )}
            </div>
          </section>

          {/* Installation Address */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-yellow-500" />
              Endereço da Instalação
            </h2>
            <div className="space-y-3 text-gray-300">
              <div>
                <p className="text-sm text-gray-400">CEP</p>
                <p className="text-lg font-medium">{formatCEP(contract.address_cep)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Endereço</p>
                <p className="text-lg font-medium">
                  {contract.address_street}, {contract.address_number}
                  {contract.address_complement && ` - ${contract.address_complement}`}
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Bairro</p>
                  <p className="text-lg font-medium">{contract.address_neighborhood}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cidade</p>
                  <p className="text-lg font-medium">{contract.address_city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estado</p>
                  <p className="text-lg font-medium">{contract.address_state}</p>
                </div>
              </div>
              {contract.location_latitude && contract.location_longitude && (
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-400">Coordenadas Geográficas</p>
                  <p className="text-lg font-medium font-mono">
                    {formatCoordinates(
                      parseFloat(contract.location_latitude),
                      parseFloat(contract.location_longitude)
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Precisão de 8 casas decimais (~1mm) para geração de mockup 3D
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Project Specifications */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Especificações do Projeto
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="text-sm text-gray-400">Potência do Sistema</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {contract.project_kwp} kWp
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estimativa de geração: ~{(contract.project_kwp * 120).toFixed(0)} kWh/mês
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Instalação
                </p>
                <p className="text-lg font-medium">{installationDateFormatted}</p>
              </div>
            </div>
          </section>

          {/* Equipment List - Will be rendered in Task 10.2 */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-500" />
              Lista de Equipamentos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Item
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Quantidade
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      Unidade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contract.contract_items
                    ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                    .map((item: any) => (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-3 px-4">{item.item_name}</td>
                        <td className="text-center py-3 px-4">{item.quantity}</td>
                        <td className="text-center py-3 px-4">{item.unit}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Service Scope - Will be enhanced in Task 10.2 */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-yellow-500" />
              Escopo de Serviços
            </h2>
            <div className="space-y-3">
              {contract.services
                ?.filter((service: any) => service.included)
                .map((service: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{service.description}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Financial Information */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              Informações Financeiras
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="text-sm text-gray-400">Valor Total do Contrato</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatCurrency(parseFloat(contract.contract_value))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Valor por kWp: {formatCurrency(parseFloat(contract.contract_value) / contract.project_kwp)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Forma de Pagamento</p>
                <p className="text-lg font-medium">
                  {contract.payment_method === 'pix' && 'PIX'}
                  {contract.payment_method === 'cash' && 'Dinheiro'}
                  {contract.payment_method === 'credit' && 'Cartão de Crédito'}
                </p>
              </div>
            </div>
          </section>

          {/* Signature Section */}
          {contract.status === 'pending_signature' && (
            <EmailSignature 
              contractId={contract.id}
              contractorEmail={contract.contractor_email || undefined}
            />
          )}

          {contract.status === 'signed' && contract.signed_at && (
            <section className="bg-green-900/20 border border-green-700 rounded-lg p-6">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-green-400 mb-2">
                  Contrato Assinado
                </h3>
                <p className="text-gray-300">
                  Assinado em{' '}
                  {new Date(contract.signed_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {contract.contract_hash && (
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    Hash: {contract.contract_hash.substring(0, 16)}...
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-900/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>© 2024 ISOTEC - Soluções em Energia Solar</p>
          <p className="mt-1">Contrato gerado digitalmente e protegido por assinatura eletrônica</p>
        </div>
      </footer>
    </div>
  );
}
