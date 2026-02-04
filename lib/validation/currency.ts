/**
 * Currency Formatting Module
 * 
 * This module provides utilities for formatting and parsing Brazilian Real (BRL)
 * currency values with proper locale support.
 * 
 * BRL Format: R$ 1.234,56
 * - Currency symbol: R$
 * - Thousands separator: . (dot)
 * - Decimal separator: , (comma)
 * - Exactly 2 decimal places
 * 
 * Requirements: 1.8, 13.2
 */

/**
 * Formats a number as BRL currency with proper locale formatting
 * 
 * @param value - Numeric value to format
 * @returns Formatted currency string with R$ symbol, thousands separators, and 2 decimal places
 * 
 * @example
 * formatCurrency(1234.56) // returns 'R$ 1.234,56'
 * formatCurrency(1000) // returns 'R$ 1.000,00'
 * formatCurrency(0.5) // returns 'R$ 0,50'
 * formatCurrency(1234567.89) // returns 'R$ 1.234.567,89'
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Parses a BRL currency string back to a number
 * 
 * Handles various input formats:
 * - With or without R$ symbol
 * - With or without thousands separators (dots)
 * - Comma or dot as decimal separator
 * 
 * @param value - Currency string to parse
 * @returns Numeric value, or NaN if parsing fails
 * 
 * @example
 * parseCurrency('R$ 1.234,56') // returns 1234.56
 * parseCurrency('1.234,56') // returns 1234.56
 * parseCurrency('1234,56') // returns 1234.56
 * parseCurrency('1234.56') // returns 1234.56
 * parseCurrency('R$ 1.000,00') // returns 1000
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol and spaces
  let cleaned = value.replace(/R\$\s?/g, '').trim();
  
  // Check if the last separator is a comma (Brazilian format) or dot (international format)
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');
  
  if (lastCommaIndex > lastDotIndex) {
    // Brazilian format: 1.234,56
    // Remove thousands separators (dots) and replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // International format or no decimal: 1,234.56 or 1234
    // Remove thousands separators (commas)
    cleaned = cleaned.replace(/,/g, '');
  }
  
  return parseFloat(cleaned);
}

/**
 * Validates that a value is a positive number suitable for currency
 * 
 * @param value - Value to validate (number or string)
 * @returns true if value is a positive number, false otherwise
 * 
 * @example
 * validatePositiveValue(100) // returns true
 * validatePositiveValue(0.01) // returns true
 * validatePositiveValue(0) // returns false
 * validatePositiveValue(-10) // returns false
 * validatePositiveValue('abc') // returns false
 */
export function validatePositiveValue(value: number | string): boolean {
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Gets a descriptive error message for an invalid currency value
 * 
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message (default: 'Value')
 * @returns Error message string, or null if value is valid
 * 
 * @example
 * getCurrencyErrorMessage(0, 'Contract value') // returns 'Contract value must be greater than zero'
 * getCurrencyErrorMessage(-100, 'Amount') // returns 'Amount must be greater than zero'
 * getCurrencyErrorMessage('abc', 'Price') // returns 'Price must be a valid number'
 * getCurrencyErrorMessage(100, 'Total') // returns null
 */
export function getCurrencyErrorMessage(
  value: number | string,
  fieldName: string = 'Value'
): string | null {
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;
  
  if (isNaN(numValue)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (numValue <= 0) {
    return `${fieldName} must be greater than zero`;
  }
  
  return null;
}

/**
 * Formats a currency input value as the user types
 * 
 * This function is useful for real-time formatting in form inputs.
 * It handles partial inputs gracefully.
 * 
 * @param value - Current input value
 * @returns Formatted value suitable for display in an input field
 * 
 * @example
 * formatCurrencyInput('1234') // returns '1.234'
 * formatCurrencyInput('1234.5') // returns '1.234,5'
 * formatCurrencyInput('1234.56') // returns '1.234,56'
 */
export function formatCurrencyInput(value: string): string {
  // Remove all non-digit characters except comma and dot
  const cleaned = value.replace(/[^\d,\.]/g, '');
  
  // If empty, return empty
  if (!cleaned) {
    return '';
  }
  
  // Find the last separator (comma or dot) to determine decimal part
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');
  const lastSeparatorIndex = Math.max(lastCommaIndex, lastDotIndex);
  
  let integerPart: string;
  let decimalPart: string = '';
  
  if (lastSeparatorIndex > -1) {
    // Split at the last separator
    integerPart = cleaned.substring(0, lastSeparatorIndex).replace(/[,\.]/g, '');
    decimalPart = cleaned.substring(lastSeparatorIndex + 1);
  } else {
    // No separator found
    integerPart = cleaned;
  }
  
  // Add thousands separators to integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Limit decimal part to 2 digits
  if (decimalPart.length > 2) {
    decimalPart = decimalPart.substring(0, 2);
  }
  
  // Combine parts
  if (decimalPart) {
    return `${integerPart},${decimalPart}`;
  }
  
  return integerPart;
}
