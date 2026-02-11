/**
 * API Versioning System Tests
 * 
 * Tests for API version management, backward compatibility,
 * and migration functionality.
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextRequest: jest.requireActual('next/server').NextRequest,
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: init?.headers
      });
      // Add custom properties to match NextResponse
      Object.defineProperty(response, 'headers', {
        value: new Headers(init?.headers),
        writable: false
      });
      return response;
    })
  }
}));

import {
  extractApiVersion,
  isVersionSupported,
  isVersionCompatible,
  transformResponseForVersion,
  createVersionedResponse,
  withApiVersioning,
  getMigrationPath,
  applyMigrationChain,
  getVersionCompatibilityInfo,
  ApiVersion,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
  LATEST_VERSION
} from '@/lib/middleware/api-versioning';

describe('API Versioning System', () => {
  describe('Version Extraction', () => {
    it('should extract version from Accept header', () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: {
          'Accept': 'application/vnd.solarcrm.v2.0+json'
        }
      });
      
      expect(extractApiVersion(request)).toBe('2.0');
    });

    it('should extract version from X-API-Version header', () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-API-Version': '1.1'
        }
      });
      
      expect(extractApiVersion(request)).toBe('1.1');
    });

    it('should extract version from URL path', () => {
      const request = new NextRequest('https://api.example.com/api/v1.1/test');
      
      expect(extractApiVersion(request)).toBe('1.1');
    });

    it('should return default version when no version specified', () => {
      const request = new NextRequest('https://api.example.com/test');
      
      expect(extractApiVersion(request)).toBe(DEFAULT_VERSION);
    });

    it('should return default version for unsupported version', () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: {
          'X-API-Version': '3.0'
        }
      });
      
      expect(extractApiVersion(request)).toBe(DEFAULT_VERSION);
    });

    it('should prioritize Accept header over X-API-Version header', () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: {
          'Accept': 'application/vnd.solarcrm.v2.0+json',
          'X-API-Version': '1.1'
        }
      });
      
      expect(extractApiVersion(request)).toBe('2.0');
    });
  });

  describe('Version Support and Compatibility', () => {
    it('should correctly identify supported versions', () => {
      expect(isVersionSupported('1.0')).toBe(true);
      expect(isVersionSupported('1.1')).toBe(true);
      expect(isVersionSupported('2.0')).toBe(true);
      expect(isVersionSupported('3.0')).toBe(false);
    });

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
    });
  });

  describe('Response Transformation', () => {
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
      expect(transformed.pagination.page).toBe(1);
      expect(transformed.pagination.per_page).toBe(20);
      expect(transformed.pagination.total).toBe(100);
      expect(transformed.created_at).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should transform data to v1.1 format', () => {
      const transformed = transformResponseForVersion(testData, '1.1');
      
      expect(transformed.enhanced_analytics).toBeDefined();
      expect(transformed.advanced_permissions).toBeDefined();
      expect(transformed.version_info).toBeUndefined();
      expect(transformed.pagination.current_page).toBe(1);
      expect(transformed.pagination.total_pages).toBe(5);
    });

    it('should transform data to v2.0 format', () => {
      const transformed = transformResponseForVersion(testData, '2.0');
      
      expect(transformed.version_info).toBeDefined();
      expect(transformed.version_info.api_version).toBe('2.0');
      expect(transformed.pagination.has_next).toBe(true);
      expect(transformed.pagination.has_previous).toBe(false);
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
  });

  describe('Versioned Response Creation', () => {
    it('should create versioned response with correct headers', () => {
      const data = { message: 'test' };
      const response = createVersionedResponse(data, '2.0', 200);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.solarcrm.v2.0+json');
      expect(response.headers.get('X-API-Version')).toBe('2.0');
      expect(response.headers.get('X-Supported-Versions')).toBe(SUPPORTED_VERSIONS.join(', '));
      expect(response.headers.get('X-Latest-Version')).toBe(LATEST_VERSION);
    });

    it('should include deprecation warnings for deprecated versions', () => {
      const data = { message: 'test' };
      const response = createVersionedResponse(data, '1.0', 200);
      
      expect(response.headers.get('X-API-Version-Status')).toBe('deprecated');
      expect(response.headers.get('X-API-Sunset-Date')).toBeDefined();
      expect(response.headers.get('Warning')).toContain('deprecated');
    });

    it('should include additional headers', () => {
      const data = { message: 'test' };
      const additionalHeaders = { 'X-Custom-Header': 'custom-value' };
      const response = createVersionedResponse(data, '2.0', 200, additionalHeaders);
      
      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    });
  });

  describe('Migration System', () => {
    it('should find direct migration path', () => {
      const path = getMigrationPath('1.0', '1.1');
      
      expect(path).toHaveLength(1);
      expect(path[0].fromVersion).toBe('1.0');
      expect(path[0].toVersion).toBe('1.1');
      expect(path[0].breaking).toBe(false);
    });

    it('should find multi-step migration path', () => {
      const path = getMigrationPath('1.0', '2.0');
      
      expect(path).toHaveLength(1); // Direct path available
      expect(path[0].fromVersion).toBe('1.0');
      expect(path[0].toVersion).toBe('2.0');
      expect(path[0].breaking).toBe(true);
    });

    it('should return empty path for invalid migration', () => {
      const path = getMigrationPath('2.0', '1.0');
      
      expect(path).toHaveLength(0);
    });

    it('should apply migration chain correctly', () => {
      const testData = {
        id: '123',
        name: 'Test',
        old_field: 'value'
      };
      
      const migrated = applyMigrationChain(testData, '1.0', '1.1');
      
      expect(migrated.enhanced_analytics).toBeDefined();
      expect(migrated.advanced_permissions).toBeDefined();
    });

    it('should handle migration chain with multiple steps', () => {
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

  describe('Versioned Route Handler', () => {
    const mockHandler1_0 = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ version: '1.0' }), { status: 200 })
    );
    const mockHandler1_1 = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ version: '1.1' }), { status: 200 })
    );
    const mockHandler2_0 = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ version: '2.0' }), { status: 200 })
    );

    const versionedHandler = withApiVersioning({
      '1.0': mockHandler1_0,
      '1.1': mockHandler1_1,
      '2.0': mockHandler2_0
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should route to correct version handler', async () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: { 'X-API-Version': '1.1' }
      });
      
      await versionedHandler(request);
      
      expect(mockHandler1_1).toHaveBeenCalledWith(request);
      expect(mockHandler1_0).not.toHaveBeenCalled();
      expect(mockHandler2_0).not.toHaveBeenCalled();
    });

    it('should use default version when no version specified', async () => {
      const request = new NextRequest('https://api.example.com/test');
      
      await versionedHandler(request);
      
      expect(mockHandler1_0).toHaveBeenCalledWith(request); // DEFAULT_VERSION is '1.0'
    });

    it('should return error for unsupported version', async () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: { 'X-API-Version': '3.0' }
      });
      
      const response = await versionedHandler(request);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Unsupported API version');
      expect(body.details.supported_versions).toEqual(SUPPORTED_VERSIONS);
    });

    it('should use compatible handler when exact version not available', async () => {
      const limitedHandler = withApiVersioning({
        '1.0': mockHandler1_0,
        '2.0': mockHandler2_0
        // No 1.1 handler
      });

      const request = new NextRequest('https://api.example.com/test', {
        headers: { 'X-API-Version': '1.1' }
      });
      
      await limitedHandler(request);
      
      // Should fall back to compatible version (2.0 is compatible with 1.1)
      expect(mockHandler2_0).toHaveBeenCalledWith(request);
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const errorVersionedHandler = withApiVersioning({
        '1.0': errorHandler
      });

      const request = new NextRequest('https://api.example.com/test');
      
      const response = await errorVersionedHandler(request);
      
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed Accept header', () => {
      const request = new NextRequest('https://api.example.com/test', {
        headers: {
          'Accept': 'invalid-header-format'
        }
      });
      
      expect(extractApiVersion(request)).toBe(DEFAULT_VERSION);
    });

    it('should handle empty version string', () => {
      expect(isVersionSupported('')).toBe(false);
    });

    it('should handle transformation of complex nested objects', () => {
      const complexData = {
        user: {
          profile: {
            settings: {
              enhanced_analytics: { enabled: true },
              version_info: { api_version: '2.0' }
            }
          }
        },
        items: [
          { id: 1, advanced_permissions: ['read'] },
          { id: 2, version_info: { format: 'v2' } }
        ]
      };

      const transformed = transformResponseForVersion(complexData, '1.0');
      
      // Should only transform top-level fields
      expect(transformed.enhanced_analytics).toBeUndefined();
      expect(transformed.version_info).toBeUndefined();
      expect(transformed.user.profile.settings.enhanced_analytics).toBeDefined();
    });

    it('should handle circular references in data', () => {
      const circularData: any = { id: '123', name: 'Test' };
      circularData.self = circularData;

      // Should not throw error
      expect(() => transformResponseForVersion(circularData, '1.0')).not.toThrow();
    });
  });
});