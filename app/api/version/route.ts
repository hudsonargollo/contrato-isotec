/**
 * API Version Information Endpoint
 * 
 * Provides comprehensive information about API versions, compatibility,
 * deprecation notices, and migration paths.
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  VERSION_INFO,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
  LATEST_VERSION,
  VERSION_STATUS,
  VERSION_SUNSET_DATES,
  getVersionCompatibilityInfo,
  getMigrationPath
} from '@/lib/middleware/api-versioning';
import { 
  withApiAuth,
  AuthContext,
  RateLimitStatus
} from '@/lib/middleware/api-auth';
import { apiVersionManagementService } from '@/lib/services/api-version-management';

/**
 * GET /api/version
 * Returns comprehensive API version information
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    try {
      // Get tenant-specific version usage analytics
      const usageAnalytics = await apiVersionManagementService.getVersionUsageAnalytics(context.tenant_id);
      
      // Get deprecation notices for the tenant
      const deprecationNotices = await apiVersionManagementService.getDeprecationNotices(context.tenant_id);
      
      // Build comprehensive version information
      const versionInfo = {
        api_info: {
          name: 'SolarCRM Pro API',
          description: 'Comprehensive multi-tenant SaaS platform API for solar energy companies',
          documentation_url: 'https://docs.solarcrm.com/api',
          support_email: 'api-support@solarcrm.com'
        },
        versions: {
          supported: SUPPORTED_VERSIONS,
          default: DEFAULT_VERSION,
          latest: LATEST_VERSION,
          recommended: LATEST_VERSION
        },
        version_details: SUPPORTED_VERSIONS.map(version => ({
          version,
          status: VERSION_STATUS[version],
          sunset_date: VERSION_SUNSET_DATES[version],
          compatibility_info: getVersionCompatibilityInfo(version),
          endpoints: {
            base_url: `https://api.solarcrm.com/v${version.replace('.', '_')}`,
            documentation_url: `https://docs.solarcrm.com/api/v${version}`,
            changelog_url: `https://docs.solarcrm.com/api/changelog/v${version}`
          },
          features: getVersionFeatures(version),
          breaking_changes: VERSION_INFO.breaking[version] || [],
          deprecated_features: VERSION_INFO.deprecated[version] || []
        })),
        tenant_usage: {
          current_usage: usageAnalytics,
          deprecation_notices: deprecationNotices,
          migration_recommendations: await getMigrationRecommendations(context.tenant_id)
        },
        migration_paths: {
          available_paths: SUPPORTED_VERSIONS.map(fromVersion => 
            SUPPORTED_VERSIONS.map(toVersion => ({
              from: fromVersion,
              to: toVersion,
              available: fromVersion !== toVersion && getMigrationPath(fromVersion, toVersion).length > 0,
              breaking: getMigrationPath(fromVersion, toVersion).some(m => m.breaking),
              steps: getMigrationPath(fromVersion, toVersion).length
            })).filter(path => path.available)
          ).flat(),
          migration_guide_url: 'https://docs.solarcrm.com/api/migration'
        },
        headers: {
          version_negotiation: [
            'Accept: application/vnd.solarcrm.v2.0+json',
            'X-API-Version: 2.0'
          ],
          response_headers: [
            'X-API-Version: Current version used',
            'X-Supported-Versions: All supported versions',
            'X-Latest-Version: Latest available version',
            'X-API-Version-Status: Version status (active/deprecated)',
            'X-API-Sunset-Date: Sunset date for deprecated versions',
            'Warning: Deprecation warnings'
          ]
        },
        rate_limiting: {
          current_limit: rateLimitStatus.limit,
          remaining: rateLimitStatus.remaining,
          reset_time: rateLimitStatus.resetTime,
          version_specific_limits: {
            '1.0': 'Basic rate limiting (100 req/min)',
            '1.1': 'Enhanced rate limiting (500 req/min)',
            '2.0': 'Advanced rate limiting (1000 req/min) with burst support'
          }
        },
        authentication: {
          methods: ['API Key', 'JWT Bearer Token', 'OAuth 2.0'],
          scopes: ['leads.view', 'leads.create', 'leads.update', 'leads.delete', 'invoices.manage', 'contracts.manage'],
          documentation_url: 'https://docs.solarcrm.com/api/authentication'
        },
        error_handling: {
          error_format: {
            v1_0: 'Simple error messages',
            v1_1: 'Structured error responses',
            v2_0: 'Comprehensive error details with codes and context'
          },
          common_errors: [
            { code: 400, description: 'Bad Request - Invalid parameters' },
            { code: 401, description: 'Unauthorized - Invalid or missing authentication' },
            { code: 403, description: 'Forbidden - Insufficient permissions' },
            { code: 404, description: 'Not Found - Resource not found' },
            { code: 429, description: 'Too Many Requests - Rate limit exceeded' },
            { code: 500, description: 'Internal Server Error - Server error' }
          ]
        },
        contact: {
          support_url: 'https://support.solarcrm.com',
          documentation_url: 'https://docs.solarcrm.com/api',
          status_page: 'https://status.solarcrm.com',
          community_forum: 'https://community.solarcrm.com/api'
        }
      };

      return NextResponse.json(versionInfo, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': LATEST_VERSION,
          'X-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
          'X-Latest-Version': LATEST_VERSION,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-RateLimit-Limit': rateLimitStatus.limit.toString(),
          'X-RateLimit-Remaining': rateLimitStatus.remaining.toString()
        }
      });
    } catch (error) {
      console.error('Error getting version information:', error);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve version information',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  'api.info' // Permission required to access API information
);

/**
 * GET /api/version/usage
 * Returns detailed usage analytics for the tenant
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    try {
      const body = await request.json();
      const { time_range } = body;

      let timeRange;
      if (time_range) {
        timeRange = {
          start: new Date(time_range.start),
          end: new Date(time_range.end)
        };
      }

      const analytics = await apiVersionManagementService.getVersionUsageAnalytics(
        context.tenant_id,
        timeRange
      );

      const deprecationNotices = await apiVersionManagementService.getDeprecationNotices(context.tenant_id);
      
      const migrationRecommendations = await getMigrationRecommendations(context.tenant_id);

      return NextResponse.json({
        tenant_id: context.tenant_id,
        analytics,
        deprecation_notices: deprecationNotices,
        migration_recommendations: migrationRecommendations,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve usage analytics',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  'api.analytics' // Permission required to access API analytics
);

// Helper functions

function getVersionFeatures(version: string): string[] {
  switch (version) {
    case '1.0':
      return [
        'Basic CRUD operations',
        'Simple authentication',
        'Basic error handling',
        'Simple pagination',
        'Core CRM functionality'
      ];
    case '1.1':
      return [
        'Enhanced filtering and search',
        'Improved error responses',
        'Advanced permissions',
        'Enhanced analytics',
        'Better pagination',
        'Lead scoring',
        'Pipeline management'
      ];
    case '2.0':
      return [
        'Comprehensive filtering and search',
        'Rich error details with codes',
        'Advanced rate limiting',
        'Real-time analytics',
        'Modern pagination with navigation',
        'Advanced lead scoring',
        'Complete pipeline management',
        'Webhook support',
        'Bulk operations',
        'Advanced reporting',
        'Multi-tenant isolation',
        'Enhanced security'
      ];
    default:
      return [];
  }
}

async function getMigrationRecommendations(tenantId: string) {
  try {
    const analytics = await apiVersionManagementService.getVersionUsageAnalytics(tenantId);
    const recommendations = [];

    // Check for deprecated version usage
    for (const [version, usage] of Object.entries(analytics.version_breakdown)) {
      if (VERSION_STATUS[version as any] === 'deprecated' && usage > 0) {
        const sunsetDate = VERSION_SUNSET_DATES[version as any];
        const urgency = sunsetDate && sunsetDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'high' : 'medium';
        
        recommendations.push({
          from_version: version,
          to_version: LATEST_VERSION,
          urgency,
          affected_requests: usage,
          sunset_date: sunsetDate,
          migration_guide: `https://docs.solarcrm.com/api/migration/v${version}-to-v${LATEST_VERSION}`,
          estimated_effort: usage > 1000 ? 'high' : usage > 100 ? 'medium' : 'low'
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting migration recommendations:', error);
    return [];
  }
}