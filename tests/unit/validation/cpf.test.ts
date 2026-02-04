/**
 * Unit tests for CPF validation module
 * 
 * Tests specific examples and edge cases for CPF validation,
 * formatting, and sanitization functions.
 */

import {
  sanitizeCPF,
  formatCPF,
  calculateCPFCheckDigits,
  validateCPF,
  getCPFErrorMessage
} from '@/lib/validation/cpf';

describe('CPF Validation Module', () => {
  describe('sanitizeCPF', () => {
    it('should remove dots and hyphens from formatted CPF', () => {
      expect(sanitizeCPF('123.456.789-09')).toBe('12345678909');
    });

    it('should return unchanged string if already sanitized', () => {
      expect(sanitizeCPF('12345678909')).toBe('12345678909');
    });

    it('should remove all non-digit characters', () => {
      expect(sanitizeCPF('123.456.789-09 ')).toBe('12345678909');
      expect(sanitizeCPF('123 456 789 09')).toBe('12345678909');
      expect(sanitizeCPF('abc123def456ghi789jk09')).toBe('12345678909');
    });

    it('should handle empty string', () => {
      expect(sanitizeCPF('')).toBe('');
    });
  });

  describe('formatCPF', () => {
    it('should format sanitized CPF with dots and hyphen', () => {
      expect(formatCPF('12345678909')).toBe('123.456.789-09');
    });

    it('should return already formatted CPF unchanged', () => {
      expect(formatCPF('123.456.789-09')).toBe('123.456.789-09');
    });

    it('should return original string if length is not 11 digits', () => {
      expect(formatCPF('123456789')).toBe('123456789');
      expect(formatCPF('123456789012')).toBe('123456789012');
    });

    it('should handle partially formatted CPF', () => {
      expect(formatCPF('123456789-09')).toBe('123.456.789-09');
    });
  });

  describe('calculateCPFCheckDigits', () => {
    it('should calculate correct check digits for valid base numbers', () => {
      // Known valid CPF: 123.456.789-09
      expect(calculateCPFCheckDigits('123456789')).toEqual([0, 9]);
    });

    it('should calculate check digits for CPF with all zeros in base', () => {
      // CPF: 000.000.001-91
      expect(calculateCPFCheckDigits('000000001')).toEqual([9, 1]);
    });

    it('should calculate check digits for another known valid CPF', () => {
      // CPF: 111.444.777-35
      expect(calculateCPFCheckDigits('111444777')).toEqual([3, 5]);
    });

    it('should handle CPF with formatting characters', () => {
      expect(calculateCPFCheckDigits('123.456.789')).toEqual([0, 9]);
    });
  });

  describe('validateCPF', () => {
    describe('valid CPFs', () => {
      it('should validate correctly formatted valid CPF', () => {
        expect(validateCPF('123.456.789-09')).toBe(true);
      });

      it('should validate sanitized valid CPF', () => {
        expect(validateCPF('12345678909')).toBe(true);
      });

      it('should validate other known valid CPFs', () => {
        expect(validateCPF('111.444.777-35')).toBe(true);
        expect(validateCPF('000.000.001-91')).toBe(true);
      });
    });

    describe('invalid CPFs - wrong length', () => {
      it('should reject CPF with less than 11 digits', () => {
        expect(validateCPF('123456789')).toBe(false);
        expect(validateCPF('12345678')).toBe(false);
        expect(validateCPF('123')).toBe(false);
      });

      it('should reject CPF with more than 11 digits', () => {
        expect(validateCPF('123456789012')).toBe(false);
        expect(validateCPF('12345678901234')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(validateCPF('')).toBe(false);
      });
    });

    describe('invalid CPFs - all same digits', () => {
      it('should reject CPF with all zeros', () => {
        expect(validateCPF('000.000.000-00')).toBe(false);
        expect(validateCPF('00000000000')).toBe(false);
      });

      it('should reject CPF with all ones', () => {
        expect(validateCPF('111.111.111-11')).toBe(false);
        expect(validateCPF('11111111111')).toBe(false);
      });

      it('should reject CPF with all same digits (2-9)', () => {
        expect(validateCPF('222.222.222-22')).toBe(false);
        expect(validateCPF('333.333.333-33')).toBe(false);
        expect(validateCPF('444.444.444-44')).toBe(false);
        expect(validateCPF('555.555.555-55')).toBe(false);
        expect(validateCPF('666.666.666-66')).toBe(false);
        expect(validateCPF('777.777.777-77')).toBe(false);
        expect(validateCPF('888.888.888-88')).toBe(false);
        expect(validateCPF('999.999.999-99')).toBe(false);
      });
    });

    describe('invalid CPFs - wrong check digits', () => {
      it('should reject CPF with incorrect first check digit', () => {
        expect(validateCPF('123.456.789-19')).toBe(false);
      });

      it('should reject CPF with incorrect second check digit', () => {
        expect(validateCPF('123.456.789-08')).toBe(false);
      });

      it('should reject CPF with both check digits incorrect', () => {
        expect(validateCPF('123.456.789-00')).toBe(false);
        expect(validateCPF('123.456.789-99')).toBe(false);
      });
    });

    describe('format normalization', () => {
      it('should validate CPF regardless of formatting', () => {
        const validCPF = '12345678909';
        expect(validateCPF(validCPF)).toBe(true);
        expect(validateCPF('123.456.789-09')).toBe(true);
        expect(validateCPF('123 456 789 09')).toBe(true);
        expect(validateCPF('123-456-789-09')).toBe(true);
      });

      it('should reject invalid CPF regardless of formatting', () => {
        const invalidCPF = '12345678900'; // wrong check digits
        expect(validateCPF(invalidCPF)).toBe(false);
        expect(validateCPF('123.456.789-00')).toBe(false);
        expect(validateCPF('123 456 789 00')).toBe(false);
      });
    });
  });

  describe('getCPFErrorMessage', () => {
    it('should return null for valid CPF', () => {
      expect(getCPFErrorMessage('123.456.789-09')).toBeNull();
      expect(getCPFErrorMessage('12345678909')).toBeNull();
    });

    it('should return length error for CPF with wrong length', () => {
      expect(getCPFErrorMessage('123')).toBe('CPF must contain exactly 11 digits');
      expect(getCPFErrorMessage('123456789')).toBe('CPF must contain exactly 11 digits');
      expect(getCPFErrorMessage('123456789012')).toBe('CPF must contain exactly 11 digits');
    });

    it('should return identical digits error for CPF with all same digits', () => {
      expect(getCPFErrorMessage('111.111.111-11')).toBe('CPF cannot have all identical digits');
      expect(getCPFErrorMessage('00000000000')).toBe('CPF cannot have all identical digits');
      expect(getCPFErrorMessage('999.999.999-99')).toBe('CPF cannot have all identical digits');
    });

    it('should return check digit error for CPF with invalid check digits', () => {
      expect(getCPFErrorMessage('123.456.789-00')).toBe('CPF check digits are invalid');
      expect(getCPFErrorMessage('123.456.789-99')).toBe('CPF check digits are invalid');
      expect(getCPFErrorMessage('111.444.777-00')).toBe('CPF check digits are invalid');
    });

    it('should prioritize length error over other errors', () => {
      expect(getCPFErrorMessage('111')).toBe('CPF must contain exactly 11 digits');
    });

    it('should prioritize identical digits error over check digit error', () => {
      // All same digits would fail check digit validation too, but should show specific error
      expect(getCPFErrorMessage('111.111.111-11')).toBe('CPF cannot have all identical digits');
    });
  });
});
