# Zod Validation Schemas - Usage Examples

This document provides examples of how to use the Zod validation schemas for the Photovoltaic Contract System.

## Overview

The schemas are defined in `lib/types/schemas.ts` and provide comprehensive validation for:
- Contract creation forms
- Geographic coordinates (Brazilian boundaries)
- Brazilian CPF and CEP validation
- Currency values and financial data
- Equipment and service items
- Signature and audit log data

## Basic Usage

### Importing Schemas

```typescript
import {
  contractDraftSchema,
  coordinatesSchema,
  cpfSchema,
  cepSchema,
  positiveValueSchema
} from '@/lib/types/schemas';
```

### Validating Data

```typescript
// Using safeParse (recommended - doesn't throw)
const result = contractDraftSchema.safeParse(formData);

if (result.success) {
  // Data is valid, use result.data
  const validatedData = result.data;
  console.log('Valid contract:', validatedData);
} else {
  // Data is invalid, use result.error
  console.error('Validation errors:', result.error.format());
}

// Using parse (throws on error)
try {
  const validatedData = contractDraftSchema.parse(formData);
  console.log('Valid contract:', validatedData);
} catch (error) {
  console.error('Validation failed:', error);
}
```

## Schema Examples

### 1. Coordinates Schema

Validates latitude and longitude within Brazil's geographic boundaries.

```typescript
import { coordinatesSchema } from '@/lib/types/schemas';

// Valid coordinates (São Paulo)
const validCoords = {
  latitude: -23.55052,
  longitude: -46.633308
};

const result = coordinatesSchema.safeParse(validCoords);
// result.success === true

// Invalid coordinates (outside Brazil)
const invalidCoords = {
  latitude: 50.0, // Too far north
  longitude: -46.633308
};

const result2 = coordinatesSchema.safeParse(invalidCoords);
// result2.success === false
// result2.error.message includes "Latitude must be within Brazil boundaries"
```

**Validation Rules:**
- Latitude: -33.75 to 5.27
- Longitude: -73.99 to -34.79
- Maximum 8 decimal places for precision

### 2. CPF Schema

Validates Brazilian CPF numbers using the standard algorithm.

```typescript
import { cpfSchema } from '@/lib/types/schemas';

// Valid CPF (with or without formatting)
cpfSchema.parse('123.456.789-09'); // ✓
cpfSchema.parse('12345678909');     // ✓

// Invalid CPF
cpfSchema.parse('123.456.789-00'); // ✗ Invalid check digits
cpfSchema.parse('111.111.111-11'); // ✗ All same digits
cpfSchema.parse('12345678');       // ✗ Wrong length
```

**Validation Rules:**
- Exactly 11 digits (formatting optional)
- Cannot have all identical digits
- Check digits must be correctly calculated

### 3. CEP Schema

Validates Brazilian postal codes.

```typescript
import { cepSchema } from '@/lib/types/schemas';

// Valid CEP (with or without formatting)
cepSchema.parse('12345-678'); // ✓
cepSchema.parse('12345678');  // ✓

// Invalid CEP
cepSchema.parse('1234567');   // ✗ Wrong length
cepSchema.parse('123456789'); // ✗ Too long
```

**Validation Rules:**
- Exactly 8 digits (hyphen optional)

### 4. Positive Value Schema

Validates positive numbers for currency and measurements.

```typescript
import { positiveValueSchema } from '@/lib/types/schemas';

// Valid values
positiveValueSchema.parse(100.50);  // ✓
positiveValueSchema.parse(0.01);    // ✓
positiveValueSchema.parse(1000000); // ✓

// Invalid values
positiveValueSchema.parse(0);       // ✗ Must be positive
positiveValueSchema.parse(-10);     // ✗ Must be positive
positiveValueSchema.parse(100.123); // ✗ Too many decimal places
```

**Validation Rules:**
- Must be greater than zero
- Maximum 2 decimal places (for currency precision)

### 5. Service Item Schema

Validates service scope items.

```typescript
import { serviceItemSchema } from '@/lib/types/schemas';

// Valid service item
const validService = {
  description: 'Installation and configuration',
  included: true
};

serviceItemSchema.parse(validService); // ✓

// Invalid service item
const invalidService = {
  description: '', // Empty description
  included: true
};

serviceItemSchema.parse(invalidService); // ✗
```

### 6. Equipment Item Schema

Validates equipment list items.

```typescript
import { equipmentItemInputSchema } from '@/lib/types/schemas';

// Valid equipment item
const validItem = {
  itemName: 'Solar Panel 550W Monocrystalline',
  quantity: 20,
  unit: 'un',
  sortOrder: 0
};

equipmentItemInputSchema.parse(validItem); // ✓

// Invalid equipment items
equipmentItemInputSchema.parse({
  itemName: 'Panel',
  quantity: -5,  // ✗ Negative quantity
  unit: 'un'
});

equipmentItemInputSchema.parse({
  itemName: 'Panel',
  quantity: 5.5, // ✗ Fractional quantity
  unit: 'un'
});
```

**Validation Rules:**
- Item name: 1-200 characters
- Quantity: Positive integer
- Unit: 1-20 characters
- Sort order: Non-negative integer (optional, defaults to 0)

### 7. Contract Draft Schema

Validates complete contract creation form data.

