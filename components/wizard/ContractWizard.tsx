'use client';

/**
 * Contract Creation Wizard Component
 * 
 * Multi-step wizard for creating photovoltaic service contracts.
 * Implements a 7-step process with progress indication, form validation,
 * and integration with React Hook Form and Zod schemas.
 * 
 * Requirements: 1.1
 * 
 * Steps:
 * 1. Contractor Identification (name, CPF)
 * 2. Installation Address (CEP lookup, manual entry, Google Maps location pin)
 * 3. Project Specifications (kWp capacity, installation date)
 * 4. Equipment List (dynamic JSONB items)
 * 5. Service Scope (checklist with customization)
 * 6. Financial Details (value, payment method)
 * 7. Review and Submit
 */

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { contractDraftSchema } from '@/lib/types/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WizardProgress } from '@/components/ui/wizard-progress';
import { useKeyboardShortcuts, announce } from '@/components/ui/keyboard-navigation';
import { SwipeGesture, MobileKeyboard } from '@/components/ui/mobile-interactions';

// Import step components
import { Step1ContractorInfo } from './steps/Step1ContractorInfo';
import { Step2Address } from './steps/Step2Address';
import { Step3ProjectSpecs } from './steps/Step3ProjectSpecs';
import { Step4Equipment } from './steps/Step4Equipment';
import { Step5Services } from './steps/Step5Services';
import { Step6Financial } from './steps/Step6Financial';
import { Step7Review } from './steps/Step7Review';

// Define the form data type directly to avoid resolver type conflicts
type ContractFormData = {
  contractorName: string;
  contractorCPF: string;
  contractorEmail?: string;
  contractorPhone?: string;
  addressCEP: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  locationLatitude?: number;
  locationLongitude?: number;
  projectKWp: number;
  installationDate?: Date;
  services: Array<{ description: string; included: boolean }>;
  items: Array<{ itemName: string; quantity: number; unit: string; sortOrder?: number }>;
  contractValue: number;
  paymentMethod: 'pix' | 'cash' | 'credit';
};

interface ContractWizardProps {
  onComplete: (contract: ContractFormData) => Promise<void>;
  onCancel: () => void;
}

const WIZARD_STEPS = [
  { id: 1, title: 'Identificação', description: 'Dados do contratante' },
  { id: 2, title: 'Endereço', description: 'Local da instalação' },
  { id: 3, title: 'Projeto', description: 'Especificações técnicas' },
  { id: 4, title: 'Equipamentos', description: 'Lista de materiais' },
  { id: 5, title: 'Serviços', description: 'Escopo do trabalho' },
  { id: 6, title: 'Financeiro', description: 'Valores e pagamento' },
  { id: 7, title: 'Revisão', description: 'Confirmar dados' },
] as const;

