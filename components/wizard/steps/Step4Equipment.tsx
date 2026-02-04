// @ts-nocheck - Suppress array indexing type errors with react-hook-form
'use client';

/**
 * Step 4: Equipment List
 * Dynamic equipment items with add/remove functionality
 * Requirements: 1.6, 12.2
 */

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export function Step4Equipment() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const addItem = () => {
    append({
      itemName: '',
      quantity: 1,
      unit: '',
      sortOrder: fields.length,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Equipment Items */}
        {fields.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum equipamento adicionado ainda
            </p>
            <Button type="button" onClick={addItem} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border border-gray-700 rounded-lg space-y-4 bg-gray-900/50"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Item {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Item Name */}
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.itemName`}>
                    Nome do Item <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`items.${index}.itemName`}
                    {...register(`items.${index}.itemName`)}
                    placeholder="Ex: Painel Solar 550W"
                    className={
                      errors.items?.[index]?.itemName ? 'border-red-500' : ''
                    }
                  />
                  {errors.items?.[index]?.itemName && (
                    <p className="text-sm text-red-500">
                      {(errors.items[index] as any)?.itemName?.message as string}
                    </p>
                  )}
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.quantity`}>
                      Quantidade <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`items.${index}.quantity`}
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                      placeholder="1"
                      className={
                        errors.items?.[index]?.quantity ? 'border-red-500' : ''
                      }
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-500">
                        {(errors.items[index] as any)?.quantity?.message as string}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.unit`}>
                      Fabricante <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`items.${index}.unit`}
                      {...register(`items.${index}.unit`)}
                      placeholder="Ex: RONMA SOLAR"
                      className={
                        errors.items?.[index]?.unit ? 'border-red-500' : ''
                      }
                    />
                    {errors.items?.[index]?.unit && (
                      <p className="text-sm text-red-500">
                        {(errors.items[index] as any)?.unit?.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add More Button */}
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Mais Equipamentos
            </Button>
          </div>
        )}

        {/* Error for empty array */}
        {errors.items && !Array.isArray(errors.items) && (
          <p className="text-sm text-red-500">
            {errors.items.message as string}
          </p>
        )}
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Dica:</strong> Liste todos os equipamentos que serão fornecidos na instalação. 
          Exemplos: painéis solares, inversores, estruturas de fixação, cabos, etc.
        </p>
      </div>
    </div>
  );
}
