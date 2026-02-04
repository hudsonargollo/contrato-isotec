'use client';

/**
 * Step 6: Financial Details
 * Contract value and payment method
 * Requirements: 1.8, 13.1, 13.3
 */

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency, parseCurrency } from '@/lib/validation/currency';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';

export function Step6Financial() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const contractValue = watch('contractValue');
  const paymentMethod = watch('paymentMethod');

  // Handle currency input formatting
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrency(rawValue);
    
    if (!isNaN(numericValue)) {
      setValue('contractValue', numericValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Contract Value */}
        <div className="space-y-2">
          <Label htmlFor="contractValue">
            Valor do Contrato <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="contractValue"
              type="text"
              {...register('contractValue', {
                valueAsNumber: true,
              })}
              onChange={handleValueChange}
              placeholder="0,00"
              className={`pl-10 ${errors.contractValue ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.contractValue && (
            <p className="text-sm text-red-500">
              {errors.contractValue.message as string}
            </p>
          )}
          {contractValue > 0 && (
            <p className="text-sm text-green-500">
              {formatCurrency(contractValue)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Valor total do contrato incluindo equipamentos e serviços
          </p>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label>
            Forma de Pagamento <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setValue('paymentMethod', value)}
          >
            {/* PIX */}
            <div
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'pix'
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setValue('paymentMethod', 'pix')}
            >
              <RadioGroupItem value="pix" id="payment-pix" />
              <div className="flex items-center gap-3 flex-1">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <div>
                  <Label htmlFor="payment-pix" className="cursor-pointer font-medium">
                    PIX
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Transferência instantânea
                  </p>
                </div>
              </div>
            </div>

            {/* Cash */}
            <div
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setValue('paymentMethod', 'cash')}
            >
              <RadioGroupItem value="cash" id="payment-cash" />
              <div className="flex items-center gap-3 flex-1">
                <Banknote className="w-5 h-5 text-green-500" />
                <div>
                  <Label htmlFor="payment-cash" className="cursor-pointer font-medium">
                    Dinheiro
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Pagamento em espécie
                  </p>
                </div>
              </div>
            </div>

            {/* Credit */}
            <div
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'credit'
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setValue('paymentMethod', 'credit')}
            >
              <RadioGroupItem value="credit" id="payment-credit" />
              <div className="flex items-center gap-3 flex-1">
                <CreditCard className="w-5 h-5 text-purple-500" />
                <div>
                  <Label htmlFor="payment-credit" className="cursor-pointer font-medium">
                    Cartão de Crédito
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Parcelamento disponível
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          {errors.paymentMethod && (
            <p className="text-sm text-red-500">
              {errors.paymentMethod.message as string}
            </p>
          )}
        </div>

        {/* Financial Summary */}
        {contractValue > 0 && paymentMethod && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-2">
              Resumo Financeiro
            </h4>
            <div className="space-y-1 text-sm text-gray-300">
              <p>
                <strong>Valor Total:</strong> {formatCurrency(contractValue)}
              </p>
              <p>
                <strong>Forma de Pagamento:</strong>{' '}
                {paymentMethod === 'pix' && 'PIX'}
                {paymentMethod === 'cash' && 'Dinheiro'}
                {paymentMethod === 'credit' && 'Cartão de Crédito'}
              </p>
              {contractValue > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Valor por kWp: {formatCurrency(contractValue / watch('projectKWp'))}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Dica:</strong> O valor do contrato deve incluir todos os equipamentos, 
          serviços e custos relacionados à instalação do sistema fotovoltaico.
        </p>
      </div>
    </div>
  );
}
