/**
 * API Versioning Middleware
 * 
 * Handles API versioning and backward compatibility for the SolarCRM Pro API.
 * Supports version negotiation through headers and URL paths.
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

// Supported API versions
export const SUPPORTED_VERSIONS = ['1.0', '1.1', '2.0'] as const;
export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

// Default version
export const DEFAULT_VERSION: ApiVersion = '1.0';

// Latest version
export const LATEST_VERSION: ApiVersion = '2.0';

// Version compatibility matrix
const VERSION_COMPATIBILITY: Record<ApiVersion, ApiVersion[]> = {
  '1.0': ['1.0'],
  '1.1': ['1.0', '1.1'], // v1.1 is backward compatible with v1.0
  '2.0': ['1.0', '1.1', '2.0'] // v2.0 supports all previous versions through compatibility layers
};

// Deprecated features by version
const DEPRECATED_FEATURES: Record<ApiVersion, string[]> = {
  '1.0': ['legacy_pagination', 'simple_auth'],
  '1.1': ['legacy_lead_format', 'basic_filtering'],
  '2.0': [] // Latest version has no deprecated features
};

// Breaking changes by version
const BREAKING_CHANGES: Record<ApiVersion, string[]> = {
  '1.0': [],
  '1.1': [],
  '2.0': ['pagination_format', 'error_response_format', 'date_format'] // v2.0 introduces breaking changes
};

// Version lifecycle status
export const VERSION_STATUS: Record<ApiVersion, 'active' | 'deprecated' | 'sunset'> = {
  '1.0': 'deprecated', // Still supported but deprecated
  '1.1': 'active', // Actively supported
  '2.0': 'active' // Latest and actively supported
};

// Sunset dates for deprecated versions
export const VERSION_SUNSET_DATES: Record<ApiVersion, Date | null> = {
  '1.0': new Date('2025-12-31'), // v1.0 will be sunset at end of 2025
  '1.1': null, // No sunset date yet
  '2.0': null // Latest version
};

/**
 * Extract API version from request
 */
export function extractApiVersion(request: NextRequest): ApiVersion {
  // Try to get version from Accept header (preferred)
  const acceptHeader = request.headers.get('accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.solarcrm\.v(\d+\.\d+)\+json/);
    if (versionMatch) {
      const version = versionMatch[1] as ApiVersion;
      if (SUPPORTED_VERSIONS.includes(version)) {
        return version;
      }
    }
  }
  
  // Try to get version from X-API-Version header
  const versionHeader = request.headers.get('x-api-version');
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader as ApiVersion)) {
    return versionHeader as ApiVersion;
  }
  
  // Try to get version from URL path (e.g., /api/v1.1/...)
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/v(\d+\.\d+)\//);
  if (pathMatch) {
    const version = pathMatch[1] as ApiVersion;
    if (SUPPORTED_VERSIONS.includes(version)) {
      return version;
    }
  }
  
  // Return default version
  return DEFAULT_VERSION;
}

/**
 * Check if requested version is supported
 */
export function isVersionSupported(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion);
}

/**
 * Check if version is compatible with target version
 */
export function isVersionCompatible(requestedVersion: ApiVersion, targetVersion: ApiVersion): boolean {
  return VERSION_COMPATIBILITY[targetVersion]?.includes(requestedVersion) || false;
}

/**
 * Get deprecated features for a version
 */
export function getDeprecatedFeatures(version: ApiVersion): string[] {
  return DEPRECATED_FEATURES[version] || [];
}

/**
 * Get breaking changes for a version
 */
export function getBreakingChanges(version: ApiVersion): string[] {
  return BREAKING_CHANGES[version] || [];
}

/**
 * Transform response data based on API version
 */
export function transformResponseForVersion<T>(data: T, version: ApiVersion): T {
  // Apply version-specific transformations
  switch (version) {
    case '1.0':
      return transformToV1_0(data);
    case '1.1':
      return transformToV1_1(data);
    case '2.0':
      return transformToV2_0(data);
    default:
      return data;
  }
}

