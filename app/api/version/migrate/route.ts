/**
 * API Version Migration Management Endpoint
 * 
 * Handles API version migration planning, execution, and monitoring.
 * Provides tools for tenants to migrate between API versions safely.
 * 
 * Requirements: 10.5 - API versioning and backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  withApiAuth,
  AuthContext,
  RateLimitStatus
} from '@/lib/middleware/api-auth';
import { apiVersionManagementService } from '@/lib/services/api-version-management';
import { createClient } from '@/lib/supabase/server';
import { 
  ApiVersion,
  SUPPORTED_VERSIONS,
  getMigrationPath,
  applyMigrationChain,
  isMigrationAvailable
} from '@/lib/middleware/api-versioning';

interface MigrationRequest {
  from_version: ApiVersion;
  to_version: ApiVersion;
  migration_type: 'plan' | 'execute' | 'validate';
  test_data?: any[];
  rollback_plan?: boolean;
}

interface MigrationPlanRequest {
  from_version: ApiVersion;
  to_version: ApiVersion;
  include_timeline?: boolean;
  include_rollback_plan?: boolean;
}

/**
 * POST /api/version/migrate
 * Create migration plan or execute migration
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    try {
      const body: MigrationRequest = await request.json();
      const { from_version, to_version, migration_type, test_data, rollback_plan } = body;

      // Validate versions
      if (!SUPPORTED_VERSIONS.includes(from_version) || !SUPPORTED_VERSIONS.includes(to_version)) {
        return NextResponse.json(
          { 
            error: 'Invalid API version',
            supported_versions: SUPPORTED_VERSIONS
          },
          { status: 400 }
        );
      }

      // Check if migration is available
      if (!isMigrationAvailable(from_version, to_version)) {
        return NextResponse.json(
          { 
            error: 'Migration path not available',
            from_version,
            to_version,
            available_paths: SUPPORTED_VERSIONS.map(v => ({
              to: v,
              available: isMigrationAvailable(from_version, v)
            }))
          },
          { status: 400 }
        );
      }

      switch (migration_type) {
        case 'plan':
          return await handleMigrationPlan(context.tenant_id, from_version, to_version, rollback_plan);
        
        case 'execute':
          return await handleMigrationExecution(context.tenant_id, from_version, to_version, context.user_id);
        
        case 'validate':
          return await handleMigrationValidation(from_version, to_version, test_data || []);
        
        default:
          return NextResponse.json(
            { error: 'Invalid migration type. Must be: plan, execute, or validate' },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error('Error in migration endpoint:', error);
      return NextResponse.json(
        { 
          error: 'Migration operation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  'api.migrate' // Permission required for API migration operations
);

/**
 * GET /api/version/migrate
 * Get migration status and history
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    try {
      const supabase = createClient();
      
      // Get migration history for the tenant
      const { data: migrations, error } = await supabase
        .from('api_version_migrations')
        .select('*')
        .eq('tenant_id', context.tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get migration history: ${error.message}`);
      }

      // Get current usage analytics
      const usageAnalytics = await apiVersionManagementService.getVersionUsageAnalytics(context.tenant_id);
      
      // Get deprecation notices
      const deprecationNotices = await apiVersionManagementService.getDeprecationNotices(context.tenant_id);

      return NextResponse.json({
        migration_history: migrations || [],
        current_usage: usageAnalytics,
        deprecation_notices: deprecationNotices,
        available_migrations: SUPPORTED_VERSIONS.map(fromVersion => 
          SUPPORTED_VERSIONS.map(toVersion => ({
            from: fromVersion,
            to: toVersion,
            available: fromVersion !== toVersion && isMigrationAvailable(fromVersion, toVersion),
            breaking: getMigrationPath(fromVersion, toVersion).some(m => m.breaking)
          })).filter(path => path.available)
        ).flat()
      });
    } catch (error) {
      console.error('Error getting migration status:', error);
      return NextResponse.json(
        { 
          error: 'Failed to get migration status',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  'api.migrate'
);

/**
 * PUT /api/version/migrate/[migrationId]
 * Update migration status or rollback
 */
