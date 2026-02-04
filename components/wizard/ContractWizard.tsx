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
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

import { contractDraftSchema } from '@/lib/types/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

  // Initialize React Hook Form with Zod validation
  const methods = useForm<ContractFormData>({
    resolver: zodResolver(contractDraftSchema),
    mode: 'onBlur',
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
      projectKWp: 0,
      installationDate: undefined,
      services: [],
      items: [],
      contractValue: 0,
      paymentMethod: 'pix' as const,
    },
  });

  const { handleSubmit, trigger } = methods;

  // Calculate progress percentage
  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  // Handle next step
  const handleNext = async () => {
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
    
    if (isValid && currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle edit from review step
  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  // Handle form submission
  const onSubmit = async (data: ContractFormData) => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
    } catch (error) {
      console.error('Error submitting contract:', error);
      // Error handling will be added in future tasks
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Image
              src="/isotec-logo.webp"
              alt="ISOTEC Logo"
              width={120}
              height={48}
              priority
            />
            <div>
              <h1 className="text-2xl font-bold">Novo Contrato</h1>
              <p className="text-sm text-muted-foreground">
                Sistema de Contratos Fotovoltaicos
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      transition-colors duration-300
                      ${
                        currentStep > step.id
                          ? 'bg-primary text-primary-foreground'
                          : currentStep === step.id
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-secondary text-muted-foreground'
                      }
                    `}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center hidden md:block">
                    <p className="text-xs font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-2 rounded-full transition-colors duration-300
                      ${currentStep > step.id ? 'bg-primary' : 'bg-secondary'}
                    `}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Wizard Content */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>{WIZARD_STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  {WIZARD_STEPS[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px]"
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

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between p-6 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                {currentStep < WIZARD_STEPS.length ? (
                  <Button type="button" onClick={handleNext}>
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar Contrato'}
                  </Button>
                )}
              </div>
            </Card>
          </form>
        </FormProvider>

        {/* Mascot - Persistent Guide */}
        <div className="fixed bottom-8 right-8 hidden lg:block">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Image
              src="/mascote.webp"
              alt="ISOTEC Mascot"
              width={120}
              height={120}
              className="drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