/**
 * Transform data to v1.0 format (legacy format)
 */
function transformToV1_0<T>(data: T): T {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const transformed = { ...data } as any;
    
    // Remove v1.1+ specific fields
    delete transformed.enhanced_analytics;
    delete transformed.advanced_permissions;
    delete transformed.metadata;
    
    // Remove v2.0+ specific fields
    delete transformed.version_info;
    delete transformed.deprecation_warnings;
    delete transformed.migration_hints;
    
    // Transform pagination format for v1.0
    if (transformed.pagination) {
      transformed.pagination = {
        page: Math.max(transformed.pagination.current_page || 1, 1),
        total: transformed.pagination.total_items || 0,
        per_page: Math.max(transformed.pagination.items_per_page || 20, 1)
      };
    }
    
    // Transform date formats to ISO strings (v1.0 format)
    if (transformed.created_at && typeof transformed.created_at === 'object') {
      transformed.created_at = transformed.created_at.toISOString();
    }
    if (transformed.updated_at && typeof transformed.updated_at === 'object') {
      transformed.updated_at = transformed.updated_at.toISOString();
    }
    
    return transformed;
  }
  return data;
}

/**
 * Transform data to v1.1 format
 */
function transformToV1_1<T>(data: T): T {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const transformed = { ...data } as any;
    
    // Remove v2.0+ specific fields
    delete transformed.version_info;
    delete transformed.deprecation_warnings;
    delete transformed.migration_hints;
    
    // Keep v1.1 pagination format but ensure compatibility
    if (transformed.pagination) {
      transformed.pagination = {
        current_page: transformed.pagination.current_page || transformed.pagination.page || 1,
        total_pages: Math.max(transformed.pagination.total_pages || Math.ceil((transformed.pagination.total || 0) / (transformed.pagination.per_page || 20)), 1),
        total_items: transformed.pagination.total_items || transformed.pagination.total || 0,
        items_per_page: Math.max(transformed.pagination.items_per_page || transformed.pagination.per_page || 20, 1)
      };
    }
    
    return transformed;
  }
  return data;
}

/**
 * Transform data to v2.0 format (latest format)
 */
function transformToV2_0<T>(data: T): T {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const transformed = { ...data } as any;
    
    // Add v2.0 metadata
    transformed.version_info = {
      api_version: '2.0',
      response_format: 'v2',
      timestamp: new Date().toISOString()
    };
    
    // Ensure modern pagination format
    if (transformed.pagination) {
      transformed.pagination = {
        current_page: Math.max(transformed.pagination.current_page || transformed.pagination.page || 1, 1),
        total_pages: Math.max(transformed.pagination.total_pages || Math.ceil((transformed.pagination.total || 0) / (transformed.pagination.per_page || 20)), 1),
        total_items: transformed.pagination.total_items || transformed.pagination.total || 0,
        items_per_page: Math.max(transformed.pagination.items_per_page || transformed.pagination.per_page || 20, 1),
        has_next: false,
        has_previous: false
      };
      
      // Calculate has_next and has_previous
      transformed.pagination.has_next = transformed.pagination.current_page < transformed.pagination.total_pages;
      transformed.pagination.has_previous = transformed.pagination.current_page > 1;
    }
    
    return transformed;
  }
  return data;
}

/**
 * Create versioned API response
 */