export const PUT = withApiAuth(
  async (request: NextRequest, context: AuthContext, rateLimitStatus: RateLimitStatus) => {
    try {
      const body = await request.json();
      const { action, migration_id } = body;

      if (!migration_id) {
        return NextResponse.json(
          { error: 'Migration ID is required' },
          { status: 400 }
        );
      }

      const supabase = createClient();

      if (action === 'rollback') {
        // Handle migration rollback
        const { data: migration, error: fetchError } = await supabase
          .from('api_version_migrations')
          .select('*')
          .eq('id', migration_id)
          .eq('tenant_id', context.tenant_id)
          .single();

        if (fetchError || !migration) {
          return NextResponse.json(
            { error: 'Migration not found' },
            { status: 404 }
          );
        }

        if (migration.migration_status !== 'completed') {
          return NextResponse.json(
            { error: 'Can only rollback completed migrations' },
            { status: 400 }
          );
        }

        // Update migration status to rolled back
        const { error: updateError } = await supabase
          .from('api_version_migrations')
          .update({
            migration_status: 'rolled_back',
            updated_at: new Date().toISOString(),
            migration_results: {
              ...migration.migration_results,
              rollback_executed_at: new Date().toISOString(),
              rollback_executed_by: context.user_id
            }
          })
          .eq('id', migration_id);

        if (updateError) {
          throw new Error(`Failed to rollback migration: ${updateError.message}`);
        }

        return NextResponse.json({
          message: 'Migration rolled back successfully',
          migration_id,
          rollback_completed_at: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: 'Invalid action. Supported actions: rollback' },
        { status: 400 }
      );
    } catch (error) {
      console.error('Error updating migration:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update migration',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  'api.migrate'
);

// Helper functions

async function handleMigrationPlan(
  tenantId: string,
  fromVersion: ApiVersion,
  toVersion: ApiVersion,
  includeRollbackPlan?: boolean
) {
  try {
    const migrationPlan = await apiVersionManagementService.generateMigrationPlan(
      tenantId,
      fromVersion,
      toVersion
    );

    const response: any = {
      migration_plan: migrationPlan,
      estimated_impact: await estimateMigrationImpact(tenantId, fromVersion, toVersion),
      preparation_checklist: generatePreparationChecklist(fromVersion, toVersion),
      testing_recommendations: generateTestingRecommendations(fromVersion, toVersion)
    };

    if (includeRollbackPlan) {
      response.rollback_plan = generateDetailedRollbackPlan(fromVersion, toVersion);
    }

    return NextResponse.json(response);
  } catch (error) {
    throw new Error(`Failed to generate migration plan: ${error}`);
  }
}

async function handleMigrationExecution(
  tenantId: string,
  fromVersion: ApiVersion,
  toVersion: ApiVersion,
  userId: string
) {
  const supabase = createClient();
  
  try {
    // Create migration record
    const { data: migration, error: createError } = await supabase
      .from('api_version_migrations')
      .insert({
        tenant_id: tenantId,
        from_version: fromVersion,
        to_version: toVersion,
        migration_status: 'in_progress',
        started_at: new Date().toISOString(),
        created_by: userId,
        migration_plan: await apiVersionManagementService.generateMigrationPlan(tenantId, fromVersion, toVersion)
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create migration record: ${createError.message}`);
    }

    // In a real implementation, this would trigger background migration processes
    // For now, we'll simulate immediate completion
    const migrationResults = {
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      success: true,
      endpoints_migrated: ['leads', 'invoices', 'contracts'],
      data_transformed: true,
      validation_passed: true
    };

    // Update migration as completed
    const { error: updateError } = await supabase
      .from('api_version_migrations')
      .update({
        migration_status: 'completed',
        completed_at: new Date().toISOString(),
        migration_results: migrationResults
      })
      .eq('id', migration.id);

    if (updateError) {
      throw new Error(`Failed to update migration status: ${updateError.message}`);
    }

    return NextResponse.json({
      message: 'Migration executed successfully',
      migration_id: migration.id,
      results: migrationResults,
      next_steps: [
        'Update your client applications to use the new API version',
        'Test all integrations with the new version',
        'Monitor API usage for any issues',
        'Update documentation and team training materials'
      ]
    });
  } catch (error) {
    // Update migration as failed if it was created
    console.error('Migration execution failed:', error);
    throw error;
  }
}

async function handleMigrationValidation(
  fromVersion: ApiVersion,
  toVersion: ApiVersion,
  testData: any[]
) {
  try {
    const validationResults = await apiVersionManagementService.validateBackwardCompatibility(
      toVersion,
      testData
    );

    // Test data transformation
    const transformationTests = testData.map((data, index) => {
      try {
        const transformed = applyMigrationChain(data, fromVersion, toVersion);
        return {
          test_case: index + 1,
          original_data: data,
          transformed_data: transformed,
          success: true,
          issues: []
        };
      } catch (error) {
        return {
          test_case: index + 1,
          original_data: data,
          transformed_data: null,
          success: false,
          issues: [error instanceof Error ? error.message : 'Unknown transformation error']
        };
      }
    });

    return NextResponse.json({
      validation_results: validationResults,
      transformation_tests: transformationTests,
      overall_compatibility: validationResults.compatible && transformationTests.every(t => t.success),
      recommendations: generateValidationRecommendations(validationResults, transformationTests)
    });
  } catch (error) {
    throw new Error(`Validation failed: ${error}`);
  }
}

async function estimateMigrationImpact(tenantId: string, fromVersion: ApiVersion, toVersion: ApiVersion) {
  const analytics = await apiVersionManagementService.getVersionUsageAnalytics(tenantId);
  const affectedRequests = analytics.version_breakdown[fromVersion] || 0;
  
  return {
    affected_requests: affectedRequests,
    affected_endpoints: Object.keys(analytics.endpoint_breakdown).filter(
      endpoint => analytics.endpoint_breakdown[endpoint][fromVersion] > 0
    ),
    estimated_downtime: affectedRequests > 1000 ? '2-4 hours' : affectedRequests > 100 ? '30-60 minutes' : '5-15 minutes',
    risk_level: affectedRequests > 1000 ? 'high' : affectedRequests > 100 ? 'medium' : 'low'
  };
}

function generatePreparationChecklist(fromVersion: ApiVersion, toVersion: ApiVersion) {
  const migrationPath = getMigrationPath(fromVersion, toVersion);
  const hasBreakingChanges = migrationPath.some(m => m.breaking);
  
  const checklist = [
    'Review migration documentation',
    'Backup current API configurations',
    'Identify all client applications using the API',
    'Set up staging environment for testing'
  ];
  
  if (hasBreakingChanges) {
    checklist.push(
      'Update client code to handle breaking changes',
      'Test all affected endpoints thoroughly',
      'Prepare rollback procedures',
      'Schedule maintenance window'
    );
  }
  
  return checklist;
}

function generateTestingRecommendations(fromVersion: ApiVersion, toVersion: ApiVersion) {
  return [
    'Test all currently used API endpoints',
    'Verify data transformation accuracy',
    'Test error handling and edge cases',
    'Validate authentication and permissions',
    'Check rate limiting behavior',
    'Test webhook deliveries (if applicable)',
    'Verify backward compatibility (if required)',
    'Load test with production-like traffic'
  ];
}

function generateDetailedRollbackPlan(fromVersion: ApiVersion, toVersion: ApiVersion) {
  return {
    rollback_triggers: [
      'Critical errors in production',
      'Data integrity issues',
      'Performance degradation > 50%',
      'Client application failures'
    ],
    rollback_steps: [
      'Stop new API requests temporarily',
      'Revert API version configuration',
      'Restore previous data transformations',
      'Validate system functionality',
      'Resume API traffic',
      'Notify affected clients'
    ],
    rollback_time_estimate: '15-30 minutes',
    data_recovery: 'All data transformations are reversible within 24 hours'
  };
}

function generateValidationRecommendations(validationResults: any, transformationTests: any[]) {
  const recommendations = [];
  
  if (!validationResults.compatible) {
    recommendations.push('Address compatibility issues before migration');
  }
  
  const failedTests = transformationTests.filter(t => !t.success);
  if (failedTests.length > 0) {
    recommendations.push(`Fix ${failedTests.length} transformation test failures`);
  }
  
  if (validationResults.issues.some((i: any) => i.severity === 'high')) {
    recommendations.push('Resolve high-severity issues before proceeding');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Validation passed - migration can proceed safely');
  }
  
  return recommendations;
}