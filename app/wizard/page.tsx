'use client';

/**
 * Contract Wizard Page
 * 
 * Demo page for the contract creation wizard.
 * This will be integrated into the admin dashboard in future tasks.
 */

import { useRouter } from 'next/navigation';
import { ContractWizard } from '@/components/wizard/ContractWizard';

// Define the form data type to match the wizard
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

export default function WizardPage() {
  const router = useRouter();

  const handleComplete = async (contract: ContractFormData) => {
    try {
      // Call the API to create the contract
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contract),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contract');
      }

      const result = await response.json();
      
      // Redirect to the public contract view
      if (result.contract?.uuid) {
        router.push(`/contracts/${result.contract.uuid}`);
      } else {
        alert('Contract created successfully!');
        router.push('/');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      alert(error instanceof Error ? error.message : 'Failed to create contract. Please try again.');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      router.push('/');
    }
  };

  return <ContractWizard onComplete={handleComplete} onCancel={handleCancel} />;
}
