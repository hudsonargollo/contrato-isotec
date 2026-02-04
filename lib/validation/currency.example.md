# Currency Formatting Utilities - Usage Examples

This document provides examples of how to use the BRL currency formatting utilities.

## Import

```typescript
import {
  formatCurrency,
  parseCurrency,
  validatePositiveValue,
  getCurrencyErrorMessage,
  formatCurrencyInput
} from '@/lib/validation/currency';
```

## Format Currency for Display

```typescript
// Format contract values for display
const contractValue = 15000.50;
const formatted = formatCurrency(contractValue);
// Result: "R$ 15.000,50"

// Format equipment prices
const price = 1234.56;
console.log(formatCurrency(price));
// Output: "R$ 1.234,56"

// Format small values
console.log(formatCurrency(0.99));
// Output: "R$ 0,99"
```

## Parse Currency from User Input

```typescript
// Parse Brazilian format
const value1 = parseCurrency('R$ 1.234,56');
// Result: 1234.56

// Parse without currency symbol
const value2 = parseCurrency('1.234,56');
// Result: 1234.56

// Parse international format
const value3 = parseCurrency('1,234.56');
// Result: 1234.56

// Use in form submission
const formValue = parseCurrency(inputElement.value);
if (!isNaN(formValue)) {
  // Submit to API
  await createContract({ contractValue: formValue });
}
```

## Validate Positive Values

```typescript
// Validate contract value (Requirement 13.1)
if (!validatePositiveValue(contractValue)) {
  console.error('Contract value must be greater than zero');
}

// Validate kWp capacity
if (!validatePositiveValue(projectKWp)) {
  console.error('Solar capacity must be greater than zero');
}

// Validate user input
const userInput = 'R$ 1.000,00';
if (validatePositiveValue(userInput)) {
  console.log('Valid currency value');
}
```

## Get Error Messages

```typescript
// Get error message for contract value
const error1 = getCurrencyErrorMessage(0, 'Contract value');
// Result: "Contract value must be greater than zero"

// Get error message for kWp capacity
const error2 = getCurrencyErrorMessage(-10, 'kWp capacity');
// Result: "kWp capacity must be greater than zero"

// Get error message for invalid input
const error3 = getCurrencyErrorMessage('abc', 'Price');
// Result: "Price must be a valid number"

// Use in form validation
const errorMessage = getCurrencyErrorMessage(formValue, 'Contract value');
if (errorMessage) {
  setFieldError('contractValue', errorMessage);
}
```

## Format Input as User Types

```typescript
// Real-time formatting in input fields
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = e.target.value;
  const formatted = formatCurrencyInput(rawValue);
  setInputValue(formatted);
};

// Example flow:
// User types: "1234567"
// Display: "1.234.567"

// User types: "1234567.89"
// Display: "1.234.567,89"

// User types: "R$ 1234567.89"
// Display: "1.234.567,89" (R$ removed automatically)
```

## Complete Form Example

```typescript
import { useState } from 'react';
import {
  formatCurrencyInput,
  parseCurrency,
  validatePositiveValue,
  getCurrencyErrorMessage
} from '@/lib/validation/currency';

function ContractValueInput() {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setDisplayValue(formatted);
    setError(null);
  };

  const handleBlur = () => {
    const numericValue = parseCurrency(displayValue);
    const errorMessage = getCurrencyErrorMessage(numericValue, 'Contract value');
    setError(errorMessage);
  };

  const handleSubmit = () => {
    const numericValue = parseCurrency(displayValue);
    if (validatePositiveValue(numericValue)) {
      // Submit to API
      console.log('Submitting value:', numericValue);
    }
  };

  return (
    <div>
      <label>Contract Value</label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="0,00"
      />
      {error && <span className="error">{error}</span>}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

## Integration with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parseCurrency, validatePositiveValue } from '@/lib/validation/currency';

const contractSchema = z.object({
  contractValue: z.string()
    .refine(
      (val) => validatePositiveValue(parseCurrency(val)),
      { message: 'Contract value must be greater than zero' }
    )
    .transform((val) => parseCurrency(val))
});

function ContractForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contractSchema)
  });

  const onSubmit = (data: any) => {
    console.log('Contract value:', data.contractValue);
    // data.contractValue is now a number
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('contractValue')} />
      {errors.contractValue && <span>{errors.contractValue.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Requirements Satisfied

- **Requirement 1.8**: Format financial values as BRL currency in the wizard
- **Requirement 13.2**: Format currency values with proper locale formatting
- **Requirement 13.1**: Validate that contract values are positive numbers
- **Requirement 13.5**: Maintain decimal precision for currency calculations
