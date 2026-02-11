'use client';

/**
 * Question Renderer Component
 * 
 * Renders individual questions based on their type with appropriate
 * input components and validation.
 * 
 * Requirements: 3.1 - Project Planning and Screening System
 */

import React from 'react';
import { QuestionnaireQuestion, QuestionAnswer, QuestionOption, ScaleConfig } from '@/lib/types/questionnaire';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  question: QuestionnaireQuestion;
  value?: QuestionAnswer;
  onChange: (value: QuestionAnswer) => void;
  error?: string;
  className?: string;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  className
}: QuestionRendererProps) {
  const renderInput = () => {
    switch (question.question_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua resposta..."
            className={cn(error && 'border-red-500')}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua resposta..."
            rows={4}
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500'
            )}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="Digite um número..."
            min={question.validation_rules?.min}
            max={question.validation_rules?.max}
            className={cn(error && 'border-red-500')}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="seu@email.com"
            className={cn(error && 'border-red-500')}
          />
        );

      case 'phone':
        return (
          <Input
            type="tel"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="(11) 99999-9999"
            className={cn(error && 'border-red-500')}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className={cn(error && 'border-red-500')}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value ? new Date(value as string | Date).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(new Date(e.target.value))}
            className={cn(error && 'border-red-500')}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(error && 'border-red-500')}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value ? new Date(value as string | Date).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(new Date(e.target.value))}
            className={cn(error && 'border-red-500')}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant={value === true ? 'primary' : 'outline'}
              onClick={() => onChange(true)}
              className="flex-1"
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={value === false ? 'primary' : 'outline'}
              onClick={() => onChange(false)}
              className="flex-1"
            >
              Não
            </Button>
          </div>
        );

      case 'single_choice':
        return (
          <RadioGroup
            value={value as string || ''}
            onValueChange={(newValue) => onChange(newValue)}
            className="space-y-3"
          >
            {(question.question_options as QuestionOption[]).map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={optionValue} id={`${question.id}-${index}`} />
                  <Label 
                    htmlFor={`${question.id}-${index}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {optionLabel}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case 'multiple_choice':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-3">
            {(question.question_options as QuestionOption[]).map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const isChecked = selectedValues.includes(optionValue);
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, optionValue]);
                      } else {
                        onChange(selectedValues.filter(v => v !== optionValue));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`${question.id}-${index}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {optionLabel}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'scale':
        const scaleConfig = question.question_options as ScaleConfig;
        const currentValue = (value as number) || scaleConfig.min;
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>{scaleConfig.minLabel || scaleConfig.min}</span>
              <span className="font-medium">
                {currentValue}
              </span>
              <span>{scaleConfig.maxLabel || scaleConfig.max}</span>
            </div>
            <input
              type="range"
              min={scaleConfig.min}
              max={scaleConfig.max}
              step={scaleConfig.step || 1}
              value={currentValue}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              {Array.from(
                { length: Math.floor((scaleConfig.max - scaleConfig.min) / (scaleConfig.step || 1)) + 1 },
                (_, i) => scaleConfig.min + i * (scaleConfig.step || 1)
              ).map(num => (
                <span key={num}>{num}</span>
              ))}
            </div>
          </div>
        );

      case 'file_upload':
        return (
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file.name); // Simplified - would handle file upload in real implementation
                }
              }}
              className="hidden"
              id={`file-${question.id}`}
            />
            <Label 
              htmlFor={`file-${question.id}`}
              className="cursor-pointer text-sm text-neutral-600 hover:text-neutral-900"
            >
              {value ? (
                <span>Arquivo selecionado: {value as string}</span>
              ) : (
                <span>Clique para selecionar um arquivo</span>
              )}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite sua resposta..."
            className={cn(error && 'border-red-500')}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {renderInput()}
      
      {/* Helper text from question metadata */}
      {question.metadata?.helperText && (
        <p className="text-xs text-neutral-500">
          {question.metadata.helperText}
        </p>
      )}
    </div>
  );
}