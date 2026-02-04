/**
 * CEP Validation Module
 * 
 * This module provides utilities for validating, formatting, and sanitizing
 * Brazilian CEP (Código de Endereçamento Postal) numbers.
 * 
 * CEP Format: XXXXX-XXX
 * - 8 digits total
 * - Hyphen after the 5th digit
 * 
 * Requirements: 3.5
 */

/**
 * Removes all non-digit characters from a CEP string
 * 
 * @param cep - CEP string with or without formatting
 * @returns CEP string containing only digits
 * 
 * @example
 * sanitizeCEP('12345-678') // returns '12345678'
 * sanitizeCEP('12345678') // returns '12345678'
 */
export function sanitizeCEP(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Formats a CEP string with hyphen
 * 
 * @param cep - CEP string with or without formatting
 * @returns Formatted CEP string (XXXXX-XXX) or original if invalid length
 * 
 * @example
 * formatCEP('12345678') // returns '12345-678'
 * formatCEP('12345-678') // returns '12345-678'
 */
export function formatCEP(cep: string): string {
  const sanitized = sanitizeCEP(cep);
  
  // Only format if we have exactly 8 digits
  if (sanitized.length !== 8) {
    return cep;
  }
  
  return sanitized.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Validates a CEP number
 * 
 * Validation checks:
 * 1. Must have exactly 8 digits after sanitization
 * 
 * @param cep - CEP string with or without formatting
 * @returns true if CEP is valid, false otherwise
 * 
 * @example
 * validateCEP('12345-678') // returns true
 * validateCEP('12345678') // returns true
 * validateCEP('1234567') // returns false (wrong length)
 * validateCEP('123456789') // returns false (wrong length)
 */
export function validateCEP(cep: string): boolean {
  const sanitized = sanitizeCEP(cep);
  
  // Must have exactly 8 digits
  return sanitized.length === 8;
}

/**
 * Gets a descriptive error message for an invalid CEP
 * 
 * @param cep - CEP string to validate
 * @returns Error message string, or null if CEP is valid
 * 
 * @example
 * getCEPErrorMessage('123') // returns 'CEP must contain exactly 8 digits'
 * getCEPErrorMessage('12345-678') // returns null
 */
export function getCEPErrorMessage(cep: string): string | null {
  const sanitized = sanitizeCEP(cep);
  
  // Check length
  if (sanitized.length !== 8) {
    return 'CEP must contain exactly 8 digits';
  }
  
  return null;
}