export function createVersionedResponse(
  data: any,
  version: ApiVersion,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const transformedData = transformResponseForVersion(data, version);
  
  const headers: Record<string, string> = {
    'Content-Type': `application/vnd.solarcrm.v${version}+json`,
    'X-API-Version': version,
    'X-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
    'X-Latest-Version': LATEST_VERSION,
    ...additionalHeaders
  };
  
  // Add deprecation warnings if applicable
  const deprecatedFeatures = getDeprecatedFeatures(version);
  if (deprecatedFeatures.length > 0) {
    headers['X-API-Deprecated-Features'] = deprecatedFeatures.join(', ');
    headers['Warning'] = `299 - "API version ${version} contains deprecated features: ${deprecatedFeatures.join(', ')}"`;
  }
  
  // Add version status information
  const versionStatus = VERSION_STATUS[version];
  if (versionStatus === 'deprecated') {
    headers['X-API-Version-Status'] = 'deprecated';
    const sunsetDate = VERSION_SUNSET_DATES[version];
    if (sunsetDate) {
      headers['X-API-Sunset-Date'] = sunsetDate.toISOString();
      headers['Sunset'] = sunsetDate.toUTCString();
    }
  }
  
  // Add breaking changes information for newer versions
  const breakingChanges = getBreakingChanges(version);
  if (breakingChanges.length > 0) {
    headers['X-API-Breaking-Changes'] = breakingChanges.join(', ');
  }
  
  // Add migration hints for deprecated versions
  if (versionStatus === 'deprecated') {
    headers['X-API-Migration-Guide'] = `https://docs.solarcrm.com/api/migration/v${version}-to-v${LATEST_VERSION}`;
  }
  
  return NextResponse.json(transformedData, { status, headers });
}

/**
 * Middleware wrapper for versioned API routes
 */
