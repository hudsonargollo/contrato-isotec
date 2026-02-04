/**
 * CPF Validation Module
 * 
 * This module provides utilities for validating, formatting, and sanitizing
 * Brazilian CPF (Cadastro de Pessoas Físicas) numbers.
 * 
 * CPF Format: XXX.XXX.XXX-YY
 * - First 9 digits: Base number
 * - Last 2 digits: Check digits calculated using a specific algorithm
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

/**
 * Removes all non-digit characters from a CPF string
 * 
 * @param cpf - CPF string with or without formatting
 * @returns CPF string containing only digits
 * 
 * @example
 * sanitizeCPF('123.456.789-09') // returns '12345678909'
 * sanitizeCPF('12345678909') // returns '12345678909'
 */
export function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formats a CPF string with dots and hyphen
 * 
 * @param cpf - CPF string with or without formatting
 * @returns Formatted CPF string (XXX.XXX.XXX-YY) or original if invalid length
 * 
 * @example
 * formatCPF('12345678909') // returns '123.456.789-09'
 * formatCPF('123.456.789-09') // returns '123.456.789-09'
 */
export function formatCPF(cpf: string): string {
  const sanitized = sanitizeCPF(cpf);
  
  // Only format if we have exactly 11 digits
  if (sanitized.length !== 11) {
    return cpf;
  }
  
  return sanitized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Calculates the two check digits for a CPF
 * 
 * The CPF check digit algorithm:
 * - First check digit: Sum of (digit * weight) for positions 1-9, weights 10-2
 *   Remainder = sum % 11
 *   If remainder < 2, digit = 0, else digit = 11 - remainder
 * 
 * - Second check digit: Sum of (digit * weight) for positions 1-10, weights 11-2
 *   Remainder = sum % 11
 *   If remainder < 2, digit = 0, else digit = 11 - remainder
 * 
 * @param cpf - CPF string (first 9 digits)
 * @returns Tuple containing the two check digits [firstDigit, secondDigit]
 * 
 * @example
 * calculateCPFCheckDigits('123456789') // returns [0, 9]
 */
export function calculateCPFCheckDigits(cpf: string): [number, number] {
  const sanitized = sanitizeCPF(cpf);
  const digits = sanitized.split('').map(Number);
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = sum % 11;
  const firstCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second check digit (including first check digit)
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (11 - i);
  }
  sum += firstCheckDigit * 2;
  remainder = sum % 11;
  const secondCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return [firstCheckDigit, secondCheckDigit];
}

/**
 * Validates a CPF number using the standard Brazilian algorithm
 * 
 * Validation checks:
 * 1. Must have exactly 11 digits after sanitization
 * 2. Cannot have all identical digits (e.g., '111.111.111-11')
 * 3. Check digits must be correctly calculated
 * 
 * @param cpf - CPF string with or without formatting
 * @returns true if CPF is valid, false otherwise
 * 
 * @example
 * validateCPF('123.456.789-09') // returns true if check digits are correct
 * validateCPF('111.111.111-11') // returns false (all same digits)
 * validateCPF('12345678') // returns false (wrong length)
 */
export function validateCPF(cpf: string): boolean {
  const sanitized = sanitizeCPF(cpf);
  
  // Check 1: Must have exactly 11 digits
  if (sanitized.length !== 11) {
    return false;
  }
  
  // Check 2: Cannot have all identical digits
  const allSameDigit = /^(\d)\1{10}$/.test(sanitized);
  if (allSameDigit) {
    return false;
  }
  
  // Check 3: Verify check digits
  const providedCheckDigits = [
    parseInt(sanitized[9], 10),
    parseInt(sanitized[10], 10)
  ];
  
  const calculatedCheckDigits = calculateCPFCheckDigits(sanitized.substring(0, 9));
  
  return (
    providedCheckDigits[0] === calculatedCheckDigits[0] &&
    providedCheckDigits[1] === calculatedCheckDigits[1]
  );
}

/**
 * Gets a descriptive error message for an invalid CPF
 * 
 * @param cpf - CPF string to validate
 * @returns Error message string, or null if CPF is valid
 * 
 * @example
 * getCPFErrorMessage('123') // returns 'CPF must contain exactly 11 digits'
 * getCPFErrorMessage('111.111.111-11') // returns 'CPF cannot have all identical digits'
 * getCPFErrorMessage('123.456.789-00') // returns 'CPF check digits are invalid'
 */
export function getCPFErrorMessage(cpf: string): string | null {
  const sanitized = sanitizeCPF(cpf);
  
  // Check length
  if (sanitized.length !== 11) {
    return 'CPF must contain exactly 11 digits';
  }
  
  // Check for all same digits
  const allSameDigit = /^(\d)\1{10}$/.test(sanitized);
  if (allSameDigit) {
    return 'CPF cannot have all identical digits';
  }
  
  // Check digits
  const providedCheckDigits = [
    parseInt(sanitized[9], 10),
    parseInt(sanitized[10], 10)
  ];
  
  const calculatedCheckDigits = calculateCPFCheckDigits(sanitized.substring(0, 9));
  
  if (
    providedCheckDigits[0] !== calculatedCheckDigits[0] ||
    providedCheckDigits[1] !== calculatedCheckDigits[1]
  ) {
    return 'CPF check digits are invalid';
  }
  
  return null;
}
