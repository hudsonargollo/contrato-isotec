#!/usr/bin/env tsx

/**
 * Check if tenant management tables exist in the database
 * and apply the migration if needed
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTenantTables() {
  console.log('🔍 Checking tenant management tables...');
  
  try {
    // Check if tenants table exists
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (tenantsError) {
      console.log('❌ Tenants table does not exist:', tenantsError.message);
      return false;
    }
    
    // Check if tenant_users table exists
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from('tenant_users')
      .select('id')
      .limit(1);
    
    if (tenantUsersError) {
      console.log('❌ Tenant_users table does not exist:', tenantUsersError.message);
      return false;
    }
    
    console.log('✅ Tenant management tables exist');
    console.log(`📊 Found ${tenants?.length || 0} tenants`);
    console.log(`👥 Found ${tenantUsers?.length || 0} tenant users`);
    
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return false;
  }
}

async function listExistingTables() {
  console.log('\n📋 Listing existing tables...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_table_names');
    
    if (error) {
      // Fallback: try to query information_schema
      const { data: tables, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.log('❌ Could not list tables:', schemaError.message);
        return;
      }
      
      console.log('📋 Public tables:');
      tables?.forEach(table => console.log(`  - ${table.table_name}`));
    } else {
      console.log('📋 Tables:', data);
    }
  } catch (error) {
    console.log('❌ Error listing tables:', error);
  }
}

async function checkProfiles() {
  console.log('\n👤 Checking profiles table...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(5);
    
    if (error) {
      console.log('❌ Profiles table error:', error.message);
      return;
    }
    
    console.log('✅ Profiles table exists');
    console.log(`👥 Found ${data?.length || 0} profiles`);
    data?.forEach(profile => {
      console.log(`  - ${profile.id}: ${profile.role || 'no role'}`);
    });
  } catch (error) {
    console.error('❌ Error checking profiles:', error);
  }
}

async function main() {
  console.log('🚀 SolarCRM Pro - Database Table Check\n');
  
  const tablesExist = await checkTenantTables();
  
  if (!tablesExist) {
    console.log('\n⚠️  Tenant management tables are missing!');
    console.log('📝 You need to apply the tenant management migration:');
    console.log('   supabase/migrations/20240302000001_create_tenant_management_system.sql');
    console.log('\n💡 Run this command to apply the migration:');
    console.log('   npm run migrate:tenant');
  }
  
  await listExistingTables();
  await checkProfiles();
  
  console.log('\n✨ Database check complete!');
}

main().catch(console.error);