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
import { Grid, GridItem } from '@/components/ui/grid';

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image
                src="/isotec-logo.webp"
                alt="ISOTEC Logo"
                width={160}
                height={53}
                className="h-8 sm:h-10 lg:h-12 w-auto"
                priority
              />
              <div className="h-6 sm:h-8 w-px bg-neutral-700" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">
                Contrato de Instalação Fotovoltaica
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {contract.status === 'signed' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-energy-500" />
                  <span className="text-lg font-medium text-energy-400">
                    Contrato Assinado
                  </span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full border-2 border-solar-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-solar-500 animate-pulse" />
                  </div>
                  <span className="text-lg font-medium text-solar-400">
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
              className="h-16 sm:h-20 w-auto"
            />
          </div>

          {/* Critical Customer Information Grid - Prioritized at top */}
          <Grid 
            columns={{ mobile: 1, tablet: 2, desktop: 3 }}
            gap="sm"
            className="mb-4"
          >
            {/* Contractor Information - Most Critical */}
            <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-solar-500" />
                Identificação do Contratante
              </h2>
              <div className="space-y-2 text-neutral-300">
                <div>
                  <p className="text-xs text-neutral-400">Nome Completo</p>
                  <p className="text-sm font-medium">{contract.contractor_name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">CPF</p>
                  <p className="text-sm font-medium">{formatCPF(contract.contractor_cpf)}</p>
                </div>
                {contract.contractor_email && (
                  <div>
                    <p className="text-xs text-neutral-400">E-mail</p>
                    <p className="text-sm font-medium break-all">{contract.contractor_email}</p>
                  </div>
                )}
                {contract.contractor_phone && (
                  <div>
                    <p className="text-xs text-neutral-400">Telefone</p>
                    <p className="text-sm font-medium">{contract.contractor_phone}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Project Specifications - Critical for understanding scope */}
            <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-solar-500" />
                Especificações do Projeto
              </h2>
              <div className="space-y-2 text-neutral-300">
                <div>
                  <p className="text-xs text-neutral-400">Potência do Sistema</p>
                  <p className="text-xl font-bold text-solar-400">
                    {contract.project_kwp} kWp
                  </p>
                  <p className="text-xs text-neutral-500">
                    Estimativa: ~{(contract.project_kwp * 120).toFixed(0)} kWh/mês
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data de Instalação
                  </p>
                  <p className="text-sm font-medium">{installationDateFormatted}</p>
                </div>
              </div>
            </section>

            {/* Financial Information - Critical for contract value */}
            <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-solar-500" />
                Informações Financeiras
              </h2>
              <div className="space-y-2 text-neutral-300">
                <div>
                  <p className="text-xs text-neutral-400">Valor Total do Contrato</p>
                  <p className="text-xl font-bold text-energy-400">
                    {formatCurrency(parseFloat(contract.contract_value))}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Por kWp: {formatCurrency(parseFloat(contract.contract_value) / contract.project_kwp)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Forma de Pagamento</p>
                  <p className="text-sm font-medium">
                    {contract.payment_method === 'pix' && 'PIX'}
                    {contract.payment_method === 'cash' && 'Dinheiro'}
                    {contract.payment_method === 'credit' && 'Cartão de Crédito'}
                  </p>
                </div>
              </div>
            </section>
          </Grid>

          {/* Installation Address - Secondary priority, spans full width for better readability */}
          <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-solar-500" />
              Endereço da Instalação
            </h2>
            <Grid 
              columns={{ mobile: 1, tablet: 2, desktop: 4 }}
              gap="sm"
              className="text-neutral-300"
            >
              <GridItem>
                <p className="text-xs text-neutral-400">CEP</p>
                <p className="text-sm font-medium">{formatCEP(contract.address_cep)}</p>
              </GridItem>
              <GridItem span={2}>
                <p className="text-xs text-neutral-400">Endereço</p>
                <p className="text-sm font-medium">
                  {contract.address_street}, {contract.address_number}
                  {contract.address_complement && ` - ${contract.address_complement}`}
                </p>
              </GridItem>
              <GridItem>
                <p className="text-xs text-neutral-400">Bairro</p>
                <p className="text-sm font-medium">{contract.address_neighborhood}</p>
              </GridItem>
              <GridItem>
                <p className="text-xs text-neutral-400">Cidade</p>
                <p className="text-sm font-medium">{contract.address_city}</p>
              </GridItem>
              <GridItem>
                <p className="text-xs text-neutral-400">Estado</p>
                <p className="text-sm font-medium">{contract.address_state}</p>
              </GridItem>
              {contract.location_latitude && contract.location_longitude && (
                <GridItem span={2}>
                  <p className="text-xs text-neutral-400">Coordenadas Geográficas</p>
                  <p className="text-sm font-medium font-mono">
                    {formatCoordinates(
                      parseFloat(contract.location_latitude),
                      parseFloat(contract.location_longitude)
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Precisão ~1mm para mockup 3D
                  </p>
                </GridItem>
              )}
            </Grid>
          </section>

          {/* Secondary Information Grid - Equipment and Services */}
          <Grid 
            columns={{ mobile: 1, tablet: 1, desktop: 2 }}
            gap="sm"
          >
            {/* Equipment List */}
            <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-solar-500" />
                Lista de Equipamentos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-neutral-300 text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-2 px-2 text-xs font-medium text-neutral-400">
                        Item
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-neutral-400">
                        Qtd
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-neutral-400">
                        Un.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.contract_items
                      ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                      .map((item: any) => (
                        <tr key={item.id} className="border-b border-neutral-800">
                          <td className="py-2 px-2 text-xs">{item.item_name}</td>
                          <td className="text-center py-2 px-2 text-xs">{item.quantity}</td>
                          <td className="text-center py-2 px-2 text-xs">{item.unit}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Service Scope */}
            <section className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-solar-500" />
                Escopo de Serviços
              </h2>
              <div className="space-y-2">
                {contract.services
                  ?.filter((service: any) => service.included)
                  .map((service: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-energy-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{service.description}</span>
                    </div>
                  ))}
              </div>
            </section>
          </Grid>

          {/* Signature Section */}
          {contract.status === 'pending_signature' && (
            <div className="mt-4">
              <EmailSignature 
                contractId={contract.id}
                contractorEmail={contract.contractor_email || undefined}
              />
            </div>
          )}

          {contract.status === 'signed' && contract.signed_at && (
            <section className="bg-energy-900/20 border border-energy-700 rounded-xl p-4 sm:p-6 mt-4">
              <div className="text-center">
                <CheckCircle2 className="w-10 h-10 text-energy-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-energy-400 mb-1">
                  Contrato Assinado
                </h3>
                <p className="text-sm text-neutral-300">
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
                  <p className="text-xs text-neutral-500 mt-1 font-mono">
                    Hash: {contract.contract_hash.substring(0, 16)}...
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-700 bg-neutral-900 mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-neutral-400 text-sm">
          <p>© 2024 ISOTEC - Soluções em Energia Solar</p>
          <p className="mt-1">Contrato gerado digitalmente e protegido por assinatura eletrônica</p>
        </div>
      </footer>
    </div>
  );
}
