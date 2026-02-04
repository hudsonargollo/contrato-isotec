'use client';

/**
 * Step 7: Review and Submit
 * Display all entered data for review before submission
 * Requirements: 1.9
 */

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { formatCPF } from '@/lib/validation/cpf';
import { formatCEP } from '@/lib/validation/cep';
import { formatCurrency } from '@/lib/validation/currency';
import { formatCoordinates } from '@/lib/services/googlemaps';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, CheckCircle2 } from 'lucide-react';

interface Step7ReviewProps {
  onEditStep: (step: number) => void;
}

export function Step7Review({ onEditStep }: Step7ReviewProps) {
  const { watch } = useFormContext();

  const formData = watch();

  return (
    <div className="space-y-6">
      {/* Contractor Information */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Identificação do Contratante
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Nome:</strong> {formData.contractorName}
          </p>
          <p>
            <strong>CPF:</strong> {formatCPF(formData.contractorCPF)}
          </p>
          {formData.contractorEmail && (
            <p>
              <strong>E-mail:</strong> {formData.contractorEmail}
            </p>
          )}
          {formData.contractorPhone && (
            <p>
              <strong>Telefone:</strong> {formData.contractorPhone}
            </p>
          )}
        </div>
      </div>

      {/* Installation Address */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Endereço da Instalação
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <strong>CEP:</strong> {formatCEP(formData.addressCEP)}
          </p>
          <p>
            <strong>Endereço:</strong> {formData.addressStreet}, {formData.addressNumber}
            {formData.addressComplement && ` - ${formData.addressComplement}`}
          </p>
          <p>
            <strong>Bairro:</strong> {formData.addressNeighborhood}
          </p>
          <p>
            <strong>Cidade/Estado:</strong> {formData.addressCity} - {formData.addressState}
          </p>
          {formData.locationLatitude && formData.locationLongitude && (
            <p>
              <strong>Coordenadas:</strong>{' '}
              {formatCoordinates(formData.locationLatitude, formData.locationLongitude)}
            </p>
          )}
        </div>
      </div>

      {/* Project Specifications */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Especificações do Projeto
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(3)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Potência do Sistema:</strong> {formData.projectKWp} kWp
          </p>
          {formData.installationDate && (
            <p>
              <strong>Data de Instalação:</strong>{' '}
              {format(new Date(formData.installationDate), 'PPP', { locale: ptBR })}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Estimativa de geração mensal: ~{(formData.projectKWp * 120).toFixed(0)} kWh
          </p>
        </div>
      </div>

      {/* Equipment List */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Lista de Equipamentos
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(4)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Quantidade</th>
                <th className="text-center py-2">Unidade</th>
              </tr>
            </thead>
            <tbody>
              {formData.items?.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="py-2">{item.itemName}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-center py-2">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Scope */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Escopo de Serviços
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(5)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="space-y-2">
          {formData.services
            ?.filter((service: any) => service.included)
            .map((service: any, index: number) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{service.description}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Financial Details */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Informações Financeiras
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(6)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Valor Total:</strong> {formatCurrency(formData.contractValue)}
          </p>
          <p>
            <strong>Forma de Pagamento:</strong>{' '}
            {formData.paymentMethod === 'pix' && 'PIX'}
            {formData.paymentMethod === 'cash' && 'Dinheiro'}
            {formData.paymentMethod === 'credit' && 'Cartão de Crédito'}
          </p>
          {formData.projectKWp > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Valor por kWp: {formatCurrency(formData.contractValue / formData.projectKWp)}
            </p>
          )}
        </div>
      </div>

      {/* Final Confirmation */}
      <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
        <p className="text-sm text-yellow-400">
          <strong>Atenção:</strong> Revise todas as informações antes de criar o contrato. 
          Após a criação, o contrato será enviado para assinatura digital.
        </p>
      </div>
    </div>
  );
}
