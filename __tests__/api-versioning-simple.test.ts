/**
 * Simple API Versioning System Tests
 * 
 * Tests core functionality without complex mocking
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { describe, it, expect } from '@jest/globals';
import {
  isVersionSupported,
  isVersionCompatible,
  transformResponseForVersion,
  getMigrationPath,
  applyMigrationChain,
  getVersionCompatibilityInfo,
  ApiVersion,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
  LATEST_VERSION,
  VERSION_STATUS,
  VERSION_SUNSET_DATES
} from '@/lib/middleware/api-versioning';

describe('API Versioning Core Functions', () => {
  describe('Version Support', () => {
    it('should correctly identify supported versions', () => {
      expect(isVersionSupported('1.0')).toBe(true);
      expect(isVersionSupported('1.1')).toBe(true);
      expect(isVersionSupported('2.0')).toBe(true);
      expect(isVersionSupported('3.0')).toBe(false);
      expect(isVersionSupported('')).toBe(false);
    });

    it('should have correct version constants', () => {
      expect(SUPPORTED_VERSIONS).toContain('1.0');
      expect(SUPPORTED_VERSIONS).toContain('1.1');
      expect(SUPPORTED_VERSIONS).toContain('2.0');
      expect(DEFAULT_VERSION).toBe('1.0');
      expect(LATEST_VERSION).toBe('2.0');
    });

    it('should have version status information', () => {
      expect(VERSION_STATUS['1.0']).toBe('deprecated');
      expect(VERSION_STATUS['1.1']).toBe('active');
      expect(VERSION_STATUS['2.0']).toBe('active');
    });

    it('should have sunset dates for deprecated versions', () => {
      expect(VERSION_SUNSET_DATES['1.0']).toBeInstanceOf(Date);
      expect(VERSION_SUNSET_DATES['1.1']).toBeNull();
      expect(VERSION_SUNSET_DATES['2.0']).toBeNull();
    });
  });

  describe('Version Compatibility', () => {
    it('should check version compatibility correctly', () => {
      expect(isVersionCompatible('1.0', '1.0')).toBe(true);
      expect(isVersionCompatible('1.0', '1.1')).toBe(true);
      expect(isVersionCompatible('1.1', '1.0')).toBe(false);
      expect(isVersionCompatible('1.0', '2.0')).toBe(true);
      expect(isVersionCompatible('2.0', '1.0')).toBe(false);
    });

    it('should return version compatibility information', () => {
      const info = getVersionCompatibilityInfo('1.1');
      
      expect(info.version).toBe('1.1');
      expect(info.status).toBe('active');
      expect(info.compatible_versions).toContain('1.0');
      expect(info.compatible_versions).toContain('1.1');
      expect(Array.isArray(info.deprecated_features)).toBe(true);
      expect(Array.isArray(info.breaking_changes)).toBe(true);
      expect(Array.isArray(info.migration_available_to)).toBe(true);
    });
  });

  describe('Data Transformation', () => {
    const testData = {
      id: '123',
      name: 'Test Lead',
      created_at: new Date('2024-01-01T00:00:00Z'),
      enhanced_analytics: { views: 10 },
      advanced_permissions: ['read', 'write'],
      version_info: { api_version: '2.0' },
      pagination: {
        current_page: 1,
        total_pages: 5,
        total_items: 100,
        items_per_page: 20,
        has_next: true,
        has_previous: false
      }
    };

    it('should transform data to v1.0 format', () => {
      const transformed = transformResponseForVersion(testData, '1.0');
      
      expect(transformed.enhanced_analytics).toBeUndefined();
      expect(transformed.advanced_permissions).toBeUndefined();
      expect(transformed.version_info).toBeUndefined();
      expect(transformed.id).toBe('123');
      expect(transformed.name).toBe('Test Lead');
      
      if (transformed.pagination) {
        expect(transformed.pagination.page).toBe(1);
        expect(transformed.pagination.per_page).toBe(20);
        expect(transformed.pagination.total).toBe(100);
      }
    });

    it('should transform data to v1.1 format', () => {
      const transformed = transformResponseForVersion(testData, '1.1');
      
      expect(transformed.enhanced_analytics).toBeDefined();
      expect(transformed.advanced_permissions).toBeDefined();
      expect(transformed.version_info).toBeUndefined();
      expect(transformed.id).toBe('123');
      expect(transformed.name).toBe('Test Lead');
      
      if (transformed.pagination) {
        expect(transformed.pagination.current_page).toBe(1);
        expect(transformed.pagination.total_pages).toBe(5);
      }
    });

    it('should transform data to v2.0 format', () => {
      const transformed = transformResponseForVersion(testData, '2.0');
      
      expect(transformed.version_info).toBeDefined();
      expect(transformed.version_info.api_version).toBe('2.0');
      expect(transformed.id).toBe('123');
      expect(transformed.name).toBe('Test Lead');
      
      if (transformed.pagination) {
        expect(transformed.pagination.has_next).toBe(true);
        expect(transformed.pagination.has_previous).toBe(false);
      }
    });

    it('should handle null and undefined data', () => {
      expect(transformResponseForVersion(null, '1.0')).toBeNull();
      expect(transformResponseForVersion(undefined, '1.0')).toBeUndefined();
    });

    it('should handle primitive data types', () => {
      expect(transformResponseForVersion('string', '1.0')).toBe('string');
      expect(transformResponseForVersion(123, '1.0')).toBe(123);
      expect(transformResponseForVersion(true, '1.0')).toBe(true);
    });

    it('should not mutate original data', () => {
      const originalData = { ...testData };
      transformResponseForVersion(testData, '1.0');
      expect(testData).toEqual(originalData);
    });
  });

  describe('Migration System', () => {
    it('should find direct migration path', () => {
      const path = getMigrationPath('1.0', '1.1');
      
      expect(path).toHaveLength(1);
      expect(path[0].fromVersion).toBe('1.0');
      expect(path[0].toVersion).toBe('1.1');
      expect(path[0].breaking).toBe(false);
      expect(typeof path[0].description).toBe('string');
      expect(typeof path[0].migrate).toBe('function');
    });

    it('should find migration path to v2.0', () => {
      const path = getMigrationPath('1.0', '2.0');
      
      expect(path).toHaveLength(1);
      expect(path[0].fromVersion).toBe('1.0');
      expect(path[0].toVersion).toBe('2.0');
      expect(path[0].breaking).toBe(true);
    });

    it('should return empty path for same version', () => {
      const path = getMigrationPath('1.0', '1.0');
      expect(path).toHaveLength(0);
    });

    it('should return empty path for invalid migration', () => {
      const path = getMigrationPath('2.0', '1.0');
      expect(path).toHaveLength(0);
    });

    it('should apply migration chain correctly', () => {
      const testData = {
        id: '123',
        name: 'Test'
      };
      
      const migrated = applyMigrationChain(testData, '1.0', '1.1');
      
      expect(migrated.id).toBe('123');
      expect(migrated.name).toBe('Test');
      expect(migrated.enhanced_analytics).toBeDefined();
      expect(migrated.advanced_permissions).toBeDefined();
    });

    it('should handle migration to same version', () => {
      const testData = { id: '123', name: 'Test' };
      const migrated = applyMigrationChain(testData, '1.0', '1.0');
      
      expect(migrated).toEqual(testData);
    });

    it('should handle complex migration chain', () => {
      const testData = {
        id: '123',
        name: 'Test'
      };
      
      const migrated = applyMigrationChain(testData, '1.0', '2.0');
      
      expect(migrated.enhanced_analytics).toBeDefined();
      expect(migrated.version_info).toBeDefined();
      expect(migrated.version_info.api_version).toBe('2.0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects in transformation', () => {
      const emptyObj = {};
      const transformed = transformResponseForVersion(emptyObj, '1.0');
      expect(typeof transformed).toBe('object');
    });

    it('should handle arrays in transformation', () => {
      const arrayData = [1, 2, 3];
      const transformed = transformResponseForVersion(arrayData, '1.0');
      expect(transformed).toEqual(arrayData);
    });

    it('should handle nested objects correctly', () => {
      const nestedData = {
        user: {
          profile: {
            enhanced_analytics: { enabled: true },
            version_info: { api_version: '2.0' }
          }
        },
        enhanced_analytics: { views: 10 },
        version_info: { format: 'v2' }
      };

      const transformed = transformResponseForVersion(nestedData, '1.0');
      
      // Top-level fields should be removed
      expect(transformed.enhanced_analytics).toBeUndefined();
      expect(transformed.version_info).toBeUndefined();
      
      // Nested fields should remain (only top-level transformation)
      expect(transformed.user.profile.enhanced_analytics).toBeDefined();
      expect(transformed.user.profile.version_info).toBeDefined();
    });

    it('should handle complex pagination scenarios', () => {
      const paginationData = {
        pagination: {
          current_page: 3,
          total_pages: 10,
          total_items: 200,
          items_per_page: 20,
          has_next: true,
          has_previous: true
        }
      };

      // Test v1.0 transformation
      const v1_0 = transformResponseForVersion(paginationData, '1.0');
      expect(v1_0.pagination.page).toBe(3);
      expect(v1_0.pagination.per_page).toBe(20);
      expect(v1_0.pagination.total).toBe(200);

      // Test v2.0 transformation
      const v2_0 = transformResponseForVersion(paginationData, '2.0');
      expect(v2_0.pagination.has_next).toBe(true);
      expect(v2_0.pagination.has_previous).toBe(true);
      expect(v2_0.version_info).toBeDefined();
    });
  });

  describe('Migration Data Integrity', () => {
    it('should preserve all original data through migration', () => {
      const originalData = {
        id: 'test-123',
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '+1234567890',
        score: 85,
        status: 'qualified',
        created_at: new Date('2024-01-01'),
        custom_field: 'custom_value'
      };

      const migrated = applyMigrationChain(originalData, '1.0', '2.0');

      // All original fields should be preserved
      expect(migrated.id).toBe(originalData.id);
      expect(migrated.name).toBe(originalData.name);
      expect(migrated.email).toBe(originalData.email);
      expect(migrated.phone).toBe(originalData.phone);
      expect(migrated.score).toBe(originalData.score);
      expect(migrated.status).toBe(originalData.status);
      expect(migrated.custom_field).toBe(originalData.custom_field);

      // New fields should be added
      expect(migrated.enhanced_analytics).toBeDefined();
      expect(migrated.version_info).toBeDefined();
    });

    it('should handle migration with existing enhanced fields', () => {
      const dataWithEnhanced = {
        id: '123',
        name: 'Test',
        enhanced_analytics: { existing: true },
        advanced_permissions: ['existing']
      };

      const migrated = applyMigrationChain(dataWithEnhanced, '1.0', '1.1');

      // Should preserve existing enhanced fields
      expect(migrated.enhanced_analytics.existing).toBe(true);
      expect(migrated.advanced_permissions).toContain('existing');
    });
  });
});