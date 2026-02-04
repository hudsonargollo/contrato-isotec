/**
 * Unit tests for currency formatting utilities
 * 
 * Tests the BRL currency formatting, parsing, and validation functions
 * 
 * Requirements: 1.8, 13.2
 */

import {
  formatCurrency,
  parseCurrency,
  validatePositiveValue,
  getCurrencyErrorMessage,
  formatCurrencyInput
} from '@/lib/validation/currency';

describe('Currency Formatting Module', () => {
  describe('formatCurrency', () => {
    it('should format integer values with R$ symbol and proper separators', () => {
      const result1 = formatCurrency(1000);
      const result2 = formatCurrency(1234567);
      // Check that it contains R$, proper separators, and decimal places
      expect(result1).toContain('R$');
      expect(result1).toContain('1.000,00');
      expect(result2).toContain('R$');
      expect(result2).toContain('1.234.567,00');
    });

    it('should format decimal values with exactly 2 decimal places', () => {
      const result1 = formatCurrency(1234.56);
      const result2 = formatCurrency(0.5);
      const result3 = formatCurrency(0.99);
      expect(result1).toContain('1.234,56');
      expect(result2).toContain('0,50');
      expect(result3).toContain('0,99');
    });

    it('should format small values correctly', () => {
      const result1 = formatCurrency(0.01);
      const result2 = formatCurrency(1);
      const result3 = formatCurrency(10);
      expect(result1).toContain('0,01');
      expect(result2).toContain('1,00');
      expect(result3).toContain('10,00');
    });

    it('should format large values with multiple thousands separators', () => {
      const result1 = formatCurrency(1234567.89);
      const result2 = formatCurrency(9999999.99);
      expect(result1).toContain('1.234.567,89');
      expect(result2).toContain('9.999.999,99');
    });

    it('should handle zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
    });

    it('should format negative values (for display purposes)', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-');
      expect(result).toContain('100,00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse Brazilian format with R$ symbol', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
      expect(parseCurrency('R$ 1.000,00')).toBe(1000);
      expect(parseCurrency('R$ 0,50')).toBe(0.5);
    });

    it('should parse Brazilian format without R$ symbol', () => {
      expect(parseCurrency('1.234,56')).toBe(1234.56);
      expect(parseCurrency('1.000,00')).toBe(1000);
      expect(parseCurrency('0,50')).toBe(0.5);
    });

    it('should parse values without thousands separators', () => {
      expect(parseCurrency('1234,56')).toBe(1234.56);
      expect(parseCurrency('100,00')).toBe(100);
    });

    it('should parse international format (dot as decimal)', () => {
      expect(parseCurrency('1234.56')).toBe(1234.56);
      expect(parseCurrency('1,234.56')).toBe(1234.56);
    });

    it('should parse integer values', () => {
      expect(parseCurrency('1000')).toBe(1000);
      expect(parseCurrency('R$ 1000')).toBe(1000);
    });

    it('should handle values with extra spaces', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
      expect(parseCurrency('  1.234,56  ')).toBe(1234.56);
    });

    it('should return NaN for invalid input', () => {
      expect(parseCurrency('abc')).toBeNaN();
      expect(parseCurrency('')).toBeNaN();
      expect(parseCurrency('R$')).toBeNaN();
    });
  });

  describe('validatePositiveValue', () => {
    it('should return true for positive numbers', () => {
      expect(validatePositiveValue(100)).toBe(true);
      expect(validatePositiveValue(0.01)).toBe(true);
      expect(validatePositiveValue(1234567.89)).toBe(true);
    });

    it('should return true for positive currency strings', () => {
      expect(validatePositiveValue('R$ 100,00')).toBe(true);
      expect(validatePositiveValue('1.234,56')).toBe(true);
      expect(validatePositiveValue('0,01')).toBe(true);
    });

    it('should return false for zero', () => {
      expect(validatePositiveValue(0)).toBe(false);
      expect(validatePositiveValue('0')).toBe(false);
      expect(validatePositiveValue('R$ 0,00')).toBe(false);
    });

    it('should return false for negative values', () => {
      expect(validatePositiveValue(-10)).toBe(false);
      expect(validatePositiveValue('-100,00')).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(validatePositiveValue('abc')).toBe(false);
      expect(validatePositiveValue('')).toBe(false);
      expect(validatePositiveValue(NaN)).toBe(false);
    });
  });

  describe('getCurrencyErrorMessage', () => {
    it('should return null for valid positive values', () => {
      expect(getCurrencyErrorMessage(100)).toBeNull();
      expect(getCurrencyErrorMessage(0.01)).toBeNull();
      expect(getCurrencyErrorMessage('R$ 1.234,56')).toBeNull();
    });

    it('should return error message for zero', () => {
      expect(getCurrencyErrorMessage(0)).toBe('Value must be greater than zero');
      expect(getCurrencyErrorMessage(0, 'Contract value')).toBe('Contract value must be greater than zero');
    });

    it('should return error message for negative values', () => {
      expect(getCurrencyErrorMessage(-100)).toBe('Value must be greater than zero');
      expect(getCurrencyErrorMessage(-100, 'Amount')).toBe('Amount must be greater than zero');
    });

    it('should return error message for invalid input', () => {
      expect(getCurrencyErrorMessage('abc')).toBe('Value must be a valid number');
      expect(getCurrencyErrorMessage('abc', 'Price')).toBe('Price must be a valid number');
    });

    it('should use custom field name in error messages', () => {
      expect(getCurrencyErrorMessage(0, 'Contract value')).toBe('Contract value must be greater than zero');
      expect(getCurrencyErrorMessage(-10, 'kWp capacity')).toBe('kWp capacity must be greater than zero');
      expect(getCurrencyErrorMessage('invalid', 'Total')).toBe('Total must be a valid number');
    });
  });

  describe('formatCurrencyInput', () => {
    it('should format integer input with thousands separators', () => {
      expect(formatCurrencyInput('1234')).toBe('1.234');
      expect(formatCurrencyInput('1234567')).toBe('1.234.567');
    });

    it('should format input with decimal part', () => {
      expect(formatCurrencyInput('1234.5')).toBe('1.234,5');
      expect(formatCurrencyInput('1234.56')).toBe('1.234,56');
      expect(formatCurrencyInput('1234,5')).toBe('1.234,5');
      expect(formatCurrencyInput('1234,56')).toBe('1.234,56');
    });

    it('should limit decimal part to 2 digits', () => {
      expect(formatCurrencyInput('1234.567')).toBe('1.234,56');
      expect(formatCurrencyInput('1234,5678')).toBe('1.234,56');
    });

    it('should handle small values', () => {
      expect(formatCurrencyInput('1')).toBe('1');
      expect(formatCurrencyInput('12')).toBe('12');
      expect(formatCurrencyInput('123')).toBe('123');
    });

    it('should remove non-numeric characters except comma and dot', () => {
      expect(formatCurrencyInput('R$ 1234')).toBe('1.234');
      expect(formatCurrencyInput('1,234.56')).toBe('1.234,56');
    });

    it('should handle empty input', () => {
      expect(formatCurrencyInput('')).toBe('');
      expect(formatCurrencyInput('R$')).toBe('');
    });

    it('should handle partial decimal input', () => {
      expect(formatCurrencyInput('1234.')).toBe('1.234');
      expect(formatCurrencyInput('1234,')).toBe('1.234');
    });
  });

  describe('Integration scenarios', () => {
    it('should format and parse round-trip correctly', () => {
      const original = 1234.56;
      const formatted = formatCurrency(original);
      const parsed = parseCurrency(formatted);
      expect(parsed).toBe(original);
    });

    it('should validate contract values according to requirements', () => {
      // Requirement 13.1: Contract value must be positive
      expect(validatePositiveValue(1000)).toBe(true);
      expect(validatePositiveValue(0)).toBe(false);
      expect(validatePositiveValue(-100)).toBe(false);
    });

    it('should format currency values for display in UI', () => {
      // Requirement 1.8, 13.2: Format as BRL currency
      const value = 15000.50;
      const formatted = formatCurrency(value);
      expect(formatted).toContain('R$');
      expect(formatted).toContain('15.000,50');
    });

    it('should handle user input in forms', () => {
      // User types: 1234567
      let input = '1234567';
      let formatted = formatCurrencyInput(input);
      expect(formatted).toBe('1.234.567');
      
      // User adds decimal: 1234567.89
      input = '1234567.89';
      formatted = formatCurrencyInput(input);
      expect(formatted).toBe('1.234.567,89');
      
      // Parse for submission
      const value = parseCurrency(formatted);
      expect(value).toBe(1234567.89);
    });
  });
});