export function ContractWizard({ onComplete, onCancel }: ContractWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Initialize React Hook Form with Zod validation
  const methods = useForm<ContractFormData>({
    resolver: zodResolver(contractDraftSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      contractorName: '',
      contractorCPF: '',
      contractorEmail: '',
      contractorPhone: '',
      addressCEP: '',
      addressStreet: '',
      addressNumber: '',
      addressComplement: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      locationLatitude: undefined,
      locationLongitude: undefined,
      projectKWp: 1,
      installationDate: undefined,
      services: [
        { description: 'Instalação de painéis solares', included: true },
        { description: 'Configuração do sistema', included: true },
        { description: 'Documentação técnica', included: false }
      ],
      items: [
        { itemName: 'Painel Solar 550W', quantity: 1, unit: 'unidade', sortOrder: 0 }
      ],
      contractValue: 1000,
      paymentMethod: 'pix' as const,
    },
  });

  const { handleSubmit, trigger, formState } = methods;

  // Keyboard shortcuts for wizard navigation
  useKeyboardShortcuts({
    'alt+arrowright': () => {
      if (currentStep < WIZARD_STEPS.length && !hasCurrentStepErrors()) {
        handleNext();
      }
    },
    'alt+arrowleft': () => {
      if (currentStep > 1) {
        handlePrevious();
      }
    },
    'ctrl+enter': () => {
      if (currentStep === WIZARD_STEPS.length) {
        handleSubmit(onSubmit)();
      }
    },
    'escape': () => {
      onCancel();
    },
  });

  // Handle next step
  const handleNext = async () => {
    setIsValidating(true);
    
    // Validate current step fields before proceeding
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['contractorName', 'contractorCPF', 'contractorEmail', 'contractorPhone'];
        break;
      case 2:
        fieldsToValidate = ['addressCEP', 'addressStreet', 'addressNumber', 'addressNeighborhood', 'addressCity', 'addressState'];
        break;
      case 3:
        fieldsToValidate = ['projectKWp', 'installationDate'];
        break;
      case 4:
        fieldsToValidate = ['items'];
        break;
      case 5:
        fieldsToValidate = ['services'];
        break;
      case 6:
        fieldsToValidate = ['contractValue', 'paymentMethod'];
        break;
    }
    
    const isValid = fieldsToValidate.length > 0 
      ? await trigger(fieldsToValidate as any)
      : true;
    
    setIsValidating(false);
    
    if (isValid && currentStep < WIZARD_STEPS.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      announce(`Avançou para a etapa ${nextStep}: ${WIZARD_STEPS[nextStep - 1].title}`);
    }
  };

  // Check if current step has validation errors
  const hasCurrentStepErrors = () => {
    const { errors } = formState;
    
    switch (currentStep) {
      case 1:
        return !!(errors.contractorName || errors.contractorCPF || errors.contractorEmail || errors.contractorPhone);
      case 2:
        return !!(errors.addressCEP || errors.addressStreet || errors.addressNumber || 
                 errors.addressNeighborhood || errors.addressCity || errors.addressState);
      case 3:
        return !!(errors.projectKWp || errors.installationDate);
      case 4:
        return !!(errors.items);
      case 5:
        return !!(errors.services);
      case 6:
        return !!(errors.contractValue || errors.paymentMethod);
      default:
        return false;
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      announce(`Voltou para a etapa ${prevStep}: ${WIZARD_STEPS[prevStep - 1].title}`);
    }
  };

  // Handle edit from review step
  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  // Handle form submission
  const onSubmit = async (data: ContractFormData) => {
    console.log('Form submission started with data:', data);
    setIsSubmitting(true);
    try {
      // Validate the data before submission
      const validatedData = contractDraftSchema.parse(data);
      console.log('Data validation passed:', validatedData);
      
      await onComplete(validatedData);
    } catch (error) {
      console.error('Error submitting contract:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        alert(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-ocean-900 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image
            src="/isotec-logo.webp"
            alt="ISOTEC"
            width={80}
            height={32}
            priority
            className="w-20 md:w-24"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg md:text-xl font-bold text-white">Novo Contrato</h1>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          className="text-neutral-300 hover:text-white text-sm"
        >
          Cancelar
        </Button>
      </div>

      {/* Progress Indicator - More Compact */}
      <div className="px-4 md:px-6 py-4">
        <WizardProgress 
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Main Content - Optimized for No Scrolling */}
      <div className="flex-1 flex flex-col px-4 md:px-6 pb-4">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            <MobileKeyboard adjustViewport={true}>
              <SwipeGesture
                onSwipeLeft={() => {
                  if (currentStep < WIZARD_STEPS.length && !hasCurrentStepErrors()) {
                    handleNext();
                  }
                }}
                onSwipeRight={() => {
                  if (currentStep > 1) {
                    handlePrevious();
                  }
                }}
                className="flex-1 flex flex-col"
              >
                {/* Content Card - Optimized Height */}
                <Card className="bg-neutral-800/50 border-neutral-700 rounded-xl shadow-lg flex-1 flex flex-col">
                  {/* Step Content - No Redundant Header */}
                  <CardContent className="flex-1 p-4 md:p-6 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="h-full flex flex-col"
                      >
                        {currentStep === 1 && <Step1ContractorInfo />}
                        {currentStep === 2 && <Step2Address />}
                        {currentStep === 3 && <Step3ProjectSpecs />}
                        {currentStep === 4 && <Step4Equipment />}
                        {currentStep === 5 && <Step5Services />}
                        {currentStep === 6 && <Step6Financial />}
                        {currentStep === 7 && <Step7Review onEditStep={handleEditStep} />}
                      </motion.div>
                    </AnimatePresence>
                  </CardContent>

                  {/* Navigation Buttons - Fixed at Bottom */}
                  <div className="flex items-center justify-between p-4 md:p-6 border-t border-neutral-700 gap-4 bg-neutral-800/30">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white hover:border-neutral-500 disabled:border-neutral-700 disabled:text-neutral-500 disabled:hover:bg-transparent disabled:hover:text-neutral-500 flex-1 sm:flex-none min-w-[100px]"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Anterior</span>
                      <span className="sm:hidden">Voltar</span>
                    </Button>

                    {/* Step Indicator for Mobile */}
                    <div className="flex items-center gap-2 text-sm text-neutral-400 sm:hidden">
                      <span>{currentStep}</span>
                      <span>/</span>
                      <span>{WIZARD_STEPS.length}</span>
                    </div>

                    {currentStep < WIZARD_STEPS.length ? (
                      <Button 
                        type="button" 
                        variant="primary"
                        size="default"
                        onClick={handleNext}
                        loading={isValidating}
                        loadingText="..."
                        disabled={hasCurrentStepErrors()}
                        className="bg-gradient-to-r from-solar-500 to-solar-600 text-neutral-900 font-semibold shadow-lg shadow-solar-500/30 hover:shadow-solar-500/50 hover:from-solar-600 hover:to-solar-700 disabled:from-neutral-400 disabled:to-neutral-500 disabled:text-neutral-600 disabled:shadow-none flex-1 sm:flex-none min-w-[100px]"
                      >
                        <span className="hidden sm:inline">Próximo</span>
                        <span className="sm:hidden">Avançar</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        variant="secondary"
                        size="default"
                        loading={isSubmitting}
                        loadingText="..."
                        disabled={isSubmitting || hasCurrentStepErrors()}
                        className="bg-gradient-to-r from-energy-500 to-energy-600 text-white font-semibold shadow-lg shadow-energy-500/30 hover:shadow-energy-500/50 hover:from-energy-600 hover:to-energy-700 disabled:from-neutral-400 disabled:to-neutral-500 disabled:text-neutral-600 disabled:shadow-none flex-1 sm:flex-none min-w-[100px]"
                      >
                        <span className="hidden sm:inline">Criar Contrato</span>
                        <span className="sm:hidden">Finalizar</span>
                      </Button>
                    )}
                  </div>
                </Card>
              </SwipeGesture>
            </MobileKeyboard>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
