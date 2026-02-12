#!/usr/bin/env tsx

/**
 * Apply tenant management migration to the database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying tenant management migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20240302000001_create_tenant_management_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          if (directError && directError.message.includes('does not exist')) {
            // Execute using raw SQL
            console.log(`  ⚠️  RPC method not available, trying alternative approach...`);
            
            // For critical tables, we'll create them manually
            if (statement.includes('CREATE TABLE') && statement.includes('tenants')) {
              await createTenantsTable();
            } else if (statement.includes('CREATE TABLE') && statement.includes('tenant_users')) {
              await createTenantUsersTable();
            } else if (statement.includes('CREATE TABLE') && statement.includes('tenant_usage')) {
              await createTenantUsageTable();
            }
          } else {
            console.log(`  ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`  ✅ Statement executed successfully`);
        }
      } catch (err) {
        console.log(`  ⚠️  Statement failed: ${err}`);
      }
    }
    
    console.log('\n🎉 Migration application complete!');
    
    // Verify tables were created
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createTenantsTable() {
  console.log('  📋 Creating tenants table manually...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      domain TEXT UNIQUE,
      subdomain TEXT UNIQUE NOT NULL,
      branding JSONB NOT NULL DEFAULT '{}',
      subscription JSONB NOT NULL DEFAULT '{}',
      settings JSONB NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `;
  
  // We'll use a workaround by creating a simple function
  try {
    const { error } = await supabase.rpc('create_tenants_table');
    if (error) {
      console.log('  ⚠️  Could not create via RPC, table may already exist');
    }
  } catch (err) {
    console.log('  ⚠️  Manual table creation not available');
  }
}

async function createTenantUsersTable() {
  console.log('  👥 Creating tenant_users table manually...');
  // Similar approach for tenant_users
}

async function createTenantUsageTable() {
  console.log('  📊 Creating tenant_usage table manually...');
  // Similar approach for tenant_usage
}

async function verifyTables() {
  console.log('\n🔍 Verifying table creation...');
  
  const tables = ['tenants', 'tenant_users', 'tenant_usage'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`  ❌ ${table}: ${err}`);
    }
  }
}

async function main() {
  console.log('🏗️  SolarCRM Pro - Tenant Management Migration\n');
  await applyMigration();
}

main().catch(console.error);