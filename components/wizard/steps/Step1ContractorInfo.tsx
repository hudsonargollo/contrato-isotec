'use client';

/**
 * Step 1: Contractor Identification
 * Collects contractor name, CPF, email, and phone
 * Requirements: 1.2, 2.4
 */

import { useFormContext } from 'react-hook-form';
import { MobileFormField, MobileInputTypes, MobileForm } from '@/components/ui/mobile-form-field';
import { Label } from '@/components/ui/label';
import { formatCPF } from '@/lib/validation/cpf';

export function Step1ContractorInfo() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const cpfValue = watch('contractorCPF');

  // Handle CPF formatting on blur
  const handleCPFBlur = () => {
    if (cpfValue) {
      setValue('contractorCPF', formatCPF(cpfValue));
    }
  };

  return (
    <MobileForm adjustForKeyboard={true}>
      <div className="space-y-6">
        <div className="space-y-4">
          {/* Contractor Name */}
          <div className="space-y-2">
            <Label htmlFor="contractorName">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <MobileFormField
              id="contractorName"
              {...register('contractorName')}
              placeholder="Digite o nome completo do contratante"
              className={errors.contractorName ? 'border-red-500' : ''}
              autoScrollOnFocus={true}
              autoCapitalize="words"
              autoComplete="name"
            />
            {errors.contractorName && (
              <p className="text-sm text-red-500">
                {errors.contractorName.message as string}
              </p>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="contractorCPF">
              CPF <span className="text-red-500">*</span>
            </Label>
            <MobileInputTypes.Number
              id="contractorCPF"
              {...register('contractorCPF')}
              placeholder="000.000.000-00"
              onBlur={handleCPFBlur}
              maxLength={14}
              className={errors.contractorCPF ? 'border-red-500' : ''}
              autoScrollOnFocus={true}
              autoComplete="off"
            />
            {errors.contractorCPF && (
              <p className="text-sm text-red-500">
                {errors.contractorCPF.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Digite apenas números ou use o formato XXX.XXX.XXX-XX
            </p>
          </div>

          {/* Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="contractorEmail">
              E-mail <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <MobileInputTypes.Email
              id="contractorEmail"
              {...register('contractorEmail')}
              placeholder="email@exemplo.com"
              className={errors.contractorEmail ? 'border-red-500' : ''}
              autoScrollOnFocus={true}
              autoComplete="email"
              autoCapitalize="none"
            />
            {errors.contractorEmail && (
              <p className="text-sm text-red-500">
                {errors.contractorEmail.message as string}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="contractorPhone">
              Telefone <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <MobileInputTypes.Phone
              id="contractorPhone"
              {...register('contractorPhone')}
              placeholder="(11) 98765-4321"
              className={errors.contractorPhone ? 'border-red-500' : ''}
              autoScrollOnFocus={true}
              autoComplete="tel"
            />
            {errors.contractorPhone && (
              <p className="text-sm text-red-500">
                {errors.contractorPhone.message as string}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Telefone para contato com o cliente
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Dica:</strong> O CPF será validado automaticamente. Certifique-se de que os dados estão corretos antes de prosseguir.
          </p>
        </div>
      </div>
    </MobileForm>
  );
}
