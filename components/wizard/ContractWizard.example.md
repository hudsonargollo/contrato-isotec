# Contract Wizard Component

## Overview

The `ContractWizard` component is a multi-step form wizard for creating photovoltaic service contracts. It implements a 7-step process with progress indication, form validation using React Hook Form and Zod, and a responsive dark-themed UI.

## Features

- **7-Step Process**: Guides users through contract creation with clear step indicators
- **Progress Tracking**: Visual progress bar and step indicators show completion status
- **Form Validation**: Integrated with React Hook Form and Zod schemas for robust validation
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Brand Integration**: Includes ISOTEC logo in header and mascot as persistent guide
- **Smooth Animations**: Framer Motion animations for step transitions
- **Dark Theme**: Solar-inspired color scheme with yellow/orange accents

## Steps

1. **Identificação** - Contractor identification (name, CPF, email, phone)
2. **Endereço** - Installation address (CEP lookup, manual entry, Google Maps)
3. **Projeto** - Project specifications (kWp capacity, installation date)
4. **Equipamentos** - Equipment list (dynamic items with quantities)
5. **Serviços** - Service scope (checklist with customization)
6. **Financeiro** - Financial details (contract value, payment method)
7. **Revisão** - Review and submit (confirmation of all data)

## Usage

```tsx
import { ContractWizard } from '@/components/wizard/ContractWizard';

function MyPage() {
  const handleComplete = async (contract) => {
    // Submit contract data to API
    await fetch('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(contract),
    });
  };

  const handleCancel = () => {
    // Navigate away or show confirmation
    router.push('/dashboard');
  };

  return (
    <ContractWizard 
      onComplete={handleComplete} 
      onCancel={handleCancel} 
    />
  );
}
```

## Props

### `onComplete`
- **Type**: `(contract: ContractFormData) => Promise<void>`
- **Required**: Yes
- **Description**: Callback function called when the wizard is completed and the form is submitted

### `onCancel`
- **Type**: `() => void`
- **Required**: Yes
- **Description**: Callback function called when the user cancels the wizard

## Contract Form Data Type

```typescript
type ContractFormData = {
  // Contractor Information
  contractorName: string;
  contractorCPF: string;
  contractorEmail?: string;
  contractorPhone?: string;
  
  // Installation Address
  addressCEP: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  
  // Geographic Location (optional)
  locationLatitude?: number;
  locationLongitude?: number;
  
  // Project Specifications
  projectKWp: number;
  installationDate?: Date;
  
  // Services and Equipment
  services: Array<{ description: string; included: boolean }>;
  items: Array<{ 
    itemName: string; 
    quantity: number; 
    unit: string; 
    sortOrder?: number 
  }>;
  
  // Financial Information
  contractValue: number;
  paymentMethod: 'pix' | 'cash' | 'credit';
};
```

## Components Used

- **Button**: Navigation buttons (Previous/Next/Submit)
- **Card**: Container for wizard content
- **Progress**: Visual progress bar
- **Framer Motion**: Smooth step transitions
- **React Hook Form**: Form state management
- **Zod**: Schema validation

## Styling

The wizard uses Tailwind CSS with custom dark theme variables:
- Primary color: Solar yellow/orange (`--primary`)
- Background: Dark blue (`--background`)
- Cards: Slightly lighter dark blue (`--card`)
- Text: Light foreground (`--foreground`)

## Assets

### Logo
- **Path**: `/isotec-logo.webp`
- **Location**: Header (top-left)
- **Size**: 120x48px

### Mascot
- **Path**: `/mascote.webp`
- **Location**: Fixed bottom-right (desktop only)
- **Size**: 120x120px
- **Animation**: Scale and fade-in on mount

## Navigation

- **Previous Button**: Enabled on steps 2-7, navigates to previous step
- **Next Button**: Shown on steps 1-6, validates current step before proceeding
- **Submit Button**: Shown on step 7, submits the complete form
- **Cancel Button**: Available in header, calls `onCancel` callback

## Validation

Form validation is handled by Zod schemas defined in `lib/types/schemas.ts`:
- CPF validation with check digit algorithm
- CEP validation for Brazilian postal codes
- Positive value validation for financial fields
- Coordinate validation for Brazilian boundaries
- Required field validation

## Future Enhancements

The following features will be implemented in subsequent tasks:
- Step 1: Contractor identification form (Task 7.2)
- Step 2: Address form with ViaCEP integration and Google Maps (Task 7.3)
- Step 3: Project specifications form (Task 7.4)
- Step 4: Dynamic equipment list (Task 7.5)
- Step 5: Service scope checklist (Task 7.6)
- Step 6: Financial details form (Task 7.7)
- Step 7: Review and confirmation (Task 7.8)

## Requirements

Validates: **Requirements 1.1**

## Related Components

- `GoogleMapsLocationPicker` - Map component for address step
- `Button` - Reusable button component
- `Card` - Container components
- `Progress` - Progress bar component

## Testing

Unit tests should cover:
- Step navigation (forward/backward)
- Form validation at each step
- Submit handler
- Cancel handler
- Progress calculation
- Responsive behavior

Property-based tests should verify:
- Form data structure matches schema
- Validation rules are enforced
- Navigation state is consistent
