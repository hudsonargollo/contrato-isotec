// @ts-nocheck - Suppress array indexing type errors with react-hook-form
'use client';

/**
 * Step 5: Service Scope
 * Service checklist with 6 default services and custom options
 * Requirements: 1.7, 12.3, 12.4
 */

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

const DEFAULT_SERVICES = [
  'Projeto elétrico e estrutural',
  'Instalação de painéis solares',
  'Instalação de inversor e string box',
  'Cabeamento e conexões elétricas',
  'Homologação junto à concessionária',
  'Treinamento e documentação técnica',
];

export function Step5Services() {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'services',
  });

  const services = watch('services');

  // Initialize with default services if empty
  useEffect(() => {
    if (fields.length === 0) {
      DEFAULT_SERVICES.forEach((service) => {
        append({
          description: service,
          included: true,
        });
      });
    }
  }, [fields.length, append]);

  const addCustomService = () => {
    append({
      description: '',
      included: true,
    });
  };

  const toggleService = (index: number) => {
    const currentValue = services[index]?.included;
    setValue(`services.${index}.included`, !currentValue);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Service Items */}
        {fields.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
            <p className="text-muted-foreground">Carregando serviços padrão...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const isDefaultService = index < DEFAULT_SERVICES.length;
              const isIncluded = services[index]?.included;

              return (
                <div
                  key={field.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isIncluded
                      ? 'border-green-700 bg-green-900/10'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      id={`service-${index}`}
                      checked={isIncluded}
                      onCheckedChange={() => toggleService(index)}
                      className="mt-1"
                    />

                    {/* Service Description */}
                    <div className="flex-1">
                      {isDefaultService ? (
                        <Label
                          htmlFor={`service-${index}`}
                          className={`cursor-pointer ${
                            !isIncluded && 'text-muted-foreground line-through'
                          }`}
                        >
                          {services[index]?.description}
                        </Label>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder="Descrição do serviço personalizado"
                            value={services[index]?.description || ''}
                            onChange={(e) =>
                              setValue(`services.${index}.description`, e.target.value)
                            }
                            className={
                              errors.services?.[index]?.description
                                ? 'border-red-500'
                                : ''
                            }
                          />
                          {errors.services?.[index]?.description && (
                            <p className="text-sm text-red-500">
                              {(errors.services[index] as any)?.description?.message as string}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remove Button (only for custom services) */}
                    {!isDefaultService && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Custom Service Button */}
            <Button
              type="button"
              onClick={addCustomService}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Serviço Personalizado
            </Button>
          </div>
        )}

        {/* Error for empty array */}
        {errors.services && !Array.isArray(errors.services) && (
          <p className="text-sm text-red-500">
            {errors.services.message as string}
          </p>
        )}

        {/* Summary */}
        {services && services.length > 0 && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-2">
              Resumo dos Serviços
            </h4>
            <p className="text-sm text-gray-300">
              <strong>{services.filter((s: any) => s.included).length}</strong> de{' '}
              <strong>{services.length}</strong> serviços incluídos no contrato
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Dica:</strong> Marque os serviços que serão incluídos no contrato. 
          Você pode adicionar serviços personalizados além dos 6 serviços padrão.
        </p>
      </div>
    </div>
  );
}
