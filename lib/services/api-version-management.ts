/**
 * API Version Management Service
 * 
 * Provides comprehensive API version management including:
 * - Version lifecycle management
 * - Migration path planning
 * - Backward compatibility validation
 * - Version usage analytics
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { createClient } from '@/lib/supabase/server';
import { 
  ApiVersion, 
  SUPPORTED_VERSIONS, 
  VERSION_STATUS, 
  VERSION_SUNSET_DATES,
  getMigrationPath,
  applyMigrationChain,
  getVersionCompatibilityInfo
} from '@/lib/middleware/api-versioning';

export interface ApiVersionUsage {
  version: ApiVersion;
  tenant_id: string;
  endpoint: string;
  request_count: number;
  last_used: Date;
  user_agent?: string;
  client_info?: {
    name: string;
    version: string;
    platform: string;
  };
}

export interface VersionMigrationPlan {
  from_version: ApiVersion;
  to_version: ApiVersion;
  migration_steps: {
    step: number;
    description: string;
    breaking: boolean;
    estimated_effort: 'low' | 'medium' | 'high';
    required_changes: string[];
  }[];
  timeline: {
    preparation_phase: string;
    migration_phase: string;
    validation_phase: string;
  };
  rollback_plan: string;
}

export interface VersionDeprecationNotice {
  version: ApiVersion;
  deprecation_date: Date;
  sunset_date: Date;
  reason: string;
  migration_guide_url: string;
  affected_endpoints: string[];
  replacement_version: ApiVersion;
}

export class ApiVersionManagementService {
  private supabase = createClient();

  /**
   * Track API version usage
   */
  async trackVersionUsage(
    tenantId: string,
    version: ApiVersion,
    endpoint: string,
    userAgent?: string,
    clientInfo?: ApiVersionUsage['client_info']
  ): Promise<void> {
    try {
      // Insert or update usage record
      await this.supabase
        .from('api_version_usage')
        .upsert({
          tenant_id: tenantId,
          version,
          endpoint,
          request_count: 1,
          last_used: new Date().toISOString(),
          user_agent: userAgent,
          client_info: clientInfo
        }, {
          onConflict: 'tenant_id,version,endpoint',
          ignoreDuplicates: false
        });

      // If upsert doesn't increment, do it manually
      await this.supabase.rpc('increment_api_usage', {
        p_tenant_id: tenantId,
        p_version: version,
        p_endpoint: endpoint
      });
    } catch (error) {
      console.error('Error tracking API version usage:', error);
      // Don't throw - usage tracking shouldn't break API calls
    }
  }

  /**
   * Get version usage analytics for a tenant
   */
  async getVersionUsageAnalytics(
    tenantId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    total_requests: number;
    version_breakdown: Record<ApiVersion, number>;
    endpoint_breakdown: Record<string, Record<ApiVersion, number>>;
    deprecated_version_usage: number;
    migration_urgency: 'low' | 'medium' | 'high';
  }> {
    let query = this.supabase
      .from('api_version_usage')
      .select('*')
      .eq('tenant_id', tenantId);

    if (timeRange) {
      query = query
        .gte('last_used', timeRange.start.toISOString())
        .lte('last_used', timeRange.end.toISOString());
    }

    const { data: usage, error } = await query;

    if (error) {
      throw new Error(`Failed to get version usage analytics: ${error.message}`);
    }

    const analytics = {
      total_requests: 0,
      version_breakdown: {} as Record<ApiVersion, number>,
      endpoint_breakdown: {} as Record<string, Record<ApiVersion, number>>,
      deprecated_version_usage: 0,
      migration_urgency: 'low' as 'low' | 'medium' | 'high'
    };

    // Initialize version breakdown
    SUPPORTED_VERSIONS.forEach(version => {
      analytics.version_breakdown[version] = 0;
    });

    // Process usage data
    usage?.forEach(record => {
      const count = record.request_count || 0;
      analytics.total_requests += count;
      analytics.version_breakdown[record.version as ApiVersion] += count;

      // Track endpoint breakdown
      if (!analytics.endpoint_breakdown[record.endpoint]) {
        analytics.endpoint_breakdown[record.endpoint] = {} as Record<ApiVersion, number>;
        SUPPORTED_VERSIONS.forEach(version => {
          analytics.endpoint_breakdown[record.endpoint][version] = 0;
        });
      }
      analytics.endpoint_breakdown[record.endpoint][record.version as ApiVersion] += count;

      // Track deprecated version usage
      if (VERSION_STATUS[record.version as ApiVersion] === 'deprecated') {
        analytics.deprecated_version_usage += count;
      }
    });

    // Calculate migration urgency
    const deprecatedPercentage = analytics.total_requests > 0 
      ? (analytics.deprecated_version_usage / analytics.total_requests) * 100 
      : 0;

    if (deprecatedPercentage > 50) {
      analytics.migration_urgency = 'high';
    } else if (deprecatedPercentage > 20) {
      analytics.migration_urgency = 'medium';
    }

    return analytics;
  }

  /**
   * Generate migration plan for a tenant
   */
  async generateMigrationPlan(
    tenantId: string,
    fromVersion: ApiVersion,
    toVersion: ApiVersion
  ): Promise<VersionMigrationPlan> {
    const migrationPath = getMigrationPath(fromVersion, toVersion);
    
    if (migrationPath.length === 0) {
      throw new Error(`No migration path available from ${fromVersion} to ${toVersion}`);
    }

    // Get tenant's current usage to assess impact
    const usage = await this.getVersionUsageAnalytics(tenantId);
    const affectedRequests = usage.version_breakdown[fromVersion] || 0;

    const plan: VersionMigrationPlan = {
      from_version: fromVersion,
      to_version: toVersion,
      migration_steps: migrationPath.map((migration, index) => ({
        step: index + 1,
        description: migration.description,
        breaking: migration.breaking,
        estimated_effort: this.estimateEffort(migration, affectedRequests),
        required_changes: this.getRequiredChanges(migration)
      })),
      timeline: this.generateTimeline(migrationPath, affectedRequests),
      rollback_plan: this.generateRollbackPlan(fromVersion, toVersion)
    };

    return plan;
  }

  /**
   * Get deprecation notices for a tenant
   */
  async getDeprecationNotices(tenantId: string): Promise<VersionDeprecationNotice[]> {
    const usage = await this.getVersionUsageAnalytics(tenantId);
    const notices: VersionDeprecationNotice[] = [];

    // Check for deprecated versions in use
    for (const version of SUPPORTED_VERSIONS) {
      if (VERSION_STATUS[version] === 'deprecated' && usage.version_breakdown[version] > 0) {
        const sunsetDate = VERSION_SUNSET_DATES[version];
        if (sunsetDate) {
          const affectedEndpoints = Object.keys(usage.endpoint_breakdown)
            .filter(endpoint => usage.endpoint_breakdown[endpoint][version] > 0);

          notices.push({
            version,
            deprecation_date: new Date('2024-01-01'), // This would be stored in DB
            sunset_date: sunsetDate,
            reason: `Version ${version} is deprecated and will be sunset`,
            migration_guide_url: `https://docs.solarcrm.com/api/migration/v${version}`,
            affected_endpoints: affectedEndpoints,
            replacement_version: this.getReplacementVersion(version)
          });
        }
      }
    }

    return notices;
  }

  /**
   * Validate backward compatibility for a version
   */
  async validateBackwardCompatibility(
    version: ApiVersion,
    testData: any[]
  ): Promise<{
    compatible: boolean;
    issues: {
      type: 'breaking_change' | 'data_loss' | 'format_change';
      description: string;
      severity: 'low' | 'medium' | 'high';
      affected_fields: string[];
    }[];
  }> {
    const issues: any[] = [];
    let compatible = true;

    // Test data transformation
    for (const data of testData) {
      try {
        // Test transformation to older versions
        for (const olderVersion of SUPPORTED_VERSIONS) {
          if (SUPPORTED_VERSIONS.indexOf(olderVersion) < SUPPORTED_VERSIONS.indexOf(version)) {
            const transformed = applyMigrationChain(data, version, olderVersion);
            
            // Check for data loss
            const originalKeys = Object.keys(data);
            const transformedKeys = Object.keys(transformed);
            const lostKeys = originalKeys.filter(key => !transformedKeys.includes(key));
            
            if (lostKeys.length > 0) {
              issues.push({
                type: 'data_loss',
                description: `Data loss when transforming to ${olderVersion}`,
                severity: 'medium',
                affected_fields: lostKeys
              });
              compatible = false;
            }
          }
        }
      } catch (error) {
        issues.push({
          type: 'breaking_change',
          description: `Transformation failed: ${error}`,
          severity: 'high',
          affected_fields: []
        });
        compatible = false;
      }
    }

    return { compatible, issues };
  }

  /**
   * Get version information for documentation
   */
  getVersionInfo(): {
    versions: {
      version: ApiVersion;
      status: string;
      sunset_date: Date | null;
      compatibility_info: any;
    }[];
    migration_paths: any[];
  } {
    return {
      versions: SUPPORTED_VERSIONS.map(version => ({
        version,
        status: VERSION_STATUS[version],
        sunset_date: VERSION_SUNSET_DATES[version],
        compatibility_info: getVersionCompatibilityInfo(version)
      })),
      migration_paths: getMigrationPath('1.0', '2.0') // Example
    };
  }

  // Private helper methods

  private estimateEffort(migration: any, affectedRequests: number): 'low' | 'medium' | 'high' {
    if (migration.breaking && affectedRequests > 1000) return 'high';
    if (migration.breaking || affectedRequests > 100) return 'medium';
    return 'low';
  }

  private getRequiredChanges(migration: any): string[] {
    const changes = [migration.description];
    
    if (migration.breaking) {
      changes.push('Update client code to handle breaking changes');
      changes.push('Test all affected endpoints');
      changes.push('Update API documentation');
    }
    
    return changes;
  }

  private generateTimeline(migrations: any[], affectedRequests: number): any {
    const complexity = migrations.some(m => m.breaking) ? 'complex' : 'simple';
    const scale = affectedRequests > 1000 ? 'large' : affectedRequests > 100 ? 'medium' : 'small';
    
    if (complexity === 'complex' && scale === 'large') {
      return {
        preparation_phase: '2-4 weeks',
        migration_phase: '1-2 weeks',
        validation_phase: '1 week'
      };
    } else if (complexity === 'complex' || scale === 'large') {
      return {
        preparation_phase: '1-2 weeks',
        migration_phase: '3-5 days',
        validation_phase: '2-3 days'
      };
    } else {
      return {
        preparation_phase: '2-3 days',
        migration_phase: '1 day',
        validation_phase: '1 day'
      };
    }
  }

  private generateRollbackPlan(fromVersion: ApiVersion, toVersion: ApiVersion): string {
    return `If issues occur during migration from ${fromVersion} to ${toVersion}, ` +
           `revert API version headers to ${fromVersion} and restore previous client configurations. ` +
           `All data transformations are reversible within 24 hours of migration.`;
  }

  private getReplacementVersion(deprecatedVersion: ApiVersion): ApiVersion {
    const index = SUPPORTED_VERSIONS.indexOf(deprecatedVersion);
    return SUPPORTED_VERSIONS[index + 1] || SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1];
  }
}

// Export singleton instance
export const apiVersionManagementService = new ApiVersionManagementService();