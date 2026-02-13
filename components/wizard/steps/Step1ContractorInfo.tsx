'use client';

/**
 * Step 1: Contractor Identification
 * Collects contractor name, CPF, email, and phone
 * Requirements: 1.2, 2.4
 */

import { useFormContext } from 'react-hook-form';
import { MobileFormField, MobileInputTypes } from '@/components/ui/mobile-form-field';
import { Label } from '@/components/ui/label';

export function Step1ContractorInfo() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const cpfValue = watch('contractorCPF') || '';

  // Handle CPF formatting on change (not blur to avoid clearing)
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitized = value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 11 digits max
    if (sanitized.length > 11) {
      return;
    }
    
    // Format as user types
    let formatted = sanitized;
    if (sanitized.length > 3) {
      if (sanitized.length <= 6) {
        formatted = sanitized.replace(/(\d{3})(\d+)/, '$1.$2');
      } else if (sanitized.length <= 9) {
        formatted = sanitized.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
      } else {
        formatted = sanitized.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
      }
    }
    
    setValue('contractorCPF', formatted, { shouldValidate: true });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step Title - Compact */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Identificação</h2>
        <p className="text-sm text-neutral-400">Dados do contratante</p>
      </div>

      {/* Form Fields - Optimized Grid */}
      <div className="flex-1 space-y-4">
        {/* Name - Full Width */}
        <div>
          <Label htmlFor="contractorName" className="text-sm font-medium text-neutral-300">
            Nome Completo <span className="text-red-400">*</span>
          </Label>
          <MobileFormField
            id="contractorName"
            {...register('contractorName')}
            placeholder="Digite o nome completo"
            className={`mt-1 ${errors.contractorName ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            autoCapitalize="words"
            autoComplete="name"
          />
          {errors.contractorName && (
            <p className="text-xs text-red-400 mt-1">
              {errors.contractorName.message as string}
            </p>
          )}
        </div>

        {/* CPF - Full Width */}
        <div>
          <Label htmlFor="contractorCPF" className="text-sm font-medium text-neutral-300">
            CPF <span className="text-red-400">*</span>
          </Label>
          <MobileFormField
            id="contractorCPF"
            name="contractorCPF"
            value={cpfValue}
            placeholder="000.000.000-00"
            onChange={handleCPFChange}
            maxLength={14}
            mobileKeyboardType="numeric"
            className={`mt-1 ${errors.contractorCPF ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
            autoComplete="off"
          />
          {errors.contractorCPF && (
            <p className="text-xs text-red-400 mt-1">
              {errors.contractorCPF.message as string}
            </p>
          )}
        </div>

        {/* Email and Phone - Side by Side on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contractorEmail" className="text-sm font-medium text-neutral-300">
              E-mail <span className="text-xs text-neutral-500">(opcional)</span>
            </Label>
            <MobileInputTypes.Email
              id="contractorEmail"
              {...register('contractorEmail')}
              placeholder="email@exemplo.com"
              className={`mt-1 ${errors.contractorEmail ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
              autoComplete="email"
              autoCapitalize="none"
            />
            {errors.contractorEmail && (
              <p className="text-xs text-red-400 mt-1">
                {errors.contractorEmail.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="contractorPhone" className="text-sm font-medium text-neutral-300">
              Telefone <span className="text-xs text-neutral-500">(opcional)</span>
            </Label>
            <MobileInputTypes.Phone
              id="contractorPhone"
              {...register('contractorPhone')}
              placeholder="(11) 98765-4321"
              className={`mt-1 ${errors.contractorPhone ? 'border-red-500' : 'border-neutral-600'} bg-neutral-700/50 text-white placeholder-neutral-400`}
              autoComplete="tel"
            />
            {errors.contractorPhone && (
              <p className="text-xs text-red-400 mt-1">
                {errors.contractorPhone.message as string}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Tip - Compact */}
      <div className="mt-6 p-3 bg-solar-500/10 border border-solar-500/20 rounded-lg">
        <p className="text-xs text-solar-300">
          💡 O CPF será validado automaticamente
        </p>
      </div>
    </div>
  );
}
