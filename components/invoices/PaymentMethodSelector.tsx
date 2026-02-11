/**
 * Payment Method Selector Component
 * Allows customers to select payment method for invoice payment
 * Requirements: 4.4 - Customer invoice portal payment options
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  FileText,
  Banknote,
  CheckSquare
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  processingTime?: string;
  fees?: string;
}

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  currency: string;
}

export function PaymentMethodSelector({ value, onChange, currency }: PaymentMethodSelectorProps) {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Pay instantly with your credit or debit card',
      icon: <CreditCard className="h-5 w-5" />,
      available: true,
      processingTime: 'Instant',
      fees: 'Processing fees may apply'
    },
    {
      id: 'pix',
      name: 'PIX',
      description: 'Instant payment via PIX (Brazil only)',
      icon: <Smartphone className="h-5 w-5" />,
      available: currency === 'BRL',
      processingTime: 'Instant',
      fees: 'No fees'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer directly from your bank account',
      icon: <Building2 className="h-5 w-5" />,
      available: true,
      processingTime: '1-3 business days',
      fees: 'Bank fees may apply'
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      description: 'Pay at banks, ATMs, or online banking (Brazil only)',
      icon: <FileText className="h-5 w-5" />,
      available: currency === 'BRL',
      processingTime: '1-2 business days',
      fees: 'No fees'
    }
  ];

  const availableMethods = paymentMethods.filter(method => method.available);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Select Payment Method</Label>
      
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {availableMethods.map((method) => (
          <div key={method.id}>
            <Label
              htmlFor={method.id}
              className="cursor-pointer"
            >
              <Card className={`transition-all hover:shadow-md ${
                value === method.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={method.id}
                      id={method.id}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          value === method.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {method.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{method.name}</h3>
                          <p className="text-xs text-gray-600">{method.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>⏱️ {method.processingTime}</span>
                        <span>💰 {method.fees}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {value && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckSquare className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">
                {availableMethods.find(m => m.id === value)?.name} Selected
              </p>
              <p className="text-blue-600 text-xs mt-1">
                {getPaymentInstructions(value, currency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPaymentInstructions(paymentMethod: string, currency: string): string {
  const instructions: Record<string, string> = {
    credit_card: 'You will be redirected to our secure payment processor to complete your payment.',
    pix: 'A PIX QR code will be generated for you to scan with your banking app.',
    bank_transfer: 'Bank account details will be provided after you confirm this payment method.',
    boleto: 'A boleto will be generated that you can pay at any bank or through online banking.'
  };

  return instructions[paymentMethod] || 'Payment instructions will be provided after selection.';
}