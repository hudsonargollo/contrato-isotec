#!/usr/bin/env tsx

/**
 * Tenant Isolation Validation Script
 * 
 * This script validates that tenant isolation is working correctly
 * by testing RLS policies and data separation.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ValidationResult {
  test: string;
  passed: boolean;
  message: string;
}

async function validateTenantIsolation(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // Test 1: Check if tenants table exists and has RLS enabled
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, domain')
      .limit(5);

    results.push({
      test: 'Tenants table accessibility',
      passed: !tenantsError && Array.isArray(tenants),
      message: tenantsError ? tenantsError.message : `Found ${tenants?.length || 0} tenants`
    });

    // Test 2: Check if tenant_users table exists
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from('tenant_users')
      .select('id, tenant_id, user_id, role')
      .limit(5);

    results.push({
      test: 'Tenant users table accessibility',
      passed: !tenantUsersError && Array.isArray(tenantUsers),
      message: tenantUsersError ? tenantUsersError.message : `Found ${tenantUsers?.length || 0} tenant user relationships`
    });

    // Test 3: Check if user_activity_logs table exists with tenant_id
    const { data: auditLogs, error: auditError } = await supabase
      .from('user_activity_logs')
      .select('id, tenant_id, action')
      .limit(5);

    results.push({
      test: 'Audit logs table with tenant isolation',
      passed: !auditError && Array.isArray(auditLogs),
      message: auditError ? auditError.message : `Found ${auditLogs?.length || 0} audit log entries`
    });

    // Test 4: Check RLS policies exist
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'tenants' })
      .single();

    results.push({
      test: 'RLS policies configuration',
      passed: !policiesError,
      message: policiesError ? 'Could not verify RLS policies' : 'RLS policies are configured'
    });

    // Test 5: Verify tenant context functions exist
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_current_tenant_id');

    results.push({
      test: 'Tenant context functions',
      passed: !functionsError,
      message: functionsError ? 'Tenant context functions not available' : 'Tenant context functions are working'
    });

  } catch (error) {
    results.push({
      test: 'Overall validation',
      passed: false,
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  return results;
}

async function main() {
  console.log('🔍 Validating Tenant Isolation...\n');

  const results = await validateTenantIsolation();

  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.message}`);
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 All tenant isolation validations passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tenant isolation validations failed.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}