```typescript
import { contractDraftSchema } from '@/lib/types/schemas';

const validDraft = {
  // Contractor Information
  contractorName: 'João Silva',
  contractorCPF: '123.456.789-09',
  contractorEmail: 'joao@example.com',
  contractorPhone: '11987654321',
  
  // Installation Address
  addressCEP: '01310-100',
  addressStreet: 'Avenida Paulista',
  addressNumber: '1578',
  addressComplement: 'Conjunto 405',
  addressNeighborhood: 'Bela Vista',
  addressCity: 'São Paulo',
  addressState: 'SP',
  
  // Geographic Location (optional)
  locationLatitude: -23.561414,
  locationLongitude: -46.656139,
  
  // Project Specifications
  projectKWp: 10.5,
  installationDate: new Date('2024-06-15'),
  
  // Services
  services: [
    { description: 'Installation of photovoltaic system', included: true },
    { description: 'Electrical connection and commissioning', included: true },
    { description: 'Documentation and permits', included: true },
    { description: 'Annual maintenance (first year)', included: true },
    { description: 'System monitoring setup', included: true },
    { description: 'Training for system operation', included: false }
  ],
  
  // Equipment
  items: [
    { itemName: 'Solar Panel 550W Monocrystalline', quantity: 20, unit: 'un', sortOrder: 0 },
    { itemName: 'Inverter 10kW Three-phase', quantity: 1, unit: 'un', sortOrder: 1 },
    { itemName: 'Mounting Structure Aluminum', quantity: 20, unit: 'un', sortOrder: 2 },
    { itemName: 'DC Cable 6mm²', quantity: 100, unit: 'm', sortOrder: 3 },
    { itemName: 'AC Cable 10mm²', quantity: 50, unit: 'm', sortOrder: 4 }
  ],
  
  // Financial Information
  contractValue: 52500.00,
  paymentMethod: 'pix'
};

const result = contractDraftSchema.safeParse(validDraft);
// result.success === true
```

**Validation Rules:**
- All contractor, address, project, and financial fields are validated
- At least one service must be selected
- At least one equipment item is required
- If coordinates are provided, both latitude and longitude must be present
- Coordinates must be within Brazil boundaries
- Contract value and kWp must be positive
- Email and phone are optional but validated if provided

### 8. Email Verification Code Schema

Validates email verification codes for signature flow.

```typescript
import { emailVerificationCodeSchema } from '@/lib/types/schemas';

// Valid verification request
const validCode = {
  code: '123456',
  contractId: '550e8400-e29b-41d4-a716-446655440000'
};

emailVerificationCodeSchema.parse(validCode); // ✓

// Invalid codes
emailVerificationCodeSchema.parse({
  code: '12345',  // ✗ Wrong length
  contractId: '550e8400-e29b-41d4-a716-446655440000'
});

emailVerificationCodeSchema.parse({
  code: '12345a', // ✗ Not numeric
  contractId: '550e8400-e29b-41d4-a716-446655440000'
});
```

**Validation Rules:**
- Code: Exactly 6 numeric digits
- Contract ID: Valid UUID

## Integration with React Hook Form

The schemas work seamlessly with React Hook Form using the `@hookform/resolvers/zod` package.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contractDraftSchema, type ContractDraftInput } from '@/lib/types/schemas';

function ContractForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ContractDraftInput>({
    resolver: zodResolver(contractDraftSchema)
  });

  const onSubmit = (data: ContractDraftInput) => {
    // Data is automatically validated and typed
    console.log('Valid contract data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('contractorName')} />
      {errors.contractorName && <span>{errors.contractorName.message}</span>}
      
      <input {...register('contractorCPF')} />
      {errors.contractorCPF && <span>{errors.contractorCPF.message}</span>}
      
      {/* More form fields... */}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Type Inference

All schemas export TypeScript types that can be inferred:

```typescript
import { type ContractDraftInput, type CoordinatesInput } from '@/lib/types/schemas';

// Or infer from schema directly
import { z } from 'zod';
import { contractDraftSchema } from '@/lib/types/schemas';

type ContractDraft = z.infer<typeof contractDraftSchema>;
```

## Error Handling

Zod provides detailed error information:

```typescript
const result = contractDraftSchema.safeParse(invalidData);

if (!result.success) {
  // Get formatted errors
  const formattedErrors = result.error.format();
  console.log(formattedErrors);
  
  // Get flat list of errors
  const flatErrors = result.error.flatten();
  console.log(flatErrors);
  
  // Get specific field errors
  const issues = result.error.issues;
  issues.forEach(issue => {
    console.log(`Field: ${issue.path.join('.')}`);
    console.log(`Error: ${issue.message}`);
  });
}
```

## Best Practices

1. **Always use `safeParse` in production code** - It doesn't throw and provides better error handling
2. **Validate early** - Validate data at form submission, not just at API boundaries
3. **Use TypeScript types** - Import the inferred types for type safety throughout your app
4. **Provide clear error messages** - The schemas include user-friendly error messages
5. **Validate coordinates together** - The schema ensures both latitude and longitude are provided together
6. **Test edge cases** - The schemas handle formatting variations (CPF/CEP with or without formatting)

## Related Files

- **Schema definitions**: `lib/types/schemas.ts`
- **Type definitions**: `lib/types/index.ts`
- **Validation utilities**: `lib/validation/`
- **Tests**: `tests/unit/types/schemas.test.ts`

## Requirements Validated

The schemas validate the following requirements:
- **1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8**: Contract creation wizard fields
- **2.1, 2.2, 2.3, 2.5**: CPF validation
- **3.5**: CEP validation
- **3A.4, 3A.5, 3A.7**: Geographic coordinate validation
- **12.1, 12.2, 12.3, 12.4**: Equipment and service management
- **13.1, 13.3**: Financial information validation
