'use client';

/**
 * Step 3: Project Specifications
 * Collects kWp capacity and installation date
 * Requirements: 1.1
 */

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function Step3ProjectSpecs() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();

  const installationDate = watch('installationDate');
  const projectKWp = watch('projectKWp');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* kWp Capacity */}
        <div className="space-y-2">
          <Label htmlFor="projectKWp">
            Potência do Sistema (kWp) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectKWp"
            type="number"
            step="0.01"
            min="0"
            {...register('projectKWp', {
              valueAsNumber: true,
            })}
            placeholder="Ex: 5.5"
            className={errors.projectKWp ? 'border-red-500' : ''}
          />
          {errors.projectKWp && (
            <p className="text-sm text-red-500">
              {errors.projectKWp.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Capacidade total do sistema fotovoltaico em quilowatt-pico (kWp)
          </p>
        </div>

        {/* Installation Date */}
        <div className="space-y-2">
          <Label htmlFor="installationDate">
            Data de Instalação <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1 justify-start text-left font-normal',
                    !installationDate && 'text-muted-foreground',
                    errors.installationDate && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {installationDate ? (
                    format(new Date(installationDate), 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={installationDate ? new Date(installationDate) : undefined}
                  onSelect={(date: Date | undefined) => setValue('installationDate', date)}
                  initialFocus
                  locale={ptBR}
                  disabled={(date: Date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  fromDate={new Date()}
                />
              </PopoverContent>
            </Popover>
            {installationDate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('installationDate', undefined)}
                className="shrink-0"
              >
                ×
              </Button>
            )}
          </div>
          {errors.installationDate && (
            <p className="text-sm text-red-500">
              {errors.installationDate.message as string}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Data prevista para a instalação do sistema (apenas datas futuras)
          </p>
        </div>

        {/* Project Summary */}
        {projectKWp > 0 && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-2">
              Resumo do Projeto
            </h4>
            <div className="space-y-1 text-sm text-gray-300">
              <p>
                <strong>Potência:</strong> {projectKWp} kWp
              </p>
              {installationDate && (
                <p>
                  <strong>Instalação:</strong>{' '}
                  {format(new Date(installationDate), 'PPP', { locale: ptBR })}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Estimativa de geração mensal: ~{(projectKWp * 120).toFixed(0)} kWh
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Dica:</strong> A potência do sistema (kWp) é calculada com base na quantidade e capacidade dos painéis solares. 
          A data de instalação é opcional e pode ser definida posteriormente.
        </p>
      </div>
    </div>
  );
}
