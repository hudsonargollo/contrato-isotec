/**
 * Unit Tests for CEP Validation Module
 * 
 * Tests the CEP validation, formatting, and sanitization functions
 * 
 * Requirements: 3.5
 */

import {
  sanitizeCEP,
  formatCEP,
  validateCEP,
  getCEPErrorMessage
} from '@/lib/validation/cep';

describe('CEP Validation Module', () => {
  describe('sanitizeCEP', () => {
    it('should remove hyphen from formatted CEP', () => {
      expect(sanitizeCEP('12345-678')).toBe('12345678');
    });

    it('should return unchanged CEP if already sanitized', () => {
      expect(sanitizeCEP('12345678')).toBe('12345678');
    });

    it('should remove all non-digit characters', () => {
      expect(sanitizeCEP('12.345-678')).toBe('12345678');
      expect(sanitizeCEP('12 345 678')).toBe('12345678');
      expect(sanitizeCEP('CEP: 12345-678')).toBe('12345678');
    });

    it('should handle empty string', () => {
      expect(sanitizeCEP('')).toBe('');
    });
  });

  describe('formatCEP', () => {
    it('should format sanitized CEP with hyphen', () => {
      expect(formatCEP('12345678')).toBe('12345-678');
    });

    it('should return already formatted CEP unchanged', () => {
      expect(formatCEP('12345-678')).toBe('12345-678');
    });

    it('should return original string if length is not 8 digits', () => {
      expect(formatCEP('1234567')).toBe('1234567');
      expect(formatCEP('123456789')).toBe('123456789');
      expect(formatCEP('123')).toBe('123');
    });

    it('should format CEP with extra characters after sanitization', () => {
      expect(formatCEP('12.345.678')).toBe('12345-678');
    });
  });

  describe('validateCEP', () => {
    it('should validate correctly formatted CEP', () => {
      expect(validateCEP('12345-678')).toBe(true);
    });

    it('should validate sanitized CEP', () => {
      expect(validateCEP('12345678')).toBe(true);
    });

    it('should validate CEP with extra formatting characters', () => {
      expect(validateCEP('12.345-678')).toBe(true);
      expect(validateCEP('12 345 678')).toBe(true);
    });

    it('should reject CEP with less than 8 digits', () => {
      expect(validateCEP('1234567')).toBe(false);
      expect(validateCEP('123')).toBe(false);
      expect(validateCEP('')).toBe(false);
    });

    it('should reject CEP with more than 8 digits', () => {
      expect(validateCEP('123456789')).toBe(false);
      expect(validateCEP('12345678901')).toBe(false);
    });

    it('should validate real Brazilian CEPs', () => {
      // São Paulo - Avenida Paulista
      expect(validateCEP('01310-100')).toBe(true);
      // Rio de Janeiro - Copacabana
      expect(validateCEP('22070-900')).toBe(true);
      // Brasília - Esplanada dos Ministérios
      expect(validateCEP('70040-020')).toBe(true);
    });
  });

  describe('getCEPErrorMessage', () => {
    it('should return null for valid CEP', () => {
      expect(getCEPErrorMessage('12345-678')).toBeNull();
      expect(getCEPErrorMessage('12345678')).toBeNull();
    });

    it('should return error message for CEP with wrong length', () => {
      expect(getCEPErrorMessage('1234567')).toBe('CEP must contain exactly 8 digits');
      expect(getCEPErrorMessage('123456789')).toBe('CEP must contain exactly 8 digits');
      expect(getCEPErrorMessage('123')).toBe('CEP must contain exactly 8 digits');
      expect(getCEPErrorMessage('')).toBe('CEP must contain exactly 8 digits');
    });
  });

  describe('Edge Cases', () => {
    it('should handle CEP with all zeros', () => {
      expect(validateCEP('00000-000')).toBe(true);
      expect(formatCEP('00000000')).toBe('00000-000');
    });

    it('should handle CEP with all nines', () => {
      expect(validateCEP('99999-999')).toBe(true);
      expect(formatCEP('99999999')).toBe('99999-999');
    });

    it('should handle CEP with mixed formatting', () => {
      expect(sanitizeCEP('12-345-678')).toBe('12345678');
      expect(validateCEP('12-345-678')).toBe(true);
    });
  });
});
