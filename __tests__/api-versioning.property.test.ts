/**
 * Property-Based Tests for API Versioning System
 * 
 * Tests universal properties that should hold across all API versions
 * and data transformations.
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import {
  extractApiVersion,
  isVersionSupported,
  transformResponseForVersion,
  createVersionedResponse,
  applyMigrationChain,
  getMigrationPath,
  ApiVersion,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION
} from '@/lib/middleware/api-versioning';
import { NextRequest } from 'next/server';

// Custom arbitraries for API versioning tests
const apiVersionArbitrary = fc.constantFrom(...SUPPORTED_VERSIONS);
const unsupportedVersionArbitrary = fc.oneof(
  fc.string().filter(s => !SUPPORTED_VERSIONS.includes(s as ApiVersion)),
  fc.float({ min: 3.0, max: 10.0 }).map(n => n.toString()),
  fc.constant('invalid')
);

const apiDataArbitrary = fc.record({
  id: fc.string(),
  name: fc.string(),
  created_at: fc.date(),
  enhanced_analytics: fc.option(fc.record({
    views: fc.nat(),
    interactions: fc.nat()
  })),
  advanced_permissions: fc.option(fc.array(fc.string())),
  version_info: fc.option(fc.record({
    api_version: fc.string(),
    response_format: fc.string()
  })),
  pagination: fc.option(fc.record({
    current_page: fc.nat({ min: 1 }),
    total_pages: fc.nat({ min: 1 }),
    total_items: fc.nat(),
    items_per_page: fc.nat({ min: 1, max: 100 }),
    has_next: fc.boolean(),
    has_previous: fc.boolean()
  }))
});

const requestHeadersArbitrary = fc.record({
  'Accept': fc.option(fc.oneof(
    fc.constant('application/json'),
    apiVersionArbitrary.map(v => `application/vnd.solarcrm.v${v}+json`),
    fc.string()
  )),
  'X-API-Version': fc.option(fc.oneof(
    apiVersionArbitrary,
    unsupportedVersionArbitrary
  )),
  'User-Agent': fc.option(fc.string())
}, { requiredKeys: [] });

describe('API Versioning Property-Based Tests', () => {
  /**
   * **Validates: Requirements 10.5**
   * Property: Version extraction should always return a supported version
   */
  it('should always return a supported version from any request', () => {
    fc.assert(fc.property(
      fc.string(), // URL
      requestHeadersArbitrary,
      (url, headers) => {
        // Filter out undefined headers
        const cleanHeaders = Object.fromEntries(
          Object.entries(headers).filter(([_, value]) => value !== undefined)
        ) as Record<string, string>;

        const request = new NextRequest(`https://api.example.com${url}`, {
          headers: cleanHeaders
        });
        
        const extractedVersion = extractApiVersion(request);
        
        // Property: Extracted version must always be supported
        expect(SUPPORTED_VERSIONS.includes(extractedVersion)).toBe(true);
        
        // Property: If no valid version is found, should return default
        const hasValidVersionHeader = 
          (cleanHeaders['Accept'] && cleanHeaders['Accept'].includes('vnd.solarcrm.v') && 
           SUPPORTED_VERSIONS.some(v => cleanHeaders['Accept']!.includes(`v${v}`))) ||
          (cleanHeaders['X-API-Version'] && SUPPORTED_VERSIONS.includes(cleanHeaders['X-API-Version'] as ApiVersion)) ||
          url.match(/\/api\/v(\d+\.\d+)\//) && SUPPORTED_VERSIONS.includes(url.match(/\/api\/v(\d+\.\d+)\//)![1] as ApiVersion);
        
        if (!hasValidVersionHeader) {
          expect(extractedVersion).toBe(DEFAULT_VERSION);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Data transformation should preserve essential data integrity
   */
  it('should preserve data integrity across version transformations', () => {
    fc.assert(fc.property(
      apiDataArbitrary,
      apiVersionArbitrary,
      (data, version) => {
        const transformed = transformResponseForVersion(data, version);
        
        // Property: Core fields should always be preserved
        expect(transformed.id).toBe(data.id);
        expect(transformed.name).toBe(data.name);
        
        // Property: Transformation should not add undefined fields
        Object.values(transformed).forEach(value => {
          expect(value).not.toBe(undefined);
        });
        
        // Property: Dates should be consistently formatted
        if (data.created_at) {
          if (version === '1.0') {
            expect(typeof transformed.created_at).toBe('string');
          } else {
            expect(transformed.created_at).toBeDefined();
          }
        }
        
        // Property: Version-specific fields should be handled correctly
        if (version === '1.0') {
          expect(transformed.enhanced_analytics).toBeUndefined();
          expect(transformed.advanced_permissions).toBeUndefined();
          expect(transformed.version_info).toBeUndefined();
        } else if (version === '1.1') {
          expect(transformed.version_info).toBeUndefined();
        } else if (version === '2.0') {
          expect(transformed.version_info).toBeDefined();
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Versioned responses should have consistent structure
   */
  it('should create consistent versioned responses', () => {
    fc.assert(fc.property(
      fc.record({
        message: fc.string(),
        data: fc.option(fc.object()),
        error: fc.option(fc.string())
      }),
      apiVersionArbitrary,
      fc.integer({ min: 200, max: 599 }),
      (responseData, version, statusCode) => {
        const response = createVersionedResponse(responseData, version, statusCode);
        
        // Property: Response should have correct status
        expect(response.status).toBe(statusCode);
        
        // Property: Response should have required headers
        expect(response.headers.get('Content-Type')).toBe(`application/vnd.solarcrm.v${version}+json`);
        expect(response.headers.get('X-API-Version')).toBe(version);
        expect(response.headers.get('X-Supported-Versions')).toBe(SUPPORTED_VERSIONS.join(', '));
        
        // Property: Deprecated versions should have deprecation headers
        if (version === '1.0') {
          expect(response.headers.get('X-API-Version-Status')).toBe('deprecated');
          expect(response.headers.get('X-API-Sunset-Date')).toBeDefined();
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Migration paths should be consistent and valid
   */
  it('should provide consistent migration paths', () => {
    fc.assert(fc.property(
      apiVersionArbitrary,
      apiVersionArbitrary,
      (fromVersion, toVersion) => {
        const migrationPath = getMigrationPath(fromVersion, toVersion);
        
        if (fromVersion === toVersion) {
          // Property: No migration needed for same version
          expect(migrationPath).toHaveLength(0);
        } else {
          // Property: Migration path should be valid if it exists
          if (migrationPath.length > 0) {
            expect(migrationPath[0].fromVersion).toBe(fromVersion);
            
            // Property: Each migration step should be valid
            migrationPath.forEach(migration => {
              expect(SUPPORTED_VERSIONS.includes(migration.fromVersion)).toBe(true);
              expect(SUPPORTED_VERSIONS.includes(migration.toVersion)).toBe(true);
              expect(typeof migration.breaking).toBe('boolean');
              expect(typeof migration.description).toBe('string');
              expect(typeof migration.migrate).toBe('function');
            });
            
            // Property: Final migration should reach target version
            const lastMigration = migrationPath[migrationPath.length - 1];
            expect(lastMigration.toVersion).toBe(toVersion);
          }
        }
      }
    ), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Migration chain application should be idempotent for same version
   */
  it('should handle migration chains consistently', () => {
    fc.assert(fc.property(
      apiDataArbitrary,
      apiVersionArbitrary,
      (data, version) => {
        // Property: Migrating to the same version should return identical data
        const migrated = applyMigrationChain(data, version, version);
        expect(migrated).toEqual(data);
        
        // Property: Migration should not throw errors for valid versions
        SUPPORTED_VERSIONS.forEach(targetVersion => {
          expect(() => applyMigrationChain(data, version, targetVersion)).not.toThrow();
        });
      }
    ), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Version support checking should be consistent
   */
  it('should consistently identify version support', () => {
    fc.assert(fc.property(
      fc.string(),
      (versionString) => {
        const isSupported = isVersionSupported(versionString);
        
        // Property: Supported versions should always return true
        if (SUPPORTED_VERSIONS.includes(versionString as ApiVersion)) {
          expect(isSupported).toBe(true);
        }
        
        // Property: Non-supported versions should always return false
        if (!SUPPORTED_VERSIONS.includes(versionString as ApiVersion)) {
          expect(isSupported).toBe(false);
        }
        
        // Property: Result should be boolean
        expect(typeof isSupported).toBe('boolean');
      }
    ), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Pagination transformation should maintain mathematical consistency
   */
  it('should maintain pagination consistency across versions', () => {
    fc.assert(fc.property(
      fc.record({
        current_page: fc.nat({ min: 1, max: 100 }),
        total_pages: fc.nat({ min: 1, max: 100 }),
        total_items: fc.nat({ max: 10000 }),
        items_per_page: fc.nat({ min: 1, max: 100 })
      }),
      apiVersionArbitrary,
      (paginationData, version) => {
        const dataWithPagination = {
          data: [],
          pagination: {
            ...paginationData,
            has_next: paginationData.current_page < paginationData.total_pages,
            has_previous: paginationData.current_page > 1
          }
        };
        
        const transformed = transformResponseForVersion(dataWithPagination, version);
        
        // Property: Pagination data should be preserved in some form
        expect(transformed.pagination).toBeDefined();
        
        // Property: Mathematical relationships should be maintained
        if (version === '1.0') {
          expect(transformed.pagination.page).toBe(paginationData.current_page);
          expect(transformed.pagination.per_page).toBe(paginationData.items_per_page);
          expect(transformed.pagination.total).toBe(paginationData.total_items);
        } else if (version === '1.1') {
          expect(transformed.pagination.current_page).toBe(paginationData.current_page);
          expect(transformed.pagination.total_pages).toBe(paginationData.total_pages);
          expect(transformed.pagination.total_items).toBe(paginationData.total_items);
          expect(transformed.pagination.items_per_page).toBe(paginationData.items_per_page);
        } else if (version === '2.0') {
          expect(transformed.pagination.current_page).toBe(paginationData.current_page);
          expect(transformed.pagination.has_next).toBe(paginationData.current_page < paginationData.total_pages);
          expect(transformed.pagination.has_previous).toBe(paginationData.current_page > 1);
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Error responses should maintain version consistency
   */
  it('should handle error responses consistently across versions', () => {
    fc.assert(fc.property(
      fc.record({
        error: fc.string(),
        message: fc.option(fc.string()),
        code: fc.option(fc.string())
      }),
      apiVersionArbitrary,
      fc.integer({ min: 400, max: 599 }),
      (errorData, version, statusCode) => {
        const response = createVersionedResponse(errorData, version, statusCode);
        
        // Property: Error responses should have error status codes
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(600);
        
        // Property: Error responses should maintain version headers
        expect(response.headers.get('X-API-Version')).toBe(version);
        
        // Property: Response should be JSON
        expect(response.headers.get('Content-Type')).toContain('json');
      }
    ), { numRuns: 50 });
  });

  /**
   * **Validates: Requirements 10.5**
   * Property: Data transformation should be deterministic
   */
  it('should produce deterministic transformations', () => {
    fc.assert(fc.property(
      apiDataArbitrary,
      apiVersionArbitrary,
      (data, version) => {
        // Property: Multiple transformations of the same data should yield identical results
        const transformation1 = transformResponseForVersion(data, version);
        const transformation2 = transformResponseForVersion(data, version);
        
        expect(transformation1).toEqual(transformation2);
        
        // Property: Transformation should not mutate original data
        const originalDataCopy = JSON.parse(JSON.stringify(data));
        transformResponseForVersion(data, version);
        expect(data).toEqual(originalDataCopy);
      }
    ), { numRuns: 100 });
  });
});