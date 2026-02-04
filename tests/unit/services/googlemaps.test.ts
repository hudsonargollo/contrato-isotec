/**
 * Unit tests for Google Maps service
 * Tests coordinate validation, formatting, and boundary checks
 * Requirements: 3A.1, 3A.2, 3A.7
 */

import {
  validateBrazilianCoordinates,
  formatCoordinates,
  extractCityAndState,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  GOOGLE_MAPS_CONFIG,
} from '@/lib/services/googlemaps';

describe('Google Maps Service', () => {
  describe('validateBrazilianCoordinates', () => {
    it('should accept coordinates within Brazil boundaries', () => {
      // São Paulo
      expect(validateBrazilianCoordinates(-23.5505, -46.6333)).toBe(true);
      
      // Rio de Janeiro
      expect(validateBrazilianCoordinates(-22.9068, -43.1729)).toBe(true);
      
      // Brasília
      expect(validateBrazilianCoordinates(-15.7939, -47.8828)).toBe(true);
      
      // Northern boundary (near Roraima)
      expect(validateBrazilianCoordinates(5.0, -60.0)).toBe(true);
      
      // Southern boundary (near Rio Grande do Sul)
      expect(validateBrazilianCoordinates(-33.0, -53.0)).toBe(true);
    });

    it('should reject coordinates outside Brazil boundaries', () => {
      // Too far north
      expect(validateBrazilianCoordinates(10.0, -50.0)).toBe(false);
      
      // Too far south
      expect(validateBrazilianCoordinates(-35.0, -50.0)).toBe(false);
      
      // Too far west
      expect(validateBrazilianCoordinates(-15.0, -75.0)).toBe(false);
      
      // Too far east
      expect(validateBrazilianCoordinates(-15.0, -30.0)).toBe(false);
      
      // Completely outside (Europe)
      expect(validateBrazilianCoordinates(48.8566, 2.3522)).toBe(false);
    });

    it('should accept coordinates exactly on boundaries', () => {
      // North boundary
      expect(validateBrazilianCoordinates(5.27, -50.0)).toBe(true);
      
      // South boundary
      expect(validateBrazilianCoordinates(-33.75, -50.0)).toBe(true);
      
      // West boundary
      expect(validateBrazilianCoordinates(-15.0, -73.99)).toBe(true);
      
      // East boundary
      expect(validateBrazilianCoordinates(-15.0, -34.79)).toBe(true);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates with 8 decimal places', () => {
      const result = formatCoordinates(-23.5505, -46.6333);
      expect(result).toBe('-23.55050000, -46.63330000');
    });

    it('should pad zeros to reach 8 decimal places', () => {
      const result = formatCoordinates(-23.5, -46.6);
      expect(result).toBe('-23.50000000, -46.60000000');
    });

    it('should handle positive coordinates', () => {
      const result = formatCoordinates(5.27, -34.79);
      expect(result).toBe('5.27000000, -34.79000000');
    });

    it('should handle zero coordinates', () => {
      const result = formatCoordinates(0, 0);
      expect(result).toBe('0.00000000, 0.00000000');
    });

    it('should round to 8 decimal places', () => {
      const result = formatCoordinates(-23.123456789, -46.987654321);
      expect(result).toBe('-23.12345679, -46.98765432');
    });
  });

  describe('extractCityAndState', () => {
    it('should extract city and state from Brazilian address format', () => {
      // Format: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brazil"
      // The function looks for " - " separator and extracts the last two segments
      const address = 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP, 01310-200, Brazil';
      const result = extractCityAndState(address);
      
      expect(result).not.toBeNull();
      // In "1578 - Bela Vista", city would be "1578" and we need to look at next part
      // Actually in "São Paulo - SP", city is "São Paulo" and state is "SP"
      expect(result?.city).toBe('São Paulo');
      expect(result?.state).toBe('SP');
    });

    it('should handle addresses with different formats', () => {
      // Format: "Rua Augusta, 123, Centro - Rio de Janeiro - RJ, Brazil"
      // The regex matches "Centro - Rio de Janeiro" as city and "RJ" as state
      const address = 'Rua Augusta, 123, Centro - Rio de Janeiro - RJ, Brazil';
      const result = extractCityAndState(address);
      
      expect(result).not.toBeNull();
      // The pattern matches the last occurrence of "text - XX" where XX is 2 uppercase letters
      // So it captures "Centro - Rio de Janeiro" before the " - RJ" part
      expect(result?.city).toBe('Centro - Rio de Janeiro');
      expect(result?.state).toBe('RJ');
    });

    it('should return null for invalid address format', () => {
      const address = 'Invalid address without proper formatting';
      const result = extractCityAndState(address);
      
      expect(result).toBeNull();
    });

    it('should handle addresses with state code pattern', () => {
      // The function looks for pattern "City - XX" where XX is 2 uppercase letters
      const address = 'Street, Number, Neighborhood, Brasília - DF, Postal, Country';
      const result = extractCityAndState(address);
      
      expect(result).not.toBeNull();
      expect(result?.city).toBe('Brasília');
      expect(result?.state).toBe('DF');
    });
  });

  describe('Configuration constants', () => {
    it('should have valid default map center (São Paulo)', () => {
      expect(DEFAULT_MAP_CENTER.latitude).toBe(-23.5505);
      expect(DEFAULT_MAP_CENTER.longitude).toBe(-46.6333);
      expect(validateBrazilianCoordinates(
        DEFAULT_MAP_CENTER.latitude,
        DEFAULT_MAP_CENTER.longitude
      )).toBe(true);
    });

    it('should have reasonable default zoom level', () => {
      expect(DEFAULT_MAP_ZOOM).toBeGreaterThan(0);
      expect(DEFAULT_MAP_ZOOM).toBeLessThan(22);
    });

    it('should have Google Maps config structure', () => {
      expect(GOOGLE_MAPS_CONFIG).toHaveProperty('apiKey');
      expect(GOOGLE_MAPS_CONFIG).toHaveProperty('defaultCenter');
      expect(GOOGLE_MAPS_CONFIG).toHaveProperty('defaultZoom');
    });
  });
});