export function withApiVersioning<T extends any[]>(
  handlers: Record<ApiVersion, (...args: T) => Promise<NextResponse>>,
  fallbackVersion: ApiVersion = DEFAULT_VERSION
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const version = extractApiVersion(request);
    
    // Check if version is supported
    if (!isVersionSupported(version)) {
      return NextResponse.json(
        {
          error: 'Unsupported API version',
          details: {
            requested_version: version,
            supported_versions: SUPPORTED_VERSIONS
          }
        },
        {
          status: 400,
          headers: {
            'X-Supported-Versions': SUPPORTED_VERSIONS.join(', ')
          }
        }
      );
    }
    
    // Get handler for the requested version
    let handler = handlers[version];
    
    // If no specific handler exists, try to find a compatible one
    if (!handler) {
      for (const supportedVersion of SUPPORTED_VERSIONS) {
        if (isVersionCompatible(version, supportedVersion) && handlers[supportedVersion]) {
          handler = handlers[supportedVersion];
          break;
        }
      }
    }
    
    // Use fallback handler if no compatible handler found
    if (!handler) {
      handler = handlers[fallbackVersion];
    }
    
    // If still no handler, return error
    if (!handler) {
      return NextResponse.json(
        {
          error: 'No handler available for requested API version',
          details: {
            requested_version: version,
            available_versions: Object.keys(handlers)
          }
        },
        { status: 501 }
      );
    }
    
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`API handler error for version ${version}:`, error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Migration helper for API changes
 */
export interface ApiMigration {
  fromVersion: ApiVersion;
  toVersion: ApiVersion;
  description: string;
  breaking: boolean;
  migrate: (data: any) => any;
}

/**
 * Available migrations
 */
export const API_MIGRATIONS: ApiMigration[] = [
  {
    fromVersion: '1.0',
    toVersion: '1.1',
    description: 'Added enhanced analytics and advanced permissions',
    breaking: false,
    migrate: (data: any) => {
      // Add new fields with default values
      return {
        ...data,
        enhanced_analytics: data.enhanced_analytics || null,
        advanced_permissions: data.advanced_permissions || []
      };
    }
  },
  {
    fromVersion: '1.1',
    toVersion: '2.0',
    description: 'Updated pagination format, error responses, and date handling',
    breaking: true,
    migrate: (data: any) => {
      const migrated = { ...data };
      
      // Transform pagination format
      if (migrated.pagination) {
        migrated.pagination = {
          current_page: migrated.pagination.current_page || migrated.pagination.page || 1,
          total_pages: migrated.pagination.total_pages || Math.ceil((migrated.pagination.total || 0) / (migrated.pagination.per_page || 20)),
          total_items: migrated.pagination.total_items || migrated.pagination.total || 0,
          items_per_page: migrated.pagination.items_per_page || migrated.pagination.per_page || 20,
          has_next: false,
          has_previous: false
        };
        
        migrated.pagination.has_next = migrated.pagination.current_page < migrated.pagination.total_pages;
        migrated.pagination.has_previous = migrated.pagination.current_page > 1;
      }
      
      // Add version metadata
      migrated.version_info = {
        api_version: '2.0',
        response_format: 'v2',
        timestamp: new Date().toISOString()
      };
      
      return migrated;
    }
  },
  {
    fromVersion: '1.0',
    toVersion: '2.0',
    description: 'Direct migration from v1.0 to v2.0 with all improvements',
    breaking: true,
    migrate: (data: any) => {
      // First apply v1.0 to v1.1 migration
      const v1_1_data = API_MIGRATIONS.find(m => m.fromVersion === '1.0' && m.toVersion === '1.1')?.migrate(data) || data;
      
      // Then apply v1.1 to v2.0 migration
      return API_MIGRATIONS.find(m => m.fromVersion === '1.1' && m.toVersion === '2.0')?.migrate(v1_1_data) || v1_1_data;
    }
  }
];

/**
 * Apply migration to data
 */
export function applyMigration(
  data: any,
  fromVersion: ApiVersion,
  toVersion: ApiVersion
): any {
  const migration = API_MIGRATIONS.find(
    m => m.fromVersion === fromVersion && m.toVersion === toVersion
  );
  
  if (migration) {
    return migration.migrate(data);
  }
  
  return data;
}

/**
 * Get migration path between versions
 */
export function getMigrationPath(
  fromVersion: ApiVersion,
  toVersion: ApiVersion
): ApiMigration[] {
  // Direct migration available
  const directMigration = API_MIGRATIONS.find(
    m => m.fromVersion === fromVersion && m.toVersion === toVersion
  );
  
  if (directMigration) {
    return [directMigration];
  }
  
  // Multi-step migration path
  const path: ApiMigration[] = [];
  let currentVersion = fromVersion;
  
  // Simple implementation for sequential versions
  while (currentVersion !== toVersion) {
    const nextMigration = API_MIGRATIONS.find(
      m => m.fromVersion === currentVersion && 
      SUPPORTED_VERSIONS.indexOf(m.toVersion) > SUPPORTED_VERSIONS.indexOf(currentVersion)
    );
    
    if (!nextMigration) {
      break; // No migration path found
    }
    
    path.push(nextMigration);
    currentVersion = nextMigration.toVersion;
  }
  
  return path;
}

/**
 * Apply migration chain to data
 */
export function applyMigrationChain(
  data: any,
  fromVersion: ApiVersion,
  toVersion: ApiVersion
): any {
  const migrationPath = getMigrationPath(fromVersion, toVersion);
  
  return migrationPath.reduce((currentData, migration) => {
    return migration.migrate(currentData);
  }, data);
}

/**
 * Check if migration is available between versions
 */
export function isMigrationAvailable(
  fromVersion: ApiVersion,
  toVersion: ApiVersion
): boolean {
  return getMigrationPath(fromVersion, toVersion).length > 0;
}

/**
 * Get version compatibility information
 */
export function getVersionCompatibilityInfo(version: ApiVersion) {
  return {
    version,
    status: VERSION_STATUS[version],
    sunset_date: VERSION_SUNSET_DATES[version],
    compatible_versions: VERSION_COMPATIBILITY[version] || [],
    deprecated_features: DEPRECATED_FEATURES[version] || [],
    breaking_changes: BREAKING_CHANGES[version] || [],
    migration_available_to: SUPPORTED_VERSIONS.filter(v => 
      isMigrationAvailable(version, v) && v !== version
    )
  };
}

// Export version information for documentation
export const VERSION_INFO = {
  supported: SUPPORTED_VERSIONS,
  default: DEFAULT_VERSION,
  latest: LATEST_VERSION,
  compatibility: VERSION_COMPATIBILITY,
  deprecated: DEPRECATED_FEATURES,
  breaking: BREAKING_CHANGES,
  migrations: API_MIGRATIONS,
  status: VERSION_STATUS,
  sunset_dates: VERSION_SUNSET_DATES
};