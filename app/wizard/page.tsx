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
      // Filter out services that are not included
      const filteredServices = contract.services.filter(s => s.included);
      
      // Prepare the contract data
      const contractData = {
        ...contract,
        services: filteredServices,
        // Ensure dates are properly formatted
        installationDate: contract.installationDate 
          ? new Date(contract.installationDate).toISOString() 
          : undefined,
      };

      console.log('Submitting contract data:', contractData);

      // Call the API to create the contract
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      // Get response text first
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      // Try to parse as JSON
      let result;
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
        }
      } else {
        throw new Error('Server returned empty response');
      }

      // Check if response was successful
      if (!response.ok) {
        const errorMessage = result?.error || result?.details || 'Failed to create contract';
        throw new Error(errorMessage);
      }
      
      // Redirect to the public contract view
      if (result.contract?.uuid) {
        router.push(`/contracts/${result.contract.uuid}`);
      } else {
        alert('Contract created successfully!');
        router.push('/');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create contract. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      router.push('/');
    }
  };

  return <ContractWizard onComplete={handleComplete} onCancel={handleCancel} />;
}